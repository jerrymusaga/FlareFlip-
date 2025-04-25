import { AlertTriangle, Plus } from "lucide-react";

import { CreatePoolModalProps, AssetOption } from "../../types/generated";

export default function CreatePoolModal({
  showCreatePoolModal,
  setShowCreatePoolModal,
  stakerInfo,
  newPool,
  setNewPool,
  handleCreatePool,
  isCreatingPool,
  error
}: CreatePoolModalProps) {
  if (!showCreatePoolModal) return null;

  const assetOptions: AssetOption[] = [
    { name: "ETH", value: 1 },  // Example - use exact symbol from contract
    { name: "BTC", value: 2 },
    { name: "FLR", value: 3 },
    { name: "XRP", value: 4 },
    { name: "LTC", value: 5 },
    { name: "DOGE", value: 6 },
    { name: "SOL", value: 7 },
    { name: "ADA", value: 8 },
    { name: "MATIC", value: 9 },
    { name: "DOT", value: 10 },
  ];

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedName: string = e.target.value;
    const selectedAsset: AssetOption | undefined = assetOptions.find(
      (asset: AssetOption) => asset.name === selectedName
    );

    setNewPool({
      ...newPool,
      asset: selectedName,
      assetId: selectedAsset?.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-indigo-900 to-indigo-950 rounded-2xl p-6 max-w-md w-full border border-indigo-700/30 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Pool</h2>
          <button
            onClick={() => setShowCreatePoolModal(false)}
            className="text-indigo-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Pool Creation Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">
              Select Asset
            </label>
            <select
              value={newPool.asset}
              onChange={handleAssetChange}
              className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {assetOptions.map((asset) => (
                <option key={asset.value} value={asset.name}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">
              Entry Fee (FLR)
            </label>
            <input
              type="number"
              value={newPool.entryFee || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNewPool({
                  ...newPool,
                  entryFee: value === "" ? 0 : Number(value),
                });
              }}
              min="1"
              className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">
              Maximum Players
            </label>
            <input
              type="number"
              value={newPool.maxPlayers || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNewPool({
                  ...newPool,
                  maxPlayers: value === "" ? 0 : Number(value),
                });
              }}
              min="2"
              className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-300 mb-1">
              Difficulty
            </label>
            <select
              value={newPool.difficulty}
              onChange={(e) =>
                setNewPool({
                  ...newPool,
                  difficulty: e.target.value as
                    | "easy"
                    | "medium"
                    | "hard"
                    | "expert",
                })
              }
              className="w-full bg-indigo-900/50 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700/30">
            <h4 className="text-sm font-medium text-purple-300 mb-2">
              Pool Summary
            </h4>
            <p className="text-xs text-indigo-300">
              Selected Asset: {newPool.asset} (ID: {newPool.assetId || "None"})
            </p>
            <p className="text-xs text-indigo-300">
              Total Pool Size:{" "}
              {(newPool.entryFee || 0) * (newPool.maxPlayers || 0)} FLR
            </p>
            <p className="text-xs text-indigo-300">
              Creator Fee:{" "}
              {Math.round(
                (newPool.entryFee || 0) * (newPool.maxPlayers || 0) * 0.02
              )}{" "}
              FLR (2%)
            </p>
            <p className="text-xs text-indigo-300">
              Platform Fee:{" "}
              {Math.round(
                (newPool.entryFee || 0) * (newPool.maxPlayers || 0) * 0.01
              )}{" "}
              FLR (1%)
            </p>
            <p className="text-xs text-green-400 font-medium mt-1">
              Player Payout:{" "}
              {Math.round(
                (newPool.entryFee || 0) * (newPool.maxPlayers || 0) * 0.97
              )}{" "}
              FLR
            </p>
          </div>

          {stakerInfo.stakedAmount < 100 && (
            <div className="mt-2 p-2 bg-amber-400/10 border border-amber-400/20 rounded-lg">
              <p className="text-xs text-amber-400 flex items-center">
                <AlertTriangle size={12} className="mr-1" />
                You need at least 100 FLR staked to create a pool
              </p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-2 bg-red-400/10 border border-red-400/20 rounded-lg">
              <p className="text-xs text-red-400">Error: {error}</p>
            </div>
          )}

          <button
            onClick={handleCreatePool}
            disabled={stakerInfo.stakedAmount < 100 || isCreatingPool}
            className={`w-full py-3 px-4 font-medium rounded-lg transition-all duration-200 mt-4 ${
              stakerInfo.stakedAmount >= 100 && !isCreatingPool
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                : "bg-indigo-900/50 text-indigo-400 cursor-not-allowed"
            }`}
          >
            {isCreatingPool ? "Creating..." : "Create Pool"}
          </button>
        </div>
      </div>
    </div>
  );
}
