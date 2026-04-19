/**
 * Crypto Price Service
 * Fetches real-time cryptocurrency prices from CoinGecko API
 */

interface CoinGeckoSimplePrice {
  [coinId: string]: {
    usd: number;
  };
}

// Map of token symbols to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  // Major cryptocurrencies
  "BTC": "bitcoin",
  "ETH": "ethereum",
  "BNB": "binancecoin",
  "SOL": "solana",
  "XRP": "ripple",
  "TRX": "tron",
  "AVAX": "avalanche-2",
  "POL": "polygon-ecosystem-token",
  "MATIC": "matic-network",
  "FTM": "fantom",
  "CRO": "crypto-com-chain",
  "ARB": "arbitrum",
  "OP": "optimism",
  
  // Wrapped versions
  "WETH": "ethereum",
  "WBNB": "binancecoin",
  "WAVAX": "avalanche-2",
  "WMATIC": "matic-network",
  "WFTM": "fantom",
  "WTRX": "tron",
  
  // Stablecoins
  "USDT": "tether",
  "USDC": "usd-coin",
  "DAI": "dai",
  "BUSD": "binance-usd",
  "USD": "usd-coin",
  "EUR": "euro-coin",
  
  // DeFi tokens
  "UNI": "uniswap",
  "LINK": "chainlink",
  "CAKE": "pancakeswap-token",
  "SUSHI": "sushi",
  "CRV": "curve-dao-token",
  "BAL": "balancer",
  "RAY": "raydium",
  "SRM": "serum",
};

// Price cache to avoid excessive API calls
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60000; // 1 minute

/**
 * Fetch real-time price for a single token
 */
export async function fetchTokenPrice(symbol: string): Promise<number> {
  const coinId = COINGECKO_ID_MAP[symbol.toUpperCase()];
  
  if (!coinId) {
    console.warn(`[CryptoPriceService] No CoinGecko ID mapping for ${symbol}`);
    return 0;
  }

  // Check cache first
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoSimplePrice = await response.json();
    const price = data[coinId]?.usd || 0;

    // Cache the result
    priceCache.set(symbol, { price, timestamp: Date.now() });

    return price;
  } catch (error) {
    console.error(`[CryptoPriceService] Error fetching price for ${symbol}:`, error);
    return 0;
  }
}

/**
 * Fetch prices for multiple tokens at once (batch operation)
 */
export async function fetchMultipleTokenPrices(
  symbols: string[]
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  if (symbols.length === 0) return priceMap;

  // Filter out duplicates
  const uniqueSymbols = Array.from(new Set(symbols));
  
  // Check cache first
  const now = Date.now();
  const uncachedSymbols: string[] = [];
  
  uniqueSymbols.forEach((symbol) => {
    const cached = priceCache.get(symbol);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      priceMap.set(symbol, cached.price);
    } else {
      uncachedSymbols.push(symbol);
    }
  });

  // If all cached, return immediately
  if (uncachedSymbols.length === 0) {
    return priceMap;
  }

  // Batch fetch uncached prices
  const coinIds = uncachedSymbols
    .map((symbol) => COINGECKO_ID_MAP[symbol.toUpperCase()])
    .filter((id): id is string => id !== undefined);

  if (coinIds.length === 0) {
    // All symbols unmapped, use fallbacks
    uncachedSymbols.forEach((symbol) => {
      const fallback = getFallbackPrice(symbol);
      priceMap.set(symbol, fallback);
      priceCache.set(symbol, { price: fallback, timestamp: now });
    });
    return priceMap;
  }

  try {
    const idsParam = coinIds.join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Map results back to symbols
    uncachedSymbols.forEach((symbol) => {
      const coinId = COINGECKO_ID_MAP[symbol.toUpperCase()];
      if (coinId && data[coinId]?.usd) {
        const price = data[coinId].usd;
        priceMap.set(symbol, price);
        priceCache.set(symbol, { price, timestamp: now });
      } else {
        const fallback = getFallbackPrice(symbol);
        priceMap.set(symbol, fallback);
        priceCache.set(symbol, { price: fallback, timestamp: now });
      }
    });

    return priceMap;
  } catch (error) {
    console.error("Batch price fetch error:", error);
    
    // Use fallbacks for all uncached
    uncachedSymbols.forEach((symbol) => {
      const fallback = getFallbackPrice(symbol);
      priceMap.set(symbol, fallback);
      priceCache.set(symbol, { price: fallback, timestamp: now });
    });
    
    return priceMap;
  }
}

/**
 * Clear the price cache (useful for forcing fresh data)
 */
export function clearPriceCache(): void {
  priceCache.clear();
}

/**
 * Get fallback prices (for when API is unavailable)
 */
export function getFallbackPrice(symbol: string): number {
  const fallbackPrices: Record<string, number> = {
    "BTC": 95000,
    "ETH": 3100,
    "BNB": 610,
    "SOL": 145,
    "XRP": 2.15,
    "TRX": 0.24,
    "AVAX": 38,
    "POL": 0.85,
    "MATIC": 0.85,
    "FTM": 0.75,
    "CRO": 0.12,
    "ARB": 0.92,
    "OP": 2.15,
    "WETH": 3100,
    "WBNB": 610,
    "WAVAX": 38,
    "WMATIC": 0.85,
    "WFTM": 0.75,
    "WTRX": 0.24,
    "USDT": 1,
    "USDC": 1,
    "DAI": 1,
    "BUSD": 1,
    "USD": 1,
    "EUR": 1.08,
    "UNI": 6.2,
    "LINK": 14.5,
    "CAKE": 2.45,
    "SUSHI": 1.2,
    "CRV": 0.85,
    "BAL": 3.5,
    "RAY": 2.8,
    "SRM": 0.35,
  };
  
  return fallbackPrices[symbol.toUpperCase()] || 0;
}