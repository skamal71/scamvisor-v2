import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  await connectDB();

  // Get token from cookie
  const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    PROLIFIC_PID: string;
  };

  // Update lastLogin to now
  await User.findOneAndUpdate(
    { PROLIFIC_PID: decoded.PROLIFIC_PID },
    { lastLogin: new Date() }
  );

  // Create response
  const response = NextResponse.json(
    { message: "Sign out successful" },
    { status: 200 }
  );

  // Clear the token cookie
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}
