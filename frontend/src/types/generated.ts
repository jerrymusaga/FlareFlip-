export interface Pool {
  id: string;
  asset: string;
  icon: string;
  entryFee: number;
  feeToken: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'open' | 'filling' | 'active' | 'completed';
  timeRemaining?: number;
  potentialReward: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  popularity: number; // 1-10 scale
  creator?: string; // Address of pool creator
}

export interface StakerInfo {
  stakedAmount: number;
  lastStakeTimestamp: number;
  activePoolsCount: number;
  earnings: number;
}