import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useState } from "react";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";
import { supportedNetworks } from "@/lib/walletConfig";

export function ConnectedWallets() {
  const [showModal, setShowModal] = useState(false);
  const { isConnected, address, chainId } = useWallet();

  const currentNetwork = supportedNetworks.find((n) => n.id === chainId);

  if (!isConnected) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                No wallet connected
              </p>
              <Button onClick={() => setShowModal(true)} size="sm" variant="outline" className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-[280px]">
                Connect your wallet to access Shadow and Live modes.
              </p>
            </div>
          </CardContent>
        </Card>
        <WalletConnectionModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connected Wallets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Primary Wallet</span>
            </div>
            {currentNetwork && (
              <Badge variant="secondary" className="text-xs">
                {currentNetwork.symbol}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs">
                {address}
              </code>
              <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                <a href={`${currentNetwork?.explorer}/address/${address}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>

            {currentNetwork && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Network</div>
                  <div className="font-medium">{currentNetwork.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Chain ID</div>
                  <div className="font-mono">{chainId}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-accent/50 bg-accent/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Non-custodial:</strong> This app never stores your private keys. You retain full custody of your assets.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}