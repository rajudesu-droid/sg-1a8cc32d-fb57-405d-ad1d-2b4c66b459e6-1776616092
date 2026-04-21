import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Network,
  DollarSign,
  Activity,
  PlusCircle,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";
import { AssetSearch } from "@/components/AssetSearch";
import { actionHandler } from "@/services/ActionHandlerService";
import type { ActionContext } from "@/services/ActionHandlerService";

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const wallet = useAppStore((state) => state.wallet);
  const paperWallets = useAppStore((state) => state.paperWallets);
  const addPaperWallet = useAppStore((state) => state.addPaperWallet);
  const deletePaperWallet = useAppStore((state) => state.deletePaperWallet);
  const updatePaperWallet = useAppStore((state) => state.updatePaperWallet);

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  
  // Loading states
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const getActionContext = (): ActionContext => ({
    mode: mode.current,
    metadata: { source: "wallets_page" },
  });

  const handleConnectWallet = async () => {
    if (mode.current === "demo") {
      toast({
        title: "Demo Mode",
        description: "Use paper wallets in Demo mode. Switch to Shadow or Live mode to connect real wallets.",
      });
      return;
    }

    setConnectLoading(true);
    try {
      const result = await actionHandler.connectWallet(getActionContext());
      
      toast({
        title: result.success ? "Wallet Connected" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        setShowConnectionModal(false);
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setDisconnectLoading(true);
    try {
      const result = await actionHandler.disconnectWallet(getActionContext());
      
      toast({
        title: result.success ? "Wallet Disconnected" : "Disconnection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleRefreshBalances = async () => {
    setRefreshLoading(true);
    try {
      const result = await actionHandler.refreshBalances(getActionContext());
      
      toast({
        title: result.success ? "Balances Refreshed" : "Refresh Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh balances",
        variant: "destructive",
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleCreatePaperWallet = () => {
    const newWallet = {
      id: `paper-${Date.now()}`,
      name: `Paper Wallet ${paperWallets.length + 1}`,
      assets: [],
      totalValue: 0,
      createdAt: new Date(),
    };
    addPaperWallet(newWallet);
    
    toast({
      title: "Paper Wallet Created",
      description: `Created ${newWallet.name}`,
    });
  };

  const handleDeletePaperWallet = async (walletId: string) => {
    setDeleteLoading(walletId);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      deletePaperWallet(walletId);
      
      toast({
        title: "Wallet Deleted",
        description: "Paper wallet removed successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete wallet",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleAddAsset = (walletId: string) => {
    setSelectedWallet(walletId);
    setShowAddAssetModal(true);
  };

  const handleSaveAsset = (asset: any) => {
    if (!selectedWallet) return;

    const walletData = paperWallets.find(w => w.id === selectedWallet);
    if (!walletData) return;

    const updatedAssets = editingAsset
      ? walletData.assets.map((a: any) => a.id === editingAsset.id ? asset : a)
      : [...walletData.assets, { ...asset, id: `asset-${Date.now()}` }];

    const totalValue = updatedAssets.reduce((sum: number, a: any) => {
      return sum + (parseFloat(a.balance) || 0) * (a.priceUsd || 0);
    }, 0);

    updatePaperWallet(selectedWallet, {
      assets: updatedAssets,
      totalValue,
    });

    toast({
      title: editingAsset ? "Asset Updated" : "Asset Added",
      description: `${asset.symbol} ${editingAsset ? "updated" : "added"} successfully`,
    });

    setShowAddAssetModal(false);
    setEditingAsset(null);
    setSelectedWallet(null);
  };

  const handleEditAsset = (walletId: string, asset: any) => {
    setSelectedWallet(walletId);
    setEditingAsset(asset);
    setShowAddAssetModal(true);
  };

  const handleDeleteAsset = (walletId: string, assetId: string) => {
    const walletData = paperWallets.find(w => w.id === walletId);
    if (!walletData) return;

    const updatedAssets = walletData.assets.filter((a: any) => a.id !== assetId);
    const totalValue = updatedAssets.reduce((sum: number, a: any) => {
      return sum + (parseFloat(a.balance) || 0) * (a.priceUsd || 0);
    }, 0);

    updatePaperWallet(walletId, {
      assets: updatedAssets,
      totalValue,
    });

    toast({
      title: "Asset Deleted",
      description: "Asset removed successfully",
    });
  };

  // Custom update helper to bridge the string balance to number quantity in global store
  const updateWallet = (id: string, updatedTokens: TokenHolding[]) => {
    const storeTokens = updatedTokens.map(t => ({
      symbol: t.symbol,
      name: t.name,
      network: t.network,
      quantity: parseFloat(t.balance),
      priceUsd: parseFloat(t.price),
      totalValue: t.valueUsd
    }));
    useAppStore.getState().updatePaperWallet(id, storeTokens);
  };
  
  const deleteWallet = useAppStore((state) => state.deletePaperWallet);

  // Map store wallets to local format for display
  const displayWallets = paperWallets.map(w => ({
    ...w,
    tokens: w.tokens.map((t, idx) => ({
      id: `token-${w.id}-${idx}`,
      network: t.network,
      symbol: t.symbol,
      name: t.name,
      balance: t.quantity.toString(),
      price: t.priceUsd.toString(),
      valueUsd: t.totalValue
    }))
  }));

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Wallets] Mode changed, updating wallet view");
        handleRefreshBalances();
      }
    });
    return () => unsubscribe();
  }, []);

  // Simulate fetching market data when token is selected
  useEffect(() => {
    if (tokenNetwork && selectedToken) {
      setIsFetchingPrice(true);
      setFetchedPrice(null);
      
      // Fetch real price from CoinGecko API
      fetchTokenPrice(selectedToken)
        .then((price) => {
          if (price > 0) {
            setFetchedPrice(price);
          } else {
            // Fallback to estimated price if API fails
            const fallbackPrice = getFallbackPrice(selectedToken);
            setFetchedPrice(fallbackPrice);
            if (fallbackPrice > 0) {
              toast({
                title: "Using Estimated Price",
                description: "Live price data unavailable. Using fallback estimate.",
                variant: "default",
              });
            }
          }
        })
        .catch((error) => {
          console.error("Price fetch error:", error);
          const fallbackPrice = getFallbackPrice(selectedToken);
          setFetchedPrice(fallbackPrice);
        })
        .finally(() => {
          setIsFetchingPrice(false);
        });
    } else {
      setFetchedPrice(null);
    }
  }, [tokenNetwork, selectedToken, toast]);

  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((id) => id !== chainId) : [...prev, chainId]
    );
  };

  const addTokenToHoldings = () => {
    if (!tokenNetwork || !selectedToken || !tokenBalance || fetchedPrice === null) {
      toast({
        title: "Missing Information",
        description: "Please fill in all token details and wait for price to load",
        variant: "destructive",
      });
      return;
    }

    const tokenInfo = networkTokens[tokenNetwork]?.find((t) => t.symbol === selectedToken);
    if (!tokenInfo) return;

    const numericBalance = parseFloat(tokenBalance);
    const valueUsd = numericBalance * fetchedPrice;

    const newToken: TokenHolding = {
      id: `token-${Date.now()}`,
      network: SUPPORTED_CHAINS.find((c) => c.id === tokenNetwork)?.name || tokenNetwork,
      symbol: tokenInfo.symbol,
      name: tokenInfo.name,
      balance: tokenBalance,
      price: fetchedPrice.toString(),
      valueUsd,
    };

    if (currentWalletForToken) {
      // Adding to existing wallet
      const wallet = displayWallets.find((w) => w.id === currentWalletForToken);
      if (wallet) {
        updateWallet(currentWalletForToken, [...wallet.tokens, newToken]);
        toast({
          title: "Token Added",
          description: `${newToken.symbol} added to wallet`,
        });
      }
      setShowAddToken(false);
      setCurrentWalletForToken(null);
    } else {
      // Adding to initial tokens for new wallet
      setInitialTokens((prev) => [...prev, newToken]);
      toast({
        title: "Token Added to List",
        description: `${newToken.symbol} will be included in the new wallet`,
      });
    }

    // Reset form
    setTokenNetwork("");
    setSelectedToken("");
    setTokenBalance("");
    setFetchedPrice(null);
  };

  const removeToken = (tokenId: string, walletId?: string) => {
    if (walletId) {
      const wallet = displayWallets.find((w) => w.id === walletId);
      if (wallet) {
        const updatedTokens = wallet.tokens.filter((t) => t.id !== tokenId);
        updateWallet(walletId, updatedTokens);
      }
    } else {
      setInitialTokens((prev) => prev.filter((t) => t.id !== tokenId));
    }
  };

  const createPaperWallet = () => {
    if (selectedChains.length === 0) {
      toast({
        title: "No Chains Selected",
        description: "Please select at least one blockchain network",
        variant: "destructive",
      });
      return;
    }

    const totalValue = initialTokens.reduce((sum, t) => sum + t.valueUsd, 0);

    addPaperWallet({
      id: `wallet-${Date.now()}`,
      name: walletName || `Paper Wallet ${paperWallets.length + 1}`,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      chains: selectedChains,
      tokens: initialTokens.map(t => ({
        symbol: t.symbol,
        name: t.name,
        network: t.network,
        quantity: parseFloat(t.balance),
        priceUsd: parseFloat(t.price),
        totalValue: t.valueUsd
      })),
      totalValue,
      createdAt: new Date(),
    });
    
    toast({
      title: "Paper Wallet Created",
      description: `Wallet created with ${initialTokens.length} tokens`,
    });

    // Reset form
    setShowCreateWallet(false);
    setWalletName("");
    setSelectedChains([]);
    setInitialTokens([]);
  };

  const toggleWalletExpand = (walletId: string) => {
    setExpandedWallets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const openAddTokenForWallet = (walletId: string) => {
    setCurrentWalletForToken(walletId);
    setShowAddToken(true);
  };

  const totalInitialValue = initialTokens.reduce((sum, t) => sum + t.valueUsd, 0);

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo":
        return "Wallets (Paper Wallets)";
      case "shadow":
        return "Wallets (Read-Only)";
      case "live":
        return "Wallets (Live)";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo":
        return "Create and manage simulated paper wallets for testing strategies";
      case "shadow":
        return "View connected wallet balances in read-only mode";
      case "live":
        return "Connect and manage your Web3 wallets";
    }
  };

  // Auto-refresh prices every 60 seconds
  useEffect(() => {
    if (!isAutoRefreshEnabled || mode.current !== "demo" || paperWallets.length === 0) {
      return;
    }

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 60; // Reset to 60 when it hits 0
        }
        return prev - 1;
      });
    }, 1000);

    // Price refresh timer
    const refreshInterval = setInterval(async () => {
      console.log("[Auto-Refresh] Updating portfolio prices...");
      
      // Collect all unique token symbols across all wallets
      const allSymbols = new Set<string>();
      paperWallets.forEach((wallet) => {
        wallet.tokens.forEach((token) => {
          allSymbols.add(token.symbol);
        });
      });

      if (allSymbols.size === 0) return;

      // Batch fetch all prices
      const priceMap = await fetchMultipleTokenPrices(Array.from(allSymbols));
      
      // Update all wallets with new prices
      refreshPaperWalletPrices(priceMap);
      
      console.log(`[Auto-Refresh] Updated ${priceMap.size} token prices`);
    }, 60000); // 60 seconds

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [isAutoRefreshEnabled, mode.current, paperWallets, refreshPaperWalletPrices]);

  // Pause auto-refresh when page is hidden (saves API calls)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsAutoRefreshEnabled(false);
        console.log("[Auto-Refresh] Paused (page hidden)");
      } else {
        setIsAutoRefreshEnabled(true);
        setAutoRefreshCountdown(60); // Reset countdown
        console.log("[Auto-Refresh] Resumed (page visible)");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              {mode.current === "demo" 
                ? "Manage your simulated assets and balances"
                : "Manage your connected wallets and assets"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "demo" ? "Demo Mode" : mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            
            {mode.current === "demo" && (
              <Button onClick={handleCreatePaperWallet}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Paper Wallet
              </Button>
            )}
            
            {mode.current !== "demo" && !wallet.wallet && (
              <Button 
                onClick={() => setShowConnectionModal(true)}
                disabled={connectLoading}
              >
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
            
            {mode.current !== "demo" && wallet.wallet && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRefreshBalances}
                  disabled={refreshLoading}
                >
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
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnectWallet}
                  disabled={disconnectLoading}
                >
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

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo" ? paperWallets.length : wallet.wallet ? 1 : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {mode.current === "demo" ? "Paper wallets" : "Connected wallets"}
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {mode.current === "demo"
                  ? paperWallets.reduce((sum, w) => sum + w.totalValue, 0).toLocaleString()
                  : wallet.assets
                      .reduce((sum, a) => sum + (parseFloat(a.balance) || 0) * (a.priceUsd || 0), 0)
                      .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Combined balance</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo"
                  ? paperWallets.reduce((sum, w) => sum + w.tokens.length, 0)
                  : wallet.assets.length}
              </div>
              <p className="text-xs text-muted-foreground">Assets held</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Networks</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo"
                  ? new Set(paperWallets.flatMap((w) => w.tokens.map((t) => t.network))).size
                  : new Set(wallet.assets.map((a) => a.network)).size}
              </div>
              <p className="text-xs text-muted-foreground">Active chains</p>
            </CardContent>
          </Card>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Paper Wallets (Demo Mode) */}
        {mode.current === "demo" && displayWallets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Paper Wallets</h2>
            {displayWallets.map((wallet) => {
              const isExpanded = expandedWallets.has(wallet.id);
              const tokensByNetwork = wallet.tokens.reduce((acc, token) => {
                if (!acc[token.network]) acc[token.network] = [];
                acc[token.network].push(token);
                return acc;
              }, {} as Record<string, TokenHolding[]>);

              return (
                <Card key={wallet.id} className="card-gradient border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {wallet.name}
                          <div className="flex gap-1">
                            {wallet.chains.map((chainId) => {
                              const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
                              return chain ? (
                                <Badge key={chainId} variant="outline" className="text-xs">
                                  {chain.symbol}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">{wallet.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${wallet.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">{wallet.tokens.length} tokens</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => openAddTokenForWallet(wallet.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleWalletExpand(wallet.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteWallet(wallet.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(tokensByNetwork).map(([network, tokens]) => (
                          <div key={network}>
                            <h4 className="text-sm font-semibold mb-2">{network}</h4>
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                              {tokens.map((token) => (
                                <div
                                  key={token.id}
                                  className="rounded-lg border border-border/50 bg-card/30 p-3 relative group"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeToken(token.id, wallet.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="default" className="text-xs">
                                      {token.symbol}
                                    </Badge>
                                    <span className="text-sm font-semibold">
                                      ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{token.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {token.balance} {token.symbol}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {wallet.tokens.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No tokens in this wallet. Click the + button to add some.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State - Demo Mode */}
        {mode.current === "demo" && displayWallets.length === 0 && (
          <Card className="card-gradient border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No paper wallets created</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create a paper wallet to simulate multi-chain asset management
                </p>
                <Button onClick={() => setShowCreateWallet(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Paper Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected Wallet (Shadow/Live Mode) */}
        {mode.current !== "demo" && !isConnected && (
          <Card className="card-gradient border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No wallet connected</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect your wallet to view balances and manage assets
                </p>
                <Button onClick={connectWallet} className="gap-2">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Paper Wallet Dialog */}
        <Dialog open={showCreateWallet} onOpenChange={setShowCreateWallet}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Paper Wallet</DialogTitle>
              <DialogDescription>
                Create a simulated multi-chain wallet with specific token balances for testing strategies.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Wallet Name */}
              <div className="space-y-2">
                <Label htmlFor="walletName">Wallet Name (Optional)</Label>
                <Input
                  id="walletName"
                  placeholder="e.g., Test Strategy 1"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
              </div>

              {/* Supported Chains */}
              <div className="space-y-3">
                <Label>Supported Chains</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <div key={chain.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`chain-${chain.id}`}
                        checked={selectedChains.includes(chain.id)}
                        onCheckedChange={() => toggleChain(chain.id)}
                      />
                      <Label
                        htmlFor={`chain-${chain.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`h-3 w-3 rounded-full ${chain.color}`} />
                        {chain.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Initial Token Holdings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Initial Token Holdings</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddToken(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Token
                  </Button>
                </div>

                {initialTokens.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {initialTokens.map((token) => (
                      <div
                        key={token.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{token.symbol}</Badge>
                          <div>
                            <div className="text-sm font-medium">{token.name}</div>
                            <div className="text-xs text-muted-foreground">{token.network}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {token.balance} @ ${parseFloat(token.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeToken(token.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tokens added yet. Click "Add Token" to start.
                  </p>
                )}

                {initialTokens.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-primary/50 bg-primary/10 p-3">
                    <span className="text-sm font-medium">Total Initial Value:</span>
                    <span className="text-lg font-bold text-primary">
                      ${totalInitialValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateWallet(false)}>
                Cancel
              </Button>
              <Button onClick={createPaperWallet}>Create Wallet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Token Dialog with Automatic Pricing */}
        <Dialog open={showAddToken} onOpenChange={(open) => {
          if (!open) {
            // Reset form when closing
            setTokenNetwork("");
            setSelectedToken("");
            setTokenBalance("");
            setFetchedPrice(null);
          }
          setShowAddToken(open);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Token</DialogTitle>
              <DialogDescription>
                Select a network and token. Market price will be fetched automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Network Selection */}
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={tokenNetwork} onValueChange={(val) => {
                  setTokenNetwork(val);
                  setSelectedToken(""); // Reset token when network changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CHAINS.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Token Selection */}
              <div className="space-y-2">
                <Label>Token</Label>
                <Select 
                  value={selectedToken} 
                  onValueChange={setSelectedToken}
                  disabled={!tokenNetwork}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tokenNetwork ? "Select token" : "Select network first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenNetwork && networkTokens[tokenNetwork]?.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex justify-between items-center w-full">
                          <span>{token.symbol} - {token.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.0"
                  value={tokenBalance}
                  onChange={(e) => setTokenBalance(e.target.value)}
                />
              </div>

              {/* Automatic Price Display */}
              <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Market Price:</span>
                  {isFetchingPrice ? (
                    <div className="flex items-center text-muted-foreground text-sm gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching...
                    </div>
                  ) : fetchedPrice !== null ? (
                    <span className="text-sm font-semibold">
                      ${fetchedPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total USD Value:</span>
                  <span className="text-lg font-bold text-primary">
                    {fetchedPrice !== null && tokenBalance && !isNaN(parseFloat(tokenBalance))
                      ? `$${(parseFloat(tokenBalance) * fetchedPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "$0.00"
                    }
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToken(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addTokenToHoldings}
                disabled={isFetchingPrice || !tokenNetwork || !selectedToken || !tokenBalance}
              >
                Add to Holdings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}