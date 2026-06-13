/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { ScheduleItem, ChildState } from "./types";
import { 
  Users, 
  CheckCircle, 
  Sparkles, 
  RotateCcw, 
  LogOut,
  Award,
  X,
  Sun,
  BookOpen,
  Moon,
  School
} from "lucide-react";
import AnalogClock from "./components/AnalogClock";
import AvatarView from "./components/AvatarView";
import ConfettiEffect from "./components/ConfettiEffect";
import ParentPOV from "./components/ParentPOV";
import ChildPOV from "./components/ChildPOV";
import LoginModal from "./components/LoginModal";
import { playLevelUpSound, playCoinSound, playAlarmSound } from "./components/SoundEffects";
import AdultingMessage, { AdultingMsgData } from "./components/AdultingMessage";

// ─── Definisi Notifikasi Edukasi Kontekstual ───────────────────────────────
const EDUC_NOTIFS: Record<string, { id: string; title: string; message: string; expReward: number; icon: string; color: string }> = {
  pulang_sekolah: {
    id: 'pulang_sekolah',
    icon: '🏫',
    color: 'sky',
    title: 'Kamu Baru Pulang Sekolah!',
    message: 'Tadi di sekolah kamu ngantuk, lapar, dan cape? Itu terjadi karena tidurmu kurang tepat waktu! Kalau kamu tidur tepat waktu setiap malam, besok di kelas kamu akan lebih fokus, tidak ngantuk, dan penuh semangat! 💤⭐',
    expReward: 20
  },
  setelah_ibadah: {
    id: 'setelah_ibadah',
    icon: '🕌',
    color: 'emerald',
    title: 'Ibadahmu Sudah Selesai!',
    message: 'Bagaimana dengan ibadah? Hati kamu menjadi tenang dan tentram kan? Ibadah yang rutin membuat hidupmu lebih bermakna dan penuh berkah. Tetap konsisten ya! ✨',
    expReward: 20
  },
  menjelang_tidur: {
    id: 'menjelang_tidur',
    icon: '🌙',
    color: 'indigo',
    title: 'Waktunya Istirahat Malam!',
    message: 'Ayo tidur supaya saat kamu bangun pagi, badanmu segar dan siap menjalani hari baru yang menyenangkan! Mimpi indah ya, besok kita semangat lagi! 💤⭐',
    expReward: 20
  }
};

// ─── Kartu Edukasi Visual per Kategori Jadwal ────────────────────────────
const EDU_CARDS: Record<string, {
  image: string; headline: string; message: string;
  buttonText: string; color: string; expReward: number;
}> = {
  belajar: {
    image: '/edu/belajar.png',
    headline: 'Waktu Belajar Dimulai! 📚',
    message: 'Setiap menit belajar hari ini adalah investasi untuk masa depanmu! Singkirkan distraksi, fokus, dan raih ilmunya dengan semangat!',
    buttonText: 'Siap Belajar! 🚀',
    color: 'sky', expReward: 5
  },
  sekolah: {
    image: '/edu/sekolah.png',
    headline: 'Waktunya ke Sekolah! 🏫',
    message: 'Sekolah adalah petualangan ilmu setiap hari! Setiap pelajaran yang kamu pelajari hari ini adalah bekal masa depanmu yang cerah.',
    buttonText: 'Semangat Sekolah! 🎒',
    color: 'blue', expReward: 5
  },
  ibadah: {
    image: '/edu/ibadah.png',
    headline: 'Waktunya Beribadah! 🕌',
    message: 'Sholat tepat waktu adalah tanda kedisiplinan yang paling utama. Hati yang rajin beribadah menjadi lebih tenang, fokus, dan penuh berkah!',
    buttonText: 'Siap Beribadah! ✨',
    color: 'emerald', expReward: 5
  },
  tidur: {
    image: '/edu/tidur.png',
    headline: 'Waktunya Istirahat Malam! 🌙',
    message: 'Tubuhmu butuh pemulihan setelah beraktivitas seharian penuh. Tidur tepat waktu hari ini adalah janji untuk bangun lebih segar esok hari!',
    buttonText: 'Selamat Tidur! 💤',
    color: 'indigo', expReward: 5
  },
  bangun: {
    image: '/edu/bangun.png',
    headline: 'Selamat Pagi, Waktunya Bangun! ☀️',
    message: 'Pagi yang baru, kesempatan yang baru! Langsung matikan alarm dan mulai harimu dengan penuh energi positif!',
    buttonText: 'Aku Siap! 🌅',
    color: 'yellow', expReward: 5
  }
};

// ─── 14 Pesan Adulting — Manajemen Waktu (Sebab & Akibat) ───────────────────
const ADULTING_MSGS: AdultingMsgData[] = [
  {
    id: 'punctuality',
    title: 'Kamu Mulai Tepat Waktu!',
    emoji: '⏰',
    color: 'amber',
    cause: 'Kamu memulai kegiatan tepat pada waktunya hari ini.',
    effect: 'Kelak kamu akan dikenal sebagai orang yang bisa diandalkan. Di dunia kerja, orang yang tidak pernah terlambat selalu dipercaya lebih cepat dan diberi tanggung jawab lebih besar!',
    audioText: 'Kamu mulai tepat waktu! Karena kamu memulai kegiatan tepat pada waktunya, kelak kamu akan dikenal sebagai orang yang selalu bisa diandalkan!',
    expReward: 15
  },
  {
    id: 'efficiency',
    title: 'Selesai Tepat Waktunya!',
    emoji: '✅',
    color: 'green',
    cause: 'Kamu tahu kapan suatu aktivitas harus selesai — dan kamu benar-benar menyelesaikannya.',
    effect: 'Kelak kamu tidak akan pernah mengorbankan satu hal demi hal lain yang tidak perlu. Itulah efisiensi — skill paling dicari di dunia kerja manapun!',
    audioText: 'Selesai tepat waktunya! Karena kamu tahu kapan aktivitas harus selesai, kelak kamu tidak akan mengorbankan hal penting. Itulah efisiensi!',
    expReward: 15
  },
  {
    id: 'time_blocking',
    title: 'Selamat Pagi, Pengatur Waktu!',
    emoji: '📅',
    color: 'sky',
    cause: 'Kamu punya jadwal terstruktur dari pagi sampai malam — setiap jam sudah punya tujuan.',
    effect: 'Kelak otakmu terlatih berpikir dalam blok waktu. Orang dewasa yang bisa membagi harinya tidak pernah merasa hari ini terbuang sia-sia!',
    audioText: 'Selamat pagi pengatur waktu! Karena kamu punya jadwal terstruktur dari pagi sampai malam, kelak otakmu terlatih berpikir dalam blok waktu!',
    expReward: 20
  },
  {
    id: 'sleep_energy',
    title: 'Tidur Tepat Waktu = Investasi!',
    emoji: '🌙',
    color: 'indigo',
    cause: 'Kamu memilih tidur tepat waktu malam ini sesuai jadwalmu.',
    effect: 'Kamu sedang melindungi waktu produktif besok pagi! Orang dewasa yang tidak bisa mengatur jam tidurnya selalu kekurangan waktu — bukan karena harinya pendek, tapi karena energinya habis lebih dulu.',
    audioText: 'Tidur tepat waktu adalah investasi! Karena kamu tidur tepat waktu, kamu sedang melindungi waktu produktif besok pagi!',
    expReward: 20
  },
  {
    id: 'execution',
    title: 'Hari yang Sempurna!',
    emoji: '🏆',
    color: 'amber',
    cause: 'Hari ini kamu menyelesaikan SEMUA yang sudah direncanakan!',
    effect: 'Kamu membuktikan bahwa rencanamu bukan sekedar tulisan. Kemampuan mengeksekusi rencana sesuai waktu itulah yang membedakan orang yang bermimpi dan orang yang benar-benar berhasil!',
    audioText: 'Hari yang sempurna! Karena kamu menyelesaikan semua yang direncanakan, kamu membuktikan bahwa rencanamu bukan sekedar tulisan!',
    expReward: 50
  },
  {
    id: 'twenty_four_hours',
    title: '24 Jam yang Sama untuk Semua!',
    emoji: '⚡',
    color: 'purple',
    cause: 'Semua orang di bumi mendapat 24 jam yang sama setiap harinya — termasuk kamu.',
    effect: 'Bedanya bukan bakat atau keberuntungan, tapi siapa yang tahu cara mengaturnya. Hari ini kamu sudah mulai belajar caranya. Teruskan setiap hari!',
    audioText: 'Dua puluh empat jam yang sama untuk semua orang! Bedanya bukan bakat, tapi siapa yang tahu cara mengatur waktunya. Hari ini kamu sudah mulai belajar caranya!',
    expReward: 20
  },
  {
    id: 'prioritization',
    title: 'Kamu Mendahulukan yang Penting!',
    emoji: '🕌',
    color: 'green',
    cause: 'Kamu meletakkan ibadah lebih dulu sebelum aktivitas lainnya hari ini.',
    effect: 'Kamu sedang melatih otak untuk memprioritaskan. Dewasa nanti, orang yang bisa memilih mana yang dikerjakan duluan tidak pernah kehabisan waktu — karena yang penting sudah selesai sebelum waktu habis!',
    audioText: 'Kamu mendahulukan yang penting! Karena kamu mengutamakan ibadah lebih dulu, kamu sedang melatih otak untuk memprioritaskan!',
    expReward: 15
  },
  {
    id: 'deep_work',
    title: 'Waktunya Fokus Total!',
    emoji: '📚',
    color: 'blue',
    cause: 'Sekarang waktunya belajar — saatnya fokus penuh tanpa gangguan.',
    effect: 'Di dunia kerja nanti, distraksi tidak akan pernah berhenti datang. Orang yang bisa tetap fokus di jam kerjanya menyelesaikan dua kali lebih banyak dalam waktu yang sama!',
    audioText: 'Waktunya fokus total! Di dunia kerja nanti, orang yang bisa tetap fokus di jam kerjanya menyelesaikan dua kali lebih banyak dalam waktu yang sama!',
    expReward: 15
  },
  {
    id: 'compound_effect',
    title: 'Hati-Hati Waktu yang Terlewat!',
    emoji: '⏳',
    color: 'rose',
    cause: 'Ada jadwal yang belum selesai padahal waktunya sudah lewat.',
    effect: 'Terlambat 30 menit setiap hari terasa kecil — tapi dalam setahun kamu kehilangan 182 jam produktif! Orang sukses tidak membiarkan waktunya terbuang sedikit demi sedikit.',
    audioText: 'Hati-hati waktu yang terlewat! Terlambat 30 menit setiap hari terasa kecil, tapi dalam setahun kamu kehilangan 182 jam produktif!',
    expReward: 10
  },
  {
    id: 'time_estimation',
    title: 'Kamu Tahu Berapa Lama Kegiatanmu!',
    emoji: '🎯',
    color: 'teal',
    cause: 'Kamu berhasil menyelesaikan kegiatan sesuai durasi yang sudah direncanakan.',
    effect: 'Kelak kamu akan mampu mengestimasi waktu dengan tepat. Kemampuan menghitung berapa lama sesuatu selesai membuat kamu tidak pernah salah janji — kepada diri sendiri maupun orang lain!',
    audioText: 'Kamu tahu berapa lama kegiatanmu! Kelak kamu akan mampu mengestimasi waktu dengan tepat dan tidak pernah salah janji kepada siapapun!',
    expReward: 15
  },
  {
    id: 'habit_loop',
    title: 'Konsistensi adalah Kekuatanmu!',
    emoji: '🔥',
    color: 'orange',
    cause: 'Kamu sudah menjalankan jadwal hari demi hari secara konsisten — streakmu terus bertambah!',
    effect: 'Pola ini mulai menjadi bagian dari dirimu. Dewasa nanti, orang dengan kebiasaan konsisten tidak perlu motivasi setiap pagi — mereka bergerak otomatis dan selalu selangkah lebih maju!',
    audioText: 'Konsistensi adalah kekuatanmu! Karena kamu konsisten setiap hari, pola ini mulai menjadi bagian dari dirimu. Orang konsisten selalu selangkah lebih maju!',
    expReward: 25
  },
  {
    id: 'bounded_leisure',
    title: 'Waktu Bermain yang Bijak!',
    emoji: '🎈',
    color: 'purple',
    cause: 'Waktu bermainmu punya batas yang jelas dan kamu menghormatinya.',
    effect: 'Orang dewasa yang tidak bisa membatasi waktu hiburannya selalu merasa tidak cukup istirahat. Tapi orang yang tahu kapan berhenti justru merasa lebih puas dan lebih segar untuk aktivitas berikutnya!',
    audioText: 'Waktu bermain yang bijak! Orang yang tahu kapan berhenti bermain justru merasa lebih puas dan lebih segar untuk aktivitas berikutnya!',
    expReward: 15
  },
  {
    id: 'self_reflection',
    title: 'Hari Ini Hampir Sempurna!',
    emoji: '🌟',
    color: 'amber',
    cause: 'Sebagian besar jadwalmu hari ini sudah berhasil diselesaikan!',
    effect: 'Kamu sedang melatih kebiasaan evaluasi diri harian. Orang dewasa sukses selalu bertanya: apa yang kulakukan hari ini? Apa yang bisa lebih baik besok? Kamu sudah melakukannya!',
    audioText: 'Hari ini hampir sempurna! Kamu sedang melatih evaluasi diri harian. Orang dewasa sukses selalu bertanya apa yang bisa lebih baik besok!',
    expReward: 20
  },
  {
    id: 'time_equalizer',
    title: 'Selamat, Pengatur Waktu Sejati!',
    emoji: '✨',
    color: 'indigo',
    cause: 'Hari ini kamu punya 24 jam — sama persis dengan orang paling sukses di dunia.',
    effect: 'Bedanya hanya satu: mereka memutuskan setiap jam dipakai untuk apa. Kamu sudah melakukan itu hari ini. Tidur yang cukup malam ini adalah persiapan terbaikmu untuk hari esok. Selamat istirahat!',
    audioText: 'Selamat, pengatur waktu sejati! Kamu sudah memutuskan setiap jam dipakai untuk apa hari ini. Tidur yang cukup adalah persiapan terbaikmu untuk hari esok. Selamat istirahat!',
    expReward: 30
  }
];

export default function App() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [parentToken, setParentToken] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState<ChildState[]>([]);
  const [activeChildDeviceId, setActiveChildDeviceId] = useState<string | null>(null);
  const [linkChildCode, setLinkChildCode] = useState("");
  
  const [childState, setChildState] = useState<ChildState>({
    level: 1,
    exp: 0,
    maxExp: 1000,
    streak: 0,
    streakClaimedToday: false,
    avatarMood: "netral",
    avatarAction: "idle",
    badges: [],
    completedCount: 0
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [customSpeech, setCustomSpeech] = useState<string | null>(null);
  const [dailyQuote, setDailyQuote] = useState("Menghargai waktu hari ini adalah jembatan menuju mimpi besarmu esok hari!");

  // Load quote from Gemini proxy — abort after 8s to prevent error storm
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/gemini/quote", { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.text) setDailyQuote(data.text); })
      .catch(() => {})
      .finally(() => clearTimeout(t));
    return () => { ctrl.abort(); clearTimeout(t); };

  }, []);

  const handleAvatarClick = () => {
    if (isSpeaking) return;
    setCustomSpeech(dailyQuote);
    setIsSpeaking(true);
    
    // Dynamically import sound effects to speak the quote
    import('./components/SoundEffects').then(({ speakIndonesian }) => {
      speakIndonesian(dailyQuote, childState.gender || 'cewe');
    });

    setTimeout(() => {
      setIsSpeaking(false);
      setCustomSpeech(null);
    }, 5000);
  };

  // Theme or View Mode switcher: "child" (Anak POV) or "parent" (Parent POV)
  const [viewMode, setViewMode] = useState<"child" | "parent">("child");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Child Add Agenda Modal States
  const [isAddAgendaModalOpen, setIsAddAgendaModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStartTime, setNewStartTime] = useState("15:00");
  const [newEndTime, setNewEndTime] = useState("16:00");

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [confettiActive, setConfettiActive] = useState(false);

  // Notifikasi Edukasi Kontekstual
  const [activeEducNotif, setActiveEducNotif] = useState<typeof EDUC_NOTIFS[string] | null>(null);
  const shownEducNotifsRef = useRef<Set<string>>(new Set());
  const prevTimeRef = useRef<string>('');

  // Modal Wake-Up Bangun Pagi
  const [showWakeUpModal, setShowWakeUpModal] = useState(false);

  // Modal Streak
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Kartu Edukasi Visual
  const [activeEduCard, setActiveEduCard] = useState<(typeof EDU_CARDS[string] & { scheduleId: string }) | null>(null);
  const shownEduCardsRef = useRef<Set<string>>(new Set());

  // ─── Pesan Adulting ────────────────────────────────────────────────────────
  const [activeAdultingMsg, setActiveAdultingMsg] = useState<AdultingMsgData | null>(null);
  const shownAdultingMsgsRef = useRef<Set<string>>(new Set());
  const pendingAdultingMsgsRef = useRef<string[]>([]);

  // Helper trigger — didefinisikan di sini agar tersedia sebelum useEffect
  const triggerAdultingMsg = useCallback((id: string, delay = 0) => {
    if (shownAdultingMsgsRef.current.has(id)) return;
    shownAdultingMsgsRef.current.add(id);
    setTimeout(() => {
      setActiveAdultingMsg(prev => {
        if (prev !== null) {
          pendingAdultingMsgsRef.current.push(id);
          return prev;
        }
        return ADULTING_MSGS.find(m => m.id === id) || null;
      });
    }, delay);
  }, []);

  // Tick the clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ─── Auto Alarm + Notifikasi Edukasi Kontekstual ────────────────────────
  useEffect(() => {
    if (!currentTime || currentTime === prevTimeRef.current) return;
    const prev = prevTimeRef.current;
    prevTimeRef.current = currentTime;
    if (!prev || viewMode !== 'child') return; // hanya aktif di child mode

    schedules.forEach((schedule) => {
      // 🔔 Alarm otomatis saat jadwal baru mulai
      if (schedule.startTime === currentTime && !schedule.completed) {
        playAlarmSound();

        // 📚 Edu Card untuk belajar / sekolah / ibadah / tidur / bangun
        const eduKey = schedule.category as string;
        if (EDU_CARDS[eduKey]) {
          const cardId = `${eduKey}_${schedule.id}`;
          if (!shownEduCardsRef.current.has(cardId)) {
            shownEduCardsRef.current.add(cardId);
            setTimeout(() => setActiveEduCard({ ...EDU_CARDS[eduKey], scheduleId: schedule.id }), 600);
          }
        }
      }

      // 🏫 Notif pulang sekolah (saat jadwal sekolah selesai)
      if (schedule.category === 'sekolah' && schedule.endTime === currentTime
          && !shownEducNotifsRef.current.has('pulang_sekolah')) {
        shownEducNotifsRef.current.add('pulang_sekolah');
        setTimeout(() => setActiveEducNotif(EDUC_NOTIFS.pulang_sekolah), 800);
      }

      // 🕌 Notif setelah ibadah selesai
      if (schedule.category === 'ibadah' && schedule.endTime === currentTime
          && !shownEducNotifsRef.current.has(`ibadah_${schedule.id}`)) {
        shownEducNotifsRef.current.add(`ibadah_${schedule.id}`);
        setTimeout(() => setActiveEducNotif(EDUC_NOTIFS.setelah_ibadah), 800);
      }

      // ── ADULTING TRIGGERS berbasis waktu ──────────────────────────────────

      // #8 Deep Work: belajar mulai
      if (schedule.category === 'belajar' && schedule.startTime === currentTime && !schedule.completed) {
        triggerAdultingMsg('deep_work', 1200);
      }

      // #12 Bounded Leisure: bermain selesai
      if (schedule.category === 'bermain' && schedule.endTime === currentTime && schedule.completed) {
        triggerAdultingMsg('bounded_leisure', 1000);
      }

      // #4 Sleep Energy: tidur mulai
      if (schedule.category === 'tidur' && schedule.startTime === currentTime) {
        triggerAdultingMsg('sleep_energy', 1500);
        // #14 Time Equalizer: 4 detik setelah pesan tidur
        triggerAdultingMsg('time_equalizer', 5500);
      }

      // #2 Efficiency: jadwal sudah selesai saat endTime-nya tiba
      if (schedule.endTime === currentTime && schedule.completed) {
        triggerAdultingMsg('efficiency', 1000);
      }

      // #9 Compound Effect: ada jadwal yang terlewat
      if (!schedule.completed) {
        const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const curMin = toMin(currentTime);
        const endMin = toMin(schedule.endTime);
        const startMin = toMin(schedule.startTime);
        const isNowMissed = endMin < startMin
          ? (curMin > endMin && curMin < 720)
          : curMin > endMin;
        if (isNowMissed) triggerAdultingMsg('compound_effect', 2000);
      }
    });
  }, [currentTime, schedules, viewMode, triggerAdultingMsg]);


  useEffect(() => {
    // Check or generate device ID for child identification
    let storedDeviceId = localStorage.getItem("kidTimeDeviceId");
    if (!storedDeviceId) {
      storedDeviceId = uuidv4();
      localStorage.setItem("kidTimeDeviceId", storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Check parent token
    const token = localStorage.getItem("parentToken");
    if (token) {
      setParentToken(token);
      // Wait, we don't auto-switch to parent mode, they must explicitly click login 
      // or we can remember if they were in parent mode.
    }
  }, []);

  useEffect(() => {
    if (deviceId) {
      fetchState();
    }
  }, [deviceId]);

  const getHeaders = (auth = false) => {
    const targetDevice = (viewMode === "parent" && activeChildDeviceId) ? activeChildDeviceId : deviceId;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-device-id": targetDevice
    };
    if (auth && parentToken) {
      headers["Authorization"] = `Bearer \${parentToken}`;
    }
    return headers;
  };

  // Fetch full data from Express server — stable ref via useCallback
  const fetchState = useCallback(async () => {
    const targetDevice = (viewMode === "parent" && activeChildDeviceId) ? activeChildDeviceId : deviceId;
    if (!targetDevice) return;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-device-id": targetDevice
      };
      if (viewMode === "parent" && parentToken) headers["Authorization"] = `Bearer ${parentToken}`;
      const res = await fetch("/api/db", { headers });
      if (!res.ok) throw new Error("Failed to fetch state");
      const data = await res.json();
      if (data) {
        // Filter jadwal berdasarkan hari — 'Senin - Jumat' disembunyikan saat weekend
        const todayIdx = new Date().getDay(); // 0=Minggu, 6=Sabtu
        const isWeekend = todayIdx === 0 || todayIdx === 6;
        const filtered = (data.schedules ?? []).filter((s: import('./types').ScheduleItem) =>
          !(s.day === 'Senin - Jumat' && isWeekend)
        );
        setSchedules(filtered);
        setChildState(prev => ({ ...prev, ...data.child }));
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, activeChildDeviceId, deviceId, parentToken]);

  const fetchParentChildren = async (token: string) => {
    try {
      const res = await fetch("/api/parent/children", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLinkedChildren(data.children);
        if (data.children.length > 0 && !activeChildDeviceId) {
          setActiveChildDeviceId(data.children[0].device_id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch children", err);
    }
  };

  // Fetch data hanya saat target device berubah — gunakan ref agar tidak loop
  const lastFetchKeyRef = useRef("");
  useEffect(() => {
    const key = viewMode + "_" + (activeChildDeviceId ?? deviceId);
    if (key === lastFetchKeyRef.current) return;
    lastFetchKeyRef.current = key;
    if ((viewMode === "parent" && activeChildDeviceId) || (viewMode === "child" && deviceId)) {
      fetchState();
    }
  }, [viewMode, activeChildDeviceId, deviceId, fetchState]);

  const handleLinkChild = async () => {
    if (!linkChildCode.trim() || !parentToken) return;
    try {
      const res = await fetch("/api/parent/link_child", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${parentToken}`
        },
        body: JSON.stringify({ unique_code: linkChildCode })
      });
      const data = await res.json();
      if (data.success) {
        alert("Berhasil menghubungkan anak!");
        setLinkChildCode("");
        fetchParentChildren(parentToken);
      } else {
        alert(data.error || "Gagal menghubungkan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
  };

  // Post single quest accomplishment
  const handleCompleteScheduleItem = async (id: string) => {
    try {
      const completedSchedule = schedules.find(s => s.id === id);
      const res = await fetch("/api/schedule/complete", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        playCoinSound();
        setConfettiActive(true);
        if (data.leveledUp) playLevelUpSound();

        const updatedSchedules = schedules.map(item => item.id === id ? { ...item, completed: true } : item);
        setSchedules(updatedSchedules);

        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(prev => prev ? { ...prev, completed: true } : null);
        }
        if (data.child) setChildState(prev => ({ ...prev, ...data.child }));

        // ── Adulting triggers berbasis kategori ──
        if (completedSchedule) {
          const cat = completedSchedule.category;
          const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          const startMin = toMin(completedSchedule.startTime);
          const curMin = toMin(currentTime);
          const onTime = curMin >= startMin && curMin <= startMin + 5;

          // #1 Punctuality: selesai tepat awal jadwal
          if (onTime) triggerAdultingMsg('punctuality', 1500);
          // #7 Prioritization: ibadah selesai
          if (cat === 'ibadah') triggerAdultingMsg('prioritization', 2000);
          // #10 Time Estimation: random 1/3 jadwal apapun
          else if (Math.random() < 0.33) triggerAdultingMsg('time_estimation', 2000);

          // #5 Execution: semua jadwal selesai?
          const allDone = updatedSchedules.every(s => s.completed);
          if (allDone) { triggerAdultingMsg('execution', 3000); return; }

          // #13 Self-Reflection: ≥70% selesai
          const doneCount = updatedSchedules.filter(s => s.completed).length;
          const pct = doneCount / updatedSchedules.length;
          if (pct >= 0.7) triggerAdultingMsg('self_reflection', 3000);
        }
      }
    } catch (err) {
      console.error("Failed to complete schedule: ", err);
    }
  };


  const handleUpdateGender = async (gender: string) => {
    // Optimistic UI update
    setChildState(prev => ({ ...prev, gender }));
    
    try {
      await fetch("/api/child", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ gender })
      });
      fetchState();
    } catch (err) {
      console.error("Failed to update gender: ", err);
    }
  };

  const handleAddChildSchedule = async (e: React.FormEvent, title: string, startTime: string, endTime: string, description: string) => {
    e.preventDefault();
    try {
      await fetch("/api/child/schedule", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title, startTime, endTime, description
        })
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  // Claim consecutive Day Streaks
  const handleClaimStreakFeedback = async () => {
    try {
      const updatedChild = { ...childState, exp: childState.exp + 100, streakClaimedToday: true };
      
      let finalLevel = updatedChild.level;
      let finalExp = updatedChild.exp;
      let finalMaxExp = updatedChild.maxExp;
      
      if (finalExp >= finalMaxExp) {
        finalLevel += 1;
        finalExp -= finalMaxExp;
        finalMaxExp = Math.floor(1000 + (finalLevel * 100));
        playLevelUpSound();
        setConfettiActive(true);
      } else {
        playCoinSound();
        setConfettiActive(true);
      }

      await fetch("/api/child", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          exp: finalExp,
          level: finalLevel,
          maxExp: finalMaxExp,
          streakClaimedToday: true
        })
      });

      setChildState(prev => ({
        ...prev,
        exp: finalExp,
        level: finalLevel,
        maxExp: finalMaxExp,
        streakClaimedToday: true
      }));

      // #11 Habit Loop: setelah streak diklaim
      triggerAdultingMsg('habit_loop', 2000);

    } catch (err) {
      console.error(err);
    }
  };


  // Update (edit) any schedule item — orang tua bisa edit semua jadwal
  const handleUpdateScheduleItem = async (id: string, payload: Partial<ScheduleItem>) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      } else {
        alert(data.error || "Gagal mengubah jadwal.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add custom side-quest from parent
  const handleAddParentScheduleItem = async (payload: Partial<ScheduleItem>) => {
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      } else {
        alert(data.error || "Gagal menambah jadwal.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete/Cancel custom chore item
  const handleDeleteScheduleItem = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule/\${id}`, {
        method: "DELETE",
        headers: getHeaders(true)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchState();
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      } else {
        alert(data.error || "Gagal menghapus jadwal.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Wipes checkmarks back to mock parameters
  const handleResetSimulation = async () => {
    try {
      const res = await fetch("/api/reset", { 
        method: "POST",
        headers: getHeaders()
      });
      const data = await res.json();
      if (data) {
        setSchedules(data.schedules);
        setChildState(data.child);
        setSelectedItem(null);
        playCoinSound();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetActionState = useCallback((actStr: 'idle' | 'writing' | 'sleeping' | 'eating' | 'praying') => {
    setChildState(prev => prev.avatarAction === actStr ? prev : { ...prev, avatarAction: actStr });
  }, []);

  // ─── Handler: Klaim EXP dari Pesan Adulting ────────────────────────────────
  const handleClaimAdultingMsg = async (reward: number) => {
    setActiveAdultingMsg(null);
    playCoinSound();
    setConfettiActive(true);
    let finalExp = childState.exp + reward;
    let finalLevel = childState.level;
    let finalMaxExp = childState.maxExp;
    if (finalExp >= finalMaxExp) {
      finalLevel += 1;
      finalExp -= finalMaxExp;
      finalMaxExp = Math.floor(1000 + (finalLevel * 100));
      playLevelUpSound();
    }
    try {
      await fetch('/api/child', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ exp: finalExp, level: finalLevel, maxExp: finalMaxExp })
      });
      setChildState(prev => ({ ...prev, exp: finalExp, level: finalLevel, maxExp: finalMaxExp }));
    } catch (err) { console.error(err); }
    if (pendingAdultingMsgsRef.current.length > 0) {
      const nextId = pendingAdultingMsgsRef.current.shift()!;
      setTimeout(() => setActiveAdultingMsg(ADULTING_MSGS.find(m => m.id === nextId) || null), 600);
    }
  };

  // ─── Dismiss Kartu Edukasi Visual (+5 EXP) ────────────────────────────
  const handleDismissEduCard = async () => {
    if (!activeEduCard) return;
    const reward = activeEduCard.expReward;
    setActiveEduCard(null);
    playCoinSound();
    let finalExp = childState.exp + reward;
    let finalLevel = childState.level;
    let finalMaxExp = childState.maxExp;
    if (finalExp >= finalMaxExp) {
      finalLevel += 1; finalExp -= finalMaxExp;
      finalMaxExp = Math.floor(1000 + (finalLevel * 100));
      playLevelUpSound();
    }
    try {
      await fetch('/api/child', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ exp: finalExp, level: finalLevel, maxExp: finalMaxExp })
      });
      setChildState(prev => ({ ...prev, exp: finalExp, level: finalLevel, maxExp: finalMaxExp }));
    } catch (err) { console.error(err); }
  };

  // ─── Klaim EXP dari Notifikasi Edukasi ──────────────────────────────────
  const handleClaimEducNotif = async (reward: number) => {
    setActiveEducNotif(null);
    playCoinSound();
    setConfettiActive(true);
    let finalExp = childState.exp + reward;
    let finalLevel = childState.level;
    let finalMaxExp = childState.maxExp;
    if (finalExp >= finalMaxExp) {
      finalLevel += 1;
      finalExp -= finalMaxExp;
      finalMaxExp = Math.floor(1000 + (finalLevel * 100));
      playLevelUpSound();
    }
    try {
      await fetch('/api/child', {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ exp: finalExp, level: finalLevel, maxExp: finalMaxExp })
      });
      setChildState(prev => ({ ...prev, exp: finalExp, level: finalLevel, maxExp: finalMaxExp }));
    } catch (err) { console.error(err); }
  };

  // ─── Handler Wake-Up ────────────────────────────────────────────────────
  const handleWakeUp = async () => {
    setShowWakeUpModal(false);
    playCoinSound();
    setConfettiActive(true);
    const bangunSchedule = schedules.find(s => s.category === 'bangun' && !s.completed);
    if (bangunSchedule) {
      await handleCompleteScheduleItem(bangunSchedule.id);
    }
    // #3 Time Blocking & #6 24 Jam — setelah bangun pagi
    triggerAdultingMsg('time_blocking', 2000);
    triggerAdultingMsg('twenty_four_hours', 7000);
  };


  const handleParentLogin = (token: string) => {
    localStorage.setItem("parentToken", token);
    setParentToken(token);
    setIsLoginModalOpen(false);
    setViewMode("parent");
    fetchParentChildren(token);
  };

  const handleParentLogout = () => {
    localStorage.removeItem("parentToken");
    setParentToken(null);
    setViewMode("child");
    setActiveChildDeviceId(null);
  };

  return (
    <div className="min-h-screen bg-[#E0F2FE] text-[#1E293B] flex flex-col justify-between font-sans antialiased pb-10">
      
      {/* --- DEBUG TIME OVERRIDE --- */}
      <div className="fixed bottom-4 left-4 z-[100] bg-red-100 p-2 rounded-xl shadow-lg border-2 border-red-400 flex flex-col gap-1">
        <label className="text-xs font-black text-red-700 uppercase tracking-wider">🛠️ Debug Time</label>
        <input 
          type="time" 
          value={currentTime} 
          onChange={(e) => setCurrentTime(e.target.value)}
          className="border-2 border-red-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-red-500 font-mono font-bold"
        />
      </div>

      {/* Dynamic Celebration particles overlay */}
      <ConfettiEffect active={confettiActive} onComplete={() => setConfettiActive(false)} />

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleParentLogin} 
      />

      {/* ── MODAL: PESAN ADULTING MANAJEMEN WAKTU (z-[80] — di atas semua) ── */}
      {activeAdultingMsg && (
        <AdultingMessage
          message={activeAdultingMsg}
          gender={childState.gender || 'cewe'}
          onClaim={handleClaimAdultingMsg}
        />
      )}

      {/* ── MODAL: KARTU EDUKASI VISUAL (Gambar 2D + Pesan) ── */}
      {activeEduCard && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 sm:p-4">
          <div className={`bg-white w-full sm:max-w-sm rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden border-t-4 sm:border-4 ${
            activeEduCard.color === 'sky' ? 'border-sky-300' :
            activeEduCard.color === 'blue' ? 'border-blue-300' : 'border-emerald-300'
          }`}>
            {/* Ilustrasi — "Gambar 2D" as the star */}
            <div className={`w-full h-56 flex items-center justify-center overflow-hidden ${
              activeEduCard.color === 'sky' ? 'bg-gradient-to-b from-sky-50 to-blue-100' :
              activeEduCard.color === 'blue' ? 'bg-gradient-to-b from-blue-50 to-indigo-100' : 'bg-gradient-to-b from-emerald-50 to-teal-100'
            }`}>
              <img
                src={activeEduCard.image}
                alt="Ilustrasi Edukasi"
                className="h-52 w-auto object-contain drop-shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            {/* Pesan Edukasi */}
            <div className="p-5 flex flex-col gap-3 text-[#1E293B]">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight text-center">
                {activeEduCard.headline}
              </h2>
              <p className="text-sm text-slate-600 font-bold leading-relaxed text-center bg-slate-50 rounded-2xl p-3 border-2 border-slate-100">
                {activeEduCard.message}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 border-2 border-amber-200 px-4 py-1.5 rounded-full self-center">
                ✨ Baca &amp; Klaim +{activeEduCard.expReward} EXP!
              </div>
              <button
                onClick={handleDismissEduCard}
                className={`w-full font-black py-4 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm shadow-sm text-white ${
                  activeEduCard.color === 'sky' ? 'bg-sky-500 border-sky-700 hover:bg-sky-600' :
                  activeEduCard.color === 'blue' ? 'bg-blue-600 border-blue-800 hover:bg-blue-700' : 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600'
                }`}
              >
                {activeEduCard.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOTIFIKASI EDUKASI KONTEKSTUAL ── */}
      {activeEducNotif && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className={`bg-white w-full max-w-sm rounded-[32px] border-4 ${
            activeEducNotif.color === 'sky' ? 'border-sky-200' :
            activeEducNotif.color === 'emerald' ? 'border-emerald-200' : 'border-indigo-200'
          } p-6 shadow-2xl relative text-[#1E293B] animate-fadeIn`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4 shadow-inner ${
                activeEducNotif.color === 'sky' ? 'bg-sky-50 border-4 border-sky-200' :
                activeEducNotif.color === 'emerald' ? 'bg-emerald-50 border-4 border-emerald-200' : 'bg-indigo-50 border-4 border-indigo-200'
              }`}>
                {activeEducNotif.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-3">{activeEducNotif.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-bold">{activeEducNotif.message}</p>
              <div className="mt-2 text-xs font-black text-amber-600 bg-amber-50 border-2 border-amber-200 px-4 py-1.5 rounded-full">
                Klaim +{activeEducNotif.expReward} EXP dengan membaca pesan ini! ✨
              </div>
            </div>
            <button
              onClick={() => handleClaimEducNotif(activeEducNotif.expReward)}
              className={`mt-6 w-full font-black py-3.5 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-sm shadow-sm text-white ${
                activeEducNotif.color === 'sky' ? 'bg-sky-500 border-sky-700 hover:bg-sky-600' :
                activeEducNotif.color === 'emerald' ? 'bg-emerald-500 border-emerald-700 hover:bg-emerald-600' : 'bg-indigo-500 border-indigo-700 hover:bg-indigo-600'
              }`}
            >
              Keren! Aku Mengerti! (+{activeEducNotif.expReward} EXP) 🎉
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: WAKE-UP / BANGUN PAGI ── */}
      {showWakeUpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-amber-900/60 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-b from-amber-50 to-orange-50 w-full max-w-sm rounded-[32px] border-4 border-amber-300 p-6 shadow-2xl text-center">
            <div className="text-6xl mb-2 animate-bounce">🌅</div>
            <h2 className="text-2xl font-black text-amber-900 tracking-tight">Selamat Pagi!</h2>
            <p className="text-amber-800 font-bold mt-1 mb-2">Waktunya Bangun Tidur!</p>
            <p className="text-sm text-amber-700 leading-relaxed font-bold bg-white/60 rounded-2xl p-3 border-2 border-amber-200">
              Bangun pagi adalah awal dari hari yang produktif dan penuh semangat! Tubuhmu sudah cukup istirahat, saatnya memulai aktivitas! ☀️
            </p>
            <button
              onClick={handleWakeUp}
              className="mt-5 w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-black py-3.5 rounded-xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-sm shadow-sm"
            >
              Aku Sudah Bangun! ☀️ (+10 EXP)
            </button>
          </div>
        </div>
      )}

      {isAddAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] border-4 border-emerald-200 p-6 shadow-2xl relative text-[#1E293B]">
            <button 
              onClick={() => setIsAddAgendaModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#1E293B] font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors border-2 border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl font-black text-emerald-900 uppercase tracking-widest leading-tight">Buat Agendaku</h2>
            </div>
            <form 
              onSubmit={(e) => {
                handleAddChildSchedule(e, newTitle, newStartTime, newEndTime, newDesc);
                setNewTitle("");
                setNewDesc("");
                setNewStartTime("15:00");
                setNewEndTime("16:00");
                setIsAddAgendaModalOpen(false);
              }}
              className="flex flex-col gap-4 text-sm font-bold text-slate-700"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Judul Agenda</label>
                <input 
                  type="text" 
                  placeholder="misal: Main Sepeda" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-emerald-300 focus:outline-none focus:border-emerald-500 bg-emerald-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Jam Mulai</label>
                  <input 
                    type="time" 
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-emerald-300 focus:outline-none focus:border-emerald-500 bg-emerald-50 font-mono"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Jam Selesai</label>
                  <input 
                    type="time" 
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-emerald-300 focus:outline-none focus:border-emerald-500 bg-emerald-50 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Deskripsi (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Keterangan singkat..." 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-emerald-300 focus:outline-none focus:border-emerald-500 bg-emerald-50"
                />
              </div>
              <button 
                type="submit"
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-wider text-sm shadow-sm"
              >
                Tambah Agendaku (+10 XP)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP HEADER NAVIGATION / SWITCHER */}
      {/* TOP HEADER NAVIGATION / SWITCHER */}
      <header className="sticky top-0 z-40 px-3 md:px-6 py-2 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-white p-3 md:p-6 rounded-2xl md:rounded-[32px] shadow-[8px_8px_0px_0px_rgba(30,58,138,0.1)] border-4 border-blue-200 gap-3 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-16 md:h-16 bg-yellow-400 rounded-full border-2 md:border-4 border-white flex items-center justify-center text-xl md:text-3xl shadow-sm flex-shrink-0">
                🚀
              </div>
              <div className="flex flex-col">
                <h1 className="text-base md:text-2xl font-black text-blue-900 tracking-tight leading-none flex items-center flex-wrap gap-1">
                  Pahlawan Waktu! <span className="text-blue-600 font-bold uppercase tracking-wider text-[8px] md:text-xs bg-blue-50 px-2 md:px-2.5 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">Kid-Time Manager</span>
                </h1>
                <p className="text-[9px] md:text-xs text-blue-600 font-black uppercase tracking-wider mt-0.5">Kelola Waktu Seru Berbasis Gamifikasi</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics from design spec */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto">
            {viewMode === "child" ? (
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl md:rounded-none border-2 md:border-none border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-xl border-2 border-white flex items-center justify-center font-black text-sm md:text-lg text-white shadow-md flex-shrink-0">
                    {childState.level}
                  </div>
                  <div className="flex flex-col gap-0.5 w-24 md:w-32 text-xs">
                    <div className="flex justify-between items-baseline font-bold text-slate-700">
                      <span className="text-[9px] md:text-xs">EXP:</span>
                      <span className="text-[9px] md:text-xs">{childState.exp} / {childState.maxExp}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 md:bg-slate-100 rounded-full border-2 border-slate-300 md:border-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-800"
                        style={{ width: `${(childState.exp / childState.maxExp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowStreakModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 px-3 md:px-4 py-1.5 md:py-2.5 rounded-xl border-b-2 md:border-b-4 border-orange-700 text-white font-black flex items-center gap-1.5 shadow-sm text-[10px] md:text-sm cursor-pointer transition-all active:translate-y-[2px] active:border-b-2"
                >
                  <span className="text-sm md:text-lg animate-bounce">🔥</span> {childState.streak} HARI
                </button>

                {/* Gender Vertical Toggle */}
                <div 
                  className="relative w-8 h-14 bg-slate-200 rounded-full border-2 border-slate-300 shadow-inner cursor-pointer flex flex-col items-center justify-between py-1 overflow-hidden"
                  onClick={() => handleUpdateGender(childState.gender === 'lanang' ? 'cewe' : 'lanang')}
                  title="Ganti Karakter (Laki-laki / Perempuan)"
                >
                  <div className="text-[8px] opacity-0">.</div>
                  <div 
                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md z-10 left-[2px] ${
                      childState.gender === 'lanang' 
                        ? 'top-[2px] bg-blue-500 text-white' 
                        : 'bottom-[2px] bg-pink-500 text-white'
                    }`}
                  >
                    {childState.gender === 'lanang' ? '👨' : '👩'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-indigo-100 text-indigo-800 px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl border-2 border-indigo-200 font-black flex items-center gap-2 shadow-sm uppercase tracking-wider text-[10px] md:text-sm w-full md:w-auto justify-center">
                Mode Orang Tua Aktif
              </div>
            )}

            {/* Mode switch controllers */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border-2 border-slate-200 w-full md:w-auto justify-center">
              {viewMode === "parent" ? (
                <div className="flex items-center gap-2 w-full md:w-auto justify-between px-1">
                  <select 
                    value={activeChildDeviceId || ""}
                    onChange={(e) => setActiveChildDeviceId(e.target.value)}
                    className="px-2 md:px-3 py-1.5 rounded-lg border-2 border-indigo-200 bg-white text-[10px] md:text-xs font-bold text-indigo-900 focus:outline-none max-w-[120px] md:max-w-none"
                  >
                    {linkedChildren.length === 0 && <option value="">Pilih Anak</option>}
                    {linkedChildren.map((c, i) => (
                      <option key={i} value={c.device_id}>
                        Anak {i + 1} ({c.unique_code})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleParentLogout}
                    className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all bg-indigo-600 text-white border-b-2 border-indigo-800 hover:bg-indigo-700 shadow-sm w-full md:w-auto justify-center"
                >
                  <Users className="w-4 h-4" />
                  Login Orang Tua
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CORE FRAMEWORK CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-4 flex-grow w-full">
        
        {/* Toggleable Layout Rendering */}
        {viewMode === "child" ? (
          
          /* CHILD VIEW PORT - DUAL COLUMN GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar Layout:svg-wheel widgets, virtual guide companion */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
              <AnalogClock
                schedules={schedules}
                selectedItem={selectedItem}
                onSelectItem={(item) => setSelectedItem(item)}
                activeTimeStr={currentTime}
                onAddAgendaClick={() => setIsAddAgendaModalOpen(true)}
              />

              <AvatarView
                mood={childState.avatarMood}
                action={childState.avatarAction}
                level={childState.level}
                gender={childState.gender || 'cewe'}
                isSpeaking={isSpeaking}
                customSpeech={customSpeech}
                onChangeGender={handleUpdateGender}
                onClickAvatar={handleAvatarClick}
              />
            </div>

            {/* Right Core panel: story timeline, streaks and notifications */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Highlight details pop-up modal for clicked schedule block */}
              {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                  <div className="bg-white w-full max-w-lg rounded-[32px] border-4 border-blue-200 p-6 shadow-2xl relative text-[#1E293B]">
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-[#1E293B] font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors border-2 border-slate-200 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center mt-2">
                      <div className="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-full flex items-center justify-center text-blue-500 font-bold text-4xl mb-4 shadow-inner">
                        📅
                      </div>
                      <h3 className="text-xl font-black text-blue-950 uppercase tracking-widest leading-tight">{selectedItem.title}</h3>
                      <p className="text-sm text-slate-500 font-bold mt-2">{selectedItem.description}</p>
                      
                      <div className="flex items-center justify-center gap-3 mt-6 text-sm font-black w-full">
                        <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl border-2 border-slate-200">
                          ⏰ {selectedItem.startTime} - {selectedItem.endTime}
                        </span>
                        <span className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl border-2 border-amber-200 flex items-center gap-1.5">
                          <Award className="w-4 h-4" /> +{selectedItem.reward} XP
                        </span>
                      </div>
                      
                      <div className="mt-8 w-full">
                        {!selectedItem.completed ? (
                          <button
                            onClick={() => {
                              handleCompleteScheduleItem(selectedItem.id);
                              setSelectedItem(null);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl border-b-4 border-blue-800 shadow-sm active:translate-y-[2px] active:border-b-2 uppercase tracking-widest font-black text-sm transition-all"
                          >
                            Selesaikan Tugas
                          </button>
                        ) : (
                          <span className="w-full bg-green-100 text-green-700 border-2 border-green-300 px-6 py-3.5 rounded-xl uppercase flex items-center justify-center gap-2 font-black text-sm">
                            <CheckCircle className="w-5 h-5" /> Sudah Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <ChildPOV
                childState={childState}
                schedules={schedules}
                onCompleteSchedule={handleCompleteScheduleItem}
                onTriggerStreak={handleClaimStreakFeedback}
                currentTime={currentTime}
                onSetActionState={(action: any) => setChildState(prev => ({ ...prev, avatarAction: action }))}
                triggerConfetti={() => setConfettiActive(true)}
                onSetSpeaking={setIsSpeaking}
                onSetCustomSpeech={setCustomSpeech}
                onAddChildSchedule={handleAddChildSchedule}
              />
            </div>
          </div>
        ) : (
          
          /* PARENT VIEW PORT: Create schedules with templates + watcher on the right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Core Creation workspace */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* New Child Link Box */}
              <div className="bg-white p-6 rounded-[32px] border-4 border-indigo-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full">
                  <h3 className="font-black text-indigo-900 text-sm">Tautkan Akun Anak Baru</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">Masukkan 6 digit kode unik yang ada di layar aplikasi anak.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <input 
                    type="text" 
                    placeholder="Kode Unik" 
                    value={linkChildCode}
                    onChange={(e) => setLinkChildCode(e.target.value.toUpperCase())}
                    className="flex-1 sm:flex-none w-full min-w-0 px-4 py-2 border-2 border-indigo-200 rounded-xl text-sm font-black text-indigo-900 focus:outline-none focus:border-indigo-500"
                    maxLength={6}
                  />
                  <button 
                    onClick={handleLinkChild}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow-sm"
                  >
                    Hubungkan
                  </button>
                </div>
              </div>

              {activeChildDeviceId ? (
                <ParentPOV
                  schedules={schedules}
                  onAddSchedule={handleAddParentScheduleItem}
                  onDeleteSchedule={handleDeleteScheduleItem}
                  onUpdateSchedule={handleUpdateScheduleItem}
                />
              ) : (
                <div className="bg-white p-10 rounded-[32px] border-4 border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <h2 className="font-black text-slate-400 text-lg mb-2">Belum Ada Anak Terpilih</h2>
                  <p className="text-sm font-bold text-slate-400 max-w-sm">
                    Silakan masukkan kode unik di atas untuk menautkan perangkat anak Anda ke akun orang tua ini.
                  </p>
                </div>
              )}
            </div>

            {/* Watcher preview panel so parent sees live update updates */}
            {activeChildDeviceId && (
              <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-28">
                <div className="p-3 bg-white border-4 border-blue-100 text-[#1E293B] shadow-[4px_4px_0px_0px_rgba(30,58,138,0.1)] rounded-[20px] flex justify-center text-xs uppercase font-black tracking-widest font-mono">
                  🔍 Pemantau Anak (Live Watcher)
                </div>
                <AnalogClock
                  schedules={schedules}
                  selectedItem={selectedItem}
                  onSelectItem={(item) => setSelectedItem(item)}
                  activeTimeStr={currentTime}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: STREAK (Moved from ChildPOV main page to TopBar trigger) */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white p-5 md:p-8 rounded-[32px] border-4 border-orange-200 shadow-2xl relative w-full max-w-sm text-center flex flex-col justify-between text-[#1E293B] animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowStreakModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-[#1E293B] font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-colors border-2 border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-2 left-4 flex pointer-events-none">
              <span className="text-3xl animate-bounce">🔥</span>
            </div>
            
            <div className="mt-6 mb-4">
              <span className="text-[10px] md:text-xs font-black tracking-widest text-orange-600 uppercase block mb-1">
                Pertahankan Ritme Disiplin
              </span>
              <h3 className="text-base md:text-lg font-black text-slate-800">
                Streak Belajar Harian
              </h3>
            </div>
            
            <div className="flex items-center justify-center gap-2 my-4 bg-orange-50 py-4 rounded-2xl border-2 border-orange-100">
              <span className="text-5xl font-black font-mono text-orange-500">
                {childState.streak} HARIAN
              </span>
              <span className="text-2xl animate-pulse">🔥</span>
            </div>

            {childState.streakClaimedToday ? (
              <span className="bg-slate-100 border-2 border-slate-200 text-slate-400 text-sm py-3 rounded-2xl font-bold block w-full uppercase mt-4">
                Bonus Sudah Diambil Hari Ini 👍
              </span>
            ) : (
              <button
                onClick={() => {
                  handleClaimStreakFeedback();
                  setShowStreakModal(false);
                }}
                className="mt-4 bg-orange-400 border-b-4 border-orange-600 hover:bg-orange-500 text-white font-black text-sm py-3 px-4 rounded-xl font-sans tracking-wide uppercase shadow-sm active:translate-y-[2px] active:border-b-2 cursor-pointer w-full"
              >
                Klaim Bonus Streak (+100 XP)!
              </button>
            )}
          </div>
        </div>
      )}

      {/* FOOTER METRICS & UTILITIES CORES */}
      <footer className="py-6 max-w-7xl mx-auto w-full px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500 bg-white rounded-[32px] border-4 border-blue-100 shadow-md">
        <div className="px-4">
          <span className="font-bold text-slate-600">© 101 Time Management Team London Is Blue. London Is Blue Member: M Rafi Ramadhan Kartika, Dzakia Lailah Hamsa, Imron Satrio Purnomo. </span>
        </div>

        {/* Global Reset Simulator Button */}
        <div className="flex items-center gap-2 px-4">
          <span className="text-[10px] text-slate-400 font-bold">Simulasi Stuck?</span>
          <button
            onClick={handleResetSimulation}
            className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 border-b-4 border-yellow-600 text-slate-900 font-black px-4 py-2 rounded-xl transition-all text-[10px] uppercase font-mono shadow-sm active:translate-y-[2px] active:border-b-2"
          >
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            Reset Simulasi
          </button>
        </div>
      </footer>
    </div>
  );
}
