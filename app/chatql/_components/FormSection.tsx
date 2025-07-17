"use client";
import React, { useEffect, useState } from "react";
import Quiz, { QuizResponse } from "@/components/quiz/quiz";

// FormSection component for quiz-only functionality
type Message = { role: "mark" | "jane" | "user" | "system"; content: string };

interface PROPS {
  loading: boolean;
  chatHistory: Message[];
  currentPhase: number;
  prolificPID: string | null;
  conversationId: string;
  onQuizAnswered?: () => void;
  conversationScenario?: number; // 1 for Pig Butchering, 2 for Imposter Scam
}

export default function FormSection({
  loading,
  chatHistory,
  currentPhase,
  prolificPID,
  conversationId,
  onQuizAnswered,
  conversationScenario = 2, // Default to imposter scam for backward compatibility
}: PROPS) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<
    { answer: string; timestamp: Date }[]
  >([]);
  const [questionCompleted, setQuestionCompleted] = useState(false);

  // Track phase transitions
  const [phase2Started, setPhase2Started] = useState(false);
  const [phase3Started, setPhase3Started] = useState(false);

  // Monitor phase changes to show appropriate questions
  useEffect(() => {
    if (currentPhase >= 2) {
      setPhase2Started(true);
    }
    if (currentPhase >= 3) {
      setPhase3Started(true);
    }
  }, [currentPhase]);

  // Monitor chat history to detect Mark messages and enable quiz questions
  useEffect(() => {
    // Count Mark messages in current phase (excluding summary)
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
      (msg) => msg.role === "mark" && !msg.content.startsWith("[SUMMARY]")
    ).length;

    // Enable quiz questions based on Mark messages
    // Each Mark message (except the last one) should enable a quiz question
    if (markMessagesInPhase > 0 && markMessagesInPhase < 3) {
      // Mark has sent a message, enable the corresponding quiz question
      const expectedQuestionIndex =
        (currentPhase - 1) * 2 + (markMessagesInPhase - 1);
      if (expectedQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(expectedQuestionIndex);
        setQuestionCompleted(false);
      }
    }
  }, [chatHistory, currentPhase, currentQuestionIndex]);

  // Function to determine current phase for quiz questions
  const getCurrentPhaseForQuestion = () => {
    if (currentQuestionIndex < 2) return 1;
    if (currentQuestionIndex < 4) return 2;
    return 3;
  };

  // Function to determine if a question should be visible
  const shouldShowQuestion = (questionIndex: number) => {
    // Only show the current question that corresponds to the latest Mark message
    return questionIndex === currentQuestionIndex;
  };

  // Handle quiz submission
  const handleQuizSubmit = async (response: QuizResponse) => {
    setQuizResponses((prev) => [...prev, response]);
    console.log("Quiz Response:", JSON.stringify(response, null, 2));

    // Add the selected answer to the attempts array
    setCurrentAttempts((prev) => [
      ...prev,
      { answer: response.selectedAnswer, timestamp: new Date() },
    ]);

    // Only save to DB if correct answer is selected
    if (response.isCorrect) {
      if (!prolificPID) {
        alert("Missing PROLIFIC_PID. Please sign in again.");
        return;
      }
      const phase = getCurrentPhaseForQuestion();
      const questionNumber = (currentQuestionIndex % 2) + 1; // Question 1 or 2 within the phase
      const attempts = [
        ...currentAttempts,
        { answer: response.selectedAnswer, timestamp: new Date() },
      ]; // all attempts including the correct one

      if (conversationId) {
        await saveQuizAttempt({
          PROLIFIC_PID: prolificPID,
          phase,
          questionNumber,
          attempts,
          conversationId,
        });
      }

      // Reset attempts for next question
      setCurrentAttempts([]);

      // Mark question as completed (quiz answered correctly)
      setQuestionCompleted(true);

      // Advance to next question after correct answer
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < 6 && shouldShowQuestion(nextQuestionIndex)) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setQuestionCompleted(false);
        console.log(`Advanced to question ${nextQuestionIndex + 1}`);
      }

      if (onQuizAnswered) {
        onQuizAnswered();
      }
    }
  };

  async function saveQuizAttempt({
    PROLIFIC_PID,
    phase,
    questionNumber,
    attempts,
    conversationId,
  }: {
    PROLIFIC_PID: string;
    phase: number;
    questionNumber: number;
    attempts: { answer: string; timestamp: Date }[];
    conversationId: string;
  }) {
    try {
      const res = await fetch("/api/quizAttempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PROLIFIC_PID,
          phase,
          questionNumber,
          attempts,
          conversationId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save quiz attempt");
      }
      const data = await res.json();
      console.log("Quiz attempt saved:", data);
      return data;
    } catch (error) {
      console.error("Error saving quiz attempt:", error);
    }
  }

  return (
    <div className="p-5 shadow-md rounded-2xl flex flex-col h-[98vh] bg-white">
      {/* Quiz Section */}
      <div className="h-full rounded-2xl overflow-y-auto">
        <Quiz
          currentQuestionIndex={currentQuestionIndex}
          onSubmit={handleQuizSubmit}
          currentPhase={currentPhase}
          shouldShowQuestion={shouldShowQuestion}
          conversationScenario={conversationScenario}
        />
      </div>
    </div>
  );
}
