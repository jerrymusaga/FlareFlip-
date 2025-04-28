import { ArrowRight } from 'lucide-react';
import { RoundResult } from '../../types/game';
import { PlayerChoice } from '../../hooks/FlareFlipHooks';

interface GameHistoryProps {
  roundResults: RoundResult[];
  currentAddress?: string;
}

export function GameHistory({ roundResults, currentAddress }: GameHistoryProps) {
  // Enhanced results with player's choice
  const enhancedResults = roundResults.map(result => {
    // Find player's choice if available
    const playerChoice = currentAddress 
      ? result.winners.includes(currentAddress) 
        ? result.winningChoice 
        : result.losers.includes(currentAddress)
        // @ts-ignore
          ? result.winningChoice === PlayerChoice.HEADS 
            ? PlayerChoice.TAILS 
            : PlayerChoice.HEADS
          : undefined
      : undefined;

    return {
      ...result,
      choice: playerChoice,
      survived: currentAddress ? result.winners.includes(currentAddress) : false
    };
  });

  return (
    <div className="mt-6 bg-black bg-opacity-50 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-3 text-white">Game History</h2>
      <div className="space-y-3">
        {enhancedResults.length > 0 ? (
          enhancedResults.map((result, index) => (
            <div 
              key={`round-${result.round}-${index}`}
              className="flex flex-wrap items-center gap-2 text-sm bg-gray-900 bg-opacity-50 p-3 rounded-lg"
            >
              <span className="font-mono bg-gray-800 px-2 py-1 rounded text-yellow-400">
                Round {result.round}
              </span>
              
              {result.choice && (
                <>
                  <span className="text-gray-300">You chose:</span>
                  <span className={result.choice === PlayerChoice.HEADS 
                    ? "text-yellow-400 font-medium" 
                    : "text-blue-400 font-medium"}>
                      
                    {String(result.choice).toUpperCase()}
                  </span>
                  <ArrowRight size={14} className="text-gray-400" />
                </>
              )}
              
              <span className="text-gray-300">Majority:</span>
              
              <span className={result.majorityChoice === PlayerChoice.HEADS.toString() 
                ? "text-yellow-400 font-medium" 
                : "text-blue-400 font-medium"}>
                {result.majorityChoice.toUpperCase()}
              </span>
              
              <span className={result.survived 
                ? "text-green-400 font-medium ml-auto" 
                : "text-red-400 font-medium ml-auto"}>
                {result.survived ? "Advanced ✓" : "Eliminated ✗"}
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic p-3 bg-gray-900 bg-opacity-30 rounded-lg">
            No rounds completed yet
          </div>
        )}
      </div>
    </div>
  );
}