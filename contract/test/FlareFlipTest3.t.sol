// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "dependencies/forge-std-1.9.5/src/Test.sol";
import {console} from "dependencies/forge-std-1.9.5/src/console.sol";
import "../src/FlareFlip.sol";
import {PoolInfo, StakerInfo} from "../src/libraries/DataStructures.sol";
import {FtsoV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/FtsoV2Interface.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";

contract MockFtsoV2 is FtsoV2Interface {
    uint256 public price = 1000 * 10**18; // Initial price 1000 USD with 18 decimals
    int8 public decimals = 18;
    uint64 public timestamp;
    mapping(bytes21 => bool) public registeredFeeds;
    

    function registerFeed(bytes21 _feedId) external {
        registeredFeeds[_feedId] = true;
    }

    function setPrice(uint256 _price) external {
        price = _price;
        timestamp = uint64(block.timestamp);
    }

    function getFeedByIndex(uint256) external payable override returns (uint256, int8, uint64) {
        return (price, decimals, uint64(block.timestamp));
    }

    function getFeedById(bytes21 _feedId) external payable override returns (uint256, int8, uint64) {
        require(registeredFeeds[_feedId], "Feed not registered");
        return (price, decimals, uint64(block.timestamp));
    }

    function getFeedsByIndex(uint256[] calldata) external payable override returns (uint256[] memory, int8[] memory, uint64) {
        revert("Not implemented");
    }

    function getFeedsById(bytes21[] calldata) external payable override returns (uint256[] memory, int8[] memory, uint64) {
        revert("Not implemented");
    }

    function getFeedByIndexInWei(uint256) external payable override returns (uint256, uint64) {
        revert("Not implemented");
    }

    function getFeedByIdInWei(bytes21) external payable override returns (uint256, uint64) {
        revert("Not implemented");
    }

    function getFeedsByIndexInWei(uint256[] calldata) external payable override returns (uint256[] memory, uint64) {
        revert("Not implemented");
    }

    function getFeedsByIdInWei(bytes21[] calldata) external payable override returns (uint256[] memory, uint64) {
        revert("Not implemented");
    }

    function getFeedIndex(bytes21) external pure override returns (uint256) {
        revert("Not implemented");
    }

    function getFeedId(uint256) external pure override returns (bytes21) {
        revert("Not implemented");
    }

    function verifyFeedData(FeedDataWithProof calldata) external pure override returns (bool) {
        revert("Not implemented");
    }
}

contract MockFeeCalculator is IFeeCalculator {
    uint256 public fee = 0.01 ether;

    function setFee(uint256 _fee) external {
        fee = _fee;
    }

    function calculateFeeByIds(bytes21[] memory) external view override returns (uint256) {
        return fee;
    }

    function calculateFeeByIndices(uint256[] memory) external view override returns (uint256) {
        return fee;
    }
}

contract MockRandomNumberV2 is RandomNumberV2Interface {
    uint256 public randomNumber = 123456789;
    bool public isSecure = true;
    
    function setRandomNumber(uint256 _randomNumber) external {
        randomNumber = _randomNumber;
    }

    function getRandomNumber() external view override returns (uint256, bool, uint256) {
        return (randomNumber, isSecure, block.timestamp);
    }

    function getRandomNumberHistorical(uint256) external view override returns (uint256, bool, uint256) {
        return (randomNumber, isSecure, block.timestamp);
    }
}

contract FlareFlipTest is Test {
    FlareFlip public flareFlip;
    MockFtsoV2 public mockFtsoV2;
    MockFeeCalculator public mockFeeCalculator;
    MockRandomNumberV2 public mockRandomNumberV2;

    address public owner = address(0x1);
    address public creator = address(0x2);
    address public player1 = address(0x3);
    address public player2 = address(0x4);
    address public player3 = address(0x5);
    address public player4 = address(0x6);

    uint256 public constant STAKE_AMOUNT = 100 ether;
    uint256 public constant ENTRY_FEE = 1 ether;
    uint256 public constant MAX_PARTICIPANTS = 4;
    string public constant ASSET_SYMBOL = "FLR";
    bytes21 public constant FEED_ID = bytes21(keccak256("FLR/USD"));
    uint8 public constant CATEGORY_ID = 1;
    string public constant CATEGORY_NAME = "Crypto";

    event PoolCreated(uint poolId, uint entryFee, uint maxParticipants, string assetSymbol, address creator);
    event PlayerJoined(uint poolId, address player);
    event PoolActivated(uint poolId);
    event RoundCompleted(uint poolId, uint round, PlayerChoice winningChoice);
    event PoolCompleted(uint poolId, uint prizePool);
    event PrizeClaimed(uint poolId, address winner, uint amount);
    event TieBrokenByHybrid(uint poolId, uint round, uint256 startPrice, uint256 lastPrice, uint256 randomValue, PlayerChoice winningSelection);

    function setUp() public {
        console.log("Starting setup");
        
        console.log("Deploying mocks");
        mockFtsoV2 = new MockFtsoV2();
        mockFeeCalculator = new MockFeeCalculator();
        mockRandomNumberV2 = new MockRandomNumberV2();
        console.log("Mocks deployed");

        // Deploy FlareFlip - deployer becomes owner
        console.log("Deploying FlareFlip");
        flareFlip = new FlareFlip();
        console.log("FlareFlip deployed");

        // Transfer ownership to our test owner
        console.log("Transferring ownership");
        vm.prank(flareFlip.owner()); // Act as current owner
        flareFlip.transferOwnership(owner);
        console.log("Ownership transferred");

        // Now configure as new owner
        vm.startPrank(owner);
        console.log("Setting FtsoV2");
        flareFlip.setFtsoV2(address(mockFtsoV2));
        console.log("Setting FeeCalculator");
        flareFlip.setFeeCalculator(address(mockFeeCalculator));
        console.log("Setting RandomNumberProvider");
        flareFlip.setRandomNumberProvider(address(mockRandomNumberV2));
        console.log("Contracts configured");

        console.log("Adding supported asset");
        flareFlip.addSupportedAsset(CATEGORY_ID, CATEGORY_NAME, ASSET_SYMBOL, FEED_ID);
        console.log("Asset added");
        
        console.log("Registering feed");
        mockFtsoV2.registerFeed(FEED_ID);
        console.log("Feed registered");

        vm.stopPrank();

        console.log("Funding accounts");
        vm.deal(owner, 1000 ether);
        vm.deal(creator, 1000 ether);
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(player3, 100 ether);
        vm.deal(player4, 100 ether);
        console.log("Setup complete");
    }

    function test_FullGameFlowScenario() public {
        // 1. Setup - Creator stakes and creates pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // 2. Players join pool
        address[4] memory players = [player1, player2, player3, player4];
        for (uint i = 0; i < players.length; i++) {
            vm.prank(players[i]);
            flareFlip.joinPool{value: ENTRY_FEE}(0);
        }

        // 3. Round 1 - Create tie situation (2 HEADS, 2 TAILS)
        // Set tie-break conditions (price increase + even random number)
        mockFtsoV2.setPrice(1200 * 10**18); // 20% price increase
        mockRandomNumberV2.setRandomNumber(888888); // Even number

        // Players make selections
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player3);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        
        // Last selection triggers round resolution
        vm.expectEmit(true, true, true, true);
        emit RoundCompleted(0, 1, PlayerChoice.TAILS); 
        vm.prank(player4);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Verify round results
        (address[] memory winners, ) = flareFlip.getRoundResults(0, 1);
        assertEq(winners.length, 2);
        assertEq(winners[0], player1);
        assertEq(winners[1], player2);

        // 4. Round 2 - Only player1 and player2 remain
        // Set price decrease for clear minority win
        mockFtsoV2.setPrice(800 * 10**18); // 20% price decrease

        // Player1 chooses HEADS, Player2 chooses TAILS
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        
        // Final selection triggers game end
        vm.expectEmit(true, true, true, true);
        emit RoundCompleted(0, 2, PlayerChoice.TAILS); // TAILS wins (minority)
        vm.expectEmit(true, true, true, true);
        emit PoolCompleted(0, ENTRY_FEE * MAX_PARTICIPANTS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Verify final winner
        address[] memory finalWinners = flareFlip.getPoolWinners(0);
        assertEq(finalWinners.length, 1);
        assertEq(finalWinners[0], player2);

        // 5. Prize distribution
        uint256 prizeAmount = (ENTRY_FEE * MAX_PARTICIPANTS * 95) / 100;
        uint256 creatorFee = (ENTRY_FEE * MAX_PARTICIPANTS * 5) / 100;

        vm.expectEmit(true, true, true, true);
        emit PrizeClaimed(0, player2, prizeAmount);
        vm.prank(player2);
        flareFlip.claimPrize(0);

        assertEq(player2.balance, prizeAmount);
        assertEq(creator.balance, creatorFee);
    }

    function test_TieBreakingScenario() public {
        // Setup pool with players
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Players join
        address[4] memory players = [player1, player2, player3, player4];
        for (uint i = 0; i < players.length; i++) {
            vm.prank(players[i]);
            flareFlip.joinPool{value: ENTRY_FEE}(0);
        }

        // Set tie-break conditions (price increase + even random number)
        mockFtsoV2.setPrice(1200 * 10**18); // Price increase
        mockRandomNumberV2.setRandomNumber(888888); // Even number

        // Create perfect tie (2 HEADS, 2 TAILS)
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player3);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        
        // Last selection triggers tie-break
        vm.expectEmit(true, true, true, true);
        emit RoundCompleted(0, 1, PlayerChoice.HEADS);
        emit TieBrokenByHybrid(0, 1, 1000 * 10**18, 1200 * 10**18, 888888, PlayerChoice.HEADS);
        vm.prank(player4);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Verify HEADS wins tie-break
        (address[] memory winners, ) = flareFlip.getRoundResults(0, 1);
        assertEq(winners.length, 2);
        assertTrue(
            (winners[0] == player1 && winners[1] == player2) ||
            (winners[0] == player2 && winners[1] == player1),
            "HEADS players should win"
        );
    }

    // function test_CreatorOperations_SimpleRounds() public {
    //     // 1. Setup creator stake and single pool
    //     vm.startPrank(creator);
    //     flareFlip.stake{value: STAKE_AMOUNT}();
    //     uint256 poolId = 0;
    //     flareFlip.createPool(ENTRY_FEE, 3, ASSET_SYMBOL); 
    //     vm.stopPrank();

    //     // 2. Join players (3 players)
    //     address[3] memory players = [player1, player2, player3];
    //     for (uint i = 0; i < players.length; i++) {
    //         vm.prank(players[i]);
    //         flareFlip.joinPool{value: ENTRY_FEE}(poolId);
    //     }

    //     // 3. Round 1 
    //     // TAILS should win (minority), HEADS players eliminated
    //     vm.prank(players[0]);
    //     flareFlip.makeSelection(poolId, PlayerChoice.HEADS);
    //     vm.prank(players[1]);
    //     flareFlip.makeSelection(poolId, PlayerChoice.HEADS);
    //     vm.prank(players[2]);
    //     flareFlip.makeSelection(poolId, PlayerChoice.TAILS);

    //     // Verify results using available view functions
    //     (uint currentRound, bool isRoundCompleted, PlayerChoice winningChoice, ) = flareFlip.getCurrentRound(poolId);
    //     assertTrue(isRoundCompleted, "Round should be completed");
    //     assertEq(uint(winningChoice), uint(PlayerChoice.TAILS), "TAILS should win as minority choice");

    //     // Check final winners (using getPoolWinners)
    //     address[] memory finalWinners = flareFlip.getPoolWinners(poolId);
    //     assertEq(finalWinners.length, 1, "Only TAILS player should win");
    //     assertEq(finalWinners[0], players[2], "TAILS chooser should be winner");

    //     // 4. Verify pool status
    //     PoolInfo memory pool = flareFlip.getPoolInfo(poolId);
    //     assertEq(uint(pool.status), uint(PoolStatus.CLOSED), "Pool should close with 1 winner");

    //     // 5. Test unstaking after pool completion
    //     vm.warp(block.timestamp + flareFlip.minimumStakingPeriod() + 1);
        
    //     uint256 creatorBalanceBefore = creator.balance;
    //     vm.prank(creator);
    //     flareFlip.unstake(STAKE_AMOUNT);
        
    //     assertEq(
    //         creator.balance,
    //         creatorBalanceBefore + STAKE_AMOUNT,
    //         "Creator should receive staked amount"
    //     );
    // }

    function test_PlayerErrors() public {
        // Setup pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Test joining with insufficient fee
        vm.startPrank(player1);
        vm.expectRevert("Insufficient fee");
        flareFlip.joinPool{value: ENTRY_FEE - 0.1 ether}(0);
        
        // Join correctly
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        
        // Test joining twice
        vm.expectRevert("Already joined");
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.stopPrank();
        
        // Creator tries to join own pool
        vm.startPrank(creator);
        vm.expectRevert("Creator cannot join own pool");
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.stopPrank();
        
        // Complete filling the pool
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        
        // Test making invalid selection
        vm.startPrank(player1);
        vm.expectRevert("Invalid choice");
        flareFlip.makeSelection(0, PlayerChoice.NONE);
        
        // Make valid selection
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        
        // Test selecting twice in same round
        vm.expectRevert("Already participated");
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.stopPrank();
    }

     function test_PrizeDistribution() public {
        // Setup pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, 2, ASSET_SYMBOL); // Smaller pool for simplicity
        vm.stopPrank();

        // Players join
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Complete game in one round (clear minority)
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.TAILS); // TAILS wins as minority

        // Verify pool completed
        // (uint poolId, , , , , PoolStatus status,) = flareFlip.getPoolInfo(0);
        // assertEq(uint(status), uint(PoolStatus.CLOSED));

        // Test prize claims
        uint256 totalPrize = ENTRY_FEE * 2;
        uint256 winnerPrize = (totalPrize * 95) / 100;
        uint256 creatorFee = totalPrize - winnerPrize;

        // Winner claims
        vm.prank(player2);
        vm.expectEmit(true, true, true, true);
        emit PrizeClaimed(0, player2, winnerPrize);
        flareFlip.claimPrize(0);

        // Verify balances
        assertEq(player2.balance, winnerPrize);
        assertEq(creator.balance, creatorFee);

        // Test invalid claims
        vm.prank(player1);
        vm.expectRevert("Not a winner");
        flareFlip.claimPrize(0);

        vm.prank(player2);
        vm.expectRevert("Already claimed");
        flareFlip.claimPrize(0);
    }

    function test_ViewFunctions() public {
        // Setup data
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        
        // Test getPoolInfo
        PoolInfo memory poolInfo = flareFlip.getPoolInfo(0);
        assertEq(poolInfo.poolId, 0);
        assertEq(poolInfo.entryFee, ENTRY_FEE);
        assertEq(poolInfo.maxParticipants, MAX_PARTICIPANTS);
        assertEq(poolInfo.currentParticipants, 1);
        assertEq(poolInfo.prizePool, ENTRY_FEE);
        assertEq(uint(poolInfo.status), uint(PoolStatus.OPENED));
        assertEq(poolInfo.creator, creator);
        
        // Test getPlayerPools
        uint[] memory playerPools = flareFlip.getPlayerPools(player1);
        assertEq(playerPools.length, 1);
        assertEq(playerPools[0], 0);
        
        // Test getStakerInfo
        StakerInfo memory creatorInfo = flareFlip.getStakerInfo(creator);
        assertEq(creatorInfo.stakedAmount, STAKE_AMOUNT);
        assertEq(creatorInfo.activePoolsCount, 1);
        
        // Test category and asset views
        string[] memory assets = flareFlip.getAllSupportedAssets();
        assertEq(assets.length, 1);
        assertEq(assets[0], ASSET_SYMBOL);
        
        string[] memory categoryAssets = flareFlip.getAssetsByCategory(CATEGORY_ID);
        assertEq(categoryAssets.length, 1);
        assertEq(categoryAssets[0], ASSET_SYMBOL);
        
        (uint8[] memory categoryIds, string[] memory categoryNames) = flareFlip.getAllCategories();
        assertEq(categoryIds.length, 1);
        assertEq(categoryIds[0], CATEGORY_ID);
        assertEq(categoryNames[0], CATEGORY_NAME);
        
        bytes21 feedId = flareFlip.getFeedIdByCategoryAndName(CATEGORY_NAME, ASSET_SYMBOL);
        assertEq(feedId, FEED_ID);
    }

    function test_GetPoolDetails() public {
        // Create and activate a pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Join players to activate pool
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Get pool details
        PoolDetails memory details = flareFlip.getPoolDetails(0);
        assertEq(details.entryFee, ENTRY_FEE);
        assertEq(details.maxParticipants, MAX_PARTICIPANTS);
        assertEq(details.currentParticipants, MAX_PARTICIPANTS);
        assertEq(details.prizePool, ENTRY_FEE * MAX_PARTICIPANTS);
        assertEq(uint(details.status), uint(PoolStatus.ACTIVE));
        assertEq(details.creator, creator);
        assertEq(details.assetSymbol, ASSET_SYMBOL);
        assertGt(details.startPrice, 0);
        assertGt(details.currentPrice, 0);
        assertGt(details.priceUpdated, 0);
        assertGt(details.roundDeadline, 0);
        assertTrue(details.priceInitialized);
    }

     function test_GetPlayerStats() public {
        // Setup two pools
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Player joins both pools
        vm.startPrank(player1);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        flareFlip.joinPool{value: ENTRY_FEE}(1);
        vm.stopPrank();

        // Complete first pool with player1 as winner
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Round 1
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player3);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        vm.prank(player4);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Round 2 - player1 wins
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Claim prize
        vm.prank(player1);
        flareFlip.claimPrize(0);

        // Test player stats
        (
            uint totalPools,
            uint activePools,
            uint wins,
            uint totalEarnings,
            uint totalStaked
        ) = flareFlip.getPlayerStats(player1);

        assertEq(totalPools, 2);
        assertEq(activePools, 1); // One pool is still open
        assertEq(wins, 1);
        assertEq(totalEarnings, ENTRY_FEE * MAX_PARTICIPANTS * 95 / 100);
        assertEq(totalStaked, STAKE_AMOUNT);
    }

    function test_GetPoolMarketData() public {
        // Create and activate pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Join players to activate pool
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Get market data
        (
            uint startPrice,
            uint lastPrice,
            uint lastUpdated,
            string memory baseAsset,
            string memory quoteAsset
        ) = flareFlip.getPoolMarketData(0);

        assertGt(startPrice, 0);
        assertGt(lastPrice, 0);
        assertGt(lastUpdated, 0);
        assertEq(baseAsset, ASSET_SYMBOL);
        assertEq(quoteAsset, "USD");
    }

    function test_CanJoinPool() public {
        // Create pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Player with no stake can join
        bool canJoin = flareFlip.canJoinPool(0, player1);
        assertTrue(canJoin, "Player without stake should be able to join");

        // Player joins
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // should not be able to join 
        canJoin = flareFlip.canJoinPool(0, player1);
        assertFalse(canJoin, "Player already in pool should not be able to join again");

        // Creator should not be able to join own pool
        canJoin = flareFlip.canJoinPool(0, creator);
        assertFalse(canJoin, "Creator should not be able to join own pool");
    }

    function test_GetCurrentRound() public {
        // Create and activate pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Join players to activate pool
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Get current round info
        (
            uint roundNumber,
            bool isRoundCompleted,
            PlayerChoice winningChoice,
            uint deadline
        ) = flareFlip.getCurrentRound(0);

        assertEq(roundNumber, 1);
        assertFalse(isRoundCompleted);
        assertEq(uint(winningChoice), uint(PlayerChoice.NONE));
        assertGt(deadline, block.timestamp);

        // Complete the round
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        vm.prank(player3);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        vm.prank(player4);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);

        // Check round info after completion
        (
            roundNumber,
            isRoundCompleted,
            winningChoice,
            deadline
        ) = flareFlip.getCurrentRound(0);

        // assertEq(roundNumber, 1);
        // assertTrue(isRoundCompleted);
        // assertTrue(uint(winningChoice) == uint(PlayerChoice.HEADS));
        // assertEq(deadline, 0); // Should be 0 for completed rounds
    }

    function test_GetRoundResults() public {
        // Create and activate pool
        vm.startPrank(creator);
        flareFlip.stake{value: STAKE_AMOUNT}();
        flareFlip.createPool(ENTRY_FEE, MAX_PARTICIPANTS, ASSET_SYMBOL);
        vm.stopPrank();

        // Join players to activate pool
        vm.prank(player1);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player2);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player3);
        flareFlip.joinPool{value: ENTRY_FEE}(0);
        vm.prank(player4);
        flareFlip.joinPool{value: ENTRY_FEE}(0);

        // Complete round 1
        vm.prank(player1);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player2);
        flareFlip.makeSelection(0, PlayerChoice.HEADS);
        vm.prank(player3);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        vm.prank(player4);
        flareFlip.makeSelection(0, PlayerChoice.TAILS);
        vm.roll(block.number + 1);

        // Get round results
        (address[] memory winners, address[] memory losers) = flareFlip.getRoundResults(0, 1);
        
        // Should be 2 winners and 2 losers (exact players depend on tie resolution)
        assertEq(winners.length, 2);
        assertEq(losers.length, 2);
    }

    
}