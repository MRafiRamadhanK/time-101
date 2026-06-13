/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScheduleItem {
  id: string;
  title: string;
  category: 'sekolah' | 'ibadah' | 'tidur' | 'bangun' | 'belajar' | 'bermain' | 'parent_increment';
  description: string;
  startTime: string; // "HH:MM" e.g. "05:30"
  endTime: string;   // "HH:MM" e.g. "07:30"
  day: 'Hari ini' | 'Senin - Jumat' | 'Setiap Hari';
  completed: boolean;
  reward: number; // EXP reward
  locked: boolean; // System-locked (cannot edit without parent consent)
  parentQuest: boolean; // Custom added by parent
  timeClaimed?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt?: string;
}

export interface ChildState {
  level: number;
  exp: number;
  maxExp: number;
  streak: number;
  streakClaimedToday: boolean;
  avatarMood: 'semangat' | 'netral' | 'lelah';
  avatarAction: 'idle' | 'writing' | 'sleeping' | 'eating' | 'praying';
  badges: string[]; // Badge IDs
  completedCount: number;
  gender?: string;
  unique_code?: string;
  device_id?: string;
}

export interface InteractiveQuote {
  text: string;
  author: string;
  audioVoiceoverText?: string;
}

export interface WebNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alarm' | 'quote';
  reward?: number;
  actionLabel?: string;
  onAction?: () => void;
}
