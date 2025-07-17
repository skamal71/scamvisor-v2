import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: { type: [String], required: true }, // Array of 4 question strings
  responses: { type: [String], default: [] }, // Array of 4 user response strings
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
