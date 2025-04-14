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
 * @dev A "Heads or Tails" game contract built on Flare Network
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
    }

    // State variables
    uint public poolCount;
    mapping(uint => Pool) public pools;
    mapping(uint => TradingPair) public poolTradingPairs;
    mapping(uint => MarketData) public poolMarketData;
    mapping(uint => mapping(uint => uint256)) public roundRandomNumbers;
    mapping(address => uint[]) public userPools;
    
    mapping(bytes21 => uint256) public feedFees; // Track fees per feed ID
    FtsoV2Interface public ftsoV2;
    IFeeCalculator public feeCalculator;
    RandomNumberV2Interface public randomNumberV2;

    // Events 
    event PoolCreated(uint poolId, uint entryFee, uint maxParticipants, string assetSymbol);
    event PlayerJoined(uint poolId, address player);
    event PoolActivated(uint poolId);
    event RoundCompleted(uint poolId, uint round, PlayerChoice winningChoice);
    event RoundWinners(uint poolId, uint round, address[] winners);
    event RoundLosers(uint poolId, uint round, address[] losers);
    event PoolCompleted(uint poolId, uint prizePool);
    event TieBrokenByHybrid(uint poolId, uint round, uint256 startPrice, uint256 lastPrice, uint256 randomValue, PlayerChoice winningSelection);
    event PrizeClaimed(uint poolId, address winner, uint amount);

    modifier poolExists(uint _poolId) {
        require(_poolId < poolCount, "Pool does not exist");
        _;
    }

    constructor(address _ftsoV2, address _feeCalculator, address _randomNumberV2) Ownable(msg.sender) {
        ftsoV2 = FtsoV2Interface(_ftsoV2);
        feeCalculator = IFeeCalculator(_feeCalculator);
        randomNumberV2 = RandomNumberV2Interface(_randomNumberV2);
        poolCount = 0;
    }

    /**
     * @dev Create a new pool with specified parameters
     * @param _entryFee Entry fee for the pool in flare token
     * @param _maxParticipants Maximum number of participants
     * @param _assetSymbol Symbol of the asset to track (e.g., "BTC")
     * @param _feedId FTSO feed ID for the asset
     */
    function createPool(
        uint _entryFee,
        uint _maxParticipants,
        string memory _assetSymbol,
        bytes21 _feedId
    ) external onlyOwner {
        require(_entryFee > 0, "Entry fee must be > 0");
        require(bytes(_assetSymbol).length > 0, "Asset symbol required");
        require(_feedId != bytes21(0), "Invalid feed ID");

        uint poolId = poolCount++;
        
        Pool storage newPool = pools[poolId];
        newPool.entryFee = _entryFee;
        newPool.maxParticipants = _maxParticipants;
        newPool.assetSymbol = _assetSymbol;
        newPool.feedId = _feedId;
        newPool.currentParticipants = 0;
        newPool.prizePool = 0;
        newPool.status = PoolStatus.OPENED;
        newPool.currentRound = 1;
        newPool.maxWinners = _maxParticipants <= 10 ? (_maxParticipants > 1 ? 2 : 1) : 3;
        newPool.currentActiveParticipants = 0;
        newPool.prizeClaimed = false;

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

        emit PoolCreated(poolId, _entryFee, _maxParticipants, _assetSymbol);
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
     * @dev Resolve a tie by using market data and random number
     * @param _poolId ID of the pool
     * @param _round Current round number
     * @return The winning selection
     */
    function _resolveTie(uint _poolId, uint _round) internal returns (PlayerChoice) {
        updateMarketPrice(_poolId);
        uint256 randomValue = getFlareRandomNumber(_poolId, _round);
        
        MarketData storage marketData = poolMarketData[_poolId];
        bool priceIncreased = (marketData.lastPrice > marketData.startPrice);
        
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
            marketData.startPrice, 
            marketData.lastPrice, 
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

        (uint256 currentPrice, , uint64 timestamp) = _getCurrentPrice(pool.feedId);

        MarketData storage data = poolMarketData[_poolId];
        
        if (data.startPrice == 0) {
            data.startPrice = currentPrice;
        }
        
        data.lastPrice = currentPrice;
        data.lastUpdated = block.timestamp;
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
        
        uint prizeAmount = pool.prizePool / pool.finalWinners.length;
        
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
        
        (bool success, ) = payable(msg.sender).call{value: prizeAmount}("");
        require(success, "Transfer failed");
        
        emit PrizeClaimed(_poolId, msg.sender, prizeAmount);
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
            marketData: poolMarketData[_poolId]
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
     * @dev Withdraw funds in case of emergency
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Transfer failed");
    }
}