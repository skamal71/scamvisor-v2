"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/toast";
import Modal from "@/components/ui/modal";

interface SurveyResponses {
  age: string;
  gender: string;
  genderSelfDescription: string;
  education: string;
  educationSelfDescription: string;
  occupation: string;
  hispanicOrigin: string;
  raceEthnicity: string;
  raceEthnicitySelfDescription: string;
  scamMessageFrequency: string;
  scamDetectionMethods: string[];
  scamDetectionOther: string;
  personalScamImpact: string;
  scamImpactTiming: string;
  scamImpactDescription: string;
  confidence: string;
  // Likert Scale 1 - Technology Skills
  openDownloadedFiles: string;
  downloadSavePhoto: string;
  useShortcutKeys: string;
  openNewTab: string;
  bookmarkWebsite: string;
  // Likert Scale 2 - Online Navigation
  hardDecideKeywords: string;
  hardFindWebsite: string;
  tiredLookingOnline: string;
  endUpWebsites: string;
  confusingWebsiteDesign: string;
  // Likert Scale 3 - Online Privacy
  knowWhatToShare: string;
  knowWhenToShare: string;
  appropriateComments: string;
  changeSharingSettings: string;
  removeFriends: string;
  // Likert Scale 4 - Content Creation
  createFromExisting: string;
  modifyContent: string;
  designWebsite: string;
  knowLicenses: string;
  confidentVideoContent: string;
  // Likert Scale 5 - Mobile Apps
  installMobileApps: string;
  downloadMobileApps: string;
  trackMobileAppCosts: string;
  attentionCheckMobile: string;
  // Likert Scale 6 - Text Messaging Behavior
  replyUnknownTexts: string;
  difficultyEndingTexts: string;
  tooGoodToBeTrue: string;
}

export default function SurveyPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<SurveyResponses>({
    age: "",
    gender: "",
    genderSelfDescription: "",
    education: "",
    educationSelfDescription: "",
    occupation: "",
    hispanicOrigin: "",
    raceEthnicity: "",
    raceEthnicitySelfDescription: "",
    scamMessageFrequency: "",
    scamDetectionMethods: [],
    scamDetectionOther: "",
    personalScamImpact: "",
    scamImpactTiming: "",
    scamImpactDescription: "",
    confidence: "",
    // Likert Scale 1 - Technology Skills
    openDownloadedFiles: "",
    downloadSavePhoto: "",
    useShortcutKeys: "",
    openNewTab: "",
    bookmarkWebsite: "",
    // Likert Scale 2 - Online Navigation
    hardDecideKeywords: "",
    hardFindWebsite: "",
    tiredLookingOnline: "",
    endUpWebsites: "",
    confusingWebsiteDesign: "",
    // Likert Scale 3 - Online Privacy
    knowWhatToShare: "",
    knowWhenToShare: "",
    appropriateComments: "",
    changeSharingSettings: "",
    removeFriends: "",
    // Likert Scale 4 - Content Creation
    createFromExisting: "",
    modifyContent: "",
    designWebsite: "",
    knowLicenses: "",
    confidentVideoContent: "",
    // Likert Scale 5 - Mobile Apps
    installMobileApps: "",
    downloadMobileApps: "",
    trackMobileAppCosts: "",
    attentionCheckMobile: "",
    // Likert Scale 6 - Text Messaging Behavior
    replyUnknownTexts: "",
    difficultyEndingTexts: "",
    tooGoodToBeTrue: "",
  });
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [likertResponses, setLikertResponses] = useState<{
    [key: string]: string;
  }>({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshWarningEnabled, setRefreshWarningEnabled] = useState(true);
  const [preSurveyStartedAt, setPreSurveyStartedAt] = useState<Date | null>(
    null
  );
  const [consentChecked, setConsentChecked] = useState(false);

  // Store references to event handlers
  const beforeUnloadHandler = useRef<
    ((e: BeforeUnloadEvent) => string | undefined) | null
  >(null);
  const keyDownHandler = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    setIsVisible(true);

    // Show sign-in successful toast
    setShowToast(true);

    // Clear session storage when entering survey page to ensure clean state
    sessionStorage.removeItem("surveyCompleted");
    sessionStorage.removeItem("chatCompleted");
    sessionStorage.removeItem("videoWatched");

    // Check if user is authenticated
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((user) => {
        if (user.error) {
          // If unauthorized, redirect to sign-in
          window.location.href = "/sign-in";
          return;
        }

        // If user has already completed the survey, redirect to chat
        if (user.hasCompletedPreSurvey) {
          window.location.href = "/chatqal";
          return;
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        window.location.href = "/sign-in";
      });
  }, []);

  // Handle refresh warning
  useEffect(() => {
    if (!refreshWarningEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if the user is actually trying to refresh or close the page
      // Check if this is a legitimate navigation within the app
      const isLegitimateNavigation =
        sessionStorage.getItem("legitimateNavigation") === "true";

      if (!isLegitimateNavigation) {
        const message =
          "Please do not refresh, your progress might be lost and you might not get the compensation for completion";
        e.preventDefault();
        return message;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+R, Cmd+R, or F5
      if (
        (e.ctrlKey && e.key === "r") ||
        (e.metaKey && e.key === "r") ||
        e.key === "F5"
      ) {
        e.preventDefault();
        setShowRefreshWarning(true);
      }
    };

    // Store references to handlers
    beforeUnloadHandler.current = handleBeforeUnload;
    keyDownHandler.current = handleKeyDown;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [refreshWarningEnabled]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer("");
    setSelectedAnswers([]);
    // Don't reset likert responses as they should persist within the same likert group
  }, [currentQuestion]);

  const questions = [
    {
      id: "age",
      question: "What is your age?",
      options: [],
      textInput: true,
    },
    {
      id: "gender",
      question: "What is your gender?",
      options: [
        "Male",
        "Female",
        "Non-binary",
        "Prefer not to say",
        "Prefer to self describe",
      ],
    },
    {
      id: "education",
      question: "What is your highest level of education?",
      options: [
        "Some formal education",
        "High school or equivalent",
        "Associate degree",
        "Bachelor's degree",
        "Master's degree",
        "Professional degree",
        "Doctorate degree",
        "Prefer to self-describe",
      ],
    },
    {
      id: "occupation",
      question: "What is your current occupation?",
      options: [],
      textInput: true,
    },
    {
      id: "hispanicOrigin",
      question: "Are you of Hispanic, Latino or Spanish origin?",
      options: ["Yes", "No"],
    },
    {
      id: "raceEthnicity",
      question: "How would you describe your race/ethnicity?",
      options: [
        "American Indian or Alaska Native",
        "Asian",
        "Black or African American",
        "Native Hawaiian or Other Pacific Islander",
        "White",
        "Prefer to self-describe",
      ],
    },
    {
      id: "scamMessageFrequency",
      question:
        "How often have you received messages that you believe are scams?",
      options: ["Daily", "Weekly", "Monthly", "Yearly", "Never"],
    },
    {
      id: "scamDetectionMethods",
      question:
        "How do you determine that a message is a scam? Select all options that apply.",
      options: [
        "Regular number",
        "From others' experiences",
        "Requested personal information",
        "No recent transactions",
        "Personal awareness",
        "Incorrectly identified me",
        "Never used the service",
        "I did not know the sender",
        "Unusual time",
        "Poor language or grammar",
        "Other",
      ],
      multiple: true,
    },
    {
      id: "personalScamImpact",
      question: "Have you ever personally been impacted by an online scam?",
      options: ["Yes", "No"],
    },
    {
      id: "scamImpactTiming",
      question: "When were you impacted by the scam?",
      options: [
        "In the last week",
        "In the last month",
        "In the last year",
        "Over a year ago",
      ],
    },
    {
      id: "scamImpactDescription",
      question:
        "Please describe how you were affected by the scam and anything you did afterwards to protect yourself.",
      options: [],
      textInput: true,
    },
    {
      id: "confidence",
      question: "If you are reading this, please select agree.",
      options: [
        "Strongly disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly agree",
      ],
    },
    // Likert Scale 1 - Technology Skills
    {
      id: "technologySkills",
      question: " ",
      description:
        "Please rate how true each statement is of you by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "openDownloadedFiles",
          question: "I know how to open downloaded files",
        },
        {
          id: "downloadSavePhoto",
          question: "I know how to download/save a photo I found online",
        },
        {
          id: "useShortcutKeys",
          question:
            "I know how to use shortcut keys (e.g. CTRL-C for copy, CTRL-S for save)",
        },
        {
          id: "openNewTab",
          question: "I know how to open a new tab in my browser",
        },
        {
          id: "bookmarkWebsite",
          question: "I know how to bookmark a website",
        },
      ],
      scaleOptions: [
        "Not at all true of me",
        "Not very true of me",
        "Neither true nor untrue of me",
        "Mostly true of me",
        "Very true of me",
      ],
    },
    // Likert Scale 2 - Online Navigation
    {
      id: "onlineNavigation",
      // question: "Online Navigation Assessment",
      description:
        "Please rate how true each statement is of you by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "hardDecideKeywords",
          question:
            "I find it hard to decide what the best keywords are to use for online searches",
        },
        {
          id: "hardFindWebsite",
          question: "I find it hard to find a website I have used before",
        },
        {
          id: "tiredLookingOnline",
          question: "I get tired when looking for information online",
        },
        {
          id: "endUpWebsites",
          question:
            "Sometimes I end up on websites without knowing how I get there",
        },
        {
          id: "confusingWebsiteDesign",
          question:
            "I find the way in which many websites are designed very confusing",
        },
      ],
      scaleOptions: [
        "Not at all true of me",
        "Not very true of me",
        "Neither true nor untrue of me",
        "Mostly true of me",
        "Very true of me",
      ],
    },
    // Likert Scale 3 - Online Privacy
    {
      id: "onlinePrivacy",
      // question: "Online Privacy Assessment",
      description:
        "Please rate how true each statement is of you by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "knowWhatToShare",
          question:
            "I know which information I should and shouldn't share online",
        },
        {
          id: "knowWhenToShare",
          question:
            "I know when I should and shouldn't share information online",
        },
        {
          id: "appropriateComments",
          question:
            "I am careful to make my comments and behaviors appropriate to the situation I find myself in online",
        },
        {
          id: "changeSharingSettings",
          question:
            "I know how to change who I share content with (e.g. friends, friends of friends or public)",
        },
        {
          id: "removeFriends",
          question: "I know how to remove friends from my contact lists",
        },
      ],
      scaleOptions: [
        "Not at all true of me",
        "Not very true of me",
        "Neither true nor untrue of me",
        "Mostly true of me",
        "Very true of me",
      ],
    },
    // Likert Scale 4 - Content Creation
    {
      id: "contentCreation",
      // question: "Content Creation Assessment",
      description:
        "Please rate how true each statement is of you by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "createFromExisting",
          question:
            "I know how to create something new from existing online images, music or video",
        },
        {
          id: "modifyContent",
          question:
            "I know how to make basic changes to the content that others have produced",
        },
        {
          id: "designWebsite",
          question: "I know how to design a website",
        },
        {
          id: "knowLicenses",
          question:
            "I know which different types of licenses apply to online content",
        },
        {
          id: "confidentVideoContent",
          question:
            "I would feel confident putting video content I have created online",
        },
      ],
      scaleOptions: [
        "Not at all true of me",
        "Not very true of me",
        "Neither true nor untrue of me",
        "Mostly true of me",
        "Very true of me",
      ],
    },
    // Likert Scale 5 - Mobile Apps
    {
      id: "mobileApps",
      // question: "Mobile Apps Assessment",
      description:
        "Please rate how true each statement is of you by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "installMobileApps",
          question: "I know how to install apps on a mobile device",
        },
        {
          id: "downloadMobileApps",
          question: "I know how to download apps to my mobile device",
        },

        {
          id: "attentionCheckMobile",
          question: "If you are reading this, please select Mostly true of me",
        },
        {
          id: "trackMobileAppCosts",
          question: "I know how to keep track of the costs of mobile app use",
        },
      ],
      scaleOptions: [
        "Not at all true of me",
        "Not very true of me",
        "Neither true nor untrue of me",
        "Mostly true of me",
        "Very true of me",
      ],
    },
    // Likert Scale 6 - Text Messaging Behavior
    {
      id: "textMessagingBehavior",
      // question: "Text Messaging Behavior Assessment",
      description:
        "Please rate how much you agree with each statement by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "replyUnknownTexts",
          question:
            "I reply to text messages, even if I do not know who it is from.",
        },
        {
          id: "difficultyEndingTexts",
          question:
            "I have difficulty ending a text conversation, even if the person is a telemarketer, someone I do not know, or someone I did not wish to text me.",
        },
        {
          id: "tooGoodToBeTrue",
          question: "If something sounds too good to be true, it usually is.",
        },
      ],
      scaleOptions: [
        "Strongly disagree",
        "Somewhat disagree",
        "Neither agree nor disagree",
        "Somewhat agree",
        "Strongly agree",
      ],
    },
  ];

  const handleAnswerSelect = (answer: string) => {
    const currentQ = questions[currentQuestion];

    if (currentQ.multiple) {
      // Handle multiple selections
      setSelectedAnswers((prev) => {
        if (prev.includes(answer)) {
          return prev.filter((item) => item !== answer);
        } else {
          return [...prev, answer];
        }
      });
    } else {
      // Handle single selection
      setSelectedAnswer(answer);
    }
  };

  const handleLikertResponse = (questionId: string, value: number) => {
    setLikertResponses((prev) => ({
      ...prev,
      [questionId]: value.toString(),
    }));
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    const currentQ = questions[currentQuestion];

    if (currentQ.type === "likert") {
      // Handle likert responses
      if (!currentQ.questions.every((question) => likertResponses[question.id]))
        return;

      // Save all likert responses for this group
      currentQ.questions.forEach((question) => {
        const questionId = question.id as keyof SurveyResponses;
        setResponses((prev) => ({
          ...prev,
          [questionId]: likertResponses[question.id],
        }));
      });
    } else if (currentQ.multiple) {
      if (selectedAnswers.length === 0) return;

      // Handle different multiple choice questions
      if (currentQ.id === "scamDetectionMethods") {
        setResponses((prev) => ({
          ...prev,
          scamDetectionMethods: selectedAnswers,
        }));
      }
    } else {
      // Special handling for age question (text input)
      if (currentQ.id === "age") {
        if (!responses.age.trim()) return;
        // Don't need to set responses here as it's already set via the input onChange
      } else if (currentQ.id === "occupation") {
        // Special handling for occupation question (text input)
        if (!responses.occupation.trim()) return;
        // Don't need to set responses here as it's already set via the textarea onChange
      } else if (currentQ.id === "scamImpactDescription") {
        // Special handling for scam impact description (text input)
        if (!responses.scamImpactDescription.trim()) return;
        // Don't need to set responses here as it's already set via the textarea onChange
      } else {
        // For other single choice questions
        if (!selectedAnswer) return;

        // Special handling for gender question with self-description
        if (
          currentQ.id === "gender" &&
          selectedAnswer === "Prefer to self describe"
        ) {
          if (!responses.genderSelfDescription.trim()) return;
        }

        // Special handling for education question with self-description
        if (
          currentQ.id === "education" &&
          selectedAnswer === "Prefer to self-describe"
        ) {
          if (!responses.educationSelfDescription.trim()) return;
        }

        // Special handling for race/ethnicity question with self-description
        if (
          currentQ.id === "raceEthnicity" &&
          selectedAnswer === "Prefer to self-describe"
        ) {
          if (!responses.raceEthnicitySelfDescription.trim()) return;
        }

        const questionId = currentQ.id as keyof SurveyResponses;
        setResponses((prev) => ({
          ...prev,
          [questionId]: selectedAnswer,
        }));
      }
    }

    if (currentQuestion < questions.length - 1) {
      let nextQuestionIndex = currentQuestion + 1;

      // Skip scam impact timing and description questions if user answered "No" to personal scam impact
      if (currentQ.id === "personalScamImpact" && selectedAnswer === "No") {
        // Skip the next two questions (scamImpactTiming and scamImpactDescription)
        nextQuestionIndex = currentQuestion + 3;
      }

      setCurrentQuestion(nextQuestionIndex);
    } else {
      handleSubmit();
    }
  };

  const handleStartSurvey = () => {
    setPreSurveyStartedAt(new Date()); // Set start time
    setShowWelcome(false);

    // Clear any previous session flags to ensure clean start
    sessionStorage.removeItem("chatCompleted");
    sessionStorage.removeItem("videoWatched");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log("Submitting survey responses:", responses);

      const res = await fetch("/api/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyResponses: responses,
          preSurveyStartedAt, // from state
          preSurveyEndedAt: new Date(), // submit time
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to submit survey");
      }

      const data = await res.json();
      console.log("Survey submitted successfully:", data);

      // Completely remove all refresh warning event listeners
      setRefreshWarningEnabled(false);
      window.onbeforeunload = null;

      // Remove event listeners using stored references
      if (beforeUnloadHandler.current) {
        window.removeEventListener("beforeunload", beforeUnloadHandler.current);
      }
      if (keyDownHandler.current) {
        window.removeEventListener("keydown", keyDownHandler.current);
      }

      // Set session storage flag to indicate survey is completed
      sessionStorage.setItem("surveyCompleted", "true");

      // Set flag to indicate legitimate navigation
      sessionStorage.setItem("legitimateNavigation", "true");

      // Redirect to video instructions
      window.location.href = "/video-instructions";
    } catch (error) {
      console.error("Survey submission error:", error);
      setLoading(false);
    }
  };

  const currentQ = questions[currentQuestion];

  // Auto-scroll to top when question changes
  useEffect(() => {
    const contentArea = document.querySelector(".overflow-y-scroll");
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestion]);

  // Helper function to check if Next button should be enabled
  const canProceed = () => {
    if (currentQ.type === "likert") {
      // Check if all likert questions in this group are answered
      return currentQ.questions.every(
        (question) => likertResponses[question.id]
      );
    }

    if (currentQ.multiple) {
      return selectedAnswers.length > 0;
    }

    if (currentQ.id === "age") {
      return responses.age.trim().length > 0;
    }

    if (currentQ.id === "occupation") {
      return responses.occupation.trim().length > 0;
    }

    if (currentQ.id === "scamImpactDescription") {
      return responses.scamImpactDescription.trim().length > 0;
    }

    if (!selectedAnswer) {
      return false;
    }

    // Check for required self-descriptions
    if (
      currentQ.id === "gender" &&
      selectedAnswer === "Prefer to self describe"
    ) {
      return responses.genderSelfDescription.trim().length > 0;
    }

    if (
      currentQ.id === "education" &&
      selectedAnswer === "Prefer to self-describe"
    ) {
      return responses.educationSelfDescription.trim().length > 0;
    }

    if (
      currentQ.id === "raceEthnicity" &&
      selectedAnswer === "Prefer to self-describe"
    ) {
      return responses.raceEthnicitySelfDescription.trim().length > 0;
    }

    return true;
  };

  return (
    <div
      className={`h-screen bg-indigo-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {showToast && (
        <Toast
          message="Sign-in successful!"
          duration={1500}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="w-full max-w-7xl h-[95vh] p-8 bg-white rounded-2xl shadow-lg flex flex-col">
        {showWelcome ? (
          <div className="text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="mb-5">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome!
              </h1>
              <p className="text-lg text-gray-600">
                Thank you for participating in our study. It should take
                approximately 25-30 minutes to complete. Here's what to expect:
              </p>
            </div>

            <div className=" bg-white px-42 rounded-2xl text-left">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                What to expect:
              </h3>
              <ul className="text-gray-700 space-y-2">
                {/* <li>• A consent form</li> */}
                <li>• A brief demographic survey</li>
                <li>
                  • A 5-minute instructional video that will teach skills to
                  avoid being scammed online
                </li>
                <li>• A 2-minute video of our messaging application</li>
                <li>
                  • A live conversation using our messaging application to
                  practice the skills you just learned
                </li>
                <li>• A quiz to evaluate the same skills</li>
              </ul>
            </div>

            {/* Consent Checkbox */}
            <div className="bg-white px-15 py-8 rounded-2xl border-2 border-gray-200 max-w-4xl mx-auto">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-15 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="consent"
                  className="text-md text-gray-700 leading-relaxed"
                >
                  By agreeing to participate in the study, I understand my
                  responses will be recorded and will be used for research
                  purposes. I acknowledge that my participation is voluntary and
                  I can withdraw at any time. I also understand that my data
                  will be kept confidential and used only for academic research
                  purposes.
                </label>
              </div>
            </div>

            <button
              onClick={handleStartSurvey}
              disabled={!consentChecked}
              className={`w-1/4 mx-auto py-4 px-8 rounded-4xl transition-all duration-300 text-xl font-semibold transform ${
                consentChecked
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Survey
            </button>
          </div>
        ) : (
          <>
            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-scroll">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  {/* <span className="text-sm text-gray-600">
                    {Math.round(((currentQuestion + 1) / questions.length) * 100)}
                    %
                  </span> */}
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestion + 1) / questions.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentQ.question}
                </h2>
                {currentQ.description && (
                  <p className="text-lg text-gray-900 mb-6 font-semibold">
                    {currentQ.description}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQ.type === "likert" ? (
                  // Likert scale format
                  <div className="space-y-6">
                    {/* Scale Header */}
                    <div className="mb-8">
                      <div className="grid grid-cols-7 gap-2 items-center">
                        <div className="col-span-2"></div>
                        {currentQ.scaleOptions.map((option, index) => (
                          <div key={index} className="text-center">
                            <div className="text-s text-gray-800 mb-2 leading-tight">
                              {option}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Likert Questions */}
                    {currentQ.questions.map((likertQuestion) => (
                      <div
                        key={likertQuestion.id}
                        className="border-b  border-gray-200 pb-6"
                      >
                        <div className="grid grid-cols-7 gap-2 items-center">
                          <div className="col-span-2">
                            <p className="text-lg text-gray-800 font-semibold">
                              {likertQuestion.question}
                            </p>
                          </div>
                          {currentQ.scaleOptions.map((_, index) => (
                            <div key={index} className="text-center">
                              <button
                                onClick={() =>
                                  handleLikertResponse(
                                    likertQuestion.id,
                                    index + 1
                                  )
                                }
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                  likertResponses[likertQuestion.id] ===
                                  (index + 1).toString()
                                    ? "bg-indigo-600 scale-125"
                                    : "bg-white hover:bg-indigo-500 border-2 border-black-300"
                                }`}
                              ></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Regular question format
                  currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center">
                      {currentQ.multiple ? (
                        // Checkbox for multiple selections
                        <button
                          onClick={() => handleAnswerSelect(option)}
                          disabled={loading}
                          className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                            selectedAnswers.includes(option)
                              ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                              selectedAnswers.includes(option)
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAnswers.includes(option) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          {option}
                        </button>
                      ) : (
                        // Single selection button
                        <button
                          onClick={() => handleAnswerSelect(option)}
                          disabled={loading}
                          className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedAnswer === option
                              ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                        >
                          {option}
                        </button>
                      )}
                    </div>
                  ))
                )}

                {/* Gender self-description input */}
                {currentQ.id === "gender" &&
                  selectedAnswer === "Prefer to self describe" && (
                    <div className="mt-4">
                      <textarea
                        value={responses.genderSelfDescription}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            genderSelfDescription: e.target.value,
                          }))
                        }
                        placeholder="Please describe your gender identity..."
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                        rows={3}
                        maxLength={200}
                        disabled={loading}
                      />
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {responses.genderSelfDescription.length}/200 characters
                      </div>
                    </div>
                  )}

                {/* Education self-description input */}
                {currentQ.id === "education" &&
                  selectedAnswer === "Prefer to self-describe" && (
                    <div className="mt-4">
                      <textarea
                        value={responses.educationSelfDescription}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            educationSelfDescription: e.target.value,
                          }))
                        }
                        placeholder="Please describe your highest level of education..."
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                        rows={3}
                        maxLength={200}
                        disabled={loading}
                      />
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {responses.educationSelfDescription.length}/200
                        characters
                      </div>
                    </div>
                  )}

                {/* Race/Ethnicity self-description input */}
                {currentQ.id === "raceEthnicity" &&
                  selectedAnswer === "Prefer to self-describe" && (
                    <div className="mt-4">
                      <textarea
                        value={responses.raceEthnicitySelfDescription}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            raceEthnicitySelfDescription: e.target.value,
                          }))
                        }
                        placeholder="Please describe your race/ethnicity..."
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                        rows={3}
                        maxLength={200}
                        disabled={loading}
                      />
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {responses.raceEthnicitySelfDescription.length}/200
                        characters
                      </div>
                    </div>
                  )}

                {/* Occupation text input */}
                {currentQ.id === "occupation" && (
                  <div className="mt-4">
                    <textarea
                      value={responses.occupation}
                      onChange={(e) =>
                        setResponses((prev) => ({
                          ...prev,
                          occupation: e.target.value,
                        }))
                      }
                      placeholder="e.g., student, teacher, software engineer, retired, etc."
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                      rows={3}
                      maxLength={200}
                      disabled={loading}
                    />
                    <div className="text-sm text-gray-500 text-right mt-1">
                      {responses.occupation.length}/200 characters
                    </div>
                  </div>
                )}

                {/* Scam detection methods "Other" text input */}
                {currentQ.id === "scamDetectionMethods" &&
                  selectedAnswers.includes("Other") && (
                    <div className="mt-4">
                      <textarea
                        value={responses.scamDetectionOther}
                        onChange={(e) =>
                          setResponses((prev) => ({
                            ...prev,
                            scamDetectionOther: e.target.value,
                          }))
                        }
                        placeholder="Please describe other ways you determine if a message is a scam..."
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                        rows={3}
                        maxLength={300}
                        disabled={loading}
                      />
                      <div className="text-sm text-gray-500 text-right mt-1">
                        {responses.scamDetectionOther.length}/300 characters
                      </div>
                    </div>
                  )}

                {/* Scam impact description text input */}
                {currentQ.id === "scamImpactDescription" && (
                  <div className="mt-4">
                    <textarea
                      value={responses.scamImpactDescription}
                      onChange={(e) =>
                        setResponses((prev) => ({
                          ...prev,
                          scamImpactDescription: e.target.value,
                        }))
                      }
                      placeholder="Please describe how you were affected and what you did to protect yourself..."
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                      rows={4}
                      maxLength={500}
                      disabled={loading}
                    />
                    <div className="text-sm text-gray-500 text-right mt-1">
                      {responses.scamImpactDescription.length}/500 characters
                    </div>
                  </div>
                )}

                {/* Age text input */}
                {currentQ.id === "age" && (
                  <div className="mt-4">
                    <input
                      type="number"
                      value={responses.age}
                      onChange={(e) =>
                        setResponses((prev) => ({
                          ...prev,
                          age: e.target.value,
                        }))
                      }
                      placeholder="Enter your exact age in years (e.g., 25)"
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-300 focus:outline-none"
                      min="1"
                      max="120"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Submitting survey...</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons - Fixed at Bottom */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              {/* Previous Button */}
              {currentQuestion > 0 && (
                <button
                  onClick={handlePrevious}
                  disabled={loading}
                  className="w-32 px-8 py-3 bg-gray-300 text-white rounded-3xl hover:bg-indigo-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Previous
                </button>
              )}

              {/* Next/Submit Button */}
              <div
                className={currentQuestion > 0 ? "" : "w-full flex justify-end"}
              >
                <button
                  onClick={handleNext}
                  disabled={loading || !canProceed()}
                  className={`w-32 px-8 py-3 rounded-3xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                    canProceed()
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-400 text-white cursor-not-allowed"
                  }`}
                >
                  {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Refresh Warning Modal */}
      {showRefreshWarning && (
        <Modal
          isOpen={showRefreshWarning}
          onClose={() => setShowRefreshWarning(false)}
        >
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ⚠️ Warning: Page Refresh Detected
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Please do not refresh, your progress might be lost and you might
              not get the compensation for completion.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowRefreshWarning(false)}
                className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRefreshWarning(false);
                  window.location.reload();
                }}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
