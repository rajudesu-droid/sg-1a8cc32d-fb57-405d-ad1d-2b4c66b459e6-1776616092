import { AppLayout } from "@/components/AppLayout";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { ActivePositions } from "@/components/dashboard/ActivePositions";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { NetworkBalances } from "@/components/dashboard/NetworkBalances";
import { ConnectedWallets } from "@/components/dashboard/ConnectedWallets";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Portfolio overview and active positions</p>
        </div>

        <PortfolioMetrics />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivePositions />
          </div>
          <div className="space-y-6">
            <RecentAlerts />
            <NetworkBalances />
            <ConnectedWallets />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}