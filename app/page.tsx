"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get Prolific parameters from URL
    const PROLIFIC_PID = searchParams.get("PROLIFIC_PID");
    const STUDY_ID = searchParams.get("STUDY_ID");
    const SESSION_ID = searchParams.get("SESSION_ID");

    if (PROLIFIC_PID && STUDY_ID && SESSION_ID) {
      // If all parameters are present, redirect to sign-in with the parameters
      router.replace(
        `/sign-in?PROLIFIC_PID=${PROLIFIC_PID}&STUDY_ID=${STUDY_ID}&SESSION_ID=${SESSION_ID}`
      );
    } else {
      // If parameters are missing, redirect to sign-in without parameters
      router.replace("/sign-in");
    }
  }, [searchParams, router]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
