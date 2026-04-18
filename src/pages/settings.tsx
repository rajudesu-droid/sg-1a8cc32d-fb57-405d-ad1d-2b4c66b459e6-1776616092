import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Wallet, Bell, Shield } from "lucide-react";

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
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure platform preferences and integrations
          </p>
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
                  {supportedChains.map((chain) => (
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
                        <Switch id={`chain-${chain.id}`} checked={chain.enabled} />
                      </div>
                      {chain.id !== supportedChains[supportedChains.length - 1].id && (
                        <Separator className="mt-4" />
                      )}
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
                  {supportedDexes.map((dex) => (
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
                        <Switch id={`dex-${dex.id}`} checked={dex.enabled} />
                      </div>
                      {dex.id !== supportedDexes[supportedDexes.length - 1].id && (
                        <Separator className="mt-4" />
                      )}
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
                  <Button>Connect Wallet</Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Default Slippage Tolerance</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">0.5%</Button>
                    <Button variant="outline" size="sm">1.0%</Button>
                    <Button variant="default" size="sm">2.0%</Button>
                    <Button variant="outline" size="sm">Custom</Button>
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
                    <Button variant="outline" size="sm">
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline">
            Reset to Defaults
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}