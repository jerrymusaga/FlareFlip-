import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Pool } from "../../types/generated";
import { usePoolDetails, useUserPools } from "../../hooks/FlareFlipHooks";
import { motion } from "framer-motion";

import {
  Trophy,
  Users,
  Coins,
  Zap,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface PoolCardProps {
  pool: Pool;
  address?: `0x${string}` | string;
  onJoinPool: (poolId: string) => Promise<void>;
  onPlayPool?: (poolId: string) => Promise<void>;
  isRecentlyJoined?: boolean; // Flag to activate pulse animation
}

export default function PoolCard({
  pool,
  isRecentlyJoined = false,
  address,
  onJoinPool,
  onPlayPool,
}: PoolCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const { userPoolIds } = useUserPools();
  const { pool: detailedPool } = usePoolDetails(BigInt(pool.id));
  const [AssetPrice, setCurrentPrice] = useState({
    startPrice: 0,
    lastPrice: 0,
  });
  const navigate = useNavigate();
  const [priceChanged, setPriceChanged] = useState(false);
  const prevPrice = useRef({ startPrice: 0, lastPrice: 0 });

  // Track price movement direction
  const [priceMovement, setPriceMovement] = useState({
    direction: "none", // 'up', 'down', or 'none'
    percentage: 0,
  });

  const isUserInPool = userPoolIds.some((poolId) => poolId === BigInt(pool.id));

  useEffect(() => {
    if (detailedPool?.marketData) {
      // Convert from Wei to regular units without losing precision for small numbers
      const startPrice = Number(detailedPool.marketData.startPrice) / 10 ** 18;
      const lastPrice = Number(detailedPool.marketData.lastPrice) / 10 ** 18;

      const formattedStartPrice = formatPrice(startPrice);
      const formattedLastPrice = formatPrice(lastPrice);

      // Check if we have previous prices to compare
      if (prevPrice.current.startPrice !== 0) {
        // Compare with previous values to determine movement
        if (formattedLastPrice > prevPrice.current.lastPrice) {
          const percentChange =
            prevPrice.current.lastPrice !== 0
              ? ((formattedLastPrice - prevPrice.current.lastPrice) /
                  prevPrice.current.lastPrice) *
                100
              : 0;

          setPriceMovement({
            direction: "up",
            percentage: formatPrice(percentChange),
          });
        } else if (formattedLastPrice < prevPrice.current.lastPrice) {
          const percentChange =
            prevPrice.current.lastPrice !== 0
              ? ((prevPrice.current.lastPrice - formattedLastPrice) /
                  prevPrice.current.lastPrice) *
                100
              : 0;

          setPriceMovement({
            direction: "down",
            percentage: formatPrice(percentChange),
          });
        }
      } else if (pool.status === "active") {
        // For existing active pools, initialize with a comparison to starting price
        // This ensures existing pools show some movement indicator
        if (formattedLastPrice > formattedStartPrice) {
          const percentChange =
            ((formattedLastPrice - formattedStartPrice) / formattedStartPrice) *
            100;
          setPriceMovement({
            direction: "up",
            percentage: formatPrice(percentChange),
          });
        } else if (formattedLastPrice < formattedStartPrice) {
          const percentChange =
            ((formattedStartPrice - formattedLastPrice) / formattedStartPrice) *
            100;
          setPriceMovement({
            direction: "down",
            percentage: formatPrice(percentChange),
          });
        }
      }

      // Update current price state
      setCurrentPrice({
        startPrice: formattedStartPrice,
        lastPrice: formattedLastPrice,
      });

      // Update previous price reference
      prevPrice.current = {
        startPrice: formattedStartPrice,
        lastPrice: formattedLastPrice,
      };

      // Trigger animation
      setPriceChanged(true);
      setTimeout(() => setPriceChanged(false), 2000);
    }
  }, [detailedPool, pool.status]);

  // Set pulsing effect when the pool is recently joined
  useEffect(() => {
    if (isRecentlyJoined) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isRecentlyJoined]);

  // Helper function to format prices
  const formatPrice = (price: number): number => {
    // For very small numbers (less than 0.01), keep more decimal places
    if (Math.abs(price) < 0.01 && price !== 0) {
      // Return with 4-8 significant digits based on how small the number is
      const significantDigits = price < 0.0001 ? 8 : price < 0.001 ? 6 : 4;
      return parseFloat(price.toFixed(significantDigits));
    }

    // For normal numbers, keep 2 decimal places
    return parseFloat(price.toFixed(2));
  };

  useEffect(() => {
    if (detailedPool?.marketData) {
      // Convert from Wei to regular units without losing precision for small numbers
      const startPrice = Number(detailedPool.marketData.startPrice) / 10 ** 18;
      const lastPrice = Number(detailedPool.marketData.lastPrice) / 10 ** 18;

      setCurrentPrice({
        startPrice: formatPrice(startPrice),
        lastPrice: formatPrice(lastPrice),
      });
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

  const handlePlay = async () => {
    setIsPlaying(true);
    try {
      if (onPlayPool) {
        await onPlayPool(pool.id);
      }
      // Navigate to the play section with the poolId
      navigate(`/playsection/${pool.id}`);
    } finally {
      setIsPlaying(false);
    }
  };
   console.log(pool.currentPlayers)
  const getButtonInfo = () => {
    // If user created this pool
    if (pool.creator === address) {
      return {
        text: "Your Pool",
        disabled: true,
        className: "bg-purple-500/10 text-purple-400",
        onClick: () => {},
      };
    }

    if (isUserInPool) {
      // If pool is active and user is in pool, show Play button
      if (pool.status === "open" && pool.currentPlayers == pool.maxPlayers) {
        return {
          text: isPlaying ? "Playing..." : "Play Now",
          disabled: isPlaying,
          className:
            "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white",
          onClick: handlePlay,
        };
      } else {
        return {
          text: "You've Joined",
          disabled: true,
          className: "bg-blue-100 text-blue-600",
          onClick: () => {},
        };
      }
    }

    switch (pool.status) {
      case "open":
        return {
          text: isJoining ? "Joining..." : "Join Pool",
          disabled: isJoining,
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
          onClick: handleJoin,
        };
      case "active":
        return {
          text: "Play Now",
          disabled: isJoining,
          className: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white",
          onClick: handlePlay,
        };
      case "completed":
        return {
          text: "Completed",
          disabled: true,
          className: "bg-gray-100 text-gray-500 cursor-not-allowed",
          onClick: () => {},
        };
      default:
        return {
          text: "Join Pool",
          disabled: false,
          className:
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
          onClick: handleJoin,
        };
    }
  };

  const buttonInfo = getButtonInfo();

  // Get price movement class for colors
  const getPriceMovementClass = () => {
    if (priceMovement.direction === "up") {
      return "text-green-400";
    } else if (priceMovement.direction === "down") {
      return "text-red-400";
    }
    return "text-indigo-400";
  };

  return (
    <motion.div
      animate={{
        scale: isPulsing ? [1, 1.02, 1] : 1,
        boxShadow: isPulsing ? "0 0 10px rgba(139, 92, 246, 0.5)" : "none",
      }}
      transition={{
        duration: 1,
        repeat: isPulsing ? 3 : 0,
        ease: "easeInOut",
      }}
      className="bg-gradient-to-b from-indigo-900/40 to-indigo-950/40 rounded-2xl border border-indigo-600/20 overflow-hidden relative"
    >
      {isPulsing && (
        <div className="absolute inset-0 rounded-2xl border-2 border-purple-400 pointer-events-none animate-ping opacity-70"></div>
      )}

      {/* Pool Header */}
      <div className="relative p-6 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">
              {pool.asset} / {"USD"}
            </h3>
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
              <DollarSign size={16} className="text-amber-400" />
              <motion.p
                className={`text-lg font-bold ${
                  priceChanged ? "text-green-400" : "text-white"
                }`}
                animate={{
                  scale: priceChanged ? [1, 1.1, 1] : 1,
                  transition: { duration: 0.5 },
                }}
              >
                {AssetPrice.startPrice} {"USD"}
              </motion.p>
            </div>
          </div>

          <div className="bg-indigo-800/20 rounded-xl p-3">
            <p className="text-xs text-indigo-400 mb-1">Prize Pool</p>
            <div className="flex items-center gap-1">
              <Trophy size={16} className="text-amber-400" />
              <p className="text-lg font-bold text-white">
                {pool.potentialReward} {pool.feeToken}
              </p>
            </div>
          </div>

          <div className="bg-indigo-800/20 rounded-xl p-3">
            <p className="text-xs text-indigo-400 mb-1">Last Price</p>
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-amber-400" />
              <motion.p
                className={`text-lg font-bold ${
                  priceChanged ? "text-green-400" : "text-white"
                }`}
                animate={{
                  scale: priceChanged ? [1, 1.1, 1] : 1,
                  transition: { duration: 0.5 },
                }}
              >
                {AssetPrice.lastPrice} {"USD"}
              </motion.p>

              {/* Price movement indicator */}
              {priceMovement.direction !== "none" && (
                <div
                  className={`flex items-center ml-1 ${getPriceMovementClass()}`}
                >
                  {priceMovement.direction === "up" ? (
                    <ChevronUp size={14} className="text-green-400" />
                  ) : (
                    <ChevronDown size={14} className="text-red-400" />
                  )}
                  <span className="text-xs font-medium">
                    {priceMovement.percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Updated Players Section with animation */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <span className="text-sm text-indigo-300">Players</span>
            </div>
            <motion.span
              key={`players-${pool.currentPlayers}`}
              initial={{ scale: 1.5, color: "#a78bfa" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{ duration: 0.5 }}
              className="text-sm font-medium text-white"
            >
              {pool.currentPlayers}/{pool.maxPlayers}
            </motion.span>
          </div>

          <div className="w-full bg-indigo-900/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
              style={{
                width: `${(pool.currentPlayers / pool.maxPlayers) * 100}%`,
              }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              <span className="text-sm text-indigo-300">
                MaxWiners : {pool.maxWinners}
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
          onClick={buttonInfo.onClick}
          disabled={buttonInfo.disabled}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${buttonInfo.className}`}
        >
          {buttonInfo.text}
        </button>
      </div>
    </motion.div>
  );
}
