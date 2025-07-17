// lib/agents.ts
export type AgentName = "mark" | "jane";

export interface AgentConfig {
  model: string;
  temperature: number;
  top_p?: number;
  max_tokens?: number;
}

/** Central place to tweak behaviour */
export const agents: Record<AgentName, AgentConfig> = {
  mark: {
    model: "gpt-4o-mini", // Mark uses OpenAI
    temperature: 0.5,
    top_p: 1,
    max_tokens: 8192,
  },
  jane: {
    model: "gpt-4o-mini", // Jane uses Gemini
    temperature: 1.0,
    top_p: 0.95,
    max_tokens: 8192,
  },
};
