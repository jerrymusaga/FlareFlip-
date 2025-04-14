// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "../main.sol";

library Events {
    event PoolCreated(uint poolId, uint256 entryFee, uint256 maxParticipants);
    event PlayerJoined(uint poolId, address playerThatJoined);
    event PoolActivated(uint indexed poolId);
    event RoundCompleted(uint indexed poolId, uint indexed round, FlareFlip.PlayerChoice indexed winningSelection);
    event PoolCompleted(uint indexed poolId, uint indexed prizePool);
    event RoundWinners(uint poolId, uint round, address[] roundWinners);
    event RoundLosers(uint poolId, uint round, address[] roundWinners);
    event PrizeClaimed(uint poolId, address player, uint prizeAmount);
    event PointsAwarded(address indexed player, uint16 points, uint8 reason);
}