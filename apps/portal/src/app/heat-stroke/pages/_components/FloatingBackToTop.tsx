"use client";

import { useEffect, useState } from "react";

export function FloatingBackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 300);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      aria-label="回到页面顶部"
      className={`fixed bottom-24 right-6 z-50 inline-grid h-12 w-12 place-items-center rounded-full border-2 border-foreground bg-primary font-black text-primary-foreground shadow-[4px_4px_0_rgba(18,49,60,0.22)] transition-all duration-300 dark:shadow-[4px_4px_0_rgba(244,236,220,0.16)] ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 pointer-events-none opacity-0"
      }`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      ↑
    </button>
  );
}
