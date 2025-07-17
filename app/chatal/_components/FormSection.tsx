import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

type Message = { role: "mark" | "jane" | "user" | "system"; content: string };

interface PROPS {
  userFormInput: (advice: string) => void;
  loading: boolean;
  chatHistory: Message[];
  currentPhase: number;
  prolificPID: string | null;
  conversationId: string;
  isAdviceLocked?: boolean;
}

export default function FormSection({
  userFormInput,
  loading,
  chatHistory,
  currentPhase,
  prolificPID,
  conversationId,
  isAdviceLocked = false,
}: PROPS) {
  const [message, setMessage] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(false);
  const [hasUserGivenAdvice, setHasUserGivenAdvice] = useState(false);
  const [adviceCounter, setAdviceCounter] = useState(1);
  const [completedAdvice, setCompletedAdvice] = useState<number[]>([]);

  useEffect(() => {
    // Show initial message with a slight delay
    const timer = setTimeout(() => {
      setShowInitialMessage(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if user has given any advice
    if (chatHistory.some((msg) => msg.role === "user")) {
      setHasUserGivenAdvice(true);
    }
  }, [chatHistory]);

  // Track completed advice based on chat history
  useEffect(() => {
    const userMessages = chatHistory.filter((msg) => msg.role === "user");
    const completed = userMessages.map((_, index) => index);
    setCompletedAdvice(completed);
  }, [chatHistory]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    if (prolificPID && currentPhase) {
      await saveAdvice({
        advice: trimmed,
        PROLIFIC_PID: prolificPID,
        quizID: adviceCounter,
        phase: currentPhase,
      });
      setAdviceCounter((prev) => prev + 1);
    }

    userFormInput(trimmed);
    setMessage("");
  };

  async function saveAdvice({
    advice,
    PROLIFIC_PID,
    quizID,
    phase,
    timeStart,
    timeEnd,
  }: {
    advice: string;
    PROLIFIC_PID: string;
    quizID: number;
    phase: number;
    timeStart?: Date;
    timeEnd?: Date;
  }) {
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advice,
          PROLIFIC_PID,
          quizID,
          phase,
          timeStart,
          timeEnd,
          conversationId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save advice");
      }
      const data = await res.json();
      console.log("Advice saved:", data);
      return data;
    } catch (error) {
      console.error("Error saving advice:", error);
    }
  }

  return (
    <div className="p-5 shadow-md rounded-2xl flex flex-col h-[98vh] bg-white">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between">
          <span className="px-2 text-xs font-medium text-gray-700">
            Advice {completedAdvice.length + 1} of 6
          </span>
          <div className="px-2 flex gap-2">
            <span className="text-xs font-bold text-black">
              Phase: {currentPhase}
            </span>
            <span className="text-xs font-bold text-green-600">
              {currentPhase === 1 && "Trust Building"}
              {currentPhase === 2 && "Manipulation"}
              {currentPhase === 3 && "Extraction"}
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-3xl overflow-hidden">
          {/* Progress bar for all 6 advice blocks */}
          <div className="flex h-full">
            {[0, 1, 2, 3, 4, 5].map((adviceIndex) => (
              <div
                key={adviceIndex}
                className={`flex-1 h-full border-r border-white ${
                  completedAdvice.includes(adviceIndex)
                    ? adviceIndex < 2
                      ? "bg-green-600" // Phase 1 advice
                      : adviceIndex < 4
                      ? "bg-blue-600" // Phase 2 advice
                      : "bg-purple-600" // Phase 3 advice
                    : adviceIndex < 2
                    ? "bg-green-300" // Phase 1 advice (not completed)
                    : adviceIndex < 4
                    ? "bg-blue-300" // Phase 2 advice (not completed)
                    : "bg-purple-300" // Phase 3 advice (not completed)
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* User Advice Section */}
      <div className="h-full flex flex-col">
        <div
          className={`flex flex-col gap-3 overflow-y-auto flex-grow px-1 py-1 transition-all duration-500 ease-in-out ${
            hasUserGivenAdvice ? "mt-0" : ""
          }`}
        >
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-500 ease-in-out ${
              showInitialMessage ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-4">
              <Avatar className="w-11.5 h-11.5">
                <AvatarImage src="/grandma.avif" />
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <div className="font-semibold text-gray-800">
                Your Advice to Jane
              </div>
              <Avatar className="w-10 h-11">
                <AvatarImage src="user.jpg" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <h4 className="text-center text-sm">
              Imagine you are Jane's friend. Help prevent Jane from getting
              scammed by giving her advice. Remember to clearly justify your
              advice based on Mark's latest message.
            </h4>
          </div>
          {chatHistory
            .filter(
              (msg) =>
                msg.role === "user" ||
                (msg.role === "mark" &&
                  msg.content.includes("Phase") &&
                  msg.content.includes("ended"))
            )
            .map((msg, idx) => {
              // Check if this is a phase ending message
              if (
                msg.role === "mark" &&
                msg.content.includes("Phase") &&
                msg.content.includes("ended")
              ) {
                return (
                  <div
                    key={`phase-end-${idx}`}
                    className="flex flex-col items-center gap-4 animate-fade-in-up transition-all duration-1000 ease-in-out"
                    style={{ animationDelay: "0ms" }}
                  >
                    <div className="px-4 py-2 rounded-lg text-center font-semibold text-blue-800">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // Regular user message
              return (
                <div
                  key={idx}
                  className={`flex justify-end items-end gap-2  transition-all duration-500 ease-in-out ${
                    hasUserGivenAdvice
                      ? "animate__animated animate__fadeInUp"
                      : "animate__animated animate__fadeOut"
                  }`}
                >
                  <div className="bg-green-100 round text-black p-3 rounded-2xl max-w-3xl">
                    <p className="text-base">{msg.content}</p>
                  </div>
                  <Avatar className="w-10 h-11 mb-1">
                    <AvatarImage src="user.jpg" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </div>
              );
            })}
        </div>
        <form onSubmit={onSubmit} className="w-full flex gap-2 mt-4">
          <Input
            placeholder="Provide your advice and justification..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow rounded-3xl selection:bg-blue-500 selection:text-white"
            disabled={loading || isAdviceLocked}
          />
          <button
            type="submit"
            className={`px-4 py-1 rounded-3xl ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : isAdviceLocked
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
            disabled={loading || isAdviceLocked}
          >
            {loading ? "Sending..." : isAdviceLocked ? "Sent" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
