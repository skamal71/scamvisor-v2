"use client";
import React, { useEffect, useState, useRef } from "react";
import { feedbackPrompt } from "@/utils/prompts/feedbackPrompt";
import { summaryPrompt } from "@/utils/prompts/summaryPrompt";
import FormSection from "@/app/chatst/_components/FormSection";
import OutputSection from "./_components/OutputSection";
import {
  janeQuizPhase1PigPart1,
  janeQuizPhase1PigPart2,
} from "@/utils/prompts/quizonly/pigbutchering/janeQuizPhase1Pig";
import {
  janeQuizPhase2PigPart1,
  janeQuizPhase2PigPart2,
} from "@/utils/prompts/quizonly/pigbutchering/janeQuizPhase2Pig";
import {
  janeQuizPhase3PigPart1,
  janeQuizPhase3PigPart2,
} from "@/utils/prompts/quizonly/pigbutchering/janeQUizPhase3Pig";
import {
  markQuizPhase1PigPart1,
  markQuizPhase1PigPart2,
  markQuizPhase1PigPart3,
} from "@/utils/prompts/quizonly/pigbutchering/markQuizPhase1Pig";
import {
  markQuizPhase2PigPart1,
  markQuizPhase2PigPart2,
  markQuizPhase2PigPart3,
} from "@/utils/prompts/quizonly/pigbutchering/markQuizPhase2Pig";
import {
  markQuizPhase3PigPart1,
  markQuizPhase3PigPart2,
  markQuizPhase3PigPart3,
} from "@/utils/prompts/quizonly/pigbutchering/markQuizPhase3Pig";
import {
  janeQuizPhase1Part1,
  janeQuizPhase1Part2,
} from "@/utils/prompts/quizonly/janeQuizPhase1";
import {
  janeQuizPhase2Part1,
  janeQuizPhase2Part2,
} from "@/utils/prompts/quizonly/janeQuizPhase2";
import {
  janeQuizPhase3Part1,
  janeQuizPhase3Part2,
} from "@/utils/prompts/quizonly/janeQuizPhase3";
import {
  markQuizPhase1Part1,
  markQuizPhase1Part2,
  markQuizPhase1Part3,
} from "@/utils/prompts/quizonly/markQuizPhase1";
import {
  markQuizPhase2Part1,
  markQuizPhase2Part2,
  markQuizPhase2Part3,
} from "@/utils/prompts/quizonly/markQuizPhase2";
import {
  markQuizPhase3Part1,
  markQuizPhase3Part2,
  markQuizPhase3Part3,
} from "@/utils/prompts/quizonly/markQuizPhase3";
import Modal from "@/components/ui/modal";

const MESSAGE_LIMIT = 3; // Maximum number of messages from Mark

/* ---------- Local Machine conversation record ---------- */
export type Message = {
  role: "mark" | "jane" | "user" | "system";
  content: string;
};

/* ---------- Save conversation to database ---------- */
async function saveConversation(messages: Message[]) {
  try {
    const res = await fetch(`${window.location.origin}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Server error response:", errorData);
      throw new Error(
        errorData.error || `Failed to save conversation (${res.status})`
      );
    }

    const data = await res.json();
    console.log("Conversation saved successfully:", data);
  } catch (error) {
    console.error("Error saving conversation:", error);
    throw error;
  }
}

/* ---------- Save message to database ---------- */
async function saveMsg({
  Prolific_PID,
  advice,
  conversationType,
  phase,
  msg,
  influenced,
  botName,
  botType,
  conversationId,
}: {
  Prolific_PID: string | null;
  advice: string | null | undefined;
  conversationType: string | null;
  phase: number;
  msg: string;
  influenced: boolean;
  botName: string;
  botType: string;
  conversationId: string | null;
}) {
  // Only send if required fields are present
  if (!Prolific_PID || !conversationType) {
    console.error(
      "Missing Prolific_PID or conversationType, not saving message."
    );
    return;
  }
  // Always send advice as a non-empty string
  const safeAdvice =
    typeof advice === "string" && advice.trim() !== ""
      ? advice
      : "NO ADVICE PROVIDED";
  try {
    await fetch("/api/msg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Prolific_PID,
        advice: safeAdvice,
        conversationType,
        phase,
        msg,
        influenced,
        botName,
        botType,
        conversationId,
      }),
    });
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

/* ---------- Save feedback to database ---------- */
async function saveFeedback({
  Prolific_PID,
  conversationType,
  phase,
  feedback,
  conversationId,
}: {
  Prolific_PID: string;
  conversationType: string;
  phase: number;
  feedback: string;
  conversationId: string | null;
}) {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Prolific_PID,
        conversationType,
        phase,
        feedback,
        conversationId,
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save feedback");
    }
    return await res.json();
  } catch (error) {
    console.error("Error saving feedback:", error);
  }
}

/* ---------- Main component ---------- */
export default function ChatPage() {
  const markInit = useRef(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [markPromptUsed, setMarkPromptUsed] = useState(false);
  const [victimPromptUsed, setVictimPromptUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [feedback, setFeedback] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [showPostSurveyButton, setShowPostSurveyButton] = useState(false);
  const [showNextPhaseButton, setShowNextPhaseButton] = useState(false);
  const hasSaved = useRef(false);
  const [prolificPID, setProlificPID] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationType, setConversationType] = useState<string>("");
  const [conversationScenario, setConversationScenario] = useState<
    number | null
  >(null); // Will be randomly assigned
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshWarningEnabled, setRefreshWarningEnabled] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  // Store references to event handlers
  const beforeUnloadHandler = useRef<
    ((e: BeforeUnloadEvent) => string | undefined) | null
  >(null);
  const keyDownHandler = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    // Clear the legitimate navigation flag since we've successfully navigated here
    sessionStorage.removeItem("legitimateNavigation");

    // Check if user is accessing the correct chat model
    const assignedChatModel = sessionStorage.getItem("assignedChatModel");
    if (!assignedChatModel) {
      console.log(
        "No assigned chat model found, redirecting to attention check"
      );
      window.location.href = "/attention-check";
      return;
    }
    if (assignedChatModel !== "/chatst") {
      console.log(
        `User assigned to ${assignedChatModel}, redirecting from /chatst`
      );
      window.location.href = assignedChatModel;
      return;
    }

    // Trigger the fade-in effect
    setIsVisible(true);
  }, []);

  // Handle refresh warning
  useEffect(() => {
    if (!refreshWarningEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "Please do not refresh, your progress might be lost and you might not get the compensation for completion";
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

  useEffect(() => {
    // Fetch current user info from backend
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((user) => {
        console.log("Chat page - User data:", user);

        if (user.error) {
          // If unauthorized, clear session storage and redirect to sign-in
          sessionStorage.removeItem("surveyCompleted");
          window.location.href = "/sign-in";
          return;
        }

        if (user.PROLIFIC_PID) setProlificPID(user.PROLIFIC_PID);

        // Check session storage first for survey completion
        const surveyCompletedInSession =
          sessionStorage.getItem("surveyCompleted");
        console.log(
          "Chat page - Survey completed in session:",
          surveyCompletedInSession
        );
        console.log(
          "Chat page - hasCompletedPreSurvey:",
          user.hasCompletedPreSurvey
        );

        // If user has completed survey in database, check video status
        if (user.hasCompletedPreSurvey) {
          console.log("Chat page - Survey completed in database");

          // Check if user has watched the video
          const videoWatched = sessionStorage.getItem("videoWatched");
          if (videoWatched !== "true") {
            console.log("Chat page - Redirecting to video instructions");
            window.location.href = "/video-instructions";
            return;
          }

          // Check if user has completed the attention check
          if (!user.hasCompletedAttentionCheck) {
            console.log("Chat page - Redirecting to attention check");
            window.location.href = "/attention-check";
            return;
          }

          console.log("Chat page - Allowing access to chat");
          // ...determine and set conversationType...
          return;
        }

        // If survey is completed in session but NOT in database, clear session storage
        if (
          surveyCompletedInSession === "true" &&
          !user.hasCompletedPreSurvey
        ) {
          sessionStorage.removeItem("surveyCompleted");
          console.log(
            "Chat page - Cleared session storage (mismatch with database)"
          );
        }

        // For new users (no surveyCompleted in database), always clear session storage
        if (!user.hasCompletedPreSurvey) {
          sessionStorage.removeItem("surveyCompleted");
          console.log("Chat page - Cleared session storage for new user");
        }

        // Only redirect to survey if not completed in database
        if (!user.hasCompletedPreSurvey) {
          console.log("Chat page - Redirecting to survey");
          window.location.href = "/survey";
          return;
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        // Clear session storage on error and redirect to sign-in
        sessionStorage.removeItem("surveyCompleted");
        window.location.href = "/sign-in";
      });
  }, []);

  useEffect(() => {
    if (prolificPID && !conversationId) {
      // Fetch STUDY_ID from user info or context
      fetch("/api/auth/me", { credentials: "include" })
        .then((res) => res.json())
        .then(async (user) => {
          // Get assigned scenario from session storage
          const assignedScenario = sessionStorage.getItem("assignedScenario");
          // const randomScenario = assignedScenario
          //   ? parseInt(assignedScenario)
          //   : Math.floor(Math.random() * 2) + 1;
          // setConversationScenario(randomScenario);

          // This will always be the imposter scam (for pilot study)
          let randomScenario = 2;
          setConversationScenario(randomScenario);
          let type = "Unknown";
          if (randomScenario === 1) {
            type = "Pig Butchering Scam";
          } else {
            type = "Imposter Scam";
          }
          setConversationType(type);

          // Save conversation to backend
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              PROLIFIC_PID: user.PROLIFIC_PID,
              conversationType: type,
              conversationMethod: "chatst",
            }),
          });
          const data = await res.json();
          setConversationId(data.conversationID || data._id);
        });
    }
  }, [prolificPID, conversationId]);

  const generateFeedback = async (completeHistory: Message[] = chatHistory) => {
    setLoading(true);
    try {
      // First, create the evaluator persona
      const initialMessages: Message[] = [
        { role: "system", content: feedbackPrompt },
      ];

      console.log("Full chat history:", completeHistory);
      console.log("Total messages:", completeHistory.length);
      console.log(
        "Total user messages:",
        completeHistory.filter((msg) => msg.role === "user").length
      );

      // Get all messages from the current phase
      let phaseMessages: Message[] = [];

      if (currentPhase === 1) {
        // For phase 1, include all messages up to the first "Phase 1 has ended" message
        const phase1EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 1 has ended")
        );
        phaseMessages =
          phase1EndIndex === -1
            ? completeHistory
            : completeHistory.slice(0, phase1EndIndex);
      } else if (currentPhase === 2) {
        // For phase 2, include messages between Phase 1 end and Phase 2 end
        const phase1EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 1 has ended")
        );
        const phase2EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 2 has ended")
        );
        phaseMessages = completeHistory.slice(
          phase1EndIndex === -1 ? 0 : phase1EndIndex + 1,
          phase2EndIndex === -1 ? undefined : phase2EndIndex
        );
      } else if (currentPhase === 3) {
        // For phase 3, include messages after Phase 2 end
        const phase2EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 2 has ended")
        );
        phaseMessages =
          phase2EndIndex === -1
            ? []
            : completeHistory.slice(phase2EndIndex + 1);
      }

      console.log("Phase Messages:", phaseMessages);
      console.log("Number of messages in phase:", phaseMessages.length);
      console.log(
        "User messages in phase:",
        phaseMessages.filter((msg) => msg.role === "user").length
      );

      // Format the conversation for analysis
      const conversationText = phaseMessages
        .filter(
          (msg) =>
            !msg.content.startsWith("[FEEDBACK]") &&
            !msg.content.startsWith("[SUMMARY]") &&
            msg.role !== "system"
        )
        .map((msg) => {
          if (msg.role === "mark") return `Scammer Agent: ${msg.content}`;
          if (msg.role === "jane") return `Target Agent: ${msg.content}`;
          if (msg.role === "user") return `user_advice: ${msg.content}`;
          return "";
        })
        .filter((text) => text !== "") // Remove any empty strings
        .join("\n\n");

      console.log("This is where it starts for feedback", conversationText);
      // Add the conversation to the messages
      initialMessages.push({ role: "user", content: conversationText });

      // Get feedback from GPT
      const feedbackResponse = "Mock feedback response for testing";
      setFeedback(feedbackResponse);
      return feedbackResponse;
    } catch (err) {
      console.error("Feedback generation error:", err);
      return "";
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (completeHistory: Message[] = chatHistory) => {
    setLoading(true);
    try {
      // First, create the evaluator persona
      const initialMessages: Message[] = [
        { role: "system", content: summaryPrompt },
      ];

      // Get all messages from the current phase
      let phaseMessages: Message[] = [];

      if (currentPhase === 1) {
        // For phase 1, include all messages up to the first "Phase 1 has ended" message
        const phase1EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 1 has ended")
        );
        phaseMessages =
          phase1EndIndex === -1
            ? completeHistory
            : completeHistory.slice(0, phase1EndIndex);
      } else if (currentPhase === 2) {
        // For phase 2, include messages between Phase 1 end and Phase 2 end
        const phase1EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 1 has ended")
        );
        const phase2EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 2 has ended")
        );
        phaseMessages = completeHistory.slice(
          phase1EndIndex === -1 ? 0 : phase1EndIndex + 1,
          phase2EndIndex === -1 ? undefined : phase2EndIndex
        );
      } else if (currentPhase === 3) {
        // For phase 3, include messages after Phase 2 end
        const phase2EndIndex = completeHistory.findIndex(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 2 has ended")
        );
        phaseMessages =
          phase2EndIndex === -1
            ? []
            : completeHistory.slice(phase2EndIndex + 1);
      }

      console.log("Phase Messages for Summary:", phaseMessages);
      console.log(
        "Number of messages in phase for summary:",
        phaseMessages.length
      );
      console.log(
        "User messages in phase for summary:",
        phaseMessages.filter((msg) => msg.role === "user").length
      );

      // Format the conversation for analysis
      const conversationText = phaseMessages
        .filter(
          (msg) =>
            !msg.content.startsWith("[FEEDBACK]") &&
            !msg.content.startsWith("[SUMMARY]") &&
            msg.role !== "system"
        )
        .map((msg) => {
          if (msg.role === "mark") return `Scammer Agent: ${msg.content}`;
          if (msg.role === "jane") return `Target Agent: ${msg.content}`;
          if (msg.role === "user") return `user_advice: ${msg.content}`;
          return "";
        })
        .filter((text) => text !== "") // Remove any empty strings
        .join("\n\n");

      // Add the conversation to the messages
      initialMessages.push({ role: "user", content: conversationText });
      console.log("This is where it starts for summary", conversationText);

      // Get summary from GPT
      const summaryResponse = "Mock summary response for testing";
      console.log("Raw LLM summary response:", summaryResponse);

      // Check the LLM response and set appropriate hard-coded text
      let responseLower = "positive";
      let finalSummary = "";

      if (responseLower === "positive") {
        // Hard-coded positive text for each phase
        if (conversationScenario === 1) {
          // Pig Butchering Scam
          if (currentPhase === 1) {
            finalSummary =
              "Nice job advising Jane to help her not believe that the scammer is her grandchild Mark. You will now go to phase 2. To show the next part of the scam, imagine that Jane ending up believing that Mark scammer is truly her grandchild and this is the beginning of the next conversation";
          } else if (currentPhase === 2) {
            finalSummary =
              "Nice job advising Jane to help her not trust that Mark is her grandchild or that he is stranded in Boston. You will now go to phase 3. To show the next part of the scam, imagine that Jane ending up believing that her grandchild Mark is stuck in Boston and has no way out";
          } else if (currentPhase === 3) {
            finalSummary =
              "Nice job advising Jane leading to her not falling for the scam and saving her money. Congratulations! This is the end of the scam and you will now take some post survey questions";
          }
        } else if (conversationScenario === 2) {
          // Imposter Scam
          if (currentPhase === 1) {
            finalSummary =
              "We are now progressing to Phase 2. Jane ultimately becomes convinced that the scammer impersonating “Mark” is, in fact, her grandchild. The following interaction will illustrate the initiation of this new phase, highlighting how the scam develops once the victim’s trust has been established.";
          } else if (currentPhase === 2) {
            finalSummary =
              "We will now move on to Phase 3. Jane becomes convinced that her grandchild Mark is genuinely stranded in Boston and has no means of returning home. The following section will illustrate the next developments in the scam, as Jane’s belief in Mark’s predicament makes her increasingly susceptible to further manipulation by the scammer.";
          } else if (currentPhase === 3) {
            finalSummary =
              "Congratulations on successfully reaching the conclusion of the scam scenario. You will now be asked to complete some post-survey questions.";
          }
        }
      }

      setSummary(finalSummary);
      return finalSummary;
    } catch (err) {
      console.error("Summary generation error:", err);
      return "";
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseEnd = async (
    feedbackResult: string,
    summaryResult: string
  ) => {
    console.log("handlePhaseEnd called with:", {
      feedbackResult,
      summaryResult,
    });

    // Add all messages to chat history at once
    const phaseEndMessage = `Phase ${currentPhase} has ended!`;
    const newMessages: Message[] = [
      { role: "mark" as const, content: phaseEndMessage },
    ];

    if (feedbackResult) {
      console.log("Adding feedback message to chat history");
      newMessages.push({
        role: "system" as const,
        content: `[FEEDBACK] ${feedbackResult}`,
      });
    }

    if (summaryResult) {
      console.log("Adding summary message to chat history");
      newMessages.push({
        role: "system" as const,
        content: `[SUMMARY] ${summaryResult}`,
      });
    }

    setChatHistory((prev) => [...prev, ...newMessages]);

    // If phase 3, show post-survey button after a delay
    if (currentPhase === 3) {
      setTimeout(() => setShowPostSurveyButton(true), 1000);
    }
  };

  const handleGoToPostSurvey = async () => {
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

    // Update conversation's updatedAt before leaving
    if (conversationId) {
      try {
        await fetch("/api/conversations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationID: conversationId }),
        });
      } catch (err) {
        console.error("Failed to update conversation updatedAt:", err);
      }
    }

    // Clear the assigned chat model since user is completing the study
    sessionStorage.removeItem("assignedChatModel");
    // Set chat completion flag
    sessionStorage.setItem("chatCompleted", "true");
    window.location.href = "/post-survey";
  };

  const handleNextPhaseClick = () => {
    if (currentPhase === 1) {
      handlePhase2Start();
    } else if (currentPhase === 2) {
      handlePhase3Start();
    }
  };

  const handlePhase2Start = () => {
    setCurrentPhase(2);
    // Don't reset chat history - preserve all previous messages
    setMarkPromptUsed(false);
    setVictimPromptUsed(false);
    markInit.current = false;
    hasSaved.current = false;
    // Reset loading state
    setLoading(false);
  };

  const handlePhase3Start = () => {
    setShowPostSurveyButton(false);
    setCurrentPhase(3);
    // Don't reset chat history - preserve all previous messages
    setMarkPromptUsed(false);
    setVictimPromptUsed(false);
    markInit.current = false;
    hasSaved.current = false;
    // Reset loading state
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      // Clear session storage
      sessionStorage.removeItem("surveyCompleted");
      sessionStorage.removeItem("videoWatched");
      sessionStorage.removeItem("assignedChatModel");
      // Redirect to sign-in page
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  /* ---- Get predefined quiz messages ---- */
  const getMarkMessage = (phase: number, messageNumber: number): string => {
    // If conversationScenario hasn't been set yet, return empty string
    if (conversationScenario === null) {
      return "";
    }

    if (conversationScenario === 1) {
      // Pig Butchering Scam
      if (phase === 1) {
        if (messageNumber === 1) return markQuizPhase1PigPart1;
        if (messageNumber === 2) return markQuizPhase1PigPart2;
        if (messageNumber === 3) return markQuizPhase1PigPart3;
      } else if (phase === 2) {
        if (messageNumber === 1) return markQuizPhase2PigPart1;
        if (messageNumber === 2) return markQuizPhase2PigPart2;
        if (messageNumber === 3) return markQuizPhase2PigPart3;
      } else if (phase === 3) {
        if (messageNumber === 1) return markQuizPhase3PigPart1;
        if (messageNumber === 2) return markQuizPhase3PigPart2;
        if (messageNumber === 3) return markQuizPhase3PigPart3;
      }
    } else {
      // Imposter Scam (scenario 2)
      if (phase === 1) {
        if (messageNumber === 1) return markQuizPhase1Part1;
        if (messageNumber === 2) return markQuizPhase1Part2;
        if (messageNumber === 3) return markQuizPhase1Part3;
      } else if (phase === 2) {
        if (messageNumber === 1) return markQuizPhase2Part1;
        if (messageNumber === 2) return markQuizPhase2Part2;
        if (messageNumber === 3) return markQuizPhase2Part3;
      } else if (phase === 3) {
        if (messageNumber === 1) return markQuizPhase3Part1;
        if (messageNumber === 2) return markQuizPhase3Part2;
        if (messageNumber === 3) return markQuizPhase3Part3;
      }
    }
    return "";
  };

  const getJaneMessage = (phase: number, messageNumber: number): string => {
    // If conversationScenario hasn't been set yet, return empty string
    if (conversationScenario === null) {
      return "";
    }

    if (conversationScenario === 1) {
      // Pig Butchering Scam
      if (phase === 1) {
        if (messageNumber === 1) return janeQuizPhase1PigPart1;
        if (messageNumber === 2) return janeQuizPhase1PigPart2;
      } else if (phase === 2) {
        if (messageNumber === 1) return janeQuizPhase2PigPart1;
        if (messageNumber === 2) return janeQuizPhase2PigPart2;
      } else if (phase === 3) {
        if (messageNumber === 1) return janeQuizPhase3PigPart1;
        if (messageNumber === 2) return janeQuizPhase3PigPart2;
      }
    } else {
      // Imposter Scam (scenario 2)
      if (phase === 1) {
        if (messageNumber === 1) return janeQuizPhase1Part1;
        if (messageNumber === 2) return janeQuizPhase1Part2;
      } else if (phase === 2) {
        if (messageNumber === 1) return janeQuizPhase2Part1;
        if (messageNumber === 2) return janeQuizPhase2Part2;
      } else if (phase === 3) {
        if (messageNumber === 1) return janeQuizPhase3Part1;
        if (messageNumber === 2) return janeQuizPhase3Part2;
      }
    }
    return "";
  };

  /* ---- Ask Mark to reply to Jane ---- */
  const generateMarkResponse = async (janeLine: string) => {
    // Count Mark messages for the current phase only
    const phaseStartIndex =
      currentPhase === 1
        ? 0
        : chatHistory.findIndex(
            (msg) =>
              msg.role === "mark" &&
              msg.content.includes(`Phase ${currentPhase - 1} has ended`)
          ) + 1;

    const phaseMessages = chatHistory.slice(phaseStartIndex);
    // Only count actual conversation messages, not feedback/summary
    const markMessagesInPhase = phaseMessages.filter(
      (m) =>
        m.role === "mark" &&
        !m.content.startsWith("[FEEDBACK]") &&
        !m.content.startsWith("[SUMMARY]")
    ).length;

    console.log("Phase detection debug:", {
      currentPhase,
      phaseStartIndex,
      totalMessages: chatHistory.length,
      phaseMessages: phaseMessages.length,
      markMessagesInPhase,
      MESSAGE_LIMIT,
    });

    // Prevent multiple Mark responses if we're already at the limit for this phase
    if (markMessagesInPhase >= MESSAGE_LIMIT) {
      console.log("Mark message limit reached for phase", currentPhase);
      return;
    }

    setLoading(true);
    try {
      // Get the next Mark message number
      const nextMessageNumber = markMessagesInPhase + 1;
      const answer = getMarkMessage(currentPhase, nextMessageNumber);

      console.log("Generated Mark message:", {
        currentPhase,
        messageNumber: nextMessageNumber,
        message: answer.substring(0, 100) + "...",
      });

      setChatHistory((prev) => {
        const newHistory: Message[] = [
          ...prev,
          { role: "mark", content: answer },
        ];

        console.log("Updated chat history after Mark:", newHistory);
        console.log("Number of messages:", newHistory.length);
        console.log(
          "Number of Mark messages:",
          newHistory.filter((msg) => msg.role === "mark").length
        );
        console.log(
          "Number of Jane messages:",
          newHistory.filter((msg) => msg.role === "jane").length
        );
        console.log(
          "Number of user messages:",
          newHistory.filter((msg) => msg.role === "user").length
        );

        // Check if we've reached the message limit for this phase and haven't saved yet
        const newPhaseStartIndex =
          currentPhase === 1
            ? 0
            : newHistory.findIndex(
                (msg) =>
                  msg.role === "mark" &&
                  msg.content.includes(`Phase ${currentPhase - 1} has ended`)
              ) + 1;

        const newPhaseMessages = newHistory.slice(newPhaseStartIndex);
        const newMarkMessagesInPhase = newPhaseMessages.filter(
          (m) =>
            m.role === "mark" &&
            !m.content.startsWith("[FEEDBACK]") &&
            !m.content.startsWith("[SUMMARY]")
        ).length;

        console.log("New phase detection debug:", {
          currentPhase,
          newPhaseStartIndex,
          newPhaseMessages: newPhaseMessages.length,
          newMarkMessagesInPhase,
          MESSAGE_LIMIT,
        });

        if (newMarkMessagesInPhase >= MESSAGE_LIMIT && !hasSaved.current) {
          console.log("Phase end triggered for phase", currentPhase);
          hasSaved.current = true;
          // Save conversation only when we reach the limit
          //saveConversation(newHistory).catch(console.error);
          // Generate feedback and summary with the complete conversation history
          Promise.all([
            generateFeedback(newHistory),
            generateSummary(newHistory),
          ]).then(async ([feedbackResult, summaryResult]) => {
            // Add phase end messages to chat history after feedback and summary are generated
            handlePhaseEnd(feedbackResult, summaryResult);
          });
        }
        // Don't automatically trigger Jane's response - let the Next button handle it

        return newHistory;
      });
      setMarkPromptUsed(true);

      // Save Mark's message immediately
      if (prolificPID && conversationType && conversationId) {
        saveMsg({
          Prolific_PID: prolificPID,
          advice: "", // Mark never gives advice
          conversationType,
          phase: currentPhase,
          msg: answer,
          influenced: false,
          botName: "mark",
          botType: "scammer",
          conversationId,
        });
      }
    } catch (err) {
      console.error("Mark generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Ask Jane to reply, given Mark's last msg ---- */
  const generateJaneResponse = async (markLine: string) => {
    // Count Mark messages for the current phase only
    const phaseStartIndex =
      currentPhase === 1
        ? 0
        : chatHistory.findIndex(
            (msg) =>
              msg.role === "mark" &&
              msg.content.includes(`Phase ${currentPhase - 1} has ended`)
          ) + 1;

    const phaseMessages = chatHistory.slice(phaseStartIndex);
    // Only count actual conversation messages, not feedback/summary
    const markMessagesInPhase = phaseMessages.filter(
      (m) =>
        m.role === "mark" &&
        !m.content.startsWith("[FEEDBACK]") &&
        !m.content.startsWith("[SUMMARY]")
    ).length;

    // Don't generate Jane's response if we've reached Mark's message limit for this phase
    if (markMessagesInPhase >= MESSAGE_LIMIT) {
      return;
    }

    setLoading(true);
    try {
      // Get the next Jane message number (Jane responds after each Mark message except the last one)
      const nextMessageNumber = markMessagesInPhase;
      const answer = getJaneMessage(currentPhase, nextMessageNumber);

      console.log("Generated Jane message:", {
        currentPhase,
        messageNumber: nextMessageNumber,
        message: answer.substring(0, 100) + "...",
      });

      // Update chat history with Jane's message
      setChatHistory((prev) => [...prev, { role: "jane", content: answer }]);
      setVictimPromptUsed(true);

      // Save Jane's message ONCE, after chat history is updated
      if (prolificPID && conversationType && conversationId) {
        saveMsg({
          Prolific_PID: prolificPID,
          advice: "", // No user advice in this version
          conversationType,
          phase: currentPhase,
          msg: answer,
          influenced: false, // No user influence
          botName: "jane",
          botType: "target",
          conversationId,
        });
      }

      // Don't automatically trigger Mark's next response - user must click Next
    } catch (err) {
      console.error("Jane generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Trigger initial Mark response when conversation scenario is set */
  useEffect(() => {
    if (
      conversationScenario !== null &&
      !markPromptUsed &&
      !markInit.current &&
      prolificPID &&
      conversationType &&
      conversationId
    ) {
      markInit.current = true;
      (async () => {
        await generateMarkResponse("");
      })();
    }
  }, [
    conversationScenario,
    markPromptUsed,
    prolificPID,
    conversationType,
    conversationId,
  ]);

  /* send the component to the client */
  return (
    <>
      <div
        className={` transition-all duration-500 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3  -mb-9 max-w-9xl w-full mx-auto h-[100vh] overflow-y-auto bg-indigo-50 border border-indigo-100 shadow-lg">
          <div className="col-span-2 rounded-2xl overflow-hidden min-h-full text-lg">
            <div
              className={`transition-all duration-1000 ease-in-out ${"opacity-100"}`}
            >
              <OutputSection
                chatHistory={chatHistory}
                loading={loading}
                showPostSurveyButton={showPostSurveyButton}
                onPostSurveyClick={handleGoToPostSurvey}
                currentPhase={currentPhase}
                onNextPhaseClick={handleNextPhaseClick}
              />
            </div>
          </div>

          <div
            className={`transition-all duration-1000 ease-in-out ${"opacity-100 scale-100"}`}
          >
            <FormSection
              loading={userFormLoading}
              chatHistory={chatHistory}
              currentPhase={currentPhase}
              prolificPID={prolificPID}
              conversationId={conversationId || ""}
              onNextClicked={() => {
                // Check the last message to determine what to trigger next
                const lastMessage = chatHistory[chatHistory.length - 1];

                if (lastMessage && lastMessage.role === "mark") {
                  // Last message was from Mark, trigger Jane's response
                  generateJaneResponse(lastMessage.content);
                } else if (lastMessage && lastMessage.role === "jane") {
                  // Last message was from Jane, trigger Mark's next response
                  generateMarkResponse(lastMessage.content);
                } else {
                  // No messages yet or first message, trigger Mark's first response
                  generateMarkResponse("");
                }
              }}
              conversationScenario={conversationScenario || 2}
            />
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <Modal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        >
          <div className="p-8 text-center max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome!</h2>
            <div className="text-left space-y-4 text-lg text-gray-700 leading-relaxed">
              <p>
                Now that you've completed the training video, you'll get to put
                your skills to use by viewing a live chat between two people,
                <span className="text-blue-600 font-semibold"> Jane</span> and
                someone named{" "}
                <span className="text-amber-700 font-semibold">Mark</span>.
              </p>
              <p>
                <span className="text-blue-600 font-semibold">Jane</span> is 70
                years old and is quick to trust people. Five minutes ago, she
                received a message from an unknown number claiming to be{" "}
                <span className="text-amber-700 font-semibold">Mark</span>, her
                oldest grandchild. Unfortunately, it is not{" "}
                <span className="text-amber-700 font-semibold"> Mark </span>
                but rather a scammer who is trying to extract money and
                information. While we know about the scammer's true intentions,
                <span className="text-blue-600 font-semibold"> Jane</span> is
                unaware and she decides to reply to "
                <span className="text-amber-700 font-semibold">Mark</span>".
              </p>
              <p className="font-semibold text-black">
                Your goal is to carefully read the messages that the scammer and
                Jane exchange to determine what Jane is doing right or wrong.
              </p>
              <p>
                After you finish going through the live chat, you'll answer a
                few questions about your experience.
              </p>
            </div>
            <div className="mt-8">
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="bg-indigo-600 text-white py-3 px-8 rounded-2xl text-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </Modal>
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
    </>
  );
}
