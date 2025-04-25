
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import flareFlipABI from "./ABI/FlareFlip.json";
import { formatFigures } from "../utils/conversion";
import { CONTRACT_ADDRESS } from "./ABI/address";
import { parseEther } from "viem";

export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinPool = async (poolId: number | bigint, entryFee: string) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: flareFlipABI.abi,
        functionName: "joinPool",
        args: [BigInt(poolId)],
        value: parseEther(entryFee),
      });
    } catch (err) {
      console.error("Failed to join pool:", err);
      throw err;
    }
  };

  return { 
    joinPool, 
    hash, 
    isPending, 
    isLoading, 
    isSuccess, 
    error 
  };
}