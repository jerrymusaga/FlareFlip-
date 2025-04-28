import { useState, useEffect, useCallback } from "react";
import { Pool } from "../../types/generated";
import PoolCard from "./PoolCard";
import { useJoinPool } from "../../hooks/useJoinPool";
import { useAccount } from "wagmi";
import { usePools } from "../../hooks/usePools";
import { toast } from "sonner";
import { usePoolEvents } from "../../hooks/usePoolEvents";

export default function PoolsContainer() {
  const { address } = useAccount();
  const { joinPool } = useJoinPool();
  const { pool } = usePools(); // Hook to get pools data

  const [pools, setPools] = useState<Pool[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visiblePools, setVisiblePools] = useState<number>(6);
  const [recentlyJoinedPools, setRecentlyJoinedPools] = useState<Set<string>>(
    new Set()
  );

  // Initialize pools from the hook data
  useEffect(() => {
    if (pool && pool.length > 0) {
      setPools(pool);
    }
  }, [pool]);

  // Handle player joined event
  const handlePlayerJoined = useCallback(
    (poolId: bigint, player: string) => {
      // Update the pools state when a player joins
      setPools((prevPools) =>
        prevPools.map((pool) => {
          if (pool.id === poolId.toString()) {
            return {
              ...pool,
              currentPlayers: pool.currentPlayers + 1,
              potentialReward: pool.potentialReward + pool.entryFee,
              // If full, update status to active
              status:
                pool.currentPlayers + 1 >= pool.maxPlayers * 0.8 &&
                pool.status === "open"
                  ? "active"
                  : pool.status,
            };
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
    [address]
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

  // Load more pools
  const loadMorePools = () => {
    if (visiblePools < filteredPools.length) {
      setVisiblePools((prev) => Math.min(prev + 6, filteredPools.length));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
            address={address as `0x${string}` | undefined}
            onJoinPool={handleJoinPool}
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
