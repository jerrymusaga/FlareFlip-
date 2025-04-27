import { useState, useEffect } from "react";
import { GameStatus, RoundResult } from "../../types/game";
import { PlayerChoice } from "../../hooks/FlareFlipHooks";
import { ArrowRight, Zap, Award, Clock, Users, Hexagon } from "lucide-react";
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
  winners?: string[];
  losers?: string[];
  timeLeft?: number;
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
  timeLeft = 60,
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
  const [coinSize, setCoinSize] = useState(160);


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


  // Animated coin effect
  useEffect(() => {
    if (gameStatus === "choosing") {
      const pulseInterval = setInterval(() => {
        setCoinSize((prevSize) => (prevSize === 160 ? 170 : 160));
      }, 2000);
      return () => clearInterval(pulseInterval);
    }
  }, [gameStatus]);

  // Listen for RoundCompleted events to track winners/losers
  useEffect(() => {
    const roundEventName = `RoundCompleted-${poolId}-${currentRound}`;
    const handler = (e: CustomEvent) => {
      const event = e as CustomEvent;
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

  // Calculate time progress bar width
  const timeProgressWidth = (timeLeft / 60) * 100;

  return (
    <div className="game-interface w-full max-w-4xl mx-auto relative">
      {/* Game HexBoard - Futuristic Panel */}
      <div className="hex-board relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700 p-8">
        {/* Glowing elements for ambiance */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
        
        {/* Round indicator with animated border */}
        <div className="flex justify-between items-center mb-8">
          <div className="round-indicator relative overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 animate-pulse opacity-20"></div>
            <div className="relative flex items-center gap-3 bg-gray-800 px-5 py-3 rounded-lg">
              <Hexagon className="text-indigo-400" size={20} />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ROUND {currentRound}
              </span>
            </div>
          </div>
          
          <div className="player-stats flex items-center gap-3 bg-gray-800 px-5 py-3 rounded-lg">
            <Users className="text-indigo-400" size={18} />
            <span className="text-gray-300">
              Players: <span className="text-white font-bold">{winners.length}</span>
            </span>
          </div>
        </div>
        
        {/* Timer bar when choosing */}
        {isChoosing && (
          <div className="timer-container mb-6">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Clock className="text-indigo-400" size={16} />
                <span className="text-gray-300 text-sm">Time Remaining</span>
              </div>
              <span className={`text-lg font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${timeLeft <= 10 ? "bg-red-500" : "bg-indigo-500"} transition-all duration-1000 ease-linear`}
                style={{ width: `${timeProgressWidth}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Main gaming area */}
        <div className="main-game-area flex flex-col items-center my-8">
          {isChoosing && (
            <div className="choice-container flex flex-col items-center">
              {/* 3D Coin Effect */}
              <div 
                className="coin-container relative mb-8"
                style={{ 
                  width: `${coinSize}px`, 
                  height: `${coinSize}px`,
                  transition: "all 0.5s ease-in-out"
                }}
              >
                <div
                  className="coin-3d absolute inset-0 rounded-full shadow-lg transform transition-all duration-700"
                  style={{ 
                    transform: `rotateY(${coinRotation}deg)`,
                    transformStyle: "preserve-3d"
                  }}
                >
                  {/* Heads side */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full border-4 border-yellow-600 backface-visibility-hidden shadow-inner">
                    <div className="coin-inner flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-yellow-800">H</span>
                      <div className="coin-pattern absolute inset-0 opacity-20">
                        {/* Decorative patterns */}
                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-yellow-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tails side */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-300 to-blue-500 rounded-full border-4 border-blue-600 backface-visibility-hidden shadow-inner" style={{transform: "rotateY(180deg)"}}>
                    <div className="coin-inner flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-blue-800">T</span>
                      <div className="coin-pattern absolute inset-0 opacity-20">
                        {/* Decorative patterns */}
                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-blue-700 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ambient glow under coin */}
                <div className="coin-glow absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/3 h-4 bg-indigo-500 filter blur-xl opacity-30 rounded-full"></div>
              </div>

              {/* Game instructions */}
              <div className="game-instruction-box bg-gray-800 border border-gray-700 rounded-lg p-5 mb-6 max-w-md text-center">
                <h3 className="font-bold text-white text-lg mb-2">🎮 Game Strategy</h3>
                <p className="text-gray-300">
                  Choose the <span className="text-indigo-400 font-semibold">MINORITY</span> option to advance. 
                  Being different from the crowd is your winning strategy!
                </p>
              </div>
            </div>
          )}

          {isWaitingForResults && (
            <div className="waiting-container flex flex-col items-center">
              <div className="selected-choice-indicator mb-6">
                <div className="choice-badge bg-gray-800 border border-gray-700 rounded-full px-6 py-3 flex items-center gap-3">
                  <span className="text-gray-400">Your choice:</span>
                  <span className={`font-bold text-lg ${selectedOption === PlayerChoice.HEADS ? "text-yellow-400" : "text-blue-400"}`}>
                    {selectedOption}
                  </span>
                </div>
              </div>

              {/* Waiting animation */}
              <div className="waiting-animation flex flex-col items-center">
                <div className="loading-ring relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-gray-700 border-b-indigo-500 border-l-gray-700 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-t-gray-700 border-r-indigo-500 border-b-gray-700 border-l-indigo-500 rounded-full animate-spin-slow"></div>
                </div>
                <p className="text-indigo-300">Waiting for other players to decide...</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="action-buttons flex justify-center gap-6 mt-4">
          <button
            className={`choice-button relative group transition-all duration-200 px-8 py-4 rounded-lg text-xl font-bold 
              ${selectedOption === PlayerChoice.HEADS 
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900" 
                : "bg-gray-800 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/10"} 
              ${gameStatus !== "choosing" || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              if (gameStatus === "choosing" && !isLoading) {
                makeChoice(PlayerChoice.HEADS);
              }
            }}
            disabled={gameStatus !== "choosing" || isLoading}
          >
            {/* Button shine effect */}
            <span className="absolute inset-0 overflow-hidden rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300">
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent transform -translate-x-full hover:translate-x-full transition-transform duration-1000"></span>
            </span>
            <div className="flex items-center gap-2">
              <Hexagon size={20} />
              <span>HEADS</span>
            </div>
            {currentResult?.majorityChoice === "heads" && (
              <span className="majority-badge absolute -top-2 -right-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                MAJORITY
              </span>
            )}
          </button>

          <button
            className={`choice-button relative group transition-all duration-200 px-8 py-4 rounded-lg text-xl font-bold 
              ${selectedOption === PlayerChoice.TAILS 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-gray-900" 
                : "bg-gray-800 text-blue-400 border border-blue-500/50 hover:bg-blue-500/10"} 
              ${gameStatus !== "choosing" || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              if (gameStatus === "choosing" && !isLoading) {
                makeChoice(PlayerChoice.TAILS);
              }
            }}
            disabled={gameStatus !== "choosing" || isLoading}
          >
            {/* Button shine effect */}
            <span className="absolute inset-0 overflow-hidden rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300">
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent transform -translate-x-full hover:translate-x-full transition-transform duration-1000"></span>
            </span>
            <div className="flex items-center gap-2">
              <Hexagon size={20} />
              <span>TAILS</span>
            </div>
            {currentResult?.majorityChoice === "tails" && (
              <span className="majority-badge absolute -top-2 -right-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                MAJORITY
              </span>
            )}
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="processing-indicator flex items-center justify-center gap-2 mt-6 text-indigo-400">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Round Result Overlay */}
      {shouldShowResults && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-fade-in">
          <div className={`result-modal relative bg-gray-900 border-2 ${currentResult.survived ? "border-green-500" : "border-red-500"} rounded-xl overflow-hidden max-w-md w-full`}>
            {/* Modal header with glow */}
            <div className={`result-header relative p-6 ${currentResult.survived ? "bg-green-500/10" : "bg-red-500/10"} text-center`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${currentResult.survived ? "bg-green-500" : "bg-red-500"}`}></div>
              <h3 className="text-2xl font-bold">Round {currentResult.round} Completed</h3>
              
              <div className={`result-icon mt-4 mb-2 text-4xl ${currentResult.survived ? "text-green-400" : "text-red-400"}`}>
                {currentResult.survived ? "🎉" : "😢"}
              </div>
              
              <div className={`result-message text-xl font-semibold ${currentResult.survived ? "text-green-400" : "text-red-400"}`}>
                {currentResult.survived
                  ? "You advanced to the next round!"
                  : "You've been eliminated!"}
              </div>
            </div>
            
            {/* Result stats with glass effect */}
            <div className="result-stats p-6 bg-gray-800/50 backdrop-blur-sm">
              <div className="stats-grid grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="stat backdrop-blur-sm bg-gray-800/80 rounded-lg p-4 border border-gray-700">
                  <div className="stat-label text-gray-400 flex items-center gap-2 mb-1">
                    <Award size={16} className="text-indigo-400" />
                    <span>Winning Choice</span>
                  </div>
                  <div className="stat-value font-bold text-lg text-white">
                    {currentResult.winningChoice}
                  </div>
                </div>
                
                <div className="stat backdrop-blur-sm bg-gray-800/80 rounded-lg p-4 border border-gray-700">
                  <div className="stat-label text-gray-400 flex items-center gap-2 mb-1">
                    <Users size={16} className="text-indigo-400" />
                    <span>Players Advanced</span>
                  </div>
                  <div className="stat-value font-bold text-lg text-white">
                    {currentResult.winners.length}
                  </div>
                </div>
                
                <div className="stat backdrop-blur-sm bg-gray-800/80 rounded-lg p-4 border border-gray-700">
                  <div className="stat-label text-gray-400 flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-indigo-400" />
                    <span>Players Eliminated</span>
                  </div>
                  <div className="stat-value font-bold text-lg text-white">
                    {currentResult.losers.length}
                  </div>
                </div>
                
                <div className="stat backdrop-blur-sm bg-gray-800/80 rounded-lg p-4 border border-gray-700">
                  <div className="stat-label text-gray-400 flex items-center gap-2 mb-1">
                    <Hexagon size={16} className="text-indigo-400" />
                    <span>Your Choice</span>
                  </div>
                  <div className="stat-value font-bold text-lg text-white">
                    {selectedOption}
                  </div>
                </div>
              </div>

              <button
                className="close-button w-full relative overflow-hidden group bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
                onClick={() => setShowRoundResult(false)}
              >
                <span className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20">
                  <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                </span>
                <span className="relative font-bold">Continue to Next Round</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tie Breaker Overlay */}
      {showTieBreakerAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="tie-breaker-content bg-gray-900 border border-indigo-500 rounded-xl overflow-hidden max-w-md w-full">
            <div className="tie-header relative p-6 bg-indigo-500/10 text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
              <div className="tie-icon text-yellow-400 text-4xl mb-2">⚖️</div>
              <h3 className="text-2xl font-bold text-indigo-300">TIE BREAKER</h3>
            </div>
            
            <div className="tie-content p-6">
              {renderTieBreakerStep()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}