import { GIFEncoder, quantize, applyPalette } from "gifenc";

export interface GifOptions {
  duration: number; // in seconds
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  transparent?: boolean; // New option
}

export const generateGifBlob = async (
  svgCode: string,
  options: GifOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const {
    duration,
    fps,
    width,
    height,
    backgroundColor,
    transparent = false,
  } = options;

  // CRITICAL FIX 1: Ensure Even Dimensions
  // Video encoders (like WhatsApp's MP4 transcoder) often fail or produce artifacts
  // with odd dimensions due to stride alignment requirements.
  const w = width % 2 === 0 ? width : width - 1;
  const h = height % 2 === 0 ? height : height - 1;

  const totalFrames = Math.ceil(duration * fps);

  // Calculate Delays
  const exactDelayMs = 1000 / fps;
  const delayMs = Math.max(20, Math.round(exactDelayMs / 10) * 10);

  // CRITICAL FIX 2: Context Alpha
  // If transparent, we need alpha. If opaque (for WhatsApp), we disable it to avoid artifacts.
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
    alpha: transparent,
  });

  if (!ctx) throw new Error("Could not create canvas context");

  // Initialize Encoder
  if (!GIFEncoder) throw new Error("GIFEncoder library not loaded correctly.");
  const encoder = new GIFEncoder();

  // Create DOM Sandbox
  const sandbox = document.createElement("div");
  sandbox.style.position = "absolute";
  sandbox.style.top = "-9999px";
  sandbox.style.visibility = "hidden";
  sandbox.innerHTML = svgCode;
  document.body.appendChild(sandbox);

  const svgElement = sandbox.querySelector("svg");
  if (!svgElement) {
    document.body.removeChild(sandbox);
    throw new Error("Invalid SVG code");
  }

  // Ensure SVG matches target dimensions
  svgElement.setAttribute("width", w.toString());
  svgElement.setAttribute("height", h.toString());
  if (!svgElement.getAttribute("xmlns")) {
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  try {
    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTimeMs = frame * exactDelayMs;

      // --- A. SEEKING STRATEGY ---

      // A1. CSS Animations
      let seekerStyle = svgElement.querySelector("style#gif-seeker");
      if (!seekerStyle) {
        seekerStyle = document.createElement("style");
        seekerStyle.id = "gif-seeker";
        svgElement.appendChild(seekerStyle);
      }

      seekerStyle.textContent = `
        * {
          animation-play-state: paused !important;
          animation-delay: -${currentTimeMs}ms !important;
        }
      `;

      // A2. SMIL Animations
      const smilElements = svgElement.querySelectorAll(
        "animate, animateTransform, animateMotion"
      );
      smilElements.forEach((el) => {
        el.setAttribute("begin", `-${currentTimeMs}ms`);
      });

      // --- B. SERIALIZATION ---
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);

      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      // --- C. RENDER FRAME ---
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try {
            await img.decode();
            resolve();
          } catch {
            resolve();
          }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });

      // Handling Background and Transparency
      if (transparent) {
        ctx.clearRect(0, 0, w, h);
        // Draw SVG on top
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        // Draw Opaque Background first
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, w, h);
        // Draw SVG on top
        ctx.drawImage(img, 0, 0, w, h);
      }

      URL.revokeObjectURL(url);

      // --- D. ENCODE GIF FRAME ---
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // Strict Alpha Enforcement for Opaque Mode
      if (!transparent) {
        // Force Alpha 255. Even with alpha:false, ensuring the byte array is clean is safer.
        for (let i = 0; i < data.length; i += 4) {
          data[i + 3] = 255;
        }
      } else {
        // Simple Thresholding for 1-bit alpha to avoid dirty edges
        // GIF only supports fully transparent or fully opaque.
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 0;
          } else {
            data[i + 3] = 255;
          }
        }
      }

      if (quantize && applyPalette) {
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);

        // Options
        const writeOptions: {
          palette: typeof palette;
          delay: number;
          dispose: number;
          transparent: boolean;
          repeat?: number;
        } = {
          palette,
          delay: delayMs,
          // DISPOSAL:
          // 2 (Restore to Background): Best for transparent animations so artifacts don't pile up.
          // 0 (Unspecified / Draw Over): Best for opaque video-like animations.
          dispose: transparent ? 2 : 0,
          transparent: transparent,
        };

        // Loop indefinitely (Netscape Block) - strictly on first frame
        if (frame === 0) {
          writeOptions.repeat = 0;
        }

        encoder.writeFrame(index, w, h, writeOptions);
      } else {
        throw new Error("gifenc quantization functions missing");
      }

      if (onProgress) {
        onProgress(Math.round(((frame + 1) / totalFrames) * 100));
      }
    }

    // Finish
    encoder.finish();
    const buffer = encoder.bytes();
    return new Blob([buffer], { type: "image/gif" });
  } catch (err) {
    console.error("GIF Generation Error:", err);
    throw err;
  } finally {
    if (document.body.contains(sandbox)) {
      document.body.removeChild(sandbox);
    }
  }
};
