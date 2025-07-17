import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";
import Survey from "@/app/models/survey"; // <-- Add this import

export async function POST(req: Request) {
  try {
    console.log("Attention check API called");

    // Get token from cookie
    const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
    console.log("Token found:", !!token);

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      PROLIFIC_PID: string;
    };
    console.log("Token decoded for PROLIFIC_PID:", decoded.PROLIFIC_PID);

    // Connect to database
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected");

    // Find user
    const user = await User.findOne({ PROLIFIC_PID: decoded.PROLIFIC_PID });
    console.log("User found:", !!user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Get attention check responses from request body
    const body = await req.json();
    console.log("Request body:", body);
    const { attentionCheckResponses, attentionCheckAnswers } = body;

    // Validate required fields
    if (!attentionCheckResponses || !attentionCheckAnswers) {
      return NextResponse.json(
        { error: "Attention check responses and answers are required" },
        { status: 400 }
      );
    }

    // --- Save selected answer choices to Survey collection ---
    // attentionCheckAnswers is already an array of { questionId, answer }
    await Survey.findOneAndUpdate(
      { prolificPID: decoded.PROLIFIC_PID },
      {
        $set: {
          attentionCheck: attentionCheckAnswers,
          attentionCheckTime: new Date(),
        },
      },
      { upsert: true, new: true }
    );
    // --------------------------------------------------------

    console.log(
      "Updating user with attention check responses:",
      attentionCheckResponses
    );

    // First, clean up any empty survey response values that might cause validation issues
    const surveyFields = [
      "age",
      "education",
      "techExperience",
      "scamAwareness",
      "previousScamExperience",
    ];
    const updateData: any = {
      hasCompletedAttentionCheck: true,
      attentionCheckResponses: attentionCheckResponses,
    };

    // Clean up empty survey response values
    if (user.surveyResponses) {
      for (const field of surveyFields) {
        if (
          user.surveyResponses[field] === "" ||
          user.surveyResponses[field] === null ||
          user.surveyResponses[field] === undefined
        ) {
          updateData[`surveyResponses.${field}`] = undefined;
        }
      }
    }

    // Update user with attention check responses using findOneAndUpdate to avoid validation issues
    const updatedUser = await User.findOneAndUpdate(
      { PROLIFIC_PID: decoded.PROLIFIC_PID },
      updateData,
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    console.log("User updated successfully");

    return NextResponse.json({
      message: "Attention check completed successfully",
      hasCompletedAttentionCheck: true,
    });
  } catch (error: any) {
    console.error("Attention check API error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
