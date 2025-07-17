import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Feedback from "@/app/models/feedback";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const feedback = await Feedback.create(data);
  return NextResponse.json(feedback);
}
