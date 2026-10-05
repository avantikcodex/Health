"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FontSizeLevel = "normal" | "large" | "xlarge";

interface AccessibilityContextType {
  simpleView: boolean;
  setSimpleView: (val: boolean | ((prev: boolean) => boolean)) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean | ((prev: boolean) => boolean)) => void;
  fontSize: FontSizeLevel;
  setFontSize: (size: FontSizeLevel) => void;
  speakText: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  simpleView: false,
  setSimpleView: () => {},
  highContrast: false,
  setHighContrast: () => {},
  fontSize: "normal",
  setFontSize: () => {},
  speakText: () => {},
});

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simpleView, setSimpleView] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>("normal");

  useEffect(() => {
    const savedSimple = localStorage.getItem("careflow_simple_view");
    if (savedSimple) setSimpleView(savedSimple === "true");

    const savedContrast = localStorage.getItem("careflow_high_contrast");
    if (savedContrast) setHighContrast(savedContrast === "true");

    const savedSize = localStorage.getItem("careflow_font_size") as FontSizeLevel;
    if (savedSize && ["normal", "large", "xlarge"].includes(savedSize)) {
      setFontSizeState(savedSize);
    }
  }, []);

  const setFontSize = (size: FontSizeLevel) => {
    setFontSizeState(size);
    localStorage.setItem("careflow_font_size", size);
  };

  const updateSimpleView = (val: boolean | ((prev: boolean) => boolean)) => {
    setSimpleView((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("careflow_simple_view", String(next));
      return next;
    });
  };

  const updateHighContrast = (val: boolean | ((prev: boolean) => boolean)) => {
    setHighContrast((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("careflow_high_contrast", String(next));
      return next;
    });
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        simpleView,
        setSimpleView: updateSimpleView,
        highContrast,
        setHighContrast: updateHighContrast,
        fontSize,
        setFontSize,
        speakText,
      }}
    >
      <div
        className={`${highContrast ? "contrast-125 saturate-150" : ""} ${
          fontSize === "large" ? "text-lg" : fontSize === "xlarge" ? "text-xl" : "text-base"
        }`}
      >
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
