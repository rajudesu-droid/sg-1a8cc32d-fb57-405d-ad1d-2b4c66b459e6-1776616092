import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { UnifiedWalletModal } from "./UnifiedWalletModal";

export function WalletButton() {
  const { isConnected: evmConnected, address: evmAddress, chainId, isConnecting, disconnectWallet: disconnectEVM } = useWallet();
  const { connectedWallets, disconnectWallet: disconnectMulti } = useMultiWallet();
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalConnected = (evmConnected ? 1 : 0) + connectedWallets.length;
  const anyConnected = totalConnected > 0;

  const handleClick = () => {
    if (anyConnected) {
      // Disconnect all wallets
      if (evmConnected) disconnectEVM();
      connectedWallets.forEach(wallet => disconnectMulti(wallet.id));
    } else {
      setModalOpen(true);
    }
  };

  // Get network symbol from chainId
  const getNetworkSymbol = (chainId: number | undefined) => {
    const networks: Record<number, string> = {
      1: "ETH",
      56: "BNB",
      137: "MATIC",
      43114: "AVAX",
      42161: "ARB",
      10: "OP",
      8453: "BASE",
      250: "FTM",
    };
    return chainId ? networks[chainId] || "ETH" : "";
  };

  // Display logic for button text
  const getDisplayText = () => {
    if (!mounted) {
      return "Connect Wallet";
    }
    
    if (isConnecting) return "Connecting...";
    
    if (evmConnected && evmAddress) {
      return (
        <>
          <span className="hidden sm:inline">
            {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
          </span>
          <Badge variant="secondary" className="text-xs ml-2">
            {getNetworkSymbol(chainId)}
          </Badge>
        </>
      );
    }
    
    if (connectedWallets.length > 0) {
      const firstWallet = connectedWallets[0];
      return (
        <>
          <span className="hidden sm:inline">
            {firstWallet.address.slice(0, 6)}...{firstWallet.address.slice(-4)}
          </span>
          <Badge variant="secondary" className="text-xs ml-2">
            {firstWallet.chainName}
          </Badge>
        </>
      );
    }
    
    return "Connect Wallet";
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={anyConnected ? "outline" : "default"}
        disabled={isConnecting}
        className="gap-2 relative"
        suppressHydrationWarning
      >
        <Wallet className="h-4 w-4" />
        <span suppressHydrationWarning>{getDisplayText()}</span>
        {mounted && totalConnected > 1 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
            {totalConnected}
          </Badge>
        )}
      </Button>

      <UnifiedWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}