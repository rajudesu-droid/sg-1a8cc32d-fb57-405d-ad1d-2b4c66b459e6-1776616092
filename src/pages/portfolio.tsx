import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

// Mock data for demonstration
const mockPortfolioData = {
  demo: {
    totalValue: 34631.80,
    walletCount: 1,
    tokens: [
      { symbol: "XRP", network: "XRP Ledger", balance: "51.44", value: 11629.00 },
      { symbol: "ETH", network: "Ethereum", balance: "9.2304", value: 23204.44 },
      { symbol: "ETH", network: "BSC", balance: "9", value: 23204.44 },
      { symbol: "POL", network: "Polygon", balance: "30.87", value: 21050.00 },
      { symbol: "USDT", network: "BSC", balance: "9100", value: 9100.00 },
      { symbol: "BNB", network: "BSC", balance: "16.43", value: 10539.00 },
      { symbol: "SOL", network: "Solana", balance: "188.33", value: 22838.36 },
    ],
  },
  shadow: {
    totalValue: 45230.50,
    walletCount: 1,
    tokens: [
      { symbol: "ETH", network: "Ethereum", balance: "12.5", value: 31250.00 },
      { symbol: "USDC", network: "Ethereum", balance: "5000", value: 5000.00 },
      { symbol: "BNB", network: "BSC", balance: "15", value: 6480.50 },
      { symbol: "SOL", network: "Solana", balance: "20", value: 2500.00 },
    ],
  },
  live: {
    totalValue: 0,
    walletCount: 0,
    tokens: [],
  },
};

export default function Portfolio() {
  const mode = useAppStore((state) => state.mode);
  const wallet = useAppStore((state) => state.wallet);
  const portfolio = useAppStore((state) => state.portfolio);
  const paperWallets = useAppStore((state) => state.paperWallets);

  const [portfolioData, setPortfolioData] = useState<{
    totalValue: number;
    deployedCapital: number;
    idleCapital: number;
    tokens: Array<{
      symbol: string;
      name: string;
      network: string;
      balance: number;
      value: number;
      price: number;
      change24h: number;
    }>;
    chains: Array<{ name: string; value: number }>;
  }>({
    totalValue: 0,
    deployedCapital: 0,
    idleCapital: 0,
    tokens: [],
    chains: [],
  });

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Portfolio] Mode changed, updating portfolio view");
      }
    });
    return () => unsubscribe();
  }, []);

  // Update portfolio data when mode, wallet, or paper wallets change
  useEffect(() => {
    if (mode.current === "demo") {
      // Demo mode - aggregate data from paper wallets
      if (paperWallets.length === 0) {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          tokens: [],
          chains: [],
        });
      } else {
        const allTokens = paperWallets.flatMap((wallet) =>
          wallet.tokens.map((token) => ({
            symbol: token.symbol,
            name: token.name,
            network: token.network,
            balance: token.quantity,
            value: token.totalValue,
            price: token.priceUsd,
            change24h: 0,
          }))
        );

        const chainBalances = allTokens.reduce((acc, token) => {
          const existing = acc.find((c) => c.name === token.network);
          if (existing) {
            existing.value += token.value;
          } else {
            acc.push({ name: token.network, value: token.value });
          }
          return acc;
        }, [] as Array<{ name: string; value: number }>);

        const totalValue = allTokens.reduce((sum, t) => sum + t.value, 0);

        setPortfolioData({
          totalValue,
          deployedCapital: 0,
          idleCapital: totalValue,
          tokens: allTokens,
          chains: chainBalances,
        });
      }
    } else if (mode.current === "shadow") {
      // Shadow mode - shows data from connected wallet
      if (wallet.wallet) {
        const walletTokens = wallet.assets.map((asset) => ({
          symbol: asset.symbol,
          name: asset.name,
          network: asset.network,
          balance: parseFloat(asset.balance) || 0,
          value: (parseFloat(asset.balance) || 0) * (asset.priceUsd || 0),
          price: asset.priceUsd || 0,
          change24h: 0,
        }));

        const chainBalances = walletTokens.reduce((acc, token) => {
          const existing = acc.find((c) => c.name === token.network);
          if (existing) {
            existing.value += token.value;
          } else {
            acc.push({ name: token.network, value: token.value });
          }
          return acc;
        }, [] as Array<{ name: string; value: number }>);

        const totalValue = walletTokens.reduce((sum, t) => sum + t.value, 0);

        setPortfolioData({
          totalValue,
          deployedCapital: 0,
          idleCapital: totalValue,
          tokens: walletTokens,
          chains: chainBalances,
        });
      } else {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          tokens: [],
          chains: [],
        });
      }
    } else if (mode.current === "live") {
      // Live mode - shows real portfolio
      if (wallet.wallet) {
        const walletTokens = wallet.assets.map((asset) => ({
          symbol: asset.symbol,
          name: asset.name,
          network: asset.network,
          balance: parseFloat(asset.balance) || 0,
          value: (parseFloat(asset.balance) || 0) * (asset.priceUsd || 0),
          price: asset.priceUsd || 0,
          change24h: 0,
        }));

        const chainBalances = walletTokens.reduce((acc, token) => {
          const existing = acc.find((c) => c.name === token.network);
          if (existing) {
            existing.value += token.value;
          } else {
            acc.push({ name: token.network, value: token.value });
          }
          return acc;
        }, [] as Array<{ name: string; value: number }>);

        const totalValue = walletTokens.reduce((sum, t) => sum + t.value, 0);
        const deployedCapital = portfolio?.deployedCapital || 0;

        setPortfolioData({
          totalValue,
          deployedCapital,
          idleCapital: totalValue - deployedCapital,
          tokens: walletTokens,
          chains: chainBalances,
        });
      } else {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          tokens: [],
          chains: [],
        });
      }
    }
  }, [mode.current, wallet.wallet, wallet.assets, portfolio, paperWallets]);

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo":
        return "Portfolio (Simulated)";
      case "shadow":
        return "Portfolio (Read-Only)";
      case "live":
        return "Portfolio (Live)";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo":
        return "Simulated portfolio overview and token holdings";
      case "shadow":
        return "Read-only view of connected wallet portfolio";
      case "live":
        return "Live portfolio overview and asset management";
    }
  };

  // Group tokens by network
  const tokensByNetwork = portfolioData.tokens.reduce((acc, token) => {
    if (!acc[token.network]) {
      acc[token.network] = [];
    }
    acc[token.network].push(token);
    return acc;
  }, {} as Record<string, typeof portfolioData.tokens>);

  const networks = Object.keys(tokensByNetwork);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-1">{getPageDescription()}</p>
          </div>
          <Badge variant={mode.current === "demo" ? "secondary" : mode.current === "shadow" ? "outline" : "default"}>
            {mode.label}
          </Badge>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Portfolio Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolioData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Simulated total" : mode.current === "shadow" ? "Estimated value" : "Real-time value"}
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mode.current === "demo" ? paperWallets.length : wallet.wallet ? 1 : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mode.current === "demo" ? "Paper wallets" : mode.current === "shadow" ? "Read-only wallets" : "Active wallets"}
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets Held</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioData.tokens.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {networks.length} networks</p>
            </CardContent>
          </Card>
        </div>

        {/* Token Holdings by Network */}
        {portfolioData.tokens.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Token Holdings</h2>
            {networks.map((network) => (
              <Card key={network} className="card-gradient border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {network}
                    <Badge variant="outline" className="text-xs">
                      {tokensByNetwork[network].length} tokens
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {tokensByNetwork[network].map((token, idx) => (
                      <div key={`${token.symbol}-${idx}`} className="rounded-lg border border-border/50 bg-card/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="default" className="text-xs">
                            {token.symbol}
                          </Badge>
                          <span className="text-sm font-semibold">
                            ${token.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Balance: {token.balance} {token.symbol}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-gradient border-border/50">
            <CardContent className="p-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No tokens in portfolio</p>
                <p className="text-xs text-muted-foreground mb-4">
                  {mode.current === "demo"
                    ? "Go to Wallets page to create a paper wallet and add tokens"
                    : mode.current === "shadow"
                    ? "Connect a wallet to view your portfolio"
                    : "Connect a wallet to get started"}
                </p>
                <Button onClick={() => (window.location.href = "/wallets")}>
                  {mode.current === "demo" ? "Create Paper Wallet" : "Connect Wallet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}