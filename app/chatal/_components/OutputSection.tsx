"use client";
import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Message = { role: "mark" | "jane" | "user" | "system"; content: string };

interface Props {
  chatHistory: Message[];
  loading: boolean;
  showPostSurveyButton?: boolean;
  onPostSurveyClick?: () => void;
  currentPhase?: number;
  onNextPhaseClick?: () => void;
}

// Utility to convert hyphen bullets to real bullets and make specific words semibold
function toBulletPoints(text: string) {
  return text
    .replace(/(^|\n)- /g, "$1• ")
    .replace(/(Overall summary:)/g, "<strong>$1</strong>")
    .replace(/(Specific details:)/g, "<strong>$1</strong>")
    .replace(/(Improvements:)/g, "<strong>$1</strong>");
}

export default function OutputSection({
  chatHistory,
  loading,
  showPostSurveyButton,
  onPostSurveyClick,
  currentPhase,
  onNextPhaseClick,
}: Props) {
  const chatRef = useRef<HTMLDivElement>(null);
  const [nextPhaseClicked, setNextPhaseClicked] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    });
  }, [chatHistory, loading]);

  useEffect(() => {
    setNextPhaseClicked(false);
  }, [currentPhase]);

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (chatRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setIsAtBottom(isBottom);
    }
  };

  // Handle scroll events
  useEffect(() => {
    const chatElement = chatRef.current;
    if (chatElement) {
      chatElement.addEventListener("scroll", checkIfAtBottom);
      return () => chatElement.removeEventListener("scroll", checkIfAtBottom);
    }
  }, []);

  // Show scroll indicator when there's phase ending content and user isn't at bottom
  useEffect(() => {
    // Check if there's recent phase ending content (within the last few messages)
    const recentMessages = chatHistory.slice(-5); // Check last 5 messages

    // Check if there's a next phase button that should be visible OR if phase 3 has ended
    const hasNextPhaseButton =
      (currentPhase && currentPhase < 3 && !nextPhaseClicked) ||
      (currentPhase === 3 &&
        recentMessages.some(
          (msg) =>
            msg.role === "mark" && msg.content.includes("Phase 3 has ended")
        ));

    const hasRecentPhaseEnding = recentMessages.some(
      (msg) =>
        msg.role === "mark" &&
        msg.content.includes("Phase") &&
        msg.content.includes("ended")
    );

    // Check if there's feedback/summary content that was just shown
    const hasRecentFeedbackSummary = recentMessages.some(
      (msg) =>
        msg.role === "system" &&
        (msg.content.startsWith("[FEEDBACK]") ||
          msg.content.startsWith("[SUMMARY]"))
    );

    // Check if we're currently in an active conversation (not just at the end of a phase)
    const lastMessage = chatHistory[chatHistory.length - 1];
    const isInActiveConversation =
      lastMessage &&
      (lastMessage.role === "mark" || lastMessage.role === "jane") &&
      !lastMessage.content.includes("Phase") &&
      !lastMessage.content.includes("ended") &&
      !lastMessage.content.startsWith("[FEEDBACK]") &&
      !lastMessage.content.startsWith("[SUMMARY]");

    // Only show indicator if there's recent phase ending content, feedback/summary, next phase button should be visible,
    // and we're NOT in an active conversation (i.e., we're at the end of a phase waiting for next phase button)
    if (
      hasRecentPhaseEnding &&
      hasRecentFeedbackSummary &&
      hasNextPhaseButton &&
      !isInActiveConversation &&
      !isAtBottom
    ) {
      setShowScrollIndicator(true);
    } else {
      setShowScrollIndicator(false);
    }
  }, [chatHistory, isAtBottom, currentPhase, nextPhaseClicked]);

  // Determine who should be typing
  let typingAgent: "mark" | "jane" | null = null;
  if (loading) {
    if (chatHistory.length === 0) {
      typingAgent = "mark";
    } else {
      const lastAgent = chatHistory[chatHistory.length - 1].role;
      typingAgent = lastAgent === "mark" ? "jane" : "mark";
    }
  }

  // Function to process message content
  const processMessageContent = (role: string, content: string) => {
    if (role === "mark" || role === "jane") {
      return content.split(" ").slice(4).join(" ");
    }
    return content;
  };

  // Function to determine message type and styling
  const getMessageType = (content: string) => {
    if (content.includes("Phase") && content.includes("ended")) {
      return "phase-end";
    } else if (
      content.startsWith("[FEEDBACK]") ||
      content.startsWith("[SUMMARY]")
    ) {
      return "feedback-summary";
    }
    return "normal";
  };

  return (
    <div
      ref={chatRef}
      className="bg-white shadow-md rounded-2xl p-5 h-[98vh] overflow-y-auto flex flex-col gap-6"
    >
      <div className="flex items-center gap-2 mb-2 justify-center">
        <Avatar className="w-8 h-8">
          <AvatarImage src="scam.jpg" />
          <AvatarFallback>M</AvatarFallback>
        </Avatar>

        <div className="font-semibold text-gray-700">Mark and Jane's Chat</div>
        <Avatar className="w-10 h-10">
          <AvatarImage src="/grandma.avif" />
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
      </div>
      {(() => {
        const messages = chatHistory.filter((m) => m.role !== "user");
        const renderedMessages = [];

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const isJane = msg.role === "jane";
          const isSystem = msg.role === "system";
          const messageType = getMessageType(msg.content);

          // Handle special message types
          if (messageType === "phase-end") {
            renderedMessages.push(
              <div
                key={`phase-end-${i}`}
                className="flex flex-col items-center gap-4 animate-fade-in-up transition-all duration-1000 ease-in-out"
                style={{ animationDelay: "0ms" }}
              >
                <div className="px-4 py-2 rounded-lg text-center font-semibold text-blue-800">
                  {msg.content}
                </div>
              </div>
            );
            continue;
          }

          if (messageType === "feedback-summary") {
            // Check if the next message is also feedback-summary to group them
            const nextMsg = messages[i + 1];
            const nextMessageType = nextMsg
              ? getMessageType(nextMsg.content)
              : null;

            if (nextMessageType === "feedback-summary") {
              // Group feedback and summary together
              const feedbackMsg = msg.content.startsWith("[FEEDBACK]")
                ? msg
                : nextMsg;
              const summaryMsg = msg.content.startsWith("[SUMMARY]")
                ? msg
                : nextMsg;

              const feedbackContent = feedbackMsg.content.replace(
                "[FEEDBACK] ",
                ""
              );
              const summaryContent = summaryMsg.content.replace(
                "[SUMMARY] ",
                ""
              );

              const feedbackContentBulletPoints =
                toBulletPoints(feedbackContent);
              const summaryContentBulletPoints = toBulletPoints(summaryContent);

              renderedMessages.push(
                <div
                  key={`feedback-summary-${i}`}
                  className="flex justify-center animate-fade-in-up transition-all duration-1000 ease-in-out"
                  style={{ animationDelay: "1000ms" }}
                >
                  <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-3 rounded-2xl max-w-4xl">
                    <div className="mb-4">
                      <h3 className="font-semibold text-center mb-2 text-md">
                        Feedback
                      </h3>
                      <p className="text-black whitespace-pre-line">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: feedbackContentBulletPoints,
                          }}
                        />
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-center mb-2 text-md">
                        Summary
                      </h3>
                      <p className="text-black whitespace-pre-line">
                        <span
                          dangerouslySetInnerHTML={{
                            __html: summaryContentBulletPoints,
                          }}
                        />
                      </p>
                    </div>
                  </div>
                </div>
              );

              // Add the next phase button outside the feedback container
              if (
                currentPhase &&
                currentPhase < 3 &&
                onNextPhaseClick &&
                !nextPhaseClicked
              ) {
                // Only show the button if we're in a phase that has ended (i.e., feedback/summary has been shown)
                const phaseEndIndex = messages.findIndex(
                  (msg) =>
                    msg.role === "mark" &&
                    msg.content.includes(`Phase ${currentPhase} has ended`)
                );

                // Only show button if this is the most recent feedback/summary (i.e., no more feedback/summary messages after this)
                const remainingMessages = messages.slice(i + 2); // +2 because we skip the next message
                const hasMoreFeedbackSummary = remainingMessages.some(
                  (msg) => getMessageType(msg.content) === "feedback-summary"
                );

                if (phaseEndIndex !== -1 && !hasMoreFeedbackSummary) {
                  renderedMessages.push(
                    <div
                      key={`next-phase-button-${i}`}
                      className="flex justify-center animate-fade-in-up transition-all duration-1000 ease-in-out"
                      style={{ animationDelay: "2000ms" }}
                    >
                      <button
                        onClick={() => {
                          onNextPhaseClick();
                          setNextPhaseClicked(true);
                        }}
                        disabled={nextPhaseClicked}
                        className={`py-2 px-6 rounded-2xl transition-all duration-200 text-sm font-medium ${
                          nextPhaseClicked
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110 animate-pulse"
                        }`}
                      >
                        {nextPhaseClicked ? "Starting..." : "Continue"}
                      </button>
                    </div>
                  );
                }
              }

              // Skip the next message since we've already processed it
              i++;
              continue;
            }
            // Single feedback or summary message
            const title = msg.content.startsWith("[FEEDBACK]")
              ? "Feedback"
              : "Assessment";
            const content = msg.content.replace(
              `[${title.toUpperCase().split(" ")[0]}] `,
              ""
            );

            const contentBulletPoints = toBulletPoints(content);

            renderedMessages.push(
              <div
                key={`single-${i}`}
                className="flex justify-center animate-fade-in-up transition-all duration-1000 ease-in-out"
                style={{ animationDelay: "1000ms" }}
              >
                <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-3 rounded-2xl max-w-4xl">
                  <h3 className="font-semibold mb-2 text-sm">{title}:</h3>
                  <p className="whitespace-pre-line">
                    <span
                      dangerouslySetInnerHTML={{ __html: contentBulletPoints }}
                    />
                  </p>
                </div>
              </div>
            );
            continue;
          }

          // Skip system messages that aren't feedback/summary
          if (isSystem) {
            continue;
          }

          // Normal message handling
          renderedMessages.push(
            <div
              key={`normal-${i}`}
              className={`flex items-start gap-5 animate__animated animate__fadeInUp transition-all duration-1000 ease-in-out ${
                isJane ? "justify-end" : "justify-start"
              }`}
            >
              {!isJane && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src="scam.jpg" />
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 rounded-2xl max-w-2xl ${
                  msg.role === "mark"
                    ? "bg-gray-100 text-black"
                    : "bg-blue-50 text-black"
                }`}
              >
                <p className="font-semibold">
                  {msg.role === "mark" ? "Mark" : "Jane"}
                </p>
                <p>{processMessageContent(msg.role, msg.content)}</p>
              </div>
              {isJane && (
                <Avatar className="w-11 h-11">
                  <AvatarImage src="grandma.avif" />
                  <AvatarFallback>J</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        }

        return renderedMessages;
      })()}
      {loading && typingAgent === "jane" && (
        <div className="flex justify-end items-start gap-4 animate-pulse">
          <div className="bg-gray-200 p-3 rounded-2xl max-w-2xl">
            <p className="font-semibold text-gray-700">Jane</p>
            <p className="text-gray-400">Typing...</p>
          </div>
          <Avatar className="w-11 h-11">
            <AvatarImage src="grandma.avif" />
            <AvatarFallback>J</AvatarFallback>
          </Avatar>
        </div>
      )}
      {loading && typingAgent === "mark" && (
        <div className="flex justify-start items-start gap-4 animate-pulse">
          <Avatar className="w-9.5 h-9.5">
            <AvatarImage src="scam.jpg" />
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
          <div className="bg-gray-200 p-3 rounded-2xl max-w-2xl">
            <p className="font-semibold text-gray-700">Mark</p>
            <p className="text-gray-400">Typing...</p>
          </div>
        </div>
      )}
      {showPostSurveyButton && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={onPostSurveyClick}
            className="bg-indigo-600 text-white py-3 px-8 rounded-3xl hover:bg-indigo-700 hover:scale-110 animate-pulse transition-all duration-200 text-lg"
          >
            Continue
          </button>
        </div>
      )}

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
    </div>
  );
}
