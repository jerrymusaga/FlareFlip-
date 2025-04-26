import { useState, useEffect } from "react";
import {
  Trophy,
  Users,
  Coins,
  Clock,
  Zap,
  ArrowRight,
  Flame,
  Plus,
  DollarSign,
} from "lucide-react";
import { useJoinPool } from "../hooks/useJoinPool";
import { useAccount, useBalance } from "wagmi";
import CreatePoolModal from "../components/modals/CreatePoolModal";
import StakingModal from "../components/modals/StakingModal";
import { Pool } from "../types/generated";
import { StakerInfo } from "../types/generated";
import { usePools } from "../hooks/usePools";
import { useStake, useCreatePool } from "../hooks/FlareFlipHooks";

export default function GamingPoolsSection() {
  const { address, isConnected } = useAccount();
  const { joinPool, isPending: isJoiningPool } = useJoinPool();
  const { stake } = useStake();
  const { pool } = usePools();

  const { createPool, isPending: isCreatingPool } = useCreatePool();

  const [pools, setPools] = useState<Pool[]>([]);

  useEffect(() => {
    setPools(pool);
  }, [pool]);

  const [stakerInfo, setStakerInfo] = useState<StakerInfo>({
    stakedAmount: 500,
    lastStakeTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    activePoolsCount: 2,
    earnings: 45,
  });

  // UI state
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visiblePools, setVisiblePools] = useState<number>(6);
  const [animatingPoolId, setAnimatingPoolId] = useState<string | null>(null);
  const [showStakingModal, setShowStakingModal] = useState<boolean>(false);
  const [showCreatePoolModal, setShowCreatePoolModal] =
    useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<number>();
  const [unstakeAmount, setUnstakeAmount] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");

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

  const { data: balanceData, isError } = useBalance({
    address: address,
    chainId: 114,
  });

  // Simulate loading more pools
  const loadMorePools = () => {
    if (visiblePools < filteredPools.length) {
      setVisiblePools((prev) => Math.min(prev + 6, filteredPools.length));
    }
  };

  // Add animation effect when joining a pool

  const HandlejoinPool = async (poolId: string) => {
    try {
      setAnimatingPoolId(poolId);

      const pool = pools.find((p) => p.id === poolId);
      if (!pool) {
        throw new Error("Pool not found");
      }
      const numericPoolId = Number(poolId);

      await joinPool(numericPoolId, pool.entryFee.toString());

      setPools((prevPools) =>
        prevPools.map((p) =>
          p.id === poolId ? { ...p, currentPlayers: p.currentPlayers + 1 } : p
        )
      );
    } catch (err) {
      console.error("Join pool error:", err);
      alert(
        `Failed to join pool: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setAnimatingPoolId(null);
    }
  };

  // Handle staking
  const handleStake = () => {
    console.log("Staking amount:", stakeAmount);

    if (!stakeAmount || stakeAmount <= 0) {
      alert("Please enter a valid amount to stake");
      return;
    }

    stake(stakeAmount.toString());
    // setInputAmount("");
    alert(`Successfully staked ${stakeAmount} FLR`);
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
    } catch (err) {
      console.error("Creation error:", err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  // Filter, sort and search pools
  const filteredPools = pools
    .filter((pool) => {
      // Filter by status
      const statusMatch =
        activeFilter === "all" || pool.status === activeFilter;

      // Filter by search
      const searchMatch =
        !searchQuery ||
        pool.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.id.toLowerCase().includes(searchQuery.toLowerCase());

      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.popularity - a.popularity;
        case "reward":
          return b.potentialReward - a.potentialReward;
        case "fee":
          return a.entryFee - b.entryFee;
        case "filling":
          return (
            b.currentPlayers / b.maxPlayers - a.currentPlayers / a.maxPlayers
          );
        default:
          return 0;
      }
    });

  // Format time remaining in minutes and seconds
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // Get difficulty color
 

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

  // Simulate time decreasing for active pools
  useEffect(() => {
    const timer = setInterval(() => {
      setPools((prevPools) =>
        prevPools.map((pool) => {
          if (pool.status === "active" && pool.timeRemaining) {
            const newTime = pool.timeRemaining - 1;
            if (newTime <= 0) {
              return { ...pool, status: "completed", timeRemaining: undefined };
            }
            return { ...pool, timeRemaining: newTime };
          }
          return pool;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get appropriate button info based on pool status
  const getButtonInfo = (pool: Pool) => {
    const isJoiningThisPool = isJoiningPool && animatingPoolId === pool.id;
    switch (pool.status) {
      case "open":
        return {
          text: isJoiningThisPool ? "Joining..." : "Join Pool",
          disabled: isJoiningPool,
          action: () => HandlejoinPool(pool.id),
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
      case "filling":
        return {
          text: "Almost Full!",
          disabled: false,
          action: () => HandlejoinPool(pool.id),
          className:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
        };
      case "active":
        return {
          text: "In Progress",
          disabled: true,
          action: () => {},
          className: "bg-blue-100 text-blue-600 cursor-not-allowed",
        };
      case "completed":
        return {
          text: "Completed",
          disabled: true,
          action: () => {},
          className: "bg-gray-100 text-gray-500 cursor-not-allowed",
        };
      default:
        return {
          text: "Join Pool",
          disabled: false,
          action: () => HandlejoinPool(pool.id),
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-indigo-950">
      {/* Header & Controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gaming Pools</h1>
            <p className="text-indigo-300">
              Earn rewards by predicting price movements in competitive pools
            </p>
          </div>

          {/* Wallet Status */}
          <div className="mt-4 md:mt-0">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-900/30 rounded-xl px-4 py-2 border border-indigo-600/30">
                <span className="text-xs text-indigo-400">Balance</span>
                <div className="flex items-center gap-1 mt-1">
                  <Coins size={14} className="text-amber-400" />
                  <span className="font-medium text-white">
                    {balanceData?.formatted || "0.00"} FLR
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowStakingModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all duration-200"
              >
                <Flame size={18} />
                <span>Stake </span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/30"
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setActiveFilter("open")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === "open"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/30"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setActiveFilter("filling")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === "filling"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/30"
              }`}
            >
              Filling Fast
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === "active"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/30"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                activeFilter === "completed"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/30"
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-indigo-900/30 border border-indigo-600/30 rounded-lg py-2 pl-4 pr-10 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-64"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                🔍
              </span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-indigo-900/30 border border-indigo-600/30 rounded-lg py-2 px-4 text-indigo-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="popularity">Popular</option>
              <option value="reward">Highest Reward</option>
              <option value="fee">Lowest Fee</option>
              <option value="filling">Filling Fast</option>
            </select>

            {isConnected && stakerInfo.stakedAmount >= 100 && (
              <button
                onClick={() => setShowCreatePoolModal(true)}
                className="flex items-center gap-1 bg-indigo-900/50 hover:bg-indigo-900/70 text-white py-2 px-3 rounded-lg border border-indigo-600/30 transition-all duration-200"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Create</span>
              </button>
            )}
          </div>
        </div>

        {/* Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.slice(0, visiblePools).map((pool) => {
            const buttonInfo = getButtonInfo(pool);
            return (
              <div
                key={pool.id}
                className={`bg-gradient-to-b from-indigo-900/40 to-indigo-950/40 rounded-2xl border border-indigo-600/20 overflow-hidden transform transition-all duration-300 ${
                  animatingPoolId === pool.id ? "scale-95 opacity-80" : ""
                }`}
              >
                {/* Pool Header */}
                <div className="relative p-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-800 flex items-center justify-center">
                        <img
                          src={pool.icon}
                          alt={pool.asset}
                          className="w-6 h-6"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {pool.asset}
                        </h3>
                        <p className="text-xs text-indigo-400">{pool.id}</p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pool.status === "open"
                          ? "bg-green-500/20 text-green-400"
                          : pool.status === "filling"
                          ? "bg-amber-500/20 text-amber-400"
                          : pool.status === "active"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {pool.status.charAt(0).toUpperCase() +
                        pool.status.slice(1)}
                    </div>
                  </div>

                  {pool.timeRemaining && (
                    <div className="absolute top-6 right-6 mt-8 flex items-center gap-1 text-sm text-red-400">
                      <Clock size={14} />
                      <span>{formatTimeRemaining(pool.timeRemaining)}</span>
                    </div>
                  )}
                </div>

                {/* Pool Info */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-indigo-800/20 rounded-xl p-3">
                      <p className="text-xs text-indigo-400 mb-1">Entry Fee</p>
                      <div className="flex items-center gap-1">
                        <Coins size={16} className="text-amber-400" />
                        <p className="text-lg font-bold text-white">
                          {pool.entryFee} {pool.feeToken}
                        </p>
                      </div>
                    </div>
                    <div className="bg-indigo-800/20 rounded-xl p-3">
                      <p className="text-xs text-indigo-400 mb-1">
                        Starting price
                      </p>
                      <div className="flex items-center gap-1">
                        <Trophy size={16} className="text-amber-400" />
                        <p className="text-lg font-bold text-white">
                          {pool.potentialReward} {pool.feeToken}
                        </p>
                      </div>
                    </div>
                    {/* price fee, current price and last price */}
                    <div className="bg-indigo-800/20 rounded-xl p-3">
                      <p className="text-xs text-indigo-400 mb-1">Reward</p>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-amber-400" />
                        <p className="text-lg font-bold text-white">
                          {pool.potentialReward} {pool.feeToken}
                        </p>
                      </div>
                    </div>
                    <div className="bg-indigo-800/20 rounded-xl p-3">
                      <p className="text-xs text-indigo-400 mb-1">Last Price</p>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} className="text-amber-400" />
                        <p className="text-lg font-bold text-white">
                          {pool.potentialReward} {pool.feeToken}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-indigo-400" />
                        <span className="text-sm text-indigo-300">Players</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {pool.currentPlayers}/{pool.maxPlayers}
                      </span>
                    </div>

                    <div className="w-full bg-indigo-900/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        style={{
                          width: `${
                            (pool.currentPlayers / pool.maxPlayers) * 100
                          }%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap
                          size={16}
                          className={getDifficultyColor(pool.difficulty)}
                        />
                        <span
                          className={`text-sm ${getDifficultyColor(
                            pool.difficulty
                          )}`}
                        >
                          {pool.difficulty.charAt(0).toUpperCase() +
                            pool.difficulty.slice(1)}
                        </span>
                      </div>

                      {pool.creator && pool.creator === address && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                          Your Pool
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={buttonInfo.action}
                    disabled={buttonInfo.disabled}
                    className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${buttonInfo.className}`}
                  >
                    {buttonInfo.text}
                    {!buttonInfo.disabled && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {visiblePools < filteredPools.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMorePools}
              className="bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 py-2 px-6 rounded-lg border border-indigo-700/30 transition-all duration-200"
            >
              Load More Pools
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredPools.length === 0 && (
          <div className="text-center py-16">
            <p className="text-indigo-400 mb-4">
              No pools found matching your criteria
            </p>
            <button
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
              className="bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 py-2 px-6 rounded-lg border border-indigo-700/30 transition-all duration-200"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

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
      />
    </div>
  );
}
