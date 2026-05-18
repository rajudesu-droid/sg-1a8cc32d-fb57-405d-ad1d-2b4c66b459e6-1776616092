import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// Wallet types for different blockchain families
export type WalletType = "evm" | "solana" | "tron" | "bitcoin" | "xrp";

export interface ConnectedWallet {
  id: string;
  type: WalletType;
  address: string;
  chainName: string;
  balance?: string;
  isConnected: boolean;
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

      // Add to connected wallets
      const newWallet: ConnectedWallet = {
        id: `solana-${address}`,
        type: "solana",
        address,
        chainName: "Solana",
        isConnected: true,
      };

      setConnectedWallets((prev) => [...prev, newWallet]);

      toast({
        title: "Solana Wallet Connected",
        description: `Connected: ${address.slice(0, 8)}...${address.slice(-8)}`,
      });

      // TODO: Fetch Solana balance and SPL tokens via RPC
      // const balance = await connection.getBalance(publicKey);

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

      // Add to connected wallets
      const newWallet: ConnectedWallet = {
        id: `tron-${address}`,
        type: "tron",
        address,
        chainName: "TRON",
        isConnected: true,
      };

      setConnectedWallets((prev) => [...prev, newWallet]);

      toast({
        title: "TRON Wallet Connected",
        description: `Connected: ${address.slice(0, 8)}...${address.slice(-8)}`,
      });

      // TODO: Fetch TRON balance and TRC20 tokens
      // const balance = await tronWeb.trx.getBalance(address);

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