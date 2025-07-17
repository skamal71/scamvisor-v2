import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";
import Survey from "@/app/models/survey"; // <-- Add this import
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
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

    const { postSurveyResponses, postSurveyStartedAt, postSurveyEndedAt } =
      await req.json();

    // Validate post-survey responses
    if (!postSurveyResponses) {
      return NextResponse.json(
        { error: "Post-survey responses are required" },
        { status: 400 }
      );
    }

    // Update user with post-survey responses
    const user = await User.findOneAndUpdate(
      { PROLIFIC_PID: decoded.PROLIFIC_PID },
      {
        hasCompletedPostSurvey: true,
        postSurveyResponses,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- Save to Survey collection as dynamic array ---
    const postSurveyResponsesArray = Object.entries(postSurveyResponses).map(
      ([questionId, answer]) => ({
        questionId,
        answer,
      })
    );

    await Survey.findOneAndUpdate(
      { prolificPID: decoded.PROLIFIC_PID }, // <-- use PID here
      {
        postSurveyStartedAt: postSurveyStartedAt
          ? new Date(postSurveyStartedAt)
          : new Date(),
        postSurveyEndedAt: postSurveyEndedAt
          ? new Date(postSurveyEndedAt)
          : new Date(),
        postSurveyResponses: postSurveyResponsesArray,
      },
      { new: true }
    );
    // --------------------------------------------------

    return NextResponse.json({
      message: "Post-survey completed successfully",
      user,
    });
  } catch (error: any) {
    console.error("Post-survey submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
