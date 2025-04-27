import { useState, useEffect, useMemo } from 'react';
import { usePoolDetails } from './usePoolDetails';
import { useMakeSelection, useRoundResults, PoolStatus, PlayerChoice } from './FlareFlipHooks';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Player, RoundResult } from '../types/game';

export enum GameStatus {
  WAITING = 'waiting',
  CHOOSING = 'choosing',
  REVEALING = 'revealing',
  FINISHED = 'finished',
  LOADING = 'loading',
  ERROR = 'error'
}

export function useGameState(poolIdParam: string) {
  const poolId = BigInt(poolIdParam);
  const { address } = useAccount();
  const { 
    poolData, 
    marketData, 
    isLoading: poolLoading, 
    error: poolError
  } = usePoolDetails(poolId);

  const { makeSelection, isLoading: selectionLoading, isSuccess: selectionSuccess } = useMakeSelection();
  
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<PlayerChoice>(PlayerChoice.NONE);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [coinRotation, setCoinRotation] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [hasParticipated, setHasParticipated] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load saved selection from localStorage
  useEffect(() => {
    const savedSelection = localStorage.getItem(`flareflip-${poolIdParam}-selection`);
    if (savedSelection) {
      setSelectedOption(savedSelection as PlayerChoice);
      setHasParticipated(true);
    }
  }, [poolIdParam]);

  // Derived game info
  const gameInfo = useMemo(() => {
    if (!poolData || !marketData) return {
      poolId: poolIdParam,
      entryFee: '0',
      prizePool: '0',
      assetSymbol: '',
      marketPrice: '0',
    };

    return {
      poolId: poolIdParam,
      entryFee: formatEther(poolData[2]?.toString() || '0'),
      prizePool: formatEther(poolData[5]?.toString() || '0'),
      assetSymbol: poolData[0] as string,
      marketPrice: formatEther(marketData[1]?.toString() || '0'),
      maxPlayers: Number(poolData[3] || 0),
      currentPlayers: Number(poolData[4] || 0),
      timeRemaining: poolData[8] ? Number(poolData[8]) : undefined
    };
  }, [poolData, marketData, poolIdParam]);

  // Track participation via round results
  useEffect(() => {
    if (address && roundResults.length > 0) {
      const participated = roundResults.some(result => 
        result.winners.includes(address) || result.losers.includes(address)
      );
      setHasParticipated(participated);
    }
  }, [address, roundResults]);

  // Set initial loading state
  useEffect(() => {
    if (poolLoading) {
      setGameStatus(GameStatus.LOADING);
    } else if (poolError) {
      setGameStatus(GameStatus.ERROR);
    }
  }, [poolLoading, poolError]);

  // Update game status based on pool data
  useEffect(() => {
    if (!poolData) return;

    const status = poolData[6];
    
    if (poolLoading) {
      setGameStatus(GameStatus.LOADING);
    } else if (status === PoolStatus.OPENED) {
      setGameStatus(GameStatus.WAITING);
    } else if (status === PoolStatus.ACTIVE) {
      if (selectedOption !== PlayerChoice.NONE) {
        setGameStatus(GameStatus.REVEALING);
      } else {
        setGameStatus(GameStatus.CHOOSING);
      }
    } else if (status === PoolStatus.CLOSED) {
      setGameStatus(GameStatus.FINISHED);
      localStorage.removeItem(`flareflip-${poolIdParam}-selection`);
    }
  }, [poolData, poolLoading, selectedOption, poolIdParam]);

  // Initialize players list based on currentPlayers count
  useEffect(() => {
    if (poolData) {
      const playerCount = Number(poolData[4] || 0);
      const dummyPlayers = Array.from({ length: playerCount }, (_, i) => ({
        address: `0xPlayer${i}` as `0x${string}`,
        choice: PlayerChoice.NONE,
        isEliminated: false
      }));
      setPlayers(dummyPlayers);
    }
  }, [poolData]);

  // Fetch round results when current round changes
  useEffect(() => {
    const fetchResults = async () => {
      if (currentRound > 0 && poolData && poolData[6] !== PoolStatus.OPENED) {
        try {
          const { winners, losers } = await useRoundResults(poolId, currentRound - 1);
          const survived = address ? winners.includes(address) : false;
          
          const winningChoice = winners.length > losers.length 
            ? PlayerChoice.HEADS 
            : PlayerChoice.TAILS;
          
          const newResult: RoundResult = {
            round: currentRound,
            winners,
            losers,
            winningChoice: winningChoice.toString(),
            majorityChoice: winningChoice.toString(),
            survived
          };
          
          setRoundResults(prev => [...prev, newResult]);
          
          // Fixed missing closing parenthesis here
          if (address && losers.includes(address as `0x${string}`)) {
            setSelectedOption(PlayerChoice.NONE);
            localStorage.removeItem(`flareflip-${poolIdParam}-selection`);
          }
          
          // Update known players
          setPlayers(prev => {
            const updatedPlayers = [...prev];
            winners.concat(losers).forEach(addr => {
              const idx = updatedPlayers.findIndex(p => p.address === addr);
              if (idx === -1) {
                updatedPlayers.push({
                  address: addr,
                  choice: PlayerChoice.NONE,
                  isEliminated: losers.includes(addr)
                });
              } else {
                updatedPlayers[idx].isEliminated = losers.includes(addr);
              }
            });
            return updatedPlayers;
          });
        } catch (error) {
          console.error("Error fetching round results:", error);
        }
      }
    };
  
    fetchResults();
  }, [currentRound, poolId, address, poolData, poolIdParam]);
  // Function to make a choice
  const makeChoice = async (choice: PlayerChoice) => {
    if (gameStatus === 'choosing' && !isProcessing) {
      setIsProcessing(true);
      try {
        await makeSelection(poolId, choice);
        setSelectedOption(choice);
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
        setTimeLeft(prev => {
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
    survivingPlayers: players.filter(p => !p.isEliminated).length,
    isPulsing,
    coinRotation,
    makeChoice,
    isLoading: poolLoading || selectionLoading || isProcessing,
    error: poolError,
    hasParticipated
  };
}