'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import VoiceButton from './VoiceButton';
import SettingsDrawer from './SettingsDrawer';
import { usePassiveListener, type ListenMode } from '@/hooks/usePassiveListener';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Reminder {
  message: string;
  minutes: number;
}

function buildGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 6)  return "Hey. It's late — or early, depending on how you look at it. Ocean's calmest before dawn. What's going on?";
  if (hour < 10) return "Morning, brother. Best light of the day out there. What do you need?";
  if (hour >= 21) return "Late night. Good time to think — the real thoughts surface when it's quiet. What's on your mind?";
  return "Hey. Good to see you. What can I help with — research, music, the TV, reminders, talking something through... whatever you need, man.";
}

const GREETING: Message = {
  role: 'assistant',
  content: buildGreeting(),
};

// ── Module-level audio + toast plumbing ──────────────────────────────────────
let currentAudio: HTMLAudioElement | null = null;
type ToastFn = (msg: string) => void;
let _showToast: ToastFn = () => {};
export function registerToast(fn: ToastFn) { _showToast = fn; }

async function speak(text: string) {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      _showToast(`Voice: ${body?.error ?? `HTTP ${res.status}`}`);
      throw new Error('tts-failed');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => { URL.revokeObjectURL(url); if (currentAudio === audio) currentAudio = null; };
    await audio.play();
  } catch {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88; u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  }
}

function scheduleReminder(reminder: Reminder) {
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("Brody's got a reminder for you, man", {
        body: reminder.message, icon: '/icon-192.png',
      });
    } else {
      alert(`Reminder, man: ${reminder.message}`);
    }
  }, reminder.minutes * 60 * 1000);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChatInterface() {
  const [messages,       setMessages]       = useState<Message[]>([GREETING]);
  const [input,          setInput]          = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [rokuIp,         setRokuIp]         = useState('');
  const [spotifyConn,    setSpotifyConn]    = useState(false);
  const [voiceOutput,    setVoiceOutput]    = useState(true);
  const [passiveEnabled, setPassiveEnabled] = useState(false);
  const [listenMode,     setListenMode]     = useState<ListenMode>('idle');
  const [toast,          setToast]          = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register toast
  useEffect(() => {
    registerToast((msg) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    });
  }, []);

  // Persist settings
  useEffect(() => {
    setRokuIp(localStorage.getItem('roku_ip') ?? '');
    setPassiveEnabled(localStorage.getItem('passive_enabled') === 'true');
  }, []);

  // Spotify check
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('spotify') === 'connected') { setSpotifyConn(true); window.history.replaceState({}, '', '/'); }
    else if (p.get('spotify') === 'error') { window.history.replaceState({}, '', '/'); }
    fetch('/api/spotify/status').then(r => r.json()).then(d => setSpotifyConn(d.connected)).catch(() => {});
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleRokuIpChange = useCallback((ip: string) => {
    setRokuIp(ip);
    localStorage.setItem('roku_ip', ip);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          rokuIp,
        }),
      });
      const data = await res.json();

      const reply = data.error ?? data.response ?? "Something went sideways, man.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (voiceOutput) speak(reply);
      if (data.reminders?.length) data.reminders.forEach((r: Reminder) => scheduleReminder(r));
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went sideways, man. Check your connection." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [messages, isLoading, rokuIp, voiceOutput]);

  usePassiveListener({ enabled: passiveEnabled, onCommand: sendMessage, onModeChange: setListenMode });

  const togglePassive = useCallback(() => {
    setPassiveEnabled(prev => { const n = !prev; localStorage.setItem('passive_enabled', String(n)); return n; });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isCommand = listenMode === 'command';

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full relative">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-brody-surface">
        <div className="wave-divider" />
        <div className="flex items-center justify-between px-5 py-3">

          {/* Title block */}
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none select-none drift">🌊</span>
            <div>
              <h1 className="font-pacifico text-3xl leading-tight title-shimmer pb-1">
                Brody
              </h1>
              <p className="font-quicksand text-[10px] text-brody-muted tracking-[0.25em] uppercase">
                Personal Assistant · rides the wave
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">

            {/* Wake word toggle */}
            <button
              onClick={togglePassive}
              title={passiveEnabled ? 'Disable wake word' : 'Enable wake word ("Hey Brody", "Brody", etc.)'}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center border
                transition-all duration-300 text-sm
                ${passiveEnabled
                  ? isCommand
                    ? 'border-brody-coral text-brody-coral bg-brody-surface shadow-coral-glow'
                    : 'border-brody-foam text-brody-foam bg-brody-card shadow-foam-glow'
                  : 'border-brody-border text-brody-muted bg-brody-surface hover:border-brody-border hover:text-brody-foam'
                }`}
            >
              {passiveEnabled && (
                <span className={`absolute inset-0 rounded-full pulse-ring ${isCommand ? 'bg-brody-coral' : 'bg-brody-foam'} opacity-20`} />
              )}
              👂
            </button>

            {/* Voice output */}
            <button
              onClick={() => setVoiceOutput(v => !v)}
              title={voiceOutput ? 'Mute voice' : 'Enable voice'}
              className={`w-9 h-9 rounded-full flex items-center justify-center border
                transition-all duration-300 text-sm
                ${voiceOutput
                  ? 'border-brody-foam text-brody-foam bg-brody-card shadow-foam-glow'
                  : 'border-brody-border text-brody-muted bg-brody-surface hover:text-brody-foam'
                }`}
            >
              {voiceOutput ? '🔊' : '🔇'}
            </button>

            {/* Spotify dot */}
            <div
              title={spotifyConn ? 'Spotify connected' : 'Spotify not connected'}
              className={`w-2 h-2 rounded-full transition-all ${
                spotifyConn
                  ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                  : 'bg-brody-muted'
              }`}
            />

            {/* Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-brody-border
                text-brody-muted hover:text-brody-foam hover:border-brody-foam hover:shadow-foam-glow
                transition-all duration-300 text-base"
            >
              ⚙
            </button>
          </div>
        </div>

        {/* Passive status strip */}
        {passiveEnabled && (
          <div className={`px-5 py-1 flex items-center gap-2 border-t text-[11px] font-quicksand
            transition-colors duration-300
            ${isCommand
              ? 'border-brody-coral/40 bg-brody-coral/10 text-brody-coral-hi'
              : 'border-brody-border bg-brody-bg/40 text-brody-muted'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 pulse-ring ${isCommand ? 'bg-brody-coral' : 'bg-brody-foam'}`} />
            {isCommand ? 'Go ahead, man…' : 'Listening for "Brody", "Hey Brody", "Hey man"…'}
          </div>
        )}
      </header>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5 bg-lagoon relative">
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}

        {/* Typing indicator */}
        {isLoading && (
          <div className="fade-up flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0
              bg-brody-palm border border-brody-border">
              🌊
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-brody-muted text-[10px] uppercase tracking-widest font-quicksand px-1">Brody</span>
              <div className="bg-brody-assistant border border-brody-border rounded-smooth rounded-tl-md
                px-5 py-3.5 flex items-center gap-2">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brody-foam inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brody-foam inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-brody-foam inline-block" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-brody-surface px-4 py-3">
        <div className="wave-divider mb-3" />
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={passiveEnabled ? 'Say "Brody" or type here…' : 'Talk to Brody, man…'}
            rows={1}
            className="flex-1 resize-none bg-brody-bg border border-brody-border rounded-smooth
              px-4 py-2.5 text-sm text-brody-sand font-quicksand
              placeholder-brody-muted focus:outline-none focus:border-brody-foam
              focus:shadow-foam-glow transition-all disabled:opacity-40"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <VoiceButton onTranscript={t => sendMessage(t)} disabled={isLoading} />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              bg-brody-foam text-brody-bg text-lg font-bold
              hover:bg-brody-foam-hi hover:shadow-foam-glow
              disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-300"
          >
            ↑
          </button>
        </div>
        <p className="text-center text-brody-muted text-[10px] font-quicksand mt-2 opacity-40">
          Enter to send · Shift+Enter for new line · 🎙 to speak
        </p>
      </div>

      {/* ── Settings drawer ──────────────────────────────────────────────────── */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        rokuIp={rokuIp}
        onRokuIpChange={handleRokuIpChange}
        spotifyConnected={spotifyConn}
      />

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-brody-coral/20 border border-brody-coral/60 text-brody-coral-hi text-xs font-quicksand
            rounded-smooth px-4 py-2.5 flex items-center justify-between gap-3 shadow-coral-glow">
            <span>⚠ {toast}</span>
            <button onClick={() => setToast(null)} className="text-brody-coral hover:text-brody-coral-hi flex-shrink-0">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
