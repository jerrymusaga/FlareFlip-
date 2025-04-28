import { useParams } from "react-router-dom";
import { useGameState } from "../../hooks/useGameState";
import { GameHeader } from "./GameHeader";
import { useAccount } from "wagmi";
import { GameInterface } from "./GameInterface";
import { GameResults } from "./GameResults";
import { GameHistory } from "./GameHistory";

export default function GameContainer() {
  const { poolId } = useParams<{ poolId: string }>();
  const { address } = useAccount();

  // Use custom hook for game state
  const gameState = useGameState(poolId || "0");

  const {
    gameInfo,
    currentRound,
    selectedOption,
   
    roundResults,
    gameStatus,
  
    survivingPlayers,
    isPulsing,
    coinRotation,
    makeChoice,
    currentRoundWinners,
    currentRoundLosers,
    isLoading,
  } = gameState;

  // const isTie =
  //   currentRoundWinners.length > 0 &&
  //   currentRoundLosers.length > 0 &&
  //   currentRoundWinners.length === currentRoundLosers.length;

  // useEffect(() => {
  //   console.log("poolData:", gameInfo);
   
  //   console.log("Current game status:", gameStatus);
  // }, [gameStatus, isLoading]);
  return (
    <div className="game-container flex flex-col min-h-screen bg-gray-900 text-white p-4">
      {/* Game Header */}
      <GameHeader
        gameInfo={gameInfo}
      />

      {/* Main Game Area */}
      <div className="game-main flex-grow flex flex-col items-center justify-center">
        {isLoading && (
          <div className="loading flex flex-col items-center justify-center">
            <div className="spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading game data...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="debug-info text-xs mb-4 p-2 bg-gray-800 rounded">
              Game Status: {gameStatus} | Round: {currentRound} | PlayerChoice:{" "}
              {selectedOption}
            </div>

            {gameStatus !== "finished" && "error" && (
              <GameInterface
                gameStatus={gameStatus === "error" ? "choosing" : gameStatus}
                selectedOption={selectedOption}
                coinRotation={coinRotation}
                isPulsing={isPulsing}
                makeChoice={makeChoice}
                roundResults={roundResults}
                isLoading={isLoading}
                currentRound={currentRound}
                poolId={poolId || "0"}
                winners={currentRoundWinners}
                losers={currentRoundLosers}
              />
            )}

            {gameStatus === "finished" && (
              <GameResults
                  // @ts-ignore
                winners={survivingPlayers}
                prizePool={gameInfo?.prizePool || "0"}
              />
            )}

            {gameStatus === "error" && (
              <div className="error-notice p-3 bg-red-900 bg-opacity-70 rounded-lg fixed top-4 right-4 max-w-xs">
                <h4 className="font-bold">Connection Issue</h4>
                <p className="text-sm">
                  There was a problem fetching game data. Some features might be
                  limited.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Game History */}
      <GameHistory roundResults={roundResults} currentAddress={address} />
    </div>
  );
}
