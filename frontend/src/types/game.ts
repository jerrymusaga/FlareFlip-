

export interface RoundResult {
  round: number;
  winners: string[];
  losers: string[];
  winningChoice: string;
  survived: boolean;
}




export type GameStatus = 'loading' | 'waiting' | 'choosing' | 'revealing' | 'finished';

export interface RoundResult {
  round: number;
  majorityChoice: string;
  winningChoice: string;
  survived: boolean;
  eliminatedPlayers?: string[];
  survivingPlayers?: string[];
}

export interface GameInfo {
  poolId: string;
  assetSymbol: string;
  entryFee: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  status: string;
  creator: string;
  currentRound: number;
  
}

export interface Player {
  address: string;
  isEliminated: boolean;
}

