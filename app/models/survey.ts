import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answer: mongoose.Schema.Types.Mixed, // can be string, array, number, etc.
  },
  { _id: false }
);

const surveySchema = new mongoose.Schema(
  {
    prolificPID: { type: String, required: true }, // <-- use this as the identifier
    preSurveyStartedAt: { type: Date, default: Date.now, required: false },
    preSurveyEndedAt: { type: Date, default: Date, required: false },
    preSurveyResponses: [answerSchema],
    postSurveyStartedAt: { type: Date, default: Date.now, required: false },
    postSurveyEndedAt: { type: Date, default: Date, required: false },
    postSurveyResponses: [answerSchema],
    attentionCheck: [answerSchema],
    attentionCheckTime: { type: Date, default: Date, required: false }
  },
  { timestamps: true, collection: "survey" }
);

export default mongoose.models.Survey || mongoose.model("Survey", surveySchema);
