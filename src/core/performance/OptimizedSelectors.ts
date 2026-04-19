// ============================================================================
// OPTIMIZED SELECTORS
// Memoized calculations to avoid redundant computation
// ============================================================================

import { useAppStore } from "@/store";

/**
 * Memoized portfolio summary calculation
 */
export const selectPortfolioSummary = () => {
  const store = useAppStore.getState();
  
  // Check if cached value is still valid
  const cached = (store as any)._portfolioSummaryCache;
  const lastUpdate = (store as any)._portfolioSummaryLastUpdate;
  
  if (cached && lastUpdate && Date.now() - lastUpdate < 1000) {
    return cached; // Return cached if < 1s old
  }
  
  // Recalculate
  const summary = {
    totalValue: store.portfolio.totalValue,
    deployedCapital: store.portfolio.deployedCapital,
    idleCapital: store.portfolio.idleCapital,
    activePositionsCount: store.positions.filter((p: any) => p.status === "active").length,
    totalEarnings: store.portfolio.totalEarnings,
    netAPY: store.portfolio.netAPY,
  };
  
  // Cache result
  (store as any)._portfolioSummaryCache = summary;
  (store as any)._portfolioSummaryLastUpdate = Date.now();
  
  return summary;
};

/**
 * Memoized active positions calculation
 */
export const selectActivePositions = () => {
  const store = useAppStore.getState();
  
  const cached = (store as any)._activePositionsCache;
  const lastUpdate = (store as any)._activePositionsLastUpdate;
  
  if (cached && lastUpdate && Date.now() - lastUpdate < 1000) {
    return cached;
  }
  
  const active = store.positions.filter(
    (p: any) => p.status === "active" || p.status === "out_of_range"
  );
  
  (store as any)._activePositionsCache = active;
  (store as any)._activePositionsLastUpdate = Date.now();
  
  return active;
};

/**
 * Memoized opportunities ranking
 */
export const selectTopOpportunities = (limit = 10) => {
  const store = useAppStore.getState();
  
  const cached = (store as any)._topOpportunitiesCache;
  const lastUpdate = (store as any)._topOpportunitiesLastUpdate;
  
  if (cached && lastUpdate && Date.now() - lastUpdate < 5000) {
    return cached.slice(0, limit);
  }
  
  const sorted = [...store.opportunities].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 50); // Cache top 50
  
  (store as any)._topOpportunitiesCache = top;
  (store as any)._topOpportunitiesLastUpdate = Date.now();
  
  return top.slice(0, limit);
};

/**
 * Invalidate all caches (call after major state updates)
 */
export const invalidateSelectors = () => {
  const store = useAppStore.getState();
  (store as any)._portfolioSummaryLastUpdate = 0;
  (store as any)._activePositionsLastUpdate = 0;
  (store as any)._topOpportunitiesLastUpdate = 0;
};