import type { OutcomeResult, RiskItem, PhaseEstimate } from "./types.js";

const MVP_TEMPLATES: Record<string, string[]> = {
  default: [
    "App scaffolding and navigation",
    "Core data models",
    "Main screen(s)",
    "Basic CRUD or list/detail flow",
    "Simple styling and layout",
  ],
  fitness: [
    "Workout logging",
    "Goal tracking",
    "Basic stats display",
    "Simple calendar view",
    "User preferences",
  ],
  social: [
    "User auth (basic)",
    "Feed/list view",
    "Create post",
    "Profile view",
    "Basic notifications",
  ],
  ecommerce: [
    "Product list",
    "Product detail",
    "Cart (basic)",
    "Checkout flow",
    "Order confirmation",
  ],
};

export function generateOutcome(idea: string): OutcomeResult {
  const ideaLower = idea.toLowerCase();
  let mvpFeatures = MVP_TEMPLATES.default;

  if (ideaLower.includes("fitness") || ideaLower.includes("workout") || ideaLower.includes("exercise")) {
    mvpFeatures = MVP_TEMPLATES.fitness;
  } else if (ideaLower.includes("social") || ideaLower.includes("feed") || ideaLower.includes("post")) {
    mvpFeatures = MVP_TEMPLATES.social;
  } else if (ideaLower.includes("shop") || ideaLower.includes("store") || ideaLower.includes("cart")) {
    mvpFeatures = MVP_TEMPLATES.ecommerce;
  }

  const riskAnalysis: RiskItem[] = [
    { risk: "Scope creep", severity: "medium", mitigation: "Strict MVP-first, defer non-core features" },
    { risk: "Third-party API limits", severity: "low", mitigation: "Use mock data for development" },
    { risk: "Platform-specific bugs", severity: "low", mitigation: "Test on both iOS and Android early" },
  ];

  const monetizationSuggestions: string[] = [
    "Freemium: Core free, premium features paid",
    "One-time purchase for full unlock",
    "Subscription for recurring value (e.g. sync, analytics)",
  ];

  const recommendedArchitecture: string[] = [
    "Expo + React Native",
    "File-based navigation (Expo Router)",
    "Zustand for state",
    "API layer in src/api",
  ];

  const developmentPhases: PhaseEstimate[] = [
    { phase: "Phase 1: Foundation", description: "Scaffold, nav, core screens", estimatedTasks: 3, order: 1 },
    { phase: "Phase 2: Core Logic", description: "Data flow, main features", estimatedTasks: 4, order: 2 },
    { phase: "Phase 3: Polish", description: "Styling, edge cases, validation", estimatedTasks: 2, order: 3 },
  ];

  return {
    mvpFeatures,
    riskAnalysis,
    monetizationSuggestions,
    recommendedArchitecture,
    developmentPhases,
  };
}
