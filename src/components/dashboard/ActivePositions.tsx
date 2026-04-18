import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, AlertTriangle } from "lucide-react";

const positions = [
  {
    id: "1",
    pair: "ETH/USDC",
    dex: "Uniswap V3",
    chain: "Ethereum",
    feeTier: "0.3%",
    range: "$1,800 - $2,100",
    status: "in-range" as const,
    currentPrice: "$1,952.40",
    deployed: "$8,200.00",
    fees: "$124.30",
    rewards: "$45.80",
    apy: "12.4%",
  },
  {
    id: "2",
    pair: "BNB/BUSD",
    dex: "PancakeSwap V3",
    chain: "BSC",
    feeTier: "0.25%",
    range: "$280 - $320",
    status: "in-range" as const,
    currentPrice: "$295.10",
    deployed: "$5,600.00",
    fees: "$78.20",
    rewards: "$32.50",
    apy: "9.8%",
  },
  {
    id: "3",
    pair: "MATIC/USDC",
    dex: "Uniswap V3",
    chain: "Polygon",
    feeTier: "0.3%",
    range: "$0.75 - $0.95",
    status: "out-of-range" as const,
    currentPrice: "$0.72",
    deployed: "$4,600.00",
    fees: "$52.10",
    rewards: "$18.40",
    apy: "6.2%",
  },
];

export function ActivePositions() {
  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Positions</span>
          <Badge variant="outline" className="font-mono">{positions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => (
            <div 
              key={position.id} 
              className="rounded-lg border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{position.pair}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        position.status === "in-range" 
                          ? "border-success/50 text-success" 
                          : "border-accent/50 text-accent"
                      }`}
                    >
                      {position.status === "in-range" ? "In Range" : "Out of Range"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {position.feeTier}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">DEX / Chain</p>
                      <p className="font-medium">{position.dex} · {position.chain}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Range</p>
                      <p className="font-mono text-xs">{position.range}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Current Price</p>
                      <p className="font-mono text-xs">{position.currentPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Deployed</p>
                      <p className="font-semibold">{position.deployed}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 border-t border-border/30">
                    <div>
                      <p className="text-muted-foreground text-xs">Fees</p>
                      <p className="font-mono text-sm metric-positive">{position.fees}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Rewards</p>
                      <p className="font-mono text-sm metric-positive">{position.rewards}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">APY</p>
                      <p className="font-semibold text-sm">{position.apy}</p>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="ml-4">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}