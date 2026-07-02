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
      <div className="relative w-80 h-full bg-brody-surface flex flex-col overflow-y-auto
        border-l border-brody-border shadow-soft">

        <div className="wave-divider flex-shrink-0 mx-4 mt-3" />

        <div className="flex flex-col gap-7 p-6 flex-1">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-pacifico text-2xl text-brody-foam glow-foam">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-brody-border text-brody-muted
                hover:text-brody-foam hover:border-brody-foam transition-colors flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>

          {/* Spotify */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-brody-border" />
              <span className="text-brody-muted text-[10px] uppercase tracking-[0.2em] font-quicksand">Spotify</span>
              <div className="h-px flex-1 bg-brody-border" />
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                spotifyConnected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-brody-muted'
              }`} />
              <span className="text-brody-sand text-sm font-quicksand">
                {spotifyConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>

            <a
              href="/api/spotify/auth"
              className="block text-center py-2.5 px-4 rounded-smooth font-quicksand font-bold text-sm
                bg-[#1DB954] text-black hover:bg-[#1ed760] transition-all hover:shadow-[0_0_12px_rgba(29,185,84,0.4)]"
            >
              {spotifyConnected ? 'Reconnect Spotify' : 'Connect Spotify'}
            </a>

            <p className="text-brody-muted text-xs font-quicksand">
              Tokens expire after ~1 hour. Reconnect if the tunes stop flowing, man.
            </p>
          </section>

          {/* Voice */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-brody-border" />
              <span className="text-brody-muted text-[10px] uppercase tracking-[0.2em] font-quicksand">Voice (OpenAI)</span>
              <div className="h-px flex-1 bg-brody-border" />
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
              className="py-2 px-4 rounded-smooth border border-brody-border text-brody-sand text-sm
                font-quicksand hover:border-brody-foam hover:text-brody-foam transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {voiceTesting ? 'Testing…' : 'Test Voice Connection'}
            </button>

            {voiceStatus && (
              <div className={`rounded-smooth border p-3 text-xs font-quicksand leading-relaxed space-y-1
                ${voiceStatus.ok
                  ? 'border-green-700 bg-green-950/40 text-green-300'
                  : 'border-brody-coral/60 bg-brody-coral/10 text-brody-coral-hi'
                }`}
              >
                {voiceStatus.ok ? (
                  <>
                    <p>✓ Working — model: <span className="text-brody-foam">{voiceStatus.working_model}</span></p>
                    <p className="text-brody-muted">Key: {voiceStatus.masked_key}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">✗ {voiceStatus.problem}</p>
                    {voiceStatus.masked_key && <p className="text-brody-muted">Key loaded: {voiceStatus.masked_key}</p>}
                    {voiceStatus.results && Object.entries(voiceStatus.results).map(([model, r]) => (
                      <p key={model} className="text-brody-muted">
                        {model}: HTTP {r.status} — {r.body.slice(0, 120)}
                      </p>
                    ))}
                    <p className="text-brody-muted italic mt-1">
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
              <div className="h-px flex-1 bg-brody-border" />
              <span className="text-brody-muted text-[10px] uppercase tracking-[0.2em] font-quicksand">Roku TV</span>
              <div className="h-px flex-1 bg-brody-border" />
            </div>

            <p className="text-brody-muted text-xs font-quicksand">
              Roku Settings → Network → About → IP Address
            </p>

            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="e.g. 192.168.1.42"
              className="bg-brody-bg border border-brody-border rounded-smooth px-3 py-2.5
                text-brody-sand text-sm font-quicksand placeholder-brody-muted
                focus:outline-none focus:border-brody-foam focus:shadow-foam-glow transition-all"
            />

            <button
              onClick={() => { onRokuIpChange(ipInput); onClose(); }}
              className="py-2.5 px-4 rounded-smooth bg-brody-foam text-brody-bg text-sm font-quicksand font-bold
                hover:bg-brody-foam-hi transition-all hover:shadow-foam-glow"
            >
              Save IP
            </button>
          </section>

          {/* About */}
          <section className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-brody-border" />
              <span className="text-brody-muted text-[10px] uppercase tracking-[0.2em] font-quicksand">About</span>
              <div className="h-px flex-1 bg-brody-border" />
            </div>
            <p className="text-brody-muted text-xs font-quicksand leading-relaxed">
              Brody rides the wave. Keys live in{' '}
              <code className="text-brody-foam">.env.local</code> on the server.
              Nothing leaves home except calls to Claude, Spotify, and Brave Search.
            </p>
            <p className="text-brody-muted text-[10px] font-quicksand italic text-center mt-2">
              "Fear causes hesitation, and hesitation causes your worst fears to come true."
            </p>
          </section>

        </div>

        <div className="wave-divider flex-shrink-0 mx-4 mb-3" />
      </div>
    </div>
  );
}
