"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/modal";

type AttentionCheckResponses = {
  videoContent: string;
  systemPurpose: string[];
  adviceRole: string;
  phaseUnderstanding: string;
  [key: string]: string | string[]; // Add index signature to allow string indexing
};

// Add a type to track selected option indices
type SelectedOptions = {
  videoContent: number;
  systemPurpose: number[];
  adviceRole: number;
  phaseUnderstanding: number;
  [key: string]: number | number[]; // Add index signature to allow string indexing
};

const questions = [
  {
    id: "videoContent",
    question: "What type of scam was discussed in the video?",
    options: [
      "Job Scams",
      "Pig Butchering Scams",
      "Online Shopping Scams",
      "Imposter Scams",
    ],
    multiple: false,
  },
  {
    id: "systemPurpose",
    question:
      "What will you need to do during the conversation? Select all that apply.",
    options: [
      "Type out messages to help someone not get scammed",
      "Answer multiple choice questions",
      "Answer true/false questions",
      "Read a live conversation between a scammer and their target",
      "Practice scamming someone",
    ],
    correctAnswers: [0, 1, 2, 3, 4], // All options are correct
    multiple: true,
  },
];

export default function AttentionCheckPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<AttentionCheckResponses>({
    videoContent: "",
    systemPurpose: [],
    adviceRole: "",
    phaseUnderstanding: "",
  });
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    videoContent: -1,
    systemPurpose: [],
    adviceRole: -1,
    phaseUnderstanding: -1,
  });
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    // Check if user is authenticated and has completed survey and videos
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then((user) => {
        if (user.error) {
          // If unauthorized, redirect to sign-in
          window.location.href = "/sign-in";
          return;
        }

        // If user hasn't completed the survey, redirect to survey
        if (!user.hasCompletedPreSurvey) {
          window.location.href = "/survey";
          return;
        }

        // If user hasn't watched the video, redirect to video instructions
        const videoWatched = sessionStorage.getItem("videoWatched");
        if (videoWatched !== "true") {
          // Check if user has completed chat (using session storage)
          // If they have, they might be coming back from post-survey, so redirect to post-survey
          const chatCompleted = sessionStorage.getItem("chatCompleted");
          if (chatCompleted !== "true") {
            window.location.href = "/video-instructions";
            return;
          } else {
            // If they have completed chat, redirect to post-survey instead of attention check
            window.location.href = "/post-survey";
            return;
          }
        }

        // If user has already completed the attention check, redirect to assigned chat
        if (user.hasCompletedAttentionCheck) {
          // Check if user has completed chat (using session storage)
          const chatCompleted = sessionStorage.getItem("chatCompleted");
          if (chatCompleted === "true") {
            // If they've completed chat, they should go to post-survey
            window.location.href = "/post-survey";
            return;
          } else {
            // Otherwise, go to assigned chat
            const assignedChatModel =
              sessionStorage.getItem("assignedChatModel");
            if (assignedChatModel) {
              window.location.href = assignedChatModel;
            } else {
              // Fallback, redirect to video instructions to get assigned model
              window.location.href = "/video-instructions";
            }
            return;
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        window.location.href = "/sign-in";
      });
  }, []);

  // Prevent back navigation by pushing current state
  useEffect(() => {
    // Push current state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
  }, []);

  // Handle back navigation warning and refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning if the user is actually trying to refresh or close the page
      // Check if this is a legitimate navigation within the app
      const isLegitimateNavigation =
        sessionStorage.getItem("legitimateNavigation") === "true";

      if (!isLegitimateNavigation) {
        const message =
          "Please do not refresh or navigate away from the attention check. Your progress will be lost and you might not get the compensation for completion.";
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

    const handlePopState = () => {
      // Show warning modal instead of redirecting
      setShowBackWarning(true);
      // Push current state back to prevent actual navigation
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleOptionSelect = (optionIndex: number) => {
    const currentQ = questions[currentQuestion];
    console.log(`Setting ${currentQ.id} to ${optionIndex}`);

    if (currentQ.multiple) {
      // Handle multiple selections
      setSelectedOptions((prev) => {
        const currentSelections = (prev[currentQ.id] as number[]) || [];
        const newSelections = currentSelections.includes(optionIndex)
          ? currentSelections.filter((i) => i !== optionIndex)
          : [...currentSelections, optionIndex];

        return {
          ...prev,
          [currentQ.id]: newSelections,
        };
      });
    } else {
      // Handle single selection
      setSelectedOptions((prev) => ({
        ...prev,
        [currentQ.id]: optionIndex,
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // --- NEW: Save selected answer choices to Survey model ---
      // Format selected options as array of { questionId, answer }
      const attentionCheckAnswers = Object.entries(selectedOptions).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        })
      );

      // Save correct/incorrect for User model (existing logic)
      const attentionCheckResponses: AttentionCheckResponses = {
        videoContent: "",
        systemPurpose: [],
        adviceRole: "",
        phaseUnderstanding: "",
      };

      // Helper function to get correct answer for video content question
      const getVideoContentCorrectAnswer = () => {
        const assignedScenario = sessionStorage.getItem("assignedScenario");
        if (assignedScenario === "1") {
          return 1; // Pig Butchering Scams (index 1)
        } else if (assignedScenario === "2") {
          return 3; // Imposter Scams (index 3)
        }
        return 0; // fallback
      };

      // Helper function to get correct answers for systemPurpose based on assigned video/scenario
      const getSystemPurposeCorrectAnswers = () => {
        const assignedVideo = sessionStorage.getItem("assignedVideo");
        // Use filler answers for now
        if (assignedVideo === "/imposterChatAl.mp4") {
          return [0]; // Only option 1 is correct for videoA
        } else if (assignedVideo === "/imposterChatQAL2.mp4") {
          return [0, 1]; // Only option 2 is correct for videoB
        } else if (assignedVideo === "/imposterChatQl.mp4") {
          return [1]; // Only option 2 is correct for videoB
        } else if (assignedVideo === "/imposterChatSt.mp4") {
          return [3]; // Only option 2 is correct for videoB
        }
        return [0, 1, 2, 3, 4]; // Default: all options correct
      };

      // Convert selected option indices to correct/incorrect responses
      questions.forEach((question) => {
        if (question.multiple) {
          // Handle multiple selection questions
          const selectedIndices = selectedOptions[question.id] as number[];
          const correctAnswers =
            question.id === "systemPurpose"
              ? getSystemPurposeCorrectAnswers()
              : question.correctAnswers as number[];

          if (selectedIndices && selectedIndices.length > 0) {
            // Check if all selected answers are correct and all correct answers are selected
            const allSelectedAreCorrect = selectedIndices.every((index) =>
              correctAnswers.includes(index)
            );
            const allCorrectAreSelected = correctAnswers.every((index) =>
              selectedIndices.includes(index)
            );

            attentionCheckResponses[question.id] =
              allSelectedAreCorrect && allCorrectAreSelected
                ? "Correct"
                : "Incorrect";
          }
        } else {
          // Handle single selection questions
          const selectedIndex = selectedOptions[question.id] as number;
          if (selectedIndex !== -1) {
            let correctAnswer: number;
            if (question.id === "videoContent") {
              correctAnswer = getVideoContentCorrectAnswer();
            } else {
              correctAnswer = 0; // fallback for any other single selection questions
            }
            attentionCheckResponses[question.id] =
              selectedIndex === correctAnswer ? "Correct" : "Incorrect";
          }
        }
      });

      console.log(
        "Submitting attention check responses:",
        attentionCheckResponses
      );

      // Validate that all responses are set
      const requiredFields = questions.map((q) => q.id);
      const missingFields = requiredFields.filter(
        (field) =>
          !attentionCheckResponses[field] ||
          attentionCheckResponses[field] === ""
      );

      if (missingFields.length > 0) {
        console.error("Missing responses for fields:", missingFields);
        throw new Error(`Missing responses for: ${missingFields.join(", ")}`);
      }

      // Validate that all responses are either "Correct" or "Incorrect"
      const invalidResponses = requiredFields.filter(
        (field) =>
          attentionCheckResponses[field] !== "Correct" &&
          attentionCheckResponses[field] !== "Incorrect"
      );

      if (invalidResponses.length > 0) {
        console.error("Invalid response values for fields:", invalidResponses);
        throw new Error(
          `Invalid response values for: ${invalidResponses.join(", ")}`
        );
      }

      // Send both to backend
      const res = await fetch("/api/attention-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attentionCheckResponses,    // for User model
          attentionCheckAnswers,      // for Survey model
        }),
        credentials: "include",
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Server error response:", errorData);
        throw new Error(
          errorData.error || `Failed to submit attention check (${res.status})`
        );
      }

      const data = await res.json();
      console.log("Success response:", data);

      console.log(
        "Attention check completed successfully. Redirecting to assigned chat route."
      );

      // Set flag to indicate legitimate navigation
      sessionStorage.setItem("legitimateNavigation", "true");

      // Redirect to assigned chat page
      const assignedChatModel = sessionStorage.getItem("assignedChatModel");
      if (assignedChatModel) {
        window.location.href = assignedChatModel;
      } else {
        // Fallback, redirect to video instructions to get assigned model
        window.location.href = "/video-instructions";
      }
    } catch (error) {
      console.error("Attention check submission error:", error);
      setLoading(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const allQuestionsAnswered = questions.every((question) => {
    if (question.multiple) {
      const selections = selectedOptions[question.id] as number[];
      return selections && selections.length > 0;
    } else {
      return selectedOptions[question.id] !== -1;
    }
  });

  return (
    <div
      className={`min-h-screen bg-indigo-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Header */}

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`w-full p-4 bg-white text-left rounded-2xl border-2 transition-all duration-200 flex items-center ${
                  currentQ.multiple
                    ? (selectedOptions[currentQ.id] as number[])?.includes(
                        index
                      )
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 hover:border-gray-500 text-gray-700"
                    : selectedOptions[currentQ.id] === index
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                    : "border-gray-200 hover:border-gray-500 text-gray-700"
                }`}
              >
                {currentQ.multiple && (
                  <div
                    className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                      (selectedOptions[currentQ.id] as number[])?.includes(
                        index
                      )
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {(selectedOptions[currentQ.id] as number[])?.includes(
                      index
                    ) && (
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
                )}
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`w-32 px-6 py-3 rounded-3xl font-semibold transition-all duration-200 ${
              currentQuestion === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-600 text-white hover:bg-gray-700"
            }`}
          >
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || loading}
              className={`w-32 px-6 py-3 rounded-3xl font-semibold transition-all duration-200 ${
                allQuestionsAnswered && !loading
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                currentQ.multiple
                  ? !(selectedOptions[currentQ.id] as number[])?.length
                  : selectedOptions[currentQ.id] === -1
              }
              className={`w-32 px-6 py-3 rounded-3xl font-semibold transition-all duration-200 ${
                currentQ.multiple
                  ? (selectedOptions[currentQ.id] as number[])?.length
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : selectedOptions[currentQ.id] !== -1
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          )}
        </div>

        {/* Instructions */}
        {/* <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Please answer all questions based on
            what you learned from the videos. This helps us ensure you
            understand how the system works before proceeding to the chat.
          </p>
        </div> */}
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
                  // Clear session storage and redirect to video instructions
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("videoWatched");
                    sessionStorage.removeItem("assignedVideo");
                    sessionStorage.removeItem("assignedChatModel");
                    sessionStorage.removeItem("assignedScenario");
                    // Don't clear chatCompleted - keep it so they can access post-survey
                    window.location.href = "/video-instructions";
                  }
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
              ⚠️ Warning: Back Navigation Detected
            </h2>
            <p className="text-gray-700 text-lg mb-6">
              Going back will restart your attention check from the beginning.
              All your current progress will be lost and you might not get the
              compensation for completion.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowBackWarning(false)}
                className="bg-gray-500 text-white py-2 px-6 rounded-3xl hover:bg-gray-600 transition-colors"
              >
                Continue Attention Check
              </button>
              <button
                onClick={() => {
                  setShowBackWarning(false);
                  // Clear session storage and redirect to video instructions
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("videoWatched");
                    sessionStorage.removeItem("assignedVideo");
                    sessionStorage.removeItem("assignedChatModel");
                    sessionStorage.removeItem("assignedScenario");
                    // Don't clear chatCompleted - keep it so they can access post-survey
                    window.location.href = "/video-instructions";
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
