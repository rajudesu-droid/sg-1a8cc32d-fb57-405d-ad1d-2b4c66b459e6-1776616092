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
  Send,
  ArrowLeftRight,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";
import { supportedNetworks } from "@/lib/walletConfig";
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

// Popular tokens by network
const POPULAR_TOKENS: Record<string, Array<{ symbol: string; name: string; price: string }>> = {
  ethereum: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "WETH", name: "Wrapped Ether", price: "2500" },
    { symbol: "DAI", name: "Dai Stablecoin", price: "1.00" },
    { symbol: "LINK", name: "Chainlink", price: "15.50" },
    { symbol: "UNI", name: "Uniswap", price: "8.20" },
  ],
  bsc: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "BUSD", name: "Binance USD", price: "1.00" },
    { symbol: "CAKE", name: "PancakeSwap", price: "2.50" },
    { symbol: "WBNB", name: "Wrapped BNB", price: "320" },
  ],
  polygon: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "WMATIC", name: "Wrapped MATIC", price: "0.85" },
    { symbol: "DAI", name: "Dai Stablecoin", price: "1.00" },
  ],
  solana: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "SOL", name: "Solana", price: "150" },
    { symbol: "RAY", name: "Raydium", price: "1.80" },
    { symbol: "SRM", name: "Serum", price: "0.50" },
  ],
  xrp: [
    { symbol: "USD", name: "USD (Bitstamp)", price: "1.00" },
    { symbol: "EUR", name: "EUR (Bitstamp)", price: "1.08" },
    { symbol: "BTC", name: "BTC (Bitstamp)", price: "65000" },
  ],
  tron: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "WTRX", name: "Wrapped TRX", price: "0.12" },
  ],
  bitcoin: [{ symbol: "BTC", name: "Bitcoin", price: "65000" }],
  arbitrum: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
  ],
  optimism: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
  ],
  avalanche: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
  ],
  base: [
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
    { symbol: "WETH", name: "Wrapped Ether", price: "2500" },
  ],
  fantom: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
  ],
  cronos: [
    { symbol: "USDT", name: "Tether USD", price: "1.00" },
    { symbol: "USDC", name: "USD Coin", price: "1.00" },
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

interface PaperWallet {
  id: string;
  name: string;
  address: string;
  chains: string[];
  tokens: TokenHolding[];
  totalValue: number;
  createdAt: Date;
}

export default function Wallets() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  
  // Paper wallet creation state
  const [walletName, setWalletName] = useState("");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [initialTokens, setInitialTokens] = useState<TokenHolding[]>([]);
  const [paperWallets, setPaperWallets] = useState<PaperWallet[]>([]);
  const [currentWalletForToken, setCurrentWalletForToken] = useState<string | null>(null);
  
  // Add token state
  const [tokenNetwork, setTokenNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [customTokenSymbol, setCustomTokenSymbol] = useState("");
  const [customTokenName, setCustomTokenName] = useState("");
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");

  const { isConnected, address, chainId, detectedAssets, refreshBalances, connectWallet } = useWallet();
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);

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
    if (!tokenNetwork || (!selectedToken && !customTokenSymbol) || !tokenBalance || !tokenPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all token details",
        variant: "destructive",
      });
      return;
    }

    const token = selectedToken
      ? POPULAR_TOKENS[tokenNetwork].find((t) => t.symbol === selectedToken)
      : { symbol: customTokenSymbol, name: customTokenName, price: tokenPrice };

    if (!token) return;

    const newToken: TokenHolding = {
      id: `token-${Date.now()}`,
      network: SUPPORTED_CHAINS.find((c) => c.id === tokenNetwork)?.name || tokenNetwork,
      symbol: token.symbol,
      name: token.name,
      balance: tokenBalance,
      price: tokenPrice || token.price,
      valueUsd: parseFloat(tokenBalance) * parseFloat(tokenPrice || token.price),
    };

    if (currentWalletForToken) {
      // Adding to existing wallet
      setPaperWallets((prev) =>
        prev.map((w) =>
          w.id === currentWalletForToken
            ? {
                ...w,
                tokens: [...w.tokens, newToken],
                totalValue: w.totalValue + newToken.valueUsd,
              }
            : w
        )
      );
      toast({
        title: "Token Added",
        description: `${newToken.symbol} added to wallet`,
      });
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
    setCustomTokenSymbol("");
    setCustomTokenName("");
    setTokenBalance("");
    setTokenPrice("");
  };

  const removeToken = (tokenId: string, walletId?: string) => {
    if (walletId) {
      setPaperWallets((prev) =>
        prev.map((w) => {
          if (w.id === walletId) {
            const tokenToRemove = w.tokens.find((t) => t.id === tokenId);
            return {
              ...w,
              tokens: w.tokens.filter((t) => t.id !== tokenId),
              totalValue: w.totalValue - (tokenToRemove?.valueUsd || 0),
            };
          }
          return w;
        })
      );
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

    const newWallet: PaperWallet = {
      id: `wallet-${Date.now()}`,
      name: walletName || `Paper Wallet ${paperWallets.length + 1}`,
      address: `0x${Math.random().toString(16).substring(2, 42)}`,
      chains: selectedChains,
      tokens: initialTokens,
      totalValue: initialTokens.reduce((sum, t) => sum + t.valueUsd, 0),
      createdAt: new Date(),
    };

    setPaperWallets((prev) => [...prev, newWallet]);
    
    toast({
      title: "Paper Wallet Created",
      description: `${newWallet.name} created with ${initialTokens.length} tokens`,
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
            <h1 className="text-3xl font-semibold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-1">{getPageDescription()}</p>
          </div>
          <div className="flex items-center gap-3">
            {mode.current === "demo" && (
              <Button onClick={() => setShowCreateWallet(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Paper Wallet
              </Button>
            )}
            {!isConnected && mode.current !== "demo" && (
              <Button onClick={connectWallet} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefreshBalances}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Balances
            </Button>
          </div>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Paper Wallets (Demo Mode) */}
        {mode.current === "demo" && paperWallets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Paper Wallets</h2>
            {paperWallets.map((wallet) => {
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
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State - Demo Mode */}
        {mode.current === "demo" && paperWallets.length === 0 && (
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
                <div className="grid grid-cols-2 gap-3">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <div key={chain.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={chain.id}
                        checked={selectedChains.includes(chain.id)}
                        onCheckedChange={() => toggleChain(chain.id)}
                      />
                      <Label
                        htmlFor={chain.id}
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
                              {token.balance} @ ${token.price}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
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

        {/* Add Token Dialog */}
        <Dialog open={showAddToken} onOpenChange={setShowAddToken}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Token</DialogTitle>
              <DialogDescription>
                Add a token to {currentWalletForToken ? "this wallet" : "the initial holdings"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Network Selection */}
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={tokenNetwork} onValueChange={setTokenNetwork}>
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
              {tokenNetwork && POPULAR_TOKENS[tokenNetwork] && (
                <div className="space-y-2">
                  <Label>Token (or enter custom below)</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select popular token" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_TOKENS[tokenNetwork].map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          {token.symbol} - {token.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Token */}
              {tokenNetwork && !selectedToken && (
                <>
                  <div className="space-y-2">
                    <Label>Custom Token Symbol</Label>
                    <Input
                      placeholder="e.g., CUSTOM"
                      value={customTokenSymbol}
                      onChange={(e) => setCustomTokenSymbol(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Token Name</Label>
                    <Input
                      placeholder="e.g., Custom Token"
                      value={customTokenName}
                      onChange={(e) => setCustomTokenName(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={tokenBalance}
                  onChange={(e) => setTokenBalance(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tokenPrice}
                  onChange={(e) => setTokenPrice(e.target.value)}
                />
              </div>

              {/* Value Preview */}
              {tokenBalance && tokenPrice && (
                <div className="rounded-lg border border-primary/50 bg-primary/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Token Value:</span>
                    <span className="text-lg font-bold text-primary">
                      $
                      {(parseFloat(tokenBalance) * parseFloat(tokenPrice)).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToken(false)}>
                Cancel
              </Button>
              <Button onClick={addTokenToHoldings}>Add to Holdings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}