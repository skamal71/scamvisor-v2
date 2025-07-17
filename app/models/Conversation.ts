import mongoose from "mongoose";
const conversationSchema = new mongoose.Schema(
  {
    PROLIFIC_PID: {
      type: String,
      ref: "User",
      required: true,
    },
    conversationType: {
      type: String,
      required: true,
    },
    conversationMethod: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "conversation" }
);
export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
