"use client";
import React, { useEffect, useState } from "react";

// FormSection component for Next button functionality
type Message = { role: "mark" | "jane" | "user" | "system"; content: string };

interface PROPS {
  loading: boolean;
  chatHistory: Message[];
  currentPhase: number;
  prolificPID: string | null;
  conversationId: string;
  onNextClicked?: () => void;
  conversationScenario?: number; // 1 for Pig Butchering, 2 for Imposter Scam
}

export default function FormSection({
  loading,
  chatHistory,
  currentPhase,
  prolificPID,
  conversationId,
  onNextClicked,
  conversationScenario = 2, // Default to imposter scam for backward compatibility
}: PROPS) {
  const [canClickNext, setCanClickNext] = useState(false);

  // Calculate progress for current phase
  const getPhaseProgress = () => {
    const phaseStartIndex =
      currentPhase === 1
        ? 0
        : chatHistory.findIndex(
            (msg) =>
              msg.role === "mark" &&
              msg.content.includes(`Phase ${currentPhase - 1} has ended`)
          ) + 1;

    const phaseMessages = chatHistory.slice(phaseStartIndex);

    // Count all non-system messages in the current phase
    const conversationMessages = phaseMessages.filter((msg) => {
      const isMarkOrJane = msg.role === "mark" || msg.role === "jane";
      const notFeedback = !msg.content.startsWith("[FEEDBACK]");
      const notSummary = !msg.content.startsWith("[SUMMARY]");
      const notPhase = !msg.content.includes("Phase");
      const notEnded = !msg.content.includes("has ended");

      const shouldInclude =
        isMarkOrJane && notFeedback && notSummary && notPhase && notEnded;

      if (!shouldInclude && (msg.role === "mark" || msg.role === "jane")) {
        console.log("Filtered out conversation message:", {
          role: msg.role,
          content: msg.content,
          isMarkOrJane,
          notFeedback,
          notSummary,
          notPhase,
          notEnded,
        });
      }

      return shouldInclude;
    });

    // Debug: Check what messages are being filtered out
    const filteredOutMessages = phaseMessages.filter(
      (msg) =>
        !(msg.role === "mark" || msg.role === "jane") ||
        msg.content.startsWith("[FEEDBACK]") ||
        msg.content.startsWith("[SUMMARY]") ||
        msg.content.includes("Phase") ||
        msg.content.includes("ended")
    );

    console.log(
      "Filtered out messages:",
      filteredOutMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );

    const totalProgress = conversationMessages.length;

    console.log("Progress Debug:", {
      currentPhase,
      phaseStartIndex,
      phaseMessages: phaseMessages.length,
      conversationMessages: conversationMessages.length,
      totalProgress,
      chatHistoryLength: chatHistory.length,
      messages: conversationMessages.map((m) => ({
        role: m.role,
        content: m.content.substring(0, 50),
      })),
      allMessages: phaseMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Total texts shown in current phase (Mark + Jane messages)
    return totalProgress;
  };

  // Calculate overall progress across all phases (1-15)
  const getOverallProgress = () => {
    let totalProgress = 0;

    // Count progress from completed phases
    for (let phase = 1; phase < currentPhase; phase++) {
      totalProgress += 5; // Each phase has 5 texts
    }

    // Add progress from current phase
    totalProgress += getPhaseProgress();

    return totalProgress;
  };

  // Calculate total texts across all phases
  const getTotalTexts = () => {
    return 15; // 5 texts per phase × 3 phases
  };

  // Monitor chat history to determine when Next button should be enabled
  useEffect(() => {
    // Count Mark messages in current phase (excluding system messages)
    const phaseStartIndex =
      currentPhase === 1
        ? 0
        : chatHistory.findIndex(
            (msg) =>
              msg.role === "mark" &&
              msg.content.includes(`Phase ${currentPhase - 1} has ended`)
          ) + 1;

    const phaseMessages = chatHistory.slice(phaseStartIndex);
    const markMessagesInPhase = phaseMessages.filter(
      (msg) =>
        msg.role === "mark" &&
        !msg.content.startsWith("[FEEDBACK]") &&
        !msg.content.startsWith("[SUMMARY]") &&
        !msg.content.includes("Phase") &&
        !msg.content.includes("ended")
    ).length;

    console.log("Next Button Debug:", {
      currentPhase,
      phaseStartIndex,
      markMessagesInPhase,
      canClickNext: markMessagesInPhase > 0 && markMessagesInPhase < 3,
    });

    // Enable Next button if there's at least one Mark message and we haven't reached the limit
    if (markMessagesInPhase > 0 && markMessagesInPhase < 3) {
      setCanClickNext(true);
    } else {
      setCanClickNext(false);
    }
  }, [chatHistory, currentPhase]);

  // Debug progress changes
  useEffect(() => {
    const progress = getPhaseProgress();
    console.log("Progress changed:", progress);
  }, [chatHistory, currentPhase]);

  const handleNextClick = () => {
    if (canClickNext && onNextClicked) {
      onNextClicked();
    }
  };

  return (
    <div className="p-5 shadow-md rounded-2xl flex flex-col h-[98vh] bg-white">
      {/* Combined Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between">
          <span className="px-2 text-xs font-medium text-gray-700">
            Text {getOverallProgress()} of {getTotalTexts()}
          </span>
          <div className="px-2 flex gap-2">
            <span className="text-xs font-bold text-black">
              Phase {currentPhase}:
            </span>
            <span className="text-xs font-bold text-green-600">
              {currentPhase === 1 && "Trust Building"}
              {currentPhase === 2 && "Manipulation"}
              {currentPhase === 3 && "Extraction"}
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-3xl overflow-hidden">
          {/* Progress bar for all 15 texts across all phases */}
          <div className="flex h-full">
            {Array.from({ length: 15 }, (_, textIndex) => {
              const phaseForText = Math.floor(textIndex / 5) + 1;
              const textInPhase = textIndex % 5;
              const isCompleted = textIndex < getOverallProgress();

              return (
                <div
                  key={textIndex}
                  className={`flex-1 h-full border-r border-white ${
                    isCompleted
                      ? phaseForText === 1
                        ? "bg-green-600" // Phase 1
                        : phaseForText === 2
                        ? "bg-blue-600" // Phase 2
                        : "bg-purple-600" // Phase 3
                      : phaseForText === 1
                      ? "bg-green-300" // Phase 1 (not completed)
                      : phaseForText === 2
                      ? "bg-blue-300" // Phase 2 (not completed)
                      : "bg-purple-300" // Phase 3 (not completed)
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Next Button Section */}
      <div className="h-full rounded-3xl flex flex-col items-center justify-center">
        <div className="text-center mb-15">
          <p className="text-gray-600 text-lg">
            Click "Next" to see the next message in the conversation
          </p>
        </div>

        <button
          onClick={handleNextClick}
          disabled={!canClickNext || loading}
          className={`px-15 py-4 rounded-4xl text-lg font-semibold transition-all duration-200 ${
            canClickNext && !loading
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          {loading ? "Loading..." : "Next"}
        </button>
      </div>
    </div>
  );
}
