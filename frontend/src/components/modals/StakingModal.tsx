import {
    Unlock,
    Lock,
    AlertTriangle,
  } from "lucide-react";
  import { StakingModalProps } from "../../types/generated";
  
 
  
  export default function StakingModal({
    showStakingModal,
    setShowStakingModal,
    stakerInfo,
    balanceData,
    stakeAmount,
    setStakeAmount,
    unstakeAmount,
    setUnstakeAmount,
    activeTab,
    setActiveTab,
    handleStake,
    handleUnstake,
    canUnstake,
    formatTimestamp,
    getUnlockTimeRemaining,
  }: StakingModalProps) {
    if (!showStakingModal) return null;
  
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 max-w-md w-full border border-indigo-700/30 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Stake & Earn</h2>
            <button
              onClick={() => setShowStakingModal(false)}
              className="text-indigo-300 hover:text-white"
            >
              ✕
            </button>
          </div>
  
          {/* Staking Info Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-800/30 rounded-xl p-4 border border-indigo-700/30">
              <p className="text-xs text-indigo-300 mb-1">Total Staked</p>
              <p className="text-2xl font-bold text-white">
                {stakerInfo.stakedAmount} FLR
              </p>
            </div>
            <div className="bg-indigo-800/30 rounded-xl p-4 border border-indigo-700/30">
              <p className="text-xs text-indigo-300 mb-1">Earnings</p>
              <p className="text-2xl font-bold text-green-400">
                +{stakerInfo.earnings} FLR
              </p>
            </div>
          </div>
  
          {/* Lock Status */}
          <div className="bg-indigo-800/20 rounded-xl p-4 border border-indigo-700/30 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {canUnstake() ? (
                  <Unlock size={18} className="text-green-400" />
                ) : (
                  <Lock size={18} className="text-amber-400" />
                )}
                <p className="text-sm font-medium text-white">Lock Status</p>
              </div>
              <span
                className={`text-sm ${
                  canUnstake() ? "text-green-400" : "text-amber-400"
                }`}
              >
                {getUnlockTimeRemaining()}
              </span>
            </div>
            <div className="mt-2 text-xs text-indigo-300">
              <p>
                Last staked: {formatTimestamp(stakerInfo.lastStakeTimestamp)}
              </p>
              <p>Active pools: {stakerInfo.activePoolsCount}</p>
              {!canUnstake() && stakerInfo.activePoolsCount > 0 && (
                <p className="text-amber-400 mt-1">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Cannot unstake while pools are active
                </p>
              )}
            </div>
          </div>
  
          {/* Tabs for Stake/Unstake */}
          <div className="flex rounded-lg overflow-hidden border border-indigo-700/30 mb-6">
            <button
              onClick={() => setActiveTab("stake")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "stake"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50"
              }`}
            >
              Stake
            </button>
            <button
              onClick={() => setActiveTab("unstake")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "unstake"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50"
              }`}
            >
              Unstake
            </button>
          </div>
  
          {/* Stake Form */}
          {activeTab === "stake" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Amount to Stake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) =>
                      setStakeAmount(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                    FLR
                  </span>
                </div>
                <p className="text-xs text-indigo-400 mt-1">
                  Balance: {balanceData ? balanceData.value.toFixed(2) : "0.00"} FLR
                </p>
              </div>
  
              <div className="mb-4 text-xs text-indigo-300">
                <p className="mb-1">• Minimum staking period: 7 days</p>
                <p className="mb-1">• Cannot unstake while pools are active</p>
                <p>• Earn 2% from pool entry fees as creator rewards</p>
              </div>
  
              <button
                onClick={handleStake}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                Stake FLR
              </button>
            </div>
          )}
  
          {/* Unstake Form */}
          {activeTab === "unstake" && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-indigo-300 mb-1">
                  Amount to Unstake
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!canUnstake()}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400">
                    FLR
                  </span>
                </div>
                <p className="text-xs text-indigo-400 mt-1">
                  Staked: {stakerInfo.stakedAmount} FLR
                </p>
              </div>
  
              {!canUnstake() && (
                <div className="mb-4 p-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                  <p className="text-xs text-amber-400 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    {stakerInfo.activePoolsCount > 0
                      ? "You have active pools. Close them before unstaking."
                      : "Minimum staking period not met yet."}
                  </p>
                </div>
              )}
  
              <button
                onClick={handleUnstake}
                disabled={!canUnstake()}
                className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 ${
                  canUnstake()
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    : "bg-indigo-900/50 text-indigo-400 cursor-not-allowed"
                }`}
              >
                Unstake FLR
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }