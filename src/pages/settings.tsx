import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Wallet, Bell, Shield, Save, Network, Activity, Palette } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const supportedChains = [
  { id: "ethereum", name: "Ethereum", enabled: true },
  { id: "bsc", name: "BSC", enabled: true },
  { id: "polygon", name: "Polygon", enabled: true },
  { id: "avalanche", name: "Avalanche", enabled: false },
  { id: "solana", name: "Solana", enabled: false },
];

const supportedDexes = [
  { id: "uniswap-v3", name: "Uniswap V3", chain: "Ethereum", enabled: true },
  { id: "pancake-v3", name: "PancakeSwap V3", chain: "BSC", enabled: true },
  { id: "trader-joe", name: "Trader Joe V2", chain: "Avalanche", enabled: false },
  { id: "raydium", name: "Raydium CLMM", chain: "Solana", enabled: false },
];

export default function Settings() {
  const [chainSettings, setChainSettings] = useState(supportedChains);
  const [dexSettings, setDexSettings] = useState(supportedDexes);
  const [slippageTolerance, setSlippageTolerance] = useState("2.0");
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "All settings have been saved successfully",
    });
  };

  const handleResetDefaults = () => {
    setChainSettings(supportedChains);
    setDexSettings(supportedDexes);
    setSlippageTolerance("2.0");
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  const handleConnectWallet = () => {
    toast({
      title: "Connecting Wallet",
      description: "Opening wallet connection modal",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Exporting Data",
      description: "Downloading positions, actions, and audit logs",
    });
  };

  const handleSetSlippage = (value: string) => {
    setSlippageTolerance(value);
    toast({
      title: "Slippage Updated",
      description: `Default slippage set to ${value}%`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure chains, DEXes, notifications, and preferences
            </p>
          </div>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Summary Report */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chains</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supportedChains.filter((c) => c.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">Networks enabled</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active DEXes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {supportedDexes.filter((d) => d.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">Protocols enabled</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[
                  notificationSettings.emailAlerts,
                  notificationSettings.pushAlerts,
                  notificationSettings.discordAlerts,
                ].filter(Boolean).length}
                /3
              </div>
              <p className="text-xs text-muted-foreground">Channels active</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Policy Status</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">ACTIVE</div>
              <p className="text-xs text-muted-foreground">Automation state</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="chains" className="space-y-6">
          <TabsList>
            <TabsTrigger value="chains">Chains & DEXes</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="chains" className="space-y-6">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Supported Chains</CardTitle>
                <CardDescription>
                  Enable or disable specific blockchain networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chainSettings.map((chain, index) => (
                    <div key={chain.id}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor={`chain-${chain.id}`}>{chain.name}</Label>
                          <p className="text-xs text-muted-foreground">
                            {chain.enabled
                              ? "Platform will scan for opportunities"
                              : "Platform will ignore this chain"}
                          </p>
                        </div>
                        <Switch
                          id={`chain-${chain.id}`}
                          checked={chain.enabled}
                          onCheckedChange={(checked) => {
                            const newSettings = [...chainSettings];
                            newSettings[index].enabled = checked;
                            setChainSettings(newSettings);
                          }}
                        />
                      </div>
                      {index !== chainSettings.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Whitelisted DEXes</CardTitle>
                <CardDescription>
                  Only enabled DEXes will be used for LP opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dexSettings.map((dex, index) => (
                    <div key={dex.id}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`dex-${dex.id}`}>{dex.name}</Label>
                            <Badge variant="outline" className="text-xs">
                              {dex.chain}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {dex.enabled ? "Enabled for opportunities" : "Disabled"}
                          </p>
                        </div>
                        <Switch
                          id={`dex-${dex.id}`}
                          checked={dex.enabled}
                          onCheckedChange={(checked) => {
                            const newSettings = [...dexSettings];
                            newSettings[index].enabled = checked;
                            setDexSettings(newSettings);
                          }}
                        />
                      </div>
                      {index !== dexSettings.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </CardTitle>
                <CardDescription>
                  Connect and manage your Web3 wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No wallet connected. Connect a wallet to use Shadow or Live modes.
                  </p>
                  <Button onClick={handleConnectWallet}>Connect Wallet</Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Default Slippage Tolerance</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={slippageTolerance === "0.5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("0.5")}
                    >
                      0.5%
                    </Button>
                    <Button
                      variant={slippageTolerance === "1.0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("1.0")}
                    >
                      1.0%
                    </Button>
                    <Button
                      variant={slippageTolerance === "2.0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("2.0")}
                    >
                      2.0%
                    </Button>
                    <Button variant="outline" size="sm">
                      Custom
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default slippage tolerance for all transactions
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure when and how you receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-out-of-range">Out of Range Alerts</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when positions go out of range
                      </p>
                    </div>
                    <Switch id="notify-out-of-range" defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-harvest">Harvest Ready</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when rewards exceed harvest threshold
                      </p>
                    </div>
                    <Switch id="notify-harvest" defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-rebalance">Rebalance Opportunities</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when better opportunities are available
                      </p>
                    </div>
                    <Switch id="notify-rebalance" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-actions">Automation Actions</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when automation executes actions
                      </p>
                    </div>
                    <Switch id="notify-actions" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Developer and advanced user options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="debug-mode">Debug Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Show detailed logs and diagnostics
                      </p>
                    </div>
                    <Switch id="debug-mode" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="test-mode">Testnet Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Use testnet networks for all operations
                      </p>
                    </div>
                    <Switch id="test-mode" />
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Label>Data Export</Label>
                      <p className="text-xs text-muted-foreground">
                        Export all positions, actions, and audit logs
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportData}>
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleResetDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}