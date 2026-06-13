import React, { useState, useEffect, useMemo } from "react";
import { Reorder } from "motion/react";
import { ScheduleItem, ChildState, Badge, InteractiveQuote } from "../types";
import { Sparkles, CheckCircle, Award, Volume2, Clock, MapPin, X, GripVertical } from "lucide-react";
import { playCoinSound, speakIndonesian } from "./SoundEffects";

// Emoji ilustrasi per badge
const BADGE_EMOJI: Record<string, string> = {
  alarm_off: '⏰',
  sholat_rajin: '🕌',
  misi_bunda: '💝',
  bobo_tepat: '🌙',
  PR_tuntas: '📚'
};

interface ChildPOVProps {
  childState: ChildState;
  schedules: ScheduleItem[];
  onCompleteSchedule: (id: string) => void;
  onTriggerStreak: () => void;
  currentTime: string;
  onSetActionState: (action: 'idle' | 'writing' | 'sleeping' | 'eating' | 'praying' | 'late') => void;
  triggerConfetti: () => void;
  onSetSpeaking: (s: boolean) => void;
  onSetCustomSpeech?: (text: string | null) => void;
  onAddChildSchedule?: (e: React.FormEvent, title: string, startTime: string, endTime: string, description: string) => void;
}

// Definition of badges
const AVAILABLE_BADGES: Badge[] = [
  { id: "alarm_off", title: "Bangun Pagi Super", description: "Mematikan alarm sebelum waktu habis", icon: "AlarmClock" },
  { id: "sholat_rajin", title: "Ahli Ibadah", description: "Melaksanakan sholat 5 waktu berturut-turut", icon: "Heart" },
  { id: "misi_bunda", title: "Kesayangan Bunda", description: "Menyelesaikan 3 misi spesial dari ibu", icon: "Sparkles" },
  { id: "bobo_tepat", title: "Tidur Sehat", description: "Tidur tepat waktu selama 7 hari berturut-turut", icon: "Moon" },
  { id: "PR_tuntas", title: "Pelajar Teladan", description: "Tidak pernah lupa mengerjakan PR minggu ini", icon: "BookOpen" }
];

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function ChildPOV({
  childState,
  schedules,
  onCompleteSchedule,
  onTriggerStreak,
  currentTime,
  onSetActionState,
  triggerConfetti,
  onSetSpeaking,
  onSetCustomSpeech,
  onAddChildSchedule
}: ChildPOVProps) {
  // Quote states
  const [quote, setQuote] = useState<InteractiveQuote>({
    text: "Menghargai waktu hari ini adalah jembatan menuju mimpi besarmu esok hari!",
    author: "Timi si Asisten Mandiri"
  });
  const [quotePlaying, setQuotePlaying] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  // Form states for Add Schedule
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStartTime, setNewStartTime] = useState("15:00");
  const [newEndTime, setNewEndTime] = useState("16:00");

  // Load quote from Gemini proxy — with abort timeout to prevent error storm
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/gemini/quote", { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.text) setQuote(data); })
      .catch(() => { /* silent fail — pakai quote default */ })
      .finally(() => clearTimeout(timeout));
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const handleSpeakQuote = () => {
    setQuotePlaying(true);
    onSetSpeaking(true);
    speakIndonesian(quote.text, childState.gender || 'cewe');
    setTimeout(() => {
      setQuotePlaying(false);
      onSetSpeaking(false);
    }, 5000);
  };

  // Find the active schedule based on real time
  const activeSchedules = useMemo(() => {
    const currentMin = timeToMinutes(currentTime);
    return schedules.filter(item => {
      const startMin = timeToMinutes(item.startTime);
      const endMin = timeToMinutes(item.endTime);
      
      if (endMin < startMin) {
        // Crosses midnight
        return currentMin >= startMin || currentMin <= endMin;
      } else {
        return currentMin >= startMin && currentMin <= endMin;
      }
    });
  }, [currentTime, schedules]);

  const primaryActiveTask = activeSchedules.length > 0 ? activeSchedules[0] : null;

  // Check for missed tasks
  const missedTasks = useMemo(() => {
    const currentMin = timeToMinutes(currentTime);
    return schedules.filter(item => {
      if (item.completed) return false;
      const endMin = timeToMinutes(item.endTime);
      const startMin = timeToMinutes(item.startTime);
      if (endMin < startMin) {
        if (currentMin > endMin && currentMin < 720) return true;
        return false;
      }
      return currentMin > endMin;
    });
  }, [currentTime, schedules]);

  const hasMissedTasks = missedTasks.length > 0;

  // Sync avatar state to primary active task
  useEffect(() => {
    if (primaryActiveTask) {
      switch (primaryActiveTask.category) {
        case "tidur":
          onSetActionState("sleeping");
          break;
        case "ibadah":
          onSetActionState("praying");
          break;
        case "sekolah":
        case "belajar":
          onSetActionState("writing");
          break;
        default:
          onSetActionState("idle");
          break;
      }
    } else if (hasMissedTasks) {
      onSetActionState("late");
    } else {
      onSetActionState("idle");
    }
  }, [primaryActiveTask, hasMissedTasks, onSetActionState]);

  const handleCompleteCurrentTask = async () => {
    if (primaryActiveTask) {
      playCoinSound();
      triggerConfetti();
      await onCompleteSchedule(primaryActiveTask.id);
      
      // Virtual Companion Edukasi (Multimedia replaces text popup)
      let dialogText = "Kamu luar biasa! Kedisiplinan adalah awal dari keberhasilan. ⭐";
      if (primaryActiveTask.category === "tidur") dialogText = "Hebat! Tidur yang cukup membuat sel tubuh regenerasi, besok bangun ceria! 🌅";
      else if (primaryActiveTask.category === "ibadah") dialogText = "Keren! Hati jadi tenang kan? Menjalankan kewajiban memberimu jiwa yang kuat. 🕌";
      else if (primaryActiveTask.category === "sekolah" || primaryActiveTask.category === "belajar") dialogText = "Mantap! Ilmu adalah kunci masa depan. Belajar hari ini, sukses esok hari! 📚";

      if (onSetCustomSpeech) onSetCustomSpeech(dialogText);
      onSetSpeaking(true);
      speakIndonesian(dialogText, childState.gender || 'cewe');
      
      setTimeout(() => {
        if (onSetCustomSpeech) onSetCustomSpeech(null);
        onSetSpeaking(false);
      }, 6000);
    }
  };

  // Jadwal yang ditambahkan anak sendiri (bisa di-drag)
  const myOwnSchedules = useMemo(
    () => schedules.filter(s => !s.locked && !s.parentQuest),
    [schedules]
  );
  const [orderedMySchedules, setOrderedMySchedules] = useState(myOwnSchedules);
  useEffect(() => {
    if (myOwnSchedules.length !== orderedMySchedules.length) {
      setOrderedMySchedules(myOwnSchedules);
    }
  }, [myOwnSchedules, orderedMySchedules.length]);

  // ─── Recap Harian: hitung distribusi waktu ──────────────────────────────
  const recapStats = useMemo(() => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const dur = (s: string, e: string) => {
      let diff = toMin(e) - toMin(s);
      if (diff < 0) diff += 24 * 60;
      return diff;
    };
    const stats: Record<string, { total: number; done: number; color: string; label: string; emoji: string }> = {
      sekolah:          { total: 0, done: 0, color: '#38BDF8', label: 'Sekolah',  emoji: '🏫' },
      belajar:          { total: 0, done: 0, color: '#818CF8', label: 'Belajar',  emoji: '📚' },
      ibadah:           { total: 0, done: 0, color: '#34D399', label: 'Ibadah',   emoji: '🕌' },
      bermain:          { total: 0, done: 0, color: '#FB923C', label: 'Bermain',  emoji: '🎮' },
      tidur:            { total: 0, done: 0, color: '#C084FC', label: 'Tidur',    emoji: '🌙' },
      bangun:           { total: 0, done: 0, color: '#FCD34D', label: 'Bangun',   emoji: '☀️' },
      parent_increment: { total: 0, done: 0, color: '#F472B6', label: 'Misi',     emoji: '💝' },
    };
    schedules.forEach(s => {
      if (stats[s.category]) {
        const d = dur(s.startTime, s.endTime);
        stats[s.category].total += d;
        if (s.completed) stats[s.category].done += d;
      }
    });
    const totalMinutes = Object.values(stats).reduce((a, b) => a + b.total, 0);
    return { stats, totalMinutes };
  }, [schedules]);



  return (
    <div className="flex flex-col gap-6 p-2">
      
      {/* 1. TOP SECTION: KODE UNIK AND BADGE ACCESS */}
      <div className="bg-white p-4 rounded-3xl border-4 border-blue-200 shadow-[8px_8px_0px_0px_rgba(59,130,246,0.08)] text-[#1E293B] relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        {childState.unique_code && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Kode Profilmu:</span>
            <span className="text-sm font-black bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full border border-indigo-200 shadow-sm tracking-widest">{childState.unique_code}</span>
          </div>
        )}
        <button 
          onClick={() => setIsBadgeModalOpen(true)}
          className="w-full sm:w-auto bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 text-blue-700 font-black px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:translate-y-[2px] cursor-pointer shadow-sm flex-shrink-0 uppercase tracking-wider text-xs"
        >
          <Award className="w-4 h-4 text-blue-500 animate-pulse" />
          Koleksi Lencana
        </button>
      </div>

      {/* 2. SECTION: TUGAS SAAT INI (REAL-TIME TRACKER) */}
      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-[8px_8px_0px_0px_rgba(217,119,6,0.08)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-[#1E293B]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-sm font-black tracking-wide uppercase text-blue-950">
              Tugas & Aktivitas Saat Ini
            </h3>
          </div>
          <span className="text-[10px] font-black bg-amber-50 text-amber-700 border-2 border-amber-200 px-3 py-1 rounded-full uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Real-Time Live
          </span>
        </div>

        {/* Current Task Display */}
        <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 flex flex-col md:flex-row gap-5 items-center justify-between relative overflow-hidden text-[#1E293B]">
          
          {primaryActiveTask ? (
            <>
              <div className="flex items-start gap-4 flex-grow w-full md:w-3/4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold shadow-inner">
                  {primaryActiveTask.category === 'ibadah' && "🕌"}
                  {primaryActiveTask.category === 'tidur' && "💤"}
                  {primaryActiveTask.category === 'sekolah' && "🏫"}
                  {primaryActiveTask.category === 'belajar' && "📖"}
                  {primaryActiveTask.category === 'bermain' && "🎮"}
                  {primaryActiveTask.category === 'bangun' && "🌅"}
                  {primaryActiveTask.category === 'parent_increment' && "⭐"}
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Sedang Berlangsung: {primaryActiveTask.startTime} - {primaryActiveTask.endTime}
                  </span>
                  <h4 className="text-base font-black text-blue-950 leading-snug">
                    {primaryActiveTask.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold mt-1 max-w-sm">
                    {primaryActiveTask.description}
                  </p>
                </div>
              </div>

              {/* Action trigger */}
              <div className="w-full md:w-auto flex flex-col justify-center items-end flex-shrink-0 mt-4 md:mt-0 border-t border-slate-200 md:border-t-0 pt-4 md:pt-0">
                {primaryActiveTask.completed ? (
                  <span className="flex items-center gap-1.5 bg-green-100 border-2 border-green-300 text-green-700 font-black px-4 py-2 rounded-xl text-xs">
                    <CheckCircle className="w-4 h-4" />
                    SELESAI! (+{primaryActiveTask.reward} XP)
                  </span>
                ) : (
                  <button
                    onClick={handleCompleteCurrentTask}
                    className="bg-amber-400 border-b-4 border-amber-600 hover:bg-amber-500 text-slate-900 font-black px-6 py-2.5 rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 active:translate-y-[2px] active:border-b-2 cursor-pointer w-full justify-center md:w-auto"
                  >
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    Tandai Selesai & Klaim XP!
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-4 text-slate-400">
              <span className="text-3xl mb-2">🎈</span>
              <p className="font-black text-sm text-slate-500 uppercase tracking-wide">Waktu Luang / Istirahat</p>
              <p className="text-xs font-bold mt-1">Tidak ada jadwal wajib saat ini, bebas bereksplorasi!</p>
            </div>
          )}
        </div>
      </div>


      {/* 3. BOTTOM SECTION: QUOTE */}
      <div className="w-full">
        {/* DYNAMIC GEMINI QUOTE WITH VOICE READING */}
        <div className="bg-white p-5 rounded-[32px] border-4 border-teal-200 shadow-[8px_8px_0px_0px_rgba(20,184,166,0.08)] flex flex-col justify-between relative text-[#1E293B]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs font-black text-teal-800 uppercase">Kata Mutiara Hari Ini</span>
            <span className="text-[9px] font-black bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full uppercase">Gemini AI</span>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center py-4">
            <p className="text-sm text-slate-600 italic leading-relaxed text-center font-serif font-bold">
              "{quote.text}"
            </p>
            <span className="text-[10px] font-bold text-slate-500 block mt-2">— {quote.author}</span>
          </div>
          <button
            onClick={handleSpeakQuote}
            disabled={quotePlaying}
            className="mt-2 bg-teal-50 hover:bg-teal-100 border-2 border-teal-200 text-teal-700 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 uppercase tracking-wide transition-colors cursor-pointer disabled:opacity-50"
          >
            <Volume2 className={`w-4 h-4 ${quotePlaying ? "animate-bounce text-yellow-500" : ""}`} />
            {quotePlaying ? "Timi Sedang Berbicara..." : "Dengarkan Suara Quotes 🔊"}
          </button>
        </div>
      </div>

      {/* 4. RECAP HARIKU — Distribusi Waktu Hari Ini */}
      <div className="bg-white p-5 rounded-[32px] border-4 border-violet-200 shadow-[8px_8px_0px_0px_rgba(139,92,246,0.08)] text-[#1E293B]">
        <h3 className="text-sm font-black uppercase tracking-wide text-violet-800 mb-1 flex items-center gap-1.5">
          <span>⏱️</span> Recap Hariku — Waktu Hari Ini
        </h3>
        <p className="text-[10px] text-slate-500 font-bold mb-4">
          Total {Math.round(recapStats.totalMinutes / 60)} jam terjadwal hari ini. Sudah dipakai untuk apa aja?
        </p>
        <div className="flex flex-col gap-2.5">
          {Object.entries(recapStats.stats)
            .filter(([, v]) => v.total > 0)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([key, stat]) => {
              const pctTotal = recapStats.totalMinutes > 0 ? (stat.total / recapStats.totalMinutes) * 100 : 0;
              const pctDone  = stat.total > 0 ? (stat.done / stat.total) * 100 : 0;
              const hours    = Math.floor(stat.total / 60);
              const mins     = stat.total % 60;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="flex items-center gap-1 text-slate-700">
                      <span>{stat.emoji}</span> {stat.label}
                    </span>
                    <span className="text-slate-500">
                      {hours > 0 ? `${hours}j ` : ''}{mins > 0 ? `${mins}m` : ''} 
                      <span className="text-slate-400 ml-1">({Math.round(pctTotal)}%)</span>
                    </span>
                  </div>
                  {/* Bar total (abu) + bar selesai (warna) */}
                  <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pctDone}%`,
                        backgroundColor: stat.color,
                        opacity: 0.9
                      }}
                    />
                    {pctDone < 100 && (
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${pctTotal}%`,
                          backgroundColor: stat.color,
                          opacity: 0.2
                        }}
                      />
                    )}
                    {pctDone > 5 && (
                      <span className="absolute left-2 top-0 h-full flex items-center text-[9px] font-black text-white drop-shadow">
                        {Math.round(pctDone)}% selesai
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        {recapStats.totalMinutes === 0 && (
          <p className="text-center text-slate-400 text-xs font-bold py-4">Jadwal belum dimuat...</p>
        )}
      </div>

      {/* 5. JADWAL MANDIRIKU (drag-and-drop) */}
      {orderedMySchedules.length > 0 && (
        <div className="bg-white p-5 rounded-[32px] border-4 border-purple-200 shadow-[8px_8px_0px_0px_rgba(168,85,247,0.08)] text-[#1E293B]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-purple-800 flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-purple-500" />
              Jadwal Mandiriku
            </h3>
            <span className="text-[10px] font-black bg-purple-50 text-purple-700 border-2 border-purple-200 px-3 py-1 rounded-full uppercase">
              Seret untuk Atur Urutan
            </span>
          </div>
          <Reorder.Group axis="y" values={orderedMySchedules} onReorder={setOrderedMySchedules} className="flex flex-col gap-2">
            {orderedMySchedules.map(task => (
              <Reorder.Item
                key={task.id}
                value={task}
                className="bg-purple-50 border-2 border-purple-200 p-3 rounded-2xl flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing shadow-sm"
              >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <GripVertical className="w-4 h-4 text-purple-300 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-xs text-slate-800 truncate">{task.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{task.startTime} - {task.endTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                    +{task.reward} XP
                  </span>
                  {task.completed && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* MODAL: LENCANA PRESTASI */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] border-4 border-blue-200 p-6 shadow-2xl relative text-[#1E293B] max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsBadgeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#1E293B] font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors border-2 border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-3 shadow-inner border-2 border-blue-200">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-widest text-blue-950">
                Koleksi Lencana
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">Selesaikan misimu dan raih seluruh lencana!</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {AVAILABLE_BADGES.map((b) => {
                const isUnlocked = childState.badges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center justify-between h-full ${
                      isUnlocked
                        ? "bg-gradient-to-b from-blue-50 to-white border-blue-300 shadow-md"
                        : "bg-slate-50/40 border-slate-100 opacity-40 filter grayscale"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 text-3xl shadow-inner border-2 ${
                      isUnlocked ? 'bg-white border-blue-200' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {BADGE_EMOJI[b.id] || '🏅'}
                    </div>
                    <span className="text-sm font-black text-slate-800 leading-tight">{b.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold leading-normal mt-2 flex-grow">{b.description}</span>
                    {isUnlocked ? (
                      <span className="text-[10px] text-green-700 font-black uppercase tracking-wider mt-3 bg-green-100 px-3 py-1 rounded-full border border-green-300 w-full">
                        Terbuka ✔️
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-3 w-full border border-slate-200 rounded-full px-3 py-1">
                        Terkunci 🔒
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setIsBadgeModalOpen(false)}
              className="mt-8 w-full bg-blue-600 border-b-4 border-blue-800 hover:bg-blue-700 text-white font-black py-3 rounded-xl uppercase tracking-wider active:translate-y-[2px] active:border-b-2 transition-all shadow-sm"
            >
              Tutup Koleksi
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
