import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { walletConnectProjectId, supportedNetworks } from "@/lib/walletConfig";

interface DetectedAsset {
  chainId: number;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address?: string;
  isNative: boolean;
  source: "auto-detected" | "manual";
}

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  error: Error | null;
  detectedAssets: DetectedAsset[];
  connectWallet: () => void;
  disconnectWallet: () => void;
  refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [detectedAssets, setDetectedAssets] = useState<DetectedAsset[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get native balance for current chain
  const { data: nativeBalance } = useBalance({
    address: address,
  });

  const connectWallet = () => {
    const walletConnectConnector = connectors.find(
      (c) => c.id === "walletConnect"
    );
    if (walletConnectConnector) {
      connect({ connector: walletConnectConnector });
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setDetectedAssets([]);
  };

  const refreshBalances = async () => {
    if (!address) return;
    
    setIsRefreshing(true);
    try {
      // In production, this would call your backend API or indexing service
      // For now, we'll detect native assets on supported networks
      const assets: DetectedAsset[] = [];

      // Add current chain native balance if available
      if (nativeBalance && chainId) {
        const network = supportedNetworks.find((n) => n.id === chainId);
        if (network) {
          assets.push({
            chainId: chainId,
            network: network.name,
            symbol: network.symbol,
            name: network.symbol,
            balance: nativeBalance.formatted,
            decimals: nativeBalance.decimals,
            isNative: true,
            source: "auto-detected",
          });
        }
      }

      // Mock detection of tokens across networks
      // In production: query indexer API, Moralis, Alchemy, or custom backend service
      const mockTokens: DetectedAsset[] = [
        {
          chainId: 1,
          network: "Ethereum",
          symbol: "USDT",
          name: "Tether USD",
          balance: "1250.50",
          decimals: 6,
          address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
          isNative: false,
          source: "auto-detected",
        },
        {
          chainId: 1,
          network: "Ethereum",
          symbol: "USDC",
          name: "USD Coin",
          balance: "3420.80",
          decimals: 6,
          address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          isNative: false,
          source: "auto-detected",
        },
        {
          chainId: 56,
          network: "BSC",
          symbol: "USDT",
          name: "Tether USD",
          balance: "850.25",
          decimals: 18,
          address: "0x55d398326f99059ff775485246999027b3197955",
          isNative: false,
          source: "auto-detected",
        },
        {
          chainId: 137,
          network: "Polygon",
          symbol: "USDC",
          name: "USD Coin",
          balance: "620.00",
          decimals: 6,
          address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          isNative: false,
          source: "auto-detected",
        },
      ];

      setDetectedAssets([...assets, ...mockTokens]);
    } catch (err) {
      console.error("Failed to refresh balances:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      refreshBalances();
    }
  }, [isConnected, address, nativeBalance]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        chainId,
        isConnecting: isPending,
        error: error ?? null,
        detectedAssets,
        connectWallet,
        disconnectWallet,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}