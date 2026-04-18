import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Plus } from "lucide-react";

const connectedWallets = [
  {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    chain: "Ethereum",
    balance: "$14,226.58",
    status: "active",
  },
  {
    address: "0x8a9C4dFe8b9D8962B31e4e16F8321C44d48e246f",
    chain: "BSC",
    balance: "$8,859.35",
    status: "active",
  },
];

export function ConnectedWallets() {
  return (
    <Card className="card-gradient border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallets
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Wallet
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedWallets.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No wallets connected. Demo mode uses simulated balances.
            </p>
            <Button size="sm">Connect Wallet</Button>
          </div>
        ) : (
          connectedWallets.map((wallet) => (
            <div
              key={wallet.address}
              className="rounded-lg border border-border/50 bg-card/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {wallet.chain}
                    </Badge>
                    <Badge
                      variant={wallet.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {wallet.status}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </p>
                  <p className="font-semibold">{wallet.balance}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {connectedWallets.length === 0 && (
          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Demo Mode: Using simulated portfolio. Connect wallet to use Shadow or Live modes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}