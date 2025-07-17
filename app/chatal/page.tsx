"use client";
import React, { useEffect, useState, useRef } from "react";
import { markPrompt } from "@/utils/prompts/imposter/markPrompt";
import { victimPrompt } from "@/utils/prompts/imposter/victim";
import { markPromptPhase1 } from "@/utils/prompts/imposter/markPromptPhase1";
import { victimPromptPhase1 } from "@/utils/prompts/imposter/victimPhase1";
import { markPromptPhase2 } from "@/utils/prompts/imposter/markPromptPhase2";
import { victimPromptPhase2 } from "@/utils/prompts/imposter/victimPhase2";
import { scammerPhase1 } from "@/utils/prompts/pigbutchering/scammerPhase1";
import { scammerPhase2 } from "@/utils/prompts/pigbutchering/scammerPhase2";
import { scammerPhase3 } from "@/utils/prompts/pigbutchering/scammerPhase3";
import { victimPhase1 } from "@/utils/prompts/pigbutchering/victimPhase1";
import { victimPhase2 } from "@/utils/prompts/pigbutchering/victimPhase2";
import { victimPhase3 } from "@/utils/prompts/pigbutchering/victimPhase3";

import { feedbackPrompt } from "@/utils/prompts/feedbackPrompt";
import { feedbackPromptPigButchering } from "@/utils/prompts/feedbackPrompt_Pig_Butchering";
import { summaryPrompt } from "@/utils/prompts/summaryPrompt";
import FormSection from "./_components/FormSection";
import OutputSection from "./_components/OutputSection";
import Modal from "@/components/ui/modal";

const MESSAGE_LIMIT = 3; // Maximum number of messages from Mark

/* ---------- Local Machine conversation record ---------- */
export type Message = {
  role: "mark" | "jane" | "user" | "system";
  content: string;
};

/* ---------- OpenAI wire format ---------- */
type OAIRole = "system" | "user" | "assistant";
type OAImessage = { role: OAIRole; content: string };
type Persona = "mark" | "jane";

/* ---------- calling the ChatGPT API ---------- */
async function callGPT(
  agent: Persona,
  messages: OAImessage[]
): Promise<string> {
  const res = await fetch("/api/aimodel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, messages }),
  });

  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error ?? `API error (${res.status})`);
  }

  const { response } = (await res.json()) as { response: string };
  return response;
}

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
  const [showEndModal, setShowEndModal] = useState(false);
  const [showPhaseEnd, setShowPhaseEnd] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [feedback, setFeedback] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const hasSaved = useRef(false);
  const [prolificPID, setProlificPID] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationType, setConversationType] = useState<string>("");
  const [showPostSurveyButton, setShowPostSurveyButton] = useState(false);
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
    if (assignedChatModel !== "/chatal") {
      console.log(
        `User assigned to ${assignedChatModel}, redirecting from /chatal`
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
          const randomScenario = assignedScenario
            ? parseInt(assignedScenario)
            : Math.floor(Math.random() * 2) + 1;
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
              conversationMethod: "chatal",
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
      // Choose the appropriate feedback prompt based on conversation scenario
      const feedbackPromptToUse =
        conversationScenario === 1
          ? feedbackPromptPigButchering
          : feedbackPrompt;

      // First, create the evaluator persona
      const initialMessages: OAImessage[] = [
        { role: "system", content: feedbackPromptToUse },
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
      const feedbackResponse = await callGPT("mark", initialMessages);
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
      const initialMessages: OAImessage[] = [
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
      const summaryResponse = await callGPT("mark", initialMessages);
      console.log("Raw LLM summary response:", summaryResponse);

      // Check the LLM response and set appropriate hard-coded text
      const responseLower = summaryResponse.toLowerCase().trim();
      let finalSummary = "";

      if (responseLower === "positive") {
        // Hard-coded positive text for each phase
        if (currentPhase === 1) {
          if (conversationScenario === 2) {
            // Imposter Scam
            finalSummary =
              "You provided excellent guidance in encouraging Jane to remain skeptical and to refrain from trusting the individual posing as “Mark.” Please continue to apply this critical approach in subsequent phases of the scenario.\n\nWe are now progressing to Phase 2. Jane ultimately becomes convinced that the scammer impersonating “Mark” is, in fact, her grandchild. The following interaction will illustrate the initiation of this new phase, highlighting how the scam develops once the victim’s trust has been established. Continue trying to provide effective feedback to Jane to protect her.";
          } else {
            // Pig Butchering Scam
            finalSummary =
              "You provided excellent guidance in helping Jane remain cautious and resist forming a quick emotional connection with Mark. Your encouragement to question his identity and intentions helped slow the development of trust between them. Keep using this skeptical approach in the next stage.\n\nWe are now moving on to Phase 2. In this phase, Jane begins to develop emotional trust in Mark. She becomes more open to friendly conversations and personal updates, making her more susceptible to manipulation. Continue offering protective guidance as the scenario unfolds.";
          }
        } else if (currentPhase === 2) {
          if (conversationScenario === 2) {
            finalSummary =
              "Thank you for your effective guidance in encouraging Jane to remain skeptical about whether 'Mark' is truly her grandchild or whether he is actually stranded in Boston.\n\nWe will now move on to Phase 3. Jane becomes convinced that her grandchild Mark is genuinely stranded in Boston and has no means of returning home. The following section will illustrate the next developments in the scam, as Jane’s belief in Mark’s predicament makes her increasingly susceptible to further manipulation by the scammer.";
          } else {
            finalSummary =
              "Thank you for your thoughtful advice, which helped Jane question Mark's investment suggestions and approach the opportunity with caution. Your guidance encouraged her to remain skeptical and avoid making any initial transfers.\n\nWe are now moving on to Phase 3. In this phase, Jane will be pressured to make a much larger final investment — potentially her life savings — after seeing fake early gains. The emotional bond with Mark will be used to create urgency and trust. Continue supporting Jane with practical, protective advice.";
          }
        } else if (currentPhase === 3) {
          if (conversationScenario === 2) {
            finalSummary =
              "Thank you for your effective guidance, which helped Jane avoid falling victim to the scam and protected her from financial loss.\n\nCongratulations on successfully reaching the conclusion of the scam scenario. You will now be asked to complete some post-survey questions.";
          } else {
            finalSummary =
              "Thank you for your strong and timely advice. Jane followed your guidance and chose not to send the large final payment. Your intervention protected her from significant financial loss and helped her recognize the risk in time.\n\nCongratulations on successfully reaching the conclusion of the pig butchering scenario. You will now be asked to complete some post-survey questions.";
          }
        }
      } else {
        // Hard-coded neutral/negative text for each phase
        if (currentPhase === 1) {
          if (conversationScenario === 2) {
            // Imposter Scam
            finalSummary =
              "Your previous guidance did not succeed in prompting Jane to question the scammer’s identity; as a result, Jane has unfortunately fallen victim to the deception and now genuinely believes she is communicating with her grandchild.\n\nWe will now proceed to Phase 2. Jane fully accepts that she is interacting with her grandchild, marking the beginning of the next phase of the scam. The forthcoming segment will demonstrate how the scam progresses once the victim’s trust has been secured. Continue trying to provide effective feedback to Jane to protect her.";
          } else {
            // Pig Butchering Scam
            finalSummary =
              "Your previous advice did not prevent Jane from developing a connection with Mark. As a result, she now views him as a kind and trustworthy new acquaintance, opening the door for emotional manipulation.\n\nWe are now progressing to Phase 2. In this phase, Jane begins to form a deeper bond with Mark, believing him to be a caring and supportive friend. This growing trust will be used to introduce investment opportunities. Keep trying to offer effective guidance to protect Jane from further manipulation.";
          }
        } else if (currentPhase === 2) {
          if (conversationScenario === 2) {
            finalSummary =
              "Your previous advice was not effective in prompting Jane to question the scammer’s claims; consequently, Jane has unfortunately fallen victim to the deception and now truly believes that her grandchild is stranded in Boston with no way out.\n\nWe will now proceed to Phase 3. Jane’s conviction that she is communicating with her real grandchild and her concern for his well-being mark the beginning of the next part of the scam. The subsequent conversation will illustrate how the scammer exploits Jane’s trust and emotional vulnerability to further the fraudulent scheme.";
          } else {
            finalSummary =
              "Your previous advice did not stop Jane from engaging with the investment opportunity. She now believes the platform is legitimate and has begun to trust Mark's claims about rapid profits and low risk.\n\nWe are now entering Phase 3. In this phase, Jane is presented with a final high-stakes opportunity and is encouraged to invest a much larger amount. The scammer will use emotional persuasion and fabricated returns to pressure her. Please continue trying to guide Jane toward safer decisions.";
          }
        } else if (currentPhase === 3) {
          if (conversationScenario === 2) {
            finalSummary =
              "Your previous advice was not successful in encouraging Jane to question the scammer’s identity or intentions, and as a result, she sent the money, believing she was helping her grandchild.\n\nThis marks the conclusion of the scam scenario. You will now proceed to answer a series of post-survey questions.";
          } else {
            finalSummary =
              "Your previous advice did not succeed in convincing Jane to stop. She has now sent the final payment, believing that this is her opportunity for long-term gain and emotional connection with Mark.\n\nThis marks the conclusion of the pig butchering scenario. You will now proceed to complete a set of post-survey questions.";
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

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished, show phase end content
      setShowCountdown(false);
      setCountdown(null);
      setShowPhaseEnd(true);
    }
  }, [countdown]);

  const handleNextPhaseClick = () => {
    if (currentPhase === 1) {
      setCurrentPhase(2);
      setMarkPromptUsed(false);
      setVictimPromptUsed(false);
      markInit.current = false;
      hasSaved.current = false;
      setLoading(false);
    } else if (currentPhase === 2) {
      setCurrentPhase(3);
      setMarkPromptUsed(false);
      setVictimPromptUsed(false);
      markInit.current = false;
      hasSaved.current = false;
      setLoading(false);
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

  const handlePhase2Start = () => {
    setShowPhaseEnd(false);
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
    setShowPhaseEnd(false);
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

  // Function to determine if advice should be locked
  const isAdviceLocked = () => {
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

    // Count user advice messages in the current phase
    const userAdviceInPhase = phaseMessages.filter(
      (m) => m.role === "user"
    ).length;

    // Advice should be locked if:
    // 1. Mark has sent 3 messages (phase is ending)
    // 2. User has already given advice after the latest Mark message
    // 3. No Mark messages yet (initial state)

    if (markMessagesInPhase >= MESSAGE_LIMIT) {
      return true; // Phase is ending, lock advice
    }

    if (markMessagesInPhase === 0) {
      return true; // No Mark messages yet, lock advice
    }

    // Check if user has given advice after the latest Mark message
    const lastMarkIndex = chatHistory.findLastIndex(
      (msg) =>
        msg.role === "mark" &&
        !msg.content.startsWith("[FEEDBACK]") &&
        !msg.content.startsWith("[SUMMARY]") &&
        !msg.content.includes("Phase") &&
        !msg.content.includes("ended")
    );

    if (lastMarkIndex === -1) {
      return true; // No Mark messages found
    }

    // Check if there's a user message after the last Mark message
    const hasUserAdviceAfterLastMark = chatHistory
      .slice(lastMarkIndex + 1)
      .some((msg) => msg.role === "user");

    return hasUserAdviceAfterLastMark;
  };

  /* ---- Build the array OpenAI wants, given our local history ---- */
  const historyFor = (agent: Persona): OAImessage[] => {
    const msgs: OAImessage[] = [];
    console.log(
      `historyFor called for ${agent}, conversationScenario: ${conversationScenario}, currentPhase: ${currentPhase}`
    );

    // If conversationScenario hasn't been set yet, return empty array
    if (conversationScenario === null) {
      console.log("Conversation scenario not set yet, returning empty array");
      return msgs;
    }

    if (conversationScenario === 1) {
      // Pig Butchering Scam
      if (agent === "mark") {
        const markPromptContent =
          currentPhase === 1
            ? scammerPhase1
            : currentPhase === 2
            ? scammerPhase2
            : scammerPhase3;
        console.log(
          `Mark using pig butchering prompt for phase ${currentPhase}:`,
          markPromptContent.substring(0, 100) + "..."
        );
        msgs.push({
          role: "system",
          content: markPromptContent,
        });
      }
      if (agent === "jane") {
        const janePromptContent =
          currentPhase === 1
            ? victimPhase1
            : currentPhase === 2
            ? victimPhase2
            : victimPhase3;
        console.log(
          `Jane using pig butchering prompt for phase ${currentPhase}:`,
          janePromptContent.substring(0, 100) + "..."
        );
        msgs.push({
          role: "system",
          content: janePromptContent,
        });
      }
    } else {
      // Imposter Scam
      if (agent === "mark") {
        const markPromptContent =
          currentPhase === 1
            ? markPrompt
            : currentPhase === 2
            ? markPromptPhase1
            : markPromptPhase2;
        console.log(
          `Mark using imposter scam prompt for phase ${currentPhase}:`,
          markPromptContent.substring(0, 100) + "..."
        );
        msgs.push({
          role: "system",
          content: markPromptContent,
        });
      }
      if (agent === "jane") {
        const janePromptContent =
          currentPhase === 1
            ? victimPrompt
            : currentPhase === 2
            ? victimPromptPhase1
            : victimPromptPhase2;
        console.log(
          `Jane using imposter scam prompt for phase ${currentPhase}:`,
          janePromptContent.substring(0, 100) + "..."
        );
        msgs.push({
          role: "system",
          content: janePromptContent,
        });
      }
    }

    chatHistory.forEach((m) => {
      if (agent === "mark") {
        // For Mark, Jane is the user; Mark himself is assistant
        if (m.role === "jane") msgs.push({ role: "user", content: m.content });
        if (m.role === "mark")
          msgs.push({ role: "assistant", content: m.content });
      } else {
        // For Jane, Mark is the user; Jane herself is assistant
        if (m.role === "mark") msgs.push({ role: "user", content: m.content });
        if (m.role === "jane")
          msgs.push({ role: "assistant", content: m.content });
      }
    });

    return msgs;
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

    // Prevent multiple Mark responses if we're already at the limit for this phase
    if (markMessagesInPhase >= MESSAGE_LIMIT) {
      return;
    }

    setLoading(true);
    try {
      const messages: OAImessage[] = [
        ...historyFor("mark"),
        ...(janeLine ? [{ role: "user", content: janeLine } as const] : []),
      ];

      const answer = await callGPT("mark", messages);

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

        if (newMarkMessagesInPhase >= MESSAGE_LIMIT && !hasSaved.current) {
          hasSaved.current = true;
          // Save conversation only when we reach the limit
          // Generate feedback and summary with the complete conversation history
          Promise.all([
            generateFeedback(newHistory),
            generateSummary(newHistory),
          ]).then(async ([feedbackResult, summaryResult]) => {
            // Add phase end messages to chat history after feedback and summary are generated
            if (
              prolificPID &&
              conversationType &&
              conversationId &&
              feedbackResult
            ) {
              await saveFeedback({
                Prolific_PID: prolificPID,
                conversationType,
                phase: currentPhase,
                feedback: feedbackResult,
                conversationId,
              });
            }
            // Add phase end messages to chat history after feedback and summary are generated
            handlePhaseEnd(feedbackResult, summaryResult);
          });
        }

        return newHistory;
      });
      setMarkPromptUsed(true);

      // Save Mark's message immediately
      if (prolificPID && conversationType) {
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

  /* ---- Ask Jane to reply, given Mark's last msg + user advice ---- */
  const generateJaneResponse = async (markLine: string, userAdvice: string) => {
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
      const messages: OAImessage[] = [
        ...historyFor("jane"),
        {
          role: "user",
          content: `${markLine}\n\nuser_advice: ${userAdvice}`,
        } as const,
      ];

      const answer = await callGPT("jane", messages);

      // Update chat history with Jane's message
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: userAdvice },
        { role: "jane", content: answer },
      ]);
      setVictimPromptUsed(true);

      // Save Jane's message ONCE, after chat history is updated
      if (prolificPID && conversationType && conversationId) {
        saveMsg({
          Prolific_PID: prolificPID,
          advice: userAdvice ?? "",
          conversationType,
          phase: currentPhase,
          msg: answer,
          influenced: (userAdvice ?? "").trim() !== "",
          botName: "jane",
          botType: "target",
          conversationId,
        });
      }

      // Only let Mark react to Jane if we're not at the message limit for this phase
      const newPhaseStartIndex =
        currentPhase === 1
          ? 0
          : chatHistory.findIndex(
              (msg) =>
                msg.role === "mark" &&
                msg.content.includes(`Phase ${currentPhase - 1} has ended`)
            ) + 1;

      const newPhaseMessages = chatHistory.slice(newPhaseStartIndex);
      const newMarkMessagesInPhase = newPhaseMessages.filter(
        (m) =>
          m.role === "mark" &&
          !m.content.startsWith("[FEEDBACK]") &&
          !m.content.startsWith("[SUMMARY]")
      ).length;

      if (newMarkMessagesInPhase < MESSAGE_LIMIT) {
        // Add a small delay before Mark's response
        setTimeout(() => {
          generateMarkResponse(answer);
        }, 500);
      }
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
    <div
      className={`transition-all duration-500 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 -mb-9 max-w-9xl w-full mx-auto h-[100vh] overflow-y-auto bg-indigo-50 border border-indigo-100 shadow-lg">
        {!showPhaseEnd ? (
          <>
            <div className="col-span-2 rounded-xl overflow-hidden min-h-full text-lg">
              <OutputSection
                chatHistory={chatHistory}
                loading={loading}
                showPostSurveyButton={showPostSurveyButton}
                onPostSurveyClick={handleGoToPostSurvey}
                currentPhase={currentPhase}
                onNextPhaseClick={handleNextPhaseClick}
              />
            </div>

            <FormSection
              loading={userFormLoading}
              chatHistory={chatHistory}
              currentPhase={currentPhase}
              userFormInput={(advice) => {
                setUserFormLoading(true);
                const lastMark =
                  chatHistory.filter((m) => m.role === "mark").slice(-1)[0]
                    ?.content ?? "";
                generateJaneResponse(lastMark, advice).finally(() => {
                  setUserFormLoading(false);
                });
              }}
              prolificPID={prolificPID}
              conversationId={conversationId || ""}
              isAdviceLocked={isAdviceLocked()}
            />
          </>
        ) : (
          <div className="col-span-3 flex items-center justify-center">
            <div className="text-center max-w-7xl w-full p-8">
              {currentPhase === 1 ? (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Phase 1 has ended!
                  </h2>
                  <p className="text-gray-600 text-xl">
                    The conversation has reached its limit of {MESSAGE_LIMIT}{" "}
                    messages from Mark.
                  </p>
                  {feedback && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Feedback Analysis:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {feedback}
                      </div>
                    </div>
                  )}
                  {summary && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Overall Assessment:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {summary}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handlePhase2Start}
                    className="bg-indigo-600 text-white py-4 px-10 rounded-2xl hover:bg-indigo-700 transition-all duration-300 text-xl font-semibold transform hover:scale-105"
                  >
                    Go to Phase 2
                  </button>
                </div>
              ) : currentPhase === 2 ? (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Phase 2 has ended!
                  </h2>
                  <p className="text-gray-600 text-xl">
                    The conversation has reached its limit of {MESSAGE_LIMIT}{" "}
                    messages from Mark.
                  </p>
                  {feedback && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Feedback Analysis:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {feedback}
                      </div>
                    </div>
                  )}
                  {summary && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Overall Assessment:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {summary}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handlePhase3Start}
                    className="bg-indigo-600 text-white py-4 px-10 rounded-2xl hover:bg-indigo-700 transition-all duration-300 text-xl font-semibold transform hover:scale-105"
                  >
                    Go to Phase 3
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Phase 3 has ended!
                  </h2>
                  <p className="text-gray-600 text-xl">
                    Thank you for completing all phases of our study! You will
                    now be taken to a brief final survey.
                  </p>
                  {feedback && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Final Feedback Analysis:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {feedback}
                      </div>
                    </div>
                  )}
                  {summary && (
                    <div className="p-6 bg-white rounded-2xl shadow-lg text-left border border-gray-200">
                      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                        Final Summary:
                      </h3>
                      <div className="whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                        {summary}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleGoToPostSurvey}
                    className="bg-indigo-600 text-white py-2 px-10 rounded-3xl hover:bg-indigo-700 hover:scale-110 animate-pulse transition-all duration-300 text-xl font-semibold transform"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      {showCountdown && countdown !== null && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50 animate-pulse">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{countdown}</div>
            <div className="text-sm">
              Redirecting to feedback and summary page in {countdown} second
              {countdown !== 1 ? "s" : ""}...
            </div>
          </div>
        </div>
      )}

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
                <span className="text-blue-600 font-semibold">Jane</span> and
                someone named{" "}
                <span className="text-amber-700 font-semibold"> Mark</span>.
              </p>
              <p>
                <span className="text-blue-600 font-semibold">Jane</span> is 70
                years old and is quick to trust people. Five minutes ago, she
                received a message from an unknown number claiming to be{" "}
                <span className="text-amber-700 font-semibold"> Mark</span>, her
                oldest grandchild. Unfortunately, it is not{" "}
                <span className="text-amber-700 font-semibold"> Mark </span>
                but rather a scammer who is trying to extract money and
                information. While we know about the scammer's true intentions,
                <span className="text-blue-600 font-semibold"> Jane</span> is
                unaware and she decides to reply to "
                <span className="text-amber-700 font-semibold">Mark</span>".
              </p>
              <p className="font-semibold text-indigo-700">
                Your goal is to carefully read the messages that the scammer and
                Jane exchange and provide helpful advice to stop Jane from being
                scammed.
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
    </div>
  );
}
