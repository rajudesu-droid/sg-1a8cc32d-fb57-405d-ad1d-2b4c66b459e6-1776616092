/**
 * Code Impact Analysis Engine
 * Analyzes dependencies and determines what modules are affected by changes
 */

export interface ModuleDependency {
  moduleName: string;
  dependsOn: string[];
  affectedBy: string[];
  dataContracts: string[];
  pages: string[];
  components: string[];
}

export interface ImpactReport {
  changeSource: string;
  affectedModules: string[];
  affectedPages: string[];
  affectedComponents: string[];
  requiredUpdates: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export class CodeImpactEngine {
  private dependencyMap: Map<string, ModuleDependency> = new Map();

  constructor() {
    this.initializeDependencyMap();
  }

  // ==================== DEPENDENCY MAP ====================
  private initializeDependencyMap(): void {
    // Define module dependencies
    const modules: ModuleDependency[] = [
      {
        moduleName: "wallet",
        dependsOn: [],
        affectedBy: [],
        dataContracts: ["Wallet", "Asset"],
        pages: ["wallets", "dashboard"],
        components: ["WalletButton", "WalletConnectionModal", "ConnectedWallets", "NetworkBalances"],
      },
      {
        moduleName: "portfolio",
        dependsOn: ["wallet", "position", "rewards"],
        affectedBy: ["wallet", "position", "rewards"],
        dataContracts: ["PortfolioMetrics", "Asset", "Position"],
        pages: ["dashboard"],
        components: ["PortfolioMetrics", "NetworkBalances"],
      },
      {
        moduleName: "opportunity",
        dependsOn: ["wallet"],
        affectedBy: ["wallet"],
        dataContracts: ["Opportunity", "Asset"],
        pages: ["opportunities", "dashboard"],
        components: ["OpportunityCard", "OpportunityFilters"],
      },
      {
        moduleName: "position",
        dependsOn: ["opportunity", "wallet"],
        affectedBy: ["opportunity", "wallet"],
        dataContracts: ["Position", "Opportunity"],
        pages: ["positions", "dashboard", "withdraw"],
        components: ["ActivePositions", "PositionCard"],
      },
      {
        moduleName: "rewards",
        dependsOn: ["position"],
        affectedBy: ["position"],
        dataContracts: ["Position"],
        pages: ["dashboard", "positions"],
        components: ["PortfolioMetrics", "ActivePositions"],
      },
      {
        moduleName: "withdrawal",
        dependsOn: ["position", "portfolio"],
        affectedBy: ["position", "portfolio"],
        dataContracts: ["Position", "WithdrawalPlan"],
        pages: ["withdraw"],
        components: ["WithdrawPlan"],
      },
      {
        moduleName: "policy",
        dependsOn: [],
        affectedBy: [],
        dataContracts: ["Policy", "PolicyThresholds"],
        pages: ["automation", "settings"],
        components: ["PolicyEditor", "ThresholdControls"],
      },
      {
        moduleName: "simulation",
        dependsOn: ["wallet", "position"],
        affectedBy: ["wallet", "position"],
        dataContracts: ["Asset", "Position", "SimulationAction"],
        pages: ["demo"],
        components: ["AssetManager", "SimulationLedger"],
      },
      {
        moduleName: "mode",
        dependsOn: [],
        affectedBy: [],
        dataContracts: ["AppMode"],
        pages: ["all-pages"],
        components: ["ModeSelector", "all-mode-aware-components"],
      },
    ];

    modules.forEach((mod) => {
      this.dependencyMap.set(mod.moduleName, mod);
    });
  }

  // ==================== IMPACT ANALYSIS ====================
  analyzeChange(changeSource: string, changeType: "data" | "logic" | "contract"): ImpactReport {
    console.log(`[CodeImpact] Analyzing change in: ${changeSource}`);

    const affectedModules = new Set<string>();
    const affectedPages = new Set<string>();
    const affectedComponents = new Set<string>();
    const requiredUpdates: string[] = [];

    // Find the module for this change source
    const sourceModule = this.findModuleByName(changeSource);

    if (sourceModule) {
      // Add directly affected modules
      sourceModule.affectedBy.forEach((mod) => {
        affectedModules.add(mod);
        const depModule = this.dependencyMap.get(mod);
        if (depModule) {
          depModule.pages.forEach((page) => affectedPages.add(page));
          depModule.components.forEach((comp) => affectedComponents.add(comp));
        }
      });

      // Add pages and components of source module
      sourceModule.pages.forEach((page) => affectedPages.add(page));
      sourceModule.components.forEach((comp) => affectedComponents.add(comp));

      // Determine required updates based on change type
      if (changeType === "contract") {
        requiredUpdates.push(`Update all modules consuming: ${sourceModule.dataContracts.join(", ")}`);
        requiredUpdates.push("Regenerate TypeScript types");
        requiredUpdates.push("Update validation schemas");
      } else if (changeType === "logic") {
        requiredUpdates.push(`Update ${sourceModule.moduleName}Engine methods`);
        requiredUpdates.push(`Sync with orchestrator for: ${sourceModule.affectedBy.join(", ")}`);
      } else if (changeType === "data") {
        requiredUpdates.push(`Trigger sync for: ${affectedModules.size} modules`);
        requiredUpdates.push(`Invalidate cache in: ${Array.from(affectedPages).join(", ")}`);
      }
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(affectedModules.size, affectedPages.size);

    const report: ImpactReport = {
      changeSource,
      affectedModules: Array.from(affectedModules),
      affectedPages: Array.from(affectedPages),
      affectedComponents: Array.from(affectedComponents),
      requiredUpdates,
      riskLevel,
      timestamp: new Date(),
    };

    console.log("[CodeImpact] Impact Report:", report);
    return report;
  }

  // ==================== DEPENDENCY QUERIES ====================
  getModuleDependencies(moduleName: string): string[] {
    const depModule = this.dependencyMap.get(moduleName);
    return depModule ? depModule.dependsOn : [];
  }

  getAffectedModules(moduleName: string): string[] {
    const depModule = this.dependencyMap.get(moduleName);
    return depModule ? depModule.affectedBy : [];
  }

  getAllDependencies(): Map<string, ModuleDependency> {
    return this.dependencyMap;
  }

  // ==================== HELPER METHODS ====================
  private findModuleByName(name: string): ModuleDependency | undefined {
    return this.dependencyMap.get(name);
  }

  private calculateRiskLevel(
    affectedModules: number,
    affectedPages: number
  ): "low" | "medium" | "high" | "critical" {
    const totalImpact = affectedModules + affectedPages;

    if (totalImpact === 0) return "low";
    if (totalImpact <= 2) return "low";
    if (totalImpact <= 5) return "medium";
    if (totalImpact <= 8) return "high";
    return "critical";
  }

  // ==================== VALIDATION ====================
  validateChangeConsistency(changeSource: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const depModule = this.findModuleByName(changeSource);

    if (!depModule) {
      issues.push(`Module ${changeSource} not found in dependency map`);
      return { valid: false, issues };
    }

    // Check if all dependencies are registered
    depModule.dependsOn.forEach((dep) => {
      if (!this.dependencyMap.has(dep)) {
        issues.push(`Dependency ${dep} is missing`);
      }
    });

    // Check circular dependencies
    const circularDeps = this.detectCircularDependencies(changeSource);
    if (circularDeps.length > 0) {
      issues.push(`Circular dependency detected: ${circularDeps.join(" -> ")}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private detectCircularDependencies(moduleName: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(moduleName)) {
      return [moduleName];
    }

    visited.add(moduleName);
    const depModule = this.dependencyMap.get(moduleName);

    if (!depModule) return [];

    for (const dep of depModule.dependsOn) {
      const circular = this.detectCircularDependencies(dep, new Set(visited));
      if (circular.length > 0) {
        return [moduleName, ...circular];
      }
    }

    return [];
  }
}

export const codeImpactEngine = new CodeImpactEngine();