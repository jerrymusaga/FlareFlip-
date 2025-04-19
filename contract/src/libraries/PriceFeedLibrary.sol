// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// import {FtsoV2Interface} from "../interfaces/FtsoV2Interface.sol";
// import {IFeeCalculator} from "../interfaces/IFeeCalculator.sol";
import {FtsoV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/FtsoV2Interface.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
import "./DataStructures.sol";

library PriceFeedLibrary {
    function initializeMarketData(
        MarketData storage data,
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        IFeeCalculator feeCalculator,
        mapping(bytes21 => uint256) storage feedFees
    ) external {
        bytes21[] memory feedIds = new bytes21[](1);
        feedIds[0] = feedId;
        feedFees[feedId] = feeCalculator.calculateFeeByIds(feedIds);
        
        (uint256 price, int8 decimals, ) = ftsoV2.getFeedById{value: feedFees[feedId]}(feedId);
        
        data.startPrice = price;
        data.lastPrice = price;
        data.startTimestamp = block.timestamp;
        data.lastUpdated = block.timestamp;
        data.priceDecimals = uint256(uint8(decimals));
    }

    function updatePrice(
        MarketData storage data,
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        uint256 feedFee
    ) external returns (uint256 currentPrice) {
        (currentPrice, , ) = ftsoV2.getFeedById{value: feedFee}(feedId);
        
        if (data.startPrice == 0) {
            data.startPrice = currentPrice;
        }
        
        data.lastPrice = currentPrice;
        data.lastUpdated = block.timestamp;
    }
}