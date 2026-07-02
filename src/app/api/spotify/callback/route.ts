import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?spotify=error', req.url));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? 'http://localhost:3000/api/spotify/callback';

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/?spotify=error', req.url));
  }

  const response = NextResponse.redirect(new URL('/?spotify=connected', req.url));

  response.cookies.set('spotify_access_token', tokenData.access_token, {
    httpOnly: true,
    maxAge: (tokenData.expires_in as number) - 60,
    sameSite: 'lax',
    path: '/',
  });

  if (tokenData.refresh_token) {
    response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
