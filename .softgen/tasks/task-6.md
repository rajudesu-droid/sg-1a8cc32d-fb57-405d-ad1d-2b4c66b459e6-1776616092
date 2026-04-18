---
title: Withdrawal Optimizer
status: done
priority: medium
type: feature
tags: [frontend, withdrawal, optimizer]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 6
---

## Notes
Intelligent withdrawal planning that analyzes all positions and generates the optimal unwind strategy minimizing gas, slippage, and yield destruction.

## Checklist
- [x] Create Withdraw page with amount input and optimizer
- [x] Build WithdrawalInput component: desired amount, receive token selector
- [x] Add UnwindPlan component: positions to close (full/partial), execution order
- [x] Create CostBreakdown component: total gas, slippage estimate, final amount
- [x] Build PortfolioImpact component: before/after state comparison
- [x] Add ConfirmWithdrawal modal with step-by-step preview
- [x] Create withdrawal optimizer service with scoring logic