import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";

export async function GET(req: Request) {
  try {
    // Get token from cookie
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      PROLIFIC_PID: string;
    };

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ PROLIFIC_PID: decoded.PROLIFIC_PID });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      PROLIFIC_PID: user.PROLIFIC_PID,
      STUDY_ID: user.STUDY_ID,
      SESSION_ID: user.SESSION_ID,
      hasCompletedPreSurvey: user.hasCompletedPreSurvey,
      surveyResponses: user.surveyResponses,
      hasCompletedAttentionCheck: user.hasCompletedAttentionCheck,
      attentionCheckResponses: user.attentionCheckResponses,

      hasCompletedPostSurvey: user.hasCompletedPostSurvey,
      postSurveyResponses: user.postSurveyResponses,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.error("User info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
