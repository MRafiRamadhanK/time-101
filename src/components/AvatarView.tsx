import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Smile, Sparkles, AlertCircle } from "lucide-react";

interface AvatarViewProps {
  mood: 'semangat' | 'netral' | 'lelah';
  action: 'idle' | 'writing' | 'sleeping' | 'eating' | 'praying' | 'late';
  level: number;
  gender: string;
  isSpeaking: boolean;
  customSpeech?: string | null;
  onChangeGender?: (gender: string) => void;
  onClickAvatar?: () => void;
}

export default function AvatarView({ mood, action, level, gender, isSpeaking, customSpeech, onChangeGender, onClickAvatar }: AvatarViewProps) {
  const [mouthOpen, setMouthOpen] = useState(false);

  // Lipsync animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 200); // toggle every 200ms
    } else {
      setMouthOpen(false);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const speechBubble = useMemo(() => {
    if (customSpeech) return customSpeech;

    if (action === "late") {
      return "Waduh! Ada jadwal yang terlewat nih. Ayo segera selesaikan! ⏰😰";
    }
    if (action === "sleeping") {
      return "Zzz... Saatnya rehat tidur... 😴";
    }
    if (action === "praying") {
      return "Waktunya ibadah, hatiku damai dan tentram! 🕌";
    }
    if (action === "writing") {
      return "Waktunya fokus belajar demi masa depan! ✍️📖";
    }

    switch (mood) {
      case "semangat":
        return "Aku merasa luar biasa! Kamu hebat dan disiplin hari ini! ⭐🚀";
      case "lelah":
        return "Hoamm... Aku agak lelah. Pastikan kamu tidur tepat waktu ya! 🔋💤";
      case "netral":
      default:
        return "Halo teman! Yuk selesaikan jadwal harian kita sekarang! 😊🎒";
    }
  }, [mood, action, customSpeech]);

  // Determine which PNG to load
  const avatarSrc = useMemo(() => {
    const base = gender === "lanang" ? "lanang" : "cewe";
    const state = mouthOpen ? "bukamulut" : "tutupmulut";
    return `/avatars/${base}${state}.png`;
  }, [gender, mouthOpen]);

  return (
    <div className="fixed bottom-0 left-0 z-50 flex items-end pointer-events-none pl-0 pb-0 w-full max-w-2xl text-[#1E293B]">

      {/* Avatar Image Animation Container */}
      <div 
        className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-end justify-start pointer-events-auto cursor-pointer shrink-0 z-30 -ml-6 sm:-ml-8"
        onClick={onClickAvatar}
      >
        
        {/* Sleeping floating particles (Zzz only) */}
        {action === "sleeping" && (
          <div className="absolute top-8 right-12 flex flex-col font-mono text-indigo-500 font-bold text-sm z-10">
            <motion.span animate={{ y: [-5, -25], x: [0, 8], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0 }} className="absolute">Z</motion.span>
            <motion.span animate={{ y: [-5, -20], x: [0, 5], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }} className="absolute text-xs ml-3">z</motion.span>
            <motion.span animate={{ y: [-5, -15], x: [0, 3], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1.2 }} className="absolute text-[8px] ml-5">z</motion.span>
          </div>
        )}

        {/* Render PNG Image */}
        <motion.img 
          src={avatarSrc} 
          alt="Virtual Avatar" 
          className="w-full h-full object-contain object-left-bottom relative z-0 drop-shadow-md"
          animate={{
            y: action === "sleeping" ? [0, 2, 0] : [0, -3, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: action === "sleeping" ? 2.5 : 2,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Interactive Controls & Thought Bubble to the right */}
      <div className="flex flex-col items-start pb-28 sm:pb-36 -ml-16 sm:-ml-24 pointer-events-none z-40">
        
        {/* Thought Cloud Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, x: -20, y: 10 }}
          animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
          key={speechBubble}
          className="relative max-w-[280px] pointer-events-auto"
        >
          {/* Main Cloud Body */}
          <div className="bg-white text-indigo-900 text-sm py-4 px-6 rounded-[32px] border-4 border-indigo-100 text-center leading-relaxed font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 relative">
            {speechBubble}
          </div>
          
          {/* Thought bubbles connecting to avatar's head (pointing down-left exactly like the sketch) */}
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-white border-4 border-indigo-100 rounded-full z-10 shadow-sm"></div>
          <div className="absolute -bottom-8 -left-6 w-4 h-4 bg-white border-4 border-indigo-100 rounded-full z-10 shadow-sm"></div>
        </motion.div>

      </div>

    </div>
  );
}
