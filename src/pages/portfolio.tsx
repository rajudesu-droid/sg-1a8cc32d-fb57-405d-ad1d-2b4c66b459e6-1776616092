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
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData.demo);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Portfolio] Mode changed, updating portfolio view");
        loadPortfolioData(event.data.newMode);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load portfolio data on mount
  useEffect(() => {
    loadPortfolioData(mode.current);
  }, [mode.current]);

  const loadPortfolioData = (currentMode: "demo" | "shadow" | "live") => {
    switch (currentMode) {
      case "demo":
        setPortfolioData(mockPortfolioData.demo);
        break;
      case "shadow":
        setPortfolioData(mockPortfolioData.shadow);
        break;
      case "live":
        setPortfolioData(mockPortfolioData.live);
        break;
    }
  };

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
              <div className="text-2xl font-bold">{portfolioData.walletCount}</div>
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