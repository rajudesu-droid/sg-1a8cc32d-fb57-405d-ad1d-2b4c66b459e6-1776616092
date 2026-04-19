import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { getAssetDisplayName, groupAssetsBySymbol } from "@/core/utils/assetIdentity";

export function NetworkBalances() {
  const wallet = useAppStore((state) => state.wallet);
  const mode = useAppStore((state) => state.mode);

  // Group assets by network
  const assetsByNetwork = wallet.assets.reduce((acc, asset) => {
    const network = asset.network || "unknown";
    if (!acc[network]) {
      acc[network] = [];
    }
    acc[network].push(asset);
    return acc;
  }, {} as Record<string, typeof wallet.assets>);

  const networkList = Object.keys(assetsByNetwork);

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Network Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {networkList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {mode.current === "demo" 
              ? "Add assets to your demo portfolio to see network balances"
              : "Connect wallet to see network balances"}
          </div>
        ) : (
          <div className="space-y-4">
            {networkList.map(network => {
              const networkAssets = assetsByNetwork[network];
              const networkValue = networkAssets.reduce(
                (sum, asset) => sum + (asset.valueUsd || 0),
                0
              );

              return (
                <div key={network} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold capitalize">{network}</div>
                    <Badge variant="outline">
                      ${networkValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {networkAssets.map(asset => {
                      // CRITICAL: Show full asset identity, not just symbol
                      const displayName = getAssetDisplayName(asset);
                      
                      return (
                        <div 
                          key={asset.id}  // Use unique asset ID
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                              {asset.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{asset.symbol}</div>
                              {asset.contractAddress && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {asset.contractAddress.slice(0, 6)}...{asset.contractAddress.slice(-4)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono">
                              {parseFloat(asset.balance).toFixed(4)}
                            </div>
                            {asset.valueUsd !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                ${asset.valueUsd.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}