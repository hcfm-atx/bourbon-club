"use client";

import { useEffect, useState } from "react";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  velocity: { x: number; y: number };
  color: string;
}

const COLORS = ["#fbbf24", "#d97706", "#f59e0b", "#b45309", "#92400e"];

export function triggerConfetti() {
  if (typeof window === "undefined") return;

  const event = new CustomEvent("trigger-confetti");
  window.dispatchEvent(event);
}

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    const handleTrigger = () => {
      const newParticles: ConfettiParticle[] = [];
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: 50, // Center of screen
          y: 50,
          rotation: Math.random() * 360,
          velocity: {
            x: (Math.random() - 0.5) * 10,
            y: Math.random() * -8 - 4,
          },
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }

      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => setParticles([]), 3000);
    };

    window.addEventListener("trigger-confetti", handleTrigger);
    return () => window.removeEventListener("trigger-confetti", handleTrigger);
  }, []);

  return (
    <>
      {children}
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: particle.color,
                animation: `confettiFall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                transform: `rotate(${particle.rotation}deg)`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(${Math.random() * 200 - 100}px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
