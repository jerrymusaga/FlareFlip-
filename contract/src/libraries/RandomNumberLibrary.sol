// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// import {RandomNumberV2Interface} from "../interfaces/RandomNumberV2Interface.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";

library RandomNumberLibrary {
    function getRandomNumber(
        RandomNumberV2Interface randomNumberV2,
        uint _poolId,
        uint _round,
        mapping(uint => mapping(uint => uint256)) storage roundRandomNumbers
    ) external returns (uint256) {
        if (roundRandomNumbers[_poolId][_round] != 0) {
            return roundRandomNumbers[_poolId][_round];
        }
        
        (uint256 randomNumber, , ) = randomNumberV2.getRandomNumber();
        require(randomNumber != 0, "Failed to get random number");
        roundRandomNumbers[_poolId][_round] = randomNumber;
        
        return randomNumber;
    }
}