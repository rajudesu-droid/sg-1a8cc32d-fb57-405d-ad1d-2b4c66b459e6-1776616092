import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  Wallet,
  PiggyBank,
  Target,
  Info,
  TrendingDown,
  Calendar,
  Coins,
  Percent,
  Play,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { NetworkBalances } from "@/components/dashboard/NetworkBalances";
import { ConnectedWallets } from "@/components/dashboard/ConnectedWallets";
import { ExecutionMonitor } from "@/components/ExecutionMonitor";
import { PerformanceMonitorWidget } from "@/components/PerformanceMonitor";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";
import { useRouter } from "next/router";
import { assertNoSimulatedDataInLiveMode, getPortfolioForMode } from "@/core/utils/modeGuards";
import { botOrchestrationService } from "@/services/BotOrchestrationService";
import { useToast } from "@/hooks/use-toast";
import type { BotConfig } from "@/services/BotOrchestrationService";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { fetchTokenPrices } from "@/lib/cryptoPriceService";

export default function Dashboard() {
  const mode = useAppStore((state) => state.mode);
  const { isConnected, address, chainId, detectedAssets } = useWallet();
  const { connectedWallets } = useMultiWallet();
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Combine all tokens from all sources
  const allTokens = [
    ...detectedAssets.map(asset => ({
      symbol: asset.symbol,
      balance: asset.balance,
      network: asset.network,
    })),
    ...connectedWallets.flatMap(wallet =>
      (wallet.tokens || []).map(token => ({
        symbol: token.symbol,
        balance: token.balance,
        network: wallet.chainName,
      }))
    ),
  ];

  // Fetch token prices when tokens change
  useEffect(() => {
    if (mounted && allTokens.length > 0) {
      loadTokenPrices();
    }
  }, [mounted, detectedAssets.length, connectedWallets.length]);

  const loadTokenPrices = async () => {
    setLoadingPrices(true);
    try {
      const uniqueTokens = [...new Set(allTokens.map(t => t.symbol))].map(symbol => ({
        symbol,
        network: allTokens.find(t => t.symbol === symbol)?.network,
      }));

      const prices = await fetchTokenPrices(uniqueTokens);
      setTokenPrices(prices);
      console.log("[Dashboard] Fetched prices for", Object.keys(prices).length, "tokens");
    } catch (error) {
      console.error("[Dashboard] Failed to fetch token prices:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Calculate USD value for a token
  const getUSDValue = (symbol: string, balance: string): number => {
    const price = tokenPrices[symbol.toUpperCase()];
    if (!price) return 0;
    return parseFloat(balance) * price;
  };

  // Calculate total portfolio value
  const totalPortfolioValue = allTokens.reduce((sum, token) => {
    return sum + getUSDValue(token.symbol, token.balance);
  }, 0);

  // Calculate deployed capital (for now, assume 0 in LP positions)
  const deployedCapital = 0;

  // Calculate idle capital
  const idleCapital = totalPortfolioValue;

  const anyWalletConnected = mounted && (isConnected || connectedWallets.length > 0);

  const wallet = useAppStore((state) => state.wallet);
  const portfolio = useAppStore((state) => state.portfolio);
  const positions = useAppStore((state) => state.positions);
  const router = useRouter();
  const { toast } = useToast();
  const { wallet: walletContext } = useWallet();

  const [botRunning, setBotRunning] = useState(false);
  const [botStarting, setBotStarting] = useState(false);
  const [botStopping, setBotStopping] = useState(false);

  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    deployedCapital: 0,
    idleCapital: 0,
    netApy: 0,
    dailyEarnings: 0 as number | { realized: number; projected: number },
    monthlyEarnings: 0 as number | { realized: number; projected: number },
    realizedEarnings: 0,
    projected30Day: 0,
  });

  const [modeErrors, setModeErrors] = useState<string[]>([]);

  // Check bot status on mount
  useEffect(() => {
    const checkBotStatus = async () => {
      await botOrchestrationService.loadBotStatus();
      const status = botOrchestrationService.getStatus();
      setBotRunning(status.isRunning);
    };
    checkBotStatus();
  }, []);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Dashboard] Mode changed, updating portfolio view");
      }
    });
    return () => unsubscribe();
  }, []);

  // CRITICAL: Validate mode data integrity
  useEffect(() => {
    if (mode.current === "live") {
      const validation = assertNoSimulatedDataInLiveMode();
      setModeErrors(validation.errors);
      
      if (!validation.valid) {
        console.error("[Dashboard] Live mode data validation failed:", validation.errors);
      }
    } else {
      setModeErrors([]);
    }
  }, [mode.current, wallet, portfolio, positions]);

  // Handle start bot
  const handleStartBot = async () => {
    setBotStarting(true);
    try {
      const config: BotConfig = {
        mode: mode.current,
        checkIntervalMs: 60000, // Check every 60 seconds
        autoHarvest: true,
        autoCompound: true,
        autoRebalance: true,
      };

      const success = await botOrchestrationService.startBot(config);

      if (success) {
        setBotRunning(true);
        toast({
          title: "Bot Started",
          description: `Automation engine is now running in ${mode.current} mode. The bot will check for opportunities every minute.`,
        });
      } else {
        toast({
          title: "Failed to Start Bot",
          description: "The bot is already running or failed to start. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Dashboard] Failed to start bot:", error);
      toast({
        title: "Start Failed",
        description: "Failed to start automation bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBotStarting(false);
    }
  };

  // Handle stop bot
  const handleStopBot = async () => {
    setBotStopping(true);
    try {
      const success = await botOrchestrationService.stopBot();

      if (success) {
        setBotRunning(false);
        toast({
          title: "Bot Stopped",
          description: "Automation engine has been stopped. No further actions will be executed.",
        });
      } else {
        toast({
          title: "Failed to Stop Bot",
          description: "The bot is not running or failed to stop. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Dashboard] Failed to stop bot:", error);
      toast({
        title: "Stop Failed",
        description: "Failed to stop automation bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBotStopping(false);
    }
  };

  // Update portfolio data based on mode
  useEffect(() => {
    if (mode.current === "shadow") {
      // Shadow mode - real wallet data (read-only)
      if (wallet.wallet) {
        // CRITICAL: Only use real detected assets
        const realAssets = wallet.assets.filter((a: any) => a.source === "detected");
        const totalValue = realAssets.reduce(
          (sum, asset) => sum + (parseFloat(asset.balance) || 0) * (asset.priceUsd || 0),
          0
        );

        setPortfolioData({
          totalValue,
          deployedCapital: 0,
          idleCapital: totalValue,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      } else {
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      }
    } else if (mode.current === "live") {
      // Live mode - real data from portfolio
      // CRITICAL: Use mode-specific portfolio data
      const livePortfolio = getPortfolioForMode("live");
      
      if (livePortfolio) {
        setPortfolioData({
          totalValue: livePortfolio.totalValue || 0,
          deployedCapital: livePortfolio.deployedCapital || 0,
          idleCapital: livePortfolio.idleCapital || 0,
          netApy: livePortfolio.netApy || 0,
          dailyEarnings: livePortfolio.dailyEarnings || 0,
          monthlyEarnings: livePortfolio.monthlyEarnings || 0,
          realizedEarnings: livePortfolio.realizedEarnings || 0,
          projected30Day: livePortfolio.projected30Day || 0,
        });
      } else {
        // No live portfolio data available yet
        setPortfolioData({
          totalValue: 0,
          deployedCapital: 0,
          idleCapital: 0,
          netApy: 0,
          dailyEarnings: 0,
          monthlyEarnings: 0,
          realizedEarnings: 0,
          projected30Day: 0,
        });
      }
    }
  }, [mode.current, wallet.wallet, wallet.assets, portfolio]);

  const getPageTitle = () => {
    switch (mode.current) {
      case "shadow":
        return "Dashboard";
      case "live":
        return "Dashboard";
    }
  };

  const getModeLabel = () => {
    switch (mode.current) {
      case "shadow":
        return "Estimated";
      case "live":
        return "Live";
      default:
        return "";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-muted-foreground">Portfolio overview and automation status</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            {!botRunning && (
              <Button 
                onClick={handleStartBot} 
                variant="default"
                disabled={botStarting}
              >
                <Play className="mr-2 h-4 w-4" />
                {botStarting ? "Starting..." : "Start Bot"}
              </Button>
            )}
            {botRunning && (
              <Button 
                onClick={handleStopBot} 
                variant="destructive"
                disabled={botStopping}
              >
                <Square className="mr-2 h-4 w-4" />
                {botStopping ? "Stopping..." : "Stop Bot"}
              </Button>
            )}
            {botRunning && (
              <Badge variant="default" className="bg-emerald-500 animate-pulse">
                Bot Running
              </Badge>
            )}
          </div>
        </div>

        {/* Mode Banner */}
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <strong>{mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}:</strong>{" "}
            {mode.current === "shadow"
              ? "Read-only wallet connection. Recommendations shown but nothing is executed. Review mode only."
              : "Real blockchain execution. Policy rules are enforced. Emergency pause available."}
          </AlertDescription>
        </Alert>

        {/* CRITICAL: Live mode data integrity warning */}
        {mode.current === "live" && modeErrors.length > 0 && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong className="text-red-500">Live Mode Data Integrity Error:</strong>
              <ul className="mt-2 ml-4 list-disc text-sm">
                {modeErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Live mode must use only real detected assets and positions. No simulated or manual data is allowed.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Portfolio Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Portfolio Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {mounted && totalPortfolioValue > 0 ? (
                  `$${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  "$0.00"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {loadingPrices ? "Loading..." : "Total assets value"}
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Deployed Capital
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {mounted && deployedCapital > 0 ? (
                  `$${deployedCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  "$0.00"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Active in LP positions
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idle Capital</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {mounted && idleCapital > 0 ? (
                  `$${idleCapital.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                  "$0.00"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Available to deploy
              </p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net APY</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.00%</div>
              <p className="text-xs text-muted-foreground">
                Expected annual return
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Dashboard Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          <ExecutionMonitor />
          <PerformanceMonitorWidget />
          <ActivePositions />
          <RecentAlerts />
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle>Network Balances</CardTitle>
              <p className="text-sm text-muted-foreground">
                Assets grouped by blockchain
              </p>
            </CardHeader>
            <CardContent>
              {mounted && anyWalletConnected ? (
                <div className="space-y-4">
                  {(() => {
                    // Group tokens by network
                    const networkGroups = allTokens.reduce((acc, token) => {
                      const network = token.network;
                      if (!acc[network]) {
                        acc[network] = [];
                      }
                      acc[network].push(token);
                      return acc;
                    }, {} as Record<string, typeof allTokens>);

                    return Object.entries(networkGroups).map(([network, tokens]) => {
                      const networkValue = tokens.reduce((sum, token) => 
                        sum + getUSDValue(token.symbol, token.balance), 0
                      );

                      return (
                        <div key={network} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{network}</Badge>
                              <span className="text-sm font-medium">
                                {tokens.length} asset(s)
                              </span>
                            </div>
                            <span className="text-sm font-bold text-success">
                              ${networkValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="space-y-1 ml-4">
                            {tokens.slice(0, 3).map((token, idx) => {
                              const value = getUSDValue(token.symbol, token.balance);
                              return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {parseFloat(token.balance).toFixed(4)} {token.symbol}
                                  </span>
                                  {value > 0 && (
                                    <span className="text-success">
                                      ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {tokens.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{tokens.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Connect your wallet to view network balances
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          {/* Connected Wallets */}
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle>Connected Wallets</CardTitle>
              <p className="text-sm text-muted-foreground">
                Active wallet connections
              </p>
            </CardHeader>
            <CardContent>
              {mounted && anyWalletConnected ? (
                <div className="space-y-3" suppressHydrationWarning>
                  {isConnected && address && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                      <div>
                        <Badge variant="outline" className="mb-1">EVM</Badge>
                        <p className="font-mono text-sm">
                          {address.slice(0, 10)}...{address.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {detectedAssets.length} asset(s)
                        </p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  )}
                  {connectedWallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {wallet.type.toUpperCase()}
                        </Badge>
                        <p className="font-mono text-sm">
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {wallet.tokens?.length || 0} asset(s)
                        </p>
                      </div>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    No wallets connected. Click "Connect Wallet" in the header to
                    get started.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}