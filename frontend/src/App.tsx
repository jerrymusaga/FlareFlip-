import LandingPage from "./pages/landing-page";
import HowItWorksPage from "./pages/how-to-play";
import "@rainbow-me/rainbowkit/styles.css";
import MinorityWinsGame from "./pages/playgame-page";
import PoolsPage from "./pages/pools";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Root from "./RootPage";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { flareTestnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "FlareFlip",
  projectId: "f6944e67672a59c2ac32f0ec4777dfd8",
  chains: [flareTestnet],
});

function App() {
  const queryClient = new QueryClient();
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<LandingPage />} />
        <Route path="/howitworks" element={<HowItWorksPage />} />
        <Route path="/pools" element={<PoolsPage/>} />
        <Route path="/playsection/:poolId" element={<MinorityWinsGame />} />
      </Route>
    )
  );
  return (
    <div className="bg-gray-950">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <RouterProvider router={router} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;
