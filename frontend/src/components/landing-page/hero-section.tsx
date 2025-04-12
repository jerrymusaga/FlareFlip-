import React, { useState, useEffect } from 'react';
import Header from '../header/header';

const HeroSection: React.FC = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  
  useEffect(() => {
    setIsAnimated(true);
  }, []);

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
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Left Content - Text */}
          <div className={`md:w-1/2 transition duration-1000 ${isAnimated ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block px-4 py-1  rounded-full bg-indigo-900 bg-opacity-50 text-blue-300 text-sm font-medium mb-7 border border-blue-700">
              PLAY TO WIN • 100% ON-CHAIN
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Win by Being Different
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Enter the arena where strategy beats the crowd. Choose heads or tails — but remember, only the minority advances! Outsmart other players and win massive crypto prizes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 ">
              <button onClick={()=> alert("okay")} className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg shadow-lg shadow-purple-500/20 transition duration-300 font-medium text-lg">
                Play Now
              </button>
              <button className="px-8 py-4 bg-gray-800 border border-indigo-500 hover:bg-gray-700 text-gray-300 rounded-lg transition duration-300 font-medium text-lg">
                How It Works
              </button>
            </div>
          </div>
          
          {/* Right Content - Featured Pool */}
          <div className={`md:w-1/2 mt-10 md:mt-0 transition duration-1000 delay-300 ${isAnimated ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 relative">
              {/* Glowing border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-30"></div>
              
              {/* Card content */}
              <div className="relative">
                <div className="p-1 bg-gradient-to-r from-purple-600 to-blue-600">
                  <div className="bg-gray-800 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Hot Arena</h2>
                    <div className="flex items-center">
                      <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      <span className="inline-block bg-gray-900 text-green-400 text-xs px-3 py-1 rounded-full uppercase font-semibold tracking-wider">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="text-2xl font-bold text-white">Ethereum Challenge</div>
                      <div className="text-purple-400 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                        Win 2.5 ETH
                      </div>
                    </div>
                    <div className="h-14 w-14 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor">
                        <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Players</div>
                      <div className="text-lg font-medium text-white flex items-center">
                        24/32
                        <span className="ml-2 text-sm text-green-400">75% Full</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Entry Fee</div>
                      <div className="text-lg font-medium text-white">10 FLR</div>
                      <div className="text-sm text-gray-400 mt-1">≈ $12.50 USD</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 bg-opacity-50 p-4 rounded-lg mb-6 border border-gray-700">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-purple-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="font-semibold text-purple-400">Game Rules:</span> Choose heads or tails each round. Players picking the majority option are eliminated. Last player standing wins the prize!
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition duration-300 shadow-lg shadow-purple-500/20 flex items-center justify-center font-medium">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Join Arena
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 transition duration-1000 delay-500 ${isAnimated ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-lg p-5 border border-gray-700 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium">Active Arenas</div>
              <div className="text-2xl font-bold text-white mt-2">12</div>
            </div>
          </div>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-lg p-5 border border-gray-700 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium">Total Players</div>
              <div className="text-2xl font-bold text-white mt-2">827</div>
            </div>
          </div>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-lg p-5 border border-gray-700 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium">Prize Value</div>
              <div className="text-2xl font-bold text-white mt-2">$283K</div>
            </div>
          </div>
          <div className="bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-lg p-5 border border-gray-700 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative flex flex-col items-center">
              <div className="text-gray-400 text-sm font-medium">Winners Today</div>
              <div className="text-2xl font-bold text-white mt-2">23</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;