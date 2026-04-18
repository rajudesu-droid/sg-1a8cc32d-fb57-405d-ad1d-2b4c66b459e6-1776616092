---
title: Automation & Policy Engine
status: done
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
- [x] Create AutomationRules page with categorized policy sections
- [x] Build PolicyToggle component: auto-deploy, auto-harvest, auto-compound, auto-rebalance
- [x] Add ThresholdControls component: min harvest amount, min rebalance edge, gas budget
- [x] Create CapitalLimits component: max per pool, max per chain, max total deployed
- [x] Build EmergencyControls component: pause all, pause specific chains/DEXes
- [x] Add AuditLog component: searchable action history with filters
- [x] Create PolicyPreview component showing estimated behavior