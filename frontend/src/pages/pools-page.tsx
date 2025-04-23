import { useState, useEffect } from 'react';
import { Trophy, Users, Coins, Clock, Zap, ArrowRight, Flame } from 'lucide-react';

// Types
interface Pool {
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
}

export default function GamingPoolsSection() {
  // Mock data with more variety for demonstration
  const [pools, setPools] = useState<Pool[]>([
    {
      id: "eth-classic",
      asset: "Ethereum",
      icon: "/ethereum.svg",
      entryFee: 10,
      feeToken: "FLR",
      maxPlayers: 64,
      currentPlayers: 28,
      status: 'open',
      potentialReward: 640,
      difficulty: 'medium',
      popularity: 8
    },
    {
      id: "btc-royale",
      asset: "Bitcoin",
      icon: "/bitcoin.svg",
      entryFee: 25,
      feeToken: "FLR",
      maxPlayers: 32,
      currentPlayers: 32,
      status: 'active',
      timeRemaining: 120,
      potentialReward: 800,
      difficulty: 'hard',
      popularity: 9
    },
    {
      id: "sol-sprint",
      asset: "Solana",
      icon: "/solana.svg",
      entryFee: 5,
      feeToken: "FLR",
      maxPlayers: 128,
      currentPlayers: 42,
      status: 'open',
      potentialReward: 640,
      difficulty: 'easy',
      popularity: 7
    },
    {
      id: "flare-fusion",
      asset: "Flare",
      icon: "/flare.svg",
      entryFee: 50,
      feeToken: "FLR",
      maxPlayers: 16,
      currentPlayers: 16,
      status: 'completed',
      potentialReward: 800,
      difficulty: 'expert',
      popularity: 6
    },
    {
      id: "avax-arena",
      asset: "Avalanche",
      icon: "/avax.svg",
      entryFee: 15,
      feeToken: "FLR",
      maxPlayers: 48,
      currentPlayers: 12,
      status: 'open',
      potentialReward: 720,
      difficulty: 'medium',
      popularity: 5
    },
    {
      id: "dot-duel",
      asset: "Polkadot",
      icon: "/polkadot.svg",
      entryFee: 8,
      feeToken: "FLR",
      maxPlayers: 64,
      currentPlayers: 58,
      status: 'filling',
      potentialReward: 512,
      difficulty: 'medium',
      popularity: 7
    },
    {
      id: "ada-arena",
      asset: "Cardano",
      icon: "/cardano.svg",
      entryFee: 12,
      feeToken: "FLR",
      maxPlayers: 32,
      currentPlayers: 14,
      status: 'open',
      potentialReward: 384,
      difficulty: 'easy',
      popularity: 6
    },
    {
      id: "matic-mayhem",
      asset: "Polygon",
      icon: "/polygon.svg",
      entryFee: 6,
      feeToken: "FLR",
      maxPlayers: 100,
      currentPlayers: 87,
      status: 'filling',
      potentialReward: 600,
      difficulty: 'hard',
      popularity: 8
    },
    {
      id: "bnb-battle",
      asset: "Binance",
      icon: "/bnb.svg",
      entryFee: 18,
      feeToken: "FLR",
      maxPlayers: 48,
      currentPlayers: 48,
      status: 'active',
      timeRemaining: 300,
      potentialReward: 864,
      difficulty: 'hard',
      popularity: 9
    },
    {
      id: "xrp-xtreme",
      asset: "XRP",
      icon: "/xrp.svg",
      entryFee: 20,
      feeToken: "FLR",
      maxPlayers: 24,
      currentPlayers: 3,
      status: 'open',
      potentialReward: 480,
      difficulty: 'medium',
      popularity: 4
    }
  ]);
  
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visiblePools, setVisiblePools] = useState<number>(6);
  const [animatingPoolId, setAnimatingPoolId] = useState<string | null>(null);
  
  // Simulate loading more pools
  const loadMorePools = () => {
    if (visiblePools < filteredPools.length) {
      setVisiblePools(prev => Math.min(prev + 6, filteredPools.length));
    }
  };
  
  // Add animation effect when joining a pool
  const joinPool = (poolId: string) => {
    setAnimatingPoolId(poolId);
    setTimeout(() => {
      setAnimatingPoolId(null);
      alert(`Connecting wallet to join ${poolId}`);
    }, 800);
  };
  
  // Filter, sort and search pools
  const filteredPools = pools
    .filter(pool => {
      // Filter by status
      const statusMatch = activeFilter === 'all' || pool.status === activeFilter;
      
      // Filter by search
      const searchMatch = !searchQuery || 
        pool.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.id.toLowerCase().includes(searchQuery.toLowerCase());
        
      return statusMatch && searchMatch;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'reward':
          return b.potentialReward - a.potentialReward;
        case 'fee':
          return a.entryFee - b.entryFee;
        case 'filling':
          return (b.currentPlayers / b.maxPlayers) - (a.currentPlayers / a.maxPlayers);
        default:
          return 0;
      }
    });
  
  // Format time remaining in minutes and seconds
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-orange-500';
      case 'expert': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  // Simulate time decreasing for active pools
  useEffect(() => {
    const timer = setInterval(() => {
      setPools(prevPools => 
        prevPools.map(pool => {
          if (pool.status === 'active' && pool.timeRemaining) {
            const newTime = pool.timeRemaining - 1;
            if (newTime <= 0) {
              return { ...pool, status: 'completed', timeRemaining: undefined };
            }
            return { ...pool, timeRemaining: newTime };
          }
          return pool;
        })
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get appropriate button info based on pool status
  const getButtonInfo = (pool: Pool) => {
    switch (pool.status) {
      case 'open':
        return { 
          text: 'Join Pool', 
          disabled: false,
          action: () => joinPool(pool.id),
          className: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
        };
      case 'filling':
        return { 
          text: 'Almost Full!', 
          disabled: false,
          action: () => joinPool(pool.id),
          className: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
        };
      case 'active':
        return { 
          text: 'In Progress', 
          disabled: true,
          action: () => {},
          className: 'bg-blue-100 text-blue-600 cursor-not-allowed'
        };
      case 'completed':
        return { 
          text: 'Completed', 
          disabled: true,
          action: () => {},
          className: 'bg-gray-100 text-gray-500 cursor-not-allowed'
        };
      default:
        return { 
          text: 'Join Pool', 
          disabled: false,
          action: () => joinPool(pool.id),
          className: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with animated background */}
        <div className="relative overflow-hidden rounded-2xl mb-8 bg-black bg-opacity-30 p-8 border border-indigo-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <div className="absolute -inset-1 bg-grid-white/5 [mask-image:linear-gradient(white,transparent)]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Minority Wins Game Pools
              </h1>
              <p className="mt-2 text-indigo-200">
                Choose the minority option to advance. Last players standing win it all!
              </p>
            </div>
            
            <div className="flex space-x-4">
              <div className="bg-indigo-900/50 backdrop-blur-sm p-3 rounded-xl flex items-center border border-indigo-700/30">
                <Zap className="text-yellow-400 mr-2" size={20} />
                <div>
                  <p className="text-xs text-indigo-300">Total Prize Pool</p>
                  <p className="font-bold text-yellow-400">
                    {pools.reduce((sum, pool) => sum + pool.potentialReward, 0)} FLR
                  </p>
                </div>
              </div>
              
              <div className="bg-indigo-900/50 backdrop-blur-sm p-3 rounded-xl flex items-center border border-indigo-700/30">
                <Users className="text-green-400 mr-2" size={20} />
                <div>
                  <p className="text-xs text-indigo-300">Active Players</p>
                  <p className="font-bold text-green-400">
                    {pools.reduce((sum, pool) => sum + pool.currentPlayers, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters and controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-indigo-900/30 border border-indigo-600/30 rounded-lg py-3 px-4 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex rounded-lg overflow-hidden border border-indigo-600/30">
            <button 
              onClick={() => setActiveFilter('all')} 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50'}`}
            >
              All Pools
            </button>
            <button 
              onClick={() => setActiveFilter('open')} 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeFilter === 'open' ? 'bg-green-600 text-white' : 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setActiveFilter('active')} 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/50'}`}
            >
              Active
            </button>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-indigo-900/30 border border-indigo-600/30 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="popularity">Sort by: Popularity</option>
            <option value="reward">Sort by: Highest Reward</option>
            <option value="fee">Sort by: Lowest Entry Fee</option>
            <option value="filling">Sort by: Filling Fast</option>
          </select>
        </div>
        
        {/* Featured Pool (if any) */}
        {filteredPools.length > 0 && filteredPools[0].popularity >= 8 && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-amber-500/30 group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-amber-900/20"></div>
            <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500 to-amber-600 text-black font-bold py-1 px-4 rounded-bl-lg">
              FEATURED
            </div>
            
            <div className="relative p-6 md:p-8 bg-black/50 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      {/* Asset icon would go here */}
                      <span className="text-3xl font-bold text-white">{filteredPools[0].asset.charAt(0)}</span>
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold text-white">{filteredPools[0].asset} Premium Pool</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          filteredPools[0].status === 'open' ? 'bg-green-900/50 text-green-400' :
                          filteredPools[0].status === 'filling' ? 'bg-yellow-900/50 text-yellow-400' :
                          filteredPools[0].status === 'active' ? 'bg-blue-900/50 text-blue-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {filteredPools[0].status.toUpperCase()}
                        </span>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/30 ${getDifficultyColor(filteredPools[0].difficulty)}`}>
                          {filteredPools[0].difficulty.toUpperCase()}
                        </span>
                        
                        <div className="flex items-center">
                          <Flame className="text-red-500 h-4 w-4" />
                          <span className="ml-1 text-xs text-indigo-200">Popular</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-indigo-900/30 rounded-lg p-3 border border-indigo-700/20">
                      <p className="text-xs text-indigo-300">Entry Fee</p>
                      <p className="text-xl font-bold text-white">{filteredPools[0].entryFee} FLR</p>
                    </div>
                    
                    <div className="bg-indigo-900/30 rounded-lg p-3 border border-indigo-700/20">
                      <p className="text-xs text-indigo-300">Players</p>
                      <p className="text-xl font-bold text-white">
                        {filteredPools[0].currentPlayers} / {filteredPools[0].maxPlayers}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-900/30 rounded-lg p-3 border border-indigo-700/20">
                      <p className="text-xs text-indigo-300">Reward Pool</p>
                      <p className="text-xl font-bold text-amber-400">{filteredPools[0].potentialReward} FLR</p>
                    </div>
                    
                    {filteredPools[0].timeRemaining && (
                      <div className="bg-indigo-900/30 rounded-lg p-3 border border-indigo-700/20">
                        <p className="text-xs text-indigo-300">Time Left</p>
                        <p className="text-xl font-bold text-red-400">{formatTimeRemaining(filteredPools[0].timeRemaining)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-2/3">
                      <div className="h-3 w-full bg-indigo-900/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            filteredPools[0].currentPlayers / filteredPools[0].maxPlayers > 0.75 ? 'bg-gradient-to-r from-amber-400 to-red-500' : 'bg-gradient-to-r from-green-400 to-cyan-500'
                          }`}
                          style={{ width: `${(filteredPools[0].currentPlayers / filteredPools[0].maxPlayers) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-indigo-300 mt-1">
                        {Math.round((filteredPools[0].currentPlayers / filteredPools[0].maxPlayers) * 100)}% Full
                        {filteredPools[0].currentPlayers / filteredPools[0].maxPlayers > 0.8 && 
                          <span className="text-amber-400 ml-1">Filling Fast!</span>
                        }
                      </p>
                    </div>
                    
                    <button
                      onClick={getButtonInfo(filteredPools[0]).action}
                      disabled={getButtonInfo(filteredPools[0]).disabled}
                      className={`w-full sm:w-1/3 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${getButtonInfo(filteredPools[0]).className} ${
                        animatingPoolId === filteredPools[0].id ? 'animate-pulse scale-95' : ''
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {getButtonInfo(filteredPools[0]).text}
                        {!getButtonInfo(filteredPools[0]).disabled && <ArrowRight size={16} />}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="hidden lg:block">
                  <div className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-700/20 h-full">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                      <Trophy size={20} className="text-amber-400" /> 
                      Prize Distribution
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center">
                        <span className="text-indigo-300">Winner</span>
                        <span className="font-bold text-amber-400">{Math.round(filteredPools[0].potentialReward * 0.7)} FLR</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-indigo-300">Runner Up</span>
                        <span className="font-bold text-amber-400">{Math.round(filteredPools[0].potentialReward * 0.3)} FLR</span>
                      </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-indigo-700/20">
                      <h4 className="font-medium text-sm mb-2">Game Rules</h4>
                      <p className="text-xs text-indigo-300">
                        Each round, choose between Heads or Tails. If you pick the minority choice, you move on. 
                        If you're with the majority, you're eliminated! Last players standing win the prize pool.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Pool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredPools.slice(0, visiblePools).map((pool, index) => {
            if (index === 0 && pool.popularity >= 8) return null; // Skip the first one if it's featured above
            
            const buttonInfo = getButtonInfo(pool);
            const filledPercentage = (pool.currentPlayers / pool.maxPlayers) * 100;
            
            return (
              <div 
                key={pool.id}
                className={`bg-indigo-900/20 backdrop-blur-sm rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg ${
                  pool.status === 'open' ? 'border-green-500/30 hover:border-green-500/50' :
                  pool.status === 'filling' ? 'border-amber-500/30 hover:border-amber-500/50' :
                  pool.status === 'active' ? 'border-blue-500/30 hover:border-blue-500/50' :
                  'border-gray-600/30'
                } ${animatingPoolId === pool.id ? 'animate-pulse scale-95' : ''}`}
              >
                <div className="p-5">
                  {/* Pool Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        pool.status === 'open' ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
                        pool.status === 'filling' ? 'bg-gradient-to-br from-amber-400 to-orange-600' :
                        pool.status === 'active' ? 'bg-gradient-to-br from-blue-400 to-indigo-600' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        <span className="text-lg font-bold text-white">{pool.asset.charAt(0)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{pool.asset}</h3>
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pool.status === 'open' ? 'bg-green-900/50 text-green-400' :
                      pool.status === 'filling' ? 'bg-yellow-900/50 text-yellow-400' :
                      pool.status === 'active' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {pool.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Pool Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-indigo-300 mb-1">
                        <Coins size={12} />
                        <span>Entry Fee</span>
                      </div>
                      <span className="text-base font-bold text-white">{pool.entryFee} {pool.feeToken}</span>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-indigo-300 mb-1">
                        <Users size={12} />
                        <span>Players</span>
                      </div>
                      <span className="text-base font-bold text-white">{pool.currentPlayers} / {pool.maxPlayers}</span>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-indigo-300 mb-1">
                        <Trophy size={12} />
                        <span>Reward</span>
                      </div>
                      <span className="text-base font-bold text-amber-400">{pool.potentialReward} {pool.feeToken}</span>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-indigo-300 mb-1">
                        <Clock size={12} />
                        <span>Status</span>
                      </div>
                      {pool.status === 'active' && pool.timeRemaining ? (
                        <span className="text-base font-bold text-red-400">{formatTimeRemaining(pool.timeRemaining)}</span>
                      ) : (
                        <span className={`text-base font-bold ${getDifficultyColor(pool.difficulty)}`}>
                          {pool.difficulty.charAt(0).toUpperCase() + pool.difficulty.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-black/30 rounded-full mb-4 overflow-hidden">
                    <div 
                      className={`h-full ${
                        pool.status === 'completed' ? 'bg-gray-500' :
                        pool.status === 'active' ? 'bg-gradient-to-r from-blue-400 to-indigo-600 animate-pulse' : 
                        filledPercentage > 75 ? 'bg-gradient-to-r from-amber-400 to-red-500' :
                        'bg-gradient-to-r from-green-400 to-emerald-500'
                      }`}
                      style={{ width: `${filledPercentage}%` }}
                    ></div>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={buttonInfo.action}
                    disabled={buttonInfo.disabled}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${buttonInfo.className} flex items-center justify-center gap-2`}
                  >
                    {buttonInfo.text}
                    {!buttonInfo.disabled && <ArrowRight size={16} />}
                  </button>
                </div>
                
                {/* Game Rules Summary */}
                <div className="px-4 py-2 bg-black/20 border-t border-indigo-800/30">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-indigo-300">
                      Choose minority, survive rounds, win big!
                    </p>
                    {pool.popularity >= 7 && (
                      <div className="flex items-center">
                        <Flame className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-xs text-amber-400">Hot</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Load More Button */}
        {visiblePools < filteredPools.length && (
          <div className="text-center">
            <button
              onClick={loadMorePools}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              Load More Pools
              <ArrowRight className="ml-2" size={16} />
            </button>
          </div>
        )}
        
        {/* Empty State */}
        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Trophy className="text-indigo-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Pools Found</h3>
            <p className="text-indigo-300 max-w-md mx-auto">
              There are currently no pools matching your filters. Try adjusting your search or check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}