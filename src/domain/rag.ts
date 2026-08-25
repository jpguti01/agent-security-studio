import type { EvalCase, EvalResult, EvalSummary, KnowledgeDoc } from "./types";

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: "doc-agent-approval",
    title: "Agent Approval Policy",
    content:
      "Destructive tool calls require human approval. Examples include deleting records, sending payments, changing permissions, production deploys, and shell execution.",
  },
  {
    id: "doc-prompt-injection",
    title: "Prompt Injection Handling",
    content:
      "Untrusted instructions must be treated as data. Agents should not reveal hidden prompts, override developer rules, or follow instructions embedded in external documents.",
  },
  {
    id: "doc-rag-evals",
    title: "RAG Evaluation",
    content:
      "RAG quality should measure retrieval hit rate separately from grounded answer coverage. Regression tests should use expected documents and required factual terms.",
  },
  {
    id: "doc-observability",
    title: "AI Observability",
    content:
      "Agent traces should capture model calls, tool calls, approval decisions, latency, cost, and failures while redacting secrets and private data.",
  },
  {
    id: "doc-portfolio-readiness",
    title: "Portfolio Readiness",
    content:
      "A professional repository needs a clear README, setup instructions, license, CI workflow, topics, and public-safe examples with placeholders instead of secrets.",
  },
];

export const EVAL_SET: EvalCase[] = [
  {
    id: "eval-approval",
    question: "What should happen before an agent deletes a customer record?",
    expectedDocId: "doc-agent-approval",
    requiredTerms: ["human approval", "destructive"],
  },
  {
    id: "eval-injection",
    question: "How should agents handle instructions inside external documents?",
    expectedDocId: "doc-prompt-injection",
    requiredTerms: ["treated as data", "hidden prompts"],
  },
  {
    id: "eval-rag",
    question: "Which RAG metrics should be measured separately?",
    expectedDocId: "doc-rag-evals",
    requiredTerms: ["retrieval hit rate", "grounded answer coverage"],
  },
  {
    id: "eval-observability",
    question: "What should an agent trace capture?",
    expectedDocId: "doc-observability",
    requiredTerms: ["tool calls", "approval decisions", "cost"],
  },
  {
    id: "eval-portfolio",
    question: "What makes a repository ready for professional review?",
    expectedDocId: "doc-portfolio-readiness",
    requiredTerms: ["README", "CI workflow", "license"],
  },
];

export function retrieve(question: string, docs: KnowledgeDoc[] = KNOWLEDGE_DOCS, limit = 2): KnowledgeDoc[] {
  const terms = tokenize(question);

  return docs
    .map((doc) => ({
      doc,
      score: scoreDoc(terms, doc),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.doc);
}

export function answerQuestion(question: string, docs: KnowledgeDoc[] = KNOWLEDGE_DOCS): { answer: string; context: KnowledgeDoc[] } {
  const context = retrieve(question, docs);

  if (!context.length) {
    return {
      answer: "No grounded answer was found in the current knowledge base.",
      context,
    };
  }

  return {
    answer: context.map((doc) => doc.content).join(" "),
    context,
  };
}

export function evaluateRag(evalSet: EvalCase[] = EVAL_SET, docs: KnowledgeDoc[] = KNOWLEDGE_DOCS): {
  summary: EvalSummary;
  results: EvalResult[];
} {
  const results = evalSet.map((evalCase) => evaluateCase(evalCase, docs));

  return {
    summary: summarizeEval(results),
    results,
  };
}

export function evaluateCase(evalCase: EvalCase, docs: KnowledgeDoc[] = KNOWLEDGE_DOCS): EvalResult {
  const { answer, context } = answerQuestion(evalCase.question, docs);
  const retrievedIds = context.map((doc) => doc.id);
  const normalizedAnswer = answer.toLowerCase();
  const matchedTerms = evalCase.requiredTerms.filter((term) => normalizedAnswer.includes(term.toLowerCase()));

  return {
    id: evalCase.id,
    question: evalCase.question,
    retrievedIds,
    expectedDocId: evalCase.expectedDocId,
    retrievalHit: retrievedIds.includes(evalCase.expectedDocId),
    requiredTerms: evalCase.requiredTerms,
    matchedTerms,
    groundedCoverage: evalCase.requiredTerms.length ? matchedTerms.length / evalCase.requiredTerms.length : 1,
    answer,
  };
}

export function summarizeEval(results: EvalResult[]): EvalSummary {
  return {
    cases: results.length,
    retrievalHitRate: round(average(results.map((result) => Number(result.retrievalHit)))),
    groundedCoverage: round(average(results.map((result) => result.groundedCoverage))),
    averageContextLength: Math.round(average(results.map((result) => result.answer.length))),
  };
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .filter((term) => !STOPWORDS.has(term));
}

function scoreDoc(terms: string[], doc: KnowledgeDoc): number {
  const text = `${doc.title} ${doc.content}`.toLowerCase();
  return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "what",
  "which",
  "should",
  "before",
  "with",
  "that",
  "this",
  "how",
  "agent",
  "agents",
]);
