// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipBase.sol";
import "./FlareFlip/FlareFlipPoolManagement.sol";
import "./FlareFlip/FlareFlipGameLogic.sol";
import "./FlareFlip/FlareFlipPrizeDistribution.sol";
import "./FlareFlip/FlareFlipViews.sol";

contract FlareFlip is 
    FlareFlipBase,
    FlareFlipPoolManagement,
    FlareFlipGameLogic,
    FlareFlipPrizeDistribution,
    FlareFlipViews
{
    
}