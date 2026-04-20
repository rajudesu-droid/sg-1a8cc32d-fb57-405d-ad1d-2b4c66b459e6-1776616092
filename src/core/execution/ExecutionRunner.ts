// ============================================================================
// EXECUTION RUNNER
// Handles step-by-step transaction processing and protocol interactions
// ============================================================================

import { orchestrator } from "../orchestrator";
import type { ActionPlan, ExecutionAuthorization, ExecutionResult, ExecutionContext, ExecutionSubstep } from "./types";
import { validationEngine } from "../engines/ValidationEngine";
import { conflictDetector } from "../validation/ConflictDetector";

export class ExecutionRunner {
  private runnerId = "execution-runner";

  constructor() {
    orchestrator.registerEngine(this.runnerId, this);
    console.log("[ExecutionRunner] Initialized and registered");
  }

  async execute(
    plan: ActionPlan,
    auth: ExecutionAuthorization,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    console.log(`[ExecutionRunner] Starting execution of plan ${plan.planId} in ${context.mode} mode`);

    const result: ExecutionResult = {
      executionId: `exec-${Date.now()}`,
      planId: plan.planId,
      actionType: plan.actionType,
      status: "success",
      completedSteps: 0,
      totalSteps: plan.totalSteps,
      transactions: [],
      stateChanges: {
        balancesBefore: {},
        balancesAfter: {},
        positionsAffected: [],
        portfolioValueChange: 0,
      },
      startedAt: new Date(),
      logs: [`[Runner] Execution started in ${context.mode} mode`],
    };

    // 1. Authorization Guard
    if (context.mode === "live" && !auth.authorized) {
      result.status = "failed";
      result.error = {
        stepId: "auth_guard",
        message: "Action is missing required authorizations/signatures",
        recoverable: false,
      };
      result.completedAt = new Date();
      result.logs.push("[Runner] Failed: Unauthorized live execution blocked.");
      return result;
    }

    // 2. Shadow Mode Bypass
    if (context.mode === "shadow") {
      result.logs.push("[Runner] Shadow mode detected. Skipping real transactions.");
      result.status = "success";
      result.completedSteps = plan.totalSteps;
      result.completedAt = new Date();
      return result;
    }

    // CRITICAL: Fresh revalidation before execution
    if (context.mode === "live") {
      console.log(`[ExecutionRunner] Performing pre-execution revalidation for ${plan.planId}`);
      
      const validationResult = await validationEngine.validateAction({
        actionType: plan.actionType,
        mode: context.mode,
        chain: plan.chain,
        poolAddress: plan.poolAddress,
        walletAddress: context.walletAddress,
        metadata: {
          spenderAddress: plan.substeps.find(s => s.operation === "approve_token")?.requiredApproval?.spender,
          requiredAssets: [], // Would reconstruct from plan
        }
      } as any);

      if (!validationResult.allowed) {
        console.error(`[ExecutionRunner] Pre-execution revalidation failed:`, validationResult.blockingReasons);
        result.status = "failed";
        result.error = {
          stepId: "pre_execution_revalidation",
          message: `State changed after planning. Revalidation failed: ${validationResult.blockingReasons.join(", ")}`,
          recoverable: false,
        };
        result.completedAt = new Date();
        return result;
      }

      // Check for conflicts right before starting
      const conflictCheck = conflictDetector.checkSyncConflicts(context.mode);
      if (conflictCheck.hasConflict) {
        result.status = "failed";
        result.error = {
          stepId: "pre_execution_revalidation",
          message: `Execution blocked: ${conflictCheck.reason}`,
          recoverable: false,
        };
        result.completedAt = new Date();
        return result;
      }
    }

    // 3. Process Sequence
    for (const step of plan.substeps) {
      result.logs.push(`[Runner] Executing step ${step.sequence}: ${step.description}`);
      step.status = "executing";
      step.startTime = new Date();

      try {
        // MODE-SPECIFIC EXECUTION
        if (context.mode === "demo") {
          // Demo Mode: Simulate execution
          await this.simulateStep(step, context);
          step.status = "completed";
          step.endTime = new Date();
          result.completedSteps++;
          
          // Generate simulated tx hash for demo mode only
          const simulatedTxHash = `0xSIM${Math.random().toString(16).slice(2, 62)}`;
          step.txHash = simulatedTxHash;
          result.transactions?.push({
            stepId: step.id,
            txHash: simulatedTxHash,
            gasUsed: step.estimatedGas,
            status: "confirmed",
          });
          result.logs.push(`[Runner] Step simulated: Tx ${simulatedTxHash.substring(0, 10)}...`);
          
        } else if (context.mode === "live") {
          // Live Mode: Execute real transactions
          const txResult = await this.executeLiveStep(step, context);
          
          if (!txResult.success) {
            throw new Error(txResult.error || "Transaction failed");
          }
          
          // CRITICAL: Only mark complete if we have a real transaction hash
          if (!txResult.txHash || !txResult.txHash.startsWith("0x") || txResult.txHash.includes("SIM")) {
            throw new Error("Invalid transaction hash - real blockchain transaction required");
          }
          
          step.status = "completed";
          step.endTime = new Date();
          step.txHash = txResult.txHash;
          result.completedSteps++;
          
          result.transactions?.push({
            stepId: step.id,
            txHash: txResult.txHash,
            gasUsed: txResult.gasUsed || step.estimatedGas,
            status: "confirmed",
          });
          result.logs.push(`[Runner] Step confirmed: Tx ${txResult.txHash.substring(0, 10)}...`);
        }
      } catch (error: any) {
        step.status = "failed";
        step.endTime = new Date();
        step.error = error.message;
        result.logs.push(`[Runner] Step failed: ${error.message}`);
        
        if (!step.isOptional) {
          result.status = "failed";
          result.error = {
            stepId: step.id,
            message: error.message,
            recoverable: step.retryable,
          };
          result.completedAt = new Date();
          
          // CRITICAL: Live mode failures must not be marked as completed
          if (context.mode === "live") {
            result.logs.push("[Runner] Live execution failed - action remains pending/failed, NOT completed");
          }
          
          return result;
        } else {
          result.logs.push(`[Runner] Step is optional. Continuing execution...`);
        }
      }
    }

    result.status = "success";
    result.completedAt = new Date();
    result.logs.push("[Runner] Execution finished successfully");
    
    return result;
  }

  /**
   * Simulate step execution (Demo Mode only)
   */
  private async simulateStep(step: ExecutionSubstep, context: ExecutionContext): Promise<void> {
    // Artificial delay to simulate processing
    const delay = 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log(`[Runner] Simulated step: ${step.operation}`);
  }

  /**
   * Execute real blockchain transaction (Live Mode only)
   * 
   * CRITICAL: This method must ONLY return success with a real transaction hash
   * from a real wallet-signed blockchain transaction.
   * 
   * Implementation requirements:
   * 1. Connect to user's wallet (MetaMask, WalletConnect, etc.)
   * 2. Build real transaction parameters
   * 3. Request wallet signature
   * 4. Submit transaction to blockchain
   * 5. Wait for transaction confirmation
   * 6. Return ONLY real transaction hash
   * 
   * NEVER return simulated/mock data in Live Mode.
   */
  private async executeLiveStep(
    step: ExecutionSubstep, 
    context: ExecutionContext
  ): Promise<{
    success: boolean;
    txHash?: string;
    gasUsed?: number;
    error?: string;
  }> {
    // STUB: Real wallet integration required
    // This is where you would:
    // 1. Call the protocol adapter method (step.protocolAdapter, step.methodName)
    // 2. Use wagmi/viem/ethers to send real transaction
    // 3. Wait for receipt
    // 4. Return real tx hash
    
    console.log(`[Runner] Live execution stub - wallet integration required`);
    console.log(`[Runner] Step: ${step.operation}, Protocol: ${step.protocolAdapter}, Method: ${step.methodName}`);
    
    // TEMPORARY: For now, return failure until real wallet integration is implemented
    // This ensures Live Mode never accidentally uses mock data
    return {
      success: false,
      error: "Live execution requires wallet integration - not yet implemented. Use Demo Mode for testing."
    };
    
    /* REAL IMPLEMENTATION TEMPLATE:
    
    try {
      // Get wallet client from context
      const { walletClient, publicClient } = context.wallet;
      
      // Get protocol adapter
      const adapter = protocolRegistry.getAdapter(step.protocolAdapter);
      
      // Call adapter method to build transaction
      const txParams = await adapter[step.methodName](step.params);
      
      // Sign and send transaction
      const txHash = await walletClient.sendTransaction(txParams);
      
      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      return {
        success: receipt.status === 'success',
        txHash: receipt.transactionHash,
        gasUsed: Number(receipt.gasUsed),
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed'
      };
    }
    
    */
  }
}

export const executionRunner = new ExecutionRunner();