// app/api/aimodel/route.ts (or wherever the file lives)
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { agents, AgentName } from "@/lib/agents";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { agent = "mark", messages } = (await req.json()) as {
      agent: AgentName;
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };

    const cfg = agents[agent];

    const completion = await openai.chat.completions.create({
      model: cfg.model,
      temperature: cfg.temperature,
      top_p: cfg.top_p,
      max_tokens: cfg.max_tokens,
      messages,
    });

    return NextResponse.json(
      { response: completion.choices[0]?.message?.content ?? "" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
