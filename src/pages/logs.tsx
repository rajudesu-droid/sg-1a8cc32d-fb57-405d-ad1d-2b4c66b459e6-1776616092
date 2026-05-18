import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { FileText, Download, Search, Filter, Calendar, TrendingUp, ArrowRight, ExternalLink } from "lucide-react";

type TransactionType = "deploy" | "harvest" | "compound" | "rebalance" | "withdraw" | "add_liquidity" | "remove_liquidity";
type TransactionStatus = "pending" | "success" | "failed";

interface Transaction {
  id: string;
  timestamp: Date;
  type: TransactionType;
  chain: string;
  protocol: string;
  pair?: string;
  amount: number;
  amountUsd: number;
  gas: number;
  gasUsd: number;
  status: TransactionStatus;
  txHash?: string;
  position?: string;
  error?: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    type: "deploy",
    chain: "Ethereum",
    protocol: "Uniswap V3",
    pair: "ETH/USDC",
    amount: 5000,
    amountUsd: 5000,
    gas: 0.003,
    gasUsd: 12.5,
    status: "success",
    txHash: "0x1234...5678",
    position: "pos-001",
  },
  {
    id: "tx-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    type: "harvest",
    chain: "Ethereum",
    protocol: "Uniswap V3",
    pair: "WBTC/ETH",
    amount: 0.05,
    amountUsd: 125.75,
    gas: 0.002,
    gasUsd: 8.3,
    status: "success",
    txHash: "0xabcd...efgh",
    position: "pos-002",
  },
  {
    id: "tx-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    type: "compound",
    chain: "Arbitrum",
    protocol: "Uniswap V3",
    pair: "ARB/USDC",
    amount: 50,
    amountUsd: 50,
    gas: 0.0005,
    gasUsd: 2.1,
    status: "success",
    txHash: "0x9876...4321",
    position: "pos-003",
  },
  {
    id: "tx-4",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    type: "rebalance",
    chain: "Ethereum",
    protocol: "Uniswap V3",
    pair: "ETH/USDT",
    amount: 3000,
    amountUsd: 3000,
    gas: 0.004,
    gasUsd: 16.7,
    status: "failed",
    error: "Slippage tolerance exceeded",
  },
  {
    id: "tx-5",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    type: "add_liquidity",
    chain: "Polygon",
    protocol: "Uniswap V3",
    pair: "MATIC/USDC",
    amount: 2500,
    amountUsd: 2500,
    gas: 0.001,
    gasUsd: 0.8,
    status: "success",
    txHash: "0xdef0...1234",
    position: "pos-004",
  },
];

export default function TransactionLogs() {
  const mode = useAppStore((state) => state.mode);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");
  const [filterChain, setFilterChain] = useState<string>("all");

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      searchQuery === "" ||
      tx.pair?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchesChain = filterChain === "all" || tx.chain === filterChain;

    return matchesSearch && matchesType && matchesStatus && matchesChain;
  });

  // Calculate summary stats
  const totalTransactions = transactions.length;
  const successfulTransactions = transactions.filter((tx) => tx.status === "success").length;
  const totalVolume = transactions
    .filter((tx) => tx.status === "success")
    .reduce((sum, tx) => sum + tx.amountUsd, 0);
  const totalGas = transactions
    .filter((tx) => tx.status === "success")
    .reduce((sum, tx) => sum + tx.gasUsd, 0);

  const getTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      deploy: "Deploy",
      harvest: "Harvest",
      compound: "Compound",
      rebalance: "Rebalance",
      withdraw: "Withdraw",
      add_liquidity: "Add Liquidity",
      remove_liquidity: "Remove Liquidity",
    };
    return labels[type];
  };

  const getTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      deploy: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
      harvest: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      compound: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      rebalance: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      withdraw: "bg-amber-500/20 text-amber-400 border-amber-500/50",
      add_liquidity: "bg-green-500/20 text-green-400 border-green-500/50",
      remove_liquidity: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return colors[type];
  };

  const getStatusBadge = (status: TransactionStatus) => {
    if (status === "success") {
      return <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Success</Badge>;
    }
    if (status === "pending") {
      return <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50">Pending</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Type", "Chain", "Protocol", "Pair", "Amount (USD)", "Gas (USD)", "Status", "TX Hash"];
    const rows = filteredTransactions.map((tx) => [
      tx.timestamp.toISOString(),
      getTypeLabel(tx.type),
      tx.chain,
      tx.protocol,
      tx.pair || "-",
      tx.amountUsd.toFixed(2),
      tx.gasUsd.toFixed(4),
      tx.status,
      tx.txHash || "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">Complete audit log of all automated actions</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={mode.current === "shadow" ? "outline" : "default"}>
              {mode.current === "shadow" ? "Shadow Mode" : "Live Mode"}
            </Badge>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">{successfulTransactions} successful</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">
                ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Across all actions</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gas Spent</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                ${totalGas.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Total fees paid</p>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {((successfulTransactions / totalTransactions) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{totalTransactions - successfulTransactions} failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deploy">Deploy</SelectItem>
                    <SelectItem value="harvest">Harvest</SelectItem>
                    <SelectItem value="compound">Compound</SelectItem>
                    <SelectItem value="rebalance">Rebalance</SelectItem>
                    <SelectItem value="withdraw">Withdraw</SelectItem>
                    <SelectItem value="add_liquidity">Add Liquidity</SelectItem>
                    <SelectItem value="remove_liquidity">Remove Liquidity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chain</label>
                <Select value={filterChain} onValueChange={setFilterChain}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chains</SelectItem>
                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                    <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="Optimism">Optimism</SelectItem>
                    <SelectItem value="Polygon">Polygon</SelectItem>
                    <SelectItem value="BSC">BSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                    <TableHead className="text-right">Gas (USD)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TX Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{formatTime(tx.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(tx.type)}>
                            {getTypeLabel(tx.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.chain}</TableCell>
                        <TableCell>{tx.protocol}</TableCell>
                        <TableCell className="font-mono text-sm">{tx.pair || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          ${tx.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          ${tx.gasUsd.toFixed(4)}
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell>
                          {tx.txHash ? (
                            <a
                              href={`https://etherscan.io/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                            >
                              {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}