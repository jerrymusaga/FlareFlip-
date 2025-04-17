// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ContractRegistry} from "dependencies/flare-periphery-0.0.22/src/coston2/ContractRegistry.sol";
import {FtsoV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/FtsoV2Interface.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
import {Strings} from "@openzeppelin-contracts/utils/Strings.sol";
import "@openzeppelin-contracts/access/Ownable.sol";
import "./errors/Errors.sol";
import "./events/Events.sol";

/**
 * @title FlareFlip
 * @dev A "Heads or Tails" game contract built on Flare Network with staking mechanism
 */
contract FlareFlip is Ownable {
    enum PlayerChoice {
        NONE,
        HEADS,
        TAILS
    }

    enum PoolStatus {
        OPENED,
        ACTIVE,
        CLOSED
    }

    struct TradingPair {
        string baseAsset;    // e.g., "BTC", "ETH"
        string quoteAsset;   // e.g., "USD"
    }

    struct MarketData {
        uint256 startPrice;      // Price when round started (in USD with 18 decimals)
        uint256 lastPrice;       // Latest price from FTSO
        uint256 startTimestamp;  // When the round started
        uint256 lastUpdated;     // When last price was updated
        uint256 priceDecimals;   // Decimals for this asset (usually 18)
    }

    struct Player {
        address playerAddress;
        PlayerChoice choice;
        bool isEliminated;
        bool hasClaimed;
    }

    struct Pool {
        string assetSymbol;  // e.g. "BTC", "ETH", "XAU"
        bytes21 feedId;      // FTSO feed ID for this asset
        uint entryFee;
        uint maxParticipants;
        uint currentParticipants;
        uint prizePool;
        PoolStatus status;
        address creator;     // Address of the staker who created this pool
        mapping(address => Player) players;
        uint currentRound;
        address[] playersInPool;
        mapping(uint => mapping(address => bool)) roundParticipation;
        mapping(uint => mapping(address => PlayerChoice)) roundSelection;
        mapping(uint => uint) headsCount;
        mapping(uint => uint) tailsCount;
        mapping(uint256 => bool) roundCompleted;
        uint maxWinners;
        uint currentActiveParticipants;
        mapping(uint => address[]) roundWinners;
        mapping(uint => address[]) roundLosers;
        address[] finalWinners;
        bool prizeClaimed;
    }

    struct PoolInfo {
        uint poolId;
        uint entryFee;
        uint maxParticipants;
        uint currentParticipants;
        uint prizePool;
        PoolStatus status;
        MarketData marketData;
        address creator;
    }

    struct StakerInfo {
        uint256 stakedAmount;
        uint256 activePoolsCount;
        uint256 totalRewards;
        uint256 lastStakeTimestamp;
    }

    // Staking related variables
    uint256 public constant MINIMUM_STAKE = 100 ether; // 100 FLR tokens
    uint256 public constant MAX_POOLS_PER_STAKER = 3;
    uint256 public creatorFeePercentage = 500; // 5% (in basis points)
    uint256 public minimumStakingPeriod = 7 days;
    mapping(address => StakerInfo) public stakers;

    // Asset to feed ID mapping
    mapping(string => bytes21) public assetToFeedId;
    string[] public supportedAssets;
    mapping(string => bool) public isAssetSupported;

    // State variables
    uint public poolCount;
    mapping(uint => Pool) public pools;
    mapping(uint => TradingPair) public poolTradingPairs;
    mapping(uint => MarketData) public poolMarketData;
    mapping(uint => mapping(uint => uint256)) public roundRandomNumbers;
    mapping(address => uint[]) public userPools;

    // state variables for category tracking from flare IFtsoFeedIdConverter
    mapping(string => mapping(string => bytes21)) public categoryNameToFeedId;
    mapping(bytes21 => uint8) public feedCategories;
    mapping(uint8 => string[]) public categorizedAssets;
    mapping(uint8 => string) public categoryNames;
    mapping(uint8 => bool) public isCategoryRegistered;
    uint8[] public supportedCategories;
    
    mapping(bytes21 => uint256) public feedFees; // Track fees per feed ID
    FtsoV2Interface public ftsoV2;
    IFeeCalculator public feeCalculator;
    RandomNumberV2Interface public randomNumberV2;



    // Events 
    event PoolCreated(uint poolId, uint entryFee, uint maxParticipants, string assetSymbol, address creator);
    event PlayerJoined(uint poolId, address player);
    event PoolActivated(uint poolId);
    event RoundCompleted(uint poolId, uint round, PlayerChoice winningChoice);
    event RoundWinners(uint poolId, uint round, address[] winners);
    event RoundLosers(uint poolId, uint round, address[] losers);
    event PoolCompleted(uint poolId, uint prizePool);
    event TieBrokenByHybrid(uint poolId, uint round, uint256 startPrice, uint256 lastPrice, uint256 randomValue, PlayerChoice winningSelection);
    event PrizeClaimed(uint poolId, address winner, uint amount);
    event CreatorRewardPaid(uint poolId, address creator, uint amount);
    event Staked(address staker, uint256 amount);
    event Unstaked(address staker, uint256 amount);
    event AssetAdded(string symbol, bytes21 feedId);
    event AssetRemoved(string symbol);
    event CreatorFeePercentageUpdated(uint256 newPercentage);
    event AssetAdded(uint8 categoryId, string categoryName, string symbol, bytes21 feedId);
    event AssetRemoved(string symbol, uint8 categoryId);
    event CategoryAdded(uint8 categoryId, string categoryName);
    event MarketPriceUpdated(uint poolId, uint256 price, uint256 timestamp);

    modifier poolExists(uint _poolId) {
        require(_poolId < poolCount, "Pool does not exist");
        _;
    }

    modifier onlyStaker() {
        require(stakers[msg.sender].stakedAmount >= MINIMUM_STAKE, "Not a staker or insufficient stake");
        _;
    }

    constructor(address _ftsoV2, address _feeCalculator, address _randomNumberV2) Ownable(msg.sender) {
        ftsoV2 = FtsoV2Interface(_ftsoV2);
        feeCalculator = IFeeCalculator(_feeCalculator);
        randomNumberV2 = RandomNumberV2Interface(_randomNumberV2);
        poolCount = 0;
    }

    /**
     * @dev Stake FLR tokens to become eligible for pool creation
     */
    function stake() external payable {
        require(msg.value >= MINIMUM_STAKE, "Stake amount below minimum");
        
        StakerInfo storage stakerInfo = stakers[msg.sender];
        stakerInfo.stakedAmount += msg.value;
        stakerInfo.lastStakeTimestamp = block.timestamp;
        
        emit Staked(msg.sender, msg.value);
    }

    /**
     * @dev Unstake FLR tokens if the minimum staking period has passed
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _amount) external {
        StakerInfo storage stakerInfo = stakers[msg.sender];
        require(stakerInfo.stakedAmount >= _amount, "Insufficient staked amount");
        require(block.timestamp >= stakerInfo.lastStakeTimestamp + minimumStakingPeriod, "Minimum staking period not met");
        require(stakerInfo.activePoolsCount == 0, "Cannot unstake with active pools");
        
        stakerInfo.stakedAmount -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @dev Add a supported asset (admin only)
     * @param _category Asset category (e.g., 1 for crypto, 2 for commodities, 3 for forex)
     * @param _categoryName Human-readable category name
     * @param _symbol Asset symbol (e.g., "FLR")
     * @param _feedId Flare FTSO feed ID
     */
    function addSupportedAsset(
        uint8 _category,
        string memory _categoryName,
        string memory _symbol,
        bytes21 _feedId
    ) external onlyOwner {
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(bytes(_categoryName).length > 0, "Category name cannot be empty");
        require(_feedId != bytes21(0), "Invalid feed ID");
        require(!isAssetSupported[_symbol], "Asset already supported");
        
        // Store the relationship between category, name and feed ID
        categoryNameToFeedId[_categoryName][_symbol] = _feedId;
        assetToFeedId[_symbol] = _feedId;
        feedCategories[_feedId] = _category;
        
        // Track assets by category
        if (!isCategoryRegistered[_category]) {
            categoryNames[_category] = _categoryName;
            isCategoryRegistered[_category] = true;
            supportedCategories.push(_category);
        }
        
        categorizedAssets[_category].push(_symbol);
        supportedAssets.push(_symbol);
        isAssetSupported[_symbol] = true;
        
        emit AssetAdded(_category, _categoryName, _symbol, _feedId);
    }

    /**
     * @dev Remove a supported asset (admin only)
     * @param _symbol Asset symbol to remove
     */
    function removeSupportedAsset(string memory _symbol) external onlyOwner {
        require(isAssetSupported[_symbol], "Asset not supported");
        
        bytes21 feedId = assetToFeedId[_symbol];
        uint8 category = feedCategories[feedId];
        
        // Remove from category mapping
        string[] storage assetsInCategory = categorizedAssets[category];
        for (uint i = 0; i < assetsInCategory.length; i++) {
            if (keccak256(abi.encodePacked(assetsInCategory[i])) == keccak256(abi.encodePacked(_symbol))) {
                // Replace with last element and pop
                assetsInCategory[i] = assetsInCategory[assetsInCategory.length - 1];
                assetsInCategory.pop();
                break;
            }
        }
        
        // Remove from main arrays and mappings
        isAssetSupported[_symbol] = false;
        assetToFeedId[_symbol] = bytes21(0);
        
        // Remove from supportedAssets array
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (keccak256(abi.encodePacked(supportedAssets[i])) == keccak256(abi.encodePacked(_symbol))) {
                supportedAssets[i] = supportedAssets[supportedAssets.length - 1];
                supportedAssets.pop();
                break;
            }
        }
        
        // Check if this was the last asset in this category
        if (assetsInCategory.length == 0) {
            // Remove the category if no assets remain
            isCategoryRegistered[category] = false;
            delete categoryNames[category];
            
            // Remove from supportedCategories array
            for (uint i = 0; i < supportedCategories.length; i++) {
                if (supportedCategories[i] == category) {
                    supportedCategories[i] = supportedCategories[supportedCategories.length - 1];
                    supportedCategories.pop();
                    break;
                }
            }
        }
        
        emit AssetRemoved(_symbol, category);
    }

    /**
     * @dev Get all supported assets
     * @return Array of supported asset symbols
     */
    function getAllSupportedAssets() external view returns (string[] memory) {
        return supportedAssets;
    }

    /**
 * @dev Get all assets for a specific category
 * @param _category The category ID
 * @return Array of asset symbols in the category
 */
function getAssetsByCategory(uint8 _category) external view returns (string[] memory) {
    return categorizedAssets[_category];
}

    /**
     * @dev Get all supported categories
     * @return categoryIds Array of category IDs
     * @return _categoryNames Array of category names
     */
    function getAllCategories() external view returns (uint8[] memory categoryIds, string[] memory _categoryNames) {
        categoryIds = new uint8[](supportedCategories.length);
        _categoryNames = new string[](supportedCategories.length);
        
        for (uint i = 0; i < supportedCategories.length; i++) {
            uint8 catId = supportedCategories[i];
            categoryIds[i] = catId;
            _categoryNames[i] = categoryNames[catId];
        }
        
        return (categoryIds, _categoryNames);
    }

    /**
     * @dev Get feed ID by category and asset name
     * @param _categoryName Category name
     * @param _assetName Asset name
     * @return feedId The FTSO feed ID
     */
    function getFeedIdByCategoryAndName(string memory _categoryName, string memory _assetName) 
        external view returns (bytes21) {
        return categoryNameToFeedId[_categoryName][_assetName];
    }

    /**
     * @dev Set creator fee percentage (admin only)
     * @param _percentage New percentage (in basis points, e.g. 500 = 5%)
     */
    function setCreatorFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 2000, "Fee percentage too high"); // Max 20%
        creatorFeePercentage = _percentage;
        emit CreatorFeePercentageUpdated(_percentage);
    }

    /**
     * @dev Create a new pool with specified parameters (staker only)
     * @param _entryFee Entry fee for the pool in flare token
     * @param _maxParticipants Maximum number of participants
     * @param _assetSymbol Symbol of the asset to track (e.g., "BTC")
     */
    function createPool(
        uint _entryFee,
        uint _maxParticipants,
        string memory _assetSymbol
    ) external onlyStaker {
        require(_entryFee > 0, "Entry fee must be > 0");
        require(_maxParticipants > 1, "Need at least 2 participants");
        require(isAssetSupported[_assetSymbol], "Asset not supported");
        
        StakerInfo storage stakerInfo = stakers[msg.sender];
        require(stakerInfo.activePoolsCount < MAX_POOLS_PER_STAKER, "Max pools per staker reached");
        
        bytes21 feedId = assetToFeedId[_assetSymbol];
        require(feedId != bytes21(0), "Invalid feed ID");
        
        uint poolId = poolCount++;
        
        Pool storage newPool = pools[poolId];
        newPool.entryFee = _entryFee;
        newPool.maxParticipants = _maxParticipants;
        newPool.assetSymbol = _assetSymbol;
        newPool.feedId = feedId;
        newPool.currentParticipants = 0;
        newPool.prizePool = 0;
        newPool.status = PoolStatus.OPENED;
        newPool.creator = msg.sender;
        newPool.currentRound = 1;
        newPool.maxWinners = _maxParticipants <= 10 ? (_maxParticipants > 1 ? 2 : 1) : 3;
        newPool.currentActiveParticipants = 0;
        newPool.prizeClaimed = false;

        // Increment active pools count for staker
        stakerInfo.activePoolsCount++;

        // Set trading pair for the pool
        poolTradingPairs[poolId] = TradingPair({
            baseAsset: _assetSymbol,
            quoteAsset: "USD"
        });
        
        // Initialize empty market data
        poolMarketData[poolId] = MarketData({
            startPrice: 0,
            lastPrice: 0,
            startTimestamp: 0,
            lastUpdated: 0,
            priceDecimals: 18
        });

        emit PoolCreated(poolId, _entryFee, _maxParticipants, _assetSymbol, msg.sender);
    }

    /**
     * @dev Join a pool by paying the entry fee
     * @param _poolId ID of the pool to join
     */
    function joinPool(uint _poolId) external payable poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.OPENED, "Pool not open");
        require(msg.value >= pool.entryFee, "Insufficient fee");
        require(pool.currentParticipants < pool.maxParticipants, "Pool full");
        require(pool.players[msg.sender].playerAddress == address(0), "Already joined");
        require(pool.creator != msg.sender, "Creator cannot join own pool");

        Player storage newPlayer = pool.players[msg.sender];
        newPlayer.playerAddress = msg.sender;
        newPlayer.choice = PlayerChoice.NONE;
        newPlayer.isEliminated = false;
        newPlayer.hasClaimed = false;
        
        pool.prizePool += msg.value;
        pool.currentParticipants++;
        pool.playersInPool.push(msg.sender);
        userPools[msg.sender].push(_poolId);

        if (pool.currentParticipants == pool.maxParticipants) {
            pool.status = PoolStatus.ACTIVE;
            pool.currentActiveParticipants = pool.currentParticipants;
            _initializeMarketData(_poolId);
            emit PoolActivated(_poolId);
        }

        emit PlayerJoined(_poolId, msg.sender);
    }

    /**
     * @dev Make a selection (HEADS or TAILS) for the current round
     * @param _poolId ID of the pool
     * @param _choice Player's choice (HEADS or TAILS)
     */
    function makeSelection(uint _poolId, PlayerChoice _choice) external poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        Player storage player = pool.players[msg.sender];

        require(pool.status == PoolStatus.ACTIVE, "Pool inactive");
        require(player.playerAddress != address(0), "Not a player");
        require(_choice == PlayerChoice.HEADS || _choice == PlayerChoice.TAILS, "Invalid choice");
        require(!player.isEliminated, "Player eliminated");
        require(!pool.roundParticipation[pool.currentRound][msg.sender], "Already participated");

        pool.roundParticipation[pool.currentRound][msg.sender] = true;
        pool.roundSelection[pool.currentRound][msg.sender] = _choice; 

        if (_choice == PlayerChoice.HEADS) {
            pool.headsCount[pool.currentRound]++;
        } else if (_choice == PlayerChoice.TAILS) {
            pool.tailsCount[pool.currentRound]++;
        }
        
        _checkRoundCompletion(_poolId);
    }

    /**
     * @dev Check if all active players have made a selection for the current round
     * @param _poolId ID of the pool
     */
    function _checkRoundCompletion(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        uint activeCount = 0;
        uint participatedCount = 0;
        
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            if (!pool.players[playerAddress].isEliminated) {
                activeCount++;
                if (pool.roundParticipation[pool.currentRound][playerAddress]) {
                    participatedCount++;
                }
            }
        }
        
        if (activeCount == participatedCount) {
            _resolveRound(_poolId);
        }
    }

    /**
     * @dev Resolve the current round and determine winners and losers
     * @param _poolId ID of the pool
     */
    function _resolveRound(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        uint currentRound = pool.currentRound;
        
        uint headsCount = pool.headsCount[currentRound];
        uint tailsCount = pool.tailsCount[currentRound];

        PlayerChoice winningSelection;
 
        if(headsCount < tailsCount) {
            winningSelection = PlayerChoice.HEADS;
        } else if (tailsCount < headsCount) {
            winningSelection = PlayerChoice.TAILS;
        } else {
            winningSelection = _resolveTie(_poolId, currentRound);
        }

        _processRoundResults(_poolId, currentRound, winningSelection);
    }

    /**
     * @dev Resolve a tie by using market data and random number from flare's vrf
     * @param _poolId ID of the pool
     * @param _round Current round number
     * @return The winning selection
     */
    function _resolveTie(uint _poolId, uint _round) internal returns (PlayerChoice) {
        // Since _resolveTie is an internal function called by the contract itself,
        // we need to ensure it can still update prices even during cooldown
        Pool storage pool = pools[_poolId];
        MarketData storage data = poolMarketData[_poolId];
        
        // Only fetch new price if it hasn't been updated recently (within last minute)
        if (block.timestamp > data.lastUpdated + 1 minutes) {
            (uint256 currentPrice, , uint64 timestamp) = _getCurrentPrice(pool.feedId);
            
            if (data.startPrice == 0) {
                data.startPrice = currentPrice;
            }
            
            data.lastPrice = currentPrice;
            data.lastUpdated = block.timestamp;
        }
        
        uint256 randomValue = getFlareRandomNumber(_poolId, _round);
        
        bool priceIncreased = (data.lastPrice > data.startPrice);
        
        PlayerChoice winningSelection;
        
        if ((priceIncreased && randomValue % 2 == 0) || 
            (!priceIncreased && randomValue % 2 == 1)) {
            winningSelection = PlayerChoice.HEADS;
        } else {
            winningSelection = PlayerChoice.TAILS;
        }
        
        emit TieBrokenByHybrid(
            _poolId, 
            _round, 
            data.startPrice, 
            data.lastPrice, 
            randomValue,
            winningSelection
        );
        
        return winningSelection;
    }

    /**
     * @dev Process the round results and update player statuses
     * @param _poolId ID of the pool
     * @param _round Current round number
     * @param winningSelection The winning choice
     */
    function _processRoundResults(
        uint _poolId,
        uint _round,
        PlayerChoice winningSelection
    ) internal {
        Pool storage pool = pools[_poolId];
        
        delete pool.roundWinners[_round];
        delete pool.roundLosers[_round];

        uint remainingPlayers = 0;
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            Player storage player = pool.players[playerAddress];

            if (!player.isEliminated && pool.roundParticipation[_round][playerAddress]) {
                if (pool.roundSelection[_round][playerAddress] != winningSelection) {
                    player.isEliminated = true;
                    pool.currentActiveParticipants--;
                    pool.roundLosers[_round].push(playerAddress);
                } else {
                    remainingPlayers++;
                    pool.roundWinners[_round].push(playerAddress);
                }
            }
        }

        pool.roundCompleted[_round] = true;
        emit RoundCompleted(_poolId, _round, winningSelection);
        emit RoundWinners(_poolId, _round, pool.roundWinners[_round]);
        emit RoundLosers(_poolId, _round, pool.roundLosers[_round]);

        if (remainingPlayers <= pool.maxWinners || remainingPlayers <= 1) {
            _finalizePool(_poolId);
        } else {
            pool.currentRound++;
            _initializeRoundMarketData(_poolId);
        }
    }

    /**
     * @dev Finalize the pool and determine winners
     * @param _poolId ID of the pool
     */
    function _finalizePool(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.CLOSED;
        
        delete pool.finalWinners;  // Clear any previous data
        
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            if (!pool.players[playerAddress].isEliminated) {
                pool.finalWinners.push(playerAddress);
            }
        }

        // Decrement active pools count for the creator
        address creator = pool.creator;
        StakerInfo storage stakerInfo = stakers[creator];
        stakerInfo.activePoolsCount--;
        
        emit PoolCompleted(_poolId, pool.prizePool);
    }

    /**
     * @dev Initialize market data for a pool
     * @param _poolId ID of the pool
     */
    function _initializeMarketData(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        bytes21 feedId = pool.feedId;
        
        // Calculate and store fee for this feed
        bytes21[] memory feedIds = new bytes21[](1);
        feedIds[0] = feedId;
        feedFees[feedId] = feeCalculator.calculateFeeByIds(feedIds);
        
        // Get initial price
        (uint256 price, int8 decimals, ) = _getCurrentPrice(feedId);
        
        MarketData storage data = poolMarketData[_poolId];
        data.startPrice = price;
        data.lastPrice = price;
        data.startTimestamp = block.timestamp;
        data.lastUpdated = block.timestamp;
        data.priceDecimals = uint256(uint8(decimals)); // Convert int8 to uint256
    }

    /**
     * @dev Get current price from FTSO with fee handling
     * @param feedId The FTSO feed ID
     */
    function _getCurrentPrice(bytes21 feedId) internal returns (uint256, int8, uint64) {
        uint256 fee = feedFees[feedId];
        require(address(this).balance >= fee, "Insufficient balance for fee");
        
        (uint256 price, int8 decimals, uint64 timestamp) = ftsoV2.getFeedById{value: fee}(feedId);
        
        // Convert price to 18 decimals for consistency
        if (decimals < 18) {
            price = price * (10 ** (18 - uint8(decimals)));
        } else if (decimals > 18) {
            price = price / (10 ** (uint8(decimals) - 18));
        }
        
        return (price, 18, timestamp); // Always return with 18 decimals
    }

    /**
     * @dev Initialize market data for a new round
     * @param _poolId ID of the pool
     */
   function _initializeRoundMarketData(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        bytes21 feedId = pool.feedId;
        
        (uint256 currentPrice, , ) = _getCurrentPrice(feedId);
        
        MarketData storage data = poolMarketData[_poolId];
        data.startPrice = currentPrice;
        data.lastPrice = currentPrice;
        data.lastUpdated = block.timestamp;
    }

    /**
     * @dev Update market price for a pool
     * @param _poolId ID of the pool
     */
    function updateMarketPrice(uint _poolId) public poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.ACTIVE, "Pool not active");
        
        // Only allow the pool creator (staker) or contract owner to update price
        require(msg.sender == pool.creator || msg.sender == owner(), "Not authorized");
        
        MarketData storage data = poolMarketData[_poolId];
        
        // Add cooldown period (5 minutes) to prevent excessive updates
        uint256 updateCooldown = 5 minutes;
        require(block.timestamp >= data.lastUpdated + updateCooldown, "Update cooldown period not met");

        (uint256 currentPrice, , uint64 timestamp) = _getCurrentPrice(pool.feedId);

        if (data.startPrice == 0) {
            data.startPrice = currentPrice;
        }
        
        data.lastPrice = currentPrice;
        data.lastUpdated = block.timestamp;
        
        emit MarketPriceUpdated(_poolId, currentPrice, block.timestamp);
    }

    /**
     * @dev Get a random number from Flare RandomNumberV2
     * @param _poolId ID of the pool
     * @param _round Round number
     * @return Random number
     */
    function getFlareRandomNumber(uint _poolId, uint _round) internal returns (uint256) {
        // Check if we already have a random number for this pool and round
        if (roundRandomNumbers[_poolId][_round] != 0) {
            return roundRandomNumbers[_poolId][_round];
        }
        
        // Get random number from Flare's RandomNumberV2Interface
        (uint256 randomNumber, bool isSecureRandom, uint256 randomTimestamp) = randomNumberV2.getRandomNumber();
        
        // Ensure we got a valid random number
        require(randomNumber != 0, "Failed to get random number");
        
        // Store the random number for future reference
        roundRandomNumbers[_poolId][_round] = randomNumber;
        
        return randomNumber;
    }

    /**
     * @dev Claim prize for winners
     * @param _poolId ID of the pool
     */
    function claimPrize(uint _poolId) external poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.CLOSED, "Pool not closed");
        require(!pool.prizeClaimed, "Prize already claimed");
        
        bool isWinner = false;
        for (uint i = 0; i < pool.finalWinners.length; i++) {
            if (pool.finalWinners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        
        require(isWinner, "Not a winner");
        require(!pool.players[msg.sender].hasClaimed, "Already claimed");
        
        pool.players[msg.sender].hasClaimed = true;
        
        // Calculate creator fee
        uint256 totalPrize = pool.prizePool;
        uint256 creatorFee = (totalPrize * creatorFeePercentage) / 10000;
        uint256 winnersPrize = totalPrize - creatorFee;
        uint256 prizePerWinner = winnersPrize / pool.finalWinners.length;
        
        // Pay creator fee
        address creator = pool.creator;
        if (creatorFee > 0) {
            StakerInfo storage stakerInfo = stakers[creator];
            stakerInfo.totalRewards += creatorFee;
            
            (bool creatorSuccess,) = payable(creator).call{value: creatorFee}("");
            require(creatorSuccess, "Creator fee transfer failed");
            
            emit CreatorRewardPaid(_poolId, creator, creatorFee);
        }
        
        // Check if all winners have claimed
        bool allClaimed = true;
        for (uint i = 0; i < pool.finalWinners.length; i++) {
            if (!pool.players[pool.finalWinners[i]].hasClaimed) {
                allClaimed = false;
                break;
            }
        }
        
        if (allClaimed) {
            pool.prizeClaimed = true;
        }
        
        // Pay winner
        (bool success, ) = payable(msg.sender).call{value: prizePerWinner}("");
        require(success, "Prize transfer failed");
        
        emit PrizeClaimed(_poolId, msg.sender, prizePerWinner);
    }

    /**
     * @dev Get pool information
     * @param _poolId ID of the pool
     * @return Pool information
     */
    function getPoolInfo(uint _poolId) external view poolExists(_poolId) returns (PoolInfo memory) {
        Pool storage pool = pools[_poolId];
        
        return PoolInfo({
            poolId: _poolId,
            entryFee: pool.entryFee,
            maxParticipants: pool.maxParticipants,
            currentParticipants: pool.currentParticipants,
            prizePool: pool.prizePool,
            status: pool.status,
            marketData: poolMarketData[_poolId],
            creator: pool.creator
        });
    }

    /**
     * @dev Get player's pools
     * @param _player Address of the player
     * @return Array of pool IDs
     */
    function getPlayerPools(address _player) external view returns (uint[] memory) {
        return userPools[_player];
    }

    /**
     * @dev Get staker information
     * @param _staker Address of the staker
     * @return Staker information
     */
    function getStakerInfo(address _staker) external view returns (StakerInfo memory) {
        return stakers[_staker];
    }

    /**
     * @dev Get pool winners
     * @param _poolId ID of the pool
     * @return Array of winner addresses
     */
    function getPoolWinners(uint _poolId) external view poolExists(_poolId) returns (address[] memory) {
        return pools[_poolId].finalWinners;
    }

    /**
     * @dev Set random number provider address
     * @param _randomNumberV2 Address of the Flare RandomNumberV2 contract
     */
    function setRandomNumberProvider(address _randomNumberV2) external onlyOwner {
        require(_randomNumberV2 != address(0), "Invalid RandomNumberV2 address");
        randomNumberV2 = RandomNumberV2Interface(_randomNumberV2);
    }

    /**
     * @dev Set minimum staking period
     * @param _period New minimum staking period in seconds
     */
    function setMinimumStakingPeriod(uint256 _period) external onlyOwner {
        minimumStakingPeriod = _period;
    }

   
}