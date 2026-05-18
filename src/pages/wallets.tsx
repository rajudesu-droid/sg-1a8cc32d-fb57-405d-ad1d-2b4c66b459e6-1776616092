import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeBanner } from "@/components/ModeBanner";
import { Wallet, Network, DollarSign, RefreshCw, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { actionHandler } from "@/services/ActionHandlerService";

export default function Wallets() {
  const mode = useAppStore((state) => state.mode);
  const wallet = useAppStore((state) => state.wallet);

  const { toast } = useToast();

  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const getActionContext = () => ({
    mode: mode.current,
    metadata: { source: "wallets_page" },
  });

  const handleConnectWallet = async () => {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              Manage your connected wallets and view assets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            
            {!wallet.wallet && (
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
            
            {wallet.wallet && (
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
                {wallet.wallet ? 1 : 0}
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
                ${wallet.totalValueUsd.toLocaleString()}
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
                {wallet.assets.length}
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
                {new Set(wallet.assets.map((a) => a.network)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        <ModeBanner />

        {wallet.wallet && wallet.assets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Wallet Assets</h2>
            <Card className="card-gradient border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {wallet.assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{asset.network}</Badge>
                        <div>
                          <p className="font-semibold">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground">{asset.name || asset.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{asset.balance} {asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">${(asset.valueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}