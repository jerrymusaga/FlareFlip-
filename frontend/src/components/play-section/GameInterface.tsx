import { useState, useEffect } from "react";
import { GameStatus } from "../../types/game";
import { RoundResult } from "../../types/game";
import { PlayerChoice } from "../../hooks/FlareFlipHooks";
import { ArrowRight } from "lucide-react";
import { formatEther } from 'viem';

interface GameInterfaceProps {
  gameStatus: GameStatus;
  selectedOption: PlayerChoice | null;
  coinRotation: number;
  isPulsing: boolean;
  makeChoice: (choice: PlayerChoice) => void;
  roundResults: RoundResult[];
  isLoading: boolean;
  currentRound: number;
  poolId: string;
  winners?: string[]; // Add winners prop
  losers?: string[]; // Add losers prop
}

export function GameInterface({
  gameStatus,
  selectedOption,
  coinRotation,
  isPulsing,
  makeChoice,
  roundResults,
  isLoading,
  currentRound,
  poolId,
  winners = [],
  losers = [],
}: GameInterfaceProps) {
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);
  const [isTieBreaker, setIsTieBreaker] = useState(false);
  const [tieBreakerDetails, setTieBreakerDetails] = useState<{
    startPrice: string;
    lastPrice: string;
    randomValue: string;
    winningChoice: PlayerChoice;
    headsCount: number;
    tailsCount: number;
  } | null>(null);
  const [showTieBreakerAnimation, setShowTieBreakerAnimation] = useState(false);
  const [tieBreakerStep, setTieBreakerStep] = useState<number>(0);

  // Listen for RoundCompleted events to track winners/losers
  useEffect(() => {
    const roundEventName = `RoundCompleted-${poolId}-${currentRound}`;
    const handler = (e: CustomEvent) => {
      const event = e as CustomEvent;
      const { startPrice, lastPrice, randomValue, winningSelection } =
        event.detail;
      const { winningChoice } = e.detail;
      setCurrentResult((prev) => ({
        ...prev!,
        winningChoice,
        majorityChoice: (winningChoice === PlayerChoice.HEADS
          ? PlayerChoice.TAILS
          : PlayerChoice.HEADS) as string,
      }));
    };
    window.addEventListener(roundEventName, handler as EventListener);
    return () =>
      window.removeEventListener(roundEventName, handler as EventListener);
  }, [poolId, currentRound]);

  // Enhanced Tie Breaker listener with animation steps
  useEffect(() => {
    const tieEventName = `TieBrokenByHybrid-${poolId}-${currentRound}`;
    const handler = (e: CustomEvent) => {
      const {
        startPrice,
        lastPrice,
        randomValue,
        winningSelection,
        headsCount,
        tailsCount,
      } = e.detail;

      // Show tie breaker process
      setShowTieBreakerAnimation(true);
      setTieBreakerStep(1); // Show tie message

      setTimeout(() => {
        setTieBreakerStep(2); // Show price comparison
        setTieBreakerDetails({
          startPrice: formatEther(startPrice),
          lastPrice: formatEther(lastPrice),
          randomValue: randomValue.toString(),
          winningChoice: winningSelection,
          headsCount,
          tailsCount,
        });
      }, 2000);

      setTimeout(() => {
        setTieBreakerStep(3); // Show random number
      }, 4000);

      setTimeout(() => {
        setTieBreakerStep(4); // Show final decision
        setIsTieBreaker(true);
      }, 6000);

      // Hide after 10 seconds
      setTimeout(() => {
        setShowTieBreakerAnimation(false);
        setIsTieBreaker(false);
        setTieBreakerStep(0);
      }, 10000);
    };

    window.addEventListener(tieEventName, handler as EventListener);
    return () =>
      window.removeEventListener(tieEventName, handler as EventListener);
  }, [poolId, currentRound]);

  // Show round results when they arrive
  useEffect(() => {
    if (roundResults.length > 0) {
      const latestResult = roundResults[roundResults.length - 1];
      if (latestResult.round === currentRound) {
        setCurrentResult({
          ...latestResult,
          winners,
          losers,
        });
        setShowRoundResult(true);

        const timer = setTimeout(() => {
          setShowRoundResult(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [roundResults, currentRound, winners, losers]);

  // Determine UI states
  const isChoosing = gameStatus === "choosing" && selectedOption === null;
  const isWaitingForResults =
    gameStatus === "revealing" && selectedOption !== null;
  const shouldShowResults = showRoundResult && currentResult;

  // Tie breaker animation steps
  const renderTieBreakerStep = () => {
    switch (tieBreakerStep) {
      case 1:
        return (
          <div className="tie-message text-center py-4">
            <h3 className="text-xl font-bold text-yellow-400">TIE DETECTED!</h3>
            <p className="text-gray-300">Resolving with hybrid method...</p>
          </div>
        );
      case 2:
        return (
          tieBreakerDetails && (
            <div className="price-comparison text-center py-4">
              <h4 className="text-lg font-semibold text-white">
                Price Movement
              </h4>
              <div className="price-change flex justify-center items-center gap-4 mt-2">
                <span className="text-gray-300">
                  Start: {tieBreakerDetails.startPrice}
                </span>
                <ArrowRight className="text-gray-400" />
                <span className="text-gray-300">
                  End: {tieBreakerDetails.lastPrice}
                </span>
              </div>
              <div className="votes mt-4">
                <p className="text-gray-400">Votes:</p>
                <div className="flex justify-center gap-8 mt-2">
                  <span className="text-yellow-400">
                    HEADS: {tieBreakerDetails.headsCount}
                  </span>
                  <span className="text-blue-400">
                    TAILS: {tieBreakerDetails.tailsCount}
                  </span>
                </div>
              </div>
            </div>
          )
        );
      case 3:
        return (
          tieBreakerDetails && (
            <div className="random-number text-center py-4">
              <h4 className="text-lg font-semibold text-white">
                Random Number Generated
              </h4>
              <div className="random-value bg-gray-800 rounded-lg p-3 mt-2">
                <span className="font-mono text-xl">
                  {tieBreakerDetails.randomValue}
                </span>
              </div>
            </div>
          )
        );
      case 4:
        return (
          tieBreakerDetails && (
            <div className="final-decision text-center py-4">
              <h4 className="text-lg font-semibold text-green-400">
                TIE BROKEN!
              </h4>
              <p className="text-white mt-2">
                Winning choice:{" "}
                <span className="font-bold">
                  {tieBreakerDetails.winningChoice}
                </span>
              </p>
            </div>
          )
        );
      default:
        return null;
    }
  };

  return (
    <div className="game-interface flex flex-col items-center justify-center gap-6 p-4 relative">
      {/* Round indicator */}
      <div className="round-indicator bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold mb-2">
        Round {currentRound}{" "}
        {winners.length > 0 && `- ${winners.length} players advanced`}
      </div>

      {/* Tie Breaker Animation */}
      {isTieBreaker && tieBreakerDetails && (
        <div className="tie-breaker-overlay fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="tie-breaker-content bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-center text-yellow-400 mb-4">
              TIE BREAKER ACTIVATED!
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Price Change</div>
                <div className="font-mono">
                  {tieBreakerDetails.startPrice} → {tieBreakerDetails.lastPrice}
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Random Value</div>
                <div className="font-mono">{tieBreakerDetails.randomValue}</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <div className="text-lg font-semibold">
                Winning Choice:
                <span className="ml-2 text-green-400">
                  {tieBreakerDetails.winningChoice}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Result Overlay */}
      {shouldShowResults && (
        <div className="round-result-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 p-4 animate-fade-in">
          <div
            className={`result-content bg-gray-800 rounded-xl p-6 max-w-md w-full text-center ${
              currentResult.survived ? "border-green-500" : "border-red-500"
            } border-2`}
          >
            <h3 className="text-2xl font-bold mb-4">
              Round {currentResult.round} Completed
            </h3>

            <div
              className={`result-message text-xl font-semibold mb-6 ${
                currentResult.survived ? "text-green-400" : "text-red-400"
              }`}
            >
              {currentResult.survived
                ? "🎉 You advanced to the next round!"
                : "😢 You've been eliminated!"}
            </div>

            <div className="stats-grid grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="stat bg-gray-700 p-3 rounded">
                <div className="stat-label text-gray-400">Winning Choice</div>
                <div className="stat-value font-bold">
                  {currentResult.winningChoice}
                </div>
              </div>
              <div className="stat bg-gray-700 p-3 rounded">
                <div className="stat-label text-gray-400">Players Advanced</div>
                <div className="stat-value font-bold">
                  {currentResult.winners.length}
                </div>
              </div>
              <div className="stat bg-gray-700 p-3 rounded">
                <div className="stat-label text-gray-400">
                  Players Eliminated
                </div>
                <div className="stat-value font-bold">
                  {currentResult.losers.length}
                </div>
              </div>
              <div className="stat bg-gray-700 p-3 rounded">
                <div className="stat-label text-gray-400">Your Choice</div>
                <div className="stat-value font-bold">{selectedOption}</div>
              </div>
            </div>

            <button
              className="close-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              onClick={() => setShowRoundResult(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div
        className={`main-ui w-full max-w-md ${
          shouldShowResults || isTieBreaker
            ? "opacity-30 pointer-events-none"
            : ""
        }`}
      >
        {/* Game status header */}
        <div className="game-status text-center text-2xl font-bold mb-6">
          {isChoosing
            ? "Choose the MINORITY option to advance!"
            : isWaitingForResults
            ? "Waiting for other players..."
            : "Game in progress..."}
        </div>

        {/* Main content area */}
        <div className="game-content">
          {isChoosing && (
            <div className="choice-container flex flex-col items-center animate-fade-in">
              <div className="coin-animation relative w-40 h-40 mb-8">
                <div
                  className={`coin absolute inset-0 flex items-center justify-center rounded-full bg-yellow-400 border-4 border-yellow-600 transform transition-all duration-300 ${
                    isPulsing ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transform: `rotateY(${coinRotation}deg)` }}
                >
                  <span className="text-xl font-bold">HEADS</span>
                </div>
                <div
                  className={`coin-back absolute inset-0 flex items-center justify-center rounded-full bg-yellow-500 border-4 border-yellow-700 transform transition-all duration-300 ${
                    !isPulsing ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transform: `rotateY(${coinRotation + 180}deg)` }}
                >
                  <span className="text-xl font-bold">TAILS</span>
                </div>
              </div>

              <p className="instruction-text text-lg mb-6 text-center">
                Make your choice before time runs out! The minority choice
                advances.
              </p>
            </div>
          )}

          {isWaitingForResults && (
            <div className="waiting-container flex flex-col items-center animate-fade-in">
              <div className="selected-choice-display bg-blue-100 px-6 py-4 rounded-lg mb-6">
                <p className="text-lg">
                  You chose:{" "}
                  <span className="font-bold text-blue-700">
                    {selectedOption}
                  </span>
                </p>
              </div>

              <div className="spinner-container flex flex-col items-center">
                <div className="spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">
                  Waiting for other players to vote...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="button-container flex gap-6 mt-4">
          <button
            className={`choice-button px-8 py-4 rounded-lg text-xl font-bold transition-all ${
              selectedOption === PlayerChoice.HEADS
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            } ${
              gameStatus !== "choosing" || isLoading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (gameStatus === "choosing" && !isLoading) {
                makeChoice(PlayerChoice.HEADS);
              }
            }}
            disabled={gameStatus !== "choosing" || isLoading}
          >
            <span className="button-text flex items-center">
              HEADS
              {currentResult?.majorityChoice === "heads" && (
                <span className="majority-badge ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                  MAJORITY
                </span>
              )}
            </span>
          </button>

          <button
            className={`choice-button px-8 py-4 rounded-lg text-xl font-bold transition-all ${
              selectedOption === PlayerChoice.TAILS
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            } ${
              gameStatus !== "choosing" || isLoading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (gameStatus === "choosing" && !isLoading) {
                makeChoice(PlayerChoice.TAILS);
              }
            }}
            disabled={gameStatus !== "choosing" || isLoading}
          >
            <span className="button-text flex items-center">
              TAILS
              {currentResult?.majorityChoice === "tails" && (
                <span className="majority-badge ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                  MAJORITY
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="processing-indicator mt-4 text-blue-500 flex items-center justify-center">
          <div className="spinner-small animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
}

