// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipPrizeDistribution.sol";

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
}