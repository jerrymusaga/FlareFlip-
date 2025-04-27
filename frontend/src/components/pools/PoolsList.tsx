import { useQueryClient } from "@tanstack/react-query";

import { useState, useEffect, useCallback } from "react";
import { Coins, Flame, Plus, Users, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { Pool, StakerInfo } from "../../types/generated";
import PoolCard from "./PoolCard";
import { useJoinPool } from "../../hooks/useJoinPool";
import { toast } from "sonner";
import { usePoolEvents } from "../../hooks/usePoolEvents";
import { CONTRACT_ADDRESS } from "../../hooks/ABI/address";

interface PoolsListProps {
  pools: Pool[];
  stakerInfo: StakerInfo;
  balanceData?: { formatted: string; symbol: string };
  isConnected: boolean;
  onShowStakingModal: () => void;
  onShowCreateModal: () => void;
  onPlay: (poolId: string) => void; // Add this new prop
}

export default function PoolsList({
  pools: initialPools,
  stakerInfo,
  balanceData,
  isConnected,
  onShowStakingModal,
  onShowCreateModal,
}: PoolsListProps) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { joinPool, isPending: isJoiningPool } = useJoinPool();

  const [pools, setPools] = useState<Pool[]>(initialPools);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePools, setVisiblePools] = useState(6);
  const [recentlyJoinedPools, setRecentlyJoinedPools] = useState<Set<string>>(
    new Set()
  );

  // Update pools when initialPools changes
  useEffect(() => {
    if (initialPools && initialPools.length > 0) {
      setPools(initialPools);
    }
  }, [initialPools]);

  // Handle player joined event
  const handlePlayerJoined = useCallback(
    (poolId: bigint, player: string) => {
      // Update the pools state when a player joins
      setPools((prevPools) =>
        prevPools.map((pool) => {
          if (pool.id === poolId.toString()) {
            // Check if this join will fill the pool to maximum capacity
            const newPlayerCount = pool.currentPlayers + 1;
            const willBecomeFull = newPlayerCount >= pool.maxPlayers;
            const isAlmostFull = newPlayerCount >= pool.maxPlayers * 0.8;

            // Determine the new status
            let newStatus = pool.status;
            if (willBecomeFull) {
              newStatus = "active";
            } else if (isAlmostFull && pool.status === "open") {
              newStatus = "active";
            }

            // Calculate new potential reward by adding entry fee
            const newPotentialReward = pool.potentialReward + pool.entryFee;

            // Create updated pool object
            const updatedPool = {
              ...pool,
              currentPlayers: newPlayerCount,
              potentialReward: newPotentialReward,
              status: newStatus,
            };

            // If the pool status transitions to active, handle market data updates
            if (newStatus === "active" && pool.status !== "active") {
              // Immediately force a refresh of market data from blockchain
              queryClient.invalidateQueries({
                queryKey: [
                  "wagmi.readContract",
                  {
                    address: CONTRACT_ADDRESS,
                    functionName: "poolMarketData",
                    args: [BigInt(poolId)],
                  },
                ],
              });

              // Show toast notification that the pool is now active with a colorful design
              toast.custom(
                (t) => (
                  <div
                    className={`${
                      t ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-gradient-to-r from-indigo-900 to-purple-900 shadow-lg rounded-lg pointer-events-auto border border-indigo-500`}
                  >
                    <div className="p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 pt-0.5">
                          <Zap
                            size={24}
                            className="text-yellow-400 animate-pulse"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-white">
                            Pool #{poolId} is now active!
                          </p>
                          <p className="mt-1 text-sm text-indigo-200">
                            Game has begun. Market prices are now available!
                            Remember, Minority Choice Wins
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
                { duration: 8000 }
              );
            }

            return updatedPool;
          }
          return pool;
        })
      );

      // Add to recently joined set for animation if the current user joined
      if (address && player.toLowerCase() === address.toLowerCase()) {
        setRecentlyJoinedPools((prev) => new Set([...prev, poolId.toString()]));

        // Show success toast for current user
        toast.success(`You've joined Pool #${poolId}!`);
      } else {
        // Show info toast for other users
        toast.info(`New player joined Pool #${poolId}`);
      }

      // Remove pool from recently joined after animation completes (4 seconds)
      setTimeout(() => {
        setRecentlyJoinedPools((prev) => {
          const newSet = new Set(prev);
          newSet.delete(poolId.toString());
          return newSet;
        });
      }, 4000);
    },
    [address, queryClient]
  );

  // Setup event listener using the custom hook
  usePoolEvents({ onPlayerJoined: handlePlayerJoined });

  // Handle joining a pool
  const handleJoinPool = async (poolId: string) => {
    try {
      const pool = pools.find((p) => p.id === poolId);
      if (!pool) {
        throw new Error("Pool not found");
      }

      await joinPool(Number(poolId), pool.entryFee.toString());

      // Note: We don't need to update the state here because
      // the event listener will handle that when the blockchain event is emitted
    } catch (err) {
      console.error("Join pool error:", err);
      toast.error(
        `Failed to join pool: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  // Handle play pool
  const handlePlayPool = async (poolId: string) => {
    // This will be handled by the PoolCard component's navigation
    return Promise.resolve();
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

  const loadMorePools = () => {
    setVisiblePools((prev) => Math.min(prev + 6, filteredPools.length));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gaming Pools</h1>
          <p className="text-indigo-300">
            Earn rewards by predicting the Minority Choice in competitive pools
          </p>
        </div>

        <div className="mt-4 md:mt-0">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-900/30 rounded-xl px-4 py-2 border border-indigo-600/30">
              <span className="text-xs text-indigo-400">Balance</span>
              <div className="flex items-center gap-1 mt-1">
                <Coins size={14} className="text-amber-400" />
                <span className="font-medium text-white">
                  {balanceData?.formatted || "0.00"}{" "}
                  {balanceData?.symbol || "FLR"}
                </span>
              </div>
            </div>

            <button
              onClick={onShowStakingModal}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all duration-200"
            >
              <Flame size={18} />
              <span>Stake</span>
            </button>

            {isConnected && stakerInfo.stakedAmount >= 100 && (
              <button
                onClick={onShowCreateModal}
                className="flex items-center gap-2 bg-indigo-900/50 hover:bg-indigo-900/70 text-white py-2 px-4 rounded-lg border border-indigo-600/30 transition-all duration-200"
              >
                <Plus size={18} />
                <span>Create Pool</span>
              </button>
            )}
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
          </select>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.slice(0, visiblePools).map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            address={address}
            onJoinPool={handleJoinPool}
            onPlayPool={handlePlayPool}
            isRecentlyJoined={recentlyJoinedPools.has(pool.id)}
          />
        ))}
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
  );
}
