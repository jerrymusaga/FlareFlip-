// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IFlareFlip {
    
    
    // Base functions
    function stake() external payable;
    function unstake(uint256 _amount) external;
    
    // Pool management
    function createPool(uint _entryFee, uint _maxParticipants, string memory _assetSymbol) external;
    function joinPool(uint _poolId) external payable;
    
    // Game logic
    function makeSelection(uint _poolId, uint8 _choice) external;
    
    // Views
    function getPoolInfo(uint _poolId) external view returns (
        uint poolId,
        uint entryFee,
        uint maxParticipants,
        uint currentParticipants,
        uint prizePool,
        uint8 status,
        address creator
    );

    function addSupportedAsset(
        uint8 _category,
        string memory _categoryName,
        string memory _symbol,
        bytes21 _feedId
    ) external;
}