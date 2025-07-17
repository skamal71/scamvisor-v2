import mongoose from "mongoose";
const feedbackSchema = new mongoose.Schema(
  {
    Prolific_PID: {
      type: String,
      ref: "User",
      required: true,
    },
    conversationType: {
      type: String,
      ref: "Conversation",
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
    feedback: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "feedback" }
);
// Update the createdAt timestamp before saving
feedbackSchema.pre("save", function (next) {
  this.createdAt = new Date();
  next();
});
const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
export default Feedback;
