import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import { Conversation } from "@/app/models/Conversation";
import { User } from "@/app/models/User";
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // Get token from cookie manually
    const cookie = req.headers.get("cookie") || "";
    const tokenString = cookie
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];
    if (!tokenString) {
      console.log("No token in cookies");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let token;
    try {
      token = jwt.verify(tokenString, process.env.JWT_SECRET!);
    } catch (err) {
      console.log("Invalid token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!token || typeof token !== "object" || !("PROLIFIC_PID" in token)) {
      console.log("No PROLIFIC_PID in token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const prolificPIDString = (token as any).PROLIFIC_PID;
    console.log("PROLIFIC_PID from token:", prolificPIDString);
    const user = await User.findOne({ PROLIFIC_PID: prolificPIDString });
    if (!user) {
      console.log("User not found for PROLIFIC_PID:", prolificPIDString);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("Found user:", user);
    // Determine conversationType based on STUDY_ID
    /**let conversationType = "Unknown";
    const studyId = (user.STUDY_ID ?? "").toString().trim();
    if (studyId === "1" || studyId === "test_study_1") {
      conversationType = "Imposter Scam";
    } else if (studyId === "2" || studyId === "test_study_2") {
      conversationType = "Pig Butchering Scam";
    } */
    // Get conversationMethod from request body
    const body = await req.json();
    const conversationType = body.conversationType || "Unknown";
    const conversationMethod = body.conversationMethod || "None";

    const conversation = await Conversation.create({
      PROLIFIC_PID: user.PROLIFIC_PID,
      conversationType,
      conversationMethod,
    });
    const conversationId = conversation._id; // Use this for all related documents
    console.log("Created conversation:", conversation);
    return NextResponse.json({
      success: true,
      conversationID: conversation._id,
    });
  } catch (error) {
    console.error("Error saving conversation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save conversation", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { conversationID } = body;

    if (!conversationID) {
      return NextResponse.json({ error: "Missing conversationID" }, { status: 400 });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationID,
      { updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedAt: updated.updatedAt });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}
