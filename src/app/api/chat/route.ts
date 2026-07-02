import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '@/lib/system-prompt';
import { tools } from '@/lib/tools';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return 'Web search is not configured, man — no Brave Search API key set.';
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      { headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' } }
    );
    const data = await res.json();
    if (!data.web?.results?.length) return 'No results found, man.';
    return (data.web.results as Array<{ title: string; description: string; url: string }>)
      .slice(0, 5)
      .map((r) => `${r.title}\n${r.description}\n${r.url}`)
      .join('\n\n');
  } catch {
    return 'Search ran into some trouble, man.';
  }
}

async function controlSpotify(action: string, query?: string, token?: string): Promise<string> {
  if (!token) return 'Spotify is not connected, man. Hit the Connect Spotify button first.';

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Helper: parse Spotify error body
  async function spotifyError(r: Response): Promise<string> {
    try {
      const body = await r.json();
      const msg: string = body?.error?.message ?? '';
      if (r.status === 401) return 'Spotify token expired — reconnect Spotify in settings, man.';
      if (r.status === 403) return 'Spotify Premium is required for playback control, man.';
      if (r.status === 404 || msg.toLowerCase().includes('no active device')) {
        return 'NO_ACTIVE_DEVICE';
      }
      return `Spotify error (${r.status})${msg ? ': ' + msg : ''}, man.`;
    } catch {
      return `Spotify returned status ${r.status}, man.`;
    }
  }

  // Helper: find an available device and transfer playback to it.
  // Returns the device id on success, null if no devices found.
  async function ensureActiveDevice(): Promise<string | null> {
    const r = await fetch('https://api.spotify.com/v1/me/player/devices', { headers });
    if (!r.ok) return null;
    const data = await r.json();
    const devices: Array<{ id: string; name: string; is_active: boolean }> = data.devices ?? [];
    if (!devices.length) return null;

    // Prefer already-active device, otherwise take the first available
    const active = devices.find((d) => d.is_active) ?? devices[0];

    // Transfer playback (don't auto-play yet — let the caller decide)
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ device_ids: [active.id], play: false }),
    });

    return active.id;
  }

  // Helper: play with automatic device recovery on NO_ACTIVE_DEVICE
  async function playWithRetry(body: string): Promise<string> {
    const r = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers,
      body,
    });
    if (r.ok || r.status === 204) return 'ok';

    const err = await spotifyError(r);
    if (err !== 'NO_ACTIVE_DEVICE') return err;

    // Try to wake up a device and retry once
    const deviceId = await ensureActiveDevice();
    if (!deviceId) return "Couldn't find any Spotify devices, man. Open Spotify on your laptop or phone first.";

    // Small pause for transfer to settle
    await new Promise((res) => setTimeout(res, 800));

    const r2 = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers,
      body,
    });
    if (r2.ok || r2.status === 204) return 'ok';
    return await spotifyError(r2);
  }

  try {
    switch (action) {
      case 'play': {
        const result = await playWithRetry('');
        if (result !== 'ok') return result;
        return 'Music is playing, man.';
      }
      case 'pause': {
        const r = await fetch('https://api.spotify.com/v1/me/player/pause', { method: 'PUT', headers });
        if (!r.ok && r.status !== 204) return await spotifyError(r);
        return 'Paused the tunes, man.';
      }
      case 'skip_next': {
        const r = await fetch('https://api.spotify.com/v1/me/player/next', { method: 'POST', headers });
        if (!r.ok && r.status !== 204) return await spotifyError(r);
        return 'Skipped to the next track, man.';
      }
      case 'skip_previous': {
        const r = await fetch('https://api.spotify.com/v1/me/player/previous', { method: 'POST', headers });
        if (!r.ok && r.status !== 204) return await spotifyError(r);
        return 'Went back a track, man.';
      }
      case 'get_current': {
        const r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers });
        if (r.status === 204) return 'Nothing is playing right now, man.';
        if (!r.ok) return await spotifyError(r);
        const data = await r.json();
        const track = data.item?.name ?? 'Unknown';
        const artist = data.item?.artists?.[0]?.name ?? 'Unknown';
        const isPlaying = data.is_playing ? 'playing' : 'paused';
        return `Currently ${isPlaying}: "${track}" by ${artist}`;
      }
      case 'search_and_play': {
        if (!query) return 'Need something to search for, man.';
        if (/\beagles?\b/i.test(query)) {
          return "I hate the f***in' Eagles, man. I'm not putting that on. How about some Creedence?";
        }
        const sr = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist,artist&limit=3`,
          { headers }
        );
        if (!sr.ok) return await spotifyError(sr);
        const sd = await sr.json();
        const track = sd.tracks?.items?.[0];
        const playlist = sd.playlists?.items?.[0];
        const artist = sd.artists?.items?.[0];

        let uri: string | null = null;
        let description = '';
        let bodyJson: string;

        if (track) {
          uri = track.uri;
          description = `"${track.name}" by ${track.artists[0].name}`;
          bodyJson = JSON.stringify({ uris: [uri] });
        } else if (playlist) {
          uri = playlist.uri;
          description = `the playlist "${playlist.name}"`;
          bodyJson = JSON.stringify({ context_uri: uri });
        } else if (artist) {
          uri = artist.uri;
          description = artist.name;
          bodyJson = JSON.stringify({ context_uri: uri });
        } else {
          return `Couldn't find "${query}" on Spotify, man.`;
        }

        const result = await playWithRetry(bodyJson);
        if (result !== 'ok') return result;
        return `Playing ${description}, man.`;
      }
      default:
        return 'Unknown Spotify action, man.';
    }
  } catch {
    return "Had some trouble with Spotify, man. Make sure it's open on a device.";
  }
}

const ROKU_APPS: Record<string, string> = {
  netflix: '12',
  hulu: '2285',
  'disney+': '291097',
  'disney plus': '291097',
  max: '61322',
  'hbo max': '61322',
  'prime video': '13',
  amazon: '13',
  youtube: '195316',
  spotify: '22297',
  peacock: '593099',
  'apple tv': '551012',
  'apple tv+': '551012',
  'paramount+': '31440',
  'paramount plus': '31440',
  tubi: '41468',
  'pluto tv': '74519',
  philo: '74519',
};

async function controlRoku(action: string, key?: string, appName?: string, rokuIp?: string): Promise<string> {
  if (!rokuIp) return 'Roku IP not set, man. Add it in settings (the gear icon).';
  const base = `http://${rokuIp}:8060`;

  try {
    switch (action) {
      case 'keypress': {
        if (!key) return 'Need a key to press, man.';
        await fetch(`${base}/keypress/${key}`, { method: 'POST' });
        return `Pressed ${key} on the Roku, man.`;
      }
      case 'power_toggle': {
        await fetch(`${base}/keypress/Power`, { method: 'POST' });
        return 'Toggled the TV power, man.';
      }
      case 'list_apps': {
        const r = await fetch(`${base}/query/apps`);
        const xml = await r.text();
        const matches = Array.from(xml.matchAll(/<app id="\d+"[^>]*>([^<]+)<\/app>/g));
        const apps = matches.map((m) => m[1]).join(', ');
        return apps ? `Apps on your Roku: ${apps}` : 'Could not read apps, man.';
      }
      case 'launch_app': {
        if (!appName) return 'Need an app name, man.';
        const lower = appName.toLowerCase();
        let appId = ROKU_APPS[lower];

        if (!appId) {
          const r = await fetch(`${base}/query/apps`);
          const xml = await r.text();
          const matches = Array.from(xml.matchAll(/<app id="(\d+)"[^>]*>([^<]+)<\/app>/g));
          const found = matches.find((m) => m[2].toLowerCase().includes(lower));
          if (found) appId = found[1];
        }

        if (!appId) return `Couldn't find "${appName}" on the Roku, man. Try asking me to list apps.`;
        await fetch(`${base}/launch/${appId}`, { method: 'POST' });
        return `Launched ${appName} on the Roku, man.`;
      }
      default:
        return 'Unknown Roku action, man.';
    }
  } catch {
    return "Had trouble reaching the Roku, man. Make sure it's on the same WiFi and the IP is right in settings.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, rokuIp } = await req.json();
    const spotifyToken = req.cookies.get('spotify_access_token')?.value;

    const system = getSystemPrompt();
    let currentMessages: Anthropic.MessageParam[] = messages;
    let finalText = '';
    const reminders: Array<{ message: string; minutes: number }> = [];

    for (let i = 0; i < 6; i++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system,
        tools,
        messages: currentMessages,
      });

      if (response.stop_reason === 'end_turn') {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('');
        break;
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type !== 'tool_use') continue;
          const inp = block.input as Record<string, string | number | undefined>;
          let result = '';

          switch (block.name) {
            case 'search_web':
              result = await searchWeb(inp.query as string);
              break;
            case 'control_spotify':
              result = await controlSpotify(inp.action as string, inp.query as string | undefined, spotifyToken);
              break;
            case 'control_roku':
              result = await controlRoku(inp.action as string, inp.key as string | undefined, inp.app_name as string | undefined, rokuIp);
              break;
            case 'set_reminder':
              reminders.push({ message: inp.message as string, minutes: inp.minutes_from_now as number });
              result = `Reminder set: "${inp.message}" in ${inp.minutes_from_now} minutes.`;
              break;
            default:
              result = 'Unknown tool, man.';
          }

          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }

        currentMessages = [
          ...currentMessages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ];
      } else {
        finalText = "The Dude ran into some trouble, man. Try again.";
        break;
      }
    }

    return NextResponse.json({ response: finalText, reminders });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Something went wrong, man.' }, { status: 500 });
  }
}
