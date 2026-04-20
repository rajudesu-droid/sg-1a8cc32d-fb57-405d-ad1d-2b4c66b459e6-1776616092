/**
 * Staleness Checker
 * Detects outdated state that is unsafe for live execution
 * 
 * CRITICAL: All state must be fresh for Live Mode execution
 */

export interface StalenessThresholds {
  walletState: number;        // seconds
  positionState: number;      // seconds
  opportunityData: number;    // seconds
  balanceSnapshot: number;    // seconds
  allowanceSnapshot: number;  // seconds
  gasEstimate: number;        // seconds
  priceData: number;          // seconds
}

export interface StalenessCheckResult {
  isFresh: boolean;
  staleItems: string[];
  oldestTimestamp?: Date;
  maxAllowedAge: number;
  actualAge?: number;
}

export class StalenessChecker {
  // CRITICAL: Strict thresholds for Live Mode
  private readonly liveThresholds: StalenessThresholds = {
    walletState: 30,        // 30 seconds
    positionState: 30,      // 30 seconds
    opportunityData: 60,    // 1 minute
    balanceSnapshot: 30,    // 30 seconds
    allowanceSnapshot: 30,  // 30 seconds
    gasEstimate: 60,        // 1 minute
    priceData: 60,          // 1 minute
  };

  // Relaxed thresholds for Shadow Mode
  private readonly shadowThresholds: StalenessThresholds = {
    walletState: 300,       // 5 minutes
    positionState: 300,     // 5 minutes
    opportunityData: 600,   // 10 minutes
    balanceSnapshot: 300,   // 5 minutes
    allowanceSnapshot: 300, // 5 minutes
    gasEstimate: 600,       // 10 minutes
    priceData: 600,         // 10 minutes
  };

  /**
   * Check if wallet state is fresh
   */
  checkWalletState(
    lastUpdated: Date | undefined,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!lastUpdated) {
      return {
        isFresh: false,
        staleItems: ["wallet_state_missing"],
        maxAllowedAge: this.getThreshold("walletState", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(lastUpdated);
    const threshold = this.getThreshold("walletState", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? ["wallet_state"] : [],
      oldestTimestamp: lastUpdated,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if position state is fresh
   */
  checkPositionState(
    position: any,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!position.lastUpdated) {
      return {
        isFresh: false,
        staleItems: [`position_${position.id}_missing_timestamp`],
        maxAllowedAge: this.getThreshold("positionState", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(position.lastUpdated);
    const threshold = this.getThreshold("positionState", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? [`position_${position.id}`] : [],
      oldestTimestamp: position.lastUpdated,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if opportunity data is fresh
   */
  checkOpportunityData(
    opportunity: any,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!opportunity.lastUpdated) {
      return {
        isFresh: false,
        staleItems: [`opportunity_${opportunity.id}_missing_timestamp`],
        maxAllowedAge: this.getThreshold("opportunityData", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(opportunity.lastUpdated);
    const threshold = this.getThreshold("opportunityData", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? [`opportunity_${opportunity.id}`] : [],
      oldestTimestamp: opportunity.lastUpdated,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if balance snapshot is fresh
   */
  checkBalanceSnapshot(
    asset: any,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!asset.lastUpdated) {
      return {
        isFresh: false,
        staleItems: [`balance_${asset.symbol}_missing_timestamp`],
        maxAllowedAge: this.getThreshold("balanceSnapshot", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(asset.lastUpdated);
    const threshold = this.getThreshold("balanceSnapshot", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? [`balance_${asset.symbol}`] : [],
      oldestTimestamp: asset.lastUpdated,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if allowance snapshot is fresh
   */
  checkAllowanceSnapshot(
    allowanceTimestamp: Date | undefined,
    tokenSymbol: string,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!allowanceTimestamp) {
      return {
        isFresh: false,
        staleItems: [`allowance_${tokenSymbol}_missing_timestamp`],
        maxAllowedAge: this.getThreshold("allowanceSnapshot", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(allowanceTimestamp);
    const threshold = this.getThreshold("allowanceSnapshot", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? [`allowance_${tokenSymbol}`] : [],
      oldestTimestamp: allowanceTimestamp,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if gas estimate is fresh
   */
  checkGasEstimate(
    estimateTimestamp: Date | undefined,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!estimateTimestamp) {
      return {
        isFresh: false,
        staleItems: ["gas_estimate_missing"],
        maxAllowedAge: this.getThreshold("gasEstimate", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(estimateTimestamp);
    const threshold = this.getThreshold("gasEstimate", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? ["gas_estimate"] : [],
      oldestTimestamp: estimateTimestamp,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Check if price data is fresh
   */
  checkPriceData(
    priceTimestamp: Date | undefined,
    symbol: string,
    mode: "demo" | "shadow" | "live"
  ): StalenessCheckResult {
    if (!priceTimestamp) {
      return {
        isFresh: false,
        staleItems: [`price_${symbol}_missing`],
        maxAllowedAge: this.getThreshold("priceData", mode),
      };
    }

    const ageSeconds = this.getAgeInSeconds(priceTimestamp);
    const threshold = this.getThreshold("priceData", mode);

    return {
      isFresh: ageSeconds <= threshold,
      staleItems: ageSeconds > threshold ? [`price_${symbol}`] : [],
      oldestTimestamp: priceTimestamp,
      maxAllowedAge: threshold,
      actualAge: ageSeconds,
    };
  }

  /**
   * Get threshold for specific check type and mode
   */
  private getThreshold(
    type: keyof StalenessThresholds,
    mode: "demo" | "shadow" | "live"
  ): number {
    if (mode === "live") {
      return this.liveThresholds[type];
    } else if (mode === "shadow") {
      return this.shadowThresholds[type];
    } else {
      // Demo mode: no staleness checks
      return Number.MAX_SAFE_INTEGER;
    }
  }

  /**
   * Calculate age in seconds
   */
  private getAgeInSeconds(timestamp: Date): number {
    const now = new Date();
    const age = now.getTime() - new Date(timestamp).getTime();
    return Math.floor(age / 1000);
  }

  /**
   * Format staleness message
   */
  formatStalenessMessage(result: StalenessCheckResult): string {
    if (result.isFresh) {
      return "State is fresh";
    }

    const ageStr = result.actualAge 
      ? `${result.actualAge}s ago` 
      : "unknown age";
    
    const maxStr = `max ${result.maxAllowedAge}s`;

    return `Stale data detected: ${result.staleItems.join(", ")} (${ageStr}, ${maxStr})`;
  }
}

export const stalenessChecker = new StalenessChecker();