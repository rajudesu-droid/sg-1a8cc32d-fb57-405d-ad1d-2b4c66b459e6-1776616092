---
title: Demo Portfolio & Simulation
status: todo
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
- [ ] Create DemoPortfolio page with asset list and manual controls
- [ ] Build AddAsset modal: multi-chain asset search and manual entry form
- [ ] Add AssetSearch component: search by symbol, show chain-specific results
- [ ] Create BalanceEditor component: edit quantity, price override
- [ ] Build SimulationLedger component: chronological action log with replay
- [ ] Add ImportSample component: prebuilt demo portfolios
- [ ] Create simulation engine service: track virtual positions, fees, rewards