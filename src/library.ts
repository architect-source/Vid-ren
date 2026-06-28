import { VoidProject } from './types';

export interface LibraryMusic {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: number;
  tags: string[];
}

export interface LibraryEffect {
  id: string;
  name: string;
  type: 'filter' | 'overlay' | 'transition';
  previewUrl?: string;
  config: any;
}

export interface LibraryTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  project: Partial<VoidProject>;
}

export const VOID_MUSIC: LibraryMusic[] = [
  {
    id: 'm1',
    name: 'Dreki og Úlfur',
    artist: 'Void Sentry',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 180,
    tags: ['Brutal', 'Aggressive', 'Void Metal']
  },
  {
    id: 'm2',
    name: 'The Blacklight Act',
    artist: 'Neural Reaper',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 210,
    tags: ['Industrial', 'Neon', 'Electronic']
  },
  {
    id: 'm3',
    name: 'Cold Iron System',
    artist: 'Frost Giant',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 240,
    tags: ['Mechanical', 'Cold', 'System Purge']
  },
  {
    id: 'm4',
    name: 'Pavement Prophecy',
    artist: 'Scrap King',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 150,
    tags: ['Thrash', 'Raw', 'Street']
  }
];

export const VOID_EFFECTS: LibraryEffect[] = [
  {
    id: 'e1',
    name: 'Blood Glitch',
    type: 'filter',
    config: { filter: 'glitch-red', intensity: 0.8 }
  },
  {
    id: 'e2',
    name: 'Void Haze',
    type: 'filter',
    config: { filter: 'fog-dark', intensity: 0.5 }
  },
  {
    id: 'e3',
    name: 'Static Scream',
    type: 'overlay',
    config: { overlay: 'static-noise', opacity: 0.3 }
  },
  {
    id: 'e4',
    name: 'Hellfire Pulse',
    type: 'filter',
    config: { filter: 'heat-wave', speed: 2.0 }
  }
];

export const VOID_TEMPLATES: LibraryTemplate[] = [
  {
    id: 't1',
    name: 'Gargoyle Sentry',
    description: 'The home of Void Metal. Brutal, gothic, and unyielding.',
    thumbnail: 'https://picsum.photos/seed/gargoyle/400/225',
    project: {
      project_name: 'Gargoyle Sentry Template',
      tracks: [
        { id: 'v1', type: 'video', clips: [] },
        { id: 'a1', type: 'audio', clips: [] },
        { id: 't1', type: 'text', clips: [{ id: 'tc1', text: 'GARGOYLE SENTRY', start: 0, end: 5 }] }
      ]
    }
  },
  {
    id: 't2',
    name: 'Total Annihilation',
    description: 'System purge successful. Welcome to the cold iron.',
    thumbnail: 'https://picsum.photos/seed/annihilation/400/225',
    project: {
      project_name: 'Total Annihilation Template',
      tracks: [
        { id: 'v1', type: 'video', clips: [] },
        { id: 'a1', type: 'audio', clips: [] },
        { id: 't1', type: 'text', clips: [{ id: 'tc1', text: 'SYSTEM PURGE', start: 0, end: 2 }] }
      ]
    }
  },
  {
    id: 't3',
    name: 'Held in Mercy',
    description: 'A divine clash of light and shadow. Ethereal yet heavy.',
    thumbnail: 'https://picsum.photos/seed/mercy/400/225',
    project: {
      project_name: 'Held in Mercy Template',
      tracks: [
        { id: 'v1', type: 'video', clips: [] },
        { id: 'a1', type: 'audio', clips: [] },
        { id: 't1', type: 'text', clips: [{ id: 'tc1', text: 'HELD IN MERCY', start: 0, end: 4 }] }
      ]
    }
  },
  {
    id: 't4',
    name: 'Void Alignment',
    description: 'The void has spoken. Align your soul with the machine.',
    thumbnail: 'https://picsum.photos/seed/void-align/400/225',
    project: {
      project_name: 'Void Alignment Template',
      tracks: [
        { id: 'v1', type: 'video', clips: [] },
        { id: 'a1', type: 'audio', clips: [] },
        { id: 't1', type: 'text', clips: [{ id: 'tc1', text: 'VOID ALIGNMENT', start: 0, end: 3 }] }
      ]
    }
  },
  {
    id: 't5',
    name: "The Gentleman’s Creed",
    description: "Voice Core: Johnny Cash Variant. A brutal yet sophisticated descent into the void.",
    thumbnail: 'https://picsum.photos/seed/gentleman/400/225',
    project: {
      project_name: "The Gentleman’s Creed",
      tracks: [
        { id: 'v1', type: 'video', clips: [] },
        { id: 'a1', type: 'audio', clips: [] },
        { 
          id: 't1', 
          type: 'text', 
          clips: [
            { id: 'tc1', text: 'INTRO: FOR THE BLOOD. FOR THE BOND.', start: 0, end: 45 },
            { id: 'tc2', text: 'VERSE 1: The truth ain’t a hammer...', start: 45, end: 90 },
            { id: 'tc3', text: 'CHORUS: I am the iron in the velvet...', start: 90, end: 135 },
            { id: 'tc4', text: 'VERSE 2: A gentleman’s not measured...', start: 135, end: 180 },
            { id: 'tc5', text: 'BRIDGE: BRING THE RUIN. BRING THE RAIN.', start: 180, end: 225 },
            { id: 'tc6', text: 'FINAL CHORUS: I AM THE IRON!', start: 225, end: 270 },
            { id: 'tc7', text: 'OUTRO: Sleep now... I’ve got the perimeter.', start: 270, end: 300 }
          ] 
        }
      ]
    }
  }
];
