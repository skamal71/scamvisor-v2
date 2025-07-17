"use client";
import { useState, useEffect } from "react";

export default function SignOutPage() {
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    setIsVisible(true);
    handleSignOut();
  }, []);

  useEffect(() => {
    if (!loading && !error && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!loading && !error && countdown === 0) {
      // Redirect to Prolific completion page
      window.location.href =
        "https://app.prolific.com/submissions/complete?cc=CHG7588Q";
    }
  }, [loading, error, countdown]);

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to sign out");
      }

      // Clear session storage
      sessionStorage.removeItem("surveyCompleted");
      sessionStorage.removeItem("videoWatched");

      setLoading(false);
    } catch (error) {
      console.error("Error signing out:", error);
      setError("An error occurred while signing out. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-indigo-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-lg text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900">Signing out...</h2>
            <p className="text-gray-600">
              Please wait while we complete your session.
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900">Sign Out Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => (window.location.href = "/sign-in")}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-lg text-gray-600">
              You have successfully completed the study and been signed out.
            </p>
            <p className="text-gray-600">
              Your responses have been recorded and your session has ended.
            </p>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                You will now be redirected to the Prolific completion page in{" "}
                <span className="font-bold text-indigo-600">{countdown}</span>{" "}
                {countdown === 1 ? "second" : "seconds"}.
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
