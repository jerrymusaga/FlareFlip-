// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./FlareFlipPoolManagement.sol";
import "../libraries/RandomNumberLibrary.sol";

abstract contract FlareFlipGameLogic is FlareFlipPoolManagement {
    using PriceFeedLibrary for MarketData;
    using PriceFeedLibrary for bytes21;
    using RandomNumberLibrary for RandomNumberV2Interface;

    // Custom errors unique to this contract
    error NotAPlayer();
    error InvalidChoice();
    error PlayerEliminated();
    error AlreadyParticipated();
    error NoSelectionsInRound();
    error CannotResolveZeroVoteTie();
    error NotAuthorized();
    error UpdateCooldownActive();
    
    event RoundCompleted(uint poolId, uint round, PlayerChoice winningChoice);
    event RoundWinners(uint poolId, uint round, address[] winners);
    event RoundLosers(uint poolId, uint round, address[] losers);
    event PoolCompleted(uint poolId, uint prizePool);
    event TieBrokenByHybrid(uint poolId, uint round, uint256 startPrice, uint256 lastPrice, uint256 randomValue, PlayerChoice winningSelection);
    event MarketPriceUpdated(uint poolId, uint256 price, uint256 timestamp);
    
    function makeSelection(uint _poolId, PlayerChoice _choice) external poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        Player storage player = pool.players[msg.sender];
        
        if (pool.status != PoolStatus.ACTIVE) revert PoolInactive();
        if (player.playerAddress == address(0)) revert NotAPlayer();
        if (_choice != PlayerChoice.HEADS && _choice != PlayerChoice.TAILS) revert InvalidChoice();
        if (player.isEliminated) revert PlayerEliminated();
        if (pool.roundParticipation[pool.currentRound][msg.sender]) revert AlreadyParticipated();
        
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

        // Require at least one selection to resolve
        if (headsCount == 0 && tailsCount == 0) revert NoSelectionsInRound();
        
        PlayerChoice winningSelection;
        
        // Minority wins logic
        if (headsCount < tailsCount) {
            winningSelection = PlayerChoice.HEADS;
        } else if (tailsCount < headsCount) {
            winningSelection = PlayerChoice.TAILS;
        } else {
            // Only resolve tie if we have actual votes
            if (headsCount == 0) revert CannotResolveZeroVoteTie();
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
        
        // Force price update if stale
        data.updateMarketData(
            pool.feedId,
            ftsoV2,
            feedFees[pool.feedId]
        );
        
        // Get fresh random number
        uint256 randomValue = randomNumberV2.getRandomNumber(
            _poolId, 
            _round, 
            roundRandomNumbers 
        );
        
        bool priceIncreased = (data.lastPrice > data.startPrice);
        bool randomEven = (randomValue % 2 == 0);
        
        // HEADS wins if: (price↑ AND random even) OR (price↓ AND random odd)
        if ((priceIncreased && randomEven) || (!priceIncreased && !randomEven)) {
            emit TieBrokenByHybrid(
                _poolId, 
                _round, 
                data.startPrice, 
                data.lastPrice, 
                randomValue,
                PlayerChoice.HEADS
            );
            return PlayerChoice.HEADS;
        } else {
            emit TieBrokenByHybrid(
                _poolId, 
                _round, 
                data.startPrice, 
                data.lastPrice, 
                randomValue,
                PlayerChoice.TAILS
            );
            return PlayerChoice.TAILS;
        }
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
        
        // Clear previous results
        delete pool.roundWinners[_round];
        delete pool.roundLosers[_round];

        for (uint i = 0; i < pool.playersInPool.length; i++) {
            address playerAddress = pool.playersInPool[i];
            Player storage player = pool.players[playerAddress];

            if (!player.isEliminated && pool.roundParticipation[_round][playerAddress]) {
                if (pool.roundSelection[_round][playerAddress] == winningSelection) {
                    pool.roundWinners[_round].push(playerAddress);
                } else {
                    player.isEliminated = true;
                    pool.currentActiveParticipants--;
                    pool.roundLosers[_round].push(playerAddress);
                }
            }
        }

        // Emit events and handle pool completion
        emit RoundCompleted(_poolId, _round, winningSelection);
        emit RoundWinners(_poolId, _round, pool.roundWinners[_round]);
        emit RoundLosers(_poolId, _round, pool.roundLosers[_round]);
        
        if (pool.roundWinners[_round].length <= 1) {
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
        MarketData storage data = poolMarketData[_poolId];
        
        // Pay the fee and get fresh data
        uint256 fee = feedFees[pool.feedId];
        (uint256 price, int8 decimals, uint64 timestamp) = 
            ftsoV2.getFeedById{value: fee}(pool.feedId);
        
        data.startPrice = price;
        data.lastPrice = price;
        data.startTimestamp = timestamp;
        data.lastUpdated = timestamp;
        data.priceDecimals = uint256(uint8(decimals));
    }

    /**
     * @dev Update market price for a pool
     * @param _poolId ID of the pool
     */
    function updateMarketPrice(uint _poolId) public poolExists(_poolId) {
        Pool storage pool = pools[_poolId];
        if (pool.status != PoolStatus.ACTIVE) revert PoolInactive();
        if (msg.sender != pool.creator && msg.sender != owner()) revert NotAuthorized();
        
        MarketData storage data = poolMarketData[_poolId];
        if (block.timestamp < data.lastUpdated + 5 minutes) revert UpdateCooldownActive();

        data.updateMarketData(
            pool.feedId,
            ftsoV2,
            feedFees[pool.feedId]
        );
        
        emit MarketPriceUpdated(_poolId, data.lastPrice, data.lastUpdated);
    }
}