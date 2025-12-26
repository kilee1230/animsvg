import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize, Grid, Loader2 } from 'lucide-react';

interface SvgPreviewProps {
  svgCode: string;
  explanation?: string;
  isLoading?: boolean;
  isDarkMode?: boolean;
}

const SvgPreview: React.FC<SvgPreviewProps> = ({ svgCode, explanation, isLoading = false, isDarkMode = false }) => {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const gridColor = isDarkMode ? '#27272a' : '#d4d4d8'; // zinc-800 : zinc-300

  // Sanitize and prepare SVG code
  const prepareSvg = (code: string) => {
    if (!code) return '';
    // Remove XML declaration if present
    return code.replace(/<\?xml.*?\?>/g, '').trim();
  };

  const safeSvgCode = prepareSvg(svgCode);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-[#f4f4f5] dark:bg-[#09090b] relative overflow-hidden transition-colors duration-200"
    >
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-black/5 dark:shadow-black/50">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-1.5 mt-2">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">Generating Animation...</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Crafting code with Gemini 3.0 Pro</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar - Moved to Left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg shadow-black/5 dark:shadow-black/20">
        <button 
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-zinc-400'}`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
        <button 
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="p-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        {/* Clickable Zoom Percentage (Reset Zoom) */}
        <button 
          onClick={() => setZoom(1)}
          className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-12 text-center hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          title="Click to Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button 
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          className="p-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

        <button 
          onClick={toggleFullscreen}
          className={`p-2 rounded transition-colors ${isFullscreen ? 'text-primary hover:bg-primary/10' : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Info Badge - Moved to Right */}
      {explanation && !isLoading && (
        <div className="absolute top-4 right-4 z-10 max-w-xs md:max-w-sm pointer-events-none">
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-lg shadow-black/5 dark:shadow-black/20 pointer-events-auto">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <span className="text-primary font-semibold">AI Note:</span> {explanation}
            </p>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative custom-scrollbar z-0">
        
        {/* Background Grid */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 -z-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* SVG Container / Artboard */}
        <div 
          className="transition-transform duration-200 ease-out origin-center relative z-10"
          style={{ transform: `scale(${zoom})` }}
        >
           {/* 
              We use a specific class to target the injected SVG via standard CSS.
              This ensures that even if the SVG lacks width/height attributes, it has a default size.
           */}
           <div 
             className="preview-svg-wrapper bg-transparent flex items-center justify-center shadow-sm"
             dangerouslySetInnerHTML={{ __html: safeSvgCode }} 
           />
           <style>{`
             .preview-svg-wrapper svg {
               display: block;
               overflow: visible;
             }
             /* If the SVG has no explicit dimensions, give it a default reasonable size */
             .preview-svg-wrapper svg:not([width]):not([height]) {
               width: 100%;
               height: 100%;
               min-width: 400px;
               min-height: 400px;
             }
             /* Ensure responsive behavior if dimensions are percentage based */
             .preview-svg-wrapper svg[width*="%"] {
               min-width: 400px;
               min-height: 400px;
             }
           `}</style>
        </div>
      </div>
    </div>
  );
};

export default SvgPreview;

