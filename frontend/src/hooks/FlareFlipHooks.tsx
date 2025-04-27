import {
  useAccount,
  useReadContract,
  useWriteContract,
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { useState, useEffect } from "react";
import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";

export enum PlayerChoice {
  NONE = 0,
  HEADS = 1,
  TAILS = 2,
}

export enum PoolStatus {
  OPENED = 0,
  ACTIVE = 1,
  CLOSED = 2,
}

export type Pool = {
  id: number;
  entryFee: bigint;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: bigint;
  status: PoolStatus;
  assetSymbol: string;
  creator: `0x${string}`;
  currentRound: number;
  marketData: {
    startPrice: bigint;
    lastPrice: bigint;
    lastUpdated: number;
  };
};

export type PlayerInfo = {
  playerAddress: `0x${string}`;
  choice: PlayerChoice;
  isEliminated: boolean;
  hasClaimed: boolean;
};

// Hook to get pool count
export function usePoolCount() {
  const {
    data: poolCount,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "poolCount",
  });

  return { poolCount: (poolCount as bigint) || 0n, isError, isLoading };
}

export function useUserPools() {
  const { address } = useAccount();
  const [userPoolIds, setUserPoolIds] = useState<bigint[]>([]);

  // Fetch staker info
  const {
    data: stakerInfo,
    isLoading: stakerLoading,
    error: stakerError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "stakers",
    args: [address],
    query: {
      enabled: !!address, // Only fetch if address exists
    },
  });

  // Calculate active pools count
  const activePoolsCount = stakerInfo ? (stakerInfo as any)[1] : BigInt(0);

  // Create batch requests for all user pools
  const poolRequests = Array.from(
    { length: Number(activePoolsCount) },
    (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "userPools",
      args: [address, BigInt(i)],
    })
  );

  // Fetch all pool IDs in a single batch
  const {
    data: poolIds,
    isLoading: poolsLoading,
    error: poolsError,
  } = useReadContracts({
    contracts: poolRequests,
    query: {
      enabled: !!address && activePoolsCount > 0,
    },
  });

  // Update userPoolIds when data is fetched
  useEffect(() => {
    if (poolIds && poolIds.length > 0) {
      // Extract result values and filter out any undefined values
      const ids = poolIds
        .map((result) => result.result)
        .filter((id) => id !== undefined) as bigint[];

      setUserPoolIds(ids);
    } else if (
      poolIds &&
      poolIds.length === 0 &&
      activePoolsCount === BigInt(0)
    ) {
      setUserPoolIds([]);
    }
  }, [poolIds, activePoolsCount]);

  const isLoading = stakerLoading || poolsLoading;
  const isError = !!stakerError || !!poolsError;

  console.log("User Pool IDs:", userPoolIds);
  return { userPoolIds, isLoading, isError };
}

// Hook to get pool details
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
    query: {
      enabled: poolId !== undefined,
    },
  });

  // Get trading pair info
  const { data: tradingPair } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "poolTradingPairs",
    args: [BigInt(poolId || 0)],
    query: {
      enabled: poolId !== undefined,
    },
  });

  // Get market data
  const { data: marketData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "poolMarketData",
    args: [BigInt(poolId || 0)],
    query: {
      enabled: poolId !== undefined,
    },
  });

  useEffect(() => {
    if (poolId === undefined) {
      setIsLoading(false);
      return;
    }

    if (poolData && tradingPair && marketData) {
      try {
        // Combine all data into a pool object
        const formattedPool: Pool = {
          id: Number(poolId),
          entryFee: poolData[0] as bigint,
          maxParticipants: Number(poolData[1]),
          currentParticipants: Number(poolData[2]),
          prizePool: poolData[3] as bigint,
          status: Number(poolData[4]) as PoolStatus,
          assetSymbol: tradingPair[0] as string,
          creator: poolData[5] as `0x${string}`,
          currentRound: 0, // You'll need to add this to your read function or use a separate call
          marketData: {
            startPrice: marketData[0] as bigint,
            lastPrice: marketData[1] as bigint,
            lastUpdated: Number(marketData[3]),
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

  return { pool, isLoading, error };
}

// Hook to check if user is a player in a pool
export function usePlayerInfo(
  poolId: number | bigint | undefined,
  playerAddress?: `0x${string}`
) {
  const { address } = useAccount();
  const addressToCheck = playerAddress || address;

  const {
    data: playerInfo,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "players", // Make sure this matches your contract getter method
    args: [BigInt(poolId || 0), addressToCheck!],
    query: {
      enabled: !!poolId && !!addressToCheck,
    },
  });

  return {
    playerInfo: playerInfo as PlayerInfo | undefined,
    isError,
    isLoading,
  };
}

// Hook to get supported assets
interface UseSupportedAssetsResult {
  supportedAssets: string[];
  isError: boolean;
  isLoading: boolean;
}

interface UseSupportedAssetsParams {
  index: number | bigint;
}

interface UseSupportedAssetsResult {
  supportedAssets: string[];
  isError: boolean;
  isLoading: boolean;
}

export function useSupportedAssets({
  index,
}: UseSupportedAssetsParams): UseSupportedAssetsResult {
  const {
    data: supportedAssets,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "supportedAssets",
    args: [index],
  });

  return {
    supportedAssets: (supportedAssets as string[]) || [],
    isError,
    isLoading,
  };
}

// Hook to get round results
export function useRoundResults(
  poolId: number | bigint,
  round: number | bigint
) {
  const {
    data: results,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "getRoundResults",
    args: [BigInt(poolId), BigInt(round)],
  });

  const winners = results ? (results[0] as `0x${string}`[]) : [];
  const losers = results ? (results[1] as `0x${string}`[]) : [];

  return { winners, losers, isError, isLoading };
}

// Hook to get staker info
export function useStakerInfo(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const stakerAddress = address || connectedAddress;

  const {
    data: stakerInfo,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    functionName: "stakers",
    args: [stakerAddress!],
    query: {
      enabled: !!stakerAddress,
    },
  });

  return {
    stakerInfo: stakerInfo
      ? {
          stakedAmount: stakerInfo[0] as bigint,
          activePoolsCount: Number(stakerInfo[1]),
          totalRewards: stakerInfo[2] as bigint,
          lastStakeTimestamp: Number(stakerInfo[3]),
        }
      : undefined,
    isError,
    isLoading,
  };
}

// Hook to stake
export function useStake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [totalStaked, setTotalStaked] = useState<string>("0");

  // Function to handle the staking
  const stake = (amount: string) => {
    setStakeAmount(amount);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "stake",
      value: parseEther(amount),
    });
  };

  // Track successful stakes
  useEffect(() => {
    if (isSuccess && stakeAmount) {
      // Add the new stake to the total
      setTotalStaked((prev) => {
        const currentTotal = parseFloat(prev) || 0;
        const newAmount = parseFloat(stakeAmount) || 0;
        return (currentTotal + newAmount).toString();
      });

      // Reset the current stake amount
      setStakeAmount("");
    }
  }, [isSuccess, stakeAmount]);

  return {
    stake,
    hash,
    isPending,
    isLoading,
    isSuccess,
    currentStakeAmount: stakeAmount,
    totalStaked,
  };
}

// Hook to unstake
export function useUnstake() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstake = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "unstake",
      args: [parseEther(amount)],
    });
  };

  return { unstake, hash, isPending, isLoading, isSuccess };
}

// Hook to create a pool
export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const createPool = async (
    entryFee: string,
    maxParticipants: number,
    assetSymbol: string
  ) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: flareFlipABI.abi,
        functionName: "createPool",
        args: [
          parseEther(entryFee),
          BigInt(maxParticipants),
          assetSymbol.toUpperCase(), // Ensure uppercase
        ],
      });
    } catch (err) {
      console.error("Contract error:", err);
      throw new Error("Failed to create pool: " + (err as Error).message);
    }
  };

  return { createPool, hash, isPending, error };
}

// Hook to join a pool
export function useJoinPool() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinPool = (poolId: number | bigint, entryFee: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "joinPool",
      args: [BigInt(poolId)],
      value: parseEther(entryFee),
    });
  };

  return { joinPool, hash, isPending, isLoading, isSuccess };
}

// Hook to make a selection
export function useMakeSelection() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const makeSelection = (poolId: number | bigint, choice: PlayerChoice) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "makeSelection",
      args: [BigInt(poolId), BigInt(choice)],
    });
  };

  return { makeSelection, hash, isPending, isLoading, isSuccess };
}

// Hook to claim prize
export function useClaimPrize() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimPrize = (poolId: number | bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "claimPrize",
      args: [BigInt(poolId)],
    });
  };

  return { claimPrize, hash, isPending, isLoading, isSuccess };
}

// Hook to update market price
export function useUpdateMarketPrice() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateMarketPrice = (poolId: number | bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "updateMarketPrice",
      args: [BigInt(poolId)],
    });
  };

  return { updateMarketPrice, hash, isPending, isLoading, isSuccess };
}
