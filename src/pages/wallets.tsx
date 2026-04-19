import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  AlertCircle,
  X,
  Loader2,
  DollarSign,
  Coins,
  Network
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

// Supported chains with colors
const SUPPORTED_CHAINS = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", color: "bg-blue-500" },
  { id: "bsc", name: "BSC", symbol: "BNB", color: "bg-yellow-500" },
  { id: "polygon", name: "Polygon", symbol: "POL", color: "bg-purple-500" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", color: "bg-cyan-500" },
  { id: "optimism", name: "Optimism", symbol: "OP", color: "bg-red-500" },
  { id: "avalanche", name: "Avalanche", symbol: "AVAX", color: "bg-red-600" },
  { id: "base", name: "Base", symbol: "ETH", color: "bg-blue-600" },
  { id: "fantom", name: "Fantom", symbol: "FTM", color: "bg-blue-400" },
  { id: "cronos", name: "Cronos", symbol: "CRO", color: "bg-indigo-500" },
  { id: "solana", name: "Solana", symbol: "SOL", color: "bg-gradient-to-r from-purple-500 to-cyan-500" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP", color: "bg-gray-700" },
  { id: "tron", name: "TRON", symbol: "TRX", color: "bg-red-700" },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", color: "bg-orange-500" },
];

// Network token mapping with simulated market prices
const networkTokens: Record<string, Array<{ symbol: string; name: string; basePrice: number }>> = {
  ethereum: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3100.50 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WETH", name: "Wrapped Ether", basePrice: 3100.50 },
    { symbol: "DAI", name: "Dai Stablecoin", basePrice: 1.00 },
    { symbol: "LINK", name: "Chainlink", basePrice: 14.50 },
    { symbol: "UNI", name: "Uniswap", basePrice: 6.20 },
  ],
  bsc: [
    { symbol: "BNB", name: "BNB", basePrice: 610.30 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "BUSD", name: "Binance USD", basePrice: 1.00 },
    { symbol: "CAKE", name: "PancakeSwap", basePrice: 2.45 },
    { symbol: "WBNB", name: "Wrapped BNB", basePrice: 610.30 },
  ],
  polygon: [
    { symbol: "POL", name: "Polygon", basePrice: 0.85 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WMATIC", name: "Wrapped MATIC", basePrice: 0.85 },
    { symbol: "DAI", name: "Dai Stablecoin", basePrice: 1.00 },
  ],
  arbitrum: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3100.50 },
    { symbol: "ARB", name: "Arbitrum", basePrice: 0.92 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
  ],
  optimism: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3100.50 },
    { symbol: "OP", name: "Optimism", basePrice: 2.15 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
  ],
  avalanche: [
    { symbol: "AVAX", name: "Avalanche", basePrice: 38.20 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WAVAX", name: "Wrapped AVAX", basePrice: 38.20 },
  ],
  base: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3100.50 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WETH", name: "Wrapped Ether", basePrice: 3100.50 },
  ],
  fantom: [
    { symbol: "FTM", name: "Fantom", basePrice: 0.75 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WFTM", name: "Wrapped Fantom", basePrice: 0.75 },
  ],
  cronos: [
    { symbol: "CRO", name: "Cronos", basePrice: 0.12 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
  ],
  solana: [
    { symbol: "SOL", name: "Solana", basePrice: 145.60 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "RAY", name: "Raydium", basePrice: 2.80 },
    { symbol: "SRM", name: "Serum", basePrice: 0.35 },
  ],
  xrp: [
    { symbol: "XRP", name: "XRP", basePrice: 2.15 },
    { symbol: "USD", name: "USD (Bitstamp)", basePrice: 1.00 },
    { symbol: "EUR", name: "EUR (Bitstamp)", basePrice: 1.08 },
    { symbol: "BTC", name: "BTC (Bitstamp)", basePrice: 95000.00 },
  ],
  tron: [
    { symbol: "TRX", name: "TRON", basePrice: 0.24 },
    { symbol: "USDT", name: "Tether USD", basePrice: 1.00 },
    { symbol: "USDC", name: "USD Coin", basePrice: 1.00 },
    { symbol: "WTRX", name: "Wrapped TRX", basePrice: 0.24 },
  ],
  bitcoin: [
    { symbol: "BTC", name: "Bitcoin", basePrice: 95000.00 },
  ],
};

interface TokenHolding {
  id: string;
  network: string;
  symbol: string;
  name: string;
  balance: string;
  price: string;
  valueUsd: number;
}

export default function Wallets() {
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  
  // Paper wallet creation state
  const [walletName, setWalletName] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [initialTokens, setInitialTokens] = useState<TokenHolding[]>([]);
  const [currentWalletForToken, setCurrentWalletForToken] = useState<string | null>(null);
  
  // Add token state
  const [tokenNetwork, setTokenNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  
  // Market data fetching state
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null);

  const { isConnected, connectWallet } = useWallet();
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);
  const paperWallets = useAppStore((state) => state.paperWallets);
  const addPaperWallet = useAppStore((state) => state.addPaperWallet);
  
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
      
      // Simulate API call to CoinGecko/CoinMarketCap
      const timer = setTimeout(() => {
        const token = networkTokens[tokenNetwork]?.find((t) => t.symbol === selectedToken);
        if (token) {
          // Add a tiny bit of random variance to simulate real market data
          const variance = token.basePrice * (Math.random() * 0.002 - 0.001);
          setFetchedPrice(token.basePrice + variance);
        } else {
          setFetchedPrice(0);
        }
        setIsFetchingPrice(false);
      }, 600);
      
      return () => clearTimeout(timer);
    } else {
      setFetchedPrice(null);
    }
  }, [tokenNetwork, selectedToken]);

  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    
    const modeLabel = mode.current === "demo" ? "simulated" : mode.current === "shadow" ? "read-only" : "live";
    toast({
      title: "Balances Refreshed",
      description: `Updated ${modeLabel} wallet balances`,
    });
  };

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
        return "Manage connected wallet balances and execute transactions";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Wallets {mode.current === "demo" ? "(Paper Wallets)" : ""}
            </h1>
            <p className="text-muted-foreground">
              {mode.current === "demo"
                ? "Create and manage simulated paper wallets for testing strategies"
                : mode.current === "shadow"
                ? "Connect wallets for read-only monitoring"
                : "Connect and manage your Web3 wallets"}
            </p>
          </div>
          <div className="flex gap-3">
            {mode.current === "demo" && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Paper Wallet
              </Button>
            )}
            {mode.current !== "demo" && (
              <>
                <Button variant="outline" onClick={handleRefreshBalances}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Balances
                </Button>
                <Button onClick={handleWalletConnect}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
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
                  ? new Set(paperWallets.flatMap((w) => w.chains)).size
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
                              ${token.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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