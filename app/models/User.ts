import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    PROLIFIC_PID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    STUDY_ID: {
      type: String,
      required: true,
      trim: true,
    },
    SESSION_ID: {
      type: String,
      required: true,
      trim: true,
    },
    // Pre-survey fields
    hasCompletedPreSurvey: {
      type: Boolean,
      default: false,
    },
    surveyResponses: {
      age: {
        type: String,
        enum: ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"],
        required: false,
      },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
        required: false,
      },
      education: {
        type: String,
        enum: [
          "High School",
          "Currently pursuing an undergraduate degree",
          "Master's Degree",
          "PhD",
          "Other",
        ],
        required: false,
      },
      scamAwareness: {
        type: String,
        enum: ["Yes", "No", "Not sure"],
        required: false,
      },
      previousScamExperience: {
        type: [String],
        required: false,
        default: [],
      },
      otherScamExperience: {
        type: String,
        maxlength: 300,
        required: false,
      },
      scamExperience: {
        type: String,
        enum: ["Yes", "No", "Prefer not to say"],
        required: false,
      },
      confidenceDetect: {
        type: String,
        enum: ["Very Low", "Low", "Moderate", "High", "Very High"],
        required: false,
      },
      confidence: {
        type: String,
        enum: [
          "Strongly disagree",
          "Disagree",
          "Neutral",
          "Agree",
          "Strongly agree",
        ],
        required: false,
      },
    },
    // Attention check fields
    hasCompletedAttentionCheck: {
      type: Boolean,
      default: false,
    },
    attentionCheckResponses: {
      videoContent: {
        type: String,
        enum: ["Correct", "Incorrect"],
        required: false,
      },
      systemPurpose: {
        type: String,
        enum: ["Correct", "Incorrect"],
        required: false,
      },
    },

    // Post-survey fields
    hasCompletedPostSurvey: {
      type: Boolean,
      default: false,
    },
    postSurveyResponses: {
      effectiveness: {
        type: String,
        enum: [
          "Very Ineffective",
          "Ineffective",
          "Neutral",
          "Effective",
          "Very Effective",
        ],
      },
      confidence: {
        type: String,
        enum: ["Very Low", "Low", "Moderate", "High", "Very High"],
      },
      learning: {
        type: String,
        enum: ["Nothing", "A Little", "Some", "A Lot", "Significant Amount"],
      },
      recommendation: {
        type: String,
        enum: [
          "Strongly Disagree",
          "Disagree",
          "Neutral",
          "Agree",
          "Strongly Agree",
        ],
      },
      attentionCheck1: {
        type: String,
        enum: [
          "Strongly disagree",
          "Disagree",
          "Neutral",
          "Agree",
          "Strongly agree",
        ],
      },
      attentionCheck2: {
        type: String,
        enum: ["Jack", "Adam", "Mark", "Anna"],
      },
      feedback: {
        type: String,
        maxlength: 500,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "user" }
);
export const User = mongoose.models.User || mongoose.model("User", userSchema);
