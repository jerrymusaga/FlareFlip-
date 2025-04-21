// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.13;

// import {Test} from "dependencies/forge-std-1.9.5/src/Test.sol";
// import {ContractRegistry} from "dependencies/flare-periphery-0.0.22/src/coston2/ContractRegistry.sol";
// import {FlareFlip} from "src/FlareFlip.sol";
// import {FtsoV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/FtsoV2Interface.sol";
// import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
// import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
// // import {MockRandomNumberV2} from "src/utils/MockRandomNumberV2.sol";

// interface MinimalFtsoV2Interface {
//     function getFeedById(bytes21 _feedId) external payable returns (uint256, int8, uint64);
// }

// interface MinimalFeeCalculatorInterface{
//     function calculateFee(address, uint256) external view  returns (uint256);
//     function calculateFeeByIds(bytes21[] memory) external view returns (uint256);
// }

// // Mock contracts for Flare interfaces
// contract MockFtsoV2 is MinimalFtsoV2Interface{
//     function getFeedById(bytes21 _feedId) external payable override returns (uint256, int8, uint64) {
//         return (1000 * 10**18, 18, uint64(block.timestamp)); // Mock price of 1000 USD with 18 decimals
//     }
    
// }

// contract MockFeeCalculator is MinimalFeeCalculatorInterface {
//     function calculateFee(address, uint256) external view override returns (uint256) {
//         return 0.01 ether; // Fixed fee of 0.01 FLR
//     }

//     function calculateFeeByIds(bytes21[] memory) external view override returns (uint256) {
//         return 0.01 ether; // Fixed fee of 0.01 FLR
//     }
// }



// contract FlareFlipAdminTest is Test {
//     FlareFlip flareFlip;
//     MockFtsoV2 mockFtsoV2;
//     MockFeeCalculator mockFeeCalculator;
//     // MockRandomNumberV2 mockRandomNumberV2;

//     address public owner = address(0x1);
//     address public staker = address(0x2);
//     address public user1 = address(0x3);
//     address public user2 = address(0x4);

//     // Category constants
//     uint8 public constant CATEGORY_CRYPTO = 1;
//     uint8 public constant CATEGORY_COMMODITIES = 2;
//     uint8 public constant CATEGORY_FOREX = 3;

//     // Feed ID constants for testing
//     bytes21 public constant BTC_FEED_ID = bytes21(bytes("BTC/USD"));
//     bytes21 public constant ETH_FEED_ID = bytes21(bytes("ETH/USD"));
//     bytes21 public constant GOLD_FEED_ID = bytes21(bytes("XAU/USD"));

//     function setUp() public {
       
        
//         // Deploy mock contracts
//         mockFtsoV2 = new MockFtsoV2();
//         mockFeeCalculator = new MockFeeCalculator();
//         // mockRandomNumberV2 = new MockRandomNumberV2();
        
//         // Deploy FlareFlip contract
//         vm.startPrank(owner);
//         flareFlip = new FlareFlip();

//         flareFlip.setFtsoV2(address(mockFtsoV2));
//         flareFlip.setFeeCalculator(address(mockFeeCalculator));
//         flareFlip.setRandomNumberProvider(address(mockRandomNumberV2));
//         vm.stopPrank();
        
//         // Set up mocks in ContractRegistry
//         // We need to mock the contract registry calls since FlareFlip uses it to get interface addresses
//         vm.mockCall(
//             0xC4e9c78EA53db782E28f28Fdf80BaF59336B304d,
//             abi.encodeWithSelector(
//                 bytes4(keccak256("getContractAddressByName(string)")),
//                 "FtsoV2"
//             ),
//             abi.encode(address(mockFtsoV2))
//         );
        
//         vm.mockCall(
//             0x88A9315f96c9b5518BBeC58dC6a914e13fAb13e2,
//             abi.encodeWithSelector(
//                 bytes4(keccak256("getContractAddressByName(string)")),
//                 "FeeCalculator"
//             ),
//             abi.encode(address(mockFeeCalculator))
//         );
        
//         vm.mockCall(
//             ContractRegistry.FLARE_CONTRACT_REGISTRY_ADDRESS,
//             abi.encodeWithSelector(
//                 bytes4(keccak256("getContractAddressByName(string)")),
//                 "RandomNumberV2"
//             ),
//             abi.encode(address(mockRandomNumberV2))
//         );
        
//         // Set random number provider directly
//         flareFlip.setRandomNumberProvider(address(mockRandomNumberV2));
        
//         vm.stopPrank();
        
//         // Fund accounts
//         vm.deal(owner, 100 ether);
//         vm.deal(staker, 1000 ether);
//         vm.deal(user1, 10 ether);
//         vm.deal(user2, 10 ether);
        
//         // Create a stake for the staker account
//         vm.startPrank(staker);
//         flareFlip.stake{value: 100 ether}();
//         vm.stopPrank();
//     }

//     // Test adding a supported asset
//     function testAddSupportedAsset() public {
//         vm.startPrank(owner);
        
//         // Add BTC as a supported asset
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         // Verify asset was added
//         assertTrue(flareFlip.isAssetSupported("BTC"), "BTC should be supported");
//         assertEq(flareFlip.assetToFeedId("BTC"), BTC_FEED_ID, "Feed ID should match");
//         assertEq(flareFlip.feedCategories(BTC_FEED_ID), CATEGORY_CRYPTO, "Category should be crypto");
        
//         string[] memory assets = flareFlip.getAssetsByCategory(CATEGORY_CRYPTO);
//         assertEq(assets.length, 1, "Should have 1 crypto asset");
//         assertEq(assets[0], "BTC", "Asset should be BTC");
        
//         (uint8[] memory categoryIds, string[] memory categoryNames) = flareFlip.getAllCategories();
//         assertEq(categoryIds.length, 1, "Should have 1 category");
//         assertEq(categoryIds[0], CATEGORY_CRYPTO, "Category should be crypto");
//         assertEq(categoryNames[0], "Cryptocurrency", "Category name should match");
        
//         vm.stopPrank();
//     }

//     // Test adding multiple assets in different categories
//     function testAddMultipleAssets() public {
//         vm.startPrank(owner);
        
//         // Add assets in different categories
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "ETH",
//             ETH_FEED_ID
//         );
        
//         flareFlip.addSupportedAsset(
//             CATEGORY_COMMODITIES,
//             "Commodities",
//             "GOLD",
//             GOLD_FEED_ID
//         );
        
//         // Verify all assets were added correctly
//         assertTrue(flareFlip.isAssetSupported("BTC"), "BTC should be supported");
//         assertTrue(flareFlip.isAssetSupported("ETH"), "ETH should be supported");
//         assertTrue(flareFlip.isAssetSupported("GOLD"), "GOLD should be supported");
        
//         // Check categories
//         string[] memory cryptoAssets = flareFlip.getAssetsByCategory(CATEGORY_CRYPTO);
//         assertEq(cryptoAssets.length, 2, "Should have 2 crypto assets");
        
//         string[] memory commodityAssets = flareFlip.getAssetsByCategory(CATEGORY_COMMODITIES);
//         assertEq(commodityAssets.length, 1, "Should have 1 commodity asset");
        
//         (uint8[] memory categoryIds, string[] memory categoryNames) = flareFlip.getAllCategories();
//         assertEq(categoryIds.length, 2, "Should have 2 categories");
        
//         vm.stopPrank();
//     }

//     // Test removing a supported asset
//     function testRemoveSupportedAsset() public {
//         vm.startPrank(owner);
        
//         // Add two assets
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "ETH",
//             ETH_FEED_ID
//         );
        
//         // Remove one asset
//         flareFlip.removeSupportedAsset("BTC");
        
//         // Verify BTC is removed but ETH remains
//         assertFalse(flareFlip.isAssetSupported("BTC"), "BTC should no longer be supported");
//         assertTrue(flareFlip.isAssetSupported("ETH"), "ETH should still be supported");
        
//         string[] memory cryptoAssets = flareFlip.getAssetsByCategory(CATEGORY_CRYPTO);
//         assertEq(cryptoAssets.length, 1, "Should have 1 crypto asset remaining");
//         assertEq(cryptoAssets[0], "ETH", "Remaining asset should be ETH");
        
//         vm.stopPrank();
//     }

//     // Test removing the last asset in a category
//     function testRemoveLastAssetInCategory() public {
//         vm.startPrank(owner);
        
//         // Add assets in different categories
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         flareFlip.addSupportedAsset(
//             CATEGORY_COMMODITIES,
//             "Commodities",
//             "GOLD",
//             GOLD_FEED_ID
//         );
        
//         // Remove the only asset in the commodities category
//         flareFlip.removeSupportedAsset("GOLD");
        
//         // Verify category was removed
//         string[] memory commodityAssets = flareFlip.getAssetsByCategory(CATEGORY_COMMODITIES);
//         assertEq(commodityAssets.length, 0, "Should have 0 commodity assets");
        
//         (uint8[] memory categoryIds, string[] memory categoryNames) = flareFlip.getAllCategories();
//         assertEq(categoryIds.length, 1, "Should have 1 category remaining");
//         assertEq(categoryIds[0], CATEGORY_CRYPTO, "Remaining category should be crypto");
        
//         vm.stopPrank();
//     }

//     // Test that non-owner cannot add assets
//     function testNonOwnerCannotAddAsset() public {
//         vm.startPrank(user1);
        
//         vm.expectRevert("Ownable: caller is not the owner");
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         vm.stopPrank();
//     }

//     // Test setting creator fee percentage
//     function testSetCreatorFeePercentage() public {
//         vm.startPrank(owner);
        
//         // Set fee to 10%
//         flareFlip.setCreatorFeePercentage(1000);
//         assertEq(flareFlip.creatorFeePercentage(), 1000, "Fee should be 10%");
        
//         // Set fee to 20% (maximum allowed)
//         flareFlip.setCreatorFeePercentage(2000);
//         assertEq(flareFlip.creatorFeePercentage(), 2000, "Fee should be 20%");
        
//         // Try to set fee above maximum (should revert)
//         vm.expectRevert("Fee percentage too high");
//         flareFlip.setCreatorFeePercentage(2100);
        
//         vm.stopPrank();
//     }

//     // Test that non-owner cannot set fee percentage
//     function testNonOwnerCannotSetFeePercentage() public {
//         vm.startPrank(user1);
        
//         vm.expectRevert("Ownable: caller is not the owner");
//         flareFlip.setCreatorFeePercentage(1000);
        
//         vm.stopPrank();
//     }

//     // Test setting minimum staking period
//     function testSetMinimumStakingPeriod() public {
//         vm.startPrank(owner);
        
//         // Set staking period to 14 days
//         uint256 newPeriod = 14 days;
//         flareFlip.setMinimumStakingPeriod(newPeriod);
//         assertEq(flareFlip.minimumStakingPeriod(), newPeriod, "Staking period should be 14 days");
        
//         vm.stopPrank();
//     }

//     // Test setting random number provider
//     function testSetRandomNumberProvider() public {
//         vm.startPrank(owner);
        
//         // Deploy a new mock random number provider
//         MockRandomNumberV2 newRandomProvider = new MockRandomNumberV2();
        
//         // Set the new provider
//         flareFlip.setRandomNumberProvider(address(newRandomProvider));
        
//         // Verify the provider was updated
//         assertEq(
//             address(flareFlip.randomNumberV2()),
//             address(newRandomProvider),
//             "Random number provider should be updated"
//         );
        
//         vm.stopPrank();
//     }

//     // Test getFeedIdByCategoryAndName
//     function testGetFeedIdByCategoryAndName() public {
//         vm.startPrank(owner);
        
//         // Add asset
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
        
//         // Verify feed ID lookup works
//         bytes21 feedId = flareFlip.getFeedIdByCategoryAndName("Cryptocurrency", "BTC");
//         assertEq(feedId, BTC_FEED_ID, "Feed ID should match");
        
//         vm.stopPrank();
//     }

//     // Test pool creation by a staker
//     function testCreatePool() public {
//         vm.startPrank(owner);
//         // Add BTC as a supported asset first
//         flareFlip.addSupportedAsset(
//             CATEGORY_CRYPTO,
//             "Cryptocurrency",
//             "BTC",
//             BTC_FEED_ID
//         );
//         vm.stopPrank();
        
//         vm.startPrank(staker);
//         // Create a pool
//         flareFlip.createPool(0.1 ether, 5, "BTC");
        
//         // Verify pool was created
//         assertEq(flareFlip.poolCount(), 1, "Pool count should be 1");
        
//         // Get pool info
//         FlareFlip.PoolInfo memory poolInfo = flareFlip.getPoolInfo(0);
//         assertEq(poolInfo.entryFee, 0.1 ether, "Entry fee should match");
//         assertEq(poolInfo.maxParticipants, 5, "Max participants should match");
//         assertEq(poolInfo.creator, staker, "Creator should be staker");
//         vm.stopPrank();
//     }
// }