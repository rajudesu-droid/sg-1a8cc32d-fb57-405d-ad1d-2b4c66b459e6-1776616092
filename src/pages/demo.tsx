import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Download, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store";
import { ModeBanner } from "@/components/ModeBanner";
import { orchestrator } from "@/core/orchestrator";

const mockAssets = [
  {
    id: "1",
    symbol: "ETH",
    name: "Ethereum",
    chainFamily: "evm",
    network: "Ethereum",
    assetKind: "native",
    quantity: "5.24",
    price: "$1,952.40",
    value: "$10,226.58",
  },
  {
    id: "2",
    symbol: "USDC",
    name: "USD Coin",
    chainFamily: "evm",
    network: "Ethereum",
    assetKind: "token",
    contractAddress: "0xa0b86991...",
    quantity: "12,400.00",
    price: "$1.00",
    value: "$12,400.00",
  },
  {
    id: "3",
    symbol: "BNB",
    name: "BNB",
    chainFamily: "evm",
    network: "BSC",
    assetKind: "native",
    quantity: "18.5",
    price: "$295.10",
    value: "$5,459.35",
  },
];

const mockLedger = [
  {
    id: "1",
    timestamp: "2026-04-18 14:32:15",
    action: "Add Asset",
    description: "Added 5.24 ETH to portfolio",
    status: "completed",
  },
  {
    id: "2",
    timestamp: "2026-04-18 14:35:42",
    action: "Deploy LP",
    description: "Deployed ETH/USDC position on Uniswap V3",
    status: "completed",
  },
  {
    id: "3",
    timestamp: "2026-04-18 15:10:28",
    action: "Harvest Rewards",
    description: "Harvested 124.30 USDC in fees",
    status: "completed",
  },
  {
    id: "4",
    timestamp: "2026-04-18 15:45:13",
    action: "Compound",
    description: "Compounded rewards into ETH/USDC position",
    status: "completed",
  },
];

export default function DemoPortfolio() {
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const mode = useAppStore((state) => state.mode);

  // Listen for mode changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((event) => {
      if (event.type === "mode_changed") {
        console.log("[Demo] Mode changed");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddAsset = () => {
    setShowAddAsset(false);
    toast({
      title: "Asset Added",
      description: "New asset has been added to demo portfolio",
    });
  };

  const handleEditAsset = (assetId: string) => {
    toast({
      title: "Editing Asset",
      description: `Opening editor for asset ${assetId}`,
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    toast({
      title: "Asset Deleted",
      description: "Asset has been removed from demo portfolio",
      variant: "destructive",
    });
  };

  const handleImportSample = () => {
    toast({
      title: "Importing Sample Portfolio",
      description: "Loading pre-built demo portfolio with sample assets",
    });
  };

  const handleResetSimulation = () => {
    toast({
      title: "Simulation Reset",
      description: "All assets and simulation history have been cleared",
      variant: "destructive",
    });
  };

  const handleBrowseSamples = () => {
    toast({
      title: "Browse Sample Portfolios",
      description: "Opening sample portfolio library",
    });
  };

  const getPageTitle = () => {
    switch (mode.current) {
      case "demo": return "Demo Portfolio";
      case "shadow": return "Shadow Portfolio (Read-Only)";
      case "live": return "Live Portfolio";
    }
  };

  const getPageDescription = () => {
    switch (mode.current) {
      case "demo": return "Manual asset management and simulation ledger";
      case "shadow": return "View wallet assets in read-only mode";
      case "live": return "Real wallet balances and transaction history";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-1">
              {getPageDescription()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAddAsset(true)} 
              className="gap-2"
              disabled={mode.current !== "demo"}
            >
              <Plus className="h-4 w-4" />
              {mode.current === "demo" ? "Add Asset" : "Demo Mode Only"}
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleImportSample}
              disabled={mode.current !== "demo"}
            >
              <Download className="h-4 w-4" />
              Import Sample Portfolio
            </Button>
            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={handleResetSimulation}
              disabled={mode.current !== "demo"}
            >
              <RefreshCw className="h-4 w-4" />
              Reset Simulation
            </Button>
          </div>
        </div>

        {/* Mode Banner */}
        <ModeBanner />

        {/* Demo Mode Warning */}
        {mode.current !== "demo" && (
          <Card className="card-gradient border-accent/20 border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <p className="font-semibold">Demo Portfolio is only available in Demo Mode</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mode.current === "shadow" 
                      ? "Switch to Demo Mode to manually manage simulated assets."
                      : "Switch to Demo Mode to use the simulation portfolio."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle>Asset Balances</CardTitle>
            <CardDescription>
              Manually managed assets for simulation testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {asset.network}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {asset.assetKind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{asset.quantity}</TableCell>
                    <TableCell className="text-right font-mono">{asset.price}</TableCell>
                    <TableCell className="text-right font-semibold">{asset.value}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditAsset(asset.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {mockAssets.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No assets in demo portfolio. Click "Add Asset" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle>Simulation Ledger</CardTitle>
            <CardDescription>
              Chronological log of all simulated actions and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-lg border border-border/30 bg-card/30 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {entry.action}
                      </Badge>
                      <Badge
                        variant={entry.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {entry.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {mockLedger.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No simulation actions yet. Actions will appear here as you interact with the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient border-primary/20 border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Import Sample Portfolio</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Load pre-built demo portfolios to test platform features
                  </p>
                </div>
                <Button variant="outline" onClick={handleBrowseSamples}>
                  Browse Samples
                </Button>
              </div>

              <Separator />

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Reset Simulation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clear all assets and simulation history
                  </p>
                </div>
                <Button variant="destructive" onClick={handleResetSimulation}>
                  Reset All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Asset to Demo Portfolio</DialogTitle>
              <DialogDescription>
                Manually add assets with custom balances for simulation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Asset</Label>
                <Input
                  id="search"
                  placeholder="Search by symbol (e.g., USDT, BTC, SOL)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Or enter manually</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chain">Chain Family</Label>
                    <Select>
                      <SelectTrigger id="chain">
                        <SelectValue placeholder="Select chain family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evm">EVM (Ethereum, BSC, Polygon, etc.)</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                        <SelectItem value="tron">TRON</SelectItem>
                        <SelectItem value="bitcoin">Bitcoin</SelectItem>
                        <SelectItem value="xrpl">XRPL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
                    <Select>
                      <SelectTrigger id="network">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="bsc">BSC</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="avalanche">Avalanche</SelectItem>
                        <SelectItem value="solana">Solana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset-kind">Asset Kind</Label>
                    <Select>
                      <SelectTrigger id="asset-kind">
                        <SelectValue placeholder="Select asset kind" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="native">Native (ETH, BNB, etc.)</SelectItem>
                        <SelectItem value="token">Token (ERC20, SPL, etc.)</SelectItem>
                        <SelectItem value="lp">LP Position</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input id="symbol" placeholder="e.g., USDC" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="e.g., USD Coin" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract">Contract Address (if token)</Label>
                    <Input id="contract" placeholder="0x..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price Override (optional)</Label>
                    <Input id="price" type="number" placeholder="Auto from oracle" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddAsset(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAsset}>
                  Add Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}