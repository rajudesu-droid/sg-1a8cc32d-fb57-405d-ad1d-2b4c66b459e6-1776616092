// ============================================================================
// AUTHORIZATION ENGINE
// Manages required approvals and wallet signing requirements
// ============================================================================

import type { ActionPlan, ExecutionPreview, ExecutionAuthorization, ExecutionContext } from "./types";

export class AuthorizationEngine {
  async requestAuthorization(
    plan: ActionPlan,
    preview: ExecutionPreview,
    context: ExecutionContext
  ): Promise<ExecutionAuthorization> {
    console.log(`[AuthorizationEngine] Checking auth requirements for mode: ${context.mode}`);

    const isLive = context.mode === "live";

    // Build list of required approvals
    const requiredApprovals: ExecutionAuthorization["requiredApprovals"] = plan.requiredApprovals.map(req => ({
      type: "token_approval",
      description: `Approve ${req.amount} ${req.token} for smart contract`,
      status: isLive ? "pending" : "approved",
    }));

    // If live, always require a wallet signature for the overall action bundle
    if (isLive) {
      requiredApprovals.push({
        type: "wallet_signature",
        description: "Sign transactions from connected wallet",
        status: "pending",
      });
    }

    // Demo/Shadow mode automatically skips manual auth checks
    const autoAuthorize = !isLive;

    return {
      authId: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      planId: plan.planId,
      actionType: plan.actionType,
      authType: isLive ? "manual" : "auto",
      requiredApprovals,
      authorized: autoAuthorize,
      authorizationMessage: autoAuthorize
        ? `Auto-authorized for ${context.mode} mode`
        : "Awaiting manual wallet signatures",
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10m validity
    };
  }

  // Invoked to approve a pending authorization (used by UI or policy overrides)
  async approveAuthorization(
    auth: ExecutionAuthorization,
    signatureData?: string
  ): Promise<ExecutionAuthorization> {
    const updated = { ...auth };
    updated.authorized = true;
    updated.authorizationMessage = "Fully authorized";
    updated.requiredApprovals = updated.requiredApprovals.map(a => ({
      ...a,
      status: "approved",
      signature: a.type === "wallet_signature" ? signatureData : undefined,
      approvedAt: new Date(),
      approvedBy: "user",
    }));
    return updated;
  }
}

export const authorizationEngine = new AuthorizationEngine();