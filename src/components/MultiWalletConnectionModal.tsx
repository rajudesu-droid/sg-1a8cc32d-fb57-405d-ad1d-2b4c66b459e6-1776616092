import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ExternalLink, Info } from "lucide-react";
import { useMultiWallet } from "@/contexts/MultiWalletContext";

interface MultiWalletConnectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function MultiWalletConnectionModal({ open, onClose }: MultiWalletConnectionModalProps) {
  const {
    connectEVM,
    connectSolana,
    connectTron,
    connectBitcoin,
    connectXRP,
  } = useMultiWallet();

  const [activeTab, setActiveTab] = useState<string>("evm");

  const walletOptions = [
    {
      id: "evm",
      name: "EVM Chains",
      description: "Ethereum, BSC, Polygon, Arbitrum, Base, etc.",
      icon: "⟠",
      connect: connectEVM,
      status: "active",
      wallets: ["MetaMask", "Trust Wallet", "Rainbow", "Coinbase Wallet"],
    },
    {
      id: "solana",
      name: "Solana",
      description: "Solana blockchain and SPL tokens",
      icon: "◎",
      connect: connectSolana,
      status: "active",
      wallets: ["Phantom", "Solflare", "Backpack"],
    },
    {
      id: "tron",
      name: "TRON",
      description: "TRON blockchain and TRC20 tokens",
      icon: "♦",
      connect: connectTron,
      status: "active",
      wallets: ["TronLink", "BitKeep"],
    },
    {
      id: "bitcoin",
      name: "Bitcoin",
      description: "Bitcoin network",
      icon: "₿",
      connect: connectBitcoin,
      status: "coming-soon",
      wallets: ["Unisat", "Xverse", "Ledger", "Trezor"],
    },
    {
      id: "xrp",
      name: "XRP Ledger",
      description: "XRP and issued assets",
      icon: "✕",
      connect: connectXRP,
      status: "coming-soon",
      wallets: ["XUMM", "Crossmark"],
    },
  ];

  const handleConnect = async (option: typeof walletOptions[0]) => {
    await option.connect();
    if (option.id === "evm") {
      // EVM connection happens via existing WalletConnect button
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Multi-Chain Wallets</DialogTitle>
          <DialogDescription>
            Connect wallets from different blockchain ecosystems
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {walletOptions.map((option) => (
                <TabsTrigger key={option.id} value={option.id} className="relative">
                  {option.icon}
                  {option.status === "coming-soon" && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 text-[8px] px-1 py-0">
                      Soon
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {walletOptions.map((option) => (
              <TabsContent key={option.id} value={option.id} className="space-y-4 mt-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl">{option.icon}</div>
                  <h3 className="text-lg font-semibold">{option.name}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>

                {option.status === "coming-soon" && (
                  <Alert className="border-amber-500/50 bg-amber-500/10">
                    <Info className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-sm">
                      {option.name} integration is currently in development. Check back soon!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Supported Wallets:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {option.wallets.map((wallet) => (
                      <Card key={wallet} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Wallet className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{wallet}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleConnect(option)}
                  className="w-full"
                  size="lg"
                  disabled={option.status === "coming-soon"}
                >
                  {option.status === "coming-soon" 
                    ? "Coming Soon"
                    : option.id === "evm"
                    ? "Use Header Connect Button"
                    : `Connect ${option.name} Wallet`
                  }
                </Button>

                {option.id === "evm" && (
                  <p className="text-xs text-center text-muted-foreground">
                    EVM wallet connection available via the "Connect Wallet" button in the header
                  </p>
                )}

                {option.id === "solana" && option.status === "active" && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="font-semibold">Installation Guide:</p>
                    <ol className="space-y-1 ml-4">
                      <li>1. Install Phantom from <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">phantom.app <ExternalLink className="h-3 w-3" /></a></li>
                      <li>2. Create or import your wallet</li>
                      <li>3. Click "Connect Solana Wallet" above</li>
                      <li>4. Approve the connection in Phantom</li>
                    </ol>
                  </div>
                )}

                {option.id === "tron" && option.status === "active" && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="font-semibold">Installation Guide:</p>
                    <ol className="space-y-1 ml-4">
                      <li>1. Install TronLink from <a href="https://www.tronlink.org" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">tronlink.org <ExternalLink className="h-3 w-3" /></a></li>
                      <li>2. Create or import your wallet</li>
                      <li>3. Click "Connect TRON Wallet" above</li>
                      <li>4. Approve the connection in TronLink</li>
                    </ol>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}