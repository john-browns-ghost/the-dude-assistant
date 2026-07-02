import { NextResponse } from 'next/server';

export async function GET() {
  const rawKey = process.env.OPENAI_API_KEY ?? '';

  if (!rawKey) {
    return NextResponse.json({
      ok: false,
      problem: 'OPENAI_API_KEY is not set in .env.local — or the server was not restarted after adding it.',
      key_loaded: false,
    });
  }

  const apiKey = rawKey.trim();
  const keyHadWhitespace = apiKey !== rawKey;
  const maskedKey = `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: 'The Dude abides.',
        speed: 0.9,
      }),
    });

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        key_loaded: true,
        key_had_whitespace: keyHadWhitespace,
        masked_key: maskedKey,
        voice: 'onyx',
        model: 'tts-1',
      });
    }

    const body = await res.text();
    return NextResponse.json({
      ok: false,
      key_loaded: true,
      key_had_whitespace: keyHadWhitespace,
      masked_key: maskedKey,
      problem: `OpenAI returned ${res.status}`,
      raw_response: body.slice(0, 300),
      hint: res.status === 401
        ? 'Key is wrong or expired — grab a fresh one from platform.openai.com'
        : 'Check raw_response for details. Restart server after any .env.local changes.',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, problem: String(e) });
  }
}
