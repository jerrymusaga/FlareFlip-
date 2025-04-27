import { useReadContract } from "wagmi";
import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";
export function useRoundResults(poolId: bigint, round: number) {
    const { data, isLoading, error } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "getRoundResults",
      args: [BigInt(poolId), BigInt(round)],
    });
  
    return {
      winners: data?.[0] || [],
      losers: data?.[1] || [],
      isLoading,
      error
    };
  }