import { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
      // Small delay to ensure the animation plays
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setIsAnimating(false);
        document.body.style.overflow = "unset";
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-xl transform transition-all duration-300 ease-out ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        {/* Modal Content with max height and scrolling */}
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
