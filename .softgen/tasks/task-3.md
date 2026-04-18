---
title: Opportunities Explorer
status: todo
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
- [ ] Create Opportunities page with tabbed filter controls
- [ ] Build OpportunityCard component: pair, DEX, chain, APY, TVL, risk score
- [ ] Add FilterControls component: chain selector, DEX selector, risk level, min APY
- [ ] Create SortControls component: by APY, TVL, risk score, recommended
- [ ] Build OpportunityDetail modal with full metrics and action button
- [ ] Add RiskScoreBadge component with color coding
- [ ] Create mock opportunity data for testing