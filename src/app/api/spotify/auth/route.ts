import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Spotify not configured, man.' }, { status: 500 });
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? 'http://localhost:3000/api/spotify/callback';

  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
