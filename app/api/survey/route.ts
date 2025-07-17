import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";
import Survey from "@/app/models/survey";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Get token from cookie
    const cookies = req.headers.get("cookie");
    let token = null;
    if (cookies) {
      const tokenMatch = cookies.match(/token=([^;]+)/);
      token = tokenMatch ? tokenMatch[1] : null;
    }

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      PROLIFIC_PID: string;
    };

    const { surveyResponses, preSurveyStartedAt, preSurveyEndedAt } = await req.json();

    if (!surveyResponses) {
      return NextResponse.json(
        { error: "Survey responses are required" },
        { status: 400 }
      );
    }

    // Update user with survey responses (existing logic)
    const user = await User.findOneAndUpdate(
      { PROLIFIC_PID: decoded.PROLIFIC_PID },
      {
        hasCompletedPreSurvey: true,
        surveyResponses,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- NEW: Save to Survey collection as dynamic array ---
    const preSurveyResponses = Object.entries(surveyResponses).map(
      ([questionId, answer]) => ({
        questionId,
        answer,
      })
    );

    await Survey.create({
      prolificPID: decoded.PROLIFIC_PID, // <-- use PID here
      preSurveyStartedAt: preSurveyStartedAt ? new Date(preSurveyStartedAt) : new Date(),
      preSurveyEndedAt: preSurveyEndedAt ? new Date(preSurveyEndedAt) : new Date(),
      preSurveyResponses: preSurveyResponses,
    });
    // ------------------------------------------------------

    return NextResponse.json({
      message: "Survey completed successfully",
      user,
    });
  } catch (error: any) {
    console.error("Survey submission error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
