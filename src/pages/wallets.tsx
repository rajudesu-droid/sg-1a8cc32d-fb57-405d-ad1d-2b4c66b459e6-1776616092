import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, DollarSign, PlusCircle, Trash2, RefreshCw, X, ChevronUp, ChevronDown, Coins, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { actionHandler } from "@/services/ActionHandlerService";
import { supabase } from "@/integrations/supabase/client";

interface TokenHolding {
  id: string;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  price: string;
  valueUsd: number;
}

const FALLBACK_CHAINS = [
  { id: "ethereum", name: "Ethereum", enabled: true },
  { id: "arbitrum", name: "Arbitrum", enabled: true },
  { id: "optimism", name: "Optimism", enabled: true },
  { id: "polygon", name: "Polygon", enabled: true },
  { id: "base", name: "Base", enabled: true },
];

const FALLBACK_TOKENS: Record<string, Array<{ symbol: string; name: string; address?: string }>> = {
  ethereum: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin", address: "0xA0b8..." },
    { symbol: "USDT", name: "Tether", address: "0xdAC1..." },
  ],
  arbitrum: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "ARB", name: "Arbitrum" },
  ],
  optimism: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "OP", name: "Optimism" },
  ],
  polygon: [
    { symbol: "MATIC", name: "Polygon" },
    { symbol: "USDC", name: "USD Coin" },
  ],
  base: [
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "USDC", name: "USD Coin" },
  ],
};

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const wallet = useAppStore((state) => state.wallet);
  const paperWallets = useAppStore((state) => state.paperWallets);
  const addPaperWallet = useAppStore((state) => state.addPaperWallet);
  const deletePaperWallet = useAppStore((state) => state.deletePaperWallet);
  const updatePaperWallet = useAppStore((state) => state.updatePaperWallet);

  const { toast } = useToast();

  // State for supported assets from database
  const [supportedNetworks, setSupportedNetworks] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [networkTokensDb, setNetworkTokensDb] = useState<Record<string, Array<{ symbol: string; name: string; address?: string }>>>({});

  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [initialTokens, setInitialTokens] = useState<TokenHolding[]>([]);

  const [showAddToken, setShowAddToken] = useState(false);
  const [currentWalletForToken, setCurrentWalletForToken] = useState<string | null>(null);
  const [tokenNetwork, setTokenNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  // Fetch supported assets from database on mount
  useEffect(() => {
    async function fetchSupportedAssets() {
      const { data, error } = await supabase
        .from("supported_assets")
        .select("*")
        .eq("is_active", true)
        .order("network", { ascending: true })
        .order("symbol", { ascending: true });

      if (error) {
        console.error("Failed to fetch supported assets:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("No supported assets found in database");
        return;
      }

      // Group by network
      const networkMap: Record<string, Array<{ symbol: string; name: string; address?: string }>> = {};
      const networksSet = new Set<string>();

      data.forEach((asset: any) => {
        const network = asset.network;
        networksSet.add(network);

        if (!networkMap[network]) {
          networkMap[network] = [];
        }

        networkMap[network].push({
          symbol: asset.symbol,
          name: asset.name,
          address: asset.contract_address || asset.mint_address || undefined,
        });
      });

      // Convert networks to array
      const networks = Array.from(networksSet).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        enabled: true,
      }));

      setSupportedNetworks(networks);
      setNetworkTokensDb(networkMap);

      console.log(`Loaded ${data.length} supported assets across ${networks.length} networks`);
    }

    fetchSupportedAssets();
  }, []);

  const SUPPORTED_CHAINS = supportedNetworks.length > 0 ? supportedNetworks : FALLBACK_CHAINS;
  const networkTokens = Object.keys(networkTokensDb).length > 0 ? networkTokensDb : FALLBACK_TOKENS;

  const getActionContext = () => ({
    mode: mode.current,
    metadata: { source: "wallets_page" },
  });

  const handleConnectWallet = async () => {
    if (mode.current === "demo") {
      toast({ title: "Demo Mode", description: "Use paper wallets in Demo mode." });
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
    } catch (error) {
      toast({ title: "Connection Failed", description: "Failed to connect wallet", variant: "destructive" });
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
      toast({ title: "Disconnection Failed", description: "Failed to disconnect", variant: "destructive" });
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
      toast({ title: "Refresh Failed", description: "Failed to refresh", variant: "destructive" });
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleCreatePaperWallet = () => {
    setShowCreateWallet(true);
  };

  const createPaperWallet = () => {
    if (selectedChains.length === 0) {
      toast({ title: "No Chains Selected", description: "Please select at least one blockchain network", variant: "destructive" });
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
    toast({ title: "Paper Wallet Created", description: `Wallet created with ${initialTokens.length} tokens` });
    setShowCreateWallet(false);
    setWalletName("");
    setSelectedChains([]);
    setInitialTokens([]);
  };

  const handleDeletePaperWallet = async (walletId: string) => {
    setDeleteLoading(walletId);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      deletePaperWallet(walletId);
      toast({ title: "Wallet Deleted", description: "Paper wallet removed" });
    } catch (error) {
      toast({ title: "Delete Failed", description: "Failed to delete wallet", variant: "destructive" });
    } finally {
      setDeleteLoading(null);
    }
  };

  const updateWallet = (id: string, updatedTokens: TokenHolding[]) => {
    const storeTokens = updatedTokens.map(t => ({
      symbol: t.symbol, 
      name: t.name, 
      network: t.network, 
      quantity: parseFloat(t.balance), 
      priceUsd: parseFloat(t.price), 
      totalValue: t.valueUsd
    }));
    updatePaperWallet(id, storeTokens);
  };

  const addTokenToHoldings = () => {
    if (!tokenNetwork || !selectedToken || !tokenBalance || fetchedPrice === null) return;
    const tokenInfo = networkTokens[tokenNetwork]?.find((t) => t.symbol === selectedToken);
    if (!tokenInfo) return;
    const numericBalance = parseFloat(tokenBalance);
    const valueUsd = numericBalance * fetchedPrice;
    const newToken: TokenHolding = {
      id: `token-${Date.now()}`,
      network: SUPPORTED_CHAINS.find((c) => c.name === tokenNetwork)?.name || tokenNetwork,
      symbol: tokenInfo.symbol, 
      name: tokenInfo.name, 
      balance: tokenBalance, 
      price: fetchedPrice.toString(), 
      valueUsd,
    };
    if (currentWalletForToken) {
      const w = displayWallets.find((w) => w.id === currentWalletForToken);
      if (w) {
        updateWallet(currentWalletForToken, [...w.tokens, newToken]);
      }
      setShowAddToken(false);
      setCurrentWalletForToken(null);
    } else {
      setInitialTokens((prev) => [...prev, newToken]);
    }
    setTokenNetwork(""); 
    setSelectedToken(""); 
    setTokenBalance(""); 
    setFetchedPrice(null);
  };

  const removeToken = (tokenId: string, walletId?: string) => {
    if (walletId) {
      const w = displayWallets.find((w) => w.id === walletId);
      if (w) {
        updateWallet(walletId, w.tokens.filter((t) => t.id !== tokenId));
      }
    } else {
      setInitialTokens((prev) => prev.filter((t) => t.id !== tokenId));
    }
  };

  const openAddTokenForWallet = (walletId: string) => {
    setCurrentWalletForToken(walletId);
    setShowAddToken(true);
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

  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) => {
      if (prev.includes(chainId)) {
        return prev.filter((id) => id !== chainId);
      }
      return [...prev, chainId];
    });
  };

  const handleAddTokenDialogOpenChange = (open: boolean) => {
    if (!open) {
      setTokenNetwork("");
      setSelectedToken("");
      setTokenBalance("");
      setFetchedPrice(null);
    }
    setShowAddToken(open);
  };

  // Mock price fetch logic
  useEffect(() => {
    if (tokenNetwork && selectedToken) {
      setIsFetchingPrice(true);
      const timer = setTimeout(() => {
        setFetchedPrice(Math.random() * 100 + 1);
        setIsFetchingPrice(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFetchedPrice(null);
    }
  }, [tokenNetwork, selectedToken]);

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              {mode.current === "demo" ? "Manage your simulated assets" : "Manage your connected wallets"}
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
            
            {mode.current !== "demo" && wallet.wallet && (
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
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo" ? paperWallets.length : wallet.wallet ? 1 : 0}
              </div>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${mode.current === "demo" ? paperWallets.reduce((sum, w) => sum + w.totalValue, 0).toLocaleString() : wallet.totalValueUsd.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo" ? paperWallets.reduce((sum, w) => sum + w.tokens.length, 0) : wallet.assets.length}
              </div>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Networks</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo" ? new Set(paperWallets.flatMap((w) => w.tokens.map((t) => t.network))).size : new Set(wallet.assets.map((a) => a.network)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

        {mode.current === "demo" && displayWallets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Paper Wallets</h2>
            {displayWallets.map((walletItem) => {
              const isExpanded = expandedWallets.has(walletItem.id);
              return (
                <Card key={walletItem.id} className="card-gradient border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">{walletItem.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">{walletItem.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${walletItem.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => openAddTokenForWallet(walletItem.id)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleWalletExpand(walletItem.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        {walletItem.tokens.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No tokens added yet</p>
                        ) : (
                          walletItem.tokens.map((token) => (
                            <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">{token.network}</Badge>
                                <div>
                                  <p className="font-semibold">{token.symbol}</p>
                                  <p className="text-xs text-muted-foreground">{token.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-medium">{token.balance} {token.symbol}</p>
                                  <p className="text-xs text-muted-foreground">${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeToken(token.id, walletItem.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <Button size="sm" variant="destructive" onClick={() => handleDeletePaperWallet(walletItem.id)} disabled={deleteLoading === walletItem.id}>
                          {deleteLoading === walletItem.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> 
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" /> 
                              Delete Wallet
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showCreateWallet} onOpenChange={setShowCreateWallet}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Paper Wallet</DialogTitle>
              <DialogDescription>Create a simulated multi-chain wallet.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Wallet Name</Label>
                <Input value={walletName} onChange={(e) => setWalletName(e.target.value)} />
              </div>
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
                      <Label htmlFor={`chain-${chain.id}`} className="flex items-center gap-2 cursor-pointer">
                        {chain.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Initial Token Holdings</Label>
                  <Button size="sm" variant="outline" onClick={() => setShowAddToken(true)}>
                    <Plus className="h-4 w-4 mr-2" /> 
                    Add Token
                  </Button>
                </div>
                {initialTokens.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">No tokens added</p>
                ) : (
                  initialTokens.map((token) => (
                    <div key={token.id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Badge>{token.symbol}</Badge>
                        <span className="text-sm">{token.balance}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeToken(token.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateWallet(false)}>Cancel</Button>
              <Button onClick={createPaperWallet}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddToken} onOpenChange={handleAddTokenDialogOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Token</DialogTitle>
              <DialogDescription>Select a network and token.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={tokenNetwork} onValueChange={(val) => { setTokenNetwork(val); setSelectedToken(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CHAINS.map((chain) => (
                      <SelectItem key={chain.id} value={chain.name}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken} disabled={!tokenNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder={tokenNetwork ? "Select token" : "Select network first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tokenNetwork && networkTokens[tokenNetwork]?.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" step="any" placeholder="0.0" value={tokenBalance} onChange={(e) => setTokenBalance(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToken(false)}>Cancel</Button>
              <Button onClick={addTokenToHoldings} disabled={isFetchingPrice || !tokenNetwork || !selectedToken || !tokenBalance}>
                Add to Holdings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}