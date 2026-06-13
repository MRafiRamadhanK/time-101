import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speakIndonesian } from './SoundEffects';

export interface AdultingMsgData {
  id: string;
  title: string;
  emoji: string;
  color: 'amber' | 'purple' | 'blue' | 'green' | 'rose' | 'indigo' | 'orange' | 'teal' | 'sky';
  cause: string;
  effect: string;
  audioText: string;
  expReward: number;
}

interface Props {
  message: AdultingMsgData;
  gender: string;
  onClaim: (expReward: number) => void;
}

const COLORS = {
  amber:  { border: 'border-amber-300',   btn: 'bg-amber-400 border-amber-600 hover:bg-amber-500 text-slate-900',   causeBox: 'bg-amber-50 border-amber-200',   effectBox: 'bg-orange-50 border-orange-200 text-orange-900',  badge: 'bg-amber-100 text-amber-800 border-amber-300',   emojiRing: 'bg-amber-100 border-amber-300',   overlay: 'bg-amber-900/60' },
  purple: { border: 'border-purple-300',  btn: 'bg-purple-500 border-purple-700 hover:bg-purple-600 text-white',    causeBox: 'bg-purple-50 border-purple-200', effectBox: 'bg-violet-50 border-violet-200 text-violet-900',  badge: 'bg-purple-100 text-purple-800 border-purple-300', emojiRing: 'bg-purple-100 border-purple-300', overlay: 'bg-purple-900/60' },
  blue:   { border: 'border-blue-300',    btn: 'bg-blue-600 border-blue-800 hover:bg-blue-700 text-white',          causeBox: 'bg-blue-50 border-blue-200',     effectBox: 'bg-indigo-50 border-indigo-200 text-indigo-900', badge: 'bg-blue-100 text-blue-800 border-blue-300',      emojiRing: 'bg-blue-100 border-blue-300',   overlay: 'bg-blue-900/60' },
  green:  { border: 'border-emerald-300', btn: 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600 text-white', causeBox: 'bg-emerald-50 border-emerald-200', effectBox: 'bg-teal-50 border-teal-200 text-teal-900',      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', emojiRing: 'bg-emerald-100 border-emerald-300', overlay: 'bg-emerald-900/60' },
  rose:   { border: 'border-rose-300',    btn: 'bg-rose-500 border-rose-700 hover:bg-rose-600 text-white',          causeBox: 'bg-rose-50 border-rose-200',     effectBox: 'bg-pink-50 border-pink-200 text-pink-900',       badge: 'bg-rose-100 text-rose-800 border-rose-300',       emojiRing: 'bg-rose-100 border-rose-300',   overlay: 'bg-rose-900/60' },
  indigo: { border: 'border-indigo-300',  btn: 'bg-indigo-600 border-indigo-800 hover:bg-indigo-700 text-white',    causeBox: 'bg-indigo-50 border-indigo-200', effectBox: 'bg-slate-50 border-slate-200 text-slate-900',    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', emojiRing: 'bg-indigo-100 border-indigo-300', overlay: 'bg-indigo-900/60' },
  orange: { border: 'border-orange-300',  btn: 'bg-orange-500 border-orange-700 hover:bg-orange-600 text-white',    causeBox: 'bg-orange-50 border-orange-200', effectBox: 'bg-amber-50 border-amber-200 text-amber-900',    badge: 'bg-orange-100 text-orange-800 border-orange-300', emojiRing: 'bg-orange-100 border-orange-300', overlay: 'bg-orange-900/60' },
  teal:   { border: 'border-teal-300',    btn: 'bg-teal-500 border-teal-700 hover:bg-teal-600 text-white',          causeBox: 'bg-teal-50 border-teal-200',     effectBox: 'bg-cyan-50 border-cyan-200 text-cyan-900',       badge: 'bg-teal-100 text-teal-800 border-teal-300',       emojiRing: 'bg-teal-100 border-teal-300',   overlay: 'bg-teal-900/60' },
  sky:    { border: 'border-sky-300',     btn: 'bg-sky-500 border-sky-700 hover:bg-sky-600 text-white',             causeBox: 'bg-sky-50 border-sky-200',       effectBox: 'bg-blue-50 border-blue-200 text-blue-900',       badge: 'bg-sky-100 text-sky-800 border-sky-300',          emojiRing: 'bg-sky-100 border-sky-300',     overlay: 'bg-sky-900/60' },
};

export default function AdultingMessage({ message, gender, onClaim }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const c = COLORS[message.color];

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSpeak = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    speakIndonesian(message.audioText, gender);
    setTimeout(() => setIsPlaying(false), 7000);
  };

  return (
    <div className={`fixed inset-0 z-[75] flex items-end sm:items-center justify-center ${c.overlay} backdrop-blur-md p-0 sm:p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white w-full sm:max-w-sm rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border-t-4 sm:border-4 ${c.border} transform transition-transform duration-400 ${visible ? 'translate-y-0' : 'translate-y-8'}`}>

        {/* Header — emoji besar animasi */}
        <div className="flex flex-col items-center pt-7 pb-4 px-5">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner border-4 ${c.emojiRing} animate-bounce mb-3`}>
            {message.emoji}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${c.badge} mb-1`}>
            💡 Pesan Adulting
          </span>
          <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight text-center mt-1">
            {message.title}
          </h2>
        </div>

        {/* Cause → Effect */}
        <div className="px-5 flex flex-col gap-2">
          {/* SEBAB */}
          <div className={`rounded-2xl border-2 p-3 ${c.causeBox}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">⬅ Karena kamu...</p>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{message.cause}</p>
          </div>

          {/* Panah */}
          <div className="flex items-center justify-center text-slate-400 text-xl font-black">↓</div>

          {/* AKIBAT */}
          <div className={`rounded-2xl border-2 p-3 ${c.effectBox}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">➡ Kelak kamu akan...</p>
            <p className="text-sm font-bold leading-relaxed">{message.effect}</p>
          </div>

          {/* EXP Badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 border-2 border-amber-200 px-4 py-1.5 rounded-full self-center mt-1">
            ✨ Klaim +{message.expReward} EXP!
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-3 flex flex-col gap-2">
          {/* Audio */}
          <button
            onClick={handleSpeak}
            disabled={isPlaying}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 border-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-black py-2.5 rounded-2xl text-xs uppercase tracking-wide transition-all disabled:opacity-50"
          >
            <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-amber-500' : ''}`} />
            {isPlaying ? 'Timi Sedang Membacakan...' : '🔊 Dengarkan Pesannya'}
          </button>

          {/* Claim */}
          <button
            onClick={() => onClaim(message.expReward)}
            className={`w-full font-black py-3.5 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm shadow-sm ${c.btn}`}
          >
            Aku Paham! (+{message.expReward} EXP) 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
