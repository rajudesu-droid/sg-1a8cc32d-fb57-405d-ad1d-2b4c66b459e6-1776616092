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
      
      // MORALIS API INTEGRATION - MULTI-CHAIN DETECTION
      // Fetch balances from ALL supported EVM chains, not just connected chain
      const moralisApiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
      
      if (address && moralisApiKey) {
        // Map chainId to Moralis chain format
        const chainMap: Record<number, { id: string; name: string }> = {
          1: { id: "0x1", name: "Ethereum" },
          56: { id: "0x38", name: "BSC" },
          137: { id: "0x89", name: "Polygon" },
          43114: { id: "0xa86a", name: "Avalanche" },
          42161: { id: "0xa4b1", name: "Arbitrum" },
          10: { id: "0xa", name: "Optimism" },
          8453: { id: "0x2105", name: "Base" },
          250: { id: "0xfa", name: "Fantom" },
          25: { id: "0x19", name: "Cronos" },
          100: { id: "0x64", name: "Gnosis" },
          324: { id: "0x144", name: "zkSync" },
          59144: { id: "0xe708", name: "Linea" },
        };

        console.log(`[WalletContext] Fetching balances from ALL supported chains...`);

        // Fetch from ALL chains in parallel
        const chainRequests = Object.entries(chainMap).map(async ([chainIdStr, chainInfo]) => {
          try {
            const response = await fetch(
              `https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainInfo.id}`,
              {
                headers: {
                  "X-API-Key": moralisApiKey,
                  "accept": "application/json",
                },
              }
            );

            if (!response.ok) {
              console.warn(`[WalletContext] Moralis API error for ${chainInfo.name}: ${response.status}`);
              return [];
            }

            const data = await response.json();
            console.log(`[WalletContext] ${chainInfo.name}: Found ${data.length || 0} tokens`);
            
            const chainAssets: DetectedAsset[] = [];
            
            if (Array.isArray(data) && data.length > 0) {
              data.forEach((token: any) => {
                if (!token.balance || token.balance === "0") return;
                
                const decimals = parseInt(token.decimals || "18");
                const balanceInWei = BigInt(token.balance);
                const divisor = BigInt(10 ** decimals);
                const balanceFloat = Number(balanceInWei) / Number(divisor);
                
                if (balanceFloat > 0.0001) {
                  chainAssets.push({
                    chainId: parseInt(chainIdStr),
                    network: chainInfo.name,
                    symbol: token.symbol,
                    name: token.name,
                    balance: balanceFloat.toFixed(6),
                    decimals: decimals,
                    address: token.token_address,
                    isNative: false,
                    source: "detected",
                  });
                }
              });
            }

            return chainAssets;
          } catch (error) {
            console.warn(`[WalletContext] Error fetching ${chainInfo.name}:`, error);
            return [];
          }
        });

        // Wait for all chain requests
        const allChainAssets = await Promise.all(chainRequests);
        
        // Flatten and add to assets
        allChainAssets.forEach(chainAssets => {
          assets.push(...chainAssets);
        });

        // Also fetch native balances for all chains
        const nativeBalanceRequests = Object.entries(chainMap).map(async ([chainIdStr, chainInfo]) => {
          try {
            const response = await fetch(
              `https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chainInfo.id}`,
              {
                headers: {
                  "X-API-Key": moralisApiKey,
                  "accept": "application/json",
                },
              }
            );

            if (!response.ok) return null;

            const data = await response.json();
            const balanceInWei = BigInt(data.balance || "0");
            
            if (balanceInWei > BigInt(0)) {
              const network = supportedNetworks.find(n => n.id === parseInt(chainIdStr));
              const decimals = 18; // Most native tokens use 18 decimals
              const divisor = BigInt(10 ** decimals);
              const balanceFloat = Number(balanceInWei) / Number(divisor);

              if (network && balanceFloat > 0.0001) {
                return {
                  chainId: parseInt(chainIdStr),
                  network: network.name,
                  symbol: network.symbol,
                  name: network.symbol,
                  balance: balanceFloat.toFixed(6),
                  decimals: decimals,
                  isNative: true,
                  source: "detected" as const,
                };
              }
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        const nativeBalances = await Promise.all(nativeBalanceRequests);
        nativeBalances.forEach(balance => {
          if (balance) assets.push(balance);
        });
      }

      console.log(`[WalletContext] Detected ${assets.length} total assets across ALL chains`);
      setDetectedAssets(assets);
      
    } catch (err) {
      console.error("[WalletContext] Failed to refresh balances:", err);
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