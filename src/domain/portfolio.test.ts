import { describe, expect, it } from "vitest";

import { auditPortfolio, parseOwnerRepo } from "./portfolio";

const strongReadme = `
# Strong Repo

## Quick Start

npm install
npm test
npm run build

## Architecture

This repository has a clear architecture, safe examples, test coverage, CI, license notes, and portfolio positioning. It explains why the project exists, how the modules work, how to run it locally, and how to discuss it in interviews.

## Security

All examples use placeholders. No private data is included.

## License

MIT

${"This additional documentation gives enough depth for portfolio review. ".repeat(20)}
`;

describe("portfolio auditor", () => {
  it("scores strong repositories highly", () => {
    const audit = auditPortfolio({
      fullName: "jpguti01/strong",
      description: "A serious AI engineering project with clear README, CI, license, tests, and safe examples.",
      topics: ["ai-agents", "llm-security", "mcp", "rag", "github-actions"],
      readme: strongReadme,
      hasLicense: true,
      hasCi: true,
    });

    expect(audit.status).toBe("strong");
    expect(audit.findings).toHaveLength(0);
  });

  it("flags weak public repositories", () => {
    const audit = auditPortfolio({
      fullName: "jpguti01/weak",
      description: "",
      topics: [],
      readme: "# Weak",
      hasLicense: false,
      hasCi: false,
    });

    expect(audit.status).toBe("weak");
    expect(audit.findings.map((finding) => finding.id)).toContain("missing-ci");
  });

  it("parses GitHub repository input", () => {
    expect(parseOwnerRepo("https://github.com/jpguti01/agent-security-studio.git")).toEqual([
      "jpguti01",
      "agent-security-studio",
    ]);
  });
});
