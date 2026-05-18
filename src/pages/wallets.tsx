import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, DollarSign, RefreshCw, Coins, Info, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { MultiWalletConnectionModal } from "@/components/MultiWalletConnectionModal";
import { supportedNetworks } from "@/lib/walletConfig";
import { actionHandler } from "@/services/ActionHandlerService";

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const { isConnected, isConnecting, address, chainId, detectedAssets, refreshBalances, disconnectWallet, connectWallet } = useWallet();
  const { connectedWallets, disconnectWallet: disconnectMultiWallet } = useMultiWallet();
  const { toast } = useToast();

  const [refreshLoading, setRefreshLoading] = useState(false);
  const [multiWalletModalOpen, setMultiWalletModalOpen] = useState(false);

  const getActionContext = () => ({
    mode: mode.current,
    metadata: { source: "wallets_page" },
  });

  const handleConnectWallet = () => {
    connectWallet();
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
            
            {!isConnected && (
              <Button onClick={handleConnectWallet} disabled={isConnecting}>
                {isConnecting ? (
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
            
            <Button variant="outline" onClick={() => setMultiWalletModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Non-EVM
            </Button>

            {isConnected && (
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
                <Button variant="destructive" onClick={handleDisconnectWallet}>
                  Disconnect EVM
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
                Native + ERC20 tokens
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

        {/* Moralis Integration Status */}
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm">✅ Multi-Chain EVM Token Detection Enabled</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatic detection of tokens across ALL supported EVM chains. Connect once, see balances everywhere!
                </p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Supported EVM Chains (12):</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">Ethereum</Badge>
                  <Badge variant="outline" className="text-xs">BSC</Badge>
                  <Badge variant="outline" className="text-xs">Polygon</Badge>
                  <Badge variant="outline" className="text-xs">Avalanche</Badge>
                  <Badge variant="outline" className="text-xs">Arbitrum</Badge>
                  <Badge variant="outline" className="text-xs">Optimism</Badge>
                  <Badge variant="outline" className="text-xs">Base</Badge>
                  <Badge variant="outline" className="text-xs">Fantom</Badge>
                  <Badge variant="outline" className="text-xs">Cronos</Badge>
                  <Badge variant="outline" className="text-xs">Gnosis</Badge>
                  <Badge variant="outline" className="text-xs">zkSync</Badge>
                  <Badge variant="outline" className="text-xs">Linea</Badge>
                </div>
              </div>

              <div className="border-t border-border/20 pt-2">
                <p className="text-xs font-semibold text-amber-500 mb-1">⚠️ Non-EVM Chains (Coming Soon):</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className="text-xs opacity-50">Solana</Badge>
                  <Badge variant="outline" className="text-xs opacity-50">TRON</Badge>
                  <Badge variant="outline" className="text-xs opacity-50">Bitcoin</Badge>
                  <Badge variant="outline" className="text-xs opacity-50">XRP</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires separate wallet adapters (Phantom, TronLink, etc.). WalletConnect primarily supports EVM chains.
                </p>
              </div>
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
              <h2 className="text-xl font-semibold">Detected Assets Across All Chains</h2>
              <Badge variant="secondary" className="text-xs">
                {detectedAssets.filter(a => a.isNative).length} Native + {detectedAssets.filter(a => !a.isNative).length} Tokens
              </Badge>
            </div>
            <Card className="card-gradient border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {detectedAssets.map((asset, index) => (
                    <div key={`${asset.chainId}-${asset.symbol}-${asset.address || 'native'}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="min-w-[80px] justify-center">
                          {asset.network}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{asset.symbol}</p>
                            {detectedAssets.filter(a => a.symbol === asset.symbol).length > 1 && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Multi-chain
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{parseFloat(asset.balance).toFixed(4)} {asset.symbol}</p>
                        <Badge variant={asset.isNative ? "default" : "secondary"} className="text-xs mt-1">
                          {asset.isNative ? "Native" : "ERC20"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Non-EVM Wallets */}
        {connectedWallets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Connected Non-EVM Wallets</h2>
              <Badge variant="secondary" className="text-xs">
                {connectedWallets.length} wallet(s)
              </Badge>
            </div>
            <Card className="card-gradient border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {connectedWallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="min-w-[80px] justify-center">
                          {wallet.chainName}
                        </Badge>
                        <div>
                          <p className="font-semibold">{wallet.type.toUpperCase()}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectMultiWallet(wallet.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isConnected && connectedWallets.length === 0 && (
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
                  Connect your wallet using the buttons above to view your assets
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multi-Wallet Connection Modal */}
        <MultiWalletConnectionModal 
          open={multiWalletModalOpen} 
          onClose={() => setMultiWalletModalOpen(false)} 
        />
      </div>
    </AppLayout>
  );
}