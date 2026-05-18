import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, AlertCircle, CheckCircle2, Shield, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

interface WalletConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletConnectionModal({ open, onClose }: WalletConnectionModalProps) {
  const { connectWallet, isConnecting, error, isConnected } = useWallet();
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "failed">("idle");

  useEffect(() => {
    if (isConnecting) {
      setConnectionState("connecting");
    } else if (isConnected) {
      setConnectionState("connected");
      setTimeout(() => {
        onClose();
      }, 1500);
    } else if (error) {
      setConnectionState("failed");
    } else {
      setConnectionState("idle");
    }
  }, [isConnecting, isConnected, error, onClose]);

  const handleConnect = () => {
    // WalletConnect will show its own built-in QR modal
    connectWallet();
  };

  const handleClose = () => {
    setConnectionState("idle");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your wallet using WalletConnect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {connectionState === "idle" && (
            <div className="space-y-4">
              <Alert className="border-primary/50 bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  This app is fully non-custodial. We never ask for or store your private keys or seed phrase.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <Button onClick={handleConnect} className="w-full gap-2" size="lg">
                  <Smartphone className="h-4 w-4" />
                  Connect with WalletConnect
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  A QR code will appear for you to scan with your mobile wallet
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/10 p-4 space-y-2">
                <p className="text-xs font-semibold">Supported Wallets</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>• MetaMask</span>
                  <span>• Trust Wallet</span>
                  <span>• Rainbow</span>
                  <span>• Coinbase Wallet</span>
                  <span>• + 300 more</span>
                </div>
              </div>
            </div>
          )}

          {connectionState === "connecting" && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Waiting for connection...</p>
                <p className="text-xs text-muted-foreground">
                  Scan the QR code with your wallet app or approve the connection request
                </p>
              </div>
            </div>
          )}

          {connectionState === "connected" && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-success">Connected Successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">Your wallet is now connected</p>
              </div>
            </div>
          )}

          {connectionState === "failed" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || "Failed to connect wallet. Please try again."}
                </AlertDescription>
              </Alert>
              <Button onClick={handleConnect} className="w-full" variant="outline">
                Try Again
              </Button>
            </div>
          )}

          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-4">
            <p className="text-xs font-semibold text-muted-foreground">Security Notice</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Never share your seed phrase or private keys</li>
              <li>• This app never stores your private keys</li>
              <li>• Only connect to trusted applications</li>
              <li>• You retain full custody of your assets</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <a 
              href="https://walletconnect.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              WalletConnect
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}