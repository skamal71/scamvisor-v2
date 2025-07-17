import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Msg from "@/app/models/msg";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const msg = await Msg.create(data);
  return NextResponse.json(msg);
}