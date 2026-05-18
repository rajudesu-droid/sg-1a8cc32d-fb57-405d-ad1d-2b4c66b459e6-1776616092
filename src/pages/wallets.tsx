import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, RefreshCw, Coins, Info, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { UnifiedWalletModal } from "@/components/UnifiedWalletModal";
import { supportedNetworks } from "@/lib/walletConfig";
import { fetchTokenPrices } from "@/lib/cryptoPriceService";

export default function Wallets() {
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
    if (allTokens.length > 0) {
      loadTokenPrices();
    }
  }, [detectedAssets.length, connectedWallets.length]);

  const loadTokenPrices = async () => {
    setLoadingPrices(true);
    try {
      const uniqueTokens = [...new Set(allTokens.map(t => t.symbol))].map(symbol => ({
        symbol,
        network: allTokens.find(t => t.symbol === symbol)?.chain,
      }));

      const prices = await fetchTokenPrices(uniqueTokens);
      setTokenPrices(prices);
      console.log("[Wallets] Fetched prices for", Object.keys(prices).length, "tokens");
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
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</>
                ) : (
                  <><RefreshCw className="mr-2 h-4 w-4" /> Refresh All</>
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
              <div className="text-2xl font-bold">{totalConnected}</div>
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
              <p className="text-xs text-muted-foreground mt-1">Networks detected</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTokens.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all wallets</p>
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

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPortfolioValue > 0 ? (
                  <>${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                ) : (
                  "—"
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {loadingPrices ? "Loading prices..." : "Total USD value"}
              </p>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

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

        {anyWalletConnected && allTokens.length > 0 && (
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
                  // Calculate USD values
                  const aValue = getUSDValue(a.symbol, a.balance) || 0;
                  const bValue = getUSDValue(b.symbol, b.balance) || 0;
                  
                  // Sort descending (highest value first)
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
        )}

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
              <div className="flex justify-center mt-4">
                <Button onClick={() => setWalletModalOpen(true)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <UnifiedWalletModal 
          open={walletModalOpen} 
          onClose={() => setWalletModalOpen(false)} 
        />
      </div>
    </AppLayout>
  );
}