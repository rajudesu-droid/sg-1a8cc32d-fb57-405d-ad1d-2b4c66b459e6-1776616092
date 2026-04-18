---
title: Database Schema & Design System
status: in_progress
priority: urgent
type: feature
tags: [database, design, foundation]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 1
---

## Notes
Foundation layer: database schema for all entities (users, portfolios, assets, positions, policies, audit logs) + design system setup with custom color palette and typography.

## Checklist
- [x] Convert hex colors to HSL via terminal
- [x] Update globals.css with LP Yield Autopilot color scheme and JetBrains Mono font
- [x] Register custom colors in tailwind.config.ts
- [x] Create database schema: profiles, portfolios, assets, balances, supported_pools, opportunities, positions, rewards, actions, policies, withdrawal_plans
- [x] Apply RLS policies for all tables
- [x] Generate TypeScript types