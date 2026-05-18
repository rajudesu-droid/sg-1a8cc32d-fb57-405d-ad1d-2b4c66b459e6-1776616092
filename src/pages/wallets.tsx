import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { Wallet, Copy, ExternalLink, TrendingUp, Info, DollarSign, Network, Coins, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchTokenPrices } from "@/lib/cryptoPriceService";
import { useAppStore } from "@/store";
import { supportedNetworks } from "@/lib/walletConfig";

export default function Wallets() {
  // Prevent hydration mismatch - only render wallet content after mount
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const mode = useAppStore((state) => state.mode);
  const { isConnected: evmConnected, address: evmAddress, chainId, detectedAssets, refreshBalances } = useWallet();
  const { connectedWallets, disconnectWallet: disconnectMultiWallet } = useMultiWallet();
  const { toast } = useToast();

  const [refreshLoading, setRefreshLoading] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const anyWalletConnected = evmConnected || connectedWallets.length > 0;
  const totalConnected = (evmConnected ? 1 : 0) + connectedWallets.length;

  const handleRefreshBalances = async () => {
    setRefreshLoading(true);
    try {
      if (evmConnected) {
        await refreshBalances();
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
      type: "EVM",
    })),
    ...connectedWallets.flatMap(wallet =>
      (wallet.tokens || []).map(token => ({
        chain: wallet.chainName,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        isNative: token.isNative,
        type: wallet.type.toUpperCase(),
      }))
    ),
  ];

  // Fetch token prices when tokens change
  useEffect(() => {
    if (allTokens.length > 0 && mounted) {
      loadTokenPrices();
    }
  }, [detectedAssets.length, connectedWallets.length, mounted]);

  const loadTokenPrices = async () => {
    setLoadingPrices(true);
    try {
      const uniqueTokens = [...new Set(allTokens.map(t => t.symbol))].map(symbol => ({
        symbol,
        network: allTokens.find(t => t.symbol === symbol)?.chain,
      }));

      const prices = await fetchTokenPrices(uniqueTokens);
      setTokenPrices(prices);
    } catch (error) {
      console.error("[Wallets] Failed to fetch token prices:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Calculate USD value for a token
  const getUSDValue = (symbol: string, balance: string): number | null => {
    const price = tokenPrices[symbol.toUpperCase()];
    if (!price) return null;
    return parseFloat(balance) * price;
  };

  // Calculate total portfolio value
  const totalPortfolioValue = allTokens.reduce((sum, token) => {
    const usdValue = getUSDValue(token.symbol, token.balance);
    return sum + (usdValue || 0);
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-6" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your connected wallets and view balances
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefreshBalances}
            disabled={refreshLoading || !anyWalletConnected}
          >
            {refreshLoading ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Refresh</>
            )}
          </Button>
        </div>

        {mounted && (
          <>
            {/* Top Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all connected wallets</p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected Wallets</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalConnected}</div>
                  <p className="text-xs text-muted-foreground">Active connections</p>
                </CardContent>
              </Card>

              <Card className="card-gradient border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detected Assets</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allTokens.length}</div>
                  <p className="text-xs text-muted-foreground">Tradeable tokens</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="assets" className="space-y-6">
              <TabsList>
                <TabsTrigger value="assets">All Assets</TabsTrigger>
                <TabsTrigger value="wallets">Manage Connections</TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className="space-y-4">
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <Info className="h-4 w-4 text-amber-500" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm">⚠️ IMPORTANT: WalletConnect Limitation</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>WalletConnect QR code only works for EVM chains</strong> (Ethereum, BSC, Polygon, Arbitrum, etc.)
                        </p>
                      </div>
                      <div className="border-t border-amber-500/20 pt-2">
                        <p className="text-xs font-semibold mb-1">✅ Works with QR scan (Trust Wallet, MetaMask, etc.):</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Ethereum</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">BSC</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Polygon</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Arbitrum</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Optimism</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Base</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Avalanche</Badge>
                          <Badge variant="outline" className="text-xs border-success/50 text-success">Fantom</Badge>
                        </div>
                        <p className="text-xs font-semibold mb-1 text-amber-500">❌ NOT detected via QR (requires browser extension or manual entry):</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">Solana</Badge>
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">TRON</Badge>
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">XRP</Badge>
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">Bitcoin</Badge>
                        </div>
                      </div>
                      <div className="border-t border-amber-500/20 pt-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Why?</strong> WalletConnect protocol is designed for EVM chains only. Trust Wallet's Solana/TRON/XRP/BTC require separate wallet adapters that don't work through WalletConnect QR codes.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Solution:</strong> For non-EVM chains, use browser extensions (Phantom for Solana, TronLink for TRON) or manually input balances.
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="border-primary/50 bg-primary/10">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm">✅ Unified Token Detection</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Automatic detection of tokens across EVM and Non-EVM chains. Click connect once, see balances everywhere!
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Supported Chains:</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">Ethereum</Badge>
                          <Badge variant="outline" className="text-xs">BSC</Badge>
                          <Badge variant="outline" className="text-xs">Polygon</Badge>
                          <Badge variant="outline" className="text-xs">Solana</Badge>
                          <Badge variant="outline" className="text-xs">TRON</Badge>
                          <Badge variant="outline" className="text-xs">Arbitrum</Badge>
                          <Badge variant="outline" className="text-xs">Optimism</Badge>
                          <Badge variant="outline" className="text-xs">Base</Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {anyWalletConnected && allTokens.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">All Assets</h2>
                      <Badge variant="secondary" className="text-xs">
                        {allTokens.filter(t => t.isNative).length} Native + {allTokens.filter(t => !t.isNative).length} Tokens
                      </Badge>
                    </div>
                    
                    {/* Token Cards Grid - Sorted by USD value descending */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {allTokens
                        .sort((a, b) => {
                          const aValue = getUSDValue(a.symbol, a.balance) || 0;
                          const bValue = getUSDValue(b.symbol, b.balance) || 0;
                          return bValue - aValue;
                        })
                        .map((token, index) => {
                          const usdValue = getUSDValue(token.symbol, token.balance);
                          const quantity = parseFloat(token.balance);
                          
                          return (
                            <Card key={`${token.chain}-${token.symbol}-${index}`} className="card-gradient border-border/50 hover:border-primary/30 transition-all">
                              <CardContent className="pt-6">
                                <div className="space-y-3">
                                  {/* Token Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-lg font-bold text-primary">
                                            {token.symbol.charAt(0)}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-bold text-base">{token.symbol}</p>
                                          <p className="text-xs text-muted-foreground">{token.name}</p>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant={token.isNative ? "default" : "secondary"} className="text-xs">
                                      {token.isNative ? "Native" : "Token"}
                                    </Badge>
                                  </div>

                                  {/* Balance Section */}
                                  <div className="space-y-2 pt-2 border-t border-border/50">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                                      <p className="text-xl font-bold">
                                        {quantity < 0.0001 && quantity > 0 
                                          ? quantity.toExponential(4) 
                                          : quantity.toLocaleString('en-US', { 
                                              minimumFractionDigits: quantity < 1 ? 6 : 2, 
                                              maximumFractionDigits: quantity < 1 ? 6 : 2 
                                            })}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">USD Value</p>
                                      {usdValue !== null ? (
                                        <p className="text-lg font-bold text-success">
                                          ${usdValue.toLocaleString('en-US', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                          })}
                                        </p>
                                      ) : loadingPrices ? (
                                        <p className="text-sm text-muted-foreground">Loading price...</p>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">Price unavailable</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Chain & Type Badges */}
                                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                    <Badge variant="outline" className="text-xs">
                                      {token.chain}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {token.type}
                                    </Badge>
                                    {allTokens.filter(t => t.symbol === token.symbol).length > 1 && (
                                      <Badge variant="secondary" className="text-xs">
                                        Multi-chain
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                ) : !anyWalletConnected ? (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Wallet Connected</h3>
                      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                        Connect a wallet to view your asset balances and USD values across multiple chains.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="wallets" className="space-y-4">
                {!anyWalletConnected ? (
                  <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Connected Wallets</h3>
                      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                        Connect a wallet using the button in the top right to start managing your assets.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Primary EVM Wallet */}
                    {evmConnected && evmAddress && (
                      <Card className="card-gradient border-primary/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                          <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">
                            Primary
                          </Badge>
                        </div>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">EVM Wallet</CardTitle>
                              <p className="text-sm text-muted-foreground">WalletConnect</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Address</p>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-semibold">
                                {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">Network</p>
                              <p className="text-sm font-medium">{currentNetwork?.name || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Assets</p>
                              <p className="text-sm font-medium">{detectedAssets.length} tokens</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Secondary Connected Wallets */}
                    {connectedWallets.map(wallet => (
                      <Card key={wallet.id} className="card-gradient border-border/50">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <Network className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{wallet.chainName}</CardTitle>
                              <p className="text-sm text-muted-foreground capitalize">{wallet.type}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Address</p>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-semibold">
                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">Assets</p>
                              <p className="text-sm font-medium">{wallet.tokens?.length || 0} tokens</p>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => disconnectMultiWallet(wallet.id)}
                            >
                              Disconnect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}