import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import QuizAttempt from "@/app/models/quizAttempt";
import { User } from "@/app/models/User";
export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const { PROLIFIC_PID, phase, questionNumber, attempts, conversationId } =
    data; // <-- add conversationId
  // Find user by PROLIFIC_PID
  const user = await User.findOne({ PROLIFIC_PID });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Save quizAttempt with conversationId
  const quizAttempt = await QuizAttempt.create({
    PROLIFIC_PID: user.PROLIFIC_PID,
    phase,
    questionNumber,
    attempts,
    conversationId, // <-- include here
  });
  return NextResponse.json(quizAttempt);
}
