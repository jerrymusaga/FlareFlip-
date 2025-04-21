// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../FlareFlipBase.sol";
import "../libraries/DataStructures.sol";
import "../libraries/PriceFeedLibrary.sol";

abstract contract FlareFlipPoolManagement is FlareFlipBase {
    using PriceFeedLibrary for MarketData;
    
    uint public poolCount;
    
    struct Pool {
        string assetSymbol;
        bytes21 feedId;
        uint entryFee;
        uint maxParticipants;
        uint currentParticipants;
        uint prizePool;
        PoolStatus status;
        address creator;
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
    
    mapping(uint => Pool) public pools;
    mapping(string => mapping(string => bytes21)) public categoryNameToFeedId;
    mapping(bytes21 => uint8) public feedCategories;
    mapping(uint8 => string[]) public categorizedAssets;
    mapping(uint8 => string) public categoryNames;
    mapping(uint8 => bool) public isCategoryRegistered;
    uint8[] public supportedCategories;
    mapping(bytes21 => uint256) public feedFees;
    string[] public supportedAssets;
    
    event PoolCreated(uint poolId, uint entryFee, uint maxParticipants, string assetSymbol, address creator);
    event PlayerJoined(uint poolId, address player);
    event PoolActivated(uint poolId);
    event AssetAdded(uint8 categoryId, string categoryName, string symbol, bytes21 feedId);
    event AssetRemoved(string symbol, uint8 categoryId);
    event CategoryAdded(uint8 categoryId, string categoryName);
    
    modifier poolExists(uint _poolId) {
        require(_poolId < poolCount, "Pool does not exist");
        _;
    }
    
    modifier onlyStaker() {
        require(stakers[msg.sender].stakedAmount >= MINIMUM_STAKE, "Not a staker or insufficient stake");
        _;
    }

    modifier poolActive(uint _poolId) {
        require(pools[_poolId].status == PoolStatus.ACTIVE, "Pool inactive");
        _;
    }
    
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
        // Initialize market data using library
        PriceFeedLibrary.initializeMarketData(
            poolMarketData[poolId], 
            assetToFeedId[_assetSymbol],
            ftsoV2,
            feeCalculator,
            feedFees
        );
        
        
        // require(address(this).balance >= feePaid, "Insufficient balance for feed fee");

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
        
        stakerInfo.activePoolsCount++;
        
        poolTradingPairs[poolId] = TradingPair({
            baseAsset: _assetSymbol,
            quoteAsset: "USD"
        });
        
        poolMarketData[poolId] = MarketData({
            startPrice: 0,
            lastPrice: 0,
            startTimestamp: 0,
            lastUpdated: 0,
            priceDecimals: 18
        });
        
        emit PoolCreated(poolId, _entryFee, _maxParticipants, _assetSymbol, msg.sender);
    }
    
   
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
            poolMarketData[_poolId].initializeMarketData(
                pool.feedId,
                ftsoV2,
                feeCalculator,
                feedFees
                );
            emit PoolActivated(_poolId);
        }

        emit PlayerJoined(_poolId, msg.sender);
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

     
}