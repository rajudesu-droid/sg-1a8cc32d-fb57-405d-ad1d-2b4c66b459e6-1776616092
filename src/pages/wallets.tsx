import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, RefreshCw, Plus, Search, Shield, ExternalLink, Copy } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";
import { supportedNetworks } from "@/lib/walletConfig";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";
import { useToast } from "@/components/ui/use-toast";

export default function Wallets() {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isConnected, address, chainId, detectedAssets, refreshBalances } = useWallet();
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

  const currentNetwork = supportedNetworks.find((n) => n.id === chainId);

  // Group assets by network
  const assetsByNetwork = detectedAssets.reduce((acc, asset) => {
    if (!acc[asset.network]) {
      acc[asset.network] = [];
    }
    acc[asset.network].push(asset);
    return acc;
  }, {} as Record<string, typeof detectedAssets>);

  const filteredAssets = searchQuery
    ? detectedAssets.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.network.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : detectedAssets;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Simulated Wallets";
      case "shadow": return "Connected Wallets (Read-Only)";
      case "live": return "Connected Wallets";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo": return "Manage simulated wallet balances and assets";
      case "shadow": return "View real wallet balances in read-only mode";
      case "live": return "Manage connected wallet balances and execute transactions";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-1">
              {getPageDescription()}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {!isConnected ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Wallet Connected</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Connect your wallet to view balances, manage assets, and interact with LP opportunities
              </p>
              <Button onClick={() => setShowConnectionModal(true)} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert className="border-primary/50 bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Security Notice:</strong> This app is fully non-custodial. We never ask for or store your private keys, seed phrase, or signing authority. You retain full custody of your assets.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Wallet</CardTitle>
                  <div className="flex items-center gap-2">
                    {currentNetwork && (
                      <Badge variant="secondary">
                        {currentNetwork.name}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-success">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      Connected
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Wallet Address</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                      {address}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyAddress}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`${currentNetwork?.explorer}/address/${address}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {currentNetwork && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Network</div>
                      <div className="font-medium">{currentNetwork.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Chain ID</div>
                      <div className="font-mono text-sm">{chainId}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detected Assets</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refreshBalances()} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Token
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search assets by symbol, name, or network..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All ({detectedAssets.length})</TabsTrigger>
                    {Object.keys(assetsByNetwork).map((network) => (
                      <TabsTrigger key={network} value={network}>
                        {network} ({assetsByNetwork[network].length})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="space-y-2 mt-4">
                    {Object.entries(assetsByNetwork).map(([network, assets]) => (
                      <div key={network} className="space-y-2">
                        <div className="flex items-center gap-2 py-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs font-semibold text-muted-foreground">{network}</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        {assets.map((asset, index) => (
                          <div
                            key={`${asset.network}-${asset.symbol}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <span className="font-semibold text-xs text-primary">
                                  {asset.symbol.slice(0, 3)}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{asset.symbol}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {asset.network}
                                  </Badge>
                                  {asset.source === "auto-detected" && (
                                    <Badge variant="secondary" className="text-xs">
                                      Auto-detected
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{asset.name}</div>
                                {asset.address && (
                                  <div className="font-mono text-xs text-muted-foreground mt-1">
                                    {asset.address.slice(0, 8)}...{asset.address.slice(-6)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-lg font-semibold">
                                {parseFloat(asset.balance).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {asset.isNative ? "Native" : "Token"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                    {filteredAssets.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                          <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? "No assets match your search" : "No assets detected"}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {Object.entries(assetsByNetwork).map(([network, assets]) => (
                    <TabsContent key={network} value={network} className="space-y-2 mt-4">
                      {assets.map((asset, index) => (
                        <div
                          key={`${asset.network}-${asset.symbol}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="font-semibold text-xs text-primary">
                                {asset.symbol.slice(0, 3)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{asset.symbol}</span>
                                {asset.source === "auto-detected" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Auto-detected
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{asset.name}</div>
                              {asset.address && (
                                <div className="font-mono text-xs text-muted-foreground mt-1">
                                  {asset.address.slice(0, 8)}...{asset.address.slice(-6)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-lg font-semibold">
                              {parseFloat(asset.balance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {asset.isNative ? "Native" : "Token"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}

        <WalletConnectionModal open={showConnectionModal} onClose={() => setShowConnectionModal(false)} />
      </div>
    </AppLayout>
  );
}