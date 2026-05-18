import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, DollarSign, RefreshCw, Coins, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { supportedNetworks } from "@/lib/walletConfig";
import { actionHandler } from "@/services/ActionHandlerService";

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const { isConnected, address, chainId, detectedAssets, refreshBalances, disconnectWallet } = useWallet();
  const { toast } = useToast();

  const [refreshLoading, setRefreshLoading] = useState(false);

  const getActionContext = () => ({
    mode: mode.current,
    metadata: { source: "wallets_page" },
  });

  const handleConnectWallet = async () => {
    setConnectLoading(true);
    try {
      const result = await actionHandler.connectWallet(getActionContext());
      toast({
        title: result.success ? "Wallet Connected" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({ title: "Connection Failed", description: "Failed to connect wallet", variant: "destructive" });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleRefreshBalances = async () => {
    setRefreshLoading(true);
    try {
      await refreshBalances();
      toast({
        title: "Balances Refreshed",
        description: `Found ${detectedAssets.length} asset(s)`,
      });
    } catch (error) {
      toast({ 
        title: "Refresh Failed", 
        description: "Failed to refresh balances",
        variant: "destructive" 
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  const currentNetwork = supportedNetworks.find((n) => n.id === chainId);
  
  // Calculate total value
  const totalValue = detectedAssets.reduce((sum, asset) => {
    // For now, only count assets with known prices (would need price oracle in production)
    return sum;
  }, 0);

  // Get unique networks
  const uniqueNetworks = new Set(detectedAssets.map((a) => a.network));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your connected wallets and view assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            
            {!wallet.wallet && (
              <Button onClick={handleConnectWallet} disabled={connectLoading}>
                {connectLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" /> 
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
            
            {wallet.wallet && (
              <>
                <Button variant="outline" onClick={handleRefreshBalances} disabled={refreshLoading}>
                  {refreshLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> 
                      Refresh Balances
                    </>
                  )}
                </Button>
                <Button variant="destructive" onClick={handleDisconnectWallet} disabled={disconnectLoading}>
                  {disconnectLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isConnected ? 1 : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected ? "Active" : "Not connected"}
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Network</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentNetwork?.symbol || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentNetwork?.name || "Not connected"}
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detected Assets</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {detectedAssets.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Native balances only
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Address</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isConnected ? "Connected" : "Disconnected"}
              </p>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

        {/* API Integration Notice */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Token Detection Requires API Integration</p>
              <p className="text-xs text-muted-foreground">
                Currently showing native balance only (ETH/BNB/MATIC/AVAX). To detect ERC20/BEP20 tokens, 
                you need to integrate with a blockchain data provider:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• <a href="https://moralis.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Moralis API <ExternalLink className="h-3 w-3" /></a> (Multi-chain token balances)</li>
                <li>• <a href="https://alchemy.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Alchemy API <ExternalLink className="h-3 w-3" /></a> (EVM chains)</li>
                <li>• <a href="https://covalenthq.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Covalent API <ExternalLink className="h-3 w-3" /></a> (Historical balances)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                See <code className="bg-muted px-1 py-0.5 rounded">src/contexts/WalletContext.tsx</code> line 104 for integration instructions.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Connected Wallet Info */}
        {isConnected && (
          <Card className="card-gradient border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Connected Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-mono">{address}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <Badge variant="secondary">{currentNetwork?.name || "Unknown"}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-sm text-muted-foreground">Chain ID</span>
                  <span className="text-sm font-mono">{chainId}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detected Assets */}
        {isConnected && detectedAssets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detected Assets</h2>
              <Badge variant="outline" className="text-xs">
                Native balances only
              </Badge>
            </div>
            <Card className="card-gradient border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {detectedAssets.map((asset, index) => (
                    <div key={`${asset.network}-${asset.symbol}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{asset.network}</Badge>
                        <div>
                          <p className="font-semibold">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{parseFloat(asset.balance).toFixed(4)} {asset.symbol}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {asset.isNative ? "Native" : "Token"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isConnected && (
          <Card className="card-gradient border-border/50">
            <CardContent className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Wallet Connected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your wallet using the button in the top-right corner to view your assets
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}