/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { ScheduleItem } from "../types";
import { Clock, Info, Plus } from "lucide-react";

interface AnalogClockProps {
  schedules: ScheduleItem[];
  selectedItem: ScheduleItem | null;
  onSelectItem: (item: ScheduleItem) => void;
  activeTimeStr: string; // Current simulated time e.g. "06:30"
  onAddAgendaClick?: () => void;
}

// Convert HH:MM to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Coordinate calculator for donut slices
function getCoordinatesForPercent(percent: number, radius: number, cx = 150, cy = 150): [number, number] {
  // Offset by -90 degrees so 00:00 is at top center
  const angleRad = (percent * 360 - 90) * (Math.PI / 180);
  const x = cx + radius * Math.cos(angleRad);
  const y = cy + radius * Math.sin(angleRad);
  return [x, y];
}

// Define matching colors for categories in style
export const CATEGORY_COLORS: { [key: string]: { border: string; bg: string; fill: string; text: string; label: string } } = {
  tidur: {
    border: "border-indigo-300",
    bg: "bg-indigo-50",
    fill: "#6366f1", // Indigo 500
    text: "text-indigo-700",
    label: "Tidur 💤"
  },
  ibadah: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    fill: "#10b981", // Emerald 500
    text: "text-emerald-700",
    label: "Ibadah 🕌"
  },
  sekolah: {
    border: "border-sky-300",
    bg: "bg-sky-50",
    fill: "#0ea5e9", // Sky 500
    text: "text-sky-700",
    label: "Sekolah 🏫"
  },
  bangun: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    fill: "#eab308", // Yellow 500
    text: "text-amber-700",
    label: "Bangun Pagi 🌅"
  },
  belajar: {
    border: "border-fuchsia-300",
    bg: "bg-fuchsia-50",
    fill: "#d946ef", // Fuchsia 500
    text: "text-fuchsia-700",
    label: "Belajar 📖"
  },
  bermain: {
    border: "border-rose-300",
    bg: "bg-rose-50",
    fill: "#f43f5e", // Rose 500
    text: "text-rose-700",
    label: "Bermain 🎮"
  },
  parent_increment: {
    border: "border-teal-300",
    bg: "bg-teal-50",
    fill: "#14b8a6", // Teal 500
    text: "text-teal-700",
    label: "Misi Orang Tua ⭐"
  }
};

export default function AnalogClock({ schedules, selectedItem, onSelectItem, activeTimeStr, onAddAgendaClick }: AnalogClockProps) {
  // Convert current simulated time to angle
  const activeAnglePercent = useMemo(() => {
    const min = timeToMinutes(activeTimeStr);
    return min / 1440; // 1440 minutes in 24 hours
  }, [activeTimeStr]);

  const activeHandCoords = useMemo(() => {
    return getCoordinatesForPercent(activeAnglePercent, 120);
  }, [activeAnglePercent]);

  // Generate path segments representing 24 hours
  const segments = useMemo(() => {
    const list: Array<{
      path: string;
      item: ScheduleItem;
      color: string;
      label: string;
      startMin: number;
      endMin: number;
    }> = [];

    schedules.forEach((item) => {
      // Don't draw events with 0 duration or school study block (represented as part of school segment)
      if (item.startTime === item.endTime) return;

      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);

      const color = CATEGORY_COLORS[item.category]?.fill || "#64748b";
      const label = item.title;

      // Handle items that cross midnight eg 21:30 - 05:00
      if (end < start) {
        // Segment 1: start to midnight (1440)
        list.push(createSegment(start, 1440, item, color, label));
        // Segment 2: midnight to end
        list.push(createSegment(0, end, item, color, label));
      } else {
        list.push(createSegment(start, end, item, color, label));
      }
    });

    function createSegment(sMin: number, eMin: number, sItem: ScheduleItem, colStr: string, textLbl: string) {
      const startPct = sMin / 1440;
      const endPct = eMin / 1440;

      // outer and inner radius
      const rOuter = 135;
      const rInner = 85;

      const [x1_out, y1_out] = getCoordinatesForPercent(startPct, rOuter);
      const [x2_out, y2_out] = getCoordinatesForPercent(endPct, rOuter);
      const [x1_in, y1_in] = getCoordinatesForPercent(startPct, rInner);
      const [x2_in, y2_in] = getCoordinatesForPercent(endPct, rInner);

      const largeArc = (endPct - startPct) > 0.5 ? 1 : 0;

      // Create beautiful SVG paths for thick concentric chunks
      const pathData = [
        `M ${x1_out} ${y1_out}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2_out} ${y2_out}`,
        `L ${x2_in} ${y2_in}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1_in} ${y1_in}`,
        "Z"
      ].join(" ");

      return {
        path: pathData,
        item: sItem,
        color: colStr,
        label: textLbl,
        startMin: sMin,
        endMin: eMin
      };
    }

    return list;
  }, [schedules]);

  return (
    <div className="flex flex-col items-center justify-center bg-white p-6 rounded-[32px] border-4 border-green-200 shadow-[8px_8px_0px_0px_rgba(22,101,52,0.08)] relative overflow-hidden text-[#1E293B]">
      {/* Absolute Header Ribbon */}
      <div className="flex items-center gap-2 mb-4 w-full justify-between">
        <h3 className="text-sm font-black tracking-wide text-green-800 flex items-center gap-1.5 uppercase">
          <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
          Roda Waktu
        </h3>
        <div className="flex items-center gap-1.5">
          {onAddAgendaClick && (
            <button
              onClick={onAddAgendaClick}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-1.5 rounded-full border-2 border-emerald-300 transition-colors cursor-pointer shadow-sm"
              title="Buat Agenda Sendiri"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          )}
          <span className="text-[10px] font-black bg-green-50 text-green-700 px-2 py-1 rounded-full border-2 border-green-200 uppercase whitespace-nowrap">
            Berputar
          </span>
        </div>
      </div>

      <div className="relative w-[300px] h-[300px] flex items-center justify-center select-none">
        {/* Background glow circle */}
        <div className="absolute inset-0 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

        {/* Dynamic Interactive SVG */}
        <svg className="w-full h-full transform" viewBox="0 0 300 300">
          {/* Subtle Outer Dial ticks */}
          <circle cx="150" cy="150" r="145" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 6" opacity="0.8" />
          
          {/* Empty Space Filler representing Leisure/Istirahat */}
          <circle cx="150" cy="150" r="110" fill="none" stroke="#f1f5f9" strokeWidth="50" />

          {/* Render Schedule Segment Slices */}
          {segments.map((seg, idx) => {
            const isSelected = selectedItem?.id === seg.item.id;
            return (
              <path
                key={`${seg.item.id}-${idx}`}
                d={seg.path}
                fill={seg.color}
                opacity={isSelected ? 1.0 : seg.item.completed ? 0.65 : 0.85}
                className={`transition-all duration-300 cursor-pointer stroke-white stroke-1 hover:opacity-100 ${
                  isSelected ? "stroke-slate-900 stroke-[2.5px] scale-[1.02]" : "hover:scale-[1.01]"
                }`}
                style={{ transformOrigin: "150px 150px" }}
                onClick={() => onSelectItem(seg.item)}
              >
                <title>{`${seg.item.title} (${seg.item.startTime} - ${seg.item.endTime})`}</title>
              </path>
            );
          })}

          {/* Radial Hour Hour Indicator Labels */}
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
            const pct = hour / 24;
            const [tx, ty] = getCoordinatesForPercent(pct, 134);
            const [tickX, tickY] = getCoordinatesForPercent(pct, 142);
            const hourLabel = hour.toString().padStart(2, "0");
            return (
              <g key={hour}>
                <circle cx={tickX} cy={tickY} r="2" fill="#94a3b8" />
                <text
                  x={tx}
                  y={ty}
                  fill="#475569"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-black"
                >
                  {hourLabel}
                </text>
              </g>
            );
          })}

          {/* Active Time Sweep Indicator Hand */}
          <circle cx="150" cy="150" r="85" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          <line
            x1="150"
            y1="150"
            x2={activeHandCoords[0]}
            y2={activeHandCoords[1]}
            stroke="#f97316"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={activeHandCoords[0]} cy={activeHandCoords[1]} r="6" fill="#f97316" />

          {/* Inner core display with current digital time of cycle */}
          <circle cx="150" cy="150" r="72" fill="#ffffff" className="stroke-slate-200" strokeWidth="4" />
        </svg>

        {/* Overlay HTML in the center core of the donut */}
        <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">WAKTU SAAT INI</span>
          <span className="text-[#1E293B] font-mono text-2xl font-black tracking-tight">
            {activeTimeStr}
          </span>
          <span className="text-[10px] text-green-600 font-bold tracking-wider uppercase mt-0.5">TER-SINKRONISASI</span>
        </div>
      </div>

      {/* Guide Legend */}
      <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] w-full border-t border-slate-100 pt-4 font-bold">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f1f5f9] border border-slate-300 inline-block" />
          <span>Istirahat / Luang</span>
        </div>
        {Object.keys(CATEGORY_COLORS).map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-slate-700">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: CATEGORY_COLORS[key].fill }}
            />
            <span className="truncate">{CATEGORY_COLORS[key].label}</span>
          </div>
        ))}
      </div>

      {/* Interactive Helper Hint */}
      <div className="mt-4 flex items-center gap-1.5 bg-blue-50 text-blue-700 border-2 border-blue-100 p-2.5 rounded-2xl text-[10px] w-full justify-center font-bold">
        <Info className="w-4 h-4 text-blue-500 animate-bounce flex-shrink-0" />
        <span>Klik roda warna untuk melihat detail tugas!</span>
      </div>
    </div>
  );
}
