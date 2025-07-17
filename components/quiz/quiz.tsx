"use client";
import React, { useState, useEffect } from "react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  onAnswerSubmit?: (questionId: number, selectedOption: number) => void;
  onSubmit?: (answers: QuizResponse) => void;
  currentQuestionIndex: number;
  currentPhase: number;
  shouldShowQuestion?: (questionIndex: number) => boolean;
  conversationScenario?: number; // 1 for Pig Butchering, 2 for Imposter Scam
}

export interface QuizResponse {
  questionId: number;
  selectedOption: number;
  question: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

export default function Quiz({
  onAnswerSubmit,
  onSubmit,
  currentQuestionIndex,
  currentPhase,
  shouldShowQuestion,
  conversationScenario = 2, // Default to imposter scam for backward compatibility
}: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Function to get the correct answer based on conversation scenario
  const getCorrectAnswer = (
    questionId: number,
    phase: number,
    defaultAnswer: number
  ): number => {
    let correctAnswer = defaultAnswer;

    if (conversationScenario === 1) {
      // Pig Butchering Scam
      if (phase === 1 && questionId === 1) {
        correctAnswer = 1; // For pig butchering phase 1, question 1: correct answer should be 1
      } else if (phase === 2 && questionId === 1) {
        correctAnswer = 3; // For pig butchering phase 2, question 1: correct answer should be 3
      } else if (phase === 3 && questionId === 1) {
        correctAnswer = 2; // For pig butchering phase 3, question 1: correct answer should be 2
      }
      console.log(
        `Quiz: Phase ${phase}, Question ${questionId}, Scenario 1 (Pig Butchering), Correct Answer: ${correctAnswer}`
      );
    } else {
      // Imposter Scam (scenario 2)
      if (phase === 1 && questionId === 1) {
        correctAnswer = 0; // For imposter phase 1, question 1: correct answer should be 0
      } else if (phase === 2 && questionId === 1) {
        correctAnswer = 0; // For imposter phase 2, question 1: correct answer should be 0
      } else if (phase === 3 && questionId === 1) {
        correctAnswer = 1; // For imposter phase 3, question 1: correct answer should be 1
      }
      console.log(
        `Quiz: Phase ${phase}, Question ${questionId}, Scenario 2 (Imposter), Correct Answer: ${correctAnswer}`
      );
    }

    return correctAnswer;
  };

  // Create questions with dynamic correct answers
  const createQuestions = () => {
    const basePhase1Questions = [
      {
        id: 1,
        question: "In this scenario, how is Mark contacting Jane?",
        options: [
          "Pretending to be a relative from a new number",
          "Pretending to reach out to a close friend and start casual conversation",
          "Pretending to be someone famous",
          "Pretending to be a government official",
        ],
        correctAnswer: 3, // default
      },
      {
        id: 2,
        question:
          "Mark is quickly trying to quickly build trust with Jane, what should Jane do?",
        options: [
          "Engage openly to quickly confirm their intentions.",
          "Trust them initially and monitor closely.",
          "Respond warmly to avoid appearing rude",
          "Remain cautious and limit personal information shared.",
        ],
        correctAnswer: 3, // default
      },
    ];

    const basePhase2Questions = [
      {
        id: 1,
        question: "In this conversation, what tactic is Mark using?",
        options: [
          "Creating a sense of urgency or emotional pressure.",
          "Claiming you’ve won a prize but must act quickly to claim it",
          'Pretends your device is infected and urges you to install a "security fix" immediately.',
          "Describes personal success stories with fast returns and high potential.",
        ],
        correctAnswer: 1, // default
      },
      {
        id: 2,
        question:
          "What is the correct way for Jane to respond when Mark tries to shift their decision-making from logic to emotion?",
        options: [
          "Stay open-minded and hear them out in case the opportunity is real.",
          "Respond with great interest and ask for more details.",
          "Pause and verify the situation only through trusted, independent sources.",
          "Take small steps first to show you're interested without committing too much.",
        ],
        correctAnswer: 2, // default
      },
    ];

    const basePhase3Questions = [
      {
        id: 1,
        question:
          " Which of the following tactics is Mark using during the extraction phase of Imposter Scam?",
        options: [
          "Claim you've won a prize but must pay a processing or tax fee before receiving it.",
          "Ask for money urgently to deal with a family/friend emergency.",
          "Discuss personal profits and pressure you to invest a larger amount quickly.",
          "Encourage you to install remote software to fix your device while monitoring your bank account.",
        ],
        correctAnswer: 1, // default
      },
      {
        id: 2,
        question:
          " What should you do when someone you trust online suddenly asks for money: maybe for an investment, to fix a problem, or help with something urgent?",
        options: [
          "Agree to help with a small amount first, just to show good faith.",
          "Schedule to send them in a few more days.",
          "Refuse immediately and stop responding to them, even if their story sounds convincing.",
          "Send the money if you've already been chatting for a while and nothing seems off.",
        ],
        correctAnswer: 2, // default
      },
    ];

    // Apply dynamic correct answers based on scenario
    const phase1Questions = basePhase1Questions.map((q) => ({
      ...q,
      correctAnswer: getCorrectAnswer(q.id, 1, q.correctAnswer),
    }));

    const phase2Questions = basePhase2Questions.map((q) => ({
      ...q,
      correctAnswer: getCorrectAnswer(q.id, 2, q.correctAnswer),
    }));

    const phase3Questions = basePhase3Questions.map((q) => ({
      ...q,
      correctAnswer: getCorrectAnswer(q.id, 3, q.correctAnswer),
    }));

    return {
      phase1Questions,
      phase2Questions,
      phase3Questions,
    };
  };

  const { phase1Questions, phase2Questions, phase3Questions } =
    createQuestions();

  // Combine all questions from all phases into one array
  const allQuestions = [
    ...phase1Questions,
    ...phase2Questions,
    ...phase3Questions,
  ];

  // Use the global question index to get the current question
  const currentQuestion = allQuestions[currentQuestionIndex];

  useEffect(() => {
    // Reset state when question changes
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowFeedback(false);
    setIsVisible(false);
    setShowExplanation(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionIndex: number) => {
    // Check if currentQuestion exists before proceeding
    if (!currentQuestion) {
      console.error("Current question is undefined");
      return;
    }

    // If user has already submitted a wrong answer, allow them to select a new option
    if (isSubmitted && !isCorrect) {
      setSelectedOption(optionIndex);
      setUserAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionIndex,
      }));
      // Reset submission state to allow new submission
      setIsSubmitted(false);
      setShowFeedback(false);
      return;
    }

    setSelectedOption(optionIndex);
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));

    if (onAnswerSubmit) {
      onAnswerSubmit(currentQuestion.id, optionIndex);
    }
  };

  const handleSubmit = () => {
    // Check if currentQuestion exists before proceeding
    if (!currentQuestion) {
      console.error("Current question is undefined");
      return;
    }

    setIsSubmitted(true);
    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setCorrectAnswers((prev) => [...prev, currentQuestionIndex]);
      // Trigger explanation animation with a delay
      setTimeout(() => {
        setShowExplanation(true);
      }, 600);
    }

    if (onSubmit) {
      const response: QuizResponse = {
        questionId: currentQuestion.id,
        selectedOption: selectedOption!,
        question: currentQuestion.question,
        selectedAnswer: currentQuestion.options[selectedOption!],
        isCorrect: correct,
      };
      onSubmit(response);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    if (!isCorrect) {
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  // Calculate which phase the current question belongs to
  const getCurrentPhase = () => {
    if (currentQuestionIndex < 2) return 1;
    if (currentQuestionIndex < 4) return 2;
    return 3;
  };

  const currentPhaseForQuestion = getCurrentPhase();

  // Calculate global question number (continues across phases)
  const globalQuestionNumber = currentQuestionIndex + 1;

  // If currentQuestion is undefined, show a loading state or error
  if (!currentQuestion) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  // Check if current question should be shown
  if (shouldShowQuestion && !shouldShowQuestion(currentQuestionIndex)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-8 w-8 bg-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600">Waiting for next phase to begin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Progress Bar */}
      <div className="mb-2.5">
        <div className="flex justify-between">
          <span className="px-2 text-xs font-medium text-black">
            Question {globalQuestionNumber} of 6
          </span>
          <div className="px-2 flex gap-2">
            <span className="text-xs font-bold text-black">
              Phase {currentPhaseForQuestion}:
            </span>
            <span className="text-xs font-bold text-green-600">
              {currentPhaseForQuestion === 1 && "Trust Building"}
              {currentPhaseForQuestion === 2 && "Manipulation"}
              {currentPhaseForQuestion === 3 && "Extraction"}
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-black rounded-3xl overflow-hidden">
          {/* Progress bar for all 6 questions */}
          <div className="flex h-full">
            {[0, 1, 2, 3, 4, 5].map((questionIndex) => (
              <div
                key={questionIndex}
                className={`flex-1 h-full border-r border-white ${
                  correctAnswers.includes(questionIndex)
                    ? questionIndex < 2
                      ? "bg-green-600" // Phase 1 questions
                      : questionIndex < 4
                      ? "bg-blue-600" // Phase 2 questions
                      : "bg-purple-600" // Phase 3 questions
                    : questionIndex < 2
                    ? "bg-green-300" // Phase 1 questions (not completed)
                    : questionIndex < 4
                    ? "bg-blue-300" // Phase 2 questions (not completed)
                    : "bg-purple-300" // Phase 3 questions (not completed)
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`transition-all  py-2 duration-500 ease-in-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="-mb-2">
          <p className="text-black font-semibold text-sm  px-2 py-1 mb-4">
            {currentQuestion.question}
          </p>
        </div>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            const isCorrectAnswer = index === currentQuestion.correctAnswer;
            const showExplanation =
              isSubmitted && isCorrect && selectedOption === index;

            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full p-1.5 text-left text-sm rounded-2xl transition-all duration-200 flex items-start gap-3 ${
                    selectedOption === index
                      ? isSubmitted && !isCorrect
                        ? "bg-red-50 border-2 border-red-500"
                        : isSubmitted && isCorrect
                        ? "bg-emerald-50 border-2 border-emerald-500"
                        : "bg-indigo-100 border-2 border-indigo-500"
                      : isSubmitted && !isCorrect && selectedOption === index
                      ? "bg-red-50 border-2 border-red-500"
                      : "bg-white border-2 border-gray-200 hover:border-indigo-300"
                  }`}
                  disabled={isSubmitted && isCorrect}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5 ${
                      selectedOption === index
                        ? isSubmitted && !isCorrect
                          ? "bg-red-500 text-white"
                          : isSubmitted && isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-indigo-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {letter}
                  </div>
                  <div className="flex-1">
                    <span className="block">{option}</span>
                    {showExplanation && selectedOption === index && (
                      <div
                        className={`transition-all duration-1000 ease-out ${
                          showExplanation
                            ? "opacity-100 max-h-32 translate-y-0"
                            : "opacity-0 max-h-0 translate-y-2"
                        }`}
                      >
                        <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
                          Correct! This is the right choice because it helps
                          protect against scams by verifying the identity of the
                          person requesting help and involving trusted family
                          members in the decision-making process.
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          {!(isSubmitted && isCorrect) && (
            <button
              onClick={handleSubmit}
              disabled={
                selectedOption === null ||
                (isSubmitted && isCorrect) ||
                (isSubmitted && !isCorrect)
              }
              className={`px-3 py-2 rounded-2xl text-white text-sm font-medium transition-all duration-200 ${
                selectedOption === null ||
                (isSubmitted && isCorrect) ||
                (isSubmitted && !isCorrect)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
              }`}
            >
              {isSubmitted && !isCorrect ? "Try Again" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";
// import React, { useState, useEffect } from "react";

// interface Question {
//   id: number;
//   question: string;
//   options: string[];
//   correctAnswer: number;
// }

// interface QuizProps {
//   onAnswerSubmit?: (questionId: number, selectedOption: number) => void;
//   onSubmit?: (answers: QuizResponse) => void;
//   currentQuestionIndex: number;
//   currentPhase: number;
// }

// export interface QuizResponse {
//   questionId: number;
//   selectedOption: number;
//   question: string;
//   selectedAnswer: string;
//   isCorrect: boolean;
// }

// const phase1Questions: Question[] = [
//   {
//     id: 1,
//     question: "Should Grandma send the money and why?",
//     options: [
//       "No, offer to buy a ticket home and send it to Timmy",
//       "Yes, Grandma is a good person and should help",
//       "Yes, because she is rich",
//       "No, she should never send money online",
//     ],
//     correctAnswer: 3,
//   },
//   {
//     id: 2,
//     question: "Why is Timmy so opposed to you contacting his parents",
//     options: [
//       "Becasue he is not truly Timmy but is instead an imposter",
//       "Because he does not like his parents",
//       "Because he forgot to tell his parents about his trip",
//       "Because his parents are not rich",
//     ],
//     correctAnswer: 0,
//   },
//   {
//     id: 3,
//     question: "What is a potential red flag in this conversation?",
//     options: [
//       "The sender claimed to have sent the message to the wrong number.",
//       "The sender apologized and ended the conversation immediately.",
//       "The sender asked about Jane's day in a casual, friendly way.",
//       "The sender used emojis in the message",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 4,
//     question:
//       "If you receive an urgent request for money from a family member, what should you do?",
//     options: [
//       "Send money immediately",
//       "Call them directly to verify",
//       "Ignore the message",
//       "Ask for more details via email",
//     ],
//     correctAnswer: 1,
//   },
// ];

// const phase2Questions: Question[] = [
//   {
//     id: 1,
//     question:
//       "What should Grandma do when someone claims to be a family member with a new number?",
//     options: [
//       "Immediately trust them and continue the conversation",
//       "Ask personal questions that only the real family member would know",
//       "Send them money to help with their situation",
//       "Share personal information to verify their identity",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 2,
//     question: "Why might a scammer try to create urgency in their messages?",
//     options: [
//       "They want to make the conversation more exciting",
//       "They want to prevent the victim from thinking clearly",
//       "They are in a hurry to help the victim",
//       "They want to show they are busy and important",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 3,
//     question:
//       "What's the best way to verify if a message is from a real family member?",
//     options: [
//       "Ask them to send a selfie",
//       "Call the family member on their known number",
//       "Ask them to video call",
//       "Check their social media profiles",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 4,
//     question: "What should you do if you suspect a message is from a scammer?",
//     options: [
//       "Engage with them to waste their time",
//       "Block the number and report it to authorities",
//       "Send them fake information",
//       "Tell them you know they're a scammer",
//     ],
//     correctAnswer: 1,
//   },
// ];

// const phase3Questions: Question[] = [
//   {
//     id: 1,
//     question:
//       "What's the most suspicious aspect of someone claiming to be stranded?",
//     options: [
//       "They're asking for help",
//       "They're avoiding contact with parents",
//       "They're in a public place",
//       "They're using a new phone",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 2,
//     question: "Why might a scammer claim to be stranded in another city?",
//     options: [
//       "To make the story more believable",
//       "To create urgency and sympathy",
//       "To avoid meeting in person",
//       "To explain why they need money",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 3,
//     question:
//       "What's the safest way to help someone who claims to be stranded?",
//     options: [
//       "Send money directly to their account",
//       "Contact their parents or family members",
//       "Book a hotel room for them",
//       "Send them a gift card",
//     ],
//     correctAnswer: 1,
//   },
//   {
//     id: 4,
//     question: "What's a red flag when someone claims to be stranded?",
//     options: [
//       "They're in a safe location",
//       "They refuse to contact their parents",
//       "They're asking for specific help",
//       "They're using a new phone number",
//     ],
//     correctAnswer: 1,
//   },
// ];

// export default function Quiz({
//   onAnswerSubmit,
//   onSubmit,
//   currentQuestionIndex,
//   currentPhase,
// }: QuizProps) {
//   const [selectedOption, setSelectedOption] = useState<number | null>(null);
//   const [isVisible, setIsVisible] = useState(false);
//   const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [showFeedback, setShowFeedback] = useState(false);
//   const [isCorrect, setIsCorrect] = useState(false);
//   const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
//   const [showExplanation, setShowExplanation] = useState(false);

//   const questions =
//     currentPhase === 1
//       ? phase1Questions
//       : currentPhase === 2
//       ? phase2Questions
//       : phase3Questions;

//   useEffect(() => {
//     // Reset state when question changes
//     setSelectedOption(null);
//     setIsSubmitted(false);
//     setShowFeedback(false);
//     setIsVisible(false);
//     setShowExplanation(false);
//     const timer = setTimeout(() => setIsVisible(true), 100);
//     return () => clearTimeout(timer);
//   }, [currentQuestionIndex]);

//   const handleOptionSelect = (optionIndex: number) => {
//     setSelectedOption(optionIndex);
//     setUserAnswers((prev) => ({
//       ...prev,
//       [questions[currentQuestionIndex].id]: optionIndex,
//     }));

//     if (onAnswerSubmit) {
//       onAnswerSubmit(questions[currentQuestionIndex].id, optionIndex);
//     }
//   };

//   const handleSubmit = () => {
//     setIsSubmitted(true);
//     const currentQuestion = questions[currentQuestionIndex];
//     const correct = selectedOption === currentQuestion.correctAnswer;
//     setIsCorrect(correct);
//     setShowFeedback(true);

//     if (correct) {
//       setCorrectAnswers((prev) => [...prev, currentQuestionIndex]);
//       // Trigger explanation animation with a delay
//       setTimeout(() => {
//         setShowExplanation(true);
//       }, 500);
//     }

//     if (onSubmit) {
//       const response: QuizResponse = {
//         questionId: currentQuestion.id,
//         selectedOption: selectedOption!,
//         question: currentQuestion.question,
//         selectedAnswer: currentQuestion.options[selectedOption!],
//         isCorrect: correct,
//       };
//       onSubmit(response);
//     }
//   };

//   const handleFeedbackClose = () => {
//     setShowFeedback(false);
//     if (!isCorrect) {
//       setSelectedOption(null);
//       setIsSubmitted(false);
//     }
//   };

//   const currentQuestion = questions[currentQuestionIndex];

//   return (
//     <div className="w-full h-full flex flex-col">
//       {/* Progress Bar */}
//       <div className="mb-6">
//         <div className="flex justify-between">
//           <span className="px-2 text-xs font-medium text-gray-700">
//             Question {currentQuestionIndex + 1} of {questions.length}
//           </span>
//           <div className="px-2 flex gap-2">
//             <span className="text-xs font-bold text-black">
//               Phase: {currentPhase}
//             </span>
//             <span className="text-xs font-bold text-green-600">Phase Name</span>
//           </div>
//         </div>
//         <div className="w-full h-2.5 bg-gray-200 rounded-3xl overflow-hidden">
//           {/* Three main segments for phases */}
//           <div className="flex h-full">
//             {/* Phase 1 - Light to Dark Green */}
//             <div className="w-1/3 h-full">
//               <div className="flex h-full">
//                 {[0, 1, 2, 3].map((q) => (
//                   <div
//                     key={q}
//                     className={`w-1/4 h-full border-r border-white ${
//                       currentPhase === 1 && correctAnswers.includes(q)
//                         ? "bg-green-600"
//                         : currentPhase > 1
//                         ? "bg-green-600"
//                         : "bg-green-300"
//                     }`}
//                   />
//                 ))}
//               </div>
//             </div>
//             {/* Phase 2 - Light to Dark Blue */}
//             <div className="w-1/3 h-full">
//               <div className="flex h-full">
//                 {[0, 1, 2, 3].map((q) => (
//                   <div
//                     key={q}
//                     className={`w-1/4 h-full border-r border-white ${
//                       currentPhase === 2 && correctAnswers.includes(q)
//                         ? "bg-blue-600"
//                         : currentPhase > 2
//                         ? "bg-blue-600"
//                         : "bg-blue-300"
//                     }`}
//                   />
//                 ))}
//               </div>
//             </div>
//             {/* Phase 3 - Light to Dark Purple */}
//             <div className="w-1/3 h-full">
//               <div className="flex h-full">
//                 {[0, 1, 2, 3].map((q) => (
//                   <div
//                     key={q}
//                     className={`w-1/4 h-full border-r border-white ${
//                       currentPhase === 3 && correctAnswers.includes(q)
//                         ? "bg-purple-600"
//                         : "bg-purple-300"
//                     }`}
//                   />
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div
//         className={`transition-all duration-500 ease-in-out ${
//           isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
//         }`}
//       >
//         <div className="-mb-3">
//           <p className="text-gray-900 font-semibold text-base p-1 px-2 mb-4">
//             {currentQuestion.question}
//           </p>
//         </div>

//         <div className="space-y-2">
//           {currentQuestion.options.map((option, index) => {
//             const letter = String.fromCharCode(65 + index); // A, B, C, D
//             const isCorrectAnswer = index === currentQuestion.correctAnswer;
//             const showExplanation =
//               isSubmitted && isCorrect && selectedOption === index;

//             return (
//               <div key={index} className="relative">
//                 <button
//                   onClick={() => handleOptionSelect(index)}
//                   className={`w-full p-3 text-left text-sm rounded-2xl transition-all duration-200 flex items-start gap-3 ${
//                     selectedOption === index
//                       ? isSubmitted && !isCorrect
//                         ? "bg-red-50 border-2 border-red-500"
//                         : isSubmitted && isCorrect
//                         ? "bg-emerald-50 border-2 border-emerald-500"
//                         : "bg-indigo-100 border-2 border-indigo-500"
//                       : "bg-white border-2 border-gray-200 hover:border-indigo-300"
//                   }`}
//                   disabled={isSubmitted}
//                 >
//                   <div
//                     className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5 ${
//                       selectedOption === index
//                         ? isSubmitted && !isCorrect
//                           ? "bg-red-500 text-white"
//                           : isSubmitted && isCorrect
//                           ? "bg-emerald-500 text-white"
//                           : "bg-indigo-500 text-white"
//                         : "bg-gray-200 text-gray-700"
//                     }`}
//                   >
//                     {letter}
//                   </div>
//                   <div className="flex-1">
//                     <span className="block">{option}</span>
//                     {showExplanation && selectedOption === index && (
//                       <div
//                         className={`transition-all duration-1000 ease-out ${
//                           showExplanation
//                             ? "opacity-100 max-h-32 translate-y-0"
//                             : "opacity-0 max-h-0 translate-y-2"
//                         }`}
//                       >
//                         <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
//                           Correct! This is the right choice because it helps
//                           protect against scams by verifying the identity of the
//                           person requesting help and involving trusted family
//                           members in the decision-making process.
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </button>
//               </div>
//             );
//           })}
//         </div>

//         <div className="mt-4 flex flex-col items-center gap-3">
//           <button
//             onClick={
//               isSubmitted && !isCorrect ? handleFeedbackClose : handleSubmit
//             }
//             disabled={selectedOption === null || (isSubmitted && isCorrect)}
//             className={`px-3 py-2 rounded-2xl text-white text-sm font-medium transition-all duration-200 ${
//               selectedOption === null || (isSubmitted && isCorrect)
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
//             }`}
//           >
//             {isSubmitted ? (isCorrect ? "Submitted" : "Try Again") : "Submit"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
