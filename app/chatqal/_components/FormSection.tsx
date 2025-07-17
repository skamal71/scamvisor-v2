import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Quiz, { QuizResponse } from "@/components/quiz/quiz";

type Message = { role: "mark" | "jane" | "user" | "system"; content: string };

interface PROPS {
  userFormInput: (advice: string) => void;
  loading: boolean;
  chatHistory: Message[];
  currentPhase: number;
  prolificPID: string | null;
  conversationId: string;
  conversationScenario?: number; // 1 for Pig Butchering, 2 for Imposter Scam
}

export default function FormSection({
  userFormInput,
  loading,
  chatHistory,
  currentPhase,
  prolificPID,
  conversationId,
  conversationScenario = 2, // Default to imposter scam for backward compatibility
}: PROPS) {
  const [message, setMessage] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(false);
  const [hasUserGivenAdvice, setHasUserGivenAdvice] = useState(false);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [canGiveAdvice, setCanGiveAdvice] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAttempts, setCurrentAttempts] = useState<
    { answer: string; timestamp: Date }[]
  >([]);
  const [phase2Started, setPhase2Started] = useState(false);
  const [phase3Started, setPhase3Started] = useState(false);
  const [questionCompleted, setQuestionCompleted] = useState(false);
  const [phaseEndedWithFeedback, setPhaseEndedWithFeedback] = useState(false);
  const [feedbackShown, setFeedbackShown] = useState(false);

  // Add ref for advice messages container
  const adviceMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new advice messages are added
  useEffect(() => {
    if (adviceMessagesRef.current) {
      adviceMessagesRef.current.scrollTo({
        top: adviceMessagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  useEffect(() => {
    // Show initial message with a slight delay
    const timer = setTimeout(() => {
      setShowInitialMessage(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset quiz state when phase changes
    setCurrentQuestionIndex(0);
    setQuizResponses([]);
    setCanGiveAdvice(false);
    setQuestionCompleted(false);
    setCurrentAttempts([]);
    setPhaseEndedWithFeedback(false); // Reset phase ended state for new phase
    setFeedbackShown(false); // Reset feedback shown state for new phase
  }, [currentPhase]);

  useEffect(() => {
    // Check if user has given any advice
    if (chatHistory.some((msg) => msg.role === "user")) {
      setHasUserGivenAdvice(true);
    }
  }, [chatHistory]);

  useEffect(() => {
    // Check if the current phase has ended with feedback displayed
    // Only look for feedback messages that came after the current phase started
    const currentPhaseStartIndex = chatHistory.findIndex(
      (msg) =>
        msg.role === "mark" &&
        msg.content.includes(`Phase ${currentPhase} has ended`)
    );

    let hasPhaseEndedWithFeedback = false;
    if (currentPhaseStartIndex !== -1) {
      // Look for feedback messages after the current phase ended
      const messagesAfterPhaseEnd = chatHistory.slice(
        currentPhaseStartIndex + 1
      );
      hasPhaseEndedWithFeedback = messagesAfterPhaseEnd.some(
        (msg) => msg.role === "system" && msg.content.startsWith("[FEEDBACK]")
      );
    }

    setPhaseEndedWithFeedback(hasPhaseEndedWithFeedback);

    // Set feedback shown to true when feedback is detected
    if (hasPhaseEndedWithFeedback) {
      setFeedbackShown(true);
    }
  }, [chatHistory.length, currentPhase]);

  // Effect to detect when phases start based on Mark's messages
  useEffect(() => {
    // Find the first Mark message after "Phase 1 has ended"
    const phase1EndIndex = chatHistory.findIndex(
      (msg) => msg.role === "mark" && msg.content.includes("Phase 1 has ended")
    );

    if (phase1EndIndex !== -1) {
      // Look for the first Mark message after phase 1 ended
      const messagesAfterPhase1 = chatHistory.slice(phase1EndIndex + 1);
      const firstMarkInPhase2 = messagesAfterPhase1.find(
        (msg) =>
          msg.role === "mark" &&
          !msg.content.startsWith("[FEEDBACK]") &&
          !msg.content.startsWith("[SUMMARY]")
      );

      if (firstMarkInPhase2 && !phase2Started) {
        setPhase2Started(true);
        console.log("Phase 2 started - Mark sent first message");
        // Advance to question 3 (index 2) when phase 2 starts
        setCurrentQuestionIndex(2);
      }
    }

    // Find the first Mark message after "Phase 2 has ended"
    const phase2EndIndex = chatHistory.findIndex(
      (msg) => msg.role === "mark" && msg.content.includes("Phase 2 has ended")
    );

    if (phase2EndIndex !== -1) {
      // Look for the first Mark message after phase 2 ended
      const messagesAfterPhase2 = chatHistory.slice(phase2EndIndex + 1);
      const firstMarkInPhase3 = messagesAfterPhase2.find(
        (msg) =>
          msg.role === "mark" &&
          !msg.content.startsWith("[FEEDBACK]") &&
          !msg.content.startsWith("[SUMMARY]")
      );

      if (firstMarkInPhase3 && !phase3Started) {
        setPhase3Started(true);
        console.log("Phase 3 started - Mark sent first message");
        // Advance to question 5 (index 4) when phase 3 starts
        setCurrentQuestionIndex(4);
      }
    }
  }, [chatHistory, phase2Started, phase3Started, currentQuestionIndex]);

  // Calculate which phase the current question belongs to
  const getCurrentPhaseForQuestion = () => {
    if (currentQuestionIndex < 2) return 1;
    if (currentQuestionIndex < 4) return 2;
    return 3;
  };

  // Function to determine if a question should be visible
  const shouldShowQuestion = (questionIndex: number) => {
    if (questionIndex < 2) return true; // Questions 1-2 always visible
    if (questionIndex === 2 || questionIndex === 3) {
      return phase2Started; // Questions 3-4 only after phase 2 starts
    }
    if (questionIndex === 4 || questionIndex === 5) {
      return phase3Started; // Questions 5-6 only after phase 3 starts
    }
    return false;
  };

  // We can access the quiz responses here in the console, that
  // includes the question id, selected option, question, selected answer, and isCorrect
  const handleQuizSubmit = async (response: QuizResponse) => {
    setQuizResponses((prev) => [...prev, response]);
    setCanGiveAdvice(response.isCorrect);
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
          conversationId, // now always a string
        });
      } else {
        // Optionally handle the error or show a message
      }
      // Reset attempts for next question
      setCurrentAttempts([]);

      // Mark question as completed (quiz answered correctly)
      setQuestionCompleted(true);

      // Don't advance here - wait for user to send advice
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !canGiveAdvice) return;

    // Use currentQuestionIndex + 1 as quizID (assuming zero-based index)
    const quizID = currentQuestionIndex + 1;

    if (prolificPID && quizID) {
      const phase = getCurrentPhaseForQuestion();
      await saveAdvice({
        advice: trimmed,
        PROLIFIC_PID: prolificPID,
        quizID: quizID.toString(), // convert to string if your schema expects string
        phase: phase,
        // Optionally: timeStart, timeEnd
      });
    }

    userFormInput(trimmed);
    setMessage("");
    setCanGiveAdvice(false);

    // Advance to next question after user sends advice
    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex < 6 && shouldShowQuestion(nextQuestionIndex)) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setQuestionCompleted(false);
      console.log(`Advanced to question ${nextQuestionIndex + 1}`);
    }
  };

  async function saveQuizAttempt({
    PROLIFIC_PID,
    phase,
    questionNumber,
    attempts,
    conversationId, // <-- add this
  }: {
    PROLIFIC_PID: string;
    phase: number;
    questionNumber: number;
    attempts: { answer: string; timestamp: Date }[];
    conversationId: string; // <-- add this
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
          conversationId, // <-- include here
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
    quizID: string;
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
      {/* Quiz Section - Top Half */}
      <div
        className={`h-[58%] rounded-2xl overflow-y-auto mb-2 ${
          canGiveAdvice || phaseEndedWithFeedback
            ? "border-2 border-gray-200 p-4"
            : "p-[3px]"
        }`}
        style={{
          background:
            canGiveAdvice || phaseEndedWithFeedback
              ? undefined
              : "linear-gradient(to right, #BC82F3, #F5B9EA, #8D99FF, #AA6EEE, #FF6778, #FFBA71, #C686FF)",
        }}
      >
        <div
          className={`h-full rounded-2xl overflow-y-auto ${
            canGiveAdvice || phaseEndedWithFeedback ? "" : "bg-white p-4"
          }`}
        >
          <Quiz
            currentQuestionIndex={currentQuestionIndex}
            onSubmit={handleQuizSubmit}
            currentPhase={currentPhase}
            shouldShowQuestion={shouldShowQuestion}
            conversationScenario={conversationScenario}
          />
        </div>
      </div>
      {/* Chat Section - Bottom Half */}
      <div
        className={`h-[42%] rounded-2xl flex flex-col ${
          canGiveAdvice ? "p-[3px]" : "border-2 border-gray-200 p-4"
        }`}
        style={{
          background: canGiveAdvice
            ? "linear-gradient(to right, #BC82F3, #F5B9EA, #8D99FF, #AA6EEE, #FF6778, #FFBA71, #C686FF)"
            : undefined,
        }}
      >
        <div
          className={`h-full rounded-2xl flex flex-col ${
            canGiveAdvice ? "bg-white p-4" : ""
          }`}
        >
          <div
            className={`flex flex-col gap-3 overflow-y-auto flex-grow px-1 transition-all duration-500 ease-in-out ${
              hasUserGivenAdvice ? "mt-0" : ""
            }`}
            ref={adviceMessagesRef}
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
                      <div className="px-4 py-2 text-center font-semibold text-blue-800">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                // Regular user message
                return (
                  <div
                    key={idx}
                    className={`flex justify-end items-end gap-2 transition-all duration-500 ease-in-out ${
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
              placeholder={
                canGiveAdvice
                  ? "Provide your advice and justification..."
                  : "Answer the quiz first..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={` flex-grow selection:bg-blue-500 selection:text-white ${
                !canGiveAdvice ? "bg-gray-100  rounded-3xl" : " rounded-3xl"
              }`}
              disabled={!canGiveAdvice || loading}
            />
            <button
              type="submit"
              className={`px-4 py-1 rounded-3xl ${
                canGiveAdvice
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
              disabled={!canGiveAdvice || loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
