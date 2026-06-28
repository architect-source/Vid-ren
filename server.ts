import express from "express";
import fileUpload from "express-fileupload";
import ffmpeg from "fluent-ffmpeg";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
// On Vercel, we must use /tmp for temporary file storage
const uploadsDir = process.env.VERCEL === "1" 
  ? path.join("/tmp", "uploads") 
  : path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function generateID() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const getExtensionFromContentType = (contentType?: string) => {
  if (!contentType) return '';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('mp4') || contentType.includes('video')) return '.mp4';
  if (contentType.includes('mpeg') || contentType.includes('mp3') || contentType.includes('audio')) return '.mp3';
  return '';
};

async function resolveInput(filePath: string, defaultType: "image" | "audio"): Promise<string> {
  if (!filePath) {
    if (defaultType === "image") {
      return "color=s=1280x720:c=black"; 
    }
    return "anullsrc=r=44100:cl=stereo";
  }

  if (filePath.startsWith("/uploads/")) {
    const local = path.join(uploadsDir, filePath.replace(/^\/uploads\//, ''));
    if (fs.existsSync(local)) return local;
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    try {
      const parsedUrl = new URL(filePath);
      let ext = path.extname(parsedUrl.pathname);
      
      const res = await globalThis.fetch(filePath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      if (!ext) {
        ext = getExtensionFromContentType(res.headers.get('content-type') || undefined);
      }
      
      const hash = Math.random().toString(36).substring(2, 8);
      const fileName = `download_${Date.now()}_${hash}${ext || (defaultType === 'image' ? '.png' : '.mp3')}`;
      const dest = path.join(uploadsDir, fileName);
      
      console.log(`[VOID FORGE] Downloading remote dependency: ${filePath} -> ${dest}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      return dest;
    } catch (err) {
      console.error(`[VOID FORGE] Failed to download remote asset ${filePath}, using directly:`, err);
    }
  }

  return filePath;
}

const isImage = (file: string) => {
  const ext = path.extname(file).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'].includes(ext) || file.includes("picsum.photos");
};

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  
  // Socket.io initialization
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = Number(process.env.PORT) || 3000;

  console.log(`[VOID FORGE] Initializing server in ${process.env.NODE_ENV || 'development'} mode...`);

  // Socket.io Real-Time Collaboration
  io.on('connection', (socket) => {
    console.log('[VOID FORGE] A new Forger has joined the session.');

    socket.on('join_project', (projectId) => {
      socket.join(projectId);
      console.log(`[VOID FORGE] Forger joined project: ${projectId}`);
    });

    socket.on('timeline_update', (data) => {
      // Broadcast the change to everyone else in the project room
      socket.to(data.projectId).emit('remote_timeline_update', data.newTimeline);
    });

    // When one user changes a word in the Concept Seed
    socket.on('seed-update', (data) => {
      // Broadcast to coven members
      socket.to(data.room).emit('sync-ui', data.newSeed);
      console.log(`[VOID FORGE] Re-analyzing seed in room ${data.room}: ${data.newSeed}`);
    });

    socket.on('disconnect', () => {
      console.log('[VOID FORGE] A Forger has left the session.');
    });
  });

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  }));

  // CORS and Preflight middleware for local and remote communication
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-sovereign-key, x_sovereign_key, x-osburn-sentry-id");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Sovereign Key validation for API endpoints
  const targetHash = process.env.AZRAEL_PIPELINE_HASH || "021c04442ec59fa61a676d7d8ea03a27ccb93d387bc8dfa0974cfbf82044b063";

  const SOVEREIGN_KEYS = [
    "AZR_YYDYJm_GX40I_7Yuuk2GvqAPpbUGYaHtdp_QcOlDPBg",
    "15c7af625139b1eab0ab9295bcaa14a87ca2b7e7285e0b33aed49c18d3961424",
    "AZR_4z0K93N6jY0ptgar1jYvmvHuTHzr-GhWpgcYfjbOJMI",
    targetHash
  ];

  const validateSovereignKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Permit local rendering calls without strict key checks if coming from localhost or if they pass the key
    const key = req.headers['x-sovereign-key'] || req.headers['x_sovereign_key'];
    if (!key || !SOVEREIGN_KEYS.includes(key as string)) {
      console.warn(`[SENTRY] Key validation failed. Key provided: ${key}`);
      return res.status(401).json({ error: "Sovereign Sentry signature invalid. Unauthorized access." });
    }
    next();
  };

  // API: Health probe
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Sovereign Sentry online." });
  });

  // API: Void Orchestrator Forge (Python-style logic simulation)
  app.post("/api/forge", validateSovereignKey, (req, res) => {
    const project = req.body;

    const { style, user_id } = project;

    // Plan check for RETRO_80S
    if (style === "RETRO_80S") {
      // In a real app, fetch user plan from DB
      const userPlan: string = "ACOLYTE"; // Mocking for now
      if (userPlan !== "SOVEREIGN") {
        return res.status(402).json({ error: "Sovereign Tier Required for Retro 80s" });
      }
    }

    console.log(`--- PHASE 1: ANALYZING BEATS for ${project.projectID} ---`);
    
    const audioLayer = project.layers?.find((l: any) => l.type === 'audio');
    const visualLayer = project.layers?.find((l: any) => l.type === 'visual');
    const textLayer = project.layers?.find((l: any) => l.type === 'text');

    console.log(`--- PHASE 2: ASSEMBLING VISUAL STACK with ${visualLayer?.asset} ---`);
    console.log(`--- PHASE 3: INJECTING METAL TYPOGRAPHY: ${textLayer?.content} ---`);
    
    // Simulate heavy rendering delay
    setTimeout(() => {
      console.log("--- PHASE 4: FINAL EXPORT COMPLETE ---");
      res.json({ 
        status: "success", 
        output_path: `renders/${project.projectID}_final.mp4`,
        metadata: {
          style: project.style,
          seed: project.seed,
          layers_processed: project.layers?.length || 0
        }
      });
    }, 3000);
  });

  // API: Subscription & Stripe Mock
  app.get("/api/check-subscription", (req, res) => {
    // In a real app, check DB for user's stripe_customer_id and subscription status
    res.json({ isPro: false }); 
  });

  app.post("/api/stripe/checkout", (req, res) => {
    const { priceId } = req.body;
    const sentryId = req.headers['x-osburn-sentry-id'];

    if (sentryId !== 'S-1792') {
      console.error("[STRIPE] Handshake failed: Invalid Sentry ID.");
      return res.status(403).json({ error: "TRANSACTION REJECTED: THE FORGE STAYS COLD." });
    }

    console.log(`[STRIPE] Handshake Verified (S-1792). Creating checkout session for tier: ${priceId}`);
    res.json({ url: "https://checkout.stripe.com/mock-session-void-forge" });
  });

  app.post("/api/create-checkout-session", (req, res) => {
    const sentryId = req.headers['x-osburn-sentry-id'];

    if (sentryId !== 'S-1792') {
      console.error("[STRIPE] Handshake failed: Invalid Sentry ID.");
      return res.status(403).json({ error: "TRANSACTION REJECTED: THE FORGE STAYS COLD." });
    }

    console.log("[STRIPE] Handshake Verified (S-1792). Creating checkout session for user...");
    res.json({ url: "https://checkout.stripe.com/mock-session-void-forge" });
  });

  // API: Stripe Webhook Mock
  app.post("/api/webhook/stripe", (req, res) => {
    const event = req.body;
    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata.userId;
      console.log(`[STRIPE WEBHOOK] User ${userId} upgraded to SOVEREIGN.`);
      // In a real app, update the user in the database here
    }

    res.json({ received: true });
  });

  // API: Project Render Simulation (Advanced Forge V2)
  app.post("/api/render", validateSovereignKey, async (req, res) => {

    try {
      const { project_name, tracks, style } = req.body;
      console.log(`[VOID FORGE] Initializing Active FFmpeg Render: ${project_name}...`);
      console.log(`[VOID FORGE] Style detected: ${style}`);
      
      const videoTrack = tracks.find((t: any) => t.type === 'video');
      const audioTrack = tracks.find((t: any) => t.type === 'audio');
      const textTrack = tracks.find((t: any) => t.type === 'text');
      
      const primaryClip = videoTrack?.clips.find((c: any) => c.id === 'c1');
      const backgroundImage = videoTrack?.clips.find((c: any) => c.id === 'c_match')?.file || primaryClip?.file;
      const audioFile = audioTrack?.clips[0]?.file;
      const seedText = textTrack?.clips[0]?.text || "VOID METAL";

      // 1. Resolve files dynamically from local storage or downloads
      const resolvedImage = await resolveInput(backgroundImage, "image");
      const resolvedAudio = await resolveInput(audioFile, "audio");

      console.log(`[VOID FORGE] Resolved inputs: Image=${resolvedImage} | Audio=${resolvedAudio}`);

      // 2. Determine project duration from clips
      let maxDuration = 10;
      try {
        tracks.forEach((track: any) => {
          track.clips.forEach((clip: any) => {
            if (clip.end && clip.end > maxDuration) {
              maxDuration = clip.end;
            }
          });
        });
      } catch (e) {
        console.warn("[VOID FORGE] Failed to calculate max duration, defaulting to 10s:", e);
      }

      // Simulate Beat Detection for Zoom Logic pulse animation using output frame index 'on' at 30 fps
      const simulatedBeats = [0.5, 1.2, 2.0, 2.8, 3.5, 4.2, 5.0, 6.0, 7.0, 8.0, 9.0];
      const zoomLogic = simulatedBeats.map(b => `between(on/30,${b},${b+0.1})*0.05`).join('+');

      const styleFilters: Record<string, string> = {
        "SENTRY": "eq=contrast=1.8:saturation=1.2,unsharp=5:5:1.0:5:5:0.0",
        "THRASH": "eq=contrast=1.5:saturation=1.8,unsharp=5:5:1.0:5:5:0.0,noise=alls=100:allf=t+u",
        "DOOM": "vignette=PI/4,eq=brightness=-0.1:contrast=1.2,setpts=1.5*PTS",
        "INDUSTRIAL": "curves=vintage,format=gray,noise=alls=20:allf=t+u",
        "RETRO_80S": "noise=alls=15:allf=t+u,boxblur=1,curves=vintage"
      };

      // Advanced Typography Logic
      const typoTheme = style === 'RETRO_80S' ? 'NEON_80S' : (style === 'THRASH' || style === 'INDUSTRIAL' ? 'CYAN_GLOW' : 'BLOOD_RUST');
      const typoConfig = typoTheme === 'NEON_80S'
        ? "fontcolor=0xFF00FF:borderw=2:bordercolor=0x00FFFF"
        : (typoTheme === 'CYAN_GLOW' 
          ? "fontcolor=0x00FFFF:borderw=3:bordercolor=black@0.8"
          : "fontcolor=0x8B0000:borderw=1:bordercolor=0x333333");

      const cleanText = seedText.toUpperCase().replace(/[:']/g, '');

      // Build video filters pipeline
      const videoFilters: string[] = [];
      videoFilters.push("scale=1280:720,setsar=1");

      if (zoomLogic) {
        videoFilters.push(`zoompan=z='1.0+(${zoomLogic})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30`);
      }

      if (styleFilters[style]) {
        videoFilters.push(styleFilters[style]);
      }

      if (cleanText) {
        videoFilters.push(`drawtext=text='${cleanText}':${typoConfig}:x=(w-text_w)/2:y=(h-text_h)/2:fontsize=64`);
      }

      const isImageInput = isImage(resolvedImage) || resolvedImage.startsWith("color=");
      const isAudioGenerated = resolvedAudio.startsWith("anullsrc=");

      let command = ffmpeg();

      // Configure Inputs
      if (resolvedImage.startsWith("color=")) {
        command = command.input(resolvedImage).inputFormat('lavfi');
      } else {
        if (isImageInput) {
          command = command.input(resolvedImage).inputOption('-loop 1');
        } else {
          command = command.input(resolvedImage);
        }
      }

      if (isAudioGenerated) {
        command = command.input(resolvedAudio).inputFormat('lavfi');
      } else {
        command = command.input(resolvedAudio);
      }

      // Output Config
      const outputFile = `forge_${style.toLowerCase()}_${Date.now()}.mp4`;
      const outputPath = path.join(uploadsDir, outputFile);

      command = command
        .output(outputPath)
        .duration(maxDuration)
        .outputFPS(30)
        .videoFilters(videoFilters)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-shortest',
          '-preset superfast'
        ])
        .on('start', (commandLine) => {
          console.log('[VOID FORGE] Spawned FFmpeg with command: ' + commandLine);
        })
        .on('progress', (progress) => {
          const percent = Math.min(100, Math.round(progress.percent || 0));
          io.to(project_name).emit('render_progress', { percent });
          console.log(`[VOID FORGE] Processing: ${percent}% done`);
        })
        .on('end', () => {
          console.log('[VOID FORGE] active rendering complete.');
          io.to(project_name).emit('render_progress', { percent: 100 });
          res.json({ 
            status: "success", 
            message: `Void Masterpiece (${style}) fully forged!`,
            url: `/uploads/${outputFile}`
          });
        })
        .on('error', (err) => {
          console.error('[VOID FORGE] Processing failed: ', err);
          res.status(500).json({ error: `The forge caught fire: ${err.message}` });
        });

      command.run();
    } catch (err: any) {
      console.error('[VOID FORGE] Server error in render:', err);
      res.status(500).json({ error: `Internal server failure in render: ${err.message}` });
    }
  });

  // API: Asset Upload & Analysis
  app.post("/api/upload-asset", async (req: any, res) => {
    if (!req.files || !req.files.asset) {
      return res.status(400).json({ error: "No asset uploaded" });
    }

    const file = req.files.asset;
    const filePath = path.join(uploadsDir, file.name);
    
    try {
      await file.mv(filePath);

      // Check if ffmpeg is available
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err || !formats) {
          console.error("FFmpeg not found in this environment.");
          return res.json({
            id: generateID(),
            path: `/uploads/${file.name}`,
            duration: 0,
            type: file.mimetype.startsWith('video') ? 'video' : 'audio',
            name: file.name,
            warning: "FFmpeg not found. Analysis skipped."
          });
        }

        // Analyze the asset immediately
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            console.error("ffprobe error:", err);
            return res.status(500).json({ error: "Failed to analyze asset" });
          }

          const info = {
            id: generateID(),
            path: `/uploads/${file.name}`,
            duration: metadata.format.duration,
            type: file.mimetype.startsWith('video') ? 'video' : 'audio',
            name: file.name
          };
          
          res.json(info);
        });
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Failed to upload asset" });
    }
  });

  // API: Chunked Asset Upload & Analysis to bypass ingress gateway limits
  app.post("/api/upload-chunk", async (req: any, res) => {
    if (!req.files || !req.files.chunk) {
      return res.status(400).json({ error: "No chunk uploaded" });
    }
    const { chunkIndex, totalChunks, fileName, uploadId } = req.body;
    if (!fileName || !uploadId) {
      return res.status(400).json({ error: "Missing upload parameters" });
    }

    const index = parseInt(chunkIndex);
    const total = parseInt(totalChunks);

    const chunkFile = req.files.chunk;
    const tempChunkDir = path.join(uploadsDir, `chunks_${uploadId}`);
    if (!fs.existsSync(tempChunkDir)) {
      fs.mkdirSync(tempChunkDir, { recursive: true });
    }

    const chunkPath = path.join(tempChunkDir, `chunk_${index}`);
    try {
      await chunkFile.mv(chunkPath);

      // Check if all chunks are uploaded
      const uploadedChunks = fs.readdirSync(tempChunkDir);
      if (uploadedChunks.length === total) {
        // Reassemble the file
        const finalFilePath = path.join(uploadsDir, fileName);
        const writeStream = fs.createWriteStream(finalFilePath);

        for (let i = 0; i < total; i++) {
          const currentChunkPath = path.join(tempChunkDir, `chunk_${i}`);
          const chunkBuffer = fs.readFileSync(currentChunkPath);
          writeStream.write(chunkBuffer);
          // Clean up chunk file
          fs.unlinkSync(currentChunkPath);
        }
        writeStream.end();

        // Clean up temp directory
        try {
          fs.rmdirSync(tempChunkDir);
        } catch (dirErr) {
          console.warn("[CHUNKS] Failed to remove temp directory, skipping:", dirErr);
        }

        // Analyze file with ffprobe if available
        ffmpeg.getAvailableFormats((err, formats) => {
          if (err || !formats) {
            return res.json({
              id: generateID(),
              path: `/uploads/${fileName}`,
              duration: 0,
              type: fileName.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm)$/) ? 'video' : 'audio',
              name: fileName,
              warning: "FFmpeg not found. Analysis skipped."
            });
          }

          ffmpeg.ffprobe(finalFilePath, (err, metadata) => {
            if (err) {
              return res.json({
                id: generateID(),
                path: `/uploads/${fileName}`,
                duration: 0,
                type: fileName.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm)$/) ? 'video' : 'audio',
                name: fileName
              });
            }

            res.json({
              id: generateID(),
              path: `/uploads/${fileName}`,
              duration: metadata.format.duration || 0,
              type: (metadata.streams?.some(s => s.codec_type === 'video') || fileName.toLowerCase().match(/\.(mp4|avi|mov|mkv|webm)$/)) ? 'video' : 'audio',
              name: fileName
            });
          });
        });
      } else {
        res.json({ status: "chunk_received", chunkIndex: index });
      }
    } catch (err: any) {
      console.error("[CHUNKS] Error handling chunk upload:", err);
      res.status(500).json({ error: `Chunk upload failed: ${err.message}` });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("[VOID FORGE] Attaching Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[VOID FORGE] Serving static files from dist...");
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn("[VOID FORGE] dist directory not found! Frontend will not be served.");
    }
  }

  // Only listen if not running as a Vercel function
  if (process.env.VERCEL !== "1") {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Void Forge Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// Start the server
startServer().catch(err => {
  console.error("[VOID FORGE] Critical startup failure:", err);
});

// Export for Vercel
export default async (req: any, res: any) => {
  const app = await startServer();
  return app(req, res);
};
