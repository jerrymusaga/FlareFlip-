import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <div className="container mx-auto px-6 pt-6 relative">
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">
            <span className="text-white">FLARE</span>
            <span className="text-pink-500">FLIP</span>
          </h1>
        </div>
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-4 py-2 rounded-lg border border-yellow-600 shadow-sm hover:shadow-glow-gold transition-all duration-300">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openConnectModal,
                mounted,
              }) => {
                const connected = mounted && account;

                return (
                  <div>
                    {connected ? (
                      <button
                        onClick={openAccountModal}
                        className="flex items-center"
                      >
                        <span className="text-white font-medium">
                          {account.displayName}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={openConnectModal}
                        className="flex items-center"
                      >
                        <span className="text-white font-medium">
                          Connect Wallet
                        </span>
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
      </div>
    </div>
  );
};

export default Header;
