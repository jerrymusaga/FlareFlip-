import { useState, useEffect } from "react";
import { Pool } from "../../types/generated";
import { usePoolDetails } from "../../hooks/FlareFlipHooks";
import {
  Trophy,
  Users,
  Coins,
  Zap,
  DollarSign,
} from "lucide-react";

interface PoolCardProps {
  pool: Pool;
  address?: `0x${string}` | string;
  onJoinPool: (poolId: string) => Promise<void>;
}

export default function PoolCard({ pool, address, onJoinPool }: PoolCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const { pool: detailedPool } = usePoolDetails(BigInt(pool.id));
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (detailedPool?.marketData) {
      setCurrentPrice(Number(detailedPool.marketData.lastPrice));
    }
  }, [detailedPool]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoinPool(pool.id);
    } finally {
      setIsJoining(false);
    }
  };

  // Button logic based on pool status and user participation
  const getButtonInfo = () => {
    if (pool.creator === address) {
      return {
        text: "Your Pool",
        disabled: true,
        className: "bg-purple-500/10 text-purple-400",
      };
    }
    
    if (pool.creator && address && pool.participants && pool.participants.includes(address)) {
      return {
        text: "Active",
        disabled: true,
        className: "bg-blue-100 text-blue-600",
      };
    }
    
    switch (pool.status) {
      case "open":
        return {
          text: isJoining ? "Joining..." : "Join Pool",
          disabled: isJoining,
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
      case "filling":
        return {
          text: "Almost Full!",
          disabled: false,
          className:
            "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
        };
      case "active":
        return {
          text: "In Progress",
          disabled: true,
          className: "bg-blue-100 text-blue-600 cursor-not-allowed",
        };
      case "completed":
        return {
          text: "Completed",
          disabled: true,
          className: "bg-gray-100 text-gray-500 cursor-not-allowed",
        };
      default:
        return {
          text: "Join Pool",
          disabled: false,
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        };
    }
  };
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
  const buttonInfo = getButtonInfo();

  return (
    <div className="bg-gradient-to-b from-indigo-900/40 to-indigo-950/40 rounded-2xl border border-indigo-600/20 overflow-hidden">
      {/* Pool Header */}
      <div className="relative p-6 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">{pool.asset}</h3>
            <p className="text-indigo-400 text-sm">Pool #{pool.id}</p>
          </div>
          <div className="bg-indigo-900/50 px-3 py-1 rounded-lg border border-indigo-700/30">
            <span className="text-indigo-300 text-xs font-medium">
              {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
            </span>
          </div>
        </div>
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
            <p className="text-xs text-indigo-400 mb-1">Starting price</p>
            <div className="flex items-center gap-1">
              <Trophy size={16} className="text-amber-400" />
              <p className="text-lg font-bold text-white">
              {currentPrice} {  "USD"}
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
                width: `${(pool.currentPlayers / pool.maxPlayers) * 100}%`,
              }}
            ></div>

            {currentPrice && (
              <div className="bg-indigo-800/20 rounded-xl p-3">
                <p className="text-xs text-indigo-400 mb-1">Current Price</p>
                <p className="text-lg font-bold text-white">
                  {currentPrice} {pool.feeToken || "USD"}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap size={16} className={getDifficultyColor(pool.difficulty)} />
              <span
                className={`text-sm ${getDifficultyColor(pool.difficulty)}`}
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
          onClick={handleJoin}
          disabled={buttonInfo.disabled || isJoining}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${buttonInfo.className}`}
        >
          {buttonInfo.text}
        </button>
      </div>
    </div>
  );
}
