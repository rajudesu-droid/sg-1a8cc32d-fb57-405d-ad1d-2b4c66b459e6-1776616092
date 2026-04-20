import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Wallet, Bell, Shield, Save, Network, Activity, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { protocolRegistry } from "@/core/protocols/ProtocolRegistry";
import { spenderAllowlist } from "@/core/config/SpenderAllowlist";
import { ProtocolReadinessIndicator } from "@/components/ProtocolReadinessIndicator";

export default function Settings() {
  const [chainSettings, setChainSettings] = useState<Array<{ id: string; name: string; enabled: boolean }>>([]);
  const [protocolSettings, setProtocolSettings] = useState<Array<{
    id: string;
    name: string;
    chain: string;
    enabled: boolean;
    readiness: string;
    spenderCount: number;
  }>>([]);
  const [slippageTolerance, setSlippageTolerance] = useState("2.0");
  const [notificationSettings] = useState({
    emailAlerts: true,
    pushAlerts: true,
    discordAlerts: false,
  });
  const { toast } = useToast();

  // Load real data on mount
  useEffect(() => {
    loadChainSettings();
    loadProtocolSettings();
  }, []);

  const loadChainSettings = () => {
    const chains = spenderAllowlist.getSupportedChains();
    const chainData = chains.map(chain => ({
      id: chain,
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      enabled: true, // All chains in allowlist are enabled
    }));
    setChainSettings(chainData);
  };

  const loadProtocolSettings = () => {
    const adapters = protocolRegistry.getAllAdapters();
    const protocols: Array<{
      id: string;
      name: string;
      chain: string;
      enabled: boolean;
      readiness: string;
      spenderCount: number;
    }> = [];

    adapters.forEach(adapter => {
      adapter.supportedChains.forEach(chain => {
        const spenders = spenderAllowlist.getSpendersForProtocol(adapter.protocolName.toLowerCase().replace(/\s+/g, '-'), chain);
        
        protocols.push({
          id: `${adapter.protocolName}-${chain}`,
          name: adapter.protocolName,
          chain: chain.charAt(0).toUpperCase() + chain.slice(1),
          enabled: spenders.length > 0, // Enabled if has whitelisted spenders
          readiness: adapter.getReadiness(),
          spenderCount: spenders.length,
        });
      });
    });

    setProtocolSettings(protocols);
  };

  const handleSaveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "All settings have been saved successfully",
    });
  };

  const handleResetDefaults = () => {
    loadChainSettings();
    loadProtocolSettings();
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
          <Button onClick={handleSaveChanges}>
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
                {chainSettings.filter((c) => c.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">Networks enabled</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Whitelisted Protocols</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {protocolSettings.filter((d) => d.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">Protocol/chain combos</p>
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
                  Networks with whitelisted spender contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chainSettings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Loading chain configuration...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chainSettings.map((chain, index) => (
                      <div key={chain.id}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`chain-${chain.id}`}>{chain.name}</Label>
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/50">
                                Whitelisted
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Platform can execute on this network
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
                )}
              </CardContent>
            </Card>

            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Whitelisted DEXes & Protocols</CardTitle>
                <CardDescription>
                  Only protocols with whitelisted spender contracts can be used
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocolSettings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Loading protocol configuration...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {protocolSettings.map((protocol, index) => (
                      <div key={protocol.id}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`protocol-${protocol.id}`}>{protocol.name}</Label>
                              <Badge variant="outline" className="text-xs">
                                {protocol.chain}
                              </Badge>
                              <ProtocolReadinessIndicator
                                readiness={protocol.readiness as any}
                                blockingIssues={[]}
                                showLabel={false}
                                size="sm"
                              />
                              {protocol.spenderCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/50">
                                  {protocol.spenderCount} spender{protocol.spenderCount !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {protocol.enabled 
                                ? `${protocol.spenderCount} whitelisted contract${protocol.spenderCount !== 1 ? 's' : ''} on ${protocol.chain}`
                                : "No whitelisted contracts"}
                            </p>
                          </div>
                          <Switch
                            id={`protocol-${protocol.id}`}
                            checked={protocol.enabled}
                            disabled={!protocol.enabled} // Can't enable if no spenders
                            onCheckedChange={(checked) => {
                              const newSettings = [...protocolSettings];
                              newSettings[index].enabled = checked;
                              setProtocolSettings(newSettings);
                            }}
                          />
                        </div>
                        {index !== protocolSettings.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                )}
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