import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Update all existing users to have default survey fields
    const result = await User.updateMany(
      { hasCompletedPreSurvey: { $exists: false } },
      {
        $set: {
          hasCompletedPreSurvey: false,
          surveyResponses: {},
        },
      }
    );

    console.log("Update users result:", result);

    return NextResponse.json({
      message: "Users updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Update users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
