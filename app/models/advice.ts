import mongoose from "mongoose";
const adviceSchema = new mongoose.Schema(
  {
    advice: {
      type: String,
      required: true,
    },
    PROLIFIC_PID: {
      type: String,
      ref: "User",
      required: true,
    },
    quizID: {
      type: Number,
      ref: "Quiz",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    phase: {
      type: Number,
      required: true,
    },
    timeStart: {
      type: Date,
      default: Date.now,
    },
    timeEnd: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "advice" }
);
const Advice = mongoose.models.Advice || mongoose.model("Advice", adviceSchema);
export default Advice;
