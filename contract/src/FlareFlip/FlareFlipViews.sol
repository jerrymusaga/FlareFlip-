// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipPrizeDistribution.sol";
// import "../libraries/DataStructures.sol";

abstract contract FlareFlipViews is FlareFlipPrizeDistribution {
    
    // function getPoolWinners(uint _poolId) external view poolExists(_poolId) returns (address[] memory) {
    //     return pools[_poolId].finalWinners;
    // }
    

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