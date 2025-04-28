import { useState, useEffect, useMemo } from "react";
import { usePoolDetails } from "./usePoolDetails";
import { useMakeSelection, PoolStatus, PlayerChoice } from "./FlareFlipHooks";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Player, RoundResult } from "../types/game";
import { useWatchContractEvent } from "wagmi";
import { usePublicClient } from "wagmi";

import flareFlipABI from "./ABI/FlareFlip.json";
import { CONTRACT_ADDRESS } from "./ABI/address";

export enum GameStatus {
  WAITING = "waiting",
  CHOOSING = "choosing",
  REVEALING = "revealing",
  FINISHED = "finished",
  LOADING = "loading",
  ERROR = "error",
}

export function useGameState(poolIdParam: string) {
  const poolId = BigInt(poolIdParam);
  const { address } = useAccount();
  const [currentRoundWinners, setCurrentRoundWinners] = useState<string[]>([]);
  const [_roundErrors, setRoundErrors] = useState<{ [round: number]: Error }>(
    {}
  );
  const [currentRoundLosers, setCurrentRoundLosers] = useState<string[]>([]);
  const [completedRounds, setCompletedRounds] = useState<number[]>([]);

  const {
    poolData,
    marketData,
    isLoading: poolLoading,
    error: poolError,
  } = usePoolDetails(poolId) as {
    poolData: { [key: number]: any } | null;
    marketData: { [key: number]: any } | null;
    isLoading: boolean;
    error: Error | null;
  };

  const { makeSelection, isLoading: selectionLoading } = useMakeSelection();

  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<PlayerChoice>(
    PlayerChoice.NONE
  );
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [coinRotation, setCoinRotation] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [hasParticipated, setHasParticipated] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const client = usePublicClient();

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    eventName: "TieBrokenByHybrid",
    args: { poolId: poolId },
    onLogs: (logs) => {
      logs.forEach((log) => {
        // @ts-ignore
        if (Number(log.args.round) === currentRound) {
          const event = new CustomEvent(
            `TieBrokenByHybrid-${poolId}-${currentRound}`,
            {
              detail: {
                // @ts-ignore
                startPrice: log.args.startPrice,
                // @ts-ignore,
                lastPrice: log.args.lastPrice,
                // @ts-ignore
                randomValue: log.args.randomValue,
                // @ts-ignore
                winningSelection: log.args.winningSelection,
              },
            }
          );
          window.dispatchEvent(event);
        }
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    eventName: "RoundCompleted",
    args: { poolId: poolId },
    onLogs: (logs) => {
      logs.forEach((log) => {
        // @ts-ignore
        const { round, winningChoice } = log.args;
        console.log(`Round ${round} completed with choice ${winningChoice}`);

        fetchRoundResults(Number(round));
        setCompletedRounds((prev) => [...prev, round]);

        setCurrentRound((prev) => prev + 1);
        setSelectedOption(PlayerChoice.NONE);
        localStorage.removeItem(`flareflip-${poolIdParam}-selection`);
      });
    },
  });

  const fetchRoundResults = async (round: number) => {
    try {
      if (!client) {
        throw new Error("Public client is not initialized.");
      }

      // Add proper type for the contract result
      const result = (await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: flareFlipABI.abi,
        functionName: "getRoundResults",
        args: [poolId, round],
      })) as [string[], string[], number]; // winners, losers, winningChoice

      const [winners, losers, winningChoice] = result;
      const survived = address ? winners.includes(address) : false;

      setRoundResults((prev) => {
        const newResults = Array(Math.max(prev.length, round + 1))
          .fill(null)
          .map((_, i) => (i < prev.length ? prev[i] : undefined));

        newResults[round] = {
          round: round + 1,
          winners,
          losers,
          // @ts-ignore
          winningChoice:
            // @ts-ignore
            PlayerChoice[winningChoice as keyof typeof PlayerChoice],
          // @ts-ignore
          majorityChoice:
            // @ts-ignore
            PlayerChoice[winningChoice as keyof typeof PlayerChoice],
          survived,
        };

        return newResults.filter(
          (result): result is RoundResult => result !== undefined
        );
      });

      // More robust player state update
      setPlayers((prev) => {
        const updatedPlayers = [...prev];
        updatedPlayers.forEach((p) => {
          p.isEliminated = losers.includes(p.address);
        });

        // Add any new players from winners/losers
        const allPlayers = [...winners, ...losers];
        allPlayers.forEach((address) => {
          if (!updatedPlayers.some((p) => p.address === address)) {
            updatedPlayers.push({
              address,
              // @ts-ignore
              choice: PlayerChoice.NONE,
              isEliminated: losers.includes(address),
            });
          }
        });
        return updatedPlayers;
      });
    } catch (error) {
      console.error("Error fetching round results:", error);
    }
  };

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    eventName: "RoundWinners",
    args: { poolId: poolId },
    onLogs: (logs) => {
      logs.forEach((log) => {
        // @ts-ignore
        if (Number(log.args.round) === currentRound) {
          // @ts-ignore
          setCurrentRoundWinners(log.args.winners);
        }
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: flareFlipABI.abi,
    eventName: "RoundLosers",
    args: { poolId: poolId },
    onLogs: (logs) => {
      logs.forEach((log) => {
        // @ts-ignore
        if (Number(log.args.round) === currentRound) {
          // @ts-ignore
          setCurrentRoundLosers(log.args.losers);
        }
      });
    },
  });

  // Initial data fetch
  useEffect(() => {
    const initializeGame = async () => {
      if (poolData) {
        // Only fetch results if there's a previous round
        const currentRoundNumber = Number(poolData[8]); // currentRound is index 8
        if (currentRoundNumber > 1) {
          try {
            // Try to fetch previous round results
            await fetchRoundResults(currentRoundNumber - 1);
          } catch (error) {
            console.log(
              "Could not fetch previous round, might not be ended yet"
            );
            // Don't block initialization on this error
          }
        }
      }
    };
    initializeGame();
  }, [poolData]);

  // Load saved selection from localStorage
  useEffect(() => {
    const savedSelection = localStorage.getItem(
      `flareflip-${poolIdParam}-selection`
    );
    if (savedSelection) {
      // @ts-ignore
      setSelectedOption(savedSelection as PlayerChoice);
      setHasParticipated(true);
    }
  }, [poolIdParam]);

  // Derived game info
  const gameInfo = useMemo(() => {
    if (!poolData || !marketData)
      return {
        poolId: poolIdParam,
        assetSymbol: "",
        entryFee: "0",
        maxParticipants: 0,
        currentParticipants: 0,
        prizePool: "0",
        status: "unknown",
        creator: "unknown",
        currentRound: 1,
      };

    return {
    poolId: poolIdParam,
    assetSymbol: poolData[0] as string,
    entryFee: formatEther(poolData[2]?.toString() || "0"),
    maxParticipants: Number(poolData[3] || 0),
    currentParticipants: Number(poolData[4] || 0),
    prizePool: formatEther(poolData[5]?.toString() || "0"),
    status: PoolStatus[Number(poolData[6])] || "unknown",
    creator: poolData[7]?.toString() || "unknown",
    currentRound: Number(poolData[8] || 1),
    // Optional market data if needed elsewhere
    marketPrice: formatEther(marketData[1]?.toString() || "0")
    };
  }, [poolData, marketData, poolIdParam]);

  // Track participation via round results
  useEffect(() => {
    // Check from localStorage to see if user has already made a selection
    const savedSelection = localStorage.getItem(
      `flareflip-${poolIdParam}-selection`
    );
    const participatedFromStorage = !!savedSelection;

    // Also check from round results if available
    const participatedFromResults =
      address &&
      roundResults.length > 0 &&
      roundResults.some(
        (result) =>
          result.winners.includes(address) || result.losers.includes(address)
      );

    setHasParticipated(participatedFromStorage || !!participatedFromResults);
  }, [address, roundResults, poolIdParam]);

  // Set initial loading state
  useEffect(() => {
    if (poolLoading) {
      setGameStatus(GameStatus.LOADING);
      return;
    }

    // Handle error state
    if (poolError) {
      console.error("Pool error:", poolError);
      setGameStatus(GameStatus.ERROR);
      return;
    }

    // Handle missing data
    if (!poolData) {
      console.error("No pool data available");
      setGameStatus(GameStatus.ERROR);
      return;
    }

    if (poolData[6] === undefined) {
      console.error("Pool status is undefined in poolData");
      setGameStatus(GameStatus.ERROR);
      return;
    }

    // Now safely process the status
    const status = Number(poolData[6]);
    const currentRound = Number(poolData[8] || 1);
    setCurrentRound(currentRound);

    console.log("Pool Data Status:", status, "Current Round:", currentRound);

    switch (status) {
      case PoolStatus.OPENED:
        setGameStatus(GameStatus.WAITING);
        break;
      case PoolStatus.ACTIVE:
        setGameStatus(
          selectedOption !== PlayerChoice.NONE
            ? GameStatus.REVEALING
            : GameStatus.CHOOSING
        );
        break;
      case PoolStatus.CLOSED:
        setGameStatus(GameStatus.FINISHED);
        break;
      default:
        console.error("Unknown pool status:", status);
        setGameStatus(GameStatus.ERROR);
    }
  }, [poolLoading, poolError, poolData, selectedOption]);

  useEffect(() => {
    if (poolData) {
      const playerCount = Number(poolData[4] || 0);
      const dummyPlayers = Array.from({ length: playerCount }, (_, i) => ({
        address: `0xPlayer${i}` as `0x${string}`,
        choice: PlayerChoice.NONE,
        isEliminated: false,
      }));
      setPlayers(dummyPlayers);
    }
  }, [poolData]);

  // Fetch round results when current round changes
  useEffect(() => {
    if (
      !currentRound ||
      !poolData ||
      !client ||
      !completedRounds.includes(currentRound - 1)
    ) {
      return;
    }
    const fetchResults = async () => {
      if (
        !currentRound ||
        !poolData ||
        poolData[6] === PoolStatus.OPENED ||
        !client
      )
        return;

      try {
        // Direct contract call instead of using hook
        const result = (await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: flareFlipABI.abi,
          functionName: "getRoundResults",
          args: [poolId, currentRound - 1],
        })) as [string[], string[], number];

        const [winners, losers, winningChoiceIndex] = result;
        const survived = address ? winners.includes(address) : false;

        // Convert numeric choice to enum
        const winningChoice =
          winningChoiceIndex === 0
            ? PlayerChoice.HEADS
            : winningChoiceIndex === 1
            ? PlayerChoice.TAILS
            : PlayerChoice.NONE;

        setRoundResults((prev) => {
          const newResults = [...prev];

          newResults[currentRound - 1] = {
            round: currentRound,
            winners,
            losers,
            winningChoice: winningChoice.toString(),
            majorityChoice: winningChoice.toString(),
            survived,
          };
          return newResults;
        });

        if (address && losers.includes(address)) {
          setSelectedOption(PlayerChoice.NONE);
          localStorage.removeItem(`flareflip-${poolIdParam}-selection`);
        }

        // Update players list
        setPlayers((prev) => {
          const allAddresses = [...new Set([...winners, ...losers])];
          const updatedPlayers = [...prev];

          allAddresses.forEach((addr) => {
            const existing = updatedPlayers.find((p) => p.address === addr);
            if (!existing) {
              updatedPlayers.push({
                address: addr,
                // @ts-ignore
                choice: PlayerChoice.NONE,
                isEliminated: losers.includes(addr),
              });
            } else {
              existing.isEliminated = losers.includes(addr);
            }
          });

          return updatedPlayers;
        });
      } catch (error) {
        console.error("Error fetching round results:", error);
        setRoundErrors((prev) => ({
          ...prev,
          [currentRound - 1]: error as Error,
        }));

        if (
          error instanceof Error &&
          error.message.includes("Round not ended")
        ) {
          console.log(`Round ${currentRound - 1} not ended yet, waiting...`);
          return;
        }
      }
    };

    fetchResults();
  }, [currentRound, poolId, address, poolData, completedRounds, client]);

  // Function to make a choice
  const makeChoice = async (choice: PlayerChoice) => {
    if (gameStatus === "choosing" && !isProcessing) {
      setIsProcessing(true);
      try {
        await makeSelection(poolId, choice);
        setSelectedOption(choice); // @ts-ignore
        localStorage.setItem(`flareflip-${poolIdParam}-selection`, choice);
      } finally {
        setIsProcessing(false);
      }

      // Animation logic
      let rotation = 0;
      const flipInterval = setInterval(() => {
        rotation += 36;
        setCoinRotation(rotation);
        if (rotation >= 1800) clearInterval(flipInterval);
      }, 50);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (gameStatus === GameStatus.CHOOSING) {
      const initialTime = 60; // Fixed 60 seconds for selection
      setTimeLeft(initialTime);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          if (prev <= 10) setIsPulsing(true);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  // Reset timer and pulsing when game status changes
  useEffect(() => {
    setIsPulsing(false);
  }, [gameStatus]);

  return {
    gameInfo,
    currentRound,
    selectedOption,
    timeLeft,
    roundResults,
    gameStatus,
    players,
    survivingPlayers: players.filter((p) => !p.isEliminated).length,
    isPulsing,
    coinRotation,
    makeChoice,
    isLoading: poolLoading || selectionLoading || isProcessing,
    error: poolError,
    hasParticipated,
    currentRoundWinners,
    currentRoundLosers,
  };
}
