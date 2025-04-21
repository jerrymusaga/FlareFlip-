// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// import {FtsoV2Interface} from "../interfaces/FtsoV2Interface.sol";
// import {IFeeCalculator} from "../interfaces/IFeeCalculator.sol";
import {FtsoV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/FtsoV2Interface.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
import "./DataStructures.sol";

library PriceFeedLibrary {
    struct PriceData {
        uint256 price;
        int8 decimals;
        uint64 timestamp;
    }

     function initMarketData(
        MarketData storage data,
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        IFeeCalculator feeCalculator,
        mapping(bytes21 => uint256) storage feedFees
    ) external {
        // Calculate fee
        bytes21[] memory feedIds = new bytes21[](1);
        feedIds[0] = feedId;
        uint256 fee = feeCalculator.calculateFeeByIds(feedIds);
        feedFees[feedId] = fee;

        // Get price
        (uint256 price, int8 decimals,) = ftsoV2.getFeedById{value: fee}(feedId);
        
        // Initialize
        data.startPrice = normalizeDecimals(price, decimals);
        data.lastPrice = data.startPrice;
        data.startTimestamp = block.timestamp;
        data.lastUpdated = block.timestamp;
        data.priceDecimals = 18;
    }

    function initializeMarketData(
        MarketData storage data,
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        IFeeCalculator feeCalculator,
        mapping(bytes21 => uint256) storage feedFees
    ) external {  
        bytes21[] memory feedIds = new bytes21[](1);
        feedIds[0] = feedId;
        uint256 fee = feeCalculator.calculateFeeByIds(feedIds);
        feedFees[feedId] = fee;

        (uint256 price, int8 decimals,) = ftsoV2.getFeedById{value: fee}(feedId);
        
        data.startPrice = normalizeDecimals(price, decimals);
        data.lastPrice = data.startPrice;
        data.startTimestamp = block.timestamp;
        data.lastUpdated = block.timestamp;
        data.priceDecimals = 18;
    }

    function normalizeDecimals(uint256 price, int8 decimals) internal pure returns (uint256) {
        return decimals < 18 ? 
            price * (10 ** (18 - uint8(decimals))) :
            price / (10 ** (uint8(decimals) - 18));
    }

    function getCurrentPrice(
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        uint256 feedFee
    ) external returns (PriceData memory) {
        (uint256 price, int8 decimals, uint64 timestamp) = ftsoV2.getFeedById{value: feedFee}(feedId);
        
        return PriceData(
            normalizeDecimals(price, decimals),
            decimals,  
            timestamp
        );
    }

    
    function updateMarketData(
        MarketData storage data, 
        bytes21 feedId,
        FtsoV2Interface ftsoV2,
        uint256 feedFee
    ) external { 
        (uint256 price, int8 decimals, uint64 timestamp) = ftsoV2.getFeedById{value: feedFee}(feedId);
        
        data.lastPrice = normalizeDecimals(price, decimals);
        data.lastUpdated = timestamp;
    }
    
}