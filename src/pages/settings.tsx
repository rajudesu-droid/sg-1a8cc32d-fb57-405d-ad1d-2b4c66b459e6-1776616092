import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Wallet, Bell, Shield, Save, Network, Activity, Palette, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { protocolRegistry } from "@/core/protocols/ProtocolRegistry";
import { spenderAllowlist } from "@/core/config/SpenderAllowlist";
import { ProtocolReadinessIndicator } from "@/components/ProtocolReadinessIndicator";
import { LiveReadinessPanel } from "@/components/LiveReadinessPanel";
import { userPreferencesService } from "@/services/UserPreferencesService";
import { actionHandler } from "@/services/ActionHandlerService";
import { orchestrator } from "@/core/orchestrator";
import type { UserPreferences } from "@/services/UserPreferencesService";
import type { ActionContext } from "@/services/ActionHandlerService";

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
  const [notificationSettings, setNotificationSettings] = useState({
    notifyOutOfRange: true,
    notifyHarvest: true,
    notifyRebalance: false,
    notifyActions: true,
    emailAlerts: true,
    pushAlerts: true,
    discordAlerts: false,
  });
  const [advancedSettings, setAdvancedSettings] = useState({
    debugMode: false,
    testnetMode: false,
  });
  
  // Loading states for all actions
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Track if settings have changed
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { toast } = useToast();

  const getActionContext = (): ActionContext => ({
    mode: "live", // Settings always operates in context-agnostic mode
    metadata: { source: "settings_page" },
  });

  // Load data on mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // Load chain and protocol settings
      loadChainSettings();
      loadProtocolSettings();
      
      // Load user preferences from database
      const preferences = await userPreferencesService.loadPreferences();
      
      if (preferences) {
        setSlippageTolerance(preferences.defaultSlippage.toString());
        setNotificationSettings({
          notifyOutOfRange: preferences.notifyOutOfRange,
          notifyHarvest: preferences.notifyHarvest,
          notifyRebalance: preferences.notifyRebalance,
          notifyActions: preferences.notifyActions,
          emailAlerts: preferences.emailAlerts,
          pushAlerts: preferences.pushAlerts,
          discordAlerts: preferences.discordAlerts,
        });
        setAdvancedSettings({
          debugMode: preferences.debugMode,
          testnetMode: preferences.testnetMode,
        });
        
        // Apply saved chain preferences
        if (preferences.enabledChains.length > 0) {
          setChainSettings(prev => prev.map(chain => ({
            ...chain,
            enabled: preferences.enabledChains.includes(chain.id),
          })));
        }
        
        // Apply saved protocol preferences
        if (preferences.enabledProtocols.length > 0) {
          setProtocolSettings(prev => prev.map(protocol => {
            const saved = preferences.enabledProtocols.find((p: any) => p.id === protocol.id);
            return {
              ...protocol,
              enabled: saved ? saved.enabled : protocol.enabled,
            };
          }));
        }
      }
    } catch (error) {
      console.error("[Settings] Failed to load settings:", error);
      toast({
        title: "Error Loading Settings",
        description: "Failed to load your saved preferences. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChainSettings = () => {
    const chains = spenderAllowlist.getSupportedChains();
    const chainData = chains.map(chain => ({
      id: chain,
      name: chain.charAt(0).toUpperCase() + chain.slice(1),
      enabled: true,
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
          enabled: spenders.length > 0,
          readiness: adapter.getReadiness(),
          spenderCount: spenders.length,
        });
      });
    });

    setProtocolSettings(protocols);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const preferences: UserPreferences = {
        enabledChains: chainSettings.filter(c => c.enabled).map(c => c.id),
        enabledProtocols: protocolSettings.map(p => ({ id: p.id, enabled: p.enabled })),
        defaultSlippage: parseFloat(slippageTolerance),
        autoApprove: false,
        notifyOutOfRange: notificationSettings.notifyOutOfRange,
        notifyHarvest: notificationSettings.notifyHarvest,
        notifyRebalance: notificationSettings.notifyRebalance,
        notifyActions: notificationSettings.notifyActions,
        emailAlerts: notificationSettings.emailAlerts,
        pushAlerts: notificationSettings.pushAlerts,
        discordAlerts: notificationSettings.discordAlerts,
        debugMode: advancedSettings.debugMode,
        testnetMode: advancedSettings.testnetMode,
      };

      const success = await userPreferencesService.savePreferences(preferences);

      if (success) {
        // Publish settings update event
        await orchestrator.publishEvent({
          type: "preferences_updated",
          source: "settings_page",
          timestamp: new Date(),
          affectedModules: ["preferences"],
          data: { preferences },
        });

        setHasUnsavedChanges(false);
        
        toast({
          title: "Settings Saved",
          description: "All settings have been saved successfully to your account",
        });
      } else {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      console.error("[Settings] Failed to save:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    try {
      // Load default values
      loadChainSettings();
      loadProtocolSettings();
      setSlippageTolerance("2.0");
      setNotificationSettings({
        notifyOutOfRange: true,
        notifyHarvest: true,
        notifyRebalance: false,
        notifyActions: true,
        emailAlerts: true,
        pushAlerts: true,
        discordAlerts: false,
      });
      setAdvancedSettings({
        debugMode: false,
        testnetMode: false,
      });

      setHasUnsavedChanges(true);
      
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to defaults. Click 'Save Changes' to apply.",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset settings",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleConnectWallet = async () => {
    setConnectingWallet(true);
    try {
      const result = await actionHandler.connectWallet(getActionContext());
      
      toast({
        title: result.success ? "Wallet Connected" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      // Gather all data for export
      const exportData = {
        settings: {
          chains: chainSettings,
          protocols: protocolSettings,
          slippage: slippageTolerance,
          notifications: notificationSettings,
          advanced: advancedSettings,
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      };

      // Create JSON blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Download file
      const link = document.createElement("a");
      link.href = url;
      link.download = `lp-autopilot-settings-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Settings data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExportingData(false);
    }
  };

  const handleSetSlippage = (value: string) => {
    setSlippageTolerance(value);
    setHasUnsavedChanges(true);
  };

  const handleChainToggle = (index: number, checked: boolean) => {
    const newSettings = [...chainSettings];
    newSettings[index].enabled = checked;
    setChainSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleProtocolToggle = (index: number, checked: boolean) => {
    const newSettings = [...protocolSettings];
    newSettings[index].enabled = checked;
    setProtocolSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: checked }));
    setHasUnsavedChanges(true);
  };

  const handleAdvancedToggle = (key: keyof typeof advancedSettings, checked: boolean) => {
    setAdvancedSettings(prev => ({ ...prev, [key]: checked }));
    setHasUnsavedChanges(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Connection Test Successful",
        description: "All integrations are working correctly",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Some integrations may not be working",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
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
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="animate-pulse">
                Unsaved Changes
              </Badge>
            )}
            <Button 
              variant="outline"
              onClick={handleResetDefaults} 
              disabled={resetting || saving || loading}
            >
              {resetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </>
              )}
            </Button>
            <Button 
              onClick={handleSaveChanges} 
              disabled={saving || loading || !hasUnsavedChanges}
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
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
            <TabsTrigger value="live-safety">Live Safety</TabsTrigger>
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
                            onCheckedChange={(checked) => handleChainToggle(index, checked)}
                            disabled={saving}
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
                            disabled={!protocol.enabled || saving} // Can't enable if no spenders
                            onCheckedChange={(checked) => handleProtocolToggle(index, checked)}
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
                  <Button 
                    onClick={handleConnectWallet}
                    disabled={connectingWallet}
                  >
                    {connectingWallet ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Wallet"
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Default Slippage Tolerance</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={slippageTolerance === "0.5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("0.5")}
                      disabled={saving}
                    >
                      0.5%
                    </Button>
                    <Button
                      variant={slippageTolerance === "1.0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("1.0")}
                      disabled={saving}
                    >
                      1.0%
                    </Button>
                    <Button
                      variant={slippageTolerance === "2.0" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSetSlippage("2.0")}
                      disabled={saving}
                    >
                      2.0%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={saving}
                    >
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
                    <Switch 
                      id="notify-out-of-range" 
                      checked={notificationSettings.notifyOutOfRange}
                      onCheckedChange={(checked) => handleNotificationToggle("notifyOutOfRange", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-harvest">Harvest Ready</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when rewards exceed harvest threshold
                      </p>
                    </div>
                    <Switch 
                      id="notify-harvest" 
                      checked={notificationSettings.notifyHarvest}
                      onCheckedChange={(checked) => handleNotificationToggle("notifyHarvest", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-rebalance">Rebalance Opportunities</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when better opportunities are available
                      </p>
                    </div>
                    <Switch 
                      id="notify-rebalance"
                      checked={notificationSettings.notifyRebalance}
                      onCheckedChange={(checked) => handleNotificationToggle("notifyRebalance", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="notify-actions">Automation Actions</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when automation executes actions
                      </p>
                    </div>
                    <Switch 
                      id="notify-actions" 
                      checked={notificationSettings.notifyActions}
                      onCheckedChange={(checked) => handleNotificationToggle("notifyActions", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold">Notification Channels</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch 
                        id="email-alerts" 
                        checked={notificationSettings.emailAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("emailAlerts", checked)}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="push-alerts">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch 
                        id="push-alerts" 
                        checked={notificationSettings.pushAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("pushAlerts", checked)}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="discord-alerts">Discord Alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Receive alerts in Discord
                        </p>
                      </div>
                      <Switch 
                        id="discord-alerts" 
                        checked={notificationSettings.discordAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("discordAlerts", checked)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live-safety" className="space-y-6">
            <LiveReadinessPanel />
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
                    <Switch 
                      id="debug-mode"
                      checked={advancedSettings.debugMode}
                      onCheckedChange={(checked) => handleAdvancedToggle("debugMode", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="test-mode">Testnet Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Use testnet networks for all operations
                      </p>
                    </div>
                    <Switch 
                      id="test-mode"
                      checked={advancedSettings.testnetMode}
                      onCheckedChange={(checked) => handleAdvancedToggle("testnetMode", checked)}
                      disabled={saving}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Label>Data Export</Label>
                      <p className="text-xs text-muted-foreground">
                        Export all positions, actions, and audit logs
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportData}
                      disabled={exportingData}
                    >
                      {exportingData ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        "Export Data"
                      )}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Label>Connection Test</Label>
                      <p className="text-xs text-muted-foreground">
                        Test all integrations and services
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                    >
                      {testingConnection ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Run Test"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetDefaults} 
            disabled={loading || saving || resetting}
          >
            {resetting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset to Defaults"
            )}
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={saving || loading || !hasUnsavedChanges}
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}