import { useState, useEffect } from 'react';
import { Clock, Trophy, Users, ArrowRight, DollarSign } from 'lucide-react';

export default function MinorityWinsGame() {
  // Game state management
  const [currentRound, setCurrentRound] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundResults, setRoundResults] = useState<{round: number, choice: string, majorityChoice: string, survived: boolean}[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'choosing' | 'revealing' | 'finished'>('waiting');
  const [players, setPlayers] = useState(64);
  const [survivingPlayers, setSurvivingPlayers] = useState(64);
  const [isPulsing, setIsPulsing] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);
  
  // Game details
  const gameInfo = {
    poolName: "Ethereum Classic",
    entryFee: "50 $FLR",
    prizePool: "3,200 $FLR",
    maxPlayers: 64
  };

  // Simulate countdown timer
  useEffect(() => {
    if (gameStatus === 'choosing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStatus === 'choosing' && timeLeft === 0) {
      revealRoundResult();
    }
  }, [timeLeft, gameStatus]);

  // Rotating coin animation during countdown
  useEffect(() => {
    if (gameStatus === 'choosing') {
      const animationFrame = requestAnimationFrame(() => {
        setCoinRotation(prev => (prev + 5) % 360);
      });
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [gameStatus, coinRotation]);

  // Start the game when component loads
  useEffect(() => {
    // Simulate waiting for pool to fill
    const timer = setTimeout(() => {
      setGameStatus('choosing');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Make choice
  const makeChoice = (choice: string) => {
    setSelectedOption(choice);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 300);
  };

  // Reveal round result
  const revealRoundResult = () => {
    setGameStatus('revealing');
    
    // Simulate majority choice (in a real app this would come from blockchain)
    const majorityChoice = Math.random() > 0.5 ? 'heads' : 'tails';
    const survived = selectedOption !== majorityChoice;
    
    // Update results
    setRoundResults([...roundResults, {
      round: currentRound,
      choice: selectedOption || 'none',
      majorityChoice: majorityChoice,
      survived: survived
    }]);

    // Calculate new surviving players (random reduction for demo)
    const newSurvivors = Math.floor(survivingPlayers * (Math.random() * 0.3 + 0.4));
    
    setTimeout(() => {
      if (!survived) {
        setGameStatus('finished');
      } else if (newSurvivors <= 1) {
        // Game won!
        setSurvivingPlayers(1);
        setGameStatus('finished');
      } else {
        // Next round
        setSurvivingPlayers(newSurvivors);
        setCurrentRound(currentRound + 1);
        setSelectedOption(null);
        setTimeLeft(30);
        setGameStatus('choosing');
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-6 flex flex-col">
      {/* Game Header */}
      <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-purple-300">{gameInfo.poolName} Pool</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign size={16} className="text-green-400" />
              <span>Entry: {gameInfo.entryFee}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy size={16} className="text-yellow-400" />
              <span>Prize: {gameInfo.prizePool}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{survivingPlayers}/{players} Players</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="text-4xl font-mono bg-gray-800 px-3 py-1 rounded-md">
            {timeLeft}
          </div>
          <div className="text-sm">
            <div>Round</div>
            <div className="text-2xl font-bold text-center">{currentRound}</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-grow flex flex-col items-center justify-center">
        {gameStatus === 'waiting' && (
          <div className="text-center">
            <div className="text-3xl mb-4">Waiting for players...</div>
            <div className="flex gap-2 justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}

        {(gameStatus === 'choosing' || gameStatus === 'revealing') && (
          <div className="text-center w-full max-w-lg">
            <div className="text-xl mb-6">
              {gameStatus === 'choosing' 
                ? "Choose the MINORITY option to advance!" 
                : "Revealing results..."}
            </div>

            {/* Animated Spinning Coin during countdown */}
            {gameStatus === 'choosing' && selectedOption === null && (
              <div className="mb-6 relative">
                <div 
                  className="w-32 h-32 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100"
                  style={{ 
                    transform: `rotateY(${coinRotation}deg)`,
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                  }}
                >
                  <div className="absolute text-center">
                    <div className={`font-bold text-white text-xl transition-opacity duration-200 ${Math.sin(coinRotation * Math.PI / 180) > 0 ? 'opacity-100' : 'opacity-0'}`}>
                      HEADS
                    </div>
                    <div className={`font-bold text-white text-xl transition-opacity duration-200 ${Math.sin(coinRotation * Math.PI / 180) <= 0 ? 'opacity-100' : 'opacity-0'}`}>
                      TAILS
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-purple-300">Make your choice before time runs out!</div>
              </div>
            )}

            <div className="flex justify-center gap-8 mb-8">
              <button 
                className={`w-40 h-40 rounded-full transition-all duration-200 ${
                  selectedOption === 'heads' 
                    ? 'bg-yellow-500 border-4 border-white' 
                    : 'bg-yellow-600 hover:bg-yellow-500'
                } ${isPulsing && selectedOption === 'heads' ? 'scale-105' : ''}`}
                onClick={() => gameStatus === 'choosing' && makeChoice('heads')}
                disabled={gameStatus !== 'choosing'}
              >
                <div className="flex flex-col items-center">
                  <div className="font-bold text-2xl">HEADS</div>
                  <div className="text-sm mt-2">
                    {gameStatus === 'revealing' && roundResults[roundResults.length-1]?.majorityChoice === 'heads' && (
                      <span className="text-red-300">MAJORITY CHOICE</span>
                    )}
                  </div>
                </div>
              </button>

              <button 
                className={`w-40 h-40 rounded-full transition-all duration-200 ${
                  selectedOption === 'tails' 
                    ? 'bg-blue-500 border-4 border-white' 
                    : 'bg-blue-600 hover:bg-blue-500'
                } ${isPulsing && selectedOption === 'tails' ? 'scale-105' : ''}`}
                onClick={() => gameStatus === 'choosing' && makeChoice('tails')}
                disabled={gameStatus !== 'choosing'}
              >
                <div className="flex flex-col items-center">
                  <div className="font-bold text-2xl">TAILS</div>
                  <div className="text-sm mt-2">
                    {gameStatus === 'revealing' && roundResults[roundResults.length-1]?.majorityChoice === 'tails' && (
                      <span className="text-red-300">MAJORITY CHOICE</span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {gameStatus === 'revealing' && (
              <div className="text-2xl animate-pulse">
                {roundResults[roundResults.length-1]?.survived 
                  ? <span className="text-green-400">You survived this round!</span>
                  : <span className="text-red-400">You've been eliminated!</span>
                }
              </div>
            )}
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="text-center">
            {roundResults[roundResults.length-1]?.survived && survivingPlayers <= 1 ? (
              <div>
                <div className="text-4xl mb-4 text-yellow-300 font-bold">YOU WON!</div>
                <div className="text-2xl mb-8">🎉 Congratulations! You've won {gameInfo.prizePool}! 🎉</div>
                <div className="p-4 bg-purple-800 bg-opacity-50 rounded-lg max-w-md mx-auto">
                  <p className="text-lg">Your winnings will be transferred to your wallet shortly.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4 text-red-400 font-bold">GAME OVER</div>
                <div className="text-xl mb-8">You were eliminated in round {currentRound}</div>
                <div className="p-4 bg-purple-800 bg-opacity-50 rounded-lg max-w-md mx-auto">
                  <p className="text-lg">Better luck next time! Join another pool to play again.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game History */}
      <div className="mt-6 bg-black bg-opacity-50 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-2">Game History</h2>
        <div className="space-y-2">
          {roundResults.map((result, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="font-mono bg-gray-800 px-2 py-1 rounded">Round {result.round}</span>
              <span>You chose: <span className={result.choice === 'heads' ? "text-yellow-400" : "text-blue-400"}>{result.choice}</span></span>
              <ArrowRight size={14} />
              <span>Majority: <span className={result.majorityChoice === 'heads' ? "text-yellow-400" : "text-blue-400"}>{result.majorityChoice}</span></span>
              <span className={result.survived ? "text-green-400" : "text-red-400"}>
                {result.survived ? "Survived!" : "Eliminated!"}
              </span>
            </div>
          ))}
          {roundResults.length === 0 && <div className="text-gray-400 italic">No rounds played yet</div>}
        </div>
      </div>
    </div>
  );
}