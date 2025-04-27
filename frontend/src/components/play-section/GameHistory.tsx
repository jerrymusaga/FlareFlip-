import { ArrowRight } from 'lucide-react';
import { RoundResult } from '../../types/game';

interface GameHistoryProps {
  roundResults: RoundResult[] | [];
}

export function GameHistory({ roundResults }: GameHistoryProps) {
  
  return (
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
  );
}
