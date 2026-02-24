export interface OutcomeResult {
  mvpFeatures: string[];
  riskAnalysis: RiskItem[];
  monetizationSuggestions: string[];
  recommendedArchitecture: string[];
  developmentPhases: PhaseEstimate[];
}

export interface RiskItem {
  risk: string;
  severity: "low" | "medium" | "high";
  mitigation?: string;
}

export interface PhaseEstimate {
  phase: string;
  description: string;
  estimatedTasks: number;
  order: number;
}
