import { useState, useEffect } from "react";
import { Pool } from "../../types/generated";
import PoolCard from "./PoolCard";
import { useJoinPool } from "../../hooks/useJoinPool";
import { useAccount } from "wagmi";
import { usePools } from "../../hooks/usePools";


export default function PoolsContainer() {
  const { address, isConnected } = useAccount();
  const { joinPool, isPending: isJoiningPool } = useJoinPool();
  const { pool } = usePools(); // Your existing hook to get pools data
  
  const [pools, setPools] = useState<Pool[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visiblePools, setVisiblePools] = useState<number>(6);
  const [animatingPoolId, setAnimatingPoolId] = useState<string | null>(null);

  useEffect(() => {
    setPools(pool);
  }, [pool]);

  // Handle joining a pool
  const handleJoinPool = async (poolId: string) => {
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

  // Simulate loading more pools
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
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.slice(0, visiblePools).map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            address={address as `0x${string}` | undefined}
            animatingPoolId={animatingPoolId}
            isJoiningPool={isJoiningPool}
            onJoinPool={handleJoinPool}
            getDifficultyColor={getDifficultyColor}
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