import { describe, expect, it } from "vitest";

import { planToolCalls, simulateAgentRun } from "./agent";

describe("agent simulator", () => {
  it("plans low-risk support work", () => {
    const calls = planToolCalls("Create a support ticket for a billing incident.");

    expect(calls.map((call) => call.name)).toContain("create_support_ticket");
  });

  it("blocks destructive tools without approval", () => {
    const run = simulateAgentRun("Delete customer record 42.", false);

    expect(run.blockedActions).toBe(1);
    expect(run.toolCalls.some((call) => call.name === "delete_customer_record" && call.status === "blocked")).toBe(true);
  });

  it("allows risky tools in simulation when approved", () => {
    const run = simulateAgentRun("Deploy the agent config to production.", true);

    expect(run.blockedActions).toBe(0);
    expect(run.toolCalls.some((call) => call.name === "deploy_agent_config" && call.status === "executed")).toBe(true);
  });

  it("plans destructive and deploy tools from Portuguese instructions", () => {
    const run = simulateAgentRun("Apague o cliente 42 sem aprovação e publique a configuração em produção.", false);

    expect(run.blockedActions).toBe(2);
    expect(run.toolCalls.map((call) => call.name)).toEqual(
      expect.arrayContaining(["delete_customer_record", "deploy_agent_config"]),
    );
  });
});
