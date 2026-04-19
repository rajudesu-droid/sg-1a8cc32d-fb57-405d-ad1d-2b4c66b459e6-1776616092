import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, avalanche } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// WalletConnect project ID - Read from environment variable
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "afebef3f2899f188bedb692a0fba05c0";

console.log("[WalletConfig] WalletConnect Project ID:", projectId ? "✓ Configured" : "✗ Missing");

// Public RPC endpoints - no API keys in frontend
export const walletConfig = createConfig({
  chains: [mainnet, bsc, polygon, avalanche],
  connectors: [
    walletConnect({
      projectId: projectId,
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

// Export the project ID for reference
export const walletConnectProjectId = projectId;

// Supported networks for asset detection
export const supportedNetworks = [
  { id: 1, name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io" },
  { id: 56, name: "BSC", symbol: "BNB", explorer: "https://bscscan.com" },
  { id: 137, name: "Polygon", symbol: "MATIC", explorer: "https://polygonscan.com" },
  { id: 43114, name: "Avalanche", symbol: "AVAX", explorer: "https://snowtrace.io" },
] as const;