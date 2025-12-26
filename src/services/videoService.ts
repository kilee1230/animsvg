import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface VideoOptions {
  duration: number; // in seconds
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
}

export const generateVideoBlob = async (
  svgCode: string,
  options: VideoOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const { duration, fps, width, height, backgroundColor } = options;
  
  // Ensure even dimensions for H.264
  const w = width % 2 === 0 ? width : width - 1;
  const h = height % 2 === 0 ? height : height - 1;
  const totalFrames = Math.ceil(duration * fps);
  
  // Setup Muxer
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc', // H.264 (Most compatible with WhatsApp/QuickTime)
      width: w,
      height: h
    },
    fastStart: 'in-memory' // Optimize for web playback (moves moov atom to start)
  });

  // Setup VideoEncoder
  const videoEncoder = new window.VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("Video Encoding Error", e)
  });

  // Use Main Profile (avc1.4d002a) instead of Baseline (avc1.42001f)
  // Main Profile is much better supported by macOS QuickTime and iOS.
  videoEncoder.configure({
    codec: 'avc1.4d002a', // H.264 Main Profile Level 4.2
    width: w,
    height: h,
    bitrate: 2_500_000, // 2.5 Mbps for crisp vector edges
    framerate: fps
  });

  // Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
  
  if (!ctx) throw new Error("Could not create canvas context");

  // Create DOM Sandbox
  const sandbox = document.createElement('div');
  sandbox.style.position = 'absolute';
  sandbox.style.top = '-9999px';
  sandbox.style.visibility = 'hidden';
  sandbox.innerHTML = svgCode;
  document.body.appendChild(sandbox);

  const svgElement = sandbox.querySelector('svg');
  if (!svgElement) {
    document.body.removeChild(sandbox);
    throw new Error("Invalid SVG code");
  }

  // Ensure SVG matches target dimensions
  svgElement.setAttribute('width', w.toString());
  svgElement.setAttribute('height', h.toString());
  if (!svgElement.getAttribute('xmlns')) {
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  try {
    const frameDurationMicroseconds = Math.round((1 / fps) * 1_000_000);

    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTimeMs = (frame / fps) * 1000;
      
      // --- SEEKING ---
      
      // A1. CSS Animations
      let seekerStyle = svgElement.querySelector('style#gif-seeker');
      if (!seekerStyle) {
        seekerStyle = document.createElement('style');
        seekerStyle.id = 'gif-seeker';
        svgElement.appendChild(seekerStyle);
      }
      seekerStyle.textContent = `
        * {
          animation-play-state: paused !important;
          animation-delay: -${currentTimeMs}ms !important;
        }
      `;

      // A2. SMIL Animations
      const smilElements = svgElement.querySelectorAll('animate, animateTransform, animateMotion');
      smilElements.forEach((el) => {
          el.setAttribute('begin', `-${currentTimeMs}ms`);
      });

      // --- RENDER ---
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try { await img.decode(); resolve(); } catch { resolve(); }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });
      
      // Draw Opaque Background (Video doesn't support transparency well)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      
      URL.revokeObjectURL(url);

      // --- ENCODE ---
      // timestamp is in microseconds
      const timestamp = Math.round((frame / fps) * 1_000_000);
      
      const videoFrame = new window.VideoFrame(canvas, { 
        timestamp,
        duration: frameDurationMicroseconds 
      });
      
      videoEncoder.encode(videoFrame, { keyFrame: frame % 30 === 0 });
      videoFrame.close();

      if (onProgress) {
        onProgress(Math.round(((frame + 1) / totalFrames) * 100));
      }
    }

    // Finish
    await videoEncoder.flush();
    muxer.finalize();
    videoEncoder.close(); // Clean up encoder resources
    
    const buffer = muxer.target.buffer;
    return new Blob([buffer], { type: 'video/mp4' });

  } catch (err) {
    console.error("Video Generation Error:", err);
    throw err;
  } finally {
    if (document.body.contains(sandbox)) {
      document.body.removeChild(sandbox);
    }
  }
};

