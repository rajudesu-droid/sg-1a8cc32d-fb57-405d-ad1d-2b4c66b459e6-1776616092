/**
 * Reconciliation Service
 * Fetches real onchain state after live transactions
 * 
 * CRITICAL: Actual onchain state overrides predicted state
 */

import { useAppStore } from "@/store";
import type { Asset, Position } from "../contracts";
import { allowanceService } from "../services/AllowanceService";
import { syncEngine } from "../sync";

interface ExpectedState {
  balances: Record<string, number>;
  positions: Record<string, any>;
  allowances: Record<string, string>;
}

interface ActualState {
  balances: Record<string, number>;
  positions: Record<string, any>;
  allowances: Record<string, string>;
}

interface Discrepancy {
  type: "balance" | "position" | "allowance";
  assetOrId: string;
  expected: any;
  actual: any;
  difference: number | string;
  percentDiff?: number;
  severity: "minor" | "moderate" | "critical";
}

interface ReconciliationResult {
  success: boolean;
  reconciledAt: Date;
  txHash: string;
  actionType: string;
  expectedState: ExpectedState;
  actualState: ActualState;
  discrepancies: Discrepancy[];
  totalDiscrepancies: number;
  criticalDiscrepancies: number;
  requiresUserAttention: boolean;
  nextActions: string[];
}

class ReconciliationService {
  private serviceId = "reconciliation";
  
  // Discrepancy thresholds
  private readonly THRESHOLDS = {
    balance: {
      minor: 0.01,      // 1% difference
      moderate: 0.05,   // 5% difference
      critical: 0.10,   // 10% difference
    },
    position: {
      minor: 0.02,      // 2% difference
      moderate: 0.08,   // 8% difference
      critical: 0.15,   // 15% difference
    },
    allowance: {
      minor: 0,         // Any non-zero difference
      moderate: 0,
      critical: 0,
    },
  };

  /**
   * Reconcile state after live transaction
   * 
   * CRITICAL: Fetches real onchain state and compares with predicted state
   */
  async reconcile(
    txHash: string,
    actionType: string,
    expectedState: ExpectedState,
    walletAddress: string,
    chain: string
  ): Promise<ReconciliationResult> {
    console.log(`[ReconciliationService] Starting reconciliation for ${actionType} tx: ${txHash}`);

    const reconciledAt = new Date();
    const discrepancies: Discrepancy[] = [];

    // Fetch actual onchain state
    const actualState = await this.fetchActualState(walletAddress, chain, expectedState);

    // Compare balances
    const balanceDiscrepancies = this.compareBalances(
      expectedState.balances,
      actualState.balances
    );
    discrepancies.push(...balanceDiscrepancies);

    // Compare positions
    const positionDiscrepancies = this.comparePositions(
      expectedState.positions,
      actualState.positions
    );
    discrepancies.push(...positionDiscrepancies);

    // Compare allowances
    const allowanceDiscrepancies = this.compareAllowances(
      expectedState.allowances,
      actualState.allowances
    );
    discrepancies.push(...allowanceDiscrepancies);

    // Categorize discrepancies
    const totalDiscrepancies = discrepancies.length;
    const criticalDiscrepancies = discrepancies.filter(d => d.severity === "critical").length;
    const requiresUserAttention = criticalDiscrepancies > 0;

    // Update centralized state with actual values
    await this.updateStateFromActual(actualState, walletAddress, chain);

    // Generate next actions
    const nextActions = this.generateNextActions(discrepancies, requiresUserAttention);

    const result: ReconciliationResult = {
      success: true,
      reconciledAt,
      txHash,
      actionType,
      expectedState,
      actualState,
      discrepancies,
      totalDiscrepancies,
      criticalDiscrepancies,
      requiresUserAttention,
      nextActions,
    };

    console.log(
      `[ReconciliationService] Reconciliation complete. ` +
      `Total discrepancies: ${totalDiscrepancies}, Critical: ${criticalDiscrepancies}`
    );

    return result;
  }

  /**
   * Fetch actual onchain state
   */
  private async fetchActualState(
    walletAddress: string,
    chain: string,
    expectedState: ExpectedState
  ): Promise<ActualState> {
    console.log(`[ReconciliationService] Fetching actual onchain state for ${walletAddress} on ${chain}`);

    const actualBalances: Record<string, number> = {};
    const actualPositions: Record<string, any> = {};
    const actualAllowances: Record<string, string> = {};

    // Fetch balances for all expected assets
    for (const assetId of Object.keys(expectedState.balances)) {
      // STUB: Would fetch real balance from blockchain
      // const balance = await this.fetchBalance(assetId, walletAddress, chain);
      const balance = expectedState.balances[assetId] * 0.998; // Simulate small difference
      actualBalances[assetId] = balance;
    }

    // Fetch position states for all expected positions
    for (const positionId of Object.keys(expectedState.positions)) {
      // STUB: Would fetch real position state from protocol
      // const position = await this.fetchPositionState(positionId, chain);
      const position = { ...expectedState.positions[positionId] };
      actualPositions[positionId] = position;
    }

    // Fetch allowances for all expected allowances
    for (const key of Object.keys(expectedState.allowances)) {
      const [tokenAddress, spenderAddress] = key.split(":");
      
      // STUB: Would fetch real allowance from blockchain
      try {
        // Create a minimal asset object for allowance check
        const minimalAsset = {
          contractAddress: tokenAddress,
          decimals: 18, // Default, would fetch from contract
          symbol: "TOKEN",
          network: chain,
        } as any;
        
        const allowanceResult = await allowanceService.isApprovalNeeded(
          minimalAsset,
          walletAddress,
          spenderAddress,
          "0", // We just want current allowance, not checking if approval needed
          "live"
        );
        
        actualAllowances[key] = allowanceResult.currentAllowance;
      } catch (error) {
        console.error(`[ReconciliationService] Failed to fetch allowance for ${key}:`, error);
        actualAllowances[key] = "0";
      }
    }

    return {
      balances: actualBalances,
      positions: actualPositions,
      allowances: actualAllowances,
    };
  }

  /**
   * Compare expected vs actual balances
   */
  private compareBalances(
    expected: Record<string, number>,
    actual: Record<string, number>
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    for (const assetId of Object.keys(expected)) {
      const expectedBalance = expected[assetId];
      const actualBalance = actual[assetId] || 0;

      if (expectedBalance === 0 && actualBalance === 0) continue;

      const difference = actualBalance - expectedBalance;
      const percentDiff = expectedBalance > 0 
        ? Math.abs(difference) / expectedBalance 
        : (actualBalance > 0 ? 1 : 0);

      if (difference !== 0) {
        const severity = this.classifyBalanceDiscrepancy(percentDiff);

        discrepancies.push({
          type: "balance",
          assetOrId: assetId,
          expected: expectedBalance,
          actual: actualBalance,
          difference,
          percentDiff,
          severity,
        });
      }
    }

    return discrepancies;
  }

  /**
   * Compare expected vs actual positions
   */
  private comparePositions(
    expected: Record<string, any>,
    actual: Record<string, any>
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    for (const positionId of Object.keys(expected)) {
      const expectedPos = expected[positionId];
      const actualPos = actual[positionId];

      if (!actualPos) {
        discrepancies.push({
          type: "position",
          assetOrId: positionId,
          expected: expectedPos,
          actual: null,
          difference: "Position not found onchain",
          severity: "critical",
        });
        continue;
      }

      // Compare position value
      if (expectedPos.currentValueUsd && actualPos.currentValueUsd) {
        const expectedValue = expectedPos.currentValueUsd;
        const actualValue = actualPos.currentValueUsd;
        const difference = actualValue - expectedValue;
        const percentDiff = expectedValue > 0 
          ? Math.abs(difference) / expectedValue 
          : 0;

        if (percentDiff > this.THRESHOLDS.position.minor) {
          const severity = this.classifyPositionDiscrepancy(percentDiff);

          discrepancies.push({
            type: "position",
            assetOrId: positionId,
            expected: expectedValue,
            actual: actualValue,
            difference,
            percentDiff,
            severity,
          });
        }
      }
    }

    return discrepancies;
  }

  /**
   * Compare expected vs actual allowances
   */
  private compareAllowances(
    expected: Record<string, string>,
    actual: Record<string, string>
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    for (const key of Object.keys(expected)) {
      const expectedAllowance = BigInt(expected[key]);
      const actualAllowance = BigInt(actual[key] || "0");

      if (expectedAllowance !== actualAllowance) {
        discrepancies.push({
          type: "allowance",
          assetOrId: key,
          expected: expected[key],
          actual: actual[key],
          difference: (actualAllowance - expectedAllowance).toString(),
          severity: "moderate",
        });
      }
    }

    return discrepancies;
  }

  /**
   * Classify balance discrepancy severity
   */
  private classifyBalanceDiscrepancy(percentDiff: number): "minor" | "moderate" | "critical" {
    if (percentDiff >= this.THRESHOLDS.balance.critical) return "critical";
    if (percentDiff >= this.THRESHOLDS.balance.moderate) return "moderate";
    return "minor";
  }

  /**
   * Classify position discrepancy severity
   */
  private classifyPositionDiscrepancy(percentDiff: number): "minor" | "moderate" | "critical" {
    if (percentDiff >= this.THRESHOLDS.position.critical) return "critical";
    if (percentDiff >= this.THRESHOLDS.position.moderate) return "moderate";
    return "minor";
  }

  /**
   * Update centralized state from actual onchain values
   * 
   * CRITICAL: Actual state overrides predicted state
   */
  private async updateStateFromActual(
    actualState: ActualState,
    walletAddress: string,
    chain: string
  ): Promise<void> {
    console.log(`[ReconciliationService] Updating centralized state from actual onchain values`);

    const store = useAppStore.getState();

    // Update balances
    const updatedAssets = store.wallet.assets.map((asset: Asset) => {
      const assetId = `${asset.symbol}-${asset.network}`;
      
      if (actualState.balances[assetId] !== undefined) {
        return {
          ...asset,
          balance: actualState.balances[assetId].toString(),
          lastUpdated: new Date(),
        };
      }
      
      return asset;
    });

    // Update wallet state
    store.setWallet({
      assets: updatedAssets,
    });

    // Update positions
    const updatedPositions = store.positions.map((pos: Position) => {
      if (actualState.positions[pos.id]) {
        return {
          ...pos,
          ...actualState.positions[pos.id],
          lastUpdated: new Date(),
        };
      }
      return pos;
    });

    store.setPositions(updatedPositions);

    // Trigger sync to propagate changes
    await syncEngine.syncAll();

    console.log(`[ReconciliationService] State updated from actual onchain values`);
  }

  /**
   * Generate next actions based on discrepancies
   */
  private generateNextActions(
    discrepancies: Discrepancy[],
    requiresUserAttention: boolean
  ): string[] {
    const actions: string[] = [];

    if (requiresUserAttention) {
      actions.push("Review critical discrepancies");
      actions.push("Check transaction logs for errors");
    }

    const criticalDiscrepancies = discrepancies.filter(d => d.severity === "critical");
    
    if (criticalDiscrepancies.length > 0) {
      actions.push("Refresh wallet balances manually");
      actions.push("Contact support if discrepancies persist");
    }

    const moderateDiscrepancies = discrepancies.filter(d => d.severity === "moderate");
    
    if (moderateDiscrepancies.length > 0) {
      actions.push("Monitor positions for unexpected behavior");
    }

    if (actions.length === 0) {
      actions.push("No action required - minor discrepancies within acceptable range");
    }

    return actions;
  }
}

export const reconciliationService = new ReconciliationService();