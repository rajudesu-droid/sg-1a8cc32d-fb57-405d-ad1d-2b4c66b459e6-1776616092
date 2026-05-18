import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";

interface UnifiedWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function UnifiedWalletModal({ open, onClose }: UnifiedWalletModalProps) {
  const { connectWallet: connectEVM, isConnecting: evmConnecting, isConnected: evmConnected } = useWallet();
  const { connectSolana, connectTron, connectedWallets } = useMultiWallet();
  
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "detecting" | "success" | "error">("idle");
  const [detectedChain, setDetectedChain] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (evmConnecting) {
      setConnectionState("connecting");
      setDetectedChain("EVM");
    } else if (evmConnected) {
      setConnectionState("success");
      setDetectedChain("EVM (Ethereum/BSC/Polygon/etc.)");
      setTimeout(() => {
        onClose();
        setConnectionState("idle");
      }, 2000);
    }
  }, [evmConnecting, evmConnected, onClose]);

  useEffect(() => {
    if (connectedWallets.length > 0) {
      const latestWallet = connectedWallets[connectedWallets.length - 1];
      setConnectionState("success");
      setDetectedChain(latestWallet.chainName);
      setTimeout(() => {
        onClose();
        setConnectionState("idle");
      }, 2000);
    }
  }, [connectedWallets, onClose]);

  const handleConnect = async () => {
    setConnectionState("connecting");
    setErrorMessage("");

    try {
      // Try EVM first (WalletConnect - most common)
      await connectEVM();
      
    } catch (error: any) {
      console.error("[UnifiedWallet] Connection error:", error);
      
      // If EVM fails, try auto-detecting other wallets
      setConnectionState("detecting");
      
      // Check for Phantom (Solana)
      if ((window as any).solana?.isPhantom) {
        try {
          await connectSolana();
          return;
        } catch (solanaError) {
          console.error("[UnifiedWallet] Solana connection failed:", solanaError);
        }
      }
      
      // Check for TronLink (TRON)
      if ((window as any).tronWeb?.ready) {
        try {
          await connectTron();
          return;
        } catch (tronError) {
          console.error("[UnifiedWallet] TRON connection failed:", tronError);
        }
      }
      
      // No wallet detected
      setConnectionState("error");
      setErrorMessage("No compatible wallet detected. Please install MetaMask, Phantom, or TronLink.");
    }
  };

  const handleClose = () => {
    setConnectionState("idle");
    setDetectedChain("");
    setErrorMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            One-click connection for all blockchain wallets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {connectionState === "idle" && (
            <div className="space-y-4">
              <Alert className="border-primary/50 bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <p className="font-semibold mb-2">Automatic Detection</p>
                  <p className="text-xs">
                    Click connect and we'll automatically detect your wallet type:
                  </p>
                  <ul className="text-xs mt-2 space-y-1 ml-4">
                    <li>• EVM: MetaMask, Trust Wallet, Coinbase, Rainbow (via WalletConnect QR)</li>
                    <li>• Solana: Phantom, Solflare</li>
                    <li>• TRON: TronLink</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Button onClick={handleConnect} className="w-full gap-2" size="lg">
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </Button>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold">How it works:</p>
                <ol className="space-y-1 ml-4">
                  <li>1. Click "Connect Wallet" button above</li>
                  <li>2. Scan QR code with your mobile wallet OR approve in browser extension</li>
                  <li>3. We'll automatically detect ALL your tokens across ALL chains</li>
                  <li>4. View your complete portfolio in one place</li>
                </ol>
              </div>
            </div>
          )}

          {(connectionState === "connecting" || connectionState === "detecting") && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {connectionState === "connecting" ? "Connecting..." : "Detecting wallet..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectionState === "connecting" 
                    ? "Scan QR code with your wallet app or approve in your browser extension"
                    : "Checking for installed wallets..."
                  }
                </p>
                {detectedChain && (
                  <p className="text-xs text-primary">
                    Detected: {detectedChain}
                  </p>
                )}
              </div>
            </div>
          )}

          {connectionState === "success" && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-success">Connected Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Detected: {detectedChain}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fetching all tokens...
                </p>
              </div>
            </div>
          )}

          {connectionState === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || "Failed to connect wallet. Please try again."}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold">Install a wallet:</p>
                <div className="grid gap-2">
                  <a 
                    href="https://metamask.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    → MetaMask (EVM chains)
                  </a>
                  <a 
                    href="https://phantom.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    → Phantom (Solana)
                  </a>
                  <a 
                    href="https://www.tronlink.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    → TronLink (TRON)
                  </a>
                </div>
              </div>
              
              <Button onClick={handleConnect} className="w-full" variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}