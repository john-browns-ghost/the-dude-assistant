'use client';

import { useEffect, useRef } from 'react';

export type ListenMode = 'idle' | 'passive' | 'command';

// Every reasonable way someone might address Lebowski
const WAKE_PATTERNS = [
  // Dude variants
  /\bhey\s+dude\b/i,
  /\byo\s+dude\b/i,
  /\bok(?:ay)?\s+dude\b/i,
  /\bexcuse\s+me\s+dude\b/i,
  // Lebowski variants
  /\bhey\s+lebowski\b/i,
  /\byo\s+lebowski\b/i,
  /\bok(?:ay)?\s+lebowski\b/i,
  /\blebowski\b/i,
  // Duder
  /\bhey\s+duder\b/i,
  /\byo\s+duder\b/i,
  /\bduder\b/i,
  // His Dudeness / El Duderino
  /\bhis\s+dude(?:ness)?\b/i,
  /\bel\s+duderino\b/i,
  // Man
  /\bhey\s+man\b/i,
  /\bok(?:ay)?\s+man\b/i,
];

function detectWake(transcript: string): { detected: boolean; remainder: string } {
  for (const pattern of WAKE_PATTERNS) {
    const match = transcript.match(pattern);
    if (match && match.index !== undefined) {
      const remainder = transcript.slice(match.index + match[0].length).trim();
      return { detected: true, remainder };
    }
  }
  // Single-word wake: "Dude", "Duder", "Lebowski"
  if (/^\s*(?:dude|duder|lebowski|el\s+duderino|his\s+dude(?:ness)?)[.,!?]?\s*$/i.test(transcript)) {
    return { detected: true, remainder: '' };
  }
  return { detected: false, remainder: '' };
}

// Short two-tone beep to signal "I'm listening, man"
function playActivationTone() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 0.25;

    [440, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.1);
    });

    setTimeout(() => ctx.close(), 600);
  } catch {
    // AudioContext not available — silently skip
  }
}

interface Options {
  enabled: boolean;
  onCommand: (text: string) => void;
  onModeChange: (mode: ListenMode) => void;
}

export function usePassiveListener({ enabled, onCommand, onModeChange }: Options) {
  // Single mutable state object — avoids stale-closure issues across restarts
  const s = useRef({
    rec: null as SpeechRecognition | null,
    mode: 'idle' as ListenMode,
    enabled: false,
    restartTimer: null as ReturnType<typeof setTimeout> | null,
    cmdTimer: null as ReturnType<typeof setTimeout> | null,
    onCommand,
    onModeChange,
  }).current;

  // Keep callbacks current every render without restarting the effect
  s.onCommand = onCommand;
  s.onModeChange = onModeChange;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    // ── helpers ──────────────────────────────────────────────────────────────

    function setMode(m: ListenMode) {
      s.mode = m;
      s.onModeChange(m);
    }

    function clearTimers() {
      if (s.restartTimer) { clearTimeout(s.restartTimer); s.restartTimer = null; }
      if (s.cmdTimer)     { clearTimeout(s.cmdTimer);     s.cmdTimer     = null; }
    }

    function stopRec() {
      clearTimers();
      try { s.rec?.abort(); } catch { /* ignore */ }
      s.rec = null;
    }

    // ── command mode — capture the actual request after wake word ─────────────

    function startCommand() {
      stopRec();
      setMode('command');
      playActivationTone();

      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      s.rec = rec;

      let accumulated = '';

      rec.onresult = (e: SpeechRecognitionEvent) => {
        clearTimers();
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) accumulated += e.results[i][0].transcript + ' ';
        }
        // Stop after 2.7 s of silence (same as manual voice button)
        s.cmdTimer = setTimeout(() => rec.stop(), 2700);
      };

      rec.onend = () => {
        clearTimers();
        s.rec = null;
        const text = accumulated.trim();
        if (text) s.onCommand(text);
        if (s.enabled) {
          setMode('passive');
          s.restartTimer = setTimeout(startPassive, 300);
        } else {
          setMode('idle');
        }
      };

      rec.onerror = () => {
        clearTimers();
        s.rec = null;
        if (s.enabled) {
          setMode('passive');
          s.restartTimer = setTimeout(startPassive, 500);
        } else {
          setMode('idle');
        }
      };

      rec.start();

      // Hard timeout — give up after 10 s of nothing
      s.cmdTimer = setTimeout(() => rec.stop(), 10_000);
    }

    // ── passive mode — low-level, just hunting for the wake word ─────────────

    function startPassive() {
      if (!s.enabled || s.mode === 'command') return;
      stopRec();

      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = false;
      s.rec = rec;

      rec.onresult = (e: SpeechRecognitionEvent) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (!e.results[i].isFinal) continue;
          const transcript = e.results[i][0].transcript;
          const { detected, remainder } = detectWake(transcript);

          if (detected) {
            stopRec();
            if (remainder.length > 2) {
              // Wake word + command in one breath e.g. "Hey Dude what's the weather"
              playActivationTone();
              s.onCommand(remainder);
              setMode('passive');
              s.restartTimer = setTimeout(startPassive, 300);
            } else {
              startCommand();
            }
            return;
          }
        }
      };

      rec.onend = () => {
        s.rec = null;
        // Auto-restart — Chrome stops continuous recognition after ~60 s silence
        if (s.enabled && s.mode === 'passive') {
          s.restartTimer = setTimeout(startPassive, 150);
        }
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        s.rec = null;
        if (!s.enabled || s.mode !== 'passive') return;
        // 'no-speech' is normal — restart quickly; other errors need a beat
        const delay = e.error === 'no-speech' ? 150 : 800;
        s.restartTimer = setTimeout(startPassive, delay);
      };

      try {
        rec.start();
      } catch {
        // Already started or not allowed yet — back off and retry
        s.restartTimer = setTimeout(startPassive, 1000);
      }
    }

    // ── effect body ───────────────────────────────────────────────────────────

    s.enabled = enabled;

    if (enabled) {
      setMode('passive');
      startPassive();
    } else {
      stopRec();
      setMode('idle');
    }

    return () => {
      s.enabled = false;
      stopRec();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
