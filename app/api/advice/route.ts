import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Advice from "@/app/models/advice";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const advice = await Advice.create(data);
  return NextResponse.json(advice);
}