/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Reorder } from "motion/react";
import { ScheduleItem } from "../types";
import { 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  BookOpen, 
  HeartHandshake, 
  Home, 
  Smartphone,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import { playCoinSound } from "./SoundEffects";

interface ParentPOVProps {
  schedules: ScheduleItem[];
  onAddSchedule: (scheduleData: Partial<ScheduleItem>) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onUpdateSchedule: (id: string, data: Partial<ScheduleItem>) => Promise<void>;
}

export default function ParentPOV({ schedules, onAddSchedule, onDeleteSchedule, onUpdateSchedule }: ParentPOVProps) {
  // Task form states
  const [category, setCategory] = useState<'belajar' | 'bermain' | 'parent_increment'>('parent_increment');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("16:30");
  const [reward, setReward] = useState(10);
  const [day, setDay] = useState<'Hari ini' | 'Senin - Jumat' | 'Setiap Hari'>('Hari ini');

  // Interactive templates
  const templates = [
    { label: "Belajar", icon: BookOpen, title: "Rapikan meja belajar", desc: "Rapikan meja belajar dan susun buku dengan rapi.", cat: "belajar" as any, reward: 20 },
    { label: "Membantu", icon: HeartHandshake, title: "Membantu Orang Tua", desc: "Membantu ibu merapikan rumah atau mencuci piring.", cat: "parent_increment" as any, reward: 15 },
    { label: "Bersihkan", icon: Home, title: "Membersihkan Rumah", desc: "Membersihkan debu di ruang tamu atau menyapu lantai.", cat: "parent_increment" as any, reward: 25 },
    { label: "Lainnya", icon: Layers, title: "Misi Mandiri", desc: "Aktivitas positif tambahan sesuai kesepakatan.", cat: "parent_increment" as any, reward: 10 }
  ];

  // Success indicator overlay
  const [successSent, setSuccessSent] = useState(false);
  const [lastItemSummary, setLastItemSummary] = useState<any>(null);

  // Edit Modal State
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editReward, setEditReward] = useState(10);
  const [editDay, setEditDay] = useState<'Hari ini' | 'Senin - Jumat' | 'Setiap Hari'>('Setiap Hari');

  const openEdit = (s: ScheduleItem) => {
    setEditingSchedule(s);
    setEditTitle(s.title);
    setEditDesc(s.description);
    setEditStart(s.startTime);
    setEditEnd(s.endTime);
    setEditReward(s.reward);
    setEditDay(s.day);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    await onUpdateSchedule(editingSchedule.id, {
      title: editTitle, description: editDesc,
      startTime: editStart, endTime: editEnd,
      reward: editReward, day: editDay
    });
    setEditingSchedule(null);
  };

  const applyTemplate = (tpl: any) => {
    setTitle(tpl.title);
    setDescription(tpl.desc);
    setCategory(tpl.cat);
    setReward(tpl.reward);
    playCoinSound();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      startTime,
      endTime,
      category,
      reward,
      day,
      parentQuest: true,
      locked: false
    };

    await onAddSchedule(payload);
    
    // Play SFX
    playCoinSound();

    setLastItemSummary({
      title,
      time: `${startTime} - ${endTime}`,
      day,
      reward: `+${reward} XP`
    });

    // Reset form
    setTitle("");
    setDescription("");
    
    // Show scene 2 success storyboard
    setSuccessSent(true);
  };

  // Filter schedules that are parent custom tasks
  const parentTasks = schedules.filter(s => s.parentQuest);
  const [orderedTasks, setOrderedTasks] = useState(parentTasks);

  // Sync orderedTasks if parentTasks changes (e.g. addition or deletion)
  useEffect(() => {
    // Only update if lengths differ to preserve order during re-renders
    if (parentTasks.length !== orderedTasks.length) {
      setOrderedTasks(parentTasks);
    }
  }, [schedules, orderedTasks.length, parentTasks]);

  // Filter systems-locked schedules
  const systemSchedules = schedules.filter(s => s.locked);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-[#1E293B] p-2">
      {/* LEFT COLUMN: Create schedule form */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[32px] border-4 border-indigo-200 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.08)] relative min-h-[460px] flex flex-col justify-between text-[#1E293B]">
          
          {successSent ? (
            /* STORYBOARD SCENE 2 SUCCESS TRIGGER SCREEN */
            <div className="flex flex-col items-center justify-center py-10 text-center flex-grow animate-fadeIn text-[#1E293B]">
              <div className="w-20 h-20 bg-green-100 rounded-full border-4 border-green-300 flex items-center justify-center text-green-700 mb-6 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <h3 className="text-xl font-bold text-blue-950">Misi Berhasil Diberikan ke Anak!</h3>
              <p className="text-slate-600 text-sm font-bold mt-2 max-w-sm">
                Jadwal sudah dikirim secara real-time dan akan langsung muncul di aplikasi/handphone si kecil.
              </p>

              {/* Summary box from diagram */}
              <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl w-full max-w-xs mt-6 text-left space-y-2.5 font-bold text-xs text-[#1E293B]">
                <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider block">Ringkasan Misi:</span>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-extrabold truncate">{lastItemSummary?.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{lastItemSummary?.time} | {lastItemSummary?.day}</span>
                </div>
                {lastItemSummary?.reward && (
                  <div className="flex items-center gap-2 text-green-600 font-black">
                    <Sparkles className="w-4 h-4" />
                    <span>Reward: {lastItemSummary.reward}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSuccessSent(false)}
                className="mt-8 bg-indigo-600 border-b-4 border-indigo-850 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-sm text-xs tracking-wider uppercase transition-all active:translate-y-[2px] active:border-b-2 cursor-pointer"
              >
                Buat Misi Baru
              </button>
            </div>
          ) : (
            <>
              {/* Form header and templates selection matching scene 1 */}
              <div>
                <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100 pb-3">
                  <h3 className="text-lg font-black tracking-tight text-blue-950">
                    Sesi Orang tua: Buat Tugas / Misi
                  </h3>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border-2 border-indigo-200 uppercase">
                    Misi Orang Tua
                  </span>
                </div>

                {/* Templates grid */}
                <span className="text-xs text-slate-500 font-extrabold block mb-2 uppercase tracking-wide">Pilih Cepat Kategori & Template:</span>
                <div className="grid grid-cols-4 gap-2.5 mb-6">
                  {templates.map((tpl, i) => {
                    const TplIcon = tpl.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                          <TplIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black w-full text-slate-750 truncate">{tpl.label}</span>
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* TitleInput */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Judul Tugas / Misi</label>
                    <input
                      required
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Rapikan kamar tidur / Cuci piring"
                      className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 transition-all font-bold placeholder:text-slate-400 w-full"
                    />
                  </div>

                  {/* DescriptionInput */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Langkah Instruksi (Opsional)</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Contoh: Susun buku-buku sekolah dengan rapi di rak buku."
                      className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 transition-all resize-none font-bold placeholder:text-slate-400 w-full"
                    />
                  </div>

                  {/* Timing setting rows */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Pilih Hari</label>
                      <select
                        value={day}
                        onChange={(e: any) => setDay(e.target.value)}
                        className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-850 font-bold w-full"
                      >
                        <option value="Hari ini" className="text-slate-800 font-bold">Hari ini</option>
                        <option value="Senin - Jumat" className="text-slate-800 font-bold">Senin - Jumat</option>
                        <option value="Setiap Hari" className="text-slate-800 font-bold">Setiap Hari</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Reward XP</label>
                      <select
                        value={reward}
                        onChange={(e) => setReward(Number(e.target.value))}
                        className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-green-700 font-black w-full"
                      >
                        <option value={10}>+10 XP POIN</option>
                        <option value={15}>+15 XP POIN</option>
                        <option value={20}>+20 XP POIN</option>
                        <option value={25}>+25 XP POIN</option>
                        <option value={50}>+50 XP POIN (Misi Spesial)</option>
                      </select>
                    </div>
                  </div>

                  {/* Hour Timing Blocks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Jam Mulai</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-black uppercase tracking-wide">Jam Selesai</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 border-b-4 border-indigo-800 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl shadow-md transition-all active:translate-y-[2px] active:border-b-2 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Kirim Misi Ke Anak (Berikan Jadwal)
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Semua Jadwal — bisa edit & hapus */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* EDIT MODAL */}
        {editingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
            <div className="bg-white w-full max-w-md rounded-[32px] border-4 border-indigo-200 p-5 sm:p-6 shadow-2xl text-[#1E293B] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 gap-2">
                <h3 className="text-base font-black text-indigo-900 uppercase tracking-wide truncate">Edit Jadwal</h3>
                <button onClick={() => setEditingSchedule(null)} className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 border-2 border-slate-200">
                  <Trash2 className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="flex flex-col gap-3 text-xs font-bold text-slate-700">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">Judul</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-indigo-50 font-bold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500">Deskripsi</label>
                  <textarea rows={2} value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-indigo-50 resize-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Jam Mulai</label>
                    <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)}
                      className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-indigo-50 font-mono font-bold" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Jam Selesai</label>
                    <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                      className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-indigo-50 font-mono font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Hari</label>
                    <select value={editDay} onChange={e => setEditDay(e.target.value as any)}
                      className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white font-bold">
                      <option value="Hari ini">Hari ini</option>
                      <option value="Senin - Jumat">Senin - Jumat</option>
                      <option value="Setiap Hari">Setiap Hari</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500">Reward XP</label>
                    <input type="number" min={0} max={100} value={editReward} onChange={e => setEditReward(Number(e.target.value))}
                      className="border-2 border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 bg-indigo-50 font-black text-green-700" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                <button onClick={() => setEditingSchedule(null)}
                  className="w-full sm:flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase hover:bg-slate-50">
                  Batal
                </button>
                <button onClick={handleSaveEdit}
                  className="w-full sm:flex-1 py-2.5 rounded-xl bg-indigo-600 border-b-4 border-indigo-800 hover:bg-indigo-700 text-white font-black text-xs uppercase active:translate-y-[2px] active:border-b-2 transition-all">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEMUA JADWAL */}
        <div className="bg-white p-5 rounded-[32px] border-4 border-indigo-200 shadow-[8px_8px_0px_0px_rgba(79,70,229,0.08)] flex flex-col gap-4 text-[#1E293B] max-h-[70vh] overflow-y-auto">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2 sticky top-0 bg-white pb-2 border-b-2 border-slate-100">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Semua Jadwal Anak ({schedules.length})
          </h3>

          {/* Grup: Jadwal Sistem (locked) */}
          {schedules.filter(s => s.locked).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Jadwal Sistem ({schedules.filter(s => s.locked).length})
              </span>
              {schedules.filter(s => s.locked).map(s => (
                <div key={s.id} className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-0.5 flex-grow min-w-0">
                    <span className="font-black text-xs text-slate-800 truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{s.startTime} – {s.endTime} · {s.day}</span>
                    {s.completed && <span className="text-[9px] text-green-700 font-black">✓ Selesai</span>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="p-1.5 bg-white rounded-lg border-2 border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer" title="Edit">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteSchedule(s.id)}
                      className="p-1.5 bg-white rounded-lg border-2 border-rose-200 text-rose-400 hover:bg-rose-50 transition-colors cursor-pointer" title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grup: Misi Orang Tua */}
          {schedules.filter(s => s.parentQuest).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" /> Misi Orang Tua ({schedules.filter(s => s.parentQuest).length})
              </span>
              {schedules.filter(s => s.parentQuest).map(s => (
                <div key={s.id} className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-3 flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-0.5 flex-grow min-w-0">
                    <span className="font-black text-xs text-slate-800 truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{s.startTime} – {s.endTime} · {s.day}</span>
                    <span className={`text-[9px] font-black ${ s.completed ? 'text-green-700' : 'text-amber-600' }`}>
                      {s.completed ? '✓ Selesai' : '⏳ Menunggu'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="p-1.5 bg-white rounded-lg border-2 border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer" title="Edit">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteSchedule(s.id)}
                      className="p-1.5 bg-white rounded-lg border-2 border-rose-200 text-rose-400 hover:bg-rose-50 transition-colors cursor-pointer" title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grup: Jadwal Mandiri Anak */}
          {schedules.filter(s => !s.locked && !s.parentQuest).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Jadwal Mandiri Anak ({schedules.filter(s => !s.locked && !s.parentQuest).length})
              </span>
              {schedules.filter(s => !s.locked && !s.parentQuest).map(s => (
                <div key={s.id} className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-3 flex justify-between items-start gap-2">
                  <div className="flex flex-col gap-0.5 flex-grow min-w-0">
                    <span className="font-black text-xs text-slate-800 truncate">{s.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{s.startTime} – {s.endTime} · {s.day}</span>
                    {s.completed && <span className="text-[9px] text-green-700 font-black">✓ Selesai</span>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="p-1.5 bg-white rounded-lg border-2 border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-colors cursor-pointer" title="Edit">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteSchedule(s.id)}
                      className="p-1.5 bg-white rounded-lg border-2 border-rose-200 text-rose-400 hover:bg-rose-50 transition-colors cursor-pointer" title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {schedules.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs font-bold">Belum ada jadwal</div>
          )}
        </div>
      </div>
    </div>
  );
}
