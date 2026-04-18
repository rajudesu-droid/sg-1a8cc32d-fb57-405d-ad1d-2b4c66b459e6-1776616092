import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useConnectorClient } from "wagmi";
import QRCode from "qrcode";

interface WalletConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletConnectionModal({ open, onClose }: WalletConnectionModalProps) {
  const { connectWallet, isConnecting, error, isConnected } = useWallet();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "scanning" | "connected" | "failed">("idle");
  const { data: client } = useConnectorClient();

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
    }
  }, [isConnecting, isConnected, error, onClose]);

  useEffect(() => {
    if (open && !isConnected) {
      // Generate QR code for WalletConnect URI
      // In production, this would use the actual WalletConnect URI from the connector
      const mockUri = `wc:${Math.random().toString(36).substring(7)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substring(7)}`;
      
      QRCode.toDataURL(mockUri, {
        width: 300,
        margin: 2,
        color: {
          dark: "#06B6D4",
          light: "#0A1628",
        },
      }).then((url) => {
        setQrCodeDataUrl(url);
        setConnectionState("scanning");
      });
    }
  }, [open, isConnected]);

  const handleConnect = () => {
    connectWallet();
  };

  const handleClose = () => {
    setConnectionState("idle");
    setQrCodeDataUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Scan the QR code with your mobile wallet app
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
              <Button onClick={handleConnect} className="w-full gap-2" size="lg">
                <Smartphone className="h-4 w-4" />
                Connect with WalletConnect
              </Button>
            </div>
          )}

          {(connectionState === "connecting" || connectionState === "scanning") && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCodeDataUrl ? (
                  <div className="rounded-lg border-4 border-primary/20 p-2 bg-card">
                    <img src={qrCodeDataUrl} alt="WalletConnect QR Code" className="w-full max-w-xs" />
                  </div>
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center">
                <p className="text-sm font-medium">Scan with your wallet app</p>
                <p className="text-xs text-muted-foreground">
                  Open your mobile wallet (MetaMask, Trust Wallet, Rainbow, etc.) and scan the QR code to connect
                </p>
              </div>

              {connectionState === "connecting" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for approval...
                </div>
              )}
            </div>
          )}

          {connectionState === "connected" && (
            <div className="space-y-4 text-center">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}