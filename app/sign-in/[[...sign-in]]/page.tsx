"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const hasAttemptedSignIn = useRef(false);

  useEffect(() => {
    // Trigger the fade-in effect after the component mounts
    setIsVisible(true);

    // Get Prolific parameters from URL
    const PROLIFIC_PID = searchParams.get("PROLIFIC_PID");
    const STUDY_ID = searchParams.get("STUDY_ID");
    const SESSION_ID = searchParams.get("SESSION_ID");

    if (!PROLIFIC_PID || !STUDY_ID || !SESSION_ID) {
      setError("You have already participated in this study!");
      return;
    }

    // Only attempt sign in if we haven't tried before
    if (!hasAttemptedSignIn.current) {
      hasAttemptedSignIn.current = true;
      // Automatically sign in with Prolific parameters
      handleSignIn(PROLIFIC_PID, STUDY_ID, SESSION_ID);
    }
  }, [searchParams]);

  const handleSignIn = async (
    PROLIFIC_PID: string,
    STUDY_ID: string,
    SESSION_ID: string
  ) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ PROLIFIC_PID, STUDY_ID, SESSION_ID }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (
          res.status === 400 &&
          data.error === "You have already participated in this study!"
        ) {
          setError(data.error);
          return;
        }
        throw new Error(data.error || "Something went wrong");
      }

      // Reset video watched state for new user
      sessionStorage.removeItem("videoWatched");

      // Redirect to survey page immediately
      window.location.href = "/survey";
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      className={`transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {error && (
        <div className="flex justify-center items-start pt-24 min-h-[600px]">
          <div className="w-full max-w-md p-8 space-y-8 bg-indigo-50 rounded-2xl shadow-lg">
            <div className="text-red-500 text-sm text-center">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
