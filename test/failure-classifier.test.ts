import { describe, it } from "node:test";
import assert from "node:assert";
import { classifyFailure } from "../src/failure-recovery/failure-classifier.js";

describe("classifyFailure", () => {
  it("classifies dependency errors", () => {
    assert.strictEqual(classifyFailure(["Cannot find module 'xyz'"]), "dependency");
    assert.strictEqual(classifyFailure(["npm ERR!"]), "dependency");
    assert.strictEqual(classifyFailure(["Module not found"]), "dependency");
  });

  it("classifies syntax errors", () => {
    assert.strictEqual(classifyFailure(["Unexpected token"]), "syntax");
    assert.strictEqual(classifyFailure(["Syntax error at line 5"]), "syntax");
    assert.strictEqual(classifyFailure(["TS2304"]), "syntax");
  });

  it("classifies architecture errors", () => {
    assert.strictEqual(classifyFailure(["Invalid hook call"]), "architecture");
    assert.strictEqual(classifyFailure(["Component MyComponent not found"]), "architecture");
  });

  it("classifies environment errors", () => {
    assert.strictEqual(classifyFailure(["ENOENT: no such file"]), "environment");
    assert.strictEqual(classifyFailure(["Port 3000 is already in use"]), "environment");
  });

  it("returns unknown for unrecognized errors", () => {
    assert.strictEqual(classifyFailure(["Something went wrong"]), "unknown");
  });

  it("uses stderr when provided", () => {
    assert.strictEqual(classifyFailure([], "Module not found: Error"), "dependency");
  });
});
