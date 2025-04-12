const Header = () => {
  return (
    <div>
      <nav className="relative bg-gray-800 bg-opacity-70 backdrop-blur-sm border-b border-gray-700">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded flex items-center justify-center">
                <span className="text-xl font-bold">MW</span>
              </div>
              <span className="ml-3 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                MinorityWin
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <a
                href="#"
                className="text-gray-300 hover:text-purple-400 px-2 py-1 transition duration-300"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-purple-400 px-2 py-1 transition duration-300"
              >
                How To Play
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-purple-400 px-2 py-1 transition duration-300"
              >
                Arenas
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-purple-400 px-2 py-1 transition duration-300"
              >
                Leaderboard
              </a>
              <button className="ml-4 px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition duration-300 shadow-lg shadow-purple-500/20">
                Connect Wallet
              </button>
            </div>

            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white focus:outline-none">
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
