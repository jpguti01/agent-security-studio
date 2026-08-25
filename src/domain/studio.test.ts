import { describe, expect, it } from "vitest";

import { SCENARIOS } from "../data/scenarios";
import { createStudioReport } from "./studio";

describe("studio report", () => {
  it("combines agent, rag, and repository signals", () => {
    const scenario = SCENARIOS[0];
    const report = createStudioReport({
      scenarioName: scenario.name,
      prompt: scenario.prompt,
      approveRiskyTools: false,
      portfolioSnapshot: scenario.repo,
    });

    expect(report.overallScore).toBeGreaterThan(70);
    expect(report.evalSummary.cases).toBeGreaterThan(0);
    expect(report.portfolioAudit.status).toBe("strong");
  });
});
