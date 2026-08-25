import {
  AlertTriangle,
  CheckCircle2,
  Download,
  GitBranch,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SCENARIOS } from "./data/scenarios";
import { fetchGithubSnapshot } from "./domain/portfolio";
import { createStudioReport } from "./domain/studio";
import type { PortfolioSnapshot, StudioReport } from "./domain/types";

const tabs = ["Overview", "Trace", "RAG Eval", "Repo Audit"] as const;
type Tab = (typeof tabs)[number];

export default function App() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const [prompt, setPrompt] = useState(scenario.prompt);
  const [approveRiskyTools, setApproveRiskyTools] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [portfolioSnapshot, setPortfolioSnapshot] = useState<PortfolioSnapshot>(scenario.repo);
  const [repoInput, setRepoInput] = useState("jpguti01/agent-security-studio");
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [runSeed, setRunSeed] = useState(0);

  const report = useMemo(
    () =>
      createStudioReport({
        scenarioName: scenario.name,
        prompt,
        approveRiskyTools,
        portfolioSnapshot,
      }),
    [approveRiskyTools, portfolioSnapshot, prompt, runSeed, scenario.name],
  );

  function selectScenario(nextScenarioId: string) {
    const nextScenario = SCENARIOS.find((item) => item.id === nextScenarioId) ?? SCENARIOS[0];
    setScenarioId(nextScenario.id);
    setPrompt(nextScenario.prompt);
    setPortfolioSnapshot(nextScenario.repo);
    setApproveRiskyTools(false);
    setRunSeed((value) => value + 1);
  }

  async function auditLiveRepo() {
    setRepoLoading(true);
    setRepoError("");

    try {
      const snapshot = await fetchGithubSnapshot(repoInput);
      setPortfolioSnapshot(snapshot);
      setActiveTab("Repo Audit");
    } catch (error) {
      setRepoError(error instanceof Error ? error.message : "Could not audit repository.");
    } finally {
      setRepoLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="eyebrow">AI Agent Readiness</p>
            <h1>Agent Security Studio</h1>
          </div>
        </div>
        <div className="masthead-actions">
          <button className="ghost-button" type="button" onClick={() => exportReport(report)}>
            <Download size={17} />
            Export JSON
          </button>
          <button className="primary-button" type="button" onClick={() => setRunSeed((value) => value + 1)}>
            <Play size={17} />
            Run Studio
          </button>
        </div>
      </header>

      <section className="control-surface" aria-label="Studio controls">
        <label>
          <span>Scenario</span>
          <select value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>
            {SCENARIOS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="prompt-control">
          <span>Agent instruction</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
        </label>

        <label className="switch-control">
          <input
            type="checkbox"
            checked={approveRiskyTools}
            onChange={(event) => setApproveRiskyTools(event.target.checked)}
          />
          <span>Approve risky tools</span>
        </label>
      </section>

      <section className="score-grid" aria-label="Studio scorecards">
        <ScoreCard label="Overall" value={`${report.overallScore}`} tone={scoreTone(report.overallScore)} />
        <ScoreCard label="Agent Risk" value={`${report.agentRun.riskScore}`} tone={riskTone(report.agentRun.riskScore)} />
        <ScoreCard label="Blocked Tools" value={`${report.agentRun.blockedActions}`} tone={report.agentRun.blockedActions ? "warn" : "good"} />
        <ScoreCard label="RAG Coverage" value={formatPercent(report.evalSummary.groundedCoverage)} tone="good" />
        <ScoreCard label="Repo Score" value={`${report.portfolioAudit.score}`} tone={scoreTone(report.portfolioAudit.score)} />
      </section>

      <nav className="tabs" aria-label="Studio views">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" && <Overview report={report} />}
      {activeTab === "Trace" && <TraceView report={report} />}
      {activeTab === "RAG Eval" && <RagView report={report} />}
      {activeTab === "Repo Audit" && (
        <RepoAuditView
          report={report}
          repoInput={repoInput}
          repoLoading={repoLoading}
          repoError={repoError}
          setRepoInput={setRepoInput}
          auditLiveRepo={auditLiveRepo}
        />
      )}
    </main>
  );
}

function Overview({ report }: { report: StudioReport }) {
  const riskNodes = [
    { label: "Prompt", value: report.agentRun.findings.filter((finding) => finding.category === "prompt").length },
    { label: "Data", value: report.agentRun.findings.filter((finding) => finding.category === "data").length },
    { label: "Tools", value: report.agentRun.toolCalls.filter((tool) => tool.risk === "critical" || tool.risk === "high").length },
    { label: "RAG", value: Math.round(report.evalSummary.groundedCoverage * 100) },
    { label: "Repo", value: report.portfolioAudit.score },
  ];

  return (
    <section className="workspace overview-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Threat Map</p>
            <h2>Run topology</h2>
          </div>
          <Sparkles size={20} />
        </div>
        <div className="threat-map">
          {riskNodes.map((node) => (
            <div key={node.label} className={`threat-node ${node.value ? "lit" : ""}`}>
              <span>{node.label}</span>
              <strong>{node.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Findings</p>
            <h2>Highest impact risks</h2>
          </div>
          <ShieldAlert size={20} />
        </div>
        <div className="finding-list">
          {report.agentRun.findings.length ? (
            report.agentRun.findings.map((finding) => (
              <article key={`${finding.id}-${finding.evidence}`} className={`finding ${finding.severity}`}>
                <div>
                  <strong>{finding.title}</strong>
                  <p>{finding.evidence}</p>
                </div>
                <span>{finding.severity}</span>
              </article>
            ))
          ) : (
            <EmptyState title="No prompt risks detected" detail="Tool policies and evals still run for every scenario." />
          )}
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Tool Control</p>
            <h2>Planned actions</h2>
          </div>
          <GitBranch size={20} />
        </div>
        <ToolTable report={report} />
      </div>
    </section>
  );
}

function TraceView({ report }: { report: StudioReport }) {
  return (
    <section className="workspace trace-layout">
      {report.agentRun.trace.map((step) => (
        <article key={step.id} className={`trace-step ${step.status}`}>
          <div className="trace-icon">{step.status === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}</div>
          <div>
            <div className="trace-title">
              <strong>{step.label}</strong>
              <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
            </div>
            <p>{step.detail}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function RagView({ report }: { report: StudioReport }) {
  return (
    <section className="workspace rag-layout">
      <div className="panel rag-summary">
        <ScoreCard label="Cases" value={`${report.evalSummary.cases}`} tone="neutral" />
        <ScoreCard label="Retrieval Hit Rate" value={formatPercent(report.evalSummary.retrievalHitRate)} tone="good" />
        <ScoreCard label="Grounded Coverage" value={formatPercent(report.evalSummary.groundedCoverage)} tone="good" />
        <ScoreCard label="Avg Context" value={`${report.evalSummary.averageContextLength}`} tone="neutral" />
      </div>
      <div className="eval-list">
        {report.evalResults.map((result) => (
          <article key={result.id} className="eval-row">
            <div>
              <div className="row-title">
                <strong>{result.question}</strong>
                <span className={result.retrievalHit ? "pill good" : "pill warn"}>
                  {result.retrievalHit ? "hit" : "miss"}
                </span>
              </div>
              <p>{result.answer}</p>
              <small>Expected {result.expectedDocId} | Retrieved {result.retrievedIds.join(", ")}</small>
            </div>
            <strong>{formatPercent(result.groundedCoverage)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function RepoAuditView({
  report,
  repoInput,
  repoLoading,
  repoError,
  setRepoInput,
  auditLiveRepo,
}: {
  report: StudioReport;
  repoInput: string;
  repoLoading: boolean;
  repoError: string;
  setRepoInput: (value: string) => void;
  auditLiveRepo: () => void;
}) {
  return (
    <section className="workspace repo-layout">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Repository Audit</p>
            <h2>{report.portfolioAudit.repository}</h2>
          </div>
          <ScoreBadge score={report.portfolioAudit.score} />
        </div>
        <div className="repo-search">
          <input value={repoInput} onChange={(event) => setRepoInput(event.target.value)} placeholder="owner/repository" />
          <button className="primary-button" type="button" onClick={auditLiveRepo} disabled={repoLoading}>
            {repoLoading ? <RefreshCw size={17} /> : <Search size={17} />}
            Audit
          </button>
        </div>
        {repoError && <p className="error-text">{repoError}</p>}
      </div>

      <div className="audit-list">
        {report.portfolioAudit.findings.length ? (
          report.portfolioAudit.findings.map((finding) => (
            <article key={finding.id} className={`finding ${finding.severity}`}>
              <div>
                <strong>{finding.message}</strong>
                <p>{finding.recommendation}</p>
              </div>
              <span>{finding.severity}</span>
            </article>
          ))
        ) : (
          <EmptyState title="Repository is portfolio-ready" detail="README, CI, license, topics, and secret hygiene passed the studio checks." />
        )}
      </div>
    </section>
  );
}

function ToolTable({ report }: { report: StudioReport }) {
  return (
    <div className="tool-table">
      {report.agentRun.toolCalls.map((tool) => (
        <article key={tool.id} className="tool-row">
          <div>
            <strong>{tool.name}</strong>
            <p>{tool.intent}</p>
          </div>
          <span className={`pill ${tool.risk}`}>{tool.risk}</span>
          <span className={`pill ${tool.status === "blocked" ? "warn" : "good"}`}>{tool.status}</span>
          <small>{tool.result}</small>
        </article>
      ))}
    </div>
  );
}

function ScoreCard({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "danger" | "neutral" }) {
  return (
    <article className={`score-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return <span className={`score-badge ${scoreTone(score)}`}>{score}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <CheckCircle2 size={22} />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function exportReport(report: StudioReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agent-security-studio-${report.agentRun.runId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function scoreTone(score: number): "good" | "warn" | "danger" | "neutral" {
  if (score >= 85) {
    return "good";
  }

  if (score >= 65) {
    return "warn";
  }

  return "danger";
}

function riskTone(score: number): "good" | "warn" | "danger" | "neutral" {
  if (score >= 70) {
    return "danger";
  }

  if (score >= 35) {
    return "warn";
  }

  return "good";
}
