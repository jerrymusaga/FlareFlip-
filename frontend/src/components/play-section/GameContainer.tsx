import { useParams } from 'react-router-dom'; 
import { useGameState } from '../../hooks/useGameState'; 
import { GameHeader } from './GameHeader'; 
import { GameInterface } from './GameInterface'; 
import { GameResults } from './GameResults'; 
import { GameHistory } from './GameHistory';  

export default function GameContainer() {   
  const { poolId } = useParams<{ poolId: string }>();      
  
  // Use custom hook for game state 
  const gameState = useGameState(poolId || '0');       
  
  const {     
    gameInfo,     
    currentRound,     
    selectedOption,     
    timeLeft,     
    roundResults,     
    gameStatus,     
    players,     
    survivingPlayers,     
    isPulsing,     
    coinRotation,     
    makeChoice   
  } = gameState;    
  
  console.log("GameStatus", gameStatus);    
  
  return (     
    <div className="game-container flex flex-col min-h-screen bg-gray-900 text-white p-4">
      {/* Game Header */}       
      <GameHeader 
        gameInfo={gameInfo} 
        currentRound={currentRound} 
        timeLeft={timeLeft} 
        playerCount={players.length} 
        survivingCount={survivingPlayers.length} 
      />
           
      {/* Main Game Area */}       
      <div className="game-main flex-grow flex flex-col items-center justify-center">
        {gameStatus === 'loading' && <div className="loading">Loading game data...</div>}
        
        {(gameStatus === 'choosing' || gameStatus === 'revealing') && (
          <GameInterface 
            gameStatus={gameStatus}
            selectedOption={selectedOption}
            coinRotation={coinRotation}
            isPulsing={isPulsing}
            makeChoice={makeChoice}
            roundResults={roundResults}
          />
        )}
          
        {gameStatus === 'finished' && (
          <GameResults 
            winners={survivingPlayers}
            prizePool={gameInfo?.prizePool || 0}
          />
        )}       
      </div>
        
      {/* Game History */}        
      <GameHistory roundResults={roundResults} />
    </div>
  ); 
}