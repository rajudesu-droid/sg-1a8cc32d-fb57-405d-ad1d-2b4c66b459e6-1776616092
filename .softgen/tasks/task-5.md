---
title: Automation & Policy Engine
status: todo
priority: medium
type: feature
tags: [frontend, automation, policies]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 5
---

## Notes
Policy configuration interface for automation rules, capital caps, thresholds, and guardrails. Includes emergency pause and audit log viewer.

## Checklist
- [ ] Create AutomationRules page with categorized policy sections
- [ ] Build PolicyToggle component: auto-deploy, auto-harvest, auto-compound, auto-rebalance
- [ ] Add ThresholdControls component: min harvest amount, min rebalance edge, gas budget
- [ ] Create CapitalLimits component: max per pool, max per chain, max total deployed
- [ ] Build EmergencyControls component: pause all, pause specific chains/DEXes
- [ ] Add AuditLog component: searchable action history with filters
- [ ] Create PolicyPreview component showing estimated behavior