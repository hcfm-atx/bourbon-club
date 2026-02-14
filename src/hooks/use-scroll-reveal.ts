"use client";
import { useEffect, useRef } from "react";

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.1 }
    );
    const children = element.querySelectorAll(".reveal-on-scroll");
    children.forEach((child) => observer.observe(child));
    return () => { children.forEach((child) => observer.unobserve(child)); };
  }, []);
  return ref;
}
