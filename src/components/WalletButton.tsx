import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ChevronDown } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { WalletConnectionModal } from "@/components/WalletConnectionModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supportedNetworks } from "@/lib/walletConfig";

export function WalletButton() {
  const [showModal, setShowModal] = useState(false);
  const { isConnected, address, chainId, disconnectWallet } = useWallet();

  const currentNetwork = supportedNetworks.find((n) => n.id === chainId);

  if (!isConnected) {
    return (
      <>
        <Button onClick={() => setShowModal(true)} variant="default" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
        <WalletConnectionModal open={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-xs">{shortAddress}</span>
            {currentNetwork && (
              <Badge variant="secondary" className="text-xs">
                {currentNetwork.symbol}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-1">
          <div className="text-xs text-muted-foreground">Address</div>
          <div className="font-mono text-xs">{address}</div>
        </div>
        {currentNetwork && (
          <div className="px-2 py-2 space-y-1">
            <div className="text-xs text-muted-foreground">Network</div>
            <div className="text-xs font-medium">{currentNetwork.name}</div>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive focus:text-destructive">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}