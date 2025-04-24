import { Link } from "react-router-dom";
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
        <div className="flex space-x-4">
          <Link
            to="/signup"
            className="px-4 py-2 border border-gray-600 rounded-md hover:border-pink-500 transition duration-300 text-sm font-medium"
          >
            Sign Up
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-pink-500 rounded-md hover:bg-pink-600 transition duration-300 text-sm font-medium"
          >
            Sign Up
          </Link>
          <ConnectButton />
        </div>
      </div>
    </div>
  );
};

export default Header;
