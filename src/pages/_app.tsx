import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { walletConfig } from "@/lib/walletConfig";
import { WalletProvider } from "@/contexts/WalletContext";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <WagmiProvider config={walletConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <Component {...pageProps} />
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}