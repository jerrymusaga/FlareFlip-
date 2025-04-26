import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";
import { Pool } from "../types/generated";

export function usePoolDetails(poolId: bigint | number | undefined) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get basic pool info
  const { data: poolData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "pools",
    args: [BigInt(poolId || 0)],
    query: { enabled: poolId !== undefined },
  });

  // Get trading pair info
  const { data: tradingPair } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "poolTradingPairs",
    args: [BigInt(poolId || 0)],
    query: { enabled: poolId !== undefined },
  });

  // Get market data
  const { data: marketData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "poolMarketData",
    args: [BigInt(poolId || 0)],
    query: { enabled: poolId !== undefined },
  });

  // Get participants
  const { data: participants } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "getPoolParticipants",
    args: [BigInt(poolId || 0)],
    query: { enabled: poolId !== undefined },
  });

  useEffect(() => {
    if (poolId === undefined) {
      setIsLoading(false);
      return;
    }

    if (poolData && tradingPair && marketData && participants) {
      try {
        const formattedPool: Pool = {
          id: Number(poolId),
          entryFee: Number(poolData[0]),
          maxPlayers: Number(poolData[1]),
          currentPlayers: Number(poolData[2]),
          potentialReward: Number(poolData[3]),
          status: poolData[4] as PoolStatus,
          feeToken: "FLR",
          asset: tradingPair[0] as string,
          creator: poolData[5] as `0x${string}`,
          timeRemaining: poolData[6] ? Number(poolData[6]) : undefined,
          difficulty: "medium", // Default or fetch from contract
          popularity: Number(poolData[7]) || 0,
          participants: participants as `0x${string}`[],
          icon: `/icons/${tradingPair[0].toLowerCase()}.svg`,
          marketData: {
            startPrice: BigInt(marketData[0]),
            lastPrice: BigInt(marketData[1]),
            lastUpdated: Number(marketData[2]),
          },
        };

        setPool(formattedPool);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    }
  }, [poolId, poolData, tradingPair, marketData, participants]);

  return { pool, isLoading, error };
}