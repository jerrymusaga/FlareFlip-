// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

enum PlayerChoice {
    NONE,
    HEADS,
    TAILS
}

enum PoolStatus {
    OPENED,
    ACTIVE,
    CLOSED
}

struct TradingPair {
    string baseAsset;
    string quoteAsset;
}

struct MarketData {
    uint256 startPrice;
    uint256 lastPrice;
    uint256 startTimestamp;
    uint256 lastUpdated;
    uint256 priceDecimals;
}

struct Player {
    address playerAddress;
    PlayerChoice choice;
    bool isEliminated;
    bool hasClaimed;
}

struct PoolInfo {
    uint poolId;
    uint entryFee;
    uint maxParticipants;
    uint currentParticipants;
    uint prizePool;
    PoolStatus status;
    MarketData marketData;
    address creator;
}

struct StakerInfo {
    uint256 stakedAmount;
    uint256 activePoolsCount;
    uint256 totalRewards;
    uint256 lastStakeTimestamp;
}

struct PoolDetails {
    uint entryFee;
    uint maxParticipants;
    uint currentParticipants;
    uint prizePool;
    PoolStatus status;
    address creator;
    string assetSymbol;
    uint startPrice;
    uint currentPrice;
    uint priceUpdated;
    uint roundDeadline;
    bool priceInitialized;
}

