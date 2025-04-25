// import { Balance } from "wagmi"; // Removed as 'Balance' is not exported by 'wagmi'
  
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

export interface AssetOption {
    name: string;
    value: number;
  }

  export interface StakingModalProps {
    showStakingModal: boolean;
    setShowStakingModal: (show: boolean) => void;
    stakerInfo: StakerInfo;
    balanceData?: { value: number; currency: string }; // Example definition
    stakeAmount?: number;
    setStakeAmount: (amount: number | undefined) => void;
    unstakeAmount: string;
    setUnstakeAmount: (amount: string) => void;
    activeTab: "stake" | "unstake";
    setActiveTab: (tab: "stake" | "unstake") => void;
    handleStake: () => void;
    handleUnstake: () => void;
    canUnstake: () => boolean;
    formatTimestamp: (timestamp: number) => string;
    getUnlockTimeRemaining: () => string;
  }

  export interface CreatePoolModalProps {
    showCreatePoolModal: boolean;
    setShowCreatePoolModal: (show: boolean) => void;
    stakerInfo: StakerInfo;
    newPool: NewPool;
    setNewPool: (pool: NewPool) => void;
    handleCreatePool: () => void;
    isCreatingPool: boolean;
    error: string | null;
  }

  
  
 export interface NewPool {
    asset: string;
    entryFee: number;
    maxPlayers: number;
    difficulty: "easy" | "medium" | "hard" | "expert";
    assetId?: number;
  }