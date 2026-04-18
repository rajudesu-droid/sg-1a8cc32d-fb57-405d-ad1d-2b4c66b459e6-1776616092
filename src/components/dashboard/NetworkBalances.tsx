import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const networkBalances = [
  {
    network: "Ethereum",
    totalValue: "$14,226.58",
    percentage: 50.6,
    assets: [
      { symbol: "ETH", quantity: "5.24", value: "$10,226.58" },
      { symbol: "USDC", quantity: "4,000.00", value: "$4,000.00" },
    ],
  },
  {
    network: "BSC",
    totalValue: "$8,859.35",
    percentage: 31.5,
    assets: [
      { symbol: "BNB", quantity: "18.5", value: "$5,459.35" },
      { symbol: "BUSD", quantity: "3,400.00", value: "$3,400.00" },
    ],
  },
  {
    network: "Polygon",
    totalValue: "$5,000.00",
    percentage: 17.8,
    assets: [
      { symbol: "MATIC", quantity: "6,250.00", value: "$4,500.00" },
      { symbol: "USDC", quantity: "500.00", value: "$500.00" },
    ],
  },
];

export function NetworkBalances() {
  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle>Balances by Network</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {networkBalances.map((network) => (
          <div key={network.network} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{network.network}</Badge>
                <span className="text-sm font-semibold">{network.totalValue}</span>
              </div>
              <span className="text-xs text-muted-foreground">{network.percentage}%</span>
            </div>

            <Progress value={network.percentage} className="h-2" />

            <div className="space-y-2 pl-4">
              {network.assets.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{asset.symbol}</span>
                    <span className="font-mono text-xs">{asset.quantity}</span>
                  </div>
                  <span className="font-semibold">{asset.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}