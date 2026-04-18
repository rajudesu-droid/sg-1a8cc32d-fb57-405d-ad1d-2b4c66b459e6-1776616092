---
title: Position Management
status: done
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
- [x] Create PositionDetail page with comprehensive metrics
- [x] Build RangeVisualization component showing current price vs range
- [x] Add PositionMetrics component: entry price, current price, fees, rewards, IL
- [x] Create PositionStatus component: in-range indicator, health score
- [x] Build ActionTimeline component: harvest, compound, rebalance history
- [x] Add RecommendedAction component with next suggested step
- [x] Create PositionActions drawer: harvest, compound, add/remove liquidity, close