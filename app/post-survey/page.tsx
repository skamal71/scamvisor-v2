"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/modal";

interface PostSurveyResponses {
  // Likert Scale - Website Experience
  websiteEasyToUnderstand: string;
  websiteEnjoyableToUse: string;
  websiteHelpedUnderstandScams: string;
  // Likert Scale - Scam Understanding
  understandScamTactics: string;
  identifyScamParts: string;
  attentionCheckScam: string;
  // Likert Scale - Confidence in Scam Detection
  confidentDetectScams: string;
  confidentPreventScams: string;
  confidentRecognizeScammed: string;
  tellDifferenceMessages: string;
  // Text input questions
  learnedAboutScams: string;
  additionalLearning: string;
  // Scenario-based likert questions
  redCrossDonation: string;
  uberDownload: string;
  phoneCompanyUpgrade: string;
  lawEnforcementWarrant: string;
  itRemoteAccess: string;
  socialMediaVacation: string;
  unclaimedProperty: string;
  appStoreZipCode: string;
  // Image-based scam assessment questions
  scamChat1Assessment: string;
  scamChat1Confidence: string;
  scamChat1Compliance: string;
  scamChat2Assessment: string;
  scamChat2Confidence: string;
  scamChat2Compliance: string;
  scamChat3Assessment: string;
  scamChat3Confidence: string;
  scamChat3Compliance: string;
  scamChat4Assessment: string;
  scamChat4Confidence: string;
  scamChat4Compliance: string;
  scamChat5Assessment: string;
  scamChat5Confidence: string;
  scamChat5Compliance: string;
  scamChat6Assessment: string;
  scamChat6Confidence: string;
  scamChat6Compliance: string;
  scamChat7Assessment: string;
  scamChat7Confidence: string;
  scamChat7Compliance: string;
  scamChat8Assessment: string;
  scamChat8Confidence: string;
  scamChat8Compliance: string;
  scamChat9Assessment: string;
  scamChat9Confidence: string;
  scamChat9Compliance: string;
  scamChat10Assessment: string;
  scamChat10Confidence: string;
  scamChat10Compliance: string;
  scamChat11Assessment: string;
  scamChat11Confidence: string;
  scamChat11Compliance: string;
  scamChat12Assessment: string;
  scamChat12Confidence: string;
  scamChat12Compliance: string;
  // Final feedback question
  feedback: string;
}

export default function PostSurveyPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [postSurveyStartedAt, setPostSurveyStartedAt] = useState<Date | null>(
    null
  );
  // Initialize responses from localStorage or empty state
  const getInitialResponses = (): PostSurveyResponses => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("postSurveyResponses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved responses:", e);
        }
      }
    }

    return {
      // Likert Scale - Website Experience
      websiteEasyToUnderstand: "",
      websiteEnjoyableToUse: "",
      websiteHelpedUnderstandScams: "",
      // Likert Scale - Scam Understanding
      understandScamTactics: "",
      identifyScamParts: "",
      attentionCheckScam: "",
      // Likert Scale - Confidence in Scam Detection
      confidentDetectScams: "",
      confidentPreventScams: "",
      confidentRecognizeScammed: "",
      tellDifferenceMessages: "",
      // Text input questions
      learnedAboutScams: "",
      additionalLearning: "",
      // Scenario-based likert questions
      redCrossDonation: "",
      uberDownload: "",
      phoneCompanyUpgrade: "",
      lawEnforcementWarrant: "",
      itRemoteAccess: "",
      socialMediaVacation: "",
      unclaimedProperty: "",
      appStoreZipCode: "",
      // Image-based scam assessment questions
      scamChat1Assessment: "",
      scamChat1Confidence: "",
      scamChat1Compliance: "",
      scamChat2Assessment: "",
      scamChat2Confidence: "",
      scamChat2Compliance: "",
      scamChat3Assessment: "",
      scamChat3Confidence: "",
      scamChat3Compliance: "",
      scamChat4Assessment: "",
      scamChat4Confidence: "",
      scamChat4Compliance: "",
      scamChat5Assessment: "",
      scamChat5Confidence: "",
      scamChat5Compliance: "",
      scamChat6Assessment: "",
      scamChat6Confidence: "",
      scamChat6Compliance: "",
      scamChat7Assessment: "",
      scamChat7Confidence: "",
      scamChat7Compliance: "",
      scamChat8Assessment: "",
      scamChat8Confidence: "",
      scamChat8Compliance: "",
      scamChat9Assessment: "",
      scamChat9Confidence: "",
      scamChat9Compliance: "",
      scamChat10Assessment: "",
      scamChat10Confidence: "",
      scamChat10Compliance: "",
      scamChat11Assessment: "",
      scamChat11Confidence: "",
      scamChat11Compliance: "",
      scamChat12Assessment: "",
      scamChat12Confidence: "",
      scamChat12Compliance: "",
      // Final feedback question
      feedback: "",
    };
  };

  const [responses, setResponses] =
    useState<PostSurveyResponses>(getInitialResponses);
  const [loading, setLoading] = useState(false);

  // Function to save responses to localStorage
  const saveResponsesToStorage = (newResponses: PostSurveyResponses) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("postSurveyResponses", JSON.stringify(newResponses));
    }
  };

  // Wrapper function to update responses and save to localStorage
  const updateResponses = (updates: Partial<PostSurveyResponses>) => {
    const newResponses = { ...responses, ...updates };
    setResponses(newResponses);
    saveResponsesToStorage(newResponses);
  };
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [likertResponses, setLikertResponses] = useState<{
    [key: string]: string;
  }>({});
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshWarningEnabled, setRefreshWarningEnabled] = useState(true);
  const [randomizedQuestions, setRandomizedQuestions] = useState<
    typeof questions
  >([]);
  const [currentImageQuestionIndex, setCurrentImageQuestionIndex] = useState(0);
  const [imageQuestionResponses, setImageQuestionResponses] = useState<
    Record<string, string>
  >({});
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);

  // Function to get border color for scamChat images (questions 14-24)
  const getScamChatBorderColor = (scamChatId: string) => {
    const chatNumber = scamChatId.replace("scamChat", "");
    const colors = [
      "border-red-500", // scamChat1 - Red
      "border-blue-500", // scamChat2 - Blue
      "border-green-600", // scamChat3 - Green
      "border-yellow-600", // scamChat4 - Yellow
      "border-purple-500", // scamChat5 - Purple
      "border-pink-500", // scamChat6 - Pink
      "border-blue-300", // scamChat7 - Indigo
      "border-black", // scamChat8 - black
      "border-teal-300", // scamChat9 - Teal
      "border-orange-500", // scamChat10 - Orange
      "border-indigo-600", // scamChat11 - Indigo
      "border-emerald-500", // scamChat12 - Emerald
    ];
    const index = parseInt(chatNumber) - 1;
    return colors[index] || "border-gray-500";
  };

  // Store references to event handlers
  const beforeUnloadHandler = useRef<
    ((e: BeforeUnloadEvent) => string | undefined) | null
  >(null);
  const keyDownHandler = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    setIsVisible(true);

    // Prevent multiple auth checks
    if (hasCheckedAuth) return;

    // Check if user is authenticated
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((user) => {
        setHasCheckedAuth(true);

        if (user.error) {
          // If unauthorized, redirect to sign-in
          window.location.href = "/sign-in";
          return;
        }

        // If user has already completed the post-survey, redirect to sign-out
        if (user.hasCompletedPostSurvey) {
          window.location.href = "/sign-out";
          return;
        }

        // Only check if user has completed pre-survey, don't check other steps
        // This prevents infinite loops when session storage is cleared
        if (!user.hasCompletedPreSurvey) {
          window.location.href = "/survey";
          return;
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        setHasCheckedAuth(true);
        window.location.href = "/sign-in";
      });
  }, [hasCheckedAuth]);

  // Prevent back navigation by pushing current state
  useEffect(() => {
    // Push current state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
  }, []);

  // Handle refresh warning and clear localStorage on refresh/back
  useEffect(() => {
    if (!refreshWarningEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "Please do not refresh or navigate away from the post-survey. Your progress will be lost and you might not get the compensation for completion.";
      e.preventDefault();
      return message;
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

    // Handle browser back button
    const handlePopState = () => {
      // Show warning modal instead of redirecting
      setShowBackWarning(true);
      // Push current state back to prevent actual navigation
      window.history.pushState(null, "", window.location.href);
    };

    // Store references to handlers
    beforeUnloadHandler.current = handleBeforeUnload;
    keyDownHandler.current = handleKeyDown;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [refreshWarningEnabled]);

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer("");
    // Reset image question state when moving to a new image question
    if (currentQ && currentQ.type === "image") {
      setCurrentImageQuestionIndex(0);
      setImageQuestionResponses({});
    }
  }, [currentQuestion]);

  // Randomize scenario questions and image questions on component mount
  useEffect(() => {
    // Separate scenario questions and image questions from other questions
    const scenarioQuestions = questions.filter((q) => q.likertScale);
    const imageQuestions = questions.filter((q) => q.type === "image");
    const otherQuestions = questions.filter(
      (q) => !q.likertScale && q.type !== "image"
    );

    // Shuffle scenario questions and image questions separately
    const shuffledScenarioQuestions = [...scenarioQuestions].sort(
      () => Math.random() - 0.5
    );
    const shuffledImageQuestions = [...imageQuestions].sort(
      () => Math.random() - 0.5
    );

    // Combine other questions with randomized scenario questions and image questions
    const finalQuestions = [
      ...otherQuestions,
      ...shuffledScenarioQuestions,
      ...shuffledImageQuestions,
    ];

    setRandomizedQuestions(finalQuestions);
  }, []);

  const questions = [
    // Likert Scale - Website Experience
    {
      id: "websiteExperience",
      question: " ",
      description:
        "Please rate how much you agree with each statement by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "websiteEasyToUnderstand",
          question: "The website was easy to understand",
        },
        {
          id: "websiteEnjoyableToUse",
          question: "The website was enjoyable to use",
        },
        {
          id: "websiteHelpedUnderstandScams",
          question: "The website helped me understand how scams work",
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
    // Likert Scale - Scam Understanding
    {
      id: "scamUnderstanding",
      question: " ",
      description:
        "Please rate how much you agree with each statement by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "understandScamTactics",
          question:
            "I understand the tactics that scammers use to build trust or create urgency.",
        },
        {
          id: "identifyScamParts",
          question:
            "I can identify different parts of a scam, from trust-building and manipulation to extraction.",
        },
        {
          id: "attentionCheckScam",
          question: 'If you are reading this, select "Strongly agree"',
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
    // Likert Scale - Confidence in Scam Detection
    {
      id: "confidenceInDetection",
      question: " ",
      description:
        "Please rate how much you agree with each statement by selecting the appropriate option.",
      type: "likert",
      questions: [
        {
          id: "confidentDetectScams",
          question: "I am confident I can successfully detect potential scams.",
        },
        {
          id: "confidentPreventScams",
          question:
            "I am confident I can successfully prevent myself from being scammed.",
        },
        {
          id: "confidentRecognizeScammed",
          question: "I am confident I can recognize that I have been scammed.",
        },
        {
          id: "tellDifferenceMessages",
          question:
            "Compared to other people, I can tell the difference between messages from people I know and people I don't know.",
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
    {
      id: "learnedAboutScams",
      question:
        "In 1-2 sentences, briefly describe what you have learned about scams after using our website.",
      options: [],
      textInput: true,
    },
    {
      id: "additionalLearning",
      question:
        "Is there something you would like to learn about that the website did not cover?",
      options: [],
      textInput: true,
    },
    // Scenario-based questions (will be randomized)
    {
      id: "redCrossDonation",
      question:
        "A volunteer from the American Red Cross calls and informs you that donations are being collected to assist individuals who were affected by the hurricane in Puerto Rico. The volunteer states that a goal has been set and they really need your help to reach that goal; the contribution must be made today. Contributions can be made via check, credit card, or prepaid debit card. Do you send them the money?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "uberDownload",
      question:
        "You cannot find a taxi and are in a rush to get the airport. Your travel companion recommends that you take an Uber but you do not have the app. Would you download the app and enter your credit card information?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "phoneCompanyUpgrade",
      question:
        "A representative from your phone company calls and indicates that your $45 monthly contract will end soon. They offer to upgrade you to a new phone and send you paperwork. Would you provide your email address so they can send the paperwork?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "lawEnforcementWarrant",
      question:
        "You receive a phone call from law enforcement stating that a warrant has been issued for your arrest because you missed jury duty. The caller ID appears authentic. The caller asks that you provide your birth date and Social Security Number to verify your identity. Do you provide the information to avoid being arrested because it is possible that you could have missed the call for jury in the mail?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "itRemoteAccess",
      question:
        "You are at work, and someone from your IT Department calls you on the intercom because your computer's operating system is out of date. Do you allow this person to remotely access your computer and proceed with the update?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "socialMediaVacation",
      question:
        "You met an attractive person on social media and exchanged emails over the course of two months. You looked them up on Facebook and there is nothing suspicious. You like what you discover about this person and agree to go on vacation together. This person offers to arrange the entire trip and asks you to write your half of the money. Would you wire the money?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "unclaimedProperty",
      question:
        "You get an email telling you that you have thousands of dollars in unclaimed property being held by the state and waiting to be accessed. They provide a link to pay a fee for their assistance in locating your funds. Would you pay the fee to get your unclaimed money?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    {
      id: "appStoreZipCode",
      question:
        "You want to download an app from the Apple store. In order to complete the download you must enter the zip code. Would you provide the information?",
      options: [
        "Extremely Unlikely",
        "Unlikely",
        "Slightly Unlikely",
        "Either",
        "Slightly Likely",
        "Likely",
        "Extremely Likely",
      ],
      likertScale: true,
    },
    // Image-based scam assessment questions (will be randomized)
    {
      id: "scamChat1",
      type: "image",
      imageSrc: "/scamChat1.png",
      questions: [
        {
          id: "scamChat1Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat1Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat1Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat2",
      type: "image",
      imageSrc: "/scamChat2.png",
      questions: [
        {
          id: "scamChat2Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat2Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat2Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat3",
      type: "image",
      imageSrc: "/scamChat3.png",
      questions: [
        {
          id: "scamChat3Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat3Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat3Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat4",
      type: "image",
      imageSrc: "/scamChat4.png",
      questions: [
        {
          id: "scamChat4Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat4Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat4Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action? ",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat5",
      type: "image",
      imageSrc: "/scamChat5.png",
      questions: [
        {
          id: "scamChat5Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat5Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat5Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat6",
      type: "image",
      imageSrc: "/scamChat6.png",
      questions: [
        {
          id: "scamChat6Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat6Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat6Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat7",
      type: "image",
      imageSrc: "/scamChat7.png",
      questions: [
        {
          id: "scamChat7Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat7Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat7Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat8",
      type: "image",
      imageSrc: "/scamChat8.png",
      questions: [
        {
          id: "scamChat8Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat8Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat8Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat9",
      type: "image",
      imageSrc: "/scamChat9.png",
      questions: [
        {
          id: "scamChat9Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat9Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat9Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat10",
      type: "image",
      imageSrc: "/scamChat10.png",
      questions: [
        {
          id: "scamChat10Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat10Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat10Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat11",
      type: "image",
      imageSrc: "/scamChat11.png",
      questions: [
        {
          id: "scamChat11Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat11Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat11Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
    {
      id: "scamChat12",
      type: "image",
      imageSrc: "/scamChat12.png",
      questions: [
        {
          id: "scamChat12Assessment",
          question:
            "Please choose the option that best describes this interaction.",
          options: ["Scam", "Not a scam"],
          type: "multiple-choice",
        },
        {
          id: "scamChat12Confidence",
          question: "How confident are you in your assessment?",
          options: [
            "Not at all confident",
            "Slightly confident",
            "Moderately confident",
            "Very confident",
            "Extremely confident",
          ],
          type: "likert-scale",
        },
        {
          id: "scamChat12Compliance",
          question:
            "How likely are you to respond to the sender or take the requested action?",
          options: [
            "Not at all likely",
            "Slightly likely",
            "Moderately likely",
            "Very likely",
            "Extremely likely",
          ],
          type: "likert-scale",
        },
      ],
    },
  ];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleLikertResponse = (questionId: string, value: number) => {
    setLikertResponses((prev) => ({
      ...prev,
      [questionId]: value.toString(),
    }));
  };

  const handleNext = () => {
    const currentQ =
      randomizedQuestions[currentQuestion] || questions[currentQuestion];

    if (currentQ.type === "likert") {
      // Handle likert responses
      if (!currentQ.questions.every((question) => likertResponses[question.id]))
        return;

      // Save all likert responses for this group
      const likertUpdates: Partial<PostSurveyResponses> = {};
      currentQ.questions.forEach((question) => {
        const questionId = question.id as keyof PostSurveyResponses;
        likertUpdates[questionId] = likertResponses[question.id];
      });
      updateResponses(likertUpdates);
    } else if (currentQ.likertScale) {
      // Handle individual likert scale questions
      if (!selectedAnswer) return;

      const questionId = currentQ.id as keyof PostSurveyResponses;
      updateResponses({ [questionId]: selectedAnswer });
    } else if (currentQ.type === "image") {
      // Handle image questions - save all three responses at once
      if (!currentQ.questions.every((q) => imageQuestionResponses[q.id]))
        return;

      // Save all sub-question responses
      const imageUpdates: Partial<PostSurveyResponses> = {};
      currentQ.questions.forEach((subQuestion) => {
        const questionId = subQuestion.id as keyof PostSurveyResponses;
        imageUpdates[questionId] = imageQuestionResponses[subQuestion.id];
      });
      updateResponses(imageUpdates);

      // Reset for next image
      setCurrentImageQuestionIndex(0);
      setImageQuestionResponses({});
    } else {
      // Special handling for text input questions
      if (currentQ.id === "learnedAboutScams") {
        if (!responses.learnedAboutScams.trim()) return;
        // Don't need to set responses here as it's already set via the textarea onChange
      } else if (currentQ.id === "additionalLearning") {
        if (!responses.additionalLearning.trim()) return;
        // Don't need to set responses here as it's already set via the textarea onChange
      } else {
        if (!selectedAnswer) return;

        const questionId = currentQ.id as keyof PostSurveyResponses;
        updateResponses({ [questionId]: selectedAnswer });
      }
    }

    if (
      currentQuestion <
      (randomizedQuestions.length || questions.length) - 1
    ) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Move to feedback question
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleFeedbackSubmit = () => {
    if (responses.feedback.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/post-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postSurveyResponses: responses,
          postSurveyStartedAt,
          postSurveyEndedAt: new Date(),
        }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to submit post-survey");
      }

      // Clear localStorage after successful submission
      if (typeof window !== "undefined") {
        localStorage.removeItem("postSurveyResponses");
      }

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

      // Redirect to sign-out page instead of directly signing out
      window.location.href = "/sign-out";
    } catch (error) {
      console.error("Post-survey submission error:", error);
      setLoading(false);
    }
  };

  const currentQ =
    randomizedQuestions[currentQuestion] || questions[currentQuestion];

  // Scroll detection for image questions
  useEffect(() => {
    if (currentQ && currentQ.type === "image") {
      const contentArea = document.querySelector(".overflow-y-scroll");
      if (contentArea) {
        const checkIfAtBottom = () => {
          const { scrollTop, scrollHeight, clientHeight } =
            contentArea as HTMLElement;
          const isBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
          setShowScrollIndicator(!isBottom);
        };

        contentArea.addEventListener("scroll", checkIfAtBottom);
        // Initial check
        checkIfAtBottom();

        return () => {
          contentArea.removeEventListener("scroll", checkIfAtBottom);
        };
      }
    } else {
      setShowScrollIndicator(false);
    }
  }, [currentQ]);

  // Helper function to check if Next button should be enabled
  const canProceed = () => {
    if (currentQ.type === "likert") {
      // Check if all likert questions in this group are answered
      return currentQ.questions.every(
        (question) => likertResponses[question.id]
      );
    }

    if (currentQ.likertScale) {
      // Check if the individual likert scale question is answered
      return selectedAnswer;
    }

    if (currentQ.type === "image") {
      // Check if all three sub-questions are answered
      return currentQ.questions.every((q) => imageQuestionResponses[q.id]);
    }

    if (currentQ.id === "learnedAboutScams") {
      return responses.learnedAboutScams.trim().length > 0;
    }

    if (currentQ.id === "additionalLearning") {
      return responses.additionalLearning.trim().length > 0;
    }

    // Fallback for any other question types
    return selectedAnswer || false;
  };

  // When the post-survey actually starts (first question shown), set the start time
  useEffect(() => {
    if (postSurveyStartedAt === null && currentQuestion === 0 && isVisible) {
      setPostSurveyStartedAt(new Date());
    }
  }, [currentQuestion, isVisible, postSurveyStartedAt]);

  // Auto-scroll to top when question changes
  useEffect(() => {
    const contentArea = document.querySelector(".overflow-y-scroll");
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestion]);

  return (
    <div
      className={`min-h-screen bg-indigo-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-7xl h-[95vh] p-8 bg-white rounded-2xl shadow-lg flex flex-col">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of{" "}
              {(randomizedQuestions.length || questions.length) + 1}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(
                ((currentQuestion + 1) /
                  ((randomizedQuestions.length || questions.length) + 1)) *
                  100
              )}
              %
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    ((randomizedQuestions.length || questions.length) + 1)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {currentQuestion < (randomizedQuestions.length || questions.length)
              ? currentQ.question
              : "What is one thing you would change about our website to make it more informative?"}
          </h2>
          {currentQ && currentQ.description && (
            <p className="text-lg text-gray-600 mb-6 font-semibold">
              {currentQ.description}
            </p>
          )}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-scroll">
          {/* Options or Feedback Input */}
          {currentQuestion <
          (randomizedQuestions.length || questions.length) ? (
            <>
              {currentQ.type === "likert" ? (
                // Likert scale format
                <div className="space-y-6">
                  {/* Scale Header */}
                  <div className="mb-8">
                    <div className="grid grid-cols-7 gap-2 items-center">
                      <div className="col-span-2"></div>
                      {currentQ.scaleOptions?.map((option, index) => (
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
                      className="border-b border-gray-200 pb-6"
                    >
                      <div className="grid grid-cols-7 gap-2 items-center">
                        <div className="col-span-2">
                          <p className="text-lg text-gray-800 font-semibold">
                            {likertQuestion.question}
                          </p>
                        </div>
                        {currentQ.scaleOptions?.map((_, index) => (
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
              ) : currentQ.likertScale ? (
                // Individual likert scale questions (7-point scale)
                <div className="space-y-6">
                  {/* Scale Header */}
                  <div className="mb-8">
                    <div className="flex justify-center w-full">
                      <div className="flex justify-between items-center w-full max-w-7xl px-16">
                        {currentQ.options.map((option, index) => (
                          <div key={index} className="text-center flex-1">
                            <div className="text-md text-gray-800 mb-4 leading-tight">
                              {option}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Single Likert Question */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex justify-center w-full">
                      <div className="flex justify-between items-center w-full max-w-7xl px-16">
                        {currentQ.options.map((_, index) => (
                          <div key={index} className="text-center flex-1">
                            <button
                              onClick={() =>
                                handleAnswerSelect(currentQ.options[index])
                              }
                              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                selectedAnswer === currentQ.options[index]
                                  ? "bg-indigo-600 scale-125"
                                  : "bg-white hover:bg-indigo-500 border-2 border-black-300"
                              }`}
                            ></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentQ.type === "image" ? (
                // Image-based question format
                <div className="space-y-8">
                  {/* Image Display */}
                  <div className="flex justify-center mb-6">
                    <div
                      className={`p-3 border-4 rounded-lg ${getScamChatBorderColor(
                        currentQ.id
                      )}`}
                    >
                      <img
                        src={currentQ.imageSrc}
                        alt="Scam chat conversation"
                        className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  </div>

                  {/* All three questions for this image */}
                  {currentQ.questions &&
                    currentQ.questions.map((subQuestion, subIndex) => (
                      <div
                        key={subIndex}
                        className={`space-y-4 ${
                          subIndex < currentQ.questions.length - 1
                            ? " border-gray-200 pb-2"
                            : ""
                        }`}
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subQuestion.question}
                        </h3>

                        {"type" in subQuestion &&
                        subQuestion.type === "multiple-choice" ? (
                          // Multiple choice format
                          <div className="space-y-3">
                            {subQuestion.options?.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setImageQuestionResponses((prev) => ({
                                    ...prev,
                                    [subQuestion.id]: option,
                                  }));
                                }}
                                disabled={loading}
                                className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  imageQuestionResponses[subQuestion.id] ===
                                  option
                                    ? "border-indigo-600 bg-indigo-100 text-indigo-900"
                                    : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : "type" in subQuestion &&
                          subQuestion.type === "likert-scale" ? (
                          // Likert scale format
                          <div className="space-y-6">
                            {/* Scale Header */}
                            <div className="mb-8">
                              <div className="flex justify-center w-full">
                                <div className="flex justify-between items-center w-full max-w-7xl px-16">
                                  {subQuestion.options?.map((option, index) => (
                                    <div
                                      key={index}
                                      className="text-center flex-1"
                                    >
                                      <div className="text-sm text-gray-800 mb-4 leading-tight">
                                        {option}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Likert Scale */}
                            <div className="border-b border-gray-200 pb-6">
                              <div className="flex justify-center w-full">
                                <div className="flex justify-between items-center w-full max-w-7xl px-16">
                                  {subQuestion.options?.map((_, index) => (
                                    <div
                                      key={index}
                                      className="text-center flex-1"
                                    >
                                      <button
                                        onClick={() => {
                                          setImageQuestionResponses((prev) => ({
                                            ...prev,
                                            [subQuestion.id]:
                                              subQuestion.options[index],
                                          }));
                                        }}
                                        className={`w-4 h-4 rounded-full transition-all duration-200 ${
                                          imageQuestionResponses[
                                            subQuestion.id
                                          ] === subQuestion.options[index]
                                            ? "bg-indigo-600 scale-125"
                                            : "bg-white hover:bg-indigo-500 border-2 border-black-300"
                                        }`}
                                      ></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : // Regular question format or text input
              currentQ.textInput ? (
                // Text input format
                <div className="space-y-4">
                  <textarea
                    value={
                      currentQ.id === "learnedAboutScams"
                        ? responses.learnedAboutScams
                        : responses.additionalLearning
                    }
                    onChange={(e) =>
                      updateResponses({ [currentQ.id]: e.target.value })
                    }
                    placeholder={
                      currentQ.id === "learnedAboutScams"
                        ? "Please describe what you have learned about scams..."
                        : "Please describe what additional topics you would like to learn about..."
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                    rows={3}
                    maxLength={300}
                    disabled={loading}
                  />
                  <div className="text-sm text-gray-500 text-right">
                    {
                      (currentQ.id === "learnedAboutScams"
                        ? responses.learnedAboutScams
                        : responses.additionalLearning
                      ).length
                    }
                    /300 characters
                  </div>
                </div>
              ) : (
                // Regular multiple choice format
                <div className="space-y-3 mb-6">
                  {currentQ.options?.map((option, index) => (
                    <button
                      key={index}
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
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <textarea
                value={responses.feedback}
                onChange={(e) => updateResponses({ feedback: e.target.value })}
                placeholder="Please share any additional thoughts, suggestions, or feedback about your experience..."
                className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-indigo-300 focus:outline-none"
                rows={4}
                maxLength={500}
                disabled={loading}
              />
              <div className="text-sm text-gray-500 text-right">
                {responses.feedback.length}/500 characters
              </div>
              <button
                onClick={handleFeedbackSubmit}
                disabled={loading || !responses.feedback.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-2xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit & Complete Study"}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons - Fixed at Bottom */}
        {currentQuestion < (randomizedQuestions.length || questions.length) && (
          <div className="flex justify-end items-center mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleNext}
              disabled={loading || !canProceed()}
              className={`w-32 px-8 py-3 rounded-3xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                canProceed()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Submitting responses...</p>
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-500 text-white px-4 py-2 rounded-3xl shadow-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">scroll down</span>
          </div>
        </div>
      )}

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
                  // Clear localStorage and sessionStorage before redirecting
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("postSurveyResponses");
                    // Clear session storage items that might cause navigation issues
                    // But keep chatCompleted so we know they've completed the chat
                    sessionStorage.removeItem("videoWatched");
                    sessionStorage.removeItem("assignedVideo");
                    sessionStorage.removeItem("assignedChatModel");
                    sessionStorage.removeItem("assignedScenario");
                    // Don't clear chatCompleted - keep it so they can access post-survey
                  }
                  // Redirect to attention-check page instead of reloading to avoid loops
                  window.location.href = "/attention-check";
                }}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Back Button Warning Modal */}
      {showBackWarning && (
        <Modal
          isOpen={showBackWarning}
          onClose={() => setShowBackWarning(false)}
        >
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ⚠️ Warning: You clicked the "Back" button
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              If you click on "Go Back Anyway", it will restart your post-survey
              from the beginning. All your current progress will be lost and you
              might not get the compensation for completion.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowBackWarning(false)}
                className="bg-gray-500 text-white py-2 px-6 rounded-3xl hover:bg-gray-600 transition-colors"
              >
                Continue Survey
              </button>
              <button
                onClick={() => {
                  setShowBackWarning(false);
                  // Clear everything and restart post-survey
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("postSurveyResponses");
                    // Clear session storage items that might cause navigation issues
                    // But keep chatCompleted so we know they've completed the chat
                    sessionStorage.removeItem("videoWatched");
                    sessionStorage.removeItem("assignedVideo");
                    sessionStorage.removeItem("assignedChatModel");
                    sessionStorage.removeItem("assignedScenario");
                    // Don't clear chatCompleted - keep it so they can access post-survey

                    // Redirect to attention-check page instead of post-survey to avoid loops
                    window.location.href = "/attention-check";
                  }
                }}
                className="bg-red-600 text-white py-2 px-6 rounded-3xl hover:bg-red-700 transition-colors"
              >
                Go Back Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
