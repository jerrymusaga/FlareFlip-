import { DollarSign, Trophy, Users } from "lucide-react";
import { GameInfo } from "../../types/game";

interface GameHeaderProps {
  gameInfo: GameInfo;
}

export function GameHeader({ gameInfo }: GameHeaderProps) {
  return (
    <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4 flex flex-col md:flex-row justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-purple-300">
          {gameInfo.poolId} Pool
        </h1>
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
            {/* <span>{survivingPlayers}/{players.length} Players</span> */}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <div className="text-4xl font-mono bg-gray-800 px-3 py-1 rounded-md">
          {gameInfo.status}
        </div>
        <div className="text-sm">
          <div>Round</div>
          <div className="text-2xl font-bold text-center">
            {gameInfo.currentRound}
          </div>
        </div>
      </div>
    </div>
  );
}
