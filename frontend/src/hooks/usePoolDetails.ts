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

  

  useEffect(() => {
    if (poolId === undefined) {
      setIsLoading(false);
      return;
    }

    if (poolData && tradingPair && marketData ) {
      try {
        const formattedPool: Pool = {
          // @ts-ignore
          id: Number(poolId),
          // @ts-ignore
          entryFee: Number(poolData[0]),
          // @ts-ignore
          maxPlayers: Number(poolData[1]),
          // @ts-ignore
          currentPlayers: Number(poolData[2]),
          // @ts-ignore
          potentialReward: Number(poolData[3]),
          // @ts-ignore
          status: poolData[6] as PoolStatus,

          feeToken: "FLR",
          // @ts-ignore
          asset: tradingPair[0] as string,
          // @ts-ignore
          creator: poolData[5] as `0x${string}`,
          // @ts-ignore
          timeRemaining: poolData[6] ? Number(poolData[6]) : undefined,
          difficulty: "medium", // Default or fetch from contract
          // @ts-ignore
          popularity: Number(poolData[7]) || 0,
          marketData: {
            // @ts-ignore
            startPrice: BigInt(marketData[0]),
            // @ts-ignore
            lastPrice: BigInt(marketData[1]),
            // @ts-ignore
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
  }, [poolId, poolData, tradingPair, marketData]);
  return { pool,poolData, isLoading, error, marketData};
}

