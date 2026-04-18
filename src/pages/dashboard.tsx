import { AppLayout } from "@/components/AppLayout";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { NetworkBalances } from "@/components/dashboard/NetworkBalances";
import { ConnectedWallets } from "@/components/dashboard/ConnectedWallets";
import { useState } from "react";

export default function Dashboard() {
  const [mode] = useState<"demo" | "shadow" | "live">("demo");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Portfolio overview and performance metrics</p>
        </div>

        <PortfolioMetrics mode={mode} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ActivePositions />
            <RecentAlerts />
          </div>
          <div className="space-y-6">
            <NetworkBalances />
            <ConnectedWallets />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}