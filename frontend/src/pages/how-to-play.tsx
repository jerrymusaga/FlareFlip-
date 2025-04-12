import React, { useState, useEffect } from 'react';

const HowItWorksPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'gameplay' | 'strategies' | 'rewards'>('gameplay');
    const [animateIn, setAnimateIn] = useState(false);
    
    useEffect(() => {
      setAnimateIn(true);
    }, []);
  
    const handleTabChange = (tab: 'gameplay' | 'strategies' | 'rewards') => {
      setActiveTab(tab);
    };
  

  return (
    <div className="bg-gray-900 min-h-screen text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-purple-600 blur-3xl"></div>
          <div className="absolute top-40 right-20 w-96 h-96 rounded-full bg-indigo-600 blur-3xl"></div>
          <div className="absolute bottom-20 left-40 w-80 h-80 rounded-full bg-blue-600 blur-3xl"></div>
        </div>
      </div>

      
      {/* Page Header */}
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 transition duration-700 ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              How To Play & Win
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Master the art of going against the crowd and claim victory in our revolutionary Web3 gaming experience
          </p>
        </div>
      </div>
     
      {/* Tab Navigation */}
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition duration-700 delay-100 ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
      <div className="flex justify-center space-x-2 md:space-x-6 border-b border-gray-700 pb-2">
        <button 
          onClick={() => handleTabChange('gameplay')} 
          className={`px-4 py-3 text-center rounded-t-lg font-medium transition duration-300 ${
            activeTab === 'gameplay' 
              ? 'text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Gameplay Basics
        </button>
        <button 
          onClick={() => handleTabChange('strategies')} 
          className={`px-4 py-3 text-center rounded-t-lg font-medium transition duration-300 ${
            activeTab === 'strategies' 
              ? 'text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Winning Strategies
        </button>
        <button 
          onClick={() => handleTabChange('rewards')} 
          className={`px-4 py-3 text-center rounded-t-lg font-medium transition duration-300 ${
            activeTab === 'rewards' 
              ? 'text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Rewards & Prizes
        </button>
      </div>
    </div>
      
      {/* Tab Content */}
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'gameplay' && (
          <div className={`transition duration-700 delay-200 ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            {/* Game Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">1. Choose an Arena</h3>
                  <p className="text-gray-300">
                    Browse available arenas with different cryptocurrencies and prize pools. Each arena has a specific entry fee in FLR tokens.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">2. Enter the Game</h3>
                  <p className="text-gray-300">
                    Pay the entry fee in FLR tokens to join. Once the arena fills up with the required number of players, the game automatically begins.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">3. Make Your Decision</h3>
                  <p className="text-gray-300">
                    When the round starts, you'll be prompted to choose either Heads or Tails within the time limit.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Gameplay Illustration */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group mb-16">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Game Flow Example</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="text-center mb-3">
                      <div className="inline-block px-3 py-1 rounded-full bg-purple-900 text-purple-300 text-xs font-medium mb-2">
                        ROUND 1
                      </div>
                    </div>
                    <div className="flex justify-between mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Heads</div>
                        <div className="text-xl font-bold text-white">5</div>
                        <div className="text-xs text-red-400">Eliminated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Tails</div>
                        <div className="text-xl font-bold text-white">3</div>
                        <div className="text-xs text-green-400">Advanced</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      8 Total Players
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="text-center mb-3">
                      <div className="inline-block px-3 py-1 rounded-full bg-purple-900 text-purple-300 text-xs font-medium mb-2">
                        ROUND 2
                      </div>
                    </div>
                    <div className="flex justify-between mb-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Heads</div>
                        <div className="text-xl font-bold text-white">2</div>
                        <div className="text-xs text-red-400">Eliminated</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Tails</div>
                        <div className="text-xl font-bold text-white">1</div>
                        <div className="text-xs text-green-400">Advanced</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      3 Remaining Players
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 col-span-1 md:col-span-2">
                    <div className="text-center mb-3">
                      <div className="inline-block px-3 py-1 rounded-full bg-green-900 text-green-300 text-xs font-medium mb-2">
                        FINAL RESULT
                      </div>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="text-xl font-bold text-white">Winner Takes All</div>
                        <div className="text-2xl font-bold text-green-400 mt-1">2.5 ETH</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-300">
                  <p className="mb-4">
                    <span className="text-purple-400 font-semibold">Key Concept:</span> In each round, all players who chose the same option as the majority are eliminated. Only those who selected the minority option advance to the next round.
                  </p>
                  <p>
                    In the example above, 8 players started the game. In Round 1, 5 players chose Heads (majority) and were eliminated, while 3 players chose Tails (minority) and advanced. In Round 2, 2 players chose Heads (majority) and were eliminated, leaving 1 player who chose Tails as the winner of the entire prize pool.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Rules */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Game Rules</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ul className="space-y-4">
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">1</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            All players must make their decision (Heads or Tails) within the given time limit for each round.
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">2</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            After all choices are locked in, the system counts how many players chose each option.
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">3</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            Players who chose the option selected by the majority are eliminated from the game.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-4">
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">4</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            In case of a tie (equal number of Heads and Tails), all players advance to the next round.
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">5</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            If only one player remains, they win the entire prize pool. If two players remain in the final round, they split the prize.
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-900 flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-300 text-sm font-medium">6</span>
                        </div>
                        <div>
                          <p className="text-gray-300">
                            All transactions and game outcomes are verified and executed on the blockchain for complete transparency.
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'strategies' && (
          <div className={`transition duration-700 delay-200 ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            {/* Strategy Overview */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group mb-12">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">Strategic Thinking</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Success in MinorityWin requires more than luck—it demands strategic thinking and psychological awareness.
                  The key is to predict what the majority will choose, then select the opposite.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-xl font-bold text-white mb-3">Player Psychology</h4>
                    <p className="text-gray-300 mb-4">
                      Understanding how other players think is crucial. Most people have predictable patterns or biases when making binary choices.
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>People often choose Heads more frequently than Tails</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Players tend to avoid repeating the same choice that lost in the previous round</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Some players use random selection methods to be unpredictable</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-xl font-bold text-white mb-3">Game Theory Application</h4>
                    <p className="text-gray-300 mb-4">
                      The game is a real-world application of game theory and the concept of "anti-coordination games." 
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Every player is incentivized to choose differently than the majority</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>The Nash equilibrium is when players distribute choices evenly</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>As players are eliminated, strategy becomes more complex</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Winning Strategies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">

                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Pattern Recognition</h3>
                  <p className="text-gray-300">
                    Track previous rounds to identify player tendencies. Many players subconsciously avoid repeating their last choice.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Randomization</h3>
                  <p className="text-gray-300">
                    Sometimes being unpredictable is the best strategy. Use true randomization to avoid falling into predictable patterns.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative group hover:shadow-lg hover:shadow-purple-500/10 transition duration-300">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Late Round Strategy</h3>
                  <p className="text-gray-300">
                    In later rounds with fewer players, consider the psychology of your remaining opponents more carefully.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Advanced Tips */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Advanced Tips</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-3">Statistical Approach</h4>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Track historical data from previous games to identify common patterns</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Calculate probabilities based on remaining player count</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>In early rounds with many players, Heads is statistically more likely to be the majority</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-white mb-3">Psychological Tactics</h4>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Change your strategy if you notice opponents predicting your pattern</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>In final rounds, try to anticipate what your opponent thinks you'll choose</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Watch for "tell" patterns in your opponents' previous choices</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'rewards' && (
          <div className={`transition duration-700 delay-200 ${animateIn ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            {/* Reward Structure */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group mb-12">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Reward Structure</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <div className="text-center mb-4">
                      <div className="inline-block p-3 rounded-full bg-purple-900/50 mb-3">
                        <svg className="w-8 h-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Standard Arenas</h4>
                      <p className="text-gray-300 text-sm">
                        Winner takes all prize pool structure
                      </p>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Entry fees range from 10 to 1000 FLR tokens</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Prize pool = (entry fee × number of players)</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-purple-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>5% platform fee deducted from prize pool</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <div className="text-center mb-4">
                      <div className="inline-block p-3 rounded-full bg-blue-900/50 mb-3">
                        <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4H5z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Premium Arenas</h4>
                      <p className="text-gray-300 text-sm">
                        Higher stakes with crypto prizes
                      </p>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Entry fees in ETH, BTC, or other major cryptocurrencies</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Prize pools can reach several ETH/BTC</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>3% platform fee deducted from prize pool</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <div className="text-center mb-4">
                      <div className="inline-block p-3 rounded-full bg-indigo-900/50 mb-3">
                        <svg className="w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Special Events</h4>
                      <p className="text-gray-300 text-sm">
                        Unique tournaments with bonus rewards
                      </p>
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Limited-time tournaments with boosted prize pools</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>Seasonal rewards for top players</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-indigo-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>NFT prizes for tournament winners</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reward Distribution */}
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 relative group mb-12">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-10"></div>
              <div className="relative">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">Reward Distribution</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-3">Instant Payouts</h4>
                    <p className="text-gray-300 mb-4">
                      All rewards are distributed automatically and instantly through smart contracts:
                    </p>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Winnings are sent directly to your connected wallet</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>No withdrawal process - funds are immediately available</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Transaction history is recorded on the blockchain</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-white mb-3">Additional Benefits</h4>
                    <p className="text-gray-300 mb-4">
                      Winning players receive more than just cryptocurrency rewards:
                    </p>
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Exclusive NFTs for tournament winners</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Increased leaderboard ranking</span>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        <span>Access to VIP arenas with higher stakes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Play and Win?</h3>
              <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of players competing daily in MinorityWin arenas. Test your strategy, challenge your mind, and win crypto prizes!
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition duration-300 shadow-lg shadow-purple-500/20 text-lg font-medium">
                Connect Wallet & Start Playing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorksPage;