import { ReactNode } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Search, Layers, Settings, Wallet, LogOut, TrendingUp, FileText } from "lucide-react";
import Link from "next/link";
import { ModeSelector } from "@/components/ModeSelector";
import { WalletButton } from "@/components/WalletButton";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Opportunities", href: "/opportunities", icon: Search },
  { name: "Positions", href: "/positions", icon: Layers },
  { name: "Automation", href: "/automation", icon: TrendingUp },
  { name: "Withdraw", href: "/withdraw", icon: Wallet },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Demo Portfolio", href: "/demo", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-sidebar-foreground">LP Yield Autopilot</h1>
                <p className="text-xs text-muted-foreground">Non-custodial automation</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="border-b border-border bg-card/50 px-6 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <ModeSelector />
                <WalletButton />
              </div>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}