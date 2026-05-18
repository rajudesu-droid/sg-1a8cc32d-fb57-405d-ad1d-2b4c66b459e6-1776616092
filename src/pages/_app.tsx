import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { walletConfig } from "@/lib/walletConfig";
import { WalletProvider } from "@/contexts/WalletContext";
import { MultiWalletProvider } from "@/contexts/MultiWalletContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeProvider";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <WagmiProvider config={walletConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <MultiWalletProvider>
              <Component {...pageProps} />
              <Toaster />
            </MultiWalletProvider>
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}