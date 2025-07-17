import { NextResponse } from "next/server";
import { Quiz } from "@/app/models/Quiz";
import { User } from "@/app/models/User";
import mongoose from "mongoose";

// POST: Create a new quiz with 4 questions and add to user's quizzes
export async function POST(req: Request) {
  try {
    const { userId, questions } = await req.json();
    if (!userId || !questions || questions.length !== 4) {
      return NextResponse.json(
        { error: "userId and 4 questions required" },
        { status: 400 }
      );
    }
    const quiz = await Quiz.create({ userId, questions });
    await User.findByIdAndUpdate(userId, { $push: { quizzes: quiz._id } });
    return NextResponse.json({ quiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Add a user response to a quiz
export async function PATCH(req: Request) {
  try {
    const { quizId, response } = await req.json();
    if (!quizId || typeof response !== "string") {
      return NextResponse.json(
        { error: "quizId and response string required" },
        { status: 400 }
      );
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    if (quiz.responses.length >= 4) {
      return NextResponse.json(
        { error: "Quiz already completed" },
        { status: 400 }
      );
    }
    quiz.responses.push(response);
    if (quiz.responses.length === 4) quiz.completed = true;
    await quiz.save();
    return NextResponse.json({ quiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Fetch all quizzes for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const quizzes = await Quiz.find({ userId });
    return NextResponse.json({ quizzes });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
