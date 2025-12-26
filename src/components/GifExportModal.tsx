import React, { useState, useEffect } from "react";
import {
  X,
  Film,
  Download,
  Clock,
  Zap,
  Maximize,
  AlertCircle,
  Video,
} from "lucide-react";
import Button from "./Button";
import { generateGifBlob, GifOptions } from "../services/gifService";
import { generateVideoBlob, VideoOptions } from "../services/videoService";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgCode: string;
  isDarkMode: boolean;
}

const GifExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  svgCode,
  isDarkMode,
}) => {
  const [format, setFormat] = useState<"gif" | "mp4">("mp4");
  const [duration, setDuration] = useState(3);
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState(500);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isTransparent, setIsTransparent] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGeneratedUrl(null);
      setProgress(0);
      setError(null);
      setBgColor(isDarkMode ? "#09090b" : "#ffffff");
      // Default Settings
      setFormat("mp4");
    }
  }, [isOpen, isDarkMode]);

  // Handle format switch logic/constraints
  useEffect(() => {
    if (format === "mp4") {
      setIsTransparent(false);
      setFps(30);
    }
  }, [format]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setGeneratedUrl(null);

    try {
      await new Promise((r) => setTimeout(r, 100));

      if (format === "gif") {
        const options: GifOptions = {
          duration,
          fps,
          width: resolution,
          height: resolution,
          backgroundColor: bgColor,
          transparent: isTransparent,
        };
        const blob = await generateGifBlob(svgCode, options, setProgress);
        setGeneratedUrl(URL.createObjectURL(blob));
      } else if (format === "mp4") {
        const options: VideoOptions = {
          duration,
          fps,
          width: resolution,
          height: resolution,
          backgroundColor: bgColor,
        };
        const blob = await generateVideoBlob(svgCode, options, setProgress);
        setGeneratedUrl(URL.createObjectURL(blob));
      }
    } catch (err: unknown) {
      // Show actual error message if available
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to generate ${format.toUpperCase()}.`;
      setError(errorMessage);
      console.error("Export Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedUrl) {
      const link = document.createElement("a");
      link.href = generatedUrl;
      const ext = format === "mp4" ? "mp4" : "gif";
      link.download = `animsvg-export-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Export Animation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Settings Column */}
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <button
                    onClick={() => setFormat("mp4")}
                    className={`flex flex-col md:flex-row items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                      format === "mp4"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> MP4
                  </button>
                  <button
                    onClick={() => setFormat("gif")}
                    className={`flex flex-col md:flex-row items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                      format === "gif"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" /> GIF
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Settings
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Duration
                      </label>
                      <span className="text-xs font-mono text-zinc-500">
                        {duration}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value))}
                      className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" /> Frame Rate
                      </label>
                      <span className="text-xs font-mono text-zinc-500">
                        {fps} FPS
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[10, 15, 20, 30, 60].map((val) => (
                        <button
                          key={val}
                          onClick={() => setFps(val)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${
                            fps === val
                              ? "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-100"
                              : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Output
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Maximize className="w-3.5 h-3.5" /> Size (px)
                      </label>
                      <span className="text-xs font-mono text-zinc-500">
                        {resolution}x{resolution}
                      </span>
                    </div>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(parseInt(e.target.value))}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={256}>Small (256px)</option>
                      <option value={500}>Medium (500px)</option>
                      <option value={800}>Large (800px)</option>
                    </select>
                  </div>

                  {/* Transparent Toggle (GIF Only - MP4 Forced Off) */}
                  <div
                    className={
                      format !== "gif" ? "opacity-50 pointer-events-none" : ""
                    }
                  >
                    <button
                      onClick={() => setIsTransparent(!isTransparent)}
                      disabled={format !== "gif"}
                      className="flex items-center gap-3 w-full group text-left"
                    >
                      <div
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${
                          isTransparent
                            ? "bg-primary"
                            : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                            isTransparent ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Transparent Background
                      </span>
                    </button>
                  </div>

                  <div
                    className={`transition-opacity duration-200 ${
                      isTransparent
                        ? "opacity-40 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                      Background Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-8 w-12 p-0 border-0 rounded overflow-hidden cursor-pointer"
                      />
                      <span className="text-xs font-mono text-zinc-500 uppercase">
                        {bgColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
                  {format === "mp4"
                    ? "MP4 Video is the best format for WhatsApp, Instagram, and macOS."
                    : "GIFs are universal but have lower quality. Transparency enabled."}
                </p>
              </div>
            </div>

            {/* Preview Column */}
            <div className="flex flex-col gap-4">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Preview
              </label>
              <div className="flex-1 min-h-[250px] bg-zinc-100 dark:bg-zinc-950/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative overflow-hidden">
                {/* Checkerboard for Transparency */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `conic-gradient(#808080 90deg, transparent 90deg 180deg, #808080 180deg 270deg, transparent 270deg)`,
                    backgroundSize: "16px 16px",
                  }}
                />

                {!generatedUrl && !isGenerating && (
                  <div className="text-center p-6 opacity-50 relative z-10">
                    <Film className="w-12 h-12 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm text-zinc-500">Ready to generate</p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-16 h-16 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-zinc-200 dark:text-zinc-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-primary transition-all duration-200"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 - (175.9 * progress) / 100}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">
                        {progress}%
                      </span>
                    </div>
                    <p className="text-sm font-medium animate-pulse relative z-10 bg-white/50 dark:bg-black/50 px-2 py-1 rounded">
                      Rendering {format.toUpperCase()}...
                    </p>
                  </div>
                )}

                {generatedUrl &&
                  !isGenerating &&
                  (format === "gif" ? (
                    <img
                      src={generatedUrl}
                      alt="Generated"
                      className="max-w-full max-h-full object-contain shadow-lg relative z-10"
                    />
                  ) : (
                    <video
                      src={generatedUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      muted
                      className="max-w-full max-h-full object-contain shadow-lg relative z-10"
                    />
                  ))}
              </div>

              {error && (
                <p className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>

          {!generatedUrl ? (
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              icon={<Zap className="w-4 h-4" />}
            >
              Generate {format === "gif" ? "GIF" : "Video"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleGenerate}
                icon={<Zap className="w-4 h-4" />}
              >
                Regenerate
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
                icon={<Download className="w-4 h-4" />}
              >
                Download {format.toUpperCase()}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GifExportModal;
