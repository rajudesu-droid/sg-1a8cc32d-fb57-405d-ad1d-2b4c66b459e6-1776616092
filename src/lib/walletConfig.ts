import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, avalanche } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// WalletConnect project ID - IMPORTANT: Replace with your actual project ID from https://cloud.walletconnect.com
export const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "REPLACE_WITH_YOUR_PROJECT_ID";

// Public RPC endpoints - no API keys in frontend
export const walletConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "LP Yield Autopilot",
        description: "Professional-grade LP yield automation platform",
        url: typeof window !== "undefined" ? window.location.origin : "https://lp-autopilot.com",
        icons: [typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : ""],
      },
      showQrModal: true,
    }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
  },
});

// Supported networks for asset detection
export const supportedNetworks = [
  { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io" },
  { id: 56, name: "BSC", symbol: "BNB", explorer: "https://bscscan.com" },
  { id: 137, name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", explorer: "https://snowtrace.io" },
] as const;