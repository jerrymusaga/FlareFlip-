// hooks/usePools.ts
import { Pool } from "../types/generated";
import { useReadContracts, useReadContract } from "wagmi";
import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";

export function usePools() {
  // Get total pool count
  const { data: poolCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: flareFlipABI.abi,
    functionName: "poolCount",
  });

  // Use useReadContracts to fetch all pools in a batch
  const poolsCount = poolCount ? Number(poolCount) : 0;

  const poolIndexes = Array.from({ length: poolsCount }, (_, i) => i);

  const { data: poolsData } = useReadContracts({
    contracts: poolIndexes.map((index) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: flareFlipABI.abi,
      functionName: "pools",
      args: [BigInt(index)],
    })),
  });

  // Map the data to frontend format
  const pool: Pool[] = poolsData
    ? poolsData
        .map((result, index) => {
          if (result.status === "success" && result.result) {
            return mapContractPoolToFrontendPool(result.result, index, result);
          }
          return null;
        })
        .filter((pool): pool is Pool => pool !== null)
    : [];

  return { pool };
}



function mapContractPoolToFrontendPool(contractPool: any, id: number, result:any): Pool {

  console.log("result", result);
  console.log("contractPool", contractPool);
  return {
    id: id.toString(),
    asset: contractPool[0],
    icon: `/${contractPool[0]}.svg`,
    entryFee: parseFloat((Number(contractPool[2]) / 10 ** 18).toFixed(2)),
    feeToken: "FLR",
    maxPlayers: Number(contractPool[3]),
    currentPlayers: Number(contractPool[4]),
    status: getStatusFromEnum(contractPool[6]),

    maxWinners: Number(contractPool[9]),
    potentialReward:parseFloat((Number(contractPool[5]) / 10**18).toFixed(2)),
    difficulty: "medium", 
    popularity: 5, 

    creator: contractPool[7],
  };
}

function getStatusFromEnum(status: number): "open" | "filling" | "active" | "completed" {
  switch(status) {
    case 0: return "open";
    case 1: return "active";
    case 2: return "completed";
    case 3: return "filling";
    default: return "open";

  }
}

function calculatePotentialReward(pool: any): number {
  // Your calculation logic here
  return Number(pool.entryFee) * Number(pool.maxParticipants);
}
