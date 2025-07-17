import mongoose from "mongoose";
const attemptSchema = new mongoose.Schema(
  {
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);
const quizAttemptSchema = new mongoose.Schema(
  {
    PROLIFIC_PID: {
      type: String,
      ref: "User",
      required: true,
    },
    phase: {
      type: Number,
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    attempts: {
      type: [attemptSchema],
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "quizAttempt" }
);
const QuizAttempt =
  mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
// This model now tracks each attempt's answer and the time it was made.
