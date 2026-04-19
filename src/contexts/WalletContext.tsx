import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { supportedNetworks } from "@/lib/walletConfig";

/**
 * Asset source tracking - CRITICAL for mode separation
 */
export type AssetSource = "detected" | "manual" | "simulated";

interface DetectedAsset {
  chainId: number;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address?: string;
  isNative: boolean;
  source: AssetSource;  // REQUIRED: tracks where this asset came from
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
    // Use WalletConnect connector
    const walletConnectConnector = connectors.find(
      (c) => c.id === "walletConnect"
    );
    
    if (walletConnectConnector) {
      console.log("[WalletContext] Connecting with WalletConnect");
      connect({ connector: walletConnectConnector });
    } else {
      console.error("[WalletContext] WalletConnect connector not found");
      // Fallback to first available connector
      if (connectors.length > 0) {
        console.log("[WalletContext] Using first available connector:", connectors[0].id);
        connect({ connector: connectors[0] });
      }
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
      const assets: DetectedAsset[] = [];

      // CRITICAL: Only add REAL detected assets
      // NO MOCK TOKENS in Shadow or Live Mode
      
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
            source: "detected",  // Real detected balance
          });
        }
      }

      // REAL IMPLEMENTATION REQUIRED:
      // In production, integrate with:
      // - Moralis API for multi-chain token balances
      // - Alchemy/Infura token API
      // - Covalent API
      // - Custom indexer service
      // - On-chain queries via wagmi/viem
      
      // EXAMPLE INTEGRATION PATTERN:
      /*
      if (address && chainId) {
        // Call real indexer API
        const response = await fetch(
          `https://api.moralis.io/v2/${address}/erc20?chain=0x${chainId.toString(16)}`
        );
        const tokens = await response.json();
        
        tokens.forEach((token: any) => {
          assets.push({
            chainId,
            network: supportedNetworks.find(n => n.id === chainId)?.name || "Unknown",
            symbol: token.symbol,
            name: token.name,
            balance: token.balance,
            decimals: token.decimals,
            address: token.token_address,
            isNative: false,
            source: "detected",  // Real detected from API
          });
        });
      }
      */

      console.log(`[WalletContext] Detected ${assets.length} real assets`);
      setDetectedAssets(assets);
      
    } catch (err) {
      console.error("[WalletContext] Failed to refresh balances:", err);
      
      // CRITICAL: On error, show empty state, NOT mock data
      setDetectedAssets([]);
      
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