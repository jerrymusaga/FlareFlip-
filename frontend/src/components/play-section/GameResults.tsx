import { GameInfo } from '../../types/game';

interface GameResultsProps {
  survived: boolean;
  currentRound: number;
  gameInfo: GameInfo;
  survivingPlayers: number;
}

export function GameResults({ survived, currentRound, gameInfo, survivingPlayers }: GameResultsProps) {
  return (
    <div className="text-center">
      {survived && survivingPlayers <= 1 ? (
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
  );
}