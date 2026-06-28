/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  Skull, 
  Zap, 
  Ghost, 
  Hammer, 
  Download, 
  Trash2, 
  RefreshCw,
  Video as VideoIcon,
  Music as MusicIcon,
  Type as TypeIcon,
  Play,
  Pause,
  Layers,
  Settings,
  Shield,
  Image as ImageIcon,
  Check,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileVideo,
  Volume2
} from "lucide-react";
import { cn } from './lib/utils';
import { MetalStyle } from './types';
import io from 'socket.io-client';
import PhilatelicAudit from './components/PhilatelicAudit';
import SentryTelemetry from './components/SentryTelemetry';


// Preset lists for easy testing and outstanding creative velocity
const PRESET_PHOTOS = [
  { id: 'p1', name: 'Sovereign Gargoyle', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
  { id: 'p2', name: 'Abyssal Throne', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800' },
  { id: 'p3', name: 'Cybernetic Monolith', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800' },
  { id: 'p4', name: 'Black Sun Eclipse', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800' }
];

const PRESET_MUSIC = [
  { id: 'm1', name: 'Dreki og Úlfur', artist: 'Void Sentry', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', tags: ['Industrial', 'Blastbeats'] },
  { id: 'm2', name: 'The Blacklight Act', artist: 'Neural Reaper', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', tags: ['Aggressive', 'Synthwave'] },
  { id: 'm3', name: 'Cold Iron System', artist: 'Frost Giant', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', tags: ['Heavy Metal', 'Doom'] },
  { id: 'm4', name: 'Pavement Prophecy', artist: 'Scrap King', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', tags: ['Thrash', 'Raw'] }
];

const PRESET_VIDEOS = [
  { id: 'v1', name: 'Gothic Particle Void', url: 'https://assets.mixkit.co/videos/preview/mixkit-dust-particles-swirling-in-the-dark-31950-large.mp4' },
  { id: 'v2', name: 'Cyber Neon Grid', url: 'https://assets.mixkit.co/videos/preview/mixkit-glowing-lines-of-a-futuristic-grid-42289-large.mp4' },
  { id: 'v3', name: 'Hellfire Smoke Loop', url: 'https://assets.mixkit.co/videos/preview/mixkit-red-smoke-on-a-black-background-41619-large.mp4' }
];

const STYLE_CONFIGS: Record<MetalStyle, { label: string; description: string; colors: string; textStyle: string }> = {
  'SENTRY': { 
    label: 'Sovereign Sentry', 
    description: 'Ultra high-contrast aggressive filters with deep crimson tones.', 
    colors: 'border-red-900 bg-red-950/20 text-red-500 hover:border-red-500',
    textStyle: 'text-red-500 font-black uppercase text-5xl tracking-tighter'
  },
  'THRASH': { 
    label: 'Thrash Metal', 
    description: 'Harsh oversaturated noise grain with rhythmic zooming pulses.', 
    colors: 'border-orange-900 bg-orange-950/20 text-orange-500 hover:border-orange-500',
    textStyle: 'text-orange-500 font-black uppercase italic text-5xl tracking-tight'
  },
  'DEATH': { 
    label: 'Death Metal', 
    description: 'Morbid high contrast dark rust shadows with cyber-cyan flares.', 
    colors: 'border-cyan-900 bg-cyan-950/20 text-cyan-400 hover:border-cyan-400',
    textStyle: 'text-cyan-400 font-black uppercase text-4xl tracking-widest'
  },
  'INDUSTRIAL': { 
    label: 'Industrial', 
    description: 'Glow pulses, glitch bursts, and heavy mechanical overlays.', 
    colors: 'border-blue-900 bg-blue-950/20 text-blue-400 hover:border-blue-400',
    textStyle: 'text-blue-400 font-mono font-bold text-4xl tracking-tight'
  },
  'DOOM': { 
    label: 'Doom Metal', 
    description: 'Slow motion frame vignette, dark vintage curves, and heavy drone atmosphere.', 
    colors: 'border-amber-900 bg-amber-950/20 text-amber-600 hover:border-amber-500',
    textStyle: 'text-amber-600 font-black text-5xl tracking-widest uppercase'
  },
  'RETRO_80S': { 
    label: 'Retro 80s', 
    description: 'Neon synth wave scans, high saturation, and violet glow highlights.', 
    colors: 'border-fuchsia-900 bg-fuchsia-950/20 text-fuchsia-500 hover:border-fuchsia-500',
    textStyle: 'text-fuchsia-500 font-black italic text-4xl tracking-tighter'
  },
  'BLACK': { 
    label: 'Black Metal', 
    description: 'Cold monochromatic high contrast black-and-white static fog.', 
    colors: 'border-gray-800 bg-gray-900/30 text-gray-400 hover:border-gray-200',
    textStyle: 'text-white font-black text-4xl tracking-tight'
  }
};

const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />
    <div className="absolute inset-0 animate-pulse bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.05),transparent)] h-[100px] -top-[100px]" />
  </div>
);

export default function App() {
  // Sovereign Sentry Credentials & Config
  const [pipelineUrl, setPipelineUrl] = useState<string>(() => {
    return localStorage.getItem('sentry_pipeline_url') || 'http://localhost:3000';
  });
  const [sovereignKey, setSovereignKey] = useState<string>(() => {
    return localStorage.getItem('sentry_sovereign_key') || 'AZR_YYDYJm_GX40I_7Yuuk2GvqAPpbUGYaHtdp_QcOlDPBg';
  });
  const [serverType, setServerType] = useState<'LOCAL' | 'CLOUD'>('CLOUD');
  const [isServerConnected, setIsServerConnected] = useState<'CONNECTED' | 'DISCONNECTED' | 'CHECKING'>('CHECKING');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'CINEMATIC' | 'PHILATELIC' | 'TELEMETRY'>('CINEMATIC');


  // Creative Prompt Variables
  const [prompt, setPrompt] = useState('A legendary gothic gargoyle mechanical dragon soaring through dark red ash clouds with neon purple bolts of lightning');
  const [style, setStyle] = useState<MetalStyle>('SENTRY');
  const [lyrics, setLyrics] = useState('VOIDS OF DESTRUCTION // SENTRY ONLINE // BURNING HEAVENS REIGN');
  const [manifesto, setManifesto] = useState('A digital statement of sovereign speed and mechanical art from the void.');

  // Asset Selection
  const [selectedPhoto, setSelectedPhoto] = useState<string>(PRESET_PHOTOS[0].url);
  const [selectedMusic, setSelectedMusic] = useState<string>(PRESET_MUSIC[0].url);
  const [selectedVideo, setSelectedVideo] = useState<string>(PRESET_VIDEOS[0].url);

  // Custom File States
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState<File | null>(null);
  const [uploadedMusicFile, setUploadedMusicFile] = useState<File | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);

  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>('');
  const [uploadedMusicName, setUploadedMusicName] = useState<string>('');
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');

  // UI Flow Control
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderingLogs, setRenderingLogs] = useState<string[]>([]);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('sentry_gemini_key') || '';
  });

  // HTML Element Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('sentry_pipeline_url', pipelineUrl);
  }, [pipelineUrl]);

  useEffect(() => {
    localStorage.setItem('sentry_sovereign_key', sovereignKey);
  }, [sovereignKey]);

  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('sentry_gemini_key', geminiApiKey);
    }
  }, [geminiApiKey]);

  // Ping Pipeline server on load & configuration change
  const pingServer = async () => {
    setIsServerConnected('CHECKING');
    const targetUrl = serverType === 'LOCAL' ? pipelineUrl : window.location.origin;
    try {
      const res = await fetch(`${targetUrl}/api/health`, {
        headers: { 'X-Sovereign-Key': sovereignKey }
      }).catch(() => null);

      if (res && res.ok) {
        setIsServerConnected('CONNECTED');
        addLog(`[SYSTEM] Connection with Sentry Pipeline at ${targetUrl} verified successfully.`);
      } else {
        // Since /api/health may not exist, let's try reading the index page or any API
        const testRes = await fetch(`${targetUrl}/uploads`, {
          headers: { 'X-Sovereign-Key': sovereignKey }
        }).catch(() => null);
        
        if (testRes) {
          setIsServerConnected('CONNECTED');
          addLog(`[SYSTEM] Sentry Pipeline at ${targetUrl} online.`);
        } else {
          setIsServerConnected('DISCONNECTED');
          addLog(`[WARN] Sentry Pipeline at ${targetUrl} offline or rejecting connection.`);
        }
      }
    } catch (e) {
      setIsServerConnected('DISCONNECTED');
      addLog(`[ERROR] Sentry Pipeline handshake failed.`);
    }
  };

  useEffect(() => {
    pingServer();
  }, [pipelineUrl, serverType]);

  // Listen to rendering socket progress
  useEffect(() => {
    const targetUrl = serverType === 'LOCAL' ? pipelineUrl : window.location.origin;
    const socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[SENTRY] Socket connected to pipeline.');
      addLog('[SOCKET] Connection established with render stream.');
    });

    socket.on('render_progress', (data: { percent: number }) => {
      setRenderProgress(data.percent);
      addLog(`[RENDER] Pipeline processing: ${data.percent}% completed`);
    });

    socket.on('disconnect', () => {
      console.log('[SENTRY] Socket disconnected.');
    });

    return () => {
      socket.disconnect();
    };
  }, [pipelineUrl, serverType]);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    setRenderingLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  // Client-side image compression to bypass cloud gateway size limits
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1280;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.75);
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Upload file helper
  const uploadAssetToPipeline = async (file: File): Promise<string> => {
    let fileToUpload = file;
    
    // Auto-compress images
    if (file.type.startsWith('image/')) {
      addLog(`[UPLOAD] Pre-processing image ${file.name} to optimize payload density...`);
      try {
        fileToUpload = await compressImage(file);
        addLog(`[UPLOAD] Optimization complete: Image size scaled from ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB.`);
      } catch (err) {
        console.warn("[UPLOAD] Compression warning, using raw asset:", err);
      }
    }

    const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB chunks to stay safely below 2MB-3MB limits
    const totalChunks = Math.ceil(fileToUpload.size / CHUNK_SIZE);
    
    if (totalChunks > 1) {
      addLog(`[UPLOAD] Conveying physical asset ${fileToUpload.name} via chunked transmission (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB total)...`);
      const uploadId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      for (let index = 0; index < totalChunks; index++) {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileToUpload.size);
        const chunkBlob = fileToUpload.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunkBlob, fileToUpload.name);
        formData.append('chunkIndex', String(index));
        formData.append('totalChunks', String(totalChunks));
        formData.append('fileName', fileToUpload.name);
        formData.append('uploadId', uploadId);
        
        const targetUrl = serverType === 'LOCAL' ? pipelineUrl : '';
        addLog(`[UPLOAD] Transmitting chunk ${index + 1}/${totalChunks} (${((end - start) / 1024).toFixed(0)}KB)...`);
        
        const response = await fetch(`${targetUrl}/api/upload-chunk`, {
          method: 'POST',
          headers: {
            'X-Sovereign-Key': sovereignKey,
            'x_sovereign_key': sovereignKey
          },
          body: formData
        });
        
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Chunk transmission failed at block ${index}: Status ${response.status}`);
        }
        
        const result = await response.json();
        if (result.path) {
          addLog(`[UPLOAD] Sovereign file assembly complete. Asset mounted at: ${result.path}`);
          return result.path;
        }
      }
      
      throw new Error("Chunked transmission completed but did not return a valid asset path.");
    } else {
      // Single chunk upload for small assets
      const formData = new FormData();
      formData.append('asset', fileToUpload);
      
      const targetUrl = serverType === 'LOCAL' ? pipelineUrl : '';
      addLog(`[UPLOAD] Conveying physical asset ${fileToUpload.name} to rendering engine...`);
      
      const response = await fetch(`${targetUrl}/api/upload-asset`, {
        method: 'POST',
        headers: {
          'X-Sovereign-Key': sovereignKey,
          'x_sovereign_key': sovereignKey
        },
        body: formData
      });
      
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(`Asset transmission failed: Status 413 (Payload Too Large). The cloud gateway blocked this upload because the file exceeds its capacity. Please try again.`);
        }
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Asset transmission failed: Status ${response.status}`);
      }
      
      const result = await response.json();
      addLog(`[UPLOAD] Asset successfully mounted at: ${result.path}`);
      return result.path;
    }
  };

  // Refine visual prompt & lyrics using Gemini
  const refinePromptWithGemini = async () => {
    if (!prompt.trim()) return;
    setIsRefining(true);
    addLog('[GEMINI] Smelting core creative concept with flash model...');
    
    try {
      const activeKey = geminiApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey || activeKey === 'undefined') {
        throw new Error("Configure your Gemini API Key in Settings to smelt prompts.");
      }

      const ai = new GoogleGenAI({ apiKey: activeKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Refine this visual concept into a masterpiece storyboard.
        Original Concept: "${prompt}"
        Style: ${style}
        
        Provide:
        1. Enhanced Video Prompt: Descriptive, stunning, dark gothic, mechanical, atmospheric details.
        2. Song Lyrics: Heavy metal poetry suitable for video caption overlays. Keep it short, high-energy.
        3. Philosophical Manifesto: 1 powerful sentence justifying the void creation.
        
        Output format: strictly JSON with keys "refinedPrompt", "lyrics", "manifesto". No markdown code blocks, just raw JSON.`,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);

      if (result.refinedPrompt) setPrompt(result.refinedPrompt);
      if (result.lyrics) setLyrics(result.lyrics);
      if (result.manifesto) setManifesto(result.manifesto);

      addLog('[GEMINI] Creative smelting complete. Prompt, lyrics, and manifesto calibrated.');
    } catch (err: any) {
      console.error(err);
      addLog(`[GEMINI ERROR] Smelting failed: ${err.message || err}`);
      alert(err.message || "Failed to refine prompt. Verify your Gemini API Key is entered.");
    } finally {
      setIsRefining(false);
    }
  };

  // Core Orchestrator Trigger
  const handleForgeVideo = async () => {
    setIsGenerating(true);
    setRenderProgress(0);
    setRenderingLogs([]);
    setOutputVideoUrl('');
    addLog(`[FORGE] Initiating S-1792 Sovereign Sentry Rendering Run...`);

    try {
      // 1. Resolve asset files (Upload if local files are provided)
      let finalPhotoPath = selectedPhoto;
      let finalMusicPath = selectedMusic;
      let finalVideoPath = selectedVideo;

      if (uploadedPhotoFile) {
        finalPhotoPath = await uploadAssetToPipeline(uploadedPhotoFile);
      }
      if (uploadedMusicFile) {
        finalMusicPath = await uploadAssetToPipeline(uploadedMusicFile);
      }
      if (uploadedVideoFile) {
        finalVideoPath = await uploadAssetToPipeline(uploadedVideoFile);
      }

      // 2. Assemble Sentry Blueprint Track Payload
      addLog(`[ORCHESTRATOR] Assembling asset tracks for active synthesis...`);
      const timelinePayload = {
        project_name: `VoidForge_${style}_${Date.now()}`,
        style: style,
        tracks: [
          {
            id: 'v1',
            type: 'video',
            clips: [
              { id: 'c1', file: finalVideoPath, start: 0, end: 10 },
              { id: 'c_match', file: finalPhotoPath, start: 0, end: 10 }
            ]
          },
          {
            id: 'a1',
            type: 'audio',
            clips: [
              { id: 'c2', file: finalMusicPath, start: 0, end: 10, volume: 0.8 }
            ]
          },
          {
            id: 't1',
            type: 'text',
            clips: [
              { id: 'c3', text: lyrics, start: 0, end: 10 }
            ]
          }
        ]
      };

      // 3. Mount rendering request
      const targetUrl = serverType === 'LOCAL' ? pipelineUrl : window.location.origin;
      addLog(`[CONNECT] Submitting blueprint to rendering engine: ${targetUrl}/api/render`);
      
      const response = await fetch(`${targetUrl}/api/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sovereign-Key': sovereignKey,
          'x_sovereign_key': sovereignKey
        },
        body: JSON.stringify(timelinePayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Forge pipeline failure (Status ${response.status})`);
      }

      const result = await response.json();
      addLog(`[SUCCESS] Masterpiece rendered. Output asset registered.`);
      
      // Convert result URL to include absolute local pipeline host if using local pipeline
      const finalUrl = result.url.startsWith('http') 
        ? result.url 
        : (serverType === 'LOCAL' ? `${pipelineUrl}${result.url}` : result.url);
        
      setOutputVideoUrl(finalUrl);
      setRenderProgress(100);
      addLog(`[SYSTEM] Sentry render exfiltrated successfully: ${finalUrl}`);
    } catch (err: any) {
      console.error(err);
      addLog(`[PIPELINE FAILURE] ${err.message || err}`);
      alert(err.message || "Rendering engine returned an error. Verify your PC Pipeline server is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (type: 'photo' | 'music' | 'video', file: File) => {
    if (type === 'photo') {
      setUploadedPhotoFile(file);
      setUploadedPhotoName(file.name);
      setSelectedPhoto('');
      addLog(`[FILE] Background photo selected: ${file.name}`);
    } else if (type === 'music') {
      setUploadedMusicFile(file);
      setUploadedMusicName(file.name);
      setSelectedMusic('');
      addLog(`[FILE] Music layer selected: ${file.name}`);
    } else if (type === 'video') {
      setUploadedVideoFile(file);
      setUploadedVideoName(file.name);
      setSelectedVideo('');
      addLog(`[FILE] Video layer selected: ${file.name}`);
    }
  };

  const resetAsset = (type: 'photo' | 'music' | 'video') => {
    if (type === 'photo') {
      setUploadedPhotoFile(null);
      setUploadedPhotoName('');
      setSelectedPhoto(PRESET_PHOTOS[0].url);
    } else if (type === 'music') {
      setUploadedMusicFile(null);
      setUploadedMusicName('');
      setSelectedMusic(PRESET_MUSIC[0].url);
    } else if (type === 'video') {
      setUploadedVideoFile(null);
      setUploadedVideoName('');
      setSelectedVideo(PRESET_VIDEOS[0].url);
    }
  };

  const handlePlaybackToggle = () => {
    if (isPlaying) {
      videoPreviewRef.current?.pause();
      audioPreviewRef.current?.pause();
    } else {
      videoPreviewRef.current?.play().catch(() => {});
      audioPreviewRef.current?.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans flex flex-col selection:bg-red-950 selection:text-red-400">
      
      {/* SCANLINES OVERLAY FOR ENHANCED FORENSIC MOOD */}
      <ScanlineOverlay />

      {/* TOP HEADER */}
      <header className="border-b border-zinc-900 bg-[#050505]/95 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* SENTRY IDENTITY */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-red-950/40 border border-red-900 flex items-center justify-center shadow-[0_0_15px_rgba(153,27,27,0.2)]">
              <Shield className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">
                  VOID<span className="text-red-600">FORGE</span>
                </h1>
                <span className="text-[9px] font-mono bg-red-950 text-red-500 px-1.5 py-0.5 rounded border border-red-900/60 font-black uppercase tracking-wider">
                  S-1792
                </span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Sovereign Sentry // Automated Video Pipeline
              </p>
            </div>
          </div>

          {/* STATUS GRID */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* SERVER SWITCHER */}
            <div className="bg-zinc-950 p-1 rounded border border-zinc-900 flex gap-1">
              <button 
                onClick={() => setServerType('LOCAL')}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono uppercase rounded transition-colors",
                  serverType === 'LOCAL' ? "bg-red-950 text-red-400 border border-red-900" : "text-zinc-500 hover:text-white"
                )}
              >
                Local PC Pipeline
              </button>
              <button 
                onClick={() => setServerType('CLOUD')}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono uppercase rounded transition-colors",
                  serverType === 'CLOUD' ? "bg-red-950 text-red-400 border border-red-900" : "text-zinc-500 hover:text-white"
                )}
              >
                Cloud Host
              </button>
            </div>

            {/* HANDSHAKE INDICATOR */}
            <button 
              onClick={pingServer}
              className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 border border-zinc-900 rounded hover:border-zinc-700 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-zinc-500" />
              <div className="text-left">
                <p className="text-[8px] font-mono text-zinc-500 leading-none uppercase">Pipeline Server</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isServerConnected === 'CONNECTED' && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse",
                    isServerConnected === 'DISCONNECTED' && "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]",
                    isServerConnected === 'CHECKING' && "bg-amber-500 animate-spin"
                  )} />
                  <span className="text-[9px] font-mono text-zinc-300 font-bold uppercase leading-none">
                    {isServerConnected === 'CONNECTED' && "Sentry Online"}
                    {isServerConnected === 'DISCONNECTED' && "Disconnected"}
                    {isServerConnected === 'CHECKING' && "Testing Handshake..."}
                  </span>
                </div>
              </div>
            </button>

            {/* TAB SELECT SWITCHER */}
            <div className="bg-zinc-950 p-1 rounded border border-zinc-900 flex gap-1">
              <button 
                onClick={() => setActiveTab('CINEMATIC')}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono uppercase rounded transition-colors",
                  activeTab === 'CINEMATIC' ? "bg-red-950 text-red-400 border border-red-900" : "text-zinc-500 hover:text-white"
                )}
              >
                Cinematic
              </button>
              <button 
                onClick={() => setActiveTab('PHILATELIC')}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono uppercase rounded transition-colors",
                  activeTab === 'PHILATELIC' ? "bg-red-950 text-red-400 border border-red-900" : "text-zinc-500 hover:text-white"
                )}
              >
                Philatelic Audit
              </button>
              <button 
                onClick={() => setActiveTab('TELEMETRY')}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono uppercase rounded transition-colors",
                  activeTab === 'TELEMETRY' ? "bg-red-950 text-red-400 border border-red-900" : "text-zinc-500 hover:text-white"
                )}
              >
                Telemetry
              </button>
            </div>

            {/* SETTINGS PANEL TOGGLE */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 border rounded transition-colors",
                showSettings ? "border-red-900 bg-red-950/20 text-red-400" : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* BODY VIEWPORT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* SETTINGS DRAWER / DRAWER COMPONENT */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-zinc-950 border border-zinc-900 p-5 rounded overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-2 right-2 text-[8px] font-mono text-zinc-700">CONFIG_MODE_ONLINE</div>
              <h3 className="text-xs font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-red-500" /> Sentry Hardware Calibration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider block">PC Pipeline Host Address</label>
                  <input 
                    type="text" 
                    value={pipelineUrl} 
                    onChange={(e) => setPipelineUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-red-900 outline-none rounded"
                  />
                  <span className="text-[8px] font-mono text-zinc-600">The express rendering pipeline running on your PC.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider block">Sovereign Sentry Security Key</label>
                  <input 
                    type="password" 
                    value={sovereignKey} 
                    onChange={(e) => setSovereignKey(e.target.value)}
                    placeholder="AZR_YYDYJm_GX..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-red-900 outline-none rounded"
                  />
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <button 
                      type="button"
                      onClick={() => setSovereignKey('AZR_YYDYJm_GX40I_7Yuuk2GvqAPpbUGYaHtdp_QcOlDPBg')}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[8px] font-mono text-zinc-400 rounded border border-zinc-800/80 transition-colors"
                    >
                      Default Key
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSovereignKey('AZR_4z0K93N6jY0ptgar1jYvmvHuTHzr-GhWpgcYfjbOJMI')}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[8px] font-mono text-zinc-400 rounded border border-zinc-800/80 transition-colors"
                    >
                      Auto Sentry Key
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSovereignKey('021c04442ec59fa61a676d7d8ea03a27ccb93d387bc8dfa0974cfbf82044b063')}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[8px] font-mono text-zinc-400 rounded border border-zinc-800/80 transition-colors"
                    >
                      Pipeline Hash Key
                    </button>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-600 block pt-1">Matches key validation configured on your server.</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider block">Gemini API Key (For Smelting Storyboards)</label>
                  <input 
                    type="password" 
                    value={geminiApiKey} 
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-red-900 outline-none rounded"
                  />
                  <span className="text-[8px] font-mono text-zinc-600">For refining prompts into heavy metal lyrics and scenes.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'CINEMATIC' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* LEFT COLUMN: CREATIVE PANEL (7 COLS) */}
            <section className="lg:col-span-7 space-y-6 flex flex-col">

          
          {/* AI CREATIVE PROMPT ENGINE */}
          <div className="bg-[#050505] border border-zinc-900 p-5 rounded space-y-4 shadow-lg flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500 animate-pulse" /> 1. Describe Creative Vision
                </h3>
                <button 
                  onClick={refinePromptWithGemini}
                  disabled={isRefining || !prompt}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-950 text-red-400 border border-red-900/60 rounded text-[9px] font-mono uppercase tracking-wider hover:bg-red-900 hover:text-white disabled:opacity-40 transition-all shadow-[0_0_10px_rgba(153,27,27,0.1)]"
                >
                  {isRefining ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isRefining ? 'Calibrating...' : 'Smelt with Gemini'}
                </button>
              </div>

              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type visual theme details (e.g. dragon mechanics, demonic gears, gothic landscape)..."
                className="w-full h-24 bg-zinc-950 border border-zinc-900 p-3.5 text-xs font-mono text-zinc-300 focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none rounded resize-none leading-relaxed"
              />
            </div>

            {/* GENERATED CONTENT SUBPANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-zinc-950 border border-zinc-900 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-zinc-500">
                  <TypeIcon className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[9px] font-mono uppercase tracking-wider block">Subtitle Lyrics Overlay</span>
                </div>
                <input 
                  type="text" 
                  value={lyrics} 
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800/80 px-2.5 py-1.5 text-[10px] font-mono text-zinc-300 focus:border-red-900 outline-none rounded"
                />
              </div>

              <div className="bg-zinc-950 border border-zinc-900 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[9px] font-mono uppercase tracking-wider block">Creation Manifesto</span>
                </div>
                <input 
                  type="text" 
                  value={manifesto} 
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800/80 px-2.5 py-1.5 text-[10px] font-mono text-zinc-300 focus:border-red-900 outline-none rounded"
                />
              </div>
            </div>
          </div>

          {/* STYLE CONFIGURATORS */}
          <div className="bg-[#050505] border border-zinc-900 p-5 rounded space-y-4 shadow-lg">
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" /> 2. Aesthetic Calibration Style
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {Object.entries(STYLE_CONFIGS).map(([key, cfg]) => (
                <button 
                  key={key}
                  onClick={() => setStyle(key as MetalStyle)}
                  className={cn(
                    "p-2.5 border rounded text-left transition-all relative flex flex-col justify-between h-20 overflow-hidden",
                    style === key ? "ring-1 ring-red-600 border-red-600 bg-red-950/20" : "border-zinc-900 bg-zinc-950"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-white tracking-tight">{cfg.label}</span>
                      {style === key && <Check className="w-3 h-3 text-red-500" />}
                    </div>
                    <p className="text-[8px] font-mono text-zinc-500 leading-tight mt-1 line-clamp-2">
                      {cfg.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* MULTI-MEDIA LAYERING CONTAINER */}
          <div className="bg-[#050505] border border-zinc-900 p-5 rounded space-y-5 shadow-lg">
            <h3 className="text-xs font-black uppercase text-white tracking-widest">
              3. Orchestration Layer Bin
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* IMAGE / PHOTO LAYER */}
              <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-500" /> Photo Layer
                    </span>
                    {(selectedPhoto || uploadedPhotoFile) && (
                      <span className="text-[7px] font-mono bg-emerald-950 text-emerald-500 border border-emerald-900 px-1 py-0.5 rounded uppercase">Active</span>
                    )}
                  </div>
                  
                  {uploadedPhotoFile ? (
                    <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
                      <span className="text-[8px] font-mono text-zinc-300 truncate max-w-[110px]">{uploadedPhotoName}</span>
                      <button onClick={() => resetAsset('photo')} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <select 
                      value={selectedPhoto}
                      onChange={(e) => setSelectedPhoto(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 py-1 px-1.5 text-[10px] font-mono text-zinc-300 outline-none rounded"
                    >
                      {PRESET_PHOTOS.map(p => (
                        <option key={p.id} value={p.url}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-3">
                  <button 
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full py-1.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-[9px] font-mono uppercase text-zinc-400 transition-colors rounded"
                  >
                    Upload Photo
                  </button>
                  <input type="file" ref={photoInputRef} onChange={(e) => e.target.files?.[0] && handleFileSelect('photo', e.target.files[0])} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* MUSIC / SONIC LAYER */}
              <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                      <MusicIcon className="w-3.5 h-3.5 text-zinc-500" /> Music Layer
                    </span>
                    {(selectedMusic || uploadedMusicFile) && (
                      <span className="text-[7px] font-mono bg-emerald-950 text-emerald-500 border border-emerald-900 px-1 py-0.5 rounded uppercase">Active</span>
                    )}
                  </div>

                  {uploadedMusicFile ? (
                    <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
                      <span className="text-[8px] font-mono text-zinc-300 truncate max-w-[110px]">{uploadedMusicName}</span>
                      <button onClick={() => resetAsset('music')} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <select 
                      value={selectedMusic}
                      onChange={(e) => setSelectedMusic(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 py-1 px-1.5 text-[10px] font-mono text-zinc-300 outline-none rounded"
                    >
                      {PRESET_MUSIC.map(m => (
                        <option key={m.id} value={m.url}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-3">
                  <button 
                    onClick={() => musicInputRef.current?.click()}
                    className="w-full py-1.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-[9px] font-mono uppercase text-zinc-400 transition-colors rounded"
                  >
                    Upload Music
                  </button>
                  <input type="file" ref={musicInputRef} onChange={(e) => e.target.files?.[0] && handleFileSelect('music', e.target.files[0])} className="hidden" accept="audio/*" />
                </div>
              </div>

              {/* VIDEO LAYER */}
              <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded flex flex-col justify-between min-h-[140px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                      <VideoIcon className="w-3.5 h-3.5 text-zinc-500" /> Video Layer
                    </span>
                    {(selectedVideo || uploadedVideoFile) && (
                      <span className="text-[7px] font-mono bg-emerald-950 text-emerald-500 border border-emerald-900 px-1 py-0.5 rounded uppercase">Active</span>
                    )}
                  </div>

                  {uploadedVideoFile ? (
                    <div className="p-1.5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
                      <span className="text-[8px] font-mono text-zinc-300 truncate max-w-[110px]">{uploadedVideoName}</span>
                      <button onClick={() => resetAsset('video')} className="text-zinc-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <select 
                      value={selectedVideo}
                      onChange={(e) => setSelectedVideo(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 py-1 px-1.5 text-[10px] font-mono text-zinc-300 outline-none rounded"
                    >
                      {PRESET_VIDEOS.map(v => (
                        <option key={v.id} value={v.url}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-3">
                  <button 
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-1.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 text-[9px] font-mono uppercase text-zinc-400 transition-colors rounded"
                  >
                    Upload Video
                  </button>
                  <input type="file" ref={videoInputRef} onChange={(e) => e.target.files?.[0] && handleFileSelect('video', e.target.files[0])} className="hidden" accept="video/*" />
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: PREVIEW PLAYER & PIPELINE STREAM MONITOR (5 COLS) */}
        <section className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* THE PREVIEW CANVAS STAGE */}
          <div className="bg-[#050505] border border-zinc-900 p-5 rounded shadow-lg flex-1 flex flex-col">
            <h3 className="text-xs font-black uppercase text-white tracking-widest mb-4 flex items-center justify-between">
              <span>Sentry Canvas Preview</span>
              <span className="text-[8px] font-mono text-zinc-600">FPS_CALIBRATED_30</span>
            </h3>

            {/* HIGH-INTENSITY DISPLAY CANVAS */}
            <div className="flex-1 bg-zinc-950 aspect-[9/16] max-h-[420px] mx-auto w-full relative overflow-hidden border border-zinc-900 rounded-sm group flex items-center justify-center">
              
              {/* Retro scanline filters */}
              {style === 'RETRO_80S' && <ScanlineOverlay />}

              {/* VIDEO LAYER RENDERING PREVIEW */}
              {outputVideoUrl ? (
                <>
                  <video 
                    ref={videoPreviewRef}
                    src={outputVideoUrl}
                    loop
                    className="w-full h-full object-cover transition-all"
                    style={{
                      filter: `contrast(${style === 'BLACK' ? 2.0 : 1.3})`
                    }}
                  />
                  
                  {/* Dynamic lyrics subtitle overlay */}
                  <div className="absolute inset-x-4 bottom-12 text-center z-20">
                    <p className={cn(STYLE_CONFIGS[style].textStyle, "drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]")}>
                      {lyrics}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-full">
                    <Skull className="w-7 h-7 text-zinc-600 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Awaiting Forge Execution</p>
                    <p className="text-[8px] font-mono text-zinc-700">Submit your blueprint below to initiate compile</p>
                  </div>
                </div>
              )}
            </div>

            {/* PREVIEW INTERACTION CONTROLS */}
            {outputVideoUrl && (
              <div className="flex items-center justify-between mt-4 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                <button 
                  onClick={handlePlaybackToggle}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-mono uppercase flex items-center gap-1.5 border border-zinc-800"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <a 
                  href={outputVideoUrl} 
                  download={`VoidForge_${style}.mp4`}
                  className="px-4 py-1.5 bg-red-950 text-red-400 hover:bg-red-900 hover:text-white rounded text-[10px] font-mono uppercase flex items-center gap-1.5 border border-red-900/50 transition-colors shadow-[0_0_15px_rgba(153,27,27,0.15)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exfiltrate MP4
                </a>
              </div>
            )}
          </div>

          {/* FORENSIC RENDER LOGS & SUBMIT CONTROLS */}
          <div className="bg-[#050505] border border-zinc-900 p-5 rounded space-y-4 shadow-lg">
            
            {/* TERMINAL STATUS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono uppercase">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-600" /> Pipeline Console output
                </span>
                <span className="text-red-500 font-bold">{renderProgress}%</span>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 p-3 h-32 rounded font-mono text-[9px] text-zinc-500 overflow-y-auto space-y-1 custom-scrollbar">
                {renderingLogs.map((log, idx) => (
                  <div key={idx} className={cn(
                    log.includes('[ERROR]') && "text-red-500",
                    log.includes('[SUCCESS]') && "text-emerald-500 font-bold",
                    log.includes('[SYSTEM]') && "text-zinc-400"
                  )}>
                    {log}
                  </div>
                ))}
                {renderingLogs.length === 0 && (
                  <div className="text-zinc-700 italic">Sovereign Sentry terminal idling... awaiting forge.</div>
                )}
              </div>
            </div>

            {/* PROGRESS METER */}
            <div className="h-1 bg-zinc-900 w-full rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-300"
                style={{ width: `${renderProgress}%` }}
              />
            </div>

            {/* THE BIG BUTTON */}
            <button 
              onClick={handleForgeVideo}
              disabled={isGenerating || (!selectedPhoto && !uploadedPhotoFile)}
              className="w-full py-4 bg-gradient-to-r from-red-900 to-red-600 hover:from-red-800 hover:to-red-500 disabled:from-zinc-900 disabled:to-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-[0.2em] rounded border border-red-800 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(153,27,27,0.4)] shadow-[0_0_15px_rgba(153,27,27,0.2)]"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-red-400" /> : <Hammer className="w-4.5 h-4.5" />}
              {isGenerating ? 'Rendering Sovereign Masterpiece...' : 'Forge Cinematic Video'}
            </button>
          </div>

        </section>
        </div>
        )}

        {activeTab === 'PHILATELIC' && (
          <PhilatelicAudit />
        )}

        {activeTab === 'TELEMETRY' && (
          <SentryTelemetry />
        )}

      </main>

      {/* FOOTER COVEN DETAILS */}
      <footer className="border-t border-zinc-950 bg-[#020202] py-4 text-center">
        <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
          Void Forge S-1792 Sovereign Sentry // Forever Raw Technology Engine
        </p>
      </footer>

      {/* GLOBAL CUSTOM STYLES */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020202;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #111;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #991b1b;
        }
      `}</style>

    </div>
  );
}
