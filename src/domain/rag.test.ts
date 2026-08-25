import { describe, expect, it } from "vitest";

import { evaluateRag, retrieve } from "./rag";

describe("rag evaluator", () => {
  it("retrieves the approval policy for destructive action questions", () => {
    const results = retrieve("What should happen before deleting customer records?");

    expect(results[0].id).toBe("doc-agent-approval");
  });

  it("summarizes eval quality", () => {
    const evaluation = evaluateRag();

    expect(evaluation.summary.cases).toBeGreaterThan(0);
    expect(evaluation.summary.retrievalHitRate).toBeGreaterThanOrEqual(0.8);
    expect(evaluation.summary.groundedCoverage).toBeGreaterThanOrEqual(0.8);
  });
});
