import { useWatchContractEvent } from "wagmi";
import { CONTRACT_ADDRESS } from "./ABI/address";
import flareFlipABI from "./ABI/FlareFlip.json";

export function usePoolEvents({
  onPlayerJoined,
}: {
  onPlayerJoined: (poolId: bigint, player: string) => void;
}) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: flareFlipABI.abi,
    eventName: "PlayerJoined",
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { poolId, player } = log.args;
        if (poolId !== undefined && player) {
          onPlayerJoined(poolId, player);
        }
      });
    },
  });
}
