---
title: Position Management
status: todo
priority: high
type: feature
tags: [frontend, positions, detail]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 4
---

## Notes
Position detail view showing current range, in/out-of-range status, IL tracking, accrued fees/rewards, and recommended actions. Includes action history timeline.

## Checklist
- [ ] Create PositionDetail page with comprehensive metrics
- [ ] Build RangeVisualization component showing current price vs range
- [ ] Add PositionMetrics component: entry price, current price, fees, rewards, IL
- [ ] Create PositionStatus component: in-range indicator, health score
- [ ] Build ActionTimeline component: harvest, compound, rebalance history
- [ ] Add RecommendedAction component with next suggested step
- [ ] Create PositionActions drawer: harvest, compound, add/remove liquidity, close