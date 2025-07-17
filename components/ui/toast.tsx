import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
