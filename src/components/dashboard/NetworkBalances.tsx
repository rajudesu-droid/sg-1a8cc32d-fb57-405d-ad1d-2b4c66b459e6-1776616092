import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

export function NetworkBalances() {
  const { detectedAssets, isConnected } = useWallet();

  if (!isConnected || detectedAssets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Network Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground text-center">
              {isConnected ? "No assets detected" : "Connect wallet to view balances"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group assets by network and calculate totals
  const networkBalances = detectedAssets.reduce((acc, asset) => {
    if (!acc[asset.network]) {
      acc[asset.network] = {
        network: asset.network,
        assets: [],
        totalValue: 0,
      };
    }
    acc[asset.network].assets.push(asset);
    // Mock USD value calculation (in production, use real price feeds)
    const mockPrice = asset.symbol === "USDT" || asset.symbol === "USDC" ? 1 : 
                      asset.symbol === "ETH" ? 3200 :
                      asset.symbol === "BNB" ? 580 :
                      asset.symbol === "MATIC" ? 0.85 : 0;
    acc[asset.network].totalValue += parseFloat(asset.balance) * mockPrice;
    return acc;
  }, {} as Record<string, { network: string; assets: typeof detectedAssets; totalValue: number }>);

  const totalPortfolio = Object.values(networkBalances).reduce((sum, n) => sum + n.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Network Balances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.values(networkBalances).map((network) => {
          const percentage = ((network.totalValue / totalPortfolio) * 100).toFixed(1);
          return (
            <div key={network.network} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {network.network}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {network.assets.length} {network.assets.length === 1 ? "asset" : "assets"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${network.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">{percentage}%</div>
                </div>
              </div>

              <div className="space-y-1">
                {network.assets.map((asset, idx) => (
                  <div key={`${asset.network}-${asset.symbol}-${idx}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{asset.symbol}</span>
                    </div>
                    <span className="font-mono">
                      {parseFloat(asset.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}