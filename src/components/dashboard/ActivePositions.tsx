import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { useAppStore } from "@/store";
import Link from "next/link";

export function ActivePositions() {
  const positions = useAppStore((state) => state.positions);

  // Show only active positions (not closed)
  const activePositions = positions.filter(p => p.status === "active" || p.status === "out_of_range");

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
            {activePositions.slice(0, 4).map((position) => {
              const isInRange = position.currentPrice >= position.rangeMin && position.currentPrice <= position.rangeMax;
              
              return (
                <div key={position.id} className="rounded-lg border border-border/50 bg-card/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{position.pair}</h4>
                      <Badge variant="outline" className="text-xs">
                        {position.chain}
                      </Badge>
                    </div>
                    <Badge
                      variant={isInRange ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {isInRange ? "In Range" : "Out of Range"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Value</p>
                      <p className="font-semibold">${position.valueUsd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fees</p>
                      <p className="font-semibold metric-positive">
                        ${position.accruedFees.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health</p>
                      <p
                        className={`font-semibold ${
                          position.health >= 80
                            ? "metric-positive"
                            : position.health >= 60
                            ? "text-accent"
                            : "metric-negative"
                        }`}
                      >
                        {position.health}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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