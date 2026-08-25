export type Severity = "critical" | "high" | "medium" | "low";

export type RiskFinding = {
  id: string;
  title: string;
  severity: Severity;
  category: "prompt" | "data" | "tools" | "agency" | "runtime";
  evidence: string;
  recommendation: string;
};

export type ToolCall = {
  id: string;
  name: string;
  intent: string;
  risk: Severity;
  requiresApproval: boolean;
  approved: boolean;
  status: "executed" | "blocked";
  result: string;
};

export type TraceStep = {
  id: string;
  label: string;
  status: "ok" | "risk" | "blocked";
  detail: string;
  timestamp: string;
};

export type AgentRun = {
  runId: string;
  input: string;
  findings: RiskFinding[];
  toolCalls: ToolCall[];
  trace: TraceStep[];
  riskScore: number;
  blockedActions: number;
};

export type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
};

export type EvalCase = {
  id: string;
  question: string;
  expectedDocId: string;
  requiredTerms: string[];
};

export type EvalResult = {
  id: string;
  question: string;
  retrievedIds: string[];
  expectedDocId: string;
  retrievalHit: boolean;
  requiredTerms: string[];
  matchedTerms: string[];
  groundedCoverage: number;
  answer: string;
};

export type EvalSummary = {
  cases: number;
  retrievalHitRate: number;
  groundedCoverage: number;
  averageContextLength: number;
};

export type PortfolioSnapshot = {
  fullName: string;
  description: string;
  topics: string[];
  readme: string;
  hasLicense: boolean;
  hasCi: boolean;
  url?: string;
};

export type PortfolioFinding = {
  id: string;
  severity: Severity;
  message: string;
  recommendation: string;
};

export type PortfolioAudit = {
  repository: string;
  score: number;
  status: "strong" | "needs-polish" | "weak";
  findings: PortfolioFinding[];
};

export type Scenario = {
  id: string;
  name: string;
  prompt: string;
  repo: PortfolioSnapshot;
};

export type StudioReport = {
  generatedAt: string;
  scenario: string;
  agentRun: AgentRun;
  evalSummary: EvalSummary;
  evalResults: EvalResult[];
  portfolioAudit: PortfolioAudit;
  overallScore: number;
};
