import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Shield, Droplets, ExternalLink } from "lucide-react";

type SortOption = "recommended" | "apy" | "tvl" | "risk";
type RiskFilter = "all" | "low" | "medium" | "high";

const opportunities = [
  {
    id: "1",
    pair: "ETH/USDC",
    token0: "ETH",
    token1: "USDC",
    dex: "Uniswap V3",
    chain: "Ethereum",
    feeTier: "0.3%",
    tvl: "$458.2M",
    volume24h: "$124.5M",
    feeApy: "8.2%",
    rewardApy: "4.6%",
    netApy: "12.8%",
    riskScore: 28,
    riskLevel: "low" as const,
    recommended: true,
  },
  {
    id: "2",
    pair: "BNB/BUSD",
    token0: "BNB",
    token1: "BUSD",
    dex: "PancakeSwap V3",
    chain: "BSC",
    feeTier: "0.25%",
    tvl: "$182.4M",
    volume24h: "$48.2M",
    feeApy: "6.8%",
    rewardApy: "3.2%",
    netApy: "10.0%",
    riskScore: 35,
    riskLevel: "low" as const,
    recommended: true,
  },
  {
    id: "3",
    pair: "AVAX/USDC",
    token0: "AVAX",
    token1: "USDC",
    dex: "Trader Joe V2",
    chain: "Avalanche",
    feeTier: "0.3%",
    tvl: "$94.6M",
    volume24h: "$28.4M",
    feeApy: "12.4%",
    rewardApy: "6.8%",
    netApy: "19.2%",
    riskScore: 52,
    riskLevel: "medium" as const,
    recommended: false,
  },
  {
    id: "4",
    pair: "MATIC/USDC",
    token0: "MATIC",
    token1: "USDC",
    dex: "Uniswap V3",
    chain: "Polygon",
    feeTier: "0.3%",
    tvl: "$64.2M",
    volume24h: "$18.6M",
    feeApy: "9.6%",
    rewardApy: "2.4%",
    netApy: "12.0%",
    riskScore: 42,
    riskLevel: "medium" as const,
    recommended: true,
  },
  {
    id: "5",
    pair: "SOL/USDC",
    token0: "SOL",
    token1: "USDC",
    dex: "Raydium CLMM",
    chain: "Solana",
    feeTier: "0.25%",
    tvl: "$128.4M",
    volume24h: "$52.8M",
    feeApy: "14.2%",
    rewardApy: "8.6%",
    netApy: "22.8%",
    riskScore: 68,
    riskLevel: "high" as const,
    recommended: false,
  },
];

export default function Opportunities() {
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOpportunities = opportunities
    .filter(opp => {
      if (riskFilter !== "all" && opp.riskLevel !== riskFilter) return false;
      if (chainFilter !== "all" && opp.chain !== chainFilter) return false;
      if (searchTerm && !opp.pair.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "recommended") return b.riskScore - a.riskScore;
      if (sortBy === "apy") return parseFloat(b.netApy) - parseFloat(a.netApy);
      if (sortBy === "tvl") return parseFloat(b.tvl.replace(/[$M]/g, "")) - parseFloat(a.tvl.replace(/[$M]/g, ""));
      if (sortBy === "risk") return a.riskScore - b.riskScore;
      return 0;
    });

  const getRiskBadgeColor = (level: string) => {
    if (level === "low") return "border-success/50 text-success bg-success/10";
    if (level === "medium") return "border-accent/50 text-accent bg-accent/10";
    return "border-destructive/50 text-destructive bg-destructive/10";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">LP Opportunities</h1>
          <p className="text-muted-foreground mt-1">Discover and deploy to whitelisted liquidity pools</p>
        </div>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search pairs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={chainFilter} onValueChange={setChainFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                  <SelectItem value="BSC">BSC</SelectItem>
                  <SelectItem value="Polygon">Polygon</SelectItem>
                  <SelectItem value="Avalanche">Avalanche</SelectItem>
                  <SelectItem value="Solana">Solana</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="apy">Highest APY</SelectItem>
                  <SelectItem value="tvl">Highest TVL</SelectItem>
                  <SelectItem value="risk">Lowest Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((opp) => (
            <Card key={opp.id} className="card-gradient border-border/50 transition-all hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{opp.pair}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {opp.dex}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {opp.chain}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {opp.feeTier}
                      </Badge>
                    </div>
                  </div>
                  {opp.recommended && (
                    <Badge className="bg-primary/20 text-primary border-primary/50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Top
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Net APY</p>
                    <p className="text-xl font-semibold metric-positive">{opp.netApy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-mono font-semibold">{opp.riskScore}</p>
                      <Badge variant="outline" className={`text-xs ${getRiskBadgeColor(opp.riskLevel)}`}>
                        {opp.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fee APY</span>
                    <span className="font-mono font-medium">{opp.feeApy}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reward APY</span>
                    <span className="font-mono font-medium">{opp.rewardApy}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">TVL</span>
                    <span className="font-mono font-medium">{opp.tvl}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-mono font-medium">{opp.volume24h}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" size="sm">
                  <Droplets className="h-4 w-4" />
                  Deploy Liquidity
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOpportunities.length === 0 && (
          <Card className="card-gradient border-border/50">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}