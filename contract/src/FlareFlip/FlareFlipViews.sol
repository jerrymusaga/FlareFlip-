// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipPrizeDistribution.sol";
import "../libraries/DataStructures.sol";

abstract contract FlareFlipViews is FlareFlipPrizeDistribution {
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
    
    function getPlayerPools(address _player) external view returns (uint[] memory) {
        return userPools[_player];
    }
    
    function getStakerInfo(address _staker) external view returns (StakerInfo memory) {
        return stakers[_staker];
    }
    
    function getPoolWinners(uint _poolId) external view poolExists(_poolId) returns (address[] memory) {
        return pools[_poolId].finalWinners;
    }
    
    function getAllSupportedAssets() external view returns (string[] memory) {
        return supportedAssets;
    }
    
    function getAssetsByCategory(uint8 _category) external view returns (string[] memory) {
        return categorizedAssets[_category];
    }
    
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
    
    function getFeedIdByCategoryAndName(string memory _categoryName, string memory _assetName) 
        external view returns (bytes21) {
        return categoryNameToFeedId[_categoryName][_assetName];
    }

   /**
     * @dev Returns pool details with accurate price timing info
     * @notice startPrice is only valid after pool becomes ACTIVE
     */
    function getPoolDetails(uint _poolId) external view returns (PoolDetails memory) {
        Pool storage pool = pools[_poolId];
        MarketData storage marketData = poolMarketData[_poolId];
        bool isActive = pool.status == PoolStatus.ACTIVE;
        
        return PoolDetails(
            pool.entryFee,
            pool.maxParticipants,
            pool.currentParticipants,
            pool.prizePool,
            pool.status,
            pool.creator,
            pool.assetSymbol,
            marketData.startPrice,
            isActive ? marketData.lastPrice : 0,
            marketData.lastUpdated,
            isActive ? marketData.startTimestamp + 5 minutes : 0,
            isActive && marketData.startPrice > 0
        );
    }

    // Get player's statistics across all pools
    function getPlayerStats(address _player) external view returns (
        uint totalPools,
        uint activePools,
        uint wins,
        uint totalEarnings,
        uint totalStaked
    ) {
        uint[] memory playerPools = userPools[_player];
        totalPools = playerPools.length;
        totalStaked = stakers[_player].stakedAmount;
        
        for (uint i = 0; i < playerPools.length; i++) {
            Pool storage pool = pools[playerPools[i]];
            
            if (pool.status == PoolStatus.ACTIVE) {
                activePools++;
            }
            
            for (uint j = 0; j < pool.finalWinners.length; j++) {
                if (pool.finalWinners[j] == _player) {
                    wins++;
                    totalEarnings += pool.prizePool / pool.finalWinners.length;
                }
            }
        }
    }

    // Get current market data for a pool
    function getPoolMarketData(uint _poolId) external view poolExists(_poolId) returns (
        uint startPrice,
        uint lastPrice,
        uint lastUpdated,
        string memory baseAsset,
        string memory quoteAsset
    ) {
        MarketData storage data = poolMarketData[_poolId];
        TradingPair storage pair = poolTradingPairs[_poolId];
        
        return (
            data.startPrice,
            data.lastPrice,
            data.lastUpdated,
            pair.baseAsset,
            pair.quoteAsset
        );
    }

    function canJoinPool(uint _poolId, address _player) external view returns (bool) {
        Pool storage pool = pools[_poolId];
        return (
            pool.status == PoolStatus.OPENED &&
            pool.players[_player].playerAddress == address(0) &&
            pool.currentParticipants < pool.maxParticipants &&
            pool.creator != _player
        );
    }

    /**
     * @dev Returns basic current round info without exposing vote counts
     * @param _poolId The ID of the pool
     * @return roundNumber Current round number (1-indexed)
     * @return isRoundCompleted Whether voting has concluded
     * @return winningChoice Winning selection if round is over (NONE if ongoing)
     * @return deadline Estimated deadline for the round (timestamp)
     */
    function getCurrentRound(uint _poolId) external view poolExists(_poolId) returns (
        uint roundNumber,
        bool isRoundCompleted,
        PlayerChoice winningChoice,
        uint deadline
    ) {
        Pool storage pool = pools[_poolId];
        MarketData storage marketData = poolMarketData[_poolId];
        
        roundNumber = pool.currentRound;
        isRoundCompleted = pool.roundCompleted[roundNumber];
        
        // Only reveal winning choice after round ends
        winningChoice = PlayerChoice.NONE;
        if (isRoundCompleted && pool.roundWinners[roundNumber].length > 0) {
            winningChoice = pool.roundSelection[roundNumber][pool.roundWinners[roundNumber][0]];
        }
        
        // Estimate deadline (round start + 5 minutes)
        deadline = marketData.startTimestamp + 5 minutes;
        
        return (
            roundNumber,
            isRoundCompleted,
            winningChoice,
            isRoundCompleted ? 0 : deadline // Return 0 if round already ended
        );
    }

    function getRoundResults(uint _poolId, uint _round) external view returns (
        address[] memory winners,
        address[] memory losers
    ) {
        require(pools[_poolId].roundCompleted[_round], "Round not ended");
        return (
            pools[_poolId].roundWinners[_round],
            pools[_poolId].roundLosers[_round]
        );
    }

}