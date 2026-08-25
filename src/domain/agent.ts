import { analyzePrompt, calculateRiskScore } from "./security";
import type { AgentRun, RiskFinding, Severity, ToolCall, TraceStep } from "./types";

export function simulateAgentRun(input: string, approveRiskyTools: boolean): AgentRun {
  const findings = analyzePrompt(input);
  const toolCalls = planToolCalls(input).map((toolCall) => applyApproval(toolCall, approveRiskyTools));
  const riskScore = calculateRiskScore(findings) + toolCalls.reduce((total, tool) => total + toolRiskPenalty(tool), 0);
  const boundedRiskScore = Math.min(100, riskScore);
  const now = new Date();

  return {
    runId: makeRunId(input),
    input,
    findings,
    toolCalls,
    trace: buildTrace(now, findings, toolCalls),
    riskScore: boundedRiskScore,
    blockedActions: toolCalls.filter((tool) => tool.status === "blocked").length,
  };
}

export function planToolCalls(input: string): Omit<ToolCall, "approved" | "status" | "result">[] {
  const normalized = input.toLowerCase();
  const calls: Omit<ToolCall, "approved" | "status" | "result">[] = [
    {
      id: "tool-context-search",
      name: "search_policy_docs",
      intent: "Retrieve policy context for the user request.",
      risk: "low",
      requiresApproval: false,
    },
  ];

  if (/(ticket|support|case|incident|suporte|soporte|incidente|cobran[cç]a|facturaci[oó]n)/i.test(normalized)) {
    calls.push({
      id: "tool-create-ticket",
      name: "create_support_ticket",
      intent: "Create a synthetic support ticket for review.",
      risk: "low",
      requiresApproval: false,
    });
  }

  if (/(delete|drop|wipe|truncate|remove customer|apague|apagar|exclua|excluir|remova|remover|borrar|borra|eliminar|elimina)/i.test(normalized)) {
    calls.push({
      id: "tool-delete-record",
      name: "delete_customer_record",
      intent: "Delete a customer record.",
      risk: "critical",
      requiresApproval: true,
    });
  }

  if (/(deploy|production|release|rollout|publique|publicar|implante|implantar|produ[cç][aã]o|producao|publica|despliega|desplegar|producci[oó]n)/i.test(normalized)) {
    calls.push({
      id: "tool-deploy-config",
      name: "deploy_agent_config",
      intent: "Deploy an agent configuration.",
      risk: "high",
      requiresApproval: true,
    });
  }

  if (/(payment|refund|transfer|wire|pagamento|reembolso|transfer[eê]ncia|pago|devoluci[oó]n|transferencia)/i.test(normalized)) {
    calls.push({
      id: "tool-send-payment",
      name: "send_payment",
      intent: "Trigger a financial action.",
      risk: "critical",
      requiresApproval: true,
    });
  }

  return calls;
}

function applyApproval(
  toolCall: Omit<ToolCall, "approved" | "status" | "result">,
  approveRiskyTools: boolean,
): ToolCall {
  const approved = !toolCall.requiresApproval || approveRiskyTools;
  const blocked = toolCall.requiresApproval && !approved;

  return {
    ...toolCall,
    approved,
    status: blocked ? "blocked" : "executed",
    result: blocked
      ? "Blocked by human approval policy."
      : toolCall.requiresApproval
        ? "Executed in simulation mode after approval."
        : "Executed with read-only or low-risk permissions.",
  };
}

function buildTrace(startedAt: Date, findings: RiskFinding[], toolCalls: ToolCall[]): TraceStep[] {
  const steps: TraceStep[] = [
    {
      id: "trace-input",
      label: "Input received",
      status: "ok",
      detail: "User request captured for policy and tool analysis.",
      timestamp: startedAt.toISOString(),
    },
    {
      id: "trace-risk-scan",
      label: "Risk scan completed",
      status: findings.some((finding) => finding.severity === "critical" || finding.severity === "high") ? "risk" : "ok",
      detail: findings.length ? `${findings.length} risk finding(s) detected.` : "No prompt-level findings detected.",
      timestamp: addSeconds(startedAt, 1).toISOString(),
    },
  ];

  toolCalls.forEach((toolCall, index) => {
    steps.push({
      id: `trace-${toolCall.id}`,
      label: toolCall.name,
      status: toolCall.status === "blocked" ? "blocked" : toolCall.requiresApproval ? "risk" : "ok",
      detail: toolCall.result,
      timestamp: addSeconds(startedAt, index + 2).toISOString(),
    });
  });

  steps.push({
    id: "trace-report",
    label: "Studio report assembled",
    status: toolCalls.some((toolCall) => toolCall.status === "blocked") ? "blocked" : "ok",
    detail: "Run evidence is ready for review.",
    timestamp: addSeconds(startedAt, toolCalls.length + 3).toISOString(),
  });

  return steps;
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function toolRiskPenalty(toolCall: ToolCall): number {
  if (toolCall.status === "blocked") {
    return 8;
  }

  return {
    critical: 24,
    high: 14,
    medium: 8,
    low: 2,
  }[toolCall.risk satisfies Severity];
}

function makeRunId(input: string): string {
  const normalized = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `run-${normalized.slice(0, 32) || "demo"}`;
}
