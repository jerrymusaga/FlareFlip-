// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "dependencies/@openzeppelin-contracts-5.2.0-rc.1/access/Ownable.sol";
import {ReentrancyGuard} from "dependencies/@openzeppelin-contracts-5.2.0-rc.1/utils/ReentrancyGuard.sol";
import {ContractRegistry} from "dependencies/flare-periphery-0.0.22/src/coston2/ContractRegistry.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
import "./libraries/DataStructures.sol";
import "./libraries/PriceFeedLibrary.sol";
import "./libraries/RandomNumberLibrary.sol";
import "./libraries/DataStructures.sol";


abstract contract FlareFlipBase is Ownable, ReentrancyGuard {
    using PriceFeedLibrary for MarketData;
    using RandomNumberLibrary for RandomNumberV2Interface;

    error InsufficientStake();
    error MinimumStakingPeriodNotMet();
    error ActivePoolsExist();
    error TransferFailed();
    error InvalidFeePercentage();
    error InvalidAddress();
    
    // State variables
    uint256 public constant MINIMUM_STAKE = 20 ether;
    uint256 public constant MAX_POOLS_PER_STAKER = 3;
    uint256 public creatorFeePercentage = 500;
    uint256 public minimumStakingPeriod = 5 days;
    
    // Contract interfaces
    FtsoV2Interface public ftsoV2;
    IFeeCalculator public feeCalculator;
    RandomNumberV2Interface public randomNumberV2;
    
    // Mappings
    mapping(address => StakerInfo) public stakers;
    mapping(string => bytes21) public assetToFeedId;
    mapping(string => bool) public isAssetSupported;
    mapping(uint => TradingPair) public poolTradingPairs;
    mapping(uint => MarketData) public poolMarketData;
    mapping(address => uint[]) public userPools;
    mapping(uint => mapping(uint => uint256)) public roundRandomNumbers;
    

    
    // Events
    event Staked(address staker, uint256 amount);
    event Unstaked(address staker, uint256 amount);
    event CreatorFeePercentageUpdated(uint256 newPercentage);
    
    constructor() Ownable(msg.sender) {
        
    }

     
    
    function stake() external payable nonReentrant {
        if (msg.value < MINIMUM_STAKE) revert InsufficientStake();

        StakerInfo storage stakerInfo = stakers[msg.sender];
        stakerInfo.stakedAmount += msg.value;
        stakerInfo.lastStakeTimestamp = block.timestamp;

        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 _amount) external nonReentrant {
        StakerInfo storage stakerInfo = stakers[msg.sender];
        
        if (stakerInfo.stakedAmount < _amount) revert InsufficientStake();
        if (block.timestamp < stakerInfo.lastStakeTimestamp + minimumStakingPeriod) revert MinimumStakingPeriodNotMet();
        if (stakerInfo.activePoolsCount != 0) revert ActivePoolsExist();

        stakerInfo.stakedAmount -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit Unstaked(msg.sender, _amount);
    }
    
    function setCreatorFeePercentage(uint256 _percentage) external onlyOwner {
        if (_percentage > 2000) revert InvalidFeePercentage();
        creatorFeePercentage = _percentage;
        emit CreatorFeePercentageUpdated(_percentage);
    }
    
    function setMinimumStakingPeriod(uint256 _period) external onlyOwner {
        minimumStakingPeriod = _period;
    }
    
    function setFtsoV2(address _ftsoV2) external onlyOwner {
        if (_ftsoV2 == address(0)) revert InvalidAddress();
        ftsoV2 = FtsoV2Interface(_ftsoV2);
    }
    
    function setFeeCalculator(address _feeCalculator) external onlyOwner {
        if (_feeCalculator == address(0)) revert InvalidAddress();
        feeCalculator = IFeeCalculator(_feeCalculator);
    }
    
    function setRandomNumberProvider(address _randomNumberV2) external onlyOwner {
        if (_randomNumberV2 == address(0)) revert InvalidAddress();
        randomNumberV2 = RandomNumberV2Interface(_randomNumberV2);
    }

    
    
}