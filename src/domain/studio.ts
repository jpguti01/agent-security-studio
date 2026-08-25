import { simulateAgentRun } from "./agent";
import { evaluateRag } from "./rag";
import { auditPortfolio } from "./portfolio";
import type { PortfolioSnapshot, StudioReport } from "./types";

export function createStudioReport({
  scenarioName,
  prompt,
  approveRiskyTools,
  portfolioSnapshot,
}: {
  scenarioName: string;
  prompt: string;
  approveRiskyTools: boolean;
  portfolioSnapshot: PortfolioSnapshot;
}): StudioReport {
  const agentRun = simulateAgentRun(prompt, approveRiskyTools);
  const rag = evaluateRag();
  const portfolioAudit = auditPortfolio(portfolioSnapshot);
  const overallScore = calculateOverallScore({
    agentRiskScore: agentRun.riskScore,
    blockedActions: agentRun.blockedActions,
    retrievalHitRate: rag.summary.retrievalHitRate,
    groundedCoverage: rag.summary.groundedCoverage,
    portfolioScore: portfolioAudit.score,
  });

  return {
    generatedAt: new Date().toISOString(),
    scenario: scenarioName,
    agentRun,
    evalSummary: rag.summary,
    evalResults: rag.results,
    portfolioAudit,
    overallScore,
  };
}

export function calculateOverallScore({
  agentRiskScore,
  blockedActions,
  retrievalHitRate,
  groundedCoverage,
  portfolioScore,
}: {
  agentRiskScore: number;
  blockedActions: number;
  retrievalHitRate: number;
  groundedCoverage: number;
  portfolioScore: number;
}): number {
  const safetyScore = Math.max(0, 100 - agentRiskScore + blockedActions * 6);
  const ragScore = ((retrievalHitRate + groundedCoverage) / 2) * 100;

  return Math.round(safetyScore * 0.45 + ragScore * 0.3 + portfolioScore * 0.25);
}
