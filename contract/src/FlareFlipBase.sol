// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "dependencies/@openzeppelin-contracts-5.2.0-rc.1/access/Ownable.sol";
import {ContractRegistry} from "dependencies/flare-periphery-0.0.22/src/coston2/ContractRegistry.sol";
import {IFeeCalculator} from "dependencies/flare-periphery-0.0.22/src/coston2/IFeeCalculator.sol";
import {RandomNumberV2Interface} from "dependencies/flare-periphery-0.0.22/src/coston2/RandomNumberV2Interface.sol";
import "./libraries/DataStructures.sol";
import "./libraries/PriceFeedLibrary.sol";
import "./libraries/RandomNumberLibrary.sol";

contract FlareFlipBase is Ownable {
    using PriceFeedLibrary for MarketData;
    using RandomNumberLibrary for RandomNumberV2Interface;
    
    // State variables
    uint256 public constant MINIMUM_STAKE = 100 ether;
    uint256 public constant MAX_POOLS_PER_STAKER = 3;
    uint256 public creatorFeePercentage = 500;
    uint256 public minimumStakingPeriod = 7 days;
    
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
        ftsoV2 = ContractRegistry.getFtsoV2();
        feeCalculator = ContractRegistry.getFeeCalculator();
        randomNumberV2 = ContractRegistry.getRandomNumberV2();
    }
    
    function stake() external payable {
        require(msg.value >= MINIMUM_STAKE, "Stake amount below minimum");
        
        StakerInfo storage stakerInfo = stakers[msg.sender];
        stakerInfo.stakedAmount += msg.value;
        stakerInfo.lastStakeTimestamp = block.timestamp;
        
        emit Staked(msg.sender, msg.value);
    }
    
    function unstake(uint256 _amount) external {
        StakerInfo storage stakerInfo = stakers[msg.sender];
        require(stakerInfo.stakedAmount >= _amount, "Insufficient staked amount");
        require(block.timestamp >= stakerInfo.lastStakeTimestamp + minimumStakingPeriod, "Minimum staking period not met");
        require(stakerInfo.activePoolsCount == 0, "Cannot unstake with active pools");
        
        stakerInfo.stakedAmount -= _amount;
        
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function setCreatorFeePercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 2000, "Fee percentage too high");
        creatorFeePercentage = _percentage;
        emit CreatorFeePercentageUpdated(_percentage);
    }
    
    function setMinimumStakingPeriod(uint256 _period) external onlyOwner {
        minimumStakingPeriod = _period;
    }
    
    function setFtsoV2(address _ftsoV2) external onlyOwner {
        ftsoV2 = FtsoV2Interface(_ftsoV2);
    }
    
    function setFeeCalculator(address _feeCalculator) external onlyOwner {
        feeCalculator = IFeeCalculator(_feeCalculator);
    }
    
    function setRandomNumberProvider(address _randomNumberV2) external onlyOwner {
        require(_randomNumberV2 != address(0), "Invalid RandomNumberV2 address");
        randomNumberV2 = RandomNumberV2Interface(_randomNumberV2);
    }

    
    
}