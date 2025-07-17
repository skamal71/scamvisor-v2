"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/modal";

export default function VideoInstructionsPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [scenario, setScenario] = useState<number | null>(null);
  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshWarningEnabled, setRefreshWarningEnabled] = useState(true);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store references to event handlers
  const beforeUnloadHandler = useRef<
    ((e: BeforeUnloadEvent) => string | undefined) | null
  >(null);
  const keyDownHandler = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Helper function to randomly select video and corresponding chat route
  const assignRandomVideoAndChat = () => {
    //const randomNumber = Math.floor(Math.random() * 4) + 1; // Random number 1, 2, 3, or 4
    let randomNumber = 2;

    let videoFile, targetPage;
    if (randomNumber === 1) {
      videoFile = "/imposterChatAl.mp4";
      targetPage = "/chatal";
    } else if (randomNumber === 2) {
      videoFile = "/imposterChatQAL2.mp4";
      targetPage = "/chatqal";
    } else if (randomNumber === 3) {
      videoFile = "/imposterChatQl.mp4";
      targetPage = "/chatql";
    } else {
      videoFile = "/imposterChatSt.mp4";
      targetPage = "/chatst";
    }

    console.log(
      `Random number: ${randomNumber}, Video: ${videoFile}, Chat route: ${targetPage}`
    );

    // Store both the video file and chat model in session storage
    sessionStorage.setItem("assignedVideo", videoFile);
    sessionStorage.setItem("assignedChatModel", targetPage);

    return { videoFile, targetPage };
  };

  // Helper function to assign random scenario (1 for pig butchering, 2 for imposter)
  const assignRandomScenario = () => {
    //const randomScenario = Math.floor(Math.random() * 2) + 1; // Random number 1 or 2

    // This will always be the imposter scam (for pilot study)
    let randomScenario = 1;
    console.log(
      `Assigned scenario: ${randomScenario} (${
        randomScenario === 1 ? "Pig Butchering" : "Imposter"
      })`
    );

    // Store the scenario in session storage
    sessionStorage.setItem("assignedScenario", randomScenario.toString());
    setScenario(randomScenario);

    return randomScenario;
  };

  useEffect(() => {
    setIsVisible(true);

    // Clear the legitimate navigation flag since we've successfully navigated here
    sessionStorage.removeItem("legitimateNavigation");

    // Check if user is authenticated and has completed survey
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

        // Check if user has already completed the video in this session
        const videoWatched = sessionStorage.getItem("videoWatched");
        if (videoWatched === "true") {
          // User has already watched the video, redirect to attention check
          // But first check if they have completed chat to avoid loops
          const chatCompleted = sessionStorage.getItem("chatCompleted");
          if (chatCompleted === "true") {
            // If they've completed chat, they should go to post-survey instead
            window.location.href = "/post-survey";
            return;
          } else {
            // Otherwise, go to attention check
            window.location.href = "/attention-check";
            return;
          }
        } else {
          // User hasn't watched video, but check if they've completed chat
          // This handles the case when user comes back from post-survey
          const chatCompleted = sessionStorage.getItem("chatCompleted");
          if (chatCompleted === "true") {
            // If they've completed chat, redirect to post-survey
            window.location.href = "/post-survey";
            return;
          }
          // Otherwise, continue with video instructions (normal flow)
        }

        // Assign random video and chat model if not already assigned
        const existingVideo = sessionStorage.getItem("assignedVideo");
        const existingChatModel = sessionStorage.getItem("assignedChatModel");
        if (existingVideo && existingChatModel) {
          console.log(
            "Using existing video:",
            existingVideo,
            "and chat model:",
            existingChatModel
          );
        } else {
          console.log("Assigning new video and chat model");
          assignRandomVideoAndChat();
        }

        // Assign random scenario if not already assigned
        const existingScenario = sessionStorage.getItem("assignedScenario");
        if (existingScenario) {
          console.log("Using existing scenario:", existingScenario);
          setScenario(parseInt(existingScenario));
        } else {
          console.log("Assigning new scenario");
          const newScenario = assignRandomScenario();
          setScenario(newScenario);
        }
      })
      .catch((error) => {
        console.error("Error fetching user info:", error);
        window.location.href = "/sign-in";
      });
  }, []);

  // Handle refresh warning
  useEffect(() => {
    if (!refreshWarningEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "Please do not refresh, your progress might be lost and you might not get the compensation for completion";
      e.preventDefault();
      return message;
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

    // Store references to handlers
    beforeUnloadHandler.current = handleBeforeUnload;
    keyDownHandler.current = handleKeyDown;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [refreshWarningEnabled]);

  // Update video source when scenario changes
  useEffect(() => {
    if (scenario !== null) {
      console.log("Scenario changed to:", scenario);
      const videoSource = getVideoSource();
      console.log("Updating video source to:", videoSource);

      // Test if the video file exists
      testVideoFile(videoSource);

      // Reload the video if the ref exists
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  }, [scenario]);

  // Scroll detection for video instructions
  useEffect(() => {
    const checkIfAtBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setShowScrollIndicator(!isBottom);
    };

    window.addEventListener("scroll", checkIfAtBottom);
    // Initial check
    checkIfAtBottom();

    return () => {
      window.removeEventListener("scroll", checkIfAtBottom);
    };
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // Video is now in fullscreen, ensure we're tracking progress
        console.log("Video entered fullscreen mode");
        setIsFullscreen(true);
        setShowFullscreenControls(false); // Start with controls hidden
      } else {
        // Video exited fullscreen, ensure progress is maintained
        console.log("Video exited fullscreen mode");
        setIsFullscreen(false);
        setShowFullscreenControls(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle mouse movement in fullscreen mode with proximity detection
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const { clientX, clientY } = mouseEvent;
      setMousePosition({ x: clientX, y: clientY });

      // Check if mouse is near the center (play button) or bottom-right (fullscreen button)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const bottomRightX = window.innerWidth - 100; // 100px from right edge
      const bottomRightY = window.innerHeight - 100; // 100px from bottom edge

      const distanceToCenter = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );
      const distanceToBottomRight = Math.sqrt(
        Math.pow(clientX - bottomRightX, 2) +
          Math.pow(clientY - bottomRightY, 2)
      );

      const proximityThreshold = 150; // 150px radius

      if (
        distanceToCenter < proximityThreshold ||
        distanceToBottomRight < proximityThreshold
      ) {
        console.log("Mouse near controls, showing them");
        setShowFullscreenControls(true);
      } else {
        console.log("Mouse away from controls, hiding them");
        setShowFullscreenControls(false);
      }
    };

    // Listen for mouse events on the fullscreen element
    const fullscreenElement = document.fullscreenElement;

    if (fullscreenElement) {
      fullscreenElement.addEventListener("mousemove", handleMouseMove);
    }

    // Also listen globally
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (fullscreenElement) {
        fullscreenElement.removeEventListener("mousemove", handleMouseMove);
      }
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isFullscreen]);

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Request fullscreen on the container div instead of the video
      const videoContainer = document.querySelector(".video-container");
      if (videoContainer) {
        videoContainer.requestFullscreen();
      }
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleVideoEnded = () => {
    setVideoCompleted(true);
    setVideoProgress(100);
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  // Prevent seeking when video is in fullscreen mode
  const handleSeeking = () => {
    if (videoRef.current && duration > 0) {
      const currentTime = videoRef.current.currentTime;
      const currentProgress = (currentTime / duration) * 100;

      // If user tries to seek forward beyond the tracked progress, reset to the last valid position
      if (currentProgress > videoProgress + 2) {
        // Allow small tolerance of 2%
        console.log(
          `Seeking prevented: ${currentProgress}% > ${videoProgress}%`
        );
        videoRef.current.currentTime = (videoProgress / 100) * duration;
      }
    }
  };

  const handleProceedToAttentionCheck = () => {
    // Completely remove all refresh warning event listeners
    setRefreshWarningEnabled(false);
    window.onbeforeunload = null;

    // Remove event listeners using stored references
    if (beforeUnloadHandler.current) {
      window.removeEventListener("beforeunload", beforeUnloadHandler.current);
    }
    if (keyDownHandler.current) {
      window.removeEventListener("keydown", keyDownHandler.current);
    }

    // Mark video as watched in session storage
    sessionStorage.setItem("videoWatched", "true");

    // Redirect to attention check page
    window.location.href = "/attention-check";
  };

  // Get video source based on assigned video
  const getVideoSource = () => {
    if (typeof window !== "undefined") {
      // Get the assigned video directly from session storage
      const assignedVideo = sessionStorage.getItem("assignedVideo");
      console.log("Assigned video:", assignedVideo);

      if (assignedVideo) {
        return assignedVideo;
      }
    }

    console.log("Using fallback imposterChatAl.mp4");
    return "/imposterChatAl.mp4"; // fallback
  };

  // Test if video file exists
  const testVideoFile = async (videoPath: string) => {
    try {
      const response = await fetch(videoPath, { method: "HEAD" });
      console.log(`Video file ${videoPath} exists:`, response.ok);
      return response.ok;
    } catch (error) {
      console.error(`Error checking video file ${videoPath}:`, error);
      return false;
    }
  };

  // Get video title based on assigned chat model
  const getVideoTitle = () => {
    if (typeof window !== "undefined") {
      const assignedChatModel = sessionStorage.getItem("assignedChatModel");

      if (assignedChatModel === "/chatal") {
        return "Imposter Chat AL Video";
      } else if (assignedChatModel === "/chatqal") {
        return "Imposter Chat QAL Video";
      } else if (assignedChatModel === "/chatql") {
        return "Imposter Chat QL Video";
      } else if (assignedChatModel === "/chatst") {
        return "Imposter Chat ST Video";
      }
    }
    return "Imposter Scam Video";
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const videoElement = e.currentTarget;
    console.error("Video error occurred");
    console.error("Video src:", videoElement.src);
    console.error("Video currentSrc:", videoElement.currentSrc);
    console.error("Video error code:", videoElement.error?.code);
    console.error("Video error message:", videoElement.error?.message);
    console.error("Video networkState:", videoElement.networkState);
    console.error("Video readyState:", videoElement.readyState);
    console.error("Current scenario:", scenario);
    console.error("Video source function result:", getVideoSource());
  };

  const handleVideoLoad = () => {
    console.log("Video loaded successfully");
    console.log("Video src:", getVideoSource());
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log("Video duration:", videoRef.current.duration);
    }
  };

  // Helper function to format time in MM:SS format
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`min-h-screen bg-indigo-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-[110vw] max-w-8xl p-10 bg-white rounded-2xl shadow-lg">
        {/* Instructions */}
        <div className="mb-8 p-6 bg-indigo-50 rounded-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Learn How to Protect Yourself from Online Scams
            </h2>
          </div>

          <ul className="text-gray-700 space-y-2">
            <li>
              • Please watch the following video to learn how to protect against
              online scams.
            </li>
            <li>
              • To play the video, hover over it and click on the blue play ▶️
              button.
            </li>
            <li>
              • You must watch the entire video before you can proceed. After
              watching the video, please click on the "Next" button below.
            </li>
          </ul>
        </div>

        {/* Video Container */}
        <div className="mb-8">
          <div
            className="relative w-full h-auto bg-black rounded-3xl overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {scenario !== null ? (
              <>
                <div
                  className="relative w-full h-auto video-container"
                  style={{
                    display: isFullscreen ? "flex" : "block",
                    alignItems: isFullscreen ? "center" : "initial",
                    justifyContent: isFullscreen ? "center" : "initial",
                    height: isFullscreen ? "100vh" : "auto",
                    backgroundColor: isFullscreen ? "black" : "transparent",
                  }}
                >
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    preload="metadata"
                    controls={false}
                    disablePictureInPicture={true}
                    disableRemotePlayback={true}
                    style={{
                      objectFit: isFullscreen ? "contain" : "initial",
                      backgroundColor: isFullscreen ? "black" : "transparent",
                    }}
                    onTimeUpdate={handleVideoProgress}
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                    onLoadedData={handleVideoLoad}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onSeeking={handleSeeking}
                    onSeeked={handleSeeking}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <source src={getVideoSource()} type="video/mp4" />
                    <source src="/imposterChatAl.mp4" type="video/mp4" />
                    <source src="/imposterChatQAL2.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Fullscreen Controls Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Play/Pause Button - Centered */}
                    <button
                      onClick={handlePlayPause}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-26 h-26 bg-indigo-600 bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 backdrop-blur-sm pointer-events-auto"
                      disabled={!duration}
                      style={{
                        opacity:
                          isHovering || (isFullscreen && showFullscreenControls)
                            ? 1
                            : 0,
                        visibility:
                          isHovering || (isFullscreen && showFullscreenControls)
                            ? "visible"
                            : "hidden",
                        transition: "opacity 0.3s",
                      }}
                    >
                      {isPlaying ? (
                        <svg
                          className="w-18 h-18"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-18 h-18"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Fullscreen/Exit Fullscreen Button - Bottom Right */}
                    <button
                      onClick={handleFullscreen}
                      className="absolute bottom-4 right-4 flex items-center justify-center w-12 h-12 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-300 backdrop-blur-sm pointer-events-auto"
                      disabled={!duration}
                      style={{
                        opacity:
                          isHovering || (isFullscreen && showFullscreenControls)
                            ? 1
                            : 0,
                        visibility:
                          isHovering || (isFullscreen && showFullscreenControls)
                            ? "visible"
                            : "hidden",
                        transition: "opacity 0.3s",
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading video...</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm text-gray-600">
                {formatTime(duration)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Proceed Button */}
        <div className="text-center">
          <div className="relative group">
            <button
              onClick={handleProceedToAttentionCheck}
              disabled={!videoCompleted}
              className={`px-8 py-4 rounded-4xl text-lg font-semibold transition-all duration-200 ${
                videoCompleted
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {videoCompleted ? "Next" : "Next"}
            </button>

            {/* Tooltip for disabled state */}
            {!videoCompleted && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Please watch the entire video to proceed.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-indigo-500 text-white px-4 py-2 rounded-3xl shadow-lg flex items-center gap-2 ">
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
                  window.location.reload();
                }}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
