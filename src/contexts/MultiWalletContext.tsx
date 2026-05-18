import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Wallet types for different blockchain families
export type WalletType = "evm" | "solana" | "tron" | "bitcoin" | "xrp";

export interface DetectedToken {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  address?: string;
  isNative: boolean;
}

export interface ConnectedWallet {
  id: string;
  type: WalletType;
  address: string;
  chainName: string;
  balance?: string;
  isConnected: boolean;
  tokens?: DetectedToken[];
}

interface MultiWalletContextType {
  connectedWallets: ConnectedWallet[];
  connectEVM: () => Promise<void>;
  connectSolana: () => Promise<void>;
  connectTron: () => Promise<void>;
  connectBitcoin: () => Promise<void>;
  connectXRP: () => Promise<void>;
  disconnectWallet: (walletId: string) => void;
  isAnyWalletConnected: boolean;
}

const MultiWalletContext = createContext<MultiWalletContextType | undefined>(undefined);

export function useMultiWallet() {
  const context = useContext(MultiWalletContext);
  if (!context) {
    throw new Error("useMultiWallet must be used within MultiWalletProvider");
  }
  return context;
}

interface MultiWalletProviderProps {
  children: ReactNode;
}

export function MultiWalletProvider({ children }: MultiWalletProviderProps) {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const { toast } = useToast();

  const isAnyWalletConnected = connectedWallets.length > 0;

  // EVM Wallet Connection (WalletConnect - already implemented)
  const connectEVM = async () => {
    // This delegates to the existing WalletContext
    // Just showing a notice here
    toast({
      title: "EVM Wallet",
      description: "Use the 'Connect Wallet' button in the header for EVM chains (Ethereum, BSC, Polygon, etc.)",
    });
  };

  // Solana Wallet Connection (Phantom/Solflare)
  const connectSolana = async () => {
    try {
      // Check if Phantom is installed
      const provider = (window as any).solana;
      
      if (!provider || !provider.isPhantom) {
        toast({
          title: "Phantom Not Installed",
          description: (
            <div className="space-y-2">
              <p>Install Phantom wallet to connect to Solana:</p>
              <a 
                href="https://phantom.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Download Phantom →
              </a>
            </div>
          ),
        });
        return;
      }

      // Connect to Phantom
      const response = await provider.connect();
      const address = response.publicKey.toString();

      console.log("[Solana] Fetching token balances...");

      // Fetch SOL balance and SPL tokens
      const tokens: DetectedToken[] = [];

      try {
        // Fetch SOL balance via Solana RPC
        const solBalanceResponse = await fetch("https://api.mainnet-beta.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getBalance",
            params: [address],
          }),
        });

        const solBalanceData = await solBalanceResponse.json();
        const solBalance = (solBalanceData.result?.value || 0) / 1e9; // Convert lamports to SOL

        if (solBalance > 0.0001) {
          tokens.push({
            symbol: "SOL",
            name: "Solana",
            balance: solBalance.toFixed(6),
            decimals: 9,
            isNative: true,
          });
        }

        // Fetch SPL token accounts
        const tokenAccountsResponse = await fetch("https://api.mainnet-beta.solana.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
              address,
              { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
              { encoding: "jsonParsed" },
            ],
          }),
        });

        const tokenAccountsData = await tokenAccountsResponse.json();
        const tokenAccounts = tokenAccountsData.result?.value || [];

        console.log(`[Solana] Found ${tokenAccounts.length} SPL token accounts`);

        for (const account of tokenAccounts) {
          const tokenInfo = account.account.data.parsed.info;
          const tokenAmount = tokenInfo.tokenAmount;
          
          if (tokenAmount.uiAmount && tokenAmount.uiAmount > 0.0001) {
            // Fetch token metadata (symbol, name)
            try {
              const mintAddress = tokenInfo.mint;
              
              // Try to get token metadata from token-list or Helius
              tokens.push({
                symbol: "SPL", // Would need metadata API for actual symbol
                name: mintAddress.slice(0, 8) + "...",
                balance: tokenAmount.uiAmount.toFixed(6),
                decimals: tokenAmount.decimals,
                address: mintAddress,
                isNative: false,
              });
            } catch (metaError) {
              console.warn("[Solana] Could not fetch token metadata:", metaError);
            }
          }
        }

      } catch (tokenError) {
        console.error("[Solana] Token detection error:", tokenError);
      }

      // Add to connected wallets with tokens
      const newWallet: ConnectedWallet = {
        id: `solana-${address}`,
        type: "solana",
        address,
        chainName: "Solana",
        isConnected: true,
        tokens,
      };

      setConnectedWallets((prev) => [...prev, newWallet]);

      toast({
        title: "Solana Wallet Connected",
        description: `Found ${tokens.length} asset(s) - ${address.slice(0, 8)}...${address.slice(-8)}`,
      });

    } catch (error: any) {
      console.error("[Solana] Connection error:", error);
      
      if (error.code === 4001) {
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the connection request",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Phantom wallet",
          variant: "destructive",
        });
      }
    }
  };

  // TRON Wallet Connection (TronLink)
  const connectTron = async () => {
    try {
      // Check if TronLink is installed
      const tronWeb = (window as any).tronWeb;
      
      if (!tronWeb || !tronWeb.ready) {
        toast({
          title: "TronLink Not Installed",
          description: (
            <div className="space-y-2">
              <p>Install TronLink wallet to connect to TRON:</p>
              <a 
                href="https://www.tronlink.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Download TronLink →
              </a>
            </div>
          ),
        });
        return;
      }

      // Request account access
      const accounts = await tronWeb.request({ method: "tron_requestAccounts" });
      const address = accounts[0];

      console.log("[TRON] Fetching token balances...");

      // Fetch TRX balance and TRC20 tokens
      const tokens: DetectedToken[] = [];

      try {
        // Fetch TRX balance
        const trxBalance = await tronWeb.trx.getBalance(address);
        const trxBalanceInTRX = trxBalance / 1e6; // Convert sun to TRX

        if (trxBalanceInTRX > 0.0001) {
          tokens.push({
            symbol: "TRX",
            name: "TRON",
            balance: trxBalanceInTRX.toFixed(6),
            decimals: 6,
            isNative: true,
          });
        }

        // Fetch TRC20 tokens using TronGrid API
        try {
          const trc20Response = await fetch(
            `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=200`
          );
          
          if (trc20Response.ok) {
            const trc20Data = await trc20Response.json();
            
            // Get unique token addresses
            const tokenAddresses = new Set<string>();
            if (trc20Data.data) {
              trc20Data.data.forEach((tx: any) => {
                if (tx.token_info?.address) {
                  tokenAddresses.add(tx.token_info.address);
                }
              });
            }

            console.log(`[TRON] Found ${tokenAddresses.size} unique TRC20 tokens`);

            // Fetch balance for each token
            for (const tokenAddr of Array.from(tokenAddresses).slice(0, 20)) { // Limit to 20 tokens
              try {
                const contract = await tronWeb.contract().at(tokenAddr);
                const balance = await contract.balanceOf(address).call();
                const decimals = await contract.decimals().call();
                const symbol = await contract.symbol().call();
                const name = await contract.name().call();

                const balanceFloat = Number(balance) / Math.pow(10, Number(decimals));

                if (balanceFloat > 0.0001) {
                  tokens.push({
                    symbol: symbol || "TRC20",
                    name: name || `Token ${tokenAddr.slice(0, 8)}`,
                    balance: balanceFloat.toFixed(6),
                    decimals: Number(decimals),
                    address: tokenAddr,
                    isNative: false,
                  });
                }
              } catch (tokenError) {
                console.warn(`[TRON] Could not fetch token ${tokenAddr}:`, tokenError);
              }
            }
          }
        } catch (apiError) {
          console.warn("[TRON] TronGrid API error:", apiError);
        }

      } catch (tokenError) {
        console.error("[TRON] Token detection error:", tokenError);
      }

      // Add to connected wallets with tokens
      const newWallet: ConnectedWallet = {
        id: `tron-${address}`,
        type: "tron",
        address,
        chainName: "TRON",
        isConnected: true,
        tokens,
      };

      setConnectedWallets((prev) => [...prev, newWallet]);

      toast({
        title: "TRON Wallet Connected",
        description: `Found ${tokens.length} asset(s) - ${address.slice(0, 8)}...${address.slice(-8)}`,
      });

    } catch (error: any) {
      console.error("[TRON] Connection error:", error);
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to TronLink wallet",
        variant: "destructive",
      });
    }
  };

  // Bitcoin Wallet Connection
  const connectBitcoin = async () => {
    toast({
      title: "Bitcoin Wallet",
      description: (
        <div className="space-y-2">
          <p>Bitcoin integration requires:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Hardware wallet (Ledger/Trezor)</li>
            <li>• Or browser extension (Unisat, Xverse)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Coming soon - Integration in progress
          </p>
        </div>
      ),
    });
  };

  // XRP Wallet Connection
  const connectXRP = async () => {
    toast({
      title: "XRP Wallet",
      description: (
        <div className="space-y-2">
          <p>XRP integration options:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• XUMM wallet (Mobile)</li>
            <li>• Crossmark extension (Browser)</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Coming soon - Integration in progress
          </p>
        </div>
      ),
    });
  };

  // Disconnect a specific wallet
  const disconnectWallet = (walletId: string) => {
    setConnectedWallets((prev) => prev.filter((w) => w.id !== walletId));
    
    const wallet = connectedWallets.find((w) => w.id === walletId);
    if (wallet) {
      toast({
        title: "Wallet Disconnected",
        description: `${wallet.chainName} wallet disconnected`,
      });
    }
  };

  // Auto-detect existing connections on mount
  useEffect(() => {
    const detectExistingConnections = async () => {
      const detected: ConnectedWallet[] = [];

      // Check Phantom (Solana)
      try {
        const solanaProvider = (window as any).solana;
        if (solanaProvider && solanaProvider.isConnected) {
          const publicKey = solanaProvider.publicKey?.toString();
          if (publicKey) {
            detected.push({
              id: `solana-${publicKey}`,
              type: "solana",
              address: publicKey,
              chainName: "Solana",
              isConnected: true,
            });
          }
        }
      } catch (e) {
        // Phantom not installed or not connected
      }

      // Check TronLink (TRON)
      try {
        const tronWeb = (window as any).tronWeb;
        if (tronWeb && tronWeb.ready && tronWeb.defaultAddress.base58) {
          detected.push({
            id: `tron-${tronWeb.defaultAddress.base58}`,
            type: "tron",
            address: tronWeb.defaultAddress.base58,
            chainName: "TRON",
            isConnected: true,
          });
        }
      } catch (e) {
        // TronLink not installed or not connected
      }

      if (detected.length > 0) {
        setConnectedWallets(detected);
        console.log(`[MultiWallet] Auto-detected ${detected.length} existing connections`);
      }
    };

    // Wait for window to load
    if (typeof window !== "undefined") {
      detectExistingConnections();
    }
  }, []);

  return (
    <MultiWalletContext.Provider
      value={{
        connectedWallets,
        connectEVM,
        connectSolana,
        connectTron,
        connectBitcoin,
        connectXRP,
        disconnectWallet,
        isAnyWalletConnected,
      }}
    >
      {children}
    </MultiWalletContext.Provider>
  );
}