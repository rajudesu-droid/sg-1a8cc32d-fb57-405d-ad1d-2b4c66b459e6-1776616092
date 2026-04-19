import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { useAppStore } from "@/store";
import Link from "next/link";

export function ActivePositions() {
  const positions = useAppStore((state) => state.positions);

  // Show only active positions (not closed)
  const activePositions = positions.filter(p => p.status === "active" || p.status === "out-of-range");

  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Positions</CardTitle>
          <Link href="/positions">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activePositions.length > 0 ? (
          <div className="space-y-3">
            {positions.slice(0, 5).map((position) => (
              <div
                key={position.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold mb-1">{position.pair}</div>
                    <div className="text-sm text-muted-foreground">
                      {position.protocol} · {position.chain}
                    </div>
                  </div>
                  <Badge className={position.inRange ? "bg-emerald-500" : "bg-amber-500"}>
                    {position.inRange ? "In Range" : "Out of Range"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Value</div>
                    <div className="font-mono">${position.currentValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">APY</div>
                    <div className="font-mono text-cyan-400">{position.currentAPY.toFixed(2)}%</div>
                  </div>
                </div>

                {/* Next Planned Action */}
                {!position.inRange && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <Activity className="w-3 h-3" />
                      <span>Next: Rebalance position (pending approval)</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No active positions</p>
            <p className="text-xs text-muted-foreground mb-4">
              Click "Start Bot" to scan for opportunities and open positions
            </p>
            <Link href="/opportunities">
              <Button size="sm" variant="outline">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}