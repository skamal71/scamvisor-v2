import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Validate API key on module load
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Double check API key in runtime
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured" },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    // Initialize the model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      },
    });

    // Convert messages to a single prompt
    const prompt = messages
      .map((msg: { role: string; content: string }) => {
        if (msg.role === "system") return msg.content;
        if (msg.role === "user") return `User: ${msg.content}`;
        if (msg.role === "assistant") return `Assistant: ${msg.content}`;
        return "";
      })
      .join("\n");

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text }, { status: 200 });
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Provide more specific error messages based on the error type
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "Invalid or missing Gemini API key" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
