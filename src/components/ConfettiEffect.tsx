/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ConfettiPiece {
  id: number;
  x: number; // percentage left
  delay: number; // stagger delay
  color: string;
  size: number;
  shape: "circle" | "square" | "triangle";
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const COLORS = [
  "#FFC107", // Warm Amber
  "#FF4081", // Warm Pink
  "#00E676", // Friendly Green
  "#00B0FF", // Bright Blue
  "#D500F9", // Playful Purple
  "#FF3D00"  // Deep Orange
];

export default function ConfettiEffect({ active, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const results: ConfettiPiece[] = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // 0 to 100% width
        delay: Math.random() * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 10 + 6, // 6 to 16px
        shape: ["circle", "square", "triangle"][Math.floor(Math.random() * 3)] as any
      }));
      setPieces(results);

      const timer = setTimeout(() => {
        setPieces([]);
        if (onComplete) onComplete();
      }, 4000); // Stop confetti display after 4 seconds

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              y: -50,
              x: `${p.x}vw`,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              y: "110vh",
              x: `${p.x + (Math.random() * 15 - 7.5)}vw`, // Drift sideways
              rotate: 360 + Math.random() * 720,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: 2.2 + Math.random() * 1.5,
              delay: p.delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== "triangle" ? p.color : undefined,
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "4px" : undefined,
              borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
