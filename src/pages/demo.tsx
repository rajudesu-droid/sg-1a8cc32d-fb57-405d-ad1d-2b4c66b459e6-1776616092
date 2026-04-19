import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Download, RefreshCw, Edit, AlertCircle, Wallet, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

// Supported Networks with chain families
const SUPPORTED_NETWORKS = [
  // EVM Chains
  { id: "ethereum", name: "Ethereum", symbol: "ETH", family: "evm", color: "bg-blue-500" },
  { id: "bsc", name: "BSC", symbol: "BNB", family: "evm", color: "bg-yellow-500" },
  { id: "polygon", name: "Polygon", symbol: "POL", family: "evm", color: "bg-purple-500" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", family: "evm", color: "bg-blue-400" },
  { id: "optimism", name: "Optimism", symbol: "OP", family: "evm", color: "bg-red-500" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", family: "evm", color: "bg-red-600" },
  { id: "base", name: "Base", symbol: "ETH", family: "evm", color: "bg-blue-600" },
  { id: "fantom", name: "Fantom", symbol: "FTM", family: "evm", color: "bg-blue-300" },
  { id: "cronos", name: "Cronos", symbol: "CRO", family: "evm", color: "bg-indigo-500" },
  
  // Non-EVM Chains
  { id: "solana", name: "Solana", symbol: "SOL", family: "solana", color: "bg-gradient-to-r from-purple-400 to-pink-400" },
  { id: "xrpl", name: "XRP Ledger", symbol: "XRP", family: "xrpl", color: "bg-gray-700" },
  { id: "tron", name: "TRON", symbol: "TRX", family: "tron", color: "bg-red-700" },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", family: "bitcoin", color: "bg-orange-500" },
] as const;

// Popular tokens by network
const POPULAR_TOKENS: Record<string, Array<{ symbol: string; name: string; decimals: number }>> = {
  ethereum: [
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    { symbol: "LINK", name: "Chainlink", decimals: 18 },
    { symbol: "UNI", name: "Uniswap", decimals: 18 },
  ],
  bsc: [
    { symbol: "USDT", name: "Tether USD", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", decimals: 18 },
    { symbol: "BUSD", name: "Binance USD", decimals: 18 },
    { symbol: "CAKE", name: "PancakeSwap", decimals: 18 },
    { symbol: "WBNB", name: "Wrapped BNB", decimals: 18 },
  ],
  polygon: [
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
    { symbol: "WMATIC", name: "Wrapped MATIC", decimals: 18 },
    { symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  ],
  solana: [
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
    { symbol: "SOL", name: "Wrapped SOL", decimals: 9 },
    { symbol: "RAY", name: "Raydium", decimals: 6 },
    { symbol: "SRM", name: "Serum", decimals: 6 },
  ],
  xrpl: [
    { symbol: "USD", name: "USD (Bitstamp)", decimals: 6 },
    { symbol: "EUR", name: "EUR (Bitstamp)", decimals: 6 },
    { symbol: "BTC", name: "BTC (Bitstamp)", decimals: 8 },
  ],
  tron: [
    { symbol: "USDT", name: "Tether USD", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", decimals: 6 },
    { symbol: "WTRX", name: "Wrapped TRX", decimals: 6 },
  ],
};

interface DemoAsset {
  id: string;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  priceUsd: number;
  isNative: boolean;
  contractAddress?: string;
}

interface PaperWallet {
  id: string;
  name: string;
  address: string;
  chains: string[];
  assets: DemoAsset[];
  totalValueUsd: number;
  createdAt: Date;
}

export default function DemoPortfolio() {
  const [paperWallets, setPaperWallets] = useState<PaperWallet[]>([]);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  
  // Create Wallet Form
  const [walletName, setWalletName] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>(["ethereum", "bsc", "polygon"]);
  const [initialTokens, setInitialTokens] = useState<DemoAsset[]>([]);
  
  // Add Token Form
  const [tokenNetwork, setTokenNetwork] = useState("ethereum");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenPrice, setTokenPrice] = useState("1");
  const [showCustomToken, setShowCustomToken] = useState(false);

  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);

  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Demo] Mode changed");
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle chain selection
  const toggleChain = (chainId: string) => {
    setSelectedChains(prev => 
      prev.includes(chainId) ? prev.filter(c => c !== chainId) : [...prev, chainId]
    );
  };

  // Add token to initial holdings
  const handleAddInitialToken = () => {
    if (!tokenSymbol || !tokenBalance || !tokenNetwork) {
      toast({
        title: "Missing Information",
        description: "Please fill in all token details",
        variant: "destructive",
      });
      return;
    }

    const newAsset: DemoAsset = {
      id: `asset-${Date.now()}`,
      network: tokenNetwork,
      symbol: tokenSymbol.toUpperCase(),
      name: tokenName || tokenSymbol,
      balance: tokenBalance,
      decimals: 18,
      priceUsd: parseFloat(tokenPrice),
      isNative: tokenSymbol.toUpperCase() === SUPPORTED_NETWORKS.find(n => n.id === tokenNetwork)?.symbol,
    };

    setInitialTokens([...initialTokens, newAsset]);
    setTokenSymbol("");
    setTokenName("");
    setTokenBalance("");
    setTokenPrice("1");
    setShowCustomToken(false);
  };

  // Remove token from initial holdings
  const removeInitialToken = (assetId: string) => {
    setInitialTokens(initialTokens.filter(a => a.id !== assetId));
  };

  // Create paper wallet
  const handleCreateWallet = () => {
    if (!walletName || selectedChains.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please provide a wallet name and select at least one chain",
        variant: "destructive",
      });
      return;
    }

    const newWallet: PaperWallet = {
      id: `wallet-${Date.now()}`,
      name: walletName,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      chains: selectedChains,
      assets: initialTokens,
      totalValueUsd: initialTokens.reduce((sum, asset) => sum + (parseFloat(asset.balance) * asset.priceUsd), 0),
      createdAt: new Date(),
    };

    setPaperWallets([...paperWallets, newWallet]);
    setShowCreateWallet(false);
    setWalletName("");
    setSelectedChains(["ethereum", "bsc", "polygon"]);
    setInitialTokens([]);

    toast({
      title: "Paper Wallet Created",
      description: `${walletName} created with ${initialTokens.length} tokens`,
    });
  };

  // Delete paper wallet
  const handleDeleteWallet = (walletId: string) => {
    setPaperWallets(paperWallets.filter(w => w.id !== walletId));
    toast({
      title: "Wallet Deleted",
      description: "Paper wallet removed from simulation",
      variant: "destructive",
    });
  };

  // Add token to existing wallet
  const handleAddTokenToWallet = () => {
    if (!selectedWalletId || !tokenSymbol || !tokenBalance) {
      toast({
        title: "Missing Information",
        description: "Please fill in all token details",
        variant: "destructive",
      });
      return;
    }

    const newAsset: DemoAsset = {
      id: `asset-${Date.now()}`,
      network: tokenNetwork,
      symbol: tokenSymbol.toUpperCase(),
      name: tokenName || tokenSymbol,
      balance: tokenBalance,
      decimals: 18,
      priceUsd: parseFloat(tokenPrice),
      isNative: false,
    };

    setPaperWallets(paperWallets.map(wallet => {
      if (wallet.id === selectedWalletId) {
        const updatedAssets = [...wallet.assets, newAsset];
        return {
          ...wallet,
          assets: updatedAssets,
          totalValueUsd: updatedAssets.reduce((sum, asset) => sum + (parseFloat(asset.balance) * asset.priceUsd), 0),
        };
      }
      return wallet;
    }));

    setShowAddToken(false);
    setTokenSymbol("");
    setTokenName("");
    setTokenBalance("");
    setTokenPrice("1");

    toast({
      title: "Token Added",
      description: `${tokenSymbol.toUpperCase()} added to wallet`,
    });
  };

  // Remove token from wallet
  const removeTokenFromWallet = (walletId: string, assetId: string) => {
    setPaperWallets(paperWallets.map(wallet => {
      if (wallet.id === walletId) {
        const updatedAssets = wallet.assets.filter(a => a.id !== assetId);
        return {
          ...wallet,
          assets: updatedAssets,
          totalValueUsd: updatedAssets.reduce((sum, asset) => sum + (parseFloat(asset.balance) * asset.priceUsd), 0),
        };
      }
      return wallet;
    }));
  };

  // Select popular token
  const selectPopularToken = (token: typeof POPULAR_TOKENS[string][number]) => {
    setTokenSymbol(token.symbol);
    setTokenName(token.name);
    setShowCustomToken(false);
  };

  // Toggle wallet expansion
  const toggleWalletExpansion = (walletId: string) => {
    setExpandedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  // Calculate total balance across all wallets
  const totalBalance = paperWallets.reduce((sum, wallet) => sum + wallet.totalValueUsd, 0);

  // Group assets by network
  const getAssetsByNetwork = (assets: DemoAsset[]) => {
    const grouped: Record<string, DemoAsset[]> = {};
    assets.forEach(asset => {
      if (!grouped[asset.network]) {
        grouped[asset.network] = [];
      }
      grouped[asset.network].push(asset);
    });
    return grouped;
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Demo Portfolio";
      case "shadow": return "Shadow Portfolio (Read-Only)";
      case "live": return "Live Portfolio";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo": return "Create paper wallets and manage simulated assets across multiple chains";
      case "shadow": return "View wallet assets in read-only mode";
      case "live": return "Real wallet balances and transaction history";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-1">
              {getPageDescription()}
            </p>
          </div>

          <Dialog open={showCreateWallet} onOpenChange={setShowCreateWallet}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={mode.current !== "demo"}>
                <Plus className="h-4 w-4" />
                Create Paper Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Paper Wallet</DialogTitle>
                <DialogDescription>
                  Create a simulated wallet with specific balance for testing strategies
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Wallet Name */}
                <div className="space-y-2">
                  <Label>Wallet Name (Optional)</Label>
                  <Input
                    placeholder="e.g. Test Strategy 1"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                  />
                </div>

                {/* Supported Chains */}
                <div className="space-y-3">
                  <Label>Supported Chains</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SUPPORTED_NETWORKS.map((network) => (
                      <div key={network.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`chain-${network.id}`}
                          checked={selectedChains.includes(network.id)}
                          onCheckedChange={() => toggleChain(network.id)}
                        />
                        <label
                          htmlFor={`chain-${network.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {network.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Initial Token Holdings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Initial Token Holdings</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowCustomToken(!showCustomToken)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Token
                    </Button>
                  </div>

                  {showCustomToken && (
                    <Card className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select value={tokenNetwork} onValueChange={setTokenNetwork}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_NETWORKS.map((network) => (
                                <SelectItem key={network.id} value={network.id}>
                                  {network.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Asset</Label>
                          <div className="flex gap-2">
                            <Select value={tokenSymbol} onValueChange={(value) => {
                              const token = POPULAR_TOKENS[tokenNetwork]?.find(t => t.symbol === value);
                              if (token) {
                                selectPopularToken(token);
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select or type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom Token</SelectItem>
                                {POPULAR_TOKENS[tokenNetwork]?.map((token) => (
                                  <SelectItem key={token.symbol} value={token.symbol}>
                                    {token.symbol} - {token.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {tokenSymbol === "custom" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Token Symbol</Label>
                            <Input
                              placeholder="e.g. USDT"
                              value={tokenSymbol === "custom" ? "" : tokenSymbol}
                              onChange={(e) => setTokenSymbol(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Token Name</Label>
                            <Input
                              placeholder="e.g. Tether USD"
                              value={tokenName}
                              onChange={(e) => setTokenName(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            placeholder="0.0"
                            value={tokenBalance}
                            onChange={(e) => setTokenBalance(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price per Token (USD)</Label>
                          <Input
                            type="number"
                            placeholder="1.00"
                            value={tokenPrice}
                            onChange={(e) => setTokenPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Value: ${(parseFloat(tokenBalance || "0") * parseFloat(tokenPrice || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button size="sm" onClick={handleAddInitialToken}>
                          Add to Holdings
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Token List */}
                  {initialTokens.length > 0 && (
                    <div className="space-y-2">
                      {initialTokens.map((asset) => {
                        const network = SUPPORTED_NETWORKS.find(n => n.id === asset.network);
                        return (
                          <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={network?.color}>
                                {network?.symbol}
                              </Badge>
                              <div>
                                <p className="font-semibold text-sm">{asset.symbol}</p>
                                <p className="text-xs text-muted-foreground">{asset.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold text-sm">{parseFloat(asset.balance).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${(parseFloat(asset.balance) * asset.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInitialToken(asset.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="font-semibold">Total Initial Value:</p>
                        <p className="text-xl font-bold text-primary">
                          ${initialTokens.reduce((sum, asset) => sum + (parseFloat(asset.balance) * asset.priceUsd), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateWallet(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWallet}>
                  Create Wallet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Demo Mode Warning */}
        {mode.current !== "demo" && (
          <Card className="card-gradient border-accent/20 border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <p className="font-semibold">Demo Portfolio is only available in Demo Mode</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mode.current === "shadow" 
                      ? "Switch to Demo Mode to manually manage simulated assets."
                      : "Switch to Demo Mode to use the simulation portfolio."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Summary */}
        {paperWallets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-gradient border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Paper Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paperWallets.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active wallets</p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all wallets</p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mode Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Simulation</div>
                <p className="text-xs text-muted-foreground mt-1">Demo mode active</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Paper Wallets List */}
        {paperWallets.length > 0 ? (
          <div className="space-y-4">
            {paperWallets.map((wallet) => {
              const isExpanded = expandedWallets.has(wallet.id);
              const assetsByNetwork = getAssetsByNetwork(wallet.assets);

              return (
                <Card key={wallet.id} className="card-gradient border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{wallet.name || `Wallet ${wallet.id.slice(-4)}`}</CardTitle>
                          <CardDescription className="font-mono text-xs mt-1">
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold">${wallet.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">{wallet.assets.length} tokens</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWalletExpansion(wallet.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWalletId(wallet.id);
                            setShowAddToken(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWallet(wallet.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Chain Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {wallet.chains.map(chainId => {
                        const network = SUPPORTED_NETWORKS.find(n => n.id === chainId);
                        return network ? (
                          <Badge key={chainId} variant="outline" className={`${network.color} text-white`}>
                            {network.symbol}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4">
                      {/* Token Holdings */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Token Holdings</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {wallet.assets.map((asset) => {
                            const network = SUPPORTED_NETWORKS.find(n => n.id === asset.network);
                            const valueUsd = parseFloat(asset.balance) * asset.priceUsd;
                            
                            return (
                              <div key={asset.id} className="p-3 rounded-lg border border-border/50 bg-card/30">
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="outline" className={`${network?.color} text-white text-xs`}>
                                    {asset.symbol}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={() => removeTokenFromWallet(wallet.id, asset.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="font-semibold text-sm">{parseFloat(asset.balance).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{network?.name}</p>
                                <p className="text-sm font-semibold text-primary mt-1">
                                  ${valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <Separator />

                      {/* Chain Balances */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Chain Balances</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(assetsByNetwork).map(([networkId, assets]) => {
                            const network = SUPPORTED_NETWORKS.find(n => n.id === networkId);
                            const chainTotal = assets.reduce((sum, asset) => sum + (parseFloat(asset.balance) * asset.priceUsd), 0);
                            
                            return (
                              <div key={networkId} className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">{network?.name}</p>
                                <p className="font-semibold">${chainTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-muted-foreground">{assets.length} tokens</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-gradient border-border/50">
            <CardContent className="p-12 text-center">
              <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Paper Wallets</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a paper wallet to start simulating multi-chain strategies
              </p>
              <Button
                onClick={() => setShowCreateWallet(true)}
                disabled={mode.current !== "demo"}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Paper Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Token to Existing Wallet Dialog */}
        <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Token to Wallet</DialogTitle>
              <DialogDescription>
                Add a new token to the selected paper wallet
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={tokenNetwork} onValueChange={setTokenNetwork}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_NETWORKS.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Token</Label>
                <Select value={tokenSymbol} onValueChange={(value) => {
                  const token = POPULAR_TOKENS[tokenNetwork]?.find(t => t.symbol === value);
                  if (token) {
                    selectPopularToken(token);
                  } else {
                    setTokenSymbol(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_TOKENS[tokenNetwork]?.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        {token.symbol} - {token.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tokenSymbol === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Token Symbol</Label>
                    <Input
                      placeholder="e.g. USDT"
                      value={tokenSymbol === "custom" ? "" : tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token Name</Label>
                    <Input
                      placeholder="e.g. Tether USD"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={tokenBalance}
                  onChange={(e) => setTokenBalance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Price per Token (USD)</Label>
                <Input
                  type="number"
                  placeholder="1.00"
                  value={tokenPrice}
                  onChange={(e) => setTokenPrice(e.target.value)}
                />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Value:</p>
                  <p className="text-lg font-bold text-primary">
                    ${(parseFloat(tokenBalance || "0") * parseFloat(tokenPrice || "0")).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToken(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTokenToWallet}>
                Add Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}