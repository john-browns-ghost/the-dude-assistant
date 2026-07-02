'use client';

import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  rokuIp: string;
  onRokuIpChange: (ip: string) => void;
  spotifyConnected: boolean;
}

type VoiceStatus = { ok: boolean; masked_key?: string; working_model?: string; problem?: string; results?: Record<string, { status: number; body: string }> } | null;

export default function SettingsDrawer({ open, onClose, rokuIp, onRokuIpChange, spotifyConnected }: Props) {
  const [ipInput,      setIpInput]      = useState(rokuIp);
  const [voiceStatus,  setVoiceStatus]  = useState<VoiceStatus>(null);
  const [voiceTesting, setVoiceTesting] = useState(false);

  useEffect(() => { setIpInput(rokuIp); }, [rokuIp]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-80 h-full bg-dude-surface flex flex-col overflow-y-auto
        border-l border-dude-border shadow-2xl">

        {/* Rug border top */}
        <div className="h-1 w-full bg-rug flex-shrink-0" />

        <div className="flex flex-col gap-7 p-6 flex-1">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-3xl text-dude-gold tracking-wider neon-gold">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-dude-border text-dude-muted
                hover:text-dude-gold hover:border-dude-gold transition-colors flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>

          {/* Spotify */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-dude-border" />
              <span className="text-dude-muted text-[10px] uppercase tracking-[0.2em] font-playfair">Spotify</span>
              <div className="h-px flex-1 bg-dude-border" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                spotifyConnected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-dude-muted'
              }`} />
              <span className="text-dude-cream text-sm font-playfair">
                {spotifyConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <a
              href="/api/spotify/auth"
              className="block text-center py-2.5 px-4 rounded-xl font-playfair font-bold text-sm
                bg-[#1DB954] text-black hover:bg-[#1ed760] transition-all hover:shadow-[0_0_12px_rgba(29,185,84,0.4)]"
            >
              {spotifyConnected ? 'Reconnect Spotify' : 'Connect Spotify'}
            </a>

            <p className="text-dude-muted text-xs font-playfair italic">
              Tokens expire after ~1 hour. Reconnect if the tunes stop flowing, man.
            </p>
          </section>

          {/* ElevenLabs voice */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-dude-border" />
              <span className="text-dude-muted text-[10px] uppercase tracking-[0.2em] font-playfair">Voice (OpenAI)</span>
              <div className="h-px flex-1 bg-dude-border" />
            </div>

            <button
              disabled={voiceTesting}
              onClick={async () => {
                setVoiceTesting(true);
                setVoiceStatus(null);
                const res = await fetch('/api/tts/test').catch(() => null);
                const data = res ? await res.json().catch(() => null) : null;
                setVoiceStatus(data);
                setVoiceTesting(false);
              }}
              className="py-2 px-4 rounded-xl border border-dude-border text-dude-cream text-sm
                font-playfair hover:border-dude-gold hover:text-dude-gold transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {voiceTesting ? 'Testing…' : 'Test Voice Connection'}
            </button>

            {voiceStatus && (
              <div className={`rounded-xl border p-3 text-xs font-playfair leading-relaxed space-y-1
                ${voiceStatus.ok
                  ? 'border-green-700 bg-green-950/40 text-green-300'
                  : 'border-dude-red/60 bg-dude-red/10 text-red-300'
                }`}
              >
                {voiceStatus.ok ? (
                  <>
                    <p>✓ Working — model: <span className="text-dude-gold">{voiceStatus.working_model}</span></p>
                    <p className="text-dude-muted">Key: {voiceStatus.masked_key}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">✗ {voiceStatus.problem}</p>
                    {voiceStatus.masked_key && <p className="text-dude-muted">Key loaded: {voiceStatus.masked_key}</p>}
                    {voiceStatus.results && Object.entries(voiceStatus.results).map(([model, r]) => (
                      <p key={model} className="text-dude-muted">
                        {model}: HTTP {r.status} — {r.body.slice(0, 120)}
                      </p>
                    ))}
                    <p className="text-dude-muted italic mt-1">
                      If the key looks right, stop the server (Ctrl+C) and run npm start again.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Roku */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-dude-border" />
              <span className="text-dude-muted text-[10px] uppercase tracking-[0.2em] font-playfair">Roku TV</span>
              <div className="h-px flex-1 bg-dude-border" />
            </div>

            <p className="text-dude-muted text-xs font-playfair italic">
              Roku Settings → Network → About → IP Address
            </p>

            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g. 192.168.1.42"
              className="bg-dude-bg border border-dude-border rounded-xl px-3 py-2.5
                text-dude-cream text-sm font-playfair placeholder-dude-muted
                focus:outline-none focus:border-dude-gold focus:shadow-gold-glow transition-all"
            />

            <button
              onClick={() => { onRokuIpChange(ipInput); onClose(); }}
              className="py-2.5 px-4 rounded-xl bg-dude-gold text-dude-bg text-sm font-playfair font-bold
                hover:bg-dude-gold-hi transition-all hover:shadow-gold-glow"
            >
              Save IP
            </button>
          </section>

          {/* About */}
          <section className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-dude-border" />
              <span className="text-dude-muted text-[10px] uppercase tracking-[0.2em] font-playfair">About</span>
              <div className="h-px flex-1 bg-dude-border" />
            </div>
            <p className="text-dude-muted text-xs font-playfair italic leading-relaxed">
              The Dude abides. Keys live in{' '}
              <code className="text-dude-gold not-italic">.env.local</code> on your machine.
              Nothing leaves your home except calls to Claude, Spotify, and Brave Search.
            </p>
            <p className="text-dude-muted text-[10px] font-playfair italic text-center mt-2">
              "This aggression will not stand, man."
            </p>
          </section>

        </div>

        {/* Rug border bottom */}
        <div className="h-1 w-full bg-rug flex-shrink-0" />
      </div>
    </div>
  );
}
