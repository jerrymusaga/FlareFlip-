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
  Wallet,
  Lock,
  Unlock,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { Pool } from "../types/generated";
import { StakerInfo } from "../types/generated";
import { useStake, useSupportedAssets } from "../hooks/FlareFlipHooks";
// Types

export default function GamingPoolsSection() {
  const { address, isConnected } = useAccount();
  const { stake, isPending, isLoading, isSuccess, totalStaked } = useStake();

  // const { supportedAssets } = useSupportedAssets(0);
  // console.log("Supported Assets:", supportedAssets);
  // const [inputAmount, setInputAmount] = useState("");

  // Mock data with more variety for demonstration
  const [pools, setPools] = useState<Pool[]>([
    {
      id: "eth-classic",
      asset: "Ethereum",
      icon: "/ethereum.svg",
      entryFee: 10,
      feeToken: "FLR",
      maxPlayers: 64,
      currentPlayers: 28,
      status: "open",
      potentialReward: 640,
      difficulty: "medium",
      popularity: 8,
      creator: "0x71C...F39A",
    },
    {
      id: "btc-royale",
      asset: "Bitcoin",
      icon: "/bitcoin.svg",
      entryFee: 25,
      feeToken: "FLR",
      maxPlayers: 32,
      currentPlayers: 32,
      status: "active",
      timeRemaining: 120,
      potentialReward: 800,
      difficulty: "hard",
      popularity: 9,
      creator: "0x82D...A42B",
    },
    {
      id: "sol-sprint",
      asset: "Solana",
      icon: "/solana.svg",
      entryFee: 5,
      feeToken: "FLR",
      maxPlayers: 128,
      currentPlayers: 42,
      status: "open",
      potentialReward: 640,
      difficulty: "easy",
      popularity: 7,
      creator: "0x71C...F39A",
    },
    {
      id: "flare-fusion",
      asset: "Flare",
      icon: "/flare.svg",
      entryFee: 50,
      feeToken: "FLR",
      maxPlayers: 16,
      currentPlayers: 16,
      status: "completed",
      potentialReward: 800,
      difficulty: "expert",
      popularity: 6,
      creator: "0x45B...C78D",
    },
    {
      id: "avax-arena",
      asset: "Avalanche",
      icon: "/avax.svg",
      entryFee: 15,
      feeToken: "FLR",
      maxPlayers: 48,
      currentPlayers: 12,
      status: "open",
      potentialReward: 720,
      difficulty: "medium",
      popularity: 5,
      creator: "0x91A...D25E",
    },
    {
      id: "dot-duel",
      asset: "Polkadot",
      icon: "/polkadot.svg",
      entryFee: 8,
      feeToken: "FLR",
      maxPlayers: 64,
      currentPlayers: 58,
      status: "filling",
      potentialReward: 512,
      difficulty: "medium",
      popularity: 7,
      creator: "0x82D...A42B",
    },
    {
      id: "ada-arena",
      asset: "Cardano",
      icon: "/cardano.svg",
      entryFee: 12,
      feeToken: "FLR",
      maxPlayers: 32,
      currentPlayers: 14,
      status: "open",
      potentialReward: 384,
      difficulty: "easy",
      popularity: 6,
      creator: "0x71C...F39A",
    },
    {
      id: "matic-mayhem",
      asset: "Polygon",
      icon: "/polygon.svg",
      entryFee: 6,
      feeToken: "FLR",
      maxPlayers: 100,
      currentPlayers: 87,
      status: "filling",
      potentialReward: 600,
      difficulty: "hard",
      popularity: 8,
      creator: "0x45B...C78D",
    },
    {
      id: "bnb-battle",
      asset: "Binance",
      icon: "/bnb.svg",
      entryFee: 18,
      feeToken: "FLR",
      maxPlayers: 48,
      currentPlayers: 48,
      status: "active",
      timeRemaining: 300,
      potentialReward: 864,
      difficulty: "hard",
      popularity: 9,
      creator: "0x91A...D25E",
    },
    {
      id: "xrp-xtreme",
      asset: "XRP",
      icon: "/xrp.svg",
      entryFee: 20,
      feeToken: "FLR",
      maxPlayers: 24,
      currentPlayers: 3,
      status: "open",
      potentialReward: 480,
      difficulty: "medium",
      popularity: 4,
      creator: "0x71C...F39A",
    },
  ]);
 
 
  const [stakerInfo, setStakerInfo] = useState<StakerInfo>({
    stakedAmount: 500,
    lastStakeTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
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
  const [newPool, setNewPool] = useState({
    asset: "Ethereum",
    entryFee: 10,
    maxPlayers: 64,
    difficulty: "medium" as "easy" | "medium" | "hard" | "expert",
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
  const joinPool = (poolId: string) => {
    setAnimatingPoolId(poolId);
    setTimeout(() => {
      setAnimatingPoolId(null);
      alert(`Connecting wallet to join ${poolId}`);
    }, 800);
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

  // Handle pool creation
  const handleCreatePool = () => {
    // Validate inputs
    if (newPool.entryFee <= 0 || newPool.maxPlayers <= 1) {
      alert("Please provide valid pool parameters");
      return;
    }

    // Check if user has staked enough (minimum 100 FLR for demo)
    const MINIMUM_STAKE = 100;
    if (stakerInfo.stakedAmount < MINIMUM_STAKE) {
      alert(`You need to stake at least ${MINIMUM_STAKE} FLR to create a pool`);
      return;
    }

    // Create new pool
    const newPoolId = `${newPool.asset.toLowerCase()}-${Math.floor(
      Math.random() * 10000
    )}`;
    const createdPool: Pool = {
      id: newPoolId,
      asset: newPool.asset,
      icon: `/${newPool.asset.toLowerCase()}.svg`,
      entryFee: newPool.entryFee,
      feeToken: "FLR",
      maxPlayers: newPool.maxPlayers,
      currentPlayers: 0,
      status: "open",
      potentialReward: newPool.entryFee * newPool.maxPlayers,
      difficulty: newPool.difficulty,
      popularity: 5, // Default popularity
      creator: userAddress,
    };

    setPools([createdPool, ...pools]);
    setStakerInfo({
      ...stakerInfo,
      activePoolsCount: stakerInfo.activePoolsCount + 1,
    });
    setShowCreatePoolModal(false);
    alert(`Successfully created ${newPool.asset} pool!`);
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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "hard":
        return "text-orange-500";
      case "expert":
        return "text-red-500";
      default:
        return "text-gray-500";
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
    switch (pool.status) {
      case "open":
        return {
          text: "Join Pool",
          disabled: false,
          action: () => joinPool(pool.id),
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
      case "filling":
        return {
          text: "Almost Full!",
          disabled: false,
          action: () => joinPool(pool.id),
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
          action: () => joinPool(pool.id),
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
    }
  };

  // StakingModal Component
  const StakingModal = () => {
    if (!showStakingModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 max-w-md w-full border border-indigo-700/30 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Stake & Earn</h2>
            <button
              onClick={() => setShowStakingModal(false)}
              className="text-indigo-300 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Staking Info Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-800/30 rounded-xl p-4 border border-indigo-700/30">
              <p className="text-xs text-indigo-300 mb-1">Total Staked</p>
              <p className="text-2xl font-bold text-white">
                {stakerInfo.stakedAmount} FLR
              </p>
            </div>
            <div className="bg-indigo-800/30 rounded-xl p-4 border border-indigo-700/30">
              <p className="text-xs text-indigo-300 mb-1">Earnings</p>
              <p className="text-2xl font-bold text-green-400">
                +{stakerInfo.earnings} FLR
              </p>
            </div>
          </div>

          {/* Lock Status */}
          <div className="bg-indigo-800/20 rounded-xl p-4 border border-indigo-700/30 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {canUnstake() ? (
                  <Unlock size={18} className="text-green-400" />
                ) : (
                  <Lock size={18} className="text-amber-400" />
                )}
                <p className="text-sm font-medium text-white">Lock Status</p>
              </div>
              <span
                className={`text-sm ${
                  canUnstake() ? "text-green-400" : "text-amber-400"
                }`}
              >
                {getUnlockTimeRemaining()}
              </span>
            </div>
            <div className="mt-2 text-xs text-indigo-300">
              <p>
                Last staked: {formatTimestamp(stakerInfo.lastStakeTimestamp)}
              </p>
              <p>Active pools: {stakerInfo.activePoolsCount}</p>
              {!canUnstake() && stakerInfo.activePoolsCount > 0 && (
                <p className="text-amber-400 mt-1">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Cannot unstake while pools are active
                </p>
              )}
            </div>
          </div>

          {/* Tabs for Stake/Unstake */}
          <div className="flex rounded-lg overflow-hidden border border-indigo-700/30 mb-6">
            <button
              onClick={() => setActiveTab("stake")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "stake"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab("unstake")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "unstake"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50"
              }`}
            >
              Unstake
            </button>
          </div>

          {/* Stake Form */}
          {activeTab === "stake" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Amount to Stake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                    FLR
                  </span>
                </div>
                <p className="text-xs text-indigo-400 mt-1">
                  Balance: {balanceData?.formatted || "0.00"} FLR
                </p>
              </div>

              <div className="mb-4 text-xs text-indigo-300">
                <p className="mb-1">• Minimum staking period: 7 days</p>
                <p className="mb-1">• Cannot unstake while pools are active</p>
                <p>• Earn 2% from pool entry fees as creator rewards</p>
              </div>

              <button
                onClick={handleStake}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                Stake FLR
              </button>
            </div>
          )}

          {/* Unstake Form */}
          {activeTab === "unstake" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Amount to Unstake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!canUnstake()}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                    FLR
                  </span>
                </div>
                <p className="text-xs text-indigo-400 mt-1">
                  Staked: {stakerInfo.stakedAmount} FLR
                </p>
              </div>

              {!canUnstake() && (
                <div className="mb-4 p-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                  <p className="text-xs text-amber-400 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    {stakerInfo.activePoolsCount > 0
                      ? "You have active pools. Close them before unstaking."
                      : "Minimum staking period not met yet."}
                  </p>
                </div>
              )}

              <button
                onClick={handleUnstake}
                disabled={!canUnstake()}
                className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 ${
                  canUnstake()
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    : "bg-indigo-900/50 text-indigo-400 cursor-not-allowed"
                }`}
              >
                Unstake FLR
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Create Pool Modal Component
  const CreatePoolModal = () => {
    if (!showCreatePoolModal) return null;

    const assetOptions = [
      "Ethereum",
      "Bitcoin",
      "Solana",
      "Flare",
      "Avalanche",
      "Polkadot",
      "Cardano",
      "Polygon",
      "Binance",
      "XRP",
    ];

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 max-w-md w-full border border-indigo-700/30 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Pool</h2>
            <button
              onClick={() => setShowCreatePoolModal(false)}
              className="text-indigo-300 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Pool Creation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">
                Select Asset
              </label>
              <select
                value={newPool.asset}
                onChange={(e) =>
                  setNewPool({ ...newPool, asset: e.target.value })
                }
                className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {assetOptions.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">
                Entry Fee (FLR)
              </label>
              <input
                type="number"
                value={newPool.entryFee}
                onChange={(e) =>
                  setNewPool({ ...newPool, entryFee: Number(e.target.value) })
                }
                min="1"
                className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">
                Maximum Players
              </label>
              <input
                type="number"
                value={newPool.maxPlayers}
                onChange={(e) =>
                  setNewPool({ ...newPool, maxPlayers: Number(e.target.value) })
                }
                min="2"
                className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-300 mb-1">
                Difficulty
              </label>
              <select
                value={newPool.difficulty}
                onChange={(e) =>
                  setNewPool({ ...newPool, difficulty: e.target.value as any })
                }
                className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/30">
              <h4 className="text-sm font-medium text-purple-300 mb-2">
                Pool Summary
              </h4>
              <p className="text-xs text-indigo-300">
                Total Pool Size: {newPool.entryFee * newPool.maxPlayers} FLR
              </p>
              <p className="text-xs text-indigo-300">
                Creator Fee:{" "}
                {Math.round(newPool.entryFee * newPool.maxPlayers * 0.02)} FLR
                (2%)
              </p>
              <p className="text-xs text-indigo-300">
                Platform Fee:{" "}
                {Math.round(newPool.entryFee * newPool.maxPlayers * 0.01)} FLR
                (1%)
              </p>
              <p className="text-xs text-green-400 font-medium mt-1">
                Player Payout:{" "}
                {Math.round(newPool.entryFee * newPool.maxPlayers * 0.97)} FLR
              </p>
            </div>

            {stakerInfo.stakedAmount < 100 && (
              <div className="mt-2 p-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                <p className="text-xs text-amber-400 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  You need at least 100 FLR staked to create a pool
                </p>
              </div>
            )}

            <button
              onClick={handleCreatePool}
              disabled={stakerInfo.stakedAmount < 100}
              className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 mt-4 ${
                stakerInfo.stakedAmount >= 100
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  : "bg-indigo-900/50 text-indigo-400 cursor-not-allowed"
              }`}
            >
              Create Pool
            </button>
          </div>
        </div>
      </div>
    );
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
                <span>
                  Stake{" "}
                </span>
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
                      <p className="text-xs text-indigo-400 mb-1">Reward</p>
                      <div className="flex items-center gap-1">
                        <Trophy size={16} className="text-amber-400" />
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
      <StakingModal />
      <CreatePoolModal />
    </div>
  );
}
