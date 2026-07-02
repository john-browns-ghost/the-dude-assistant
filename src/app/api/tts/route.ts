import { NextRequest, NextResponse } from 'next/server';

// Strips markdown so TTS doesn't read "asterisk asterisk" etc.
function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`[^`]*`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  const rawKey = process.env.OPENAI_API_KEY;
  if (!rawKey) {
    console.error('[TTS] OPENAI_API_KEY not set — restart the server after editing .env.local');
    return NextResponse.json({ error: 'OpenAI TTS not configured' }, { status: 500 });
  }
  const apiKey = rawKey.trim();

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  const cleaned = cleanForSpeech(text);

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'onyx',   // deep, smooth male voice
      input: cleaned,
      speed: 0.9,      // slightly laid-back
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[TTS] OpenAI error (${res.status}):`, err);
    if (res.status === 401) {
      return NextResponse.json({ error: 'OpenAI API key is invalid or expired' }, { status: 401 });
    }
    return NextResponse.json({ error: `OpenAI TTS failed (${res.status})` }, { status: 502 });
  }

  const audio = await res.arrayBuffer();
  return new Response(audio, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  });
}
