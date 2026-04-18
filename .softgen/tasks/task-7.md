---
title: Demo Portfolio & Simulation
status: done
priority: medium
type: feature
tags: [frontend, demo, simulation]
created_by: agent
created_at: 2026-04-18T16:30:25Z
position: 7
---

## Notes
Demo mode interface for manual asset management, balance editing, and full LP lifecycle simulation. Uses identical strategy engine as live mode with simulated ledger.

## Checklist
- [x] Create DemoPortfolio page with asset list and manual controls
- [x] Build AddAsset modal: multi-chain asset search and manual entry form
- [x] Add AssetSearch component: search by symbol, show chain-specific results
- [x] Create BalanceEditor component: edit quantity, price override
- [x] Build SimulationLedger component: chronological action log with replay
- [x] Add ImportSample component: prebuilt demo portfolios
- [x] Create simulation engine service: track virtual positions, fees, rewards