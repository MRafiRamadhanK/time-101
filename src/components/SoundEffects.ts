/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple synthesizer for game SFX using Web Audio API

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a cute retro "coin" collection sound
 */
export function playCoinSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    // Play dual tones for a retro coin jump
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.08); // A5
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (err) {
    console.warn("Audio Context blocked or unsupported:", err);
  }
}

/**
 * Play a cheerful level-up fanfare
 */
export function playLevelUpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.12;
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * duration);
      
      gain.gain.setValueAtTime(0.15, now + idx * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * duration + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * duration);
      osc.stop(now + (idx + 2) * duration);
    });
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Play a soft warning alarm tone (e.g. Wakeup, Sleep)
 */
export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play a repeating sweet woodwind-like pulse
    for (let i = 0; i < 3; i++) {
      const pulseTime = now + (i * 0.4);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, pulseTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, pulseTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.1, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(pulseTime);
      osc.stop(pulseTime + 0.3);
    }
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Native Text-to-Speech voiceover in Indonesian
 * Menggunakan VoiceRSS (Mendukung Laki-laki 'Budi' dan Perempuan 'Nanda')
 */
export function speakIndonesian(text: string, gender: 'lanang' | 'cewe' | string = 'cewe') {
  // Masukkan API Key VoiceRSS gratis Anda di sini (Daftar di voicerss.org)
  // Untuk sementara dikosongkan agar Anda tahu tempatnya
  // @ts-ignore
  const VOICE_RSS_API_KEY = import.meta.env.VITE_VOICERSS_API_KEY || ""; 
  
  if (gender === 'cewe') {
    // Google Translate TTS is natively high-quality Female for Indonesian
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audio.play().catch(e => {
        fallbackSpeakIndonesian(text, gender);
      });
      return;
    } catch (err) {
      fallbackSpeakIndonesian(text, gender);
      return;
    }
  }

  // Jika Laki-laki (lanang), gunakan VoiceRSS (Budi)
  if (VOICE_RSS_API_KEY && gender === 'lanang') {
    try {
      const url = `https://api.voicerss.org/?key=${VOICE_RSS_API_KEY}&hl=id-id&v=Budi&c=MP3&f=16khz_16bit_stereo&src=${encodeURIComponent(text)}`;
      
      const audio = new Audio(url);
      audio.play().catch(e => {
        console.warn("Gagal memutar VoiceRSS", e);
        fallbackSpeakIndonesian(text, gender);
      });
      return; // Berhenti di sini jika VoiceRSS jalan
    } catch (err) {
      console.warn("Error memanggil VoiceRSS", err);
    }
  }

  // Jika API Key belum ada, gunakan Web Speech API bawaan (Suara Robot Laptop)
  fallbackSpeakIndonesian(text, gender);
}

/**
 * Fallback jika tidak ada API Key (menggunakan suara bawaan laptop)
 */
function fallbackSpeakIndonesian(text: string, gender: string) {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID"; 
  utterance.rate = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  
  // Mencoba mencari suara spesifik Laki-laki (Ardi/Andika) atau Perempuan (Gadis/Google) di Windows/Chrome
  let selectedVoice = null;
  if (gender === 'lanang') {
    selectedVoice = voices.find(v => v.lang.includes("id") && (v.name.toLowerCase().includes('ardi') || v.name.toLowerCase().includes('andika') || v.name.toLowerCase().includes('male')));
    utterance.pitch = selectedVoice ? 1.0 : 0.5; // Jika tidak ketemu suara cowok asli, turunkan nada robotnya
  } else {
    selectedVoice = voices.find(v => v.lang.includes("id") && (v.name.toLowerCase().includes('gadis') || v.name.toLowerCase().includes('female')));
    utterance.pitch = selectedVoice ? 1.0 : 1.2;
  }

  // Jika tetap tidak ketemu, pakai suara bahasa indonesia apa saja yang ada
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes("id"));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}
