import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, Shield, Network, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { protocolRegistry } from "@/core/protocols/ProtocolRegistry";
import { useAppStore } from "@/store";
import { orchestrator } from "@/core/orchestrator";

export default function Admin() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const mode = useAppStore((state) => state.mode);

  // Initialize state from protocol registry
  const [protocols, setProtocols] = useState(
    protocolRegistry.getAllProtocols().map(p => ({ ...p }))
  );
  
  const [chains, setChains] = useState(
    protocolRegistry.getAllChains().map(c => ({ ...c }))
  );

  const handleProtocolToggle = (protocolName: string, field: "enabled" | "whitelisted") => {
    setProtocols(protocols.map(p => {
      if (p.name === protocolName) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
    setHasChanges(true);
  };

  const handleChainToggle = (chainName: string, field: "enabled" | "whitelisted") => {
    setChains(chains.map(c => {
      if (c.name === chainName) {
        return { ...c, [field]: !c[field] };
      }
      return c;
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would persist to the backend
    toast({
      title: "Admin Settings Saved",
      description: "Protocol and chain configurations updated successfully",
    });
    setHasChanges(false);
    
    // Trigger a re-sync
    orchestrator.coordinateUpdate(
      "admin",
      "settings_changed",
      { protocols, chains },
      ["opportunities-page", "dashboard"]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Protocol Management</h1>
            <p className="text-muted-foreground">Manage whitelists, configure protocols, and set global risk limits</p>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Whitelisted DEXs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{protocols.filter(p => p.whitelisted).length}</div>
              <p className="text-xs text-muted-foreground">Approved protocols</p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{protocols.filter(p => p.enabled).length}</div>
              <p className="text-xs text-muted-foreground">Currently scanning</p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supported Chains</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chains.filter(c => c.enabled).length}</div>
              <p className="text-xs text-muted-foreground">Active networks</p>
            </CardContent>
          </Card>
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Controls</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">Strict</div>
              <p className="text-xs text-muted-foreground">Global policy enforcement</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="protocols" className="space-y-4">
          <TabsList className="bg-background/50 border border-border/50">
            <TabsTrigger value="protocols">DEX & Protocols</TabsTrigger>
            <TabsTrigger value="chains">Chain Support</TabsTrigger>
            <TabsTrigger value="limits">Global Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="space-y-4">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Protocol Registry</CardTitle>
                <CardDescription>
                  Enable or disable scanning and execution for specific DEXs. 
                  Protocols must be whitelisted before they can be enabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {protocols.map((protocol) => (
                  <div key={protocol.name} className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{protocol.name}</span>
                        {protocol.whitelisted && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Whitelisted</Badge>}
                        {!protocol.whitelisted && <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Unverified</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {protocol.chains.map(chain => (
                          <Badge key={chain} variant="secondary" className="text-[10px] uppercase">
                            {chain}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Adapter: {protocol.adapterClass}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`whitelist-${protocol.name}`} className="text-xs">Whitelist</Label>
                        <Switch 
                          id={`whitelist-${protocol.name}`}
                          checked={protocol.whitelisted}
                          onCheckedChange={() => handleProtocolToggle(protocol.name, "whitelisted")}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`enable-${protocol.name}`} className="text-xs">Active</Label>
                        <Switch 
                          id={`enable-${protocol.name}`}
                          checked={protocol.enabled}
                          disabled={!protocol.whitelisted}
                          onCheckedChange={() => handleProtocolToggle(protocol.name, "enabled")}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chains" className="space-y-4">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Network Management</CardTitle>
                <CardDescription>
                  Configure which blockchain networks the system is allowed to interact with.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {chains.map((chain) => (
                  <div key={chain.name} className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-border/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize text-lg">{chain.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">RPC Endpoint: {chain.rpcUrl}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`chain-enable-${chain.name}`} className="text-xs">Active</Label>
                        <Switch 
                          id={`chain-enable-${chain.name}`}
                          checked={chain.enabled}
                          onCheckedChange={() => handleChainToggle(chain.name, "enabled")}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <CardTitle>Global Risk Limits</CardTitle>
                <CardDescription>
                  Set strict maximum exposure limits across protocols and chains.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Max Capital Per Protocol (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" defaultValue="50000" className="pl-9" onChange={() => setHasChanges(true)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Hard cap for exposure to any single DEX</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Capital Per Chain (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" defaultValue="100000" className="pl-9" onChange={() => setHasChanges(true)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Hard cap for exposure to any single network</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Global TVL Minimum (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" defaultValue="1000000" className="pl-9" onChange={() => setHasChanges(true)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Ignore pools with liquidity below this amount</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Allowable Slippage (%)</Label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="number" defaultValue="1.5" step="0.1" className="pl-9" onChange={() => setHasChanges(true)} />
                    </div>
                    <p className="text-xs text-muted-foreground">System-wide hard limit for entry/exit slippage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}