import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";

export async function POST(req: Request) {
  try {
    const { PROLIFIC_PID, STUDY_ID, SESSION_ID } = await req.json();

    // Validate input
    if (!PROLIFIC_PID || !STUDY_ID || !SESSION_ID) {
      return NextResponse.json(
        { error: "PROLIFIC_PID, STUDY_ID, and SESSION_ID are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ PROLIFIC_PID });

    if (user) {
      // Check if user has completed the study
      if (user.hasCompletedPostSurvey) {
        return NextResponse.json(
          { error: "You have already participated in this study!" },
          { status: 400 }
        );
      }

      // User exists but hasn't completed the study, allow them to continue
      // Update last login
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        PROLIFIC_PID,
        STUDY_ID,
        SESSION_ID,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { PROLIFIC_PID: user.PROLIFIC_PID },
      process.env.JWT_SECRET!,
      {
        expiresIn: "24h",
      }
    );

    // Create response
    const response = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
    });

    return response;
  } catch (error: any) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
