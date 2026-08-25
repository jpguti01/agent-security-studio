import type { RiskFinding, Severity } from "./types";

type RiskRule = {
  id: string;
  title: string;
  severity: Severity;
  category: RiskFinding["category"];
  patterns: RegExp[];
  recommendation: string;
};

const RISK_RULES: RiskRule[] = [
  {
    id: "LLM01",
    title: "Prompt injection attempt",
    severity: "high",
    category: "prompt",
    patterns: [
      /\bignore (all )?(previous|prior|above) instructions\b/i,
      /\boverride (the )?(system|developer) (prompt|instructions)\b/i,
      /\bdisregard (the )?(rules|policy|instructions)\b/i,
    ],
    recommendation: "Treat external text as untrusted data and add adversarial prompt tests.",
  },
  {
    id: "LLM02",
    title: "Sensitive information exposure",
    severity: "critical",
    category: "data",
    patterns: [
      /\b(api[_ -]?key|secret|token|password)\s*[:=]/i,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,
    ],
    recommendation: "Remove sensitive values from prompts, traces, docs, and repository examples.",
  },
  {
    id: "LLM03",
    title: "System prompt leakage attempt",
    severity: "high",
    category: "prompt",
    patterns: [
      /\breveal (the )?(system|developer) prompt\b/i,
      /\bshow (me )?(hidden|internal) (instructions|rules|policy)\b/i,
      /\bprint (the )?(system|developer) message\b/i,
    ],
    recommendation: "Refuse hidden instruction disclosure and keep internal policy out of model output.",
  },
  {
    id: "LLM04",
    title: "Unsafe tool request",
    severity: "critical",
    category: "tools",
    patterns: [
      /\b(delete|drop|truncate|wipe)\b.*\b(database|table|bucket|record|customer|files?)\b/i,
      /\b(run|execute)\b.*\b(shell|cmd|powershell|bash)\b/i,
      /\b(send|transfer|wire)\b.*\b(money|payment|funds)\b/i,
    ],
    recommendation: "Gate destructive, financial, and shell tools behind explicit human approval.",
  },
  {
    id: "LLM05",
    title: "Excessive agency",
    severity: "medium",
    category: "agency",
    patterns: [
      /\bwithout (asking|approval|confirmation)\b/i,
      /\bdo not ask (me|for permission)\b/i,
      /\bfully autonomous\b|\bno human review\b/i,
    ],
    recommendation: "Require human-in-the-loop review for irreversible or externally visible actions.",
  },
  {
    id: "LLM06",
    title: "Unbounded runtime or spend",
    severity: "medium",
    category: "runtime",
    patterns: [/\bforever\b|\binfinite loop\b|\bwhile true\b/i, /\bretry until\b|\bnever stop\b/i],
    recommendation: "Set explicit budgets for retries, tool calls, runtime, tokens, and cost.",
  },
];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 28,
  high: 20,
  medium: 12,
  low: 6,
};

export function analyzePrompt(prompt: string): RiskFinding[] {
  return RISK_RULES.flatMap((rule) => {
    const evidence = findEvidence(prompt, rule.patterns);

    if (!evidence) {
      return [];
    }

    return {
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      category: rule.category,
      evidence,
      recommendation: rule.recommendation,
    };
  });
}

export function calculateRiskScore(findings: RiskFinding[]): number {
  const rawScore = findings.reduce((total, finding) => total + SEVERITY_WEIGHT[finding.severity], 0);
  return Math.min(100, rawScore);
}

export function severityRank(severity: Severity): number {
  return {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[severity];
}

function findEvidence(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      return match[0];
    }
  }

  return "";
}
