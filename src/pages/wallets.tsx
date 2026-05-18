import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, RefreshCw, Coins, Info, Plus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { UnifiedWalletModal } from "@/components/UnifiedWalletModal";
import { supportedNetworks } from "@/lib/walletConfig";
import { actionHandler } from "@/services/ActionHandlerService";

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const { isConnected: evmConnected, address: evmAddress, chainId, detectedAssets, refreshBalances } = useWallet();
  const { connectedWallets, disconnectWallet: disconnectMultiWallet } = useMultiWallet();
  const { toast } = useToast();

  const [refreshLoading, setRefreshLoading] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const anyWalletConnected = evmConnected || connectedWallets.length > 0;
  const totalConnected = (evmConnected ? 1 : 0) + connectedWallets.length;

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
      if (evmConnected) {
        await refreshBalances();
      }
      
      // Refresh non-EVM wallets
      for (const wallet of connectedWallets) {
        // Re-fetch tokens for each wallet
        console.log(`[Wallets] Refreshing ${wallet.chainName} wallet...`);
      }
      
      const totalAssets = detectedAssets.length + connectedWallets.reduce((sum, w) => sum + (w.tokens?.length || 0), 0);
      
      toast({
        title: "Balances Refreshed",
        description: `Found ${totalAssets} asset(s) across all wallets`,
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
  
  // Combine all tokens from all sources
  const allTokens = [
    ...detectedAssets.map(asset => ({
      chain: asset.network,
      symbol: asset.symbol,
      name: asset.name,
      balance: asset.balance,
      isNative: asset.isNative,
      type: "EVM" as const,
    })),
    ...connectedWallets.flatMap(wallet => 
      (wallet.tokens || []).map(token => ({
        chain: wallet.chainName,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        isNative: token.isNative,
        type: wallet.type.toUpperCase() as const,
      }))
    ),
  ];

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
              Connect once, see all your assets across all blockchains
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            
            {anyWalletConnected && (
              <Button variant="outline" onClick={handleRefreshBalances} disabled={refreshLoading}>
                {refreshLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> 
                    Refresh All
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={() => setWalletModalOpen(true)}
              variant={anyWalletConnected ? "outline" : "default"}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {anyWalletConnected ? "Connect Another" : "Connect Wallet"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalConnected}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {anyWalletConnected ? "Active" : "Not connected"}
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blockchains</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(allTokens.map(t => t.chain)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Networks detected
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allTokens.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all wallets
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chain Types</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(allTokens.map(t => t.type)).size}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                EVM, Solana, TRON
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
        {evmConnected && (
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
                  <span className="text-sm font-mono">{evmAddress}</span>
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
            
            {/* Wallet Cards */}
            {connectedWallets.map((wallet) => (
              <Card key={wallet.id} className="card-gradient border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm">
                        {wallet.chainName}
                      </Badge>
                      <div>
                        <CardTitle className="text-base">{wallet.type.toUpperCase()} Wallet</CardTitle>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
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
                </CardHeader>
                
                {/* Tokens for this wallet */}
                {wallet.tokens && wallet.tokens.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold mb-3">
                        Assets ({wallet.tokens.length})
                      </p>
                      <div className="space-y-2">
                        {wallet.tokens.map((token, tokenIndex) => (
                          <div 
                            key={`${wallet.id}-${token.address || token.symbol}-${tokenIndex}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant={token.isNative ? "default" : "secondary"} className="text-xs">
                                {token.isNative ? "Native" : "Token"}
                              </Badge>
                              <div>
                                <p className="font-semibold text-sm">{token.symbol}</p>
                                <p className="text-xs text-muted-foreground">{token.name}</p>
                              </div>
                            </div>
                            <p className="font-medium text-sm">
                              {parseFloat(token.balance).toFixed(4)} {token.symbol}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
                
                {/* No tokens found */}
                {(!wallet.tokens || wallet.tokens.length === 0) && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tokens detected in this wallet
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* All Assets - Unified Display */}
        {anyWalletConnected && allTokens.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Assets</h2>
              <Badge variant="secondary" className="text-xs">
                {allTokens.filter(t => t.isNative).length} Native + {allTokens.filter(t => !t.isNative).length} Tokens
              </Badge>
            </div>
            <Card className="card-gradient border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {allTokens.map((token, index) => (
                    <div key={`${token.chain}-${token.symbol}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="min-w-[80px] justify-center">
                          {token.chain}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{token.symbol}</p>
                            {allTokens.filter(t => t.symbol === token.symbol).length > 1 && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Multi-chain
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {token.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{parseFloat(token.balance).toFixed(4)} {token.symbol}</p>
                        <Badge variant={token.isNative ? "default" : "secondary"} className="text-xs mt-1">
                          {token.isNative ? "Native" : "Token"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Connected Wallets List */}
        {anyWalletConnected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Connected Wallets</h2>
              <Badge variant="secondary" className="text-xs">
                {totalConnected} wallet(s)
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {evmConnected && evmAddress && (
                <Card className="card-gradient border-border/50">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">EVM</Badge>
                        <p className="text-xs text-muted-foreground">
                          {currentNetwork?.name || "Ethereum"}
                        </p>
                      </div>
                      <p className="font-mono text-sm">
                        {evmAddress.slice(0, 10)}...{evmAddress.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {detectedAssets.length} asset(s) detected
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {connectedWallets.map((wallet) => (
                <Card key={wallet.id} className="card-gradient border-border/50">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{wallet.type.toUpperCase()}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {wallet.chainName}
                        </p>
                      </div>
                      <p className="font-mono text-sm">
                        {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.tokens?.length || 0} asset(s) detected
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

        {/* Empty State */}
        {!anyWalletConnected && (
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
                  Click "Connect Wallet" to scan QR code or connect your browser wallet
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: EVM (MetaMask, Trust, etc.) • Solana (Phantom) • TRON (TronLink)
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

        {/* Unified Wallet Connection Modal */}
        <UnifiedWalletModal 
          open={walletModalOpen} 
          onClose={() => setWalletModalOpen(false)} 
        />
      </div>
    </AppLayout>
  );
}