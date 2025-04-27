

export interface GameInfo {
  poolName: string;
  entryFee: string;
  prizePool: string;
  maxPlayers: number;
  poolId: string;
}

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
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  status: string;
  creator: string;
  currentRound: number;
}

export interface Player {
  address: string;
  isEliminated: boolean;
}

