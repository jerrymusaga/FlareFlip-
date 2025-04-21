// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipPoolManagement.sol";
import "../libraries/RandomNumberLibrary.sol";

abstract contract FlareFlipGameLogic is FlareFlipPoolManagement {
    using PriceFeedLibrary for MarketData;
    using PriceFeedLibrary for bytes21;
    using RandomNumberLibrary for RandomNumberV2Interface;
    
    event RoundCompleted(uint poolId, uint round, PlayerChoice winningChoice);
    event RoundWinners(uint poolId, uint round, address[] winners);
    event RoundLosers(uint poolId, uint round, address[] losers);
    event PoolCompleted(uint poolId, uint prizePool);
    event TieBrokenByHybrid(uint poolId, uint round, uint256 startPrice, uint256 lastPrice, uint256 randomValue, PlayerChoice winningSelection);
    event MarketPriceUpdated(uint poolId, uint256 price, uint256 timestamp);
    
    function makeSelection(uint _poolId, PlayerChoice _choice) external poolActive(_poolId) poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        Player storage player = pool.players[msg.sender];
        
        require(pool.status == PoolStatus.ACTIVE, "Pool inactive");
        require(player.playerAddress != address(0), "Not a player");
        require(_choice == PlayerChoice.HEADS || _choice == PlayerChoice.TAILS, "Invalid choice");
        require(!player.isEliminated, "Player eliminated");
        require(!pool.roundParticipation[pool.currentRound][msg.sender], "Already participated");
        
        pool.roundParticipation[pool.currentRound][msg.sender] = true;
        pool.roundSelection[pool.currentRound][msg.sender] = _choice;
        
        if (_choice == PlayerChoice.HEADS) {
            pool.headsCount[pool.currentRound]++;
        } else if (_choice == PlayerChoice.TAILS) {
            pool.tailsCount[pool.currentRound]++;
        }
        
        _checkRoundCompletion(_poolId);
    }
    
    function _checkRoundCompletion(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        uint activeCount = 0;
        uint participatedCount = 0;
        
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            if (!pool.players[playerAddress].isEliminated) {
                activeCount++;
                if (pool.roundParticipation[pool.currentRound][playerAddress]) {
                    participatedCount++;
                }
            }
        }
        
        if (activeCount == participatedCount) {
            _resolveRound(_poolId);
        }
    }
    
    /**
     * @dev Resolve the current round and determine winners and losers
     * @param _poolId ID of the pool
     */
    function _resolveRound(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        uint currentRound = pool.currentRound;
        
        uint headsCount = pool.headsCount[currentRound];
        uint tailsCount = pool.tailsCount[currentRound];

        PlayerChoice winningSelection;
    
        if(headsCount < tailsCount) {
            winningSelection = PlayerChoice.HEADS;
        } else if (tailsCount < headsCount) {
            winningSelection = PlayerChoice.TAILS;
        } else {
            winningSelection = _resolveTie(_poolId, currentRound);
        }

        _processRoundResults(_poolId, currentRound, winningSelection);
    }

    /**
     * @dev Resolve a tie by using market data and random number from flare's vrf
     * @param _poolId ID of the pool
     * @param _round Current round number
     * @return The winning selection
     */
    function _resolveTie(uint _poolId, uint _round) internal returns (PlayerChoice) {
        Pool storage pool = pools[_poolId];
        MarketData storage data = poolMarketData[_poolId];
        
        // Use library for price updates
        if (block.timestamp > data.lastUpdated + 1 minutes) {
            PriceFeedLibrary.PriceData memory priceData = 
                pool.feedId.getCurrentPrice(ftsoV2, feedFees);
            
            if (data.startPrice == 0) {
                data.startPrice = priceData.price;
            }
            
            data.lastPrice = priceData.price;
            data.lastUpdated = priceData.timestamp;
        }
        
        // Use library for random number
        uint256 randomValue = randomNumberV2.getRandomNumber(
            _poolId, 
            _round, 
            roundRandomNumbers 
        );
        
        bool priceIncreased = (data.lastPrice > data.startPrice);
        
        PlayerChoice winningSelection;
        
        if ((priceIncreased && randomValue % 2 == 0) || 
            (!priceIncreased && randomValue % 2 == 1)) {
            winningSelection = PlayerChoice.HEADS;
        } else {
            winningSelection = PlayerChoice.TAILS;
        }
        
        emit TieBrokenByHybrid(
            _poolId, 
            _round, 
            data.startPrice, 
            data.lastPrice, 
            randomValue,
            winningSelection
        );
        
        return winningSelection;
    }

    /**
     * @dev Process the round results and update player statuses
     * @param _poolId ID of the pool
     * @param _round Current round number
     * @param winningSelection The winning choice
     */
    function _processRoundResults(
        uint _poolId,
        uint _round,
        PlayerChoice winningSelection
    ) internal {
        Pool storage pool = pools[_poolId];
        
        delete pool.roundWinners[_round];
        delete pool.roundLosers[_round];

        uint remainingPlayers = 0;
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            Player storage player = pool.players[playerAddress];

            if (!player.isEliminated && pool.roundParticipation[_round][playerAddress]) {
                if (pool.roundSelection[_round][playerAddress] != winningSelection) {
                    player.isEliminated = true;
                    pool.currentActiveParticipants--;
                    pool.roundLosers[_round].push(playerAddress);
                } else {
                    remainingPlayers++;
                    pool.roundWinners[_round].push(playerAddress);
                }
            }
        }

        pool.roundCompleted[_round] = true;
        emit RoundCompleted(_poolId, _round, winningSelection);
        emit RoundWinners(_poolId, _round, pool.roundWinners[_round]);
        emit RoundLosers(_poolId, _round, pool.roundLosers[_round]);

        if (remainingPlayers <= pool.maxWinners || remainingPlayers <= 1) {
            _finalizePool(_poolId);
        } else {
            pool.currentRound++;
            _initializeRoundMarketData(_poolId);
        }
    }

    /**
     * @dev Finalize the pool and determine winners
     * @param _poolId ID of the pool
     */
    function _finalizePool(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.CLOSED;
        
        delete pool.finalWinners;  // Clear any previous data
        
        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            if (!pool.players[playerAddress].isEliminated) {
                pool.finalWinners.push(playerAddress);
            }
        }

        // Decrement active pools count for the creator
        address creator = pool.creator;
        StakerInfo storage stakerInfo = stakers[creator];
        stakerInfo.activePoolsCount--;
        
        emit PoolCompleted(_poolId, pool.prizePool);
    }

    

    /**
     * @dev Initialize market data for a new round
     * @param _poolId ID of the pool
     */
    function _initializeRoundMarketData(uint _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        uint256 fee = feedFees[pool.feedId];
        
        PriceFeedLibrary.PriceData memory priceData = PriceFeedLibrary.getCurrentPrice(
            pool.feedId,
            ftsoV2,
            fee
        );
        
        MarketData storage data = poolMarketData[_poolId];
        data.startPrice = priceData.price;
        data.lastPrice = priceData.price;
        data.lastUpdated = priceData.timestamp;
    }

    /**
     * @dev Update market price for a pool
     * @param _poolId ID of the pool
     */
    function updateMarketPrice(uint _poolId) public poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.ACTIVE, "Pool not active");
        require(msg.sender == pool.creator || msg.sender == owner(), "Not authorized");
        
        MarketData storage data = poolMarketData[_poolId];
        require(block.timestamp >= data.lastUpdated + 5 minutes, "Cooldown active");

        poolMarketData[_poolId].updateMarketData(
            pools[_poolId].feedId,
            ftsoV2,
            feedFees[pools[_poolId].feedId]
        );

        
        emit MarketPriceUpdated(_poolId, poolMarketData[_poolId].lastPrice, poolMarketData[_poolId].lastUpdated);
    }
}