/**
 * Approval Info Component
 * Displays token approval details in action previews
 * 
 * CRITICAL: Shows exact spender, token, amount, and chain for user confirmation
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface ApprovalInfoProps {
  approvals: Array<{
    token: string;
    spender: string;
    amount: number;
    chain: string;
    spenderName?: string;
    protocol?: string;
    status: "needed" | "existing" | "checking";
  }>;
}

export function ApprovalInfo({ approvals }: ApprovalInfoProps) {
  if (approvals.length === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription>
          No token approvals required. Sufficient allowances already exist.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Info className="w-4 h-4 text-blue-500" />
        <span>Token Approvals Required</span>
        <Badge variant="outline">{approvals.length}</Badge>
      </div>

      {approvals.map((approval, idx) => (
        <Card key={idx} className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Approval {idx + 1}</span>
              <Badge variant="outline" className="capitalize">
                {approval.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Token:</div>
              <div className="font-medium">{approval.token}</div>

              <div className="text-muted-foreground">Chain:</div>
              <div className="font-medium capitalize">{approval.chain}</div>

              <div className="text-muted-foreground">Amount:</div>
              <div className="font-mono">
                {approval.amount === Number.MAX_SAFE_INTEGER
                  ? "Unlimited"
                  : approval.amount.toLocaleString()}
              </div>

              <div className="text-muted-foreground">Spender:</div>
              <div className="break-all font-mono text-xs">
                {approval.spenderName || approval.spender}
              </div>

              {approval.protocol && (
                <>
                  <div className="text-muted-foreground">Protocol:</div>
                  <div className="font-medium">{approval.protocol}</div>
                </>
              )}
            </div>

            <Alert className="border-amber-500/50 bg-amber-500/10 mt-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                <strong>Security Notice:</strong> This approval allows the spender contract to 
                transfer your {approval.token} tokens. Only approve trusted contracts on the 
                correct chain.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ))}

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <div className="font-medium mb-1">Approval Policy:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Minimum required amounts are used (not unlimited)</li>
          <li>All spenders are validated against the allowlist</li>
          <li>Approvals are chain-specific and non-transferable</li>
          <li>You can revoke approvals at any time via your wallet</li>
        </ul>
      </div>
    </div>
  );
}