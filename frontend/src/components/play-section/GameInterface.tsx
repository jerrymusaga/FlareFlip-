import { GameStatus } from '../../types/game'; 
import { RoundResult } from '../../types/game';  
import { PlayerChoice } from '../../hooks/FlareFlipHooks';

interface GameInterfaceProps {   
  gameStatus: GameStatus;   
  selectedOption: PlayerChoice | null;   
  coinRotation: number;   
  isPulsing: boolean;   
  makeChoice: (choice: PlayerChoice) => void;   
  roundResults: RoundResult[];
  isLoading: boolean;
}  

export function GameInterface({    
  gameStatus,    
  selectedOption,    
  coinRotation,    
  isPulsing,    
  makeChoice,    
  roundResults,
  isLoading
}: GameInterfaceProps) {   
  // Determine different UI states
  const isChoosing = gameStatus === 'choosing' && selectedOption === null;
  const isWaitingForResults = gameStatus === 'revealing' && selectedOption !== null;
  const showResults = gameStatus === 'revealing' && roundResults.length > 0 && !isWaitingForResults;

  return (     
    <div className="game-interface flex flex-col items-center justify-center gap-8 p-4">
      {/* Game status header */}
      <div className="game-status text-center text-2xl font-bold mb-6">
        {isChoosing 
          ? "Choose the MINORITY option to advance!" 
          : isWaitingForResults
            ? "Waiting for other players..."
            : showResults
              ? "Round results are in!"
              : "Game in progress..."}
      </div>
      
      {/* Main content area */}
      <div className="game-content w-full max-w-md">
        {isChoosing && (
          <div className="choice-container flex flex-col items-center animate-fade-in">
            <div className="coin-animation relative w-40 h-40 mb-8">
              <div 
                className={`coin absolute inset-0 flex items-center justify-center rounded-full bg-yellow-400 border-4 border-yellow-600 transform rotate-${coinRotation} transition-opacity duration-300 ${
                  isPulsing ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-xl font-bold">HEADS</span>
              </div>
              <div 
                className={`coin-back absolute inset-0 flex items-center justify-center rounded-full bg-yellow-500 border-4 border-yellow-700 transform rotate-${coinRotation + 180} transition-opacity duration-300 ${
                  !isPulsing ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-xl font-bold">TAILS</span>
              </div>
            </div>
            
            <p className="instruction-text text-lg mb-6 text-center">
              Make your choice before time runs out! The minority choice advances.
            </p>
          </div>
        )}
        
        {isWaitingForResults && (
          <div className="waiting-container flex flex-col items-center animate-fade-in">
            <div className="selected-choice-display bg-blue-100 px-6 py-4 rounded-lg mb-6">
              <p className="text-lg">
                You chose: <span className="font-bold text-blue-700">{selectedOption}</span>
              </p>
            </div>
            
            <div className="spinner-container flex flex-col items-center">
              <div className="spinner animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Waiting for other players to vote...</p>
            </div>
          </div>
        )}
        
        {showResults && (
          <div className="results-container animate-fade-in">
            <div className={`result-message text-xl font-bold p-4 rounded-lg mb-6 text-center ${
              roundResults[roundResults.length-1]?.survived 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {roundResults[roundResults.length-1]?.survived
                ? "🎉 You survived this round!"
                : "😢 You've been eliminated!"}
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="button-container flex gap-6 mt-4">
        <button
          className={`choice-button px-8 py-4 rounded-lg text-xl font-bold transition-all ${
            selectedOption === PlayerChoice.HEADS 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          } ${
            (gameStatus !== 'choosing' || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (gameStatus === 'choosing' && !isLoading) {
              makeChoice(PlayerChoice.HEADS);
            }
          }}
          disabled={gameStatus !== 'choosing' || isLoading}
        >           
          <span className="button-text flex items-center">
            HEADS
            {showResults && roundResults[roundResults.length-1]?.majorityChoice === 'heads' && (
              <span className="majority-badge ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                MAJORITY
              </span>
            )}
          </span>
        </button>
        
        <button
          className={`choice-button px-8 py-4 rounded-lg text-xl font-bold transition-all ${
            selectedOption === PlayerChoice.TAILS 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          } ${
            (gameStatus !== 'choosing' || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (gameStatus === 'choosing' && !isLoading) {
              makeChoice(PlayerChoice.TAILS);
            }
          }}
          disabled={gameStatus !== 'choosing' || isLoading}
        >           
          <span className="button-text flex items-center">
            TAILS
            {showResults && roundResults[roundResults.length-1]?.majorityChoice === 'tails' && (
              <span className="majority-badge ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                MAJORITY
              </span>
            )}
          </span>
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="processing-indicator mt-4 text-blue-500 flex items-center">
          <div className="spinner-small animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Processing...
        </div>
      )}
    </div>
  ); 
}
