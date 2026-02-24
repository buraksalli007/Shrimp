import { describe, it } from "node:test";
import assert from "node:assert";
import { generateOutcome } from "../src/outcome-workflow/outcome-generator.js";

describe("generateOutcome", () => {
  it("returns default MVP for generic idea", () => {
    const result = generateOutcome("A todo app");
    assert.ok(Array.isArray(result.mvpFeatures));
    assert.ok(result.mvpFeatures.length > 0);
    assert.ok(result.mvpFeatures.some((f) => f.includes("scaffolding") || f.includes("navigation")));
  });

  it("returns fitness MVP for fitness-related idea", () => {
    const result = generateOutcome("Fitness tracker with workouts");
    assert.ok(result.mvpFeatures.some((f) => f.toLowerCase().includes("workout")));
  });

  it("returns social MVP for social-related idea", () => {
    const result = generateOutcome("Social feed app");
    assert.ok(result.mvpFeatures.some((f) => f.toLowerCase().includes("feed") || f.toLowerCase().includes("post")));
  });

  it("returns ecommerce MVP for shop-related idea", () => {
    const result = generateOutcome("Online store with cart");
    assert.ok(result.mvpFeatures.some((f) => f.toLowerCase().includes("cart") || f.toLowerCase().includes("product")));
  });

  it("returns risk analysis", () => {
    const result = generateOutcome("Any app");
    assert.ok(Array.isArray(result.riskAnalysis));
    assert.ok(result.riskAnalysis.length > 0);
    assert.ok(result.riskAnalysis.every((r) => r.risk && r.severity && r.mitigation));
  });

  it("returns development phases", () => {
    const result = generateOutcome("Any app");
    assert.ok(Array.isArray(result.developmentPhases));
    assert.ok(result.developmentPhases.length > 0);
  });
});
