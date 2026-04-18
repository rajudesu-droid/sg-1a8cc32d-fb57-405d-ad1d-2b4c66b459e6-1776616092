---
title: Opportunities Explorer
status: done
priority: high
type: feature
tags: [frontend, opportunities, filtering]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 3
---

## Notes
LP opportunity discovery interface with filtering, sorting, and risk-adjusted scoring display. Shows whitelisted pools across supported chains/DEXes with detailed metrics.

## Checklist
- [x] Create Opportunities page with tabbed filter controls
- [x] Build OpportunityCard component: pair, DEX, chain, APY, TVL, risk score
- [x] Add FilterControls component: chain selector, DEX selector, risk level, min APY
- [x] Create SortControls component: by APY, TVL, risk score, recommended
- [x] Build OpportunityDetail modal with full metrics and action button
- [x] Add RiskScoreBadge component with color coding
- [x] Create mock opportunity data for testing