import mongoose from "mongoose";
const msgSchema = new mongoose.Schema(
  {
    Prolific_PID: {
      type: String,
      ref: "User",
      required: true,
    },
    advice: {
      type: String,
      ref: "Advice",
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
    msg: {
      type: String,
      required: true,
      trim: true,
    },
    influenced: {
      type: Boolean,
      default: false,
      required: true,
    },
    botName: {
      type: String,
      required: true,
    },
    botType: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "message" }
);
// Update the updatedAt timestamp before saving
/**msgSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
}); */
const Msg = mongoose.models.Msg || mongoose.model("Msg", msgSchema);
export default Msg;
