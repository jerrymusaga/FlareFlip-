import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";
import { parseEther } from "viem";

export function useUnstake() {
  const { 
    writeContract, 
    data: hash, 
    isPending: isWriting 
  } = useWriteContract();
  
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstake = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: flareFlipABI.abi,
      functionName: "unstake",
      args: [parseEther(amount)],
    });
  };

  return { 
    unstake, 
    hash, 
    isPending: isWriting || isLoading, 
    isSuccess 
  };
}