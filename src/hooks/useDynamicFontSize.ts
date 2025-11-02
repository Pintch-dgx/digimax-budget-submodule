"use client";

import { useEffect, useState } from "react";

/**
 * Hook per gestire dinamicamente il font size in base alla risoluzione dello schermo.
 * Restituisce una classe CSS che può essere applicata per override specifici.
 */
export function useDynamicFontSize() {
  const [fontScale, setFontScale] = useState<"xs" | "sm" | "md" | "lg" | "xl" | "2xl">("md");

  useEffect(() => {
    function updateFontScale() {
      const width = window.innerWidth;

      if (width < 640) {
        setFontScale("xs");
      } else if (width < 1024) {
        setFontScale("sm");
      } else if (width < 1536) {
        setFontScale("md");
      } else if (width < 1920) {
        setFontScale("lg");
      } else if (width < 2560) {
        setFontScale("xl");
      } else {
        setFontScale("2xl");
      }
    }

    updateFontScale();
    window.addEventListener("resize", updateFontScale);

    return () => window.removeEventListener("resize", updateFontScale);
  }, []);

  return { fontScale, width: typeof window !== "undefined" ? window.innerWidth : 0 };
}

/**
 * Hook per ottenere la risoluzione corrente dello schermo.
 */
export function useScreenResolution() {
  const [resolution, setResolution] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setResolution({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return resolution;
}

