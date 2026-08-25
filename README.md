# Agent Security Studio

A flagship AI engineering project for testing agentic systems before production. It combines LLM security checks, tool approval gates, RAG evaluation, trace inspection, and GitHub portfolio auditing in one interactive studio.

The project is built as a public-safe portfolio application: all examples are synthetic, no real credentials are included, and the system runs locally without paid APIs.

## Positioning

Most AI demos show that an agent can act. This studio asks the production question: should the agent be allowed to act, what evidence supports the answer, and what risks were observed along the way?

## Core Modules

| Module | Purpose |
| --- | --- |
| Risk Engine | Detects prompt injection, system prompt leakage, secret exposure, excessive agency, and unsafe tool requests. |
| Agent Simulator | Plans tool calls, blocks risky actions, and records structured execution traces. |
| RAG Eval Console | Measures retrieval hit rate and grounded term coverage using synthetic evaluation cases. |
| Portfolio Auditor | Scores GitHub repositories for README quality, license, topics, CI, and secret hygiene. |
| Executive Dashboard | Turns the run into recruiter-friendly evidence: scorecards, findings, trace timeline, and JSON export. |

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React
- Vitest
- GitHub Actions

## Quick Start

```bash
git clone https://github.com/jpguti01/agent-security-studio.git
cd agent-security-studio
npm install
npm test
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Why This Is Portfolio-Ready

- It is an actual product surface, not just scripts.
- It connects security, agents, RAG evaluation, observability, and GitHub readiness.
- It includes tests and CI.
- It uses synthetic examples and avoids private data.
- It gives interview-ready talking points around applied AI engineering.

## Suggested Interview Narrative

I built Agent Security Studio to show how AI agents can be evaluated before production. The app simulates an agent run, detects LLM-specific risks, blocks dangerous tool calls unless approved, evaluates RAG quality, and audits repository readiness. It demonstrates how AI features should be treated as systems with policies, traces, tests, and review gates.

## License

MIT
