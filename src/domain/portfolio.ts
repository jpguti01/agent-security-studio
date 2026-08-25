import type { PortfolioAudit, PortfolioFinding, PortfolioSnapshot } from "./types";

const SECRET_PATTERNS = [
  /\b(api[_ -]?key|token|secret|password)\s*[:=]\s*['"]?[A-Za-z0-9_-]{8,}/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,
];

export function auditPortfolio(snapshot: PortfolioSnapshot): PortfolioAudit {
  const findings: Array<PortfolioFinding & { penalty: number }> = [];

  if (!snapshot.description || snapshot.description.length < 60) {
    findings.push({
      id: "description-depth",
      severity: "medium",
      penalty: 10,
      message: "Repository description is not specific enough.",
      recommendation: "Use one sentence with problem, stack, and outcome.",
    });
  }

  if (snapshot.topics.length < 5) {
    findings.push({
      id: "topics-depth",
      severity: "medium",
      penalty: 10,
      message: "Repository has fewer than five searchable topics.",
      recommendation: "Add focused topics such as ai-agents, llm-security, mcp, rag, or github-actions.",
    });
  }

  if (snapshot.readme.length < 1200) {
    findings.push({
      id: "readme-depth",
      severity: "high",
      penalty: 18,
      message: "README is too short for a flagship portfolio project.",
      recommendation: "Add architecture, quick start, modules, testing, security posture, and interview narrative.",
    });
  }

  if (!/(quick start|getting started|npm install|npm test|pip install|como executar)/i.test(snapshot.readme)) {
    findings.push({
      id: "missing-setup",
      severity: "high",
      penalty: 16,
      message: "README does not include reproducible setup instructions.",
      recommendation: "Add install, test, build, and run commands.",
    });
  }

  if (!snapshot.hasLicense) {
    findings.push({
      id: "missing-license",
      severity: "medium",
      penalty: 10,
      message: "Repository does not expose a license.",
      recommendation: "Add a LICENSE file when the project is public and reusable.",
    });
  }

  if (!snapshot.hasCi) {
    findings.push({
      id: "missing-ci",
      severity: "medium",
      penalty: 12,
      message: "Repository does not include CI.",
      recommendation: "Add GitHub Actions that run tests and build checks.",
    });
  }

  if (SECRET_PATTERNS.some((pattern) => pattern.test(snapshot.readme))) {
    findings.push({
      id: "secret-shaped-readme",
      severity: "critical",
      penalty: 35,
      message: "README contains a secret-shaped value or private identifier.",
      recommendation: "Replace with placeholders and rotate any exposed credentials.",
    });
  }

  const score = Math.max(0, 100 - findings.reduce((total, finding) => total + finding.penalty, 0));

  return {
    repository: snapshot.fullName,
    score,
    status: score >= 85 ? "strong" : score >= 65 ? "needs-polish" : "weak",
    findings: findings.map(({ penalty, ...finding }) => finding),
  };
}

export async function fetchGithubSnapshot(ownerRepo: string): Promise<PortfolioSnapshot> {
  const [owner, repo] = parseOwnerRepo(ownerRepo);
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Accept: "application/vnd.github+json",
  };
  const metadata = await fetchJson(base, headers);
  const readme = await fetchJson(`${base}/readme`, headers).catch(() => null);
  const workflows = await fetchJson(`${base}/contents/.github/workflows`, headers).catch(() => []);

  return {
    fullName: metadata.full_name,
    description: metadata.description ?? "",
    topics: metadata.topics ?? [],
    readme: readme?.content ? decodeBase64(readme.content) : "",
    hasLicense: Boolean(metadata.license),
    hasCi: Array.isArray(workflows) && workflows.some((item) => item.name?.endsWith(".yml") || item.name?.endsWith(".yaml")),
    url: metadata.html_url,
  };
}

export function parseOwnerRepo(value: string): [string, string] {
  const cleaned = value.replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  const parts = cleaned.split("/").filter(Boolean);

  if (parts.length !== 2) {
    throw new Error("Expected repository in owner/repo format.");
  }

  return [parts[0], parts[1]];
}

async function fetchJson(url: string, headers: HeadersInit): Promise<any> {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  return response.json();
}

function decodeBase64(value: string): string {
  const normalized = value.replace(/\n/g, "");
  return decodeURIComponent(
    Array.from(atob(normalized))
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}
