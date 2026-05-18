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

      // MORALIS API INTEGRATION - Detect ERC20/BEP20 tokens
      const moralisApiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
      
      if (address && chainId && moralisApiKey) {
        try {
          // Map chainId to Moralis chain format
          const chainMap: Record<number, string> = {
            1: "0x1",      // Ethereum
            56: "0x38",    // BSC
            137: "0x89",   // Polygon
            43114: "0xa86a", // Avalanche
          };
          
          const moralisChain = chainMap[chainId];
          
          if (moralisChain) {
            console.log(`[WalletContext] Fetching ERC20 tokens from Moralis for chain ${moralisChain}...`);
            
            const response = await fetch(
              `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${moralisChain}`,
              {
                headers: {
                  "X-API-Key": moralisApiKey,
                  "accept": "application/json",
                },
              }
            );

            if (!response.ok) {
              console.error(`[WalletContext] Moralis API error: ${response.status} ${response.statusText}`);
            } else {
              const data = await response.json();
              console.log(`[WalletContext] Moralis returned ${data.length || 0} tokens`);
              
              if (Array.isArray(data) && data.length > 0) {
                data.forEach((token: any) => {
                  // Skip tokens with 0 balance
                  if (!token.balance || token.balance === "0") return;
                  
                  // Convert balance from wei to human-readable
                  const decimals = parseInt(token.decimals || "18");
                  const balanceInWei = BigInt(token.balance);
                  const divisor = BigInt(10 ** decimals);
                  const balanceFloat = Number(balanceInWei) / Number(divisor);
                  
                  // Only add if balance > 0.0001
                  if (balanceFloat > 0.0001) {
                    assets.push({
                      chainId,
                      network: supportedNetworks.find(n => n.id === chainId)?.name || "Unknown",
                      symbol: token.symbol,
                      name: token.name,
                      balance: balanceFloat.toFixed(6),
                      decimals: decimals,
                      address: token.token_address,
                      isNative: false,
                      source: "detected",  // Real detected from Moralis
                    });
                  }
                });
              }
            }
          } else {
            console.log(`[WalletContext] Chain ${chainId} not supported by Moralis integration`);
          }
        } catch (tokenError) {
          console.error("[WalletContext] Moralis API error:", tokenError);
          // Continue with native balance even if token fetch fails
        }
      }

      console.log(`[WalletContext] Detected ${assets.length} total assets (native + tokens)`);
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