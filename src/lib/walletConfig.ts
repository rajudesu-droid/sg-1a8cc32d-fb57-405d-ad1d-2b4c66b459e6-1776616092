import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, avalanche } from "wagmi/chains";

// Public RPC endpoints - no API keys in frontend
export const walletConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
  },
});

// WalletConnect project ID - safe to expose in frontend
export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Supported networks for asset detection
export const supportedNetworks = [
  { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io" },
  { id: 56, name: "BSC", symbol: "BNB", explorer: "https://bscscan.com" },
  { id: 137, name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", explorer: "https://snowtrace.io" },
] as const;