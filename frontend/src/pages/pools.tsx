import { useState, useEffect } from "react";
import { useBalance, useAccount } from "wagmi";
import { useStake, useCreatePool } from "../hooks/FlareFlipHooks";
import CreatePoolModal from "../components/modals/CreatePoolModal";
import StakingModal from "../components/modals/StakingModal";
import { StakerInfo, Pool } from "../types/generated";
import PoolsList from "../components/pools/PoolsList";
import { usePools } from "../hooks/usePools";

export default function PoolsPage() {
  const { address, isConnected } = useAccount();
  const { stake } = useStake();
  const { createPool, isPending: isCreatingPool } = useCreatePool();
  const { pool: poolsData } = usePools(); 
  
  // Store pools data
  const [pools, setPools] = useState<Pool[]>([]);
     
  // Load pools data when available
  useEffect(() => {
    if (poolsData && poolsData.length > 0) {
      // Only update if the data is actually different
      const isEqual = JSON.stringify(pools) === JSON.stringify(poolsData);
      if (!isEqual) {
        setPools(poolsData);
      }
    }
  }, [poolsData, pools]);

  // Staking state
  const [stakerInfo, setStakerInfo] = useState<StakerInfo>({
    stakedAmount: 500,
    lastStakeTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    activePoolsCount: 2,
    earnings: 45,
  });
  
  const [showStakingModal, setShowStakingModal] = useState<boolean>(false);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<number>();
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [userBalance, setUserBalance] = useState<number>(1000); // Example initial balance

  // New pool form state
  const [newPool, setNewPool] = useState<{
    asset: string;
    entryFee: number;
    maxPlayers: number;
    difficulty: "easy" | "medium" | "hard" | "expert";
    assetId?: number;
  }>({
    asset: "Ethereum",
    entryFee: 10,
    maxPlayers: 64,
    difficulty: "medium",
  });

  const { data: balanceData,} = useBalance({
    address: address,
    chainId: 114,
  });

  // Handle staking
  const handleStake = () => {
    console.log("Staking amount:", stakeAmount);

    if (!stakeAmount || stakeAmount <= 0) {
      alert("Please enter a valid amount to stake");
      return;
    }

    stake(stakeAmount.toString());
    alert(`Successfully staked ${stakeAmount} FLR`);
    
    // Update staker info (in a real app, this would be fetched from the contract)
    setStakerInfo({
      ...stakerInfo,
      stakedAmount: stakerInfo.stakedAmount + stakeAmount,
      lastStakeTimestamp: Date.now()
    });
  };

  // Handle unstaking
  const handleUnstake = () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      alert("Please enter a valid amount to unstake");
      return;
    }

    const amount = parseFloat(unstakeAmount);
    if (amount > stakerInfo.stakedAmount) {
      alert("Insufficient staked amount");
      return;
    }

    // Check minimum staking period (7 days for demo purposes)
    const minimumStakingPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() < stakerInfo.lastStakeTimestamp + minimumStakingPeriod) {
      alert("Minimum staking period not met (7 days)");
      return;
    }

    // Check active pools
    if (stakerInfo.activePoolsCount > 0) {
      alert("Cannot unstake while you have active pools");
      return;
    }

    // Mock unstaking
    setStakerInfo({
      ...stakerInfo,
      stakedAmount: stakerInfo.stakedAmount - amount,
    });
    setUserBalance(userBalance + amount);
    setUnstakeAmount("");
    alert(`Successfully unstaked ${amount} FLR`);
  };

  const handleCreatePool = async () => {
    try {
      if (newPool.entryFee <= 0 || newPool.maxPlayers <= 1) {
        alert("Entry fee must be > 0 and max players > 1");
        return;
      }
      const MINIMUM_STAKE = 100;
      if (stakerInfo.stakedAmount < MINIMUM_STAKE) {
        alert(`Minimum ${MINIMUM_STAKE} FLR staked required`);
        return;
      }
      const assetSymbol = newPool.asset.toUpperCase();

      console.log("Submitting:", {
        entryFee: newPool.entryFee.toString(),
        maxPlayers: newPool.maxPlayers,
        asset: assetSymbol,
      });

      await createPool(
        newPool.entryFee.toString(),
        newPool.maxPlayers,
        assetSymbol
      );
      setShowCreatePoolModal(false);
      alert("Pool created successfully!");
    } catch (err) {
      console.error("Creation error:", err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Format timestamp to date
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate time remaining for unlock
  const getUnlockTimeRemaining = () => {
    const minimumStakingPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const unlockTime = stakerInfo.lastStakeTimestamp + minimumStakingPeriod;
    const remainingMs = unlockTime - Date.now();

    if (remainingMs <= 0) return "Unlocked";

    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
      (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );

    return `${days}d ${hours}h remaining`;
  };

  // Check if unstaking is allowed
  const canUnstake = () => {
    const minimumStakingPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    return (
      Date.now() >= stakerInfo.lastStakeTimestamp + minimumStakingPeriod &&
      stakerInfo.activePoolsCount === 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-indigo-950">
      {/* Use the PoolsList component for the main UI */}
    
      <PoolsList
        pools={pools}
        stakerInfo={stakerInfo}
        balanceData={balanceData ? {
          formatted: balanceData.formatted,
          symbol: balanceData.symbol
        } : undefined}
        isConnected={isConnected}
        onShowStakingModal={() => setShowStakingModal(true)}
        onShowCreateModal={() => setShowCreatePoolModal(true)}
      />

      {/* Modals */}
      <StakingModal
        showStakingModal={showStakingModal}
        setShowStakingModal={setShowStakingModal}
        stakerInfo={stakerInfo}
        balanceData={
          balanceData
            ? {
                value: Number(balanceData.formatted),
                currency: balanceData.symbol,
              }
            : undefined
        }
        stakeAmount={stakeAmount}
        setStakeAmount={setStakeAmount}
        unstakeAmount={unstakeAmount}
        setUnstakeAmount={setUnstakeAmount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleStake={handleStake}
        handleUnstake={handleUnstake}
        canUnstake={canUnstake}
        formatTimestamp={formatTimestamp}
        getUnlockTimeRemaining={getUnlockTimeRemaining}
      />

      <CreatePoolModal
        showCreatePoolModal={showCreatePoolModal}
        setShowCreatePoolModal={setShowCreatePoolModal}
        stakerInfo={stakerInfo}
        newPool={newPool}
        setNewPool={setNewPool}
        handleCreatePool={handleCreatePool}
        isCreatingPool={isCreatingPool}
        error={null}
      />
    </div>
  );
}