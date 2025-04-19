// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipGameLogic.sol";

abstract contract FlareFlipPrizeDistribution is FlareFlipGameLogic {
    event PrizeClaimed(uint poolId, address winner, uint amount);
    event CreatorRewardPaid(uint poolId, address creator, uint amount);
    
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
        
        uint256 totalPrize = pool.prizePool;
        uint256 creatorFee = (totalPrize * creatorFeePercentage) / 10000;
        uint256 winnersPrize = totalPrize - creatorFee;
        uint256 prizePerWinner = winnersPrize / pool.finalWinners.length;
        
        address creator = pool.creator;
        if (creatorFee > 0) {
            StakerInfo storage stakerInfo = stakers[creator];
            stakerInfo.totalRewards += creatorFee;
            
            (bool creatorSuccess,) = payable(creator).call{value: creatorFee}("");
            require(creatorSuccess, "Creator fee transfer failed");
            
            emit CreatorRewardPaid(_poolId, creator, creatorFee);
        }
        
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
        
        (bool success, ) = payable(msg.sender).call{value: prizePerWinner}("");
        require(success, "Prize transfer failed");
        
        emit PrizeClaimed(_poolId, msg.sender, prizePerWinner);
    }
}