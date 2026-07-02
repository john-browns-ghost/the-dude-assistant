import type Anthropic from '@anthropic-ai/sdk';

export const tools: Anthropic.Tool[] = [
  {
    name: 'search_web',
    description: 'Search the web for current information, news, weather, facts, or anything the user wants to look up.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'control_spotify',
    description: 'Control Spotify music playback. Play, pause, skip tracks, go to previous, search for and play music, or get currently playing info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'skip_next', 'skip_previous', 'search_and_play', 'get_current'],
          description: 'The Spotify action to perform',
        },
        query: {
          type: 'string',
          description: 'For search_and_play: the artist, song, album, or playlist to find and play',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'control_roku',
    description: 'Control the Roku TV. Press remote buttons, launch apps, or toggle power.',
    input_schema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['keypress', 'launch_app', 'list_apps', 'power_toggle'],
          description: 'The Roku action to perform',
        },
        key: {
          type: 'string',
          description: 'For keypress: Home, Back, Select, Up, Down, Left, Right, Play, Rev, Fwd, VolumeUp, VolumeDown, VolumeMute',
        },
        app_name: {
          type: 'string',
          description: 'For launch_app: the name of the app (e.g. Netflix, Hulu, Spotify, YouTube, Disney+)',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'set_reminder',
    description: 'Set a browser notification reminder for the user at a future time.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: { type: 'string', description: 'The reminder message to show the user' },
        minutes_from_now: { type: 'number', description: 'How many minutes from now to trigger the reminder' },
      },
      required: ['message', 'minutes_from_now'],
    },
  },
];
