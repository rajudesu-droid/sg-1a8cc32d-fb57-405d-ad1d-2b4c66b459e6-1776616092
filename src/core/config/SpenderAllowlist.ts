/**
 * Spender Allowlist Configuration
 * Strict per-chain whitelist of approved contracts
 * 
 * CRITICAL: Only whitelisted addresses can receive token approvals
 */

export interface AllowedSpender {
  address: string;
  name: string;
  protocol: string;
  type: "router" | "position_manager" | "staking" | "farm" | "swap" | "vault";
  chain: string;
  verified: boolean;
  notes?: string;
}

/**
 * Spender Allowlist
 * 
 * CRITICAL RULES:
 * 1. Only explicitly listed addresses are approved
 * 2. Addresses must be verified on-chain
 * 3. Each chain has separate allowlist
 * 4. Unknown spenders = BLOCKED
 */
class SpenderAllowlist {
  private allowlist: Map<string, AllowedSpender[]> = new Map();

  constructor() {
    this.initializeAllowlist();
  }

  /**
   * Initialize spender allowlist
   */
  private initializeAllowlist(): void {
    // Ethereum Mainnet
    this.addSpenders("ethereum", [
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3 Router",
        protocol: "uniswap-v3",
        type: "router",
        chain: "ethereum",
        verified: true,
        notes: "Official Uniswap V3 SwapRouter",
      },
      {
        address: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        name: "Uniswap V3 Position Manager",
        protocol: "uniswap-v3",
        type: "position_manager",
        chain: "ethereum",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions",
      },
      {
        address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
        name: "Uniswap V3 Router 2",
        protocol: "uniswap-v3",
        type: "router",
        chain: "ethereum",
        verified: true,
        notes: "SwapRouter02 with additional features",
      },
    ]);

    // BSC (Binance Smart Chain)
    this.addSpenders("bsc", [
      {
        address: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
        name: "PancakeSwap V3 Router",
        protocol: "pancakeswap-v3",
        type: "router",
        chain: "bsc",
        verified: true,
        notes: "Official PancakeSwap V3 SmartRouter",
      },
      {
        address: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
        name: "PancakeSwap V3 Position Manager",
        protocol: "pancakeswap-v3",
        type: "position_manager",
        chain: "bsc",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions",
      },
    ]);

    // Polygon
    this.addSpenders("polygon", [
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3 Router",
        protocol: "uniswap-v3",
        type: "router",
        chain: "polygon",
        verified: true,
        notes: "Official Uniswap V3 SwapRouter on Polygon",
      },
      {
        address: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        name: "Uniswap V3 Position Manager",
        protocol: "uniswap-v3",
        type: "position_manager",
        chain: "polygon",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions",
      },
    ]);

    // Arbitrum
    this.addSpenders("arbitrum", [
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3 Router",
        protocol: "uniswap-v3",
        type: "router",
        chain: "arbitrum",
        verified: true,
        notes: "Official Uniswap V3 SwapRouter on Arbitrum",
      },
      {
        address: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        name: "Uniswap V3 Position Manager",
        protocol: "uniswap-v3",
        type: "position_manager",
        chain: "arbitrum",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions",
      },
    ]);

    // Optimism
    this.addSpenders("optimism", [
      {
        address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        name: "Uniswap V3 Router",
        protocol: "uniswap-v3",
        type: "router",
        chain: "optimism",
        verified: true,
        notes: "Official Uniswap V3 SwapRouter on Optimism",
      },
      {
        address: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        name: "Uniswap V3 Position Manager",
        protocol: "uniswap-v3",
        type: "position_manager",
        chain: "optimism",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions",
      },
    ]);

    // Avalanche
    this.addSpenders("avalanche", [
      {
        address: "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE",
        name: "Trader Joe V2 Router",
        protocol: "traderjoe-v2",
        type: "router",
        chain: "avalanche",
        verified: true,
        notes: "Official Trader Joe V2 LB Router",
      },
    ]);

    // Base (Coinbase L2)
    this.addSpenders("base", [
      {
        address: "0x2626664c2603336E57B271c5C0b26F421741e481",
        name: "Uniswap V3 Router",
        protocol: "uniswap-v3",
        type: "router",
        chain: "base",
        verified: true,
        notes: "Official Uniswap V3 SwapRouter on Base",
      },
      {
        address: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
        name: "Uniswap V3 Position Manager",
        protocol: "uniswap-v3",
        type: "position_manager",
        chain: "base",
        verified: true,
        notes: "NonfungiblePositionManager for LP positions on Base",
      },
    ]);

    // Solana (SPL Programs)
    this.addSpenders("solana", [
      {
        address: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
        name: "Orca Whirlpools Program",
        protocol: "orca-whirlpools",
        type: "swap",
        chain: "solana",
        verified: true,
        notes: "Orca Whirlpools concentrated liquidity program",
      },
      {
        address: "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
        name: "Orca Legacy Program",
        protocol: "orca",
        type: "swap",
        chain: "solana",
        verified: true,
        notes: "Orca legacy swap program",
      },
      {
        address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        name: "Raydium AMM V4",
        protocol: "raydium-v4",
        type: "swap",
        chain: "solana",
        verified: true,
        notes: "Raydium automated market maker V4",
      },
    ]);

    // TRON (TRC20 Protocols)
    this.addSpenders("tron", [
      {
        address: "TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax",
        name: "SunSwap V2 Router",
        protocol: "sunswap-v2",
        type: "router",
        chain: "tron",
        verified: true,
        notes: "Official SunSwap V2 Router on TRON",
      },
      {
        address: "TXF6TkXzLhKvJGqRCTqYzFhHKPKVjVYhJP",
        name: "JustSwap Router",
        protocol: "justswap",
        type: "router",
        chain: "tron",
        verified: true,
        notes: "Official JustSwap Router on TRON",
      },
    ]);

    // XRPL (XRP Ledger) - Uses trust lines, not traditional contracts
    this.addSpenders("xrpl", [
      {
        address: "rN7n7otQDd6FczFgLdlqtyMVrn3HMgp8fM",
        name: "Sologenic DEX",
        protocol: "sologenic",
        type: "swap",
        chain: "xrpl",
        verified: true,
        notes: "Sologenic DEX on XRPL (uses trust lines)",
      },
      {
        address: "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
        name: "Solo DEX",
        protocol: "solo-dex",
        type: "swap",
        chain: "xrpl",
        verified: true,
        notes: "Solo DEX aggregator on XRPL",
      },
    ]);

    // Bitcoin - Native BTC (no smart contracts, used for display purposes)
    this.addSpenders("bitcoin", [
      {
        address: "native",
        name: "Bitcoin Native",
        protocol: "bitcoin-native",
        type: "swap",
        chain: "bitcoin",
        verified: true,
        notes: "Native Bitcoin support (no smart contracts)",
      },
    ]);

    console.log("[SpenderAllowlist] Initialized with", this.getTotalSpendersCount(), "whitelisted spenders across", this.getSupportedChains().length, "chains");
  }

  /**
   * Add spenders for a chain
   */
  private addSpenders(chain: string, spenders: AllowedSpender[]): void {
    this.allowlist.set(chain.toLowerCase(), spenders);
  }

  /**
   * Check if spender is whitelisted
   * 
   * CRITICAL: Returns false if not explicitly listed
   */
  isSpenderAllowed(
    spenderAddress: string,
    chain: string
  ): boolean {
    const chainSpenders = this.allowlist.get(chain.toLowerCase());
    
    if (!chainSpenders) {
      console.warn(`[SpenderAllowlist] No allowlist for chain: ${chain}`);
      return false;
    }

    const normalized = spenderAddress.toLowerCase();
    const found = chainSpenders.some(s => s.address.toLowerCase() === normalized);

    if (!found) {
      console.warn(
        `[SpenderAllowlist] Spender not whitelisted: ${spenderAddress} on ${chain}`
      );
    }

    return found;
  }

  /**
   * Get spender details
   */
  getSpenderDetails(
    spenderAddress: string,
    chain: string
  ): AllowedSpender | null {
    const chainSpenders = this.allowlist.get(chain.toLowerCase());
    
    if (!chainSpenders) {
      return null;
    }

    const normalized = spenderAddress.toLowerCase();
    return chainSpenders.find(s => s.address.toLowerCase() === normalized) || null;
  }

  /**
   * Get all spenders for chain
   */
  getSpendersForChain(chain: string): AllowedSpender[] {
    return this.allowlist.get(chain.toLowerCase()) || [];
  }

  /**
   * Get all spenders for protocol
   */
  getSpendersForProtocol(protocol: string, chain?: string): AllowedSpender[] {
    const allSpenders: AllowedSpender[] = [];

    for (const [chainName, spenders] of this.allowlist.entries()) {
      if (chain && chainName !== chain.toLowerCase()) {
        continue;
      }

      allSpenders.push(...spenders.filter(s => s.protocol === protocol));
    }

    return allSpenders;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): string[] {
    return Array.from(this.allowlist.keys());
  }

  /**
   * Get total spenders count
   */
  getTotalSpendersCount(): number {
    let count = 0;
    for (const spenders of this.allowlist.values()) {
      count += spenders.length;
    }
    return count;
  }

  /**
   * Validate spender list for protocol adapter
   */
  validateProtocolSpenders(
    protocol: string,
    chain: string,
    requiredTypes: Array<AllowedSpender["type"]>
  ): {
    valid: boolean;
    missingTypes: Array<AllowedSpender["type"]>;
    availableSpenders: AllowedSpender[];
  } {
    const spenders = this.getSpendersForProtocol(protocol, chain);
    
    const availableTypes = new Set(spenders.map(s => s.type));
    const missingTypes = requiredTypes.filter(t => !availableTypes.has(t));

    return {
      valid: missingTypes.length === 0,
      missingTypes,
      availableSpenders: spenders,
    };
  }
}

export const spenderAllowlist = new SpenderAllowlist();