'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onTranscript, disabled }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef('');

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) { stop(); return; }

    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    accumulatedRef.current = '';

    rec.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) accumulatedRef.current += e.results[i][0].transcript + ' ';
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => rec.stop(), 2700);
    };

    rec.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      const text = accumulatedRef.current.trim();
      accumulatedRef.current = '';
      if (text) onTranscript(text);
    };

    rec.onerror = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
      accumulatedRef.current = '';
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening, onTranscript, stop]);

  if (!supported) return null;

  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-brody-coral opacity-40 pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-brody-coral opacity-20 pulse-ring" style={{ animationDelay: '0.4s' }} />
        </>
      )}
      <button
        onClick={toggle}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Speak to Brody'}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border font-quicksand text-base
          ${isListening
            ? 'bg-brody-coral border-brody-coral-hi text-white shadow-coral-glow'
            : 'bg-brody-surface border-brody-border text-brody-foam hover:border-brody-foam hover:shadow-foam-glow hover:bg-brody-card'
          } disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        {isListening ? '◼' : '🎙'}
      </button>
    </div>
  );
}
