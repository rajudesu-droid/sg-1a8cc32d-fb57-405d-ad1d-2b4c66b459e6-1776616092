# LP Yield Autopilot

A professional-grade, non-custodial Web3 LP yield automation platform with centralized engine-based architecture.

## Architecture Overview

This application uses a centralized engine-based architecture where all business logic, data flow, and synchronization is managed through a coordinated system of specialized engines.

### Core Principles

1. Single Source of Truth: All data flows through centralized stores and engines
2. No Logic Duplication: Business rules exist in one place only
3. Automatic Synchronization: Changes propagate to all affected modules
4. Deterministic Data Flow: Predictable, traceable updates across the app
5. Modular but Coordinated: Each engine owns its domain but works with others

## System Components

### 1. Central Orchestrator
Master coordinator for the entire application. Routes events, enforces rules, and ensures data consistency.

### 2. Domain Engines
- Wallet Engine: Wallet connection, asset detection across chains
- Portfolio Engine: Portfolio metrics, capital tracking
- Opportunity Engine: Pool scanning, risk-adjusted scoring
- Position Engine: LP position lifecycle, health monitoring
- Rewards Engine: Reward calculation, harvest, compound
- Withdrawal Engine: Withdrawal analysis, unwind planning
- Policy Engine: Automation rules, thresholds, guardrails

### 3. Sync Engine
Keeps all pages and components synchronized. Listens for events and propagates changes globally.

### 4. Code Impact Engine
Dependency analysis and change impact detection. Maps dependencies between modules to prevent breaking changes.

### 5. Shared Contracts
Single source of truth for all data models, TypeScript interfaces, and validation schemas.

### 6. Centralized Store
Global state management using Zustand.

## Data Flow Example

1. UI: User clicks "Live Mode"
2. Component calls orchestrator
3. Orchestrator publishes event and notifies all engines
4. Sync Engine updates global store and triggers syncAll()
5. Domain Engines switch to live data
6. UI re-renders automatically

## Development Guidelines

1. Define contracts in core/contracts/
2. Update affected engines in core/engines/
3. Update store in store/index.ts
4. Update UI components (keep them thin and data-consuming)
5. Test synchronization across all affected pages