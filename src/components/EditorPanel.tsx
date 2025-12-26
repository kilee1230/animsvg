import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Download,
  Copy,
  Palette,
  Code,
  Undo,
  Redo,
  Check,
  History,
  Sparkles,
  Send,
  User,
  Bot,
  RotateCcw,
  Share,
} from "lucide-react";
import Button from "./Button";
import { GenerationStatus, SvgGenerationResponse, ChatMessage } from "../types";
import CodeEditor from "./CodeEditor";

interface EditorPanelProps {
  svgCode: string;
  onUpdateSvg: (newCode: string) => void;
  onAiRequest: (prompt: string) => void;
  status: GenerationStatus;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: SvgGenerationResponse[];
  currentIndex: number;
  onHistorySelect: (index: number) => void;
  chatMessages: ChatMessage[];
  onOpenGifModal: () => void;
}

// Memoized Thumbnail Component
const HistoryThumbnail = React.memo(
  ({ svgCode, size = "md" }: { svgCode: string; size?: "sm" | "md" }) => {
    const imgSrc = useMemo(() => {
      try {
        let processedSvg = svgCode.trim();
        if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
          processedSvg = processedSvg.replace(
            "<svg",
            '<svg xmlns="http://www.w3.org/2000/svg"'
          );
        }
        const base64 = btoa(unescape(encodeURIComponent(processedSvg)));
        return `data:image/svg+xml;base64,${base64}`;
      } catch (e) {
        console.error("Failed to generate thumbnail", e);
        return null;
      }
    }, [svgCode]);

    const sizeClasses = size === "sm" ? "w-10 h-10" : "w-16 h-16";

    if (!imgSrc) {
      return (
        <div
          className={`${sizeClasses} bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-[8px] text-zinc-400">Error</span>
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses} bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden flex-shrink-0 relative flex items-center justify-center transition-colors`}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `conic-gradient(#808080 90deg, transparent 90deg 180deg, #808080 180deg 270deg, transparent 270deg)`,
            backgroundSize: "8px 8px",
          }}
        />
        <img
          src={imgSrc}
          alt="History thumbnail"
          className="max-w-full max-h-full object-contain relative z-10"
          loading="lazy"
        />
      </div>
    );
  }
);

const EditorPanel: React.FC<EditorPanelProps> = ({
  svgCode,
  onUpdateSvg,
  onAiRequest,
  status,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  history,
  currentIndex,
  onHistorySelect,
  chatMessages,
  onOpenGifModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    "ai" | "colors" | "code" | "history"
  >("ai");
  const [colors, setColors] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [localCode, setLocalCode] = useState(svgCode);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalCode(svgCode);
    extractColors(svgCode);
  }, [svgCode]);

  useEffect(() => {
    if (activeTab === "history" && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history.length, activeTab]);

  useEffect(() => {
    if (activeTab === "ai") {
      const scrollToBottom = () => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }
      };

      scrollToBottom();
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [chatMessages.length, activeTab, status]);

  const extractColors = (svg: string) => {
    const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
    const matches = svg.match(colorRegex);
    if (matches) {
      const uniqueColors = Array.from(
        new Set(matches.map((c) => c.toLowerCase()))
      );
      setColors(uniqueColors);
    } else {
      setColors([]);
    }
  };

  const handleColorChange = (oldColor: string, newColor: string) => {
    const regex = new RegExp(oldColor, "gi");
    const newSvg = svgCode.replace(regex, newColor);
    onUpdateSvg(newSvg);
  };

  const handleCodeChange = (newVal: string) => {
    setLocalCode(newVal);
  };

  const applyCodeChange = () => {
    onUpdateSvg(localCode);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `animsvg-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length > 0) {
      setActiveTab("ai");
      onAiRequest(prompt.trim());
      setPrompt("");
    }
  };

  const handleRestoreFromChat = (code: string) => {
    onUpdateSvg(code);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLoading = status === GenerationStatus.LOADING;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 w-full md:w-[400px] flex-shrink-0 font-sans z-10 transition-colors duration-200">
      {/* Top Section: Tabs + Toolbar */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
        {/* Segmented Tabs */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
            {[
              { id: "ai", icon: Sparkles, label: "Chat" },
              { id: "colors", icon: Palette, label: "Colors" },
              { id: "code", icon: Code, label: "Code" },
              { id: "history", icon: History, label: "Versions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="px-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <div className="w-px bg-zinc-300 dark:bg-zinc-600 my-1" />
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGifModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              title="Export Animation"
            >
              <Share className="w-3 h-3" />
              Export
            </button>
            <button
              onClick={handleDownloadSvg}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium text-white bg-zinc-800 dark:bg-zinc-700 border border-zinc-900 dark:border-zinc-600 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors shadow-sm"
            >
              <Download className="w-3 h-3" />
              SVG
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Using Flexbox for stability */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
        {/* Chat Tab */}
        {activeTab === "ai" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {chatMessages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-6">
                <Sparkles className="w-10 h-10 mb-3 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Describe the SVG animation you want to create.
                </p>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    msg.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "bg-primary/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>

                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-tr-sm"
                        : "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Preview & Actions for AI messages that have SVG code */}
                  {msg.role === "model" && msg.svgCode && (
                    <div className="flex items-start gap-3 pl-1 flex-wrap">
                      <HistoryThumbnail svgCode={msg.svgCode} size="sm" />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestoreFromChat(msg.svgCode!)}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-primary dark:text-zinc-400 dark:hover:text-primary transition-colors bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => handleCopyCode(msg.svgCode!, msg.id)}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-primary dark:text-zinc-400 dark:hover:text-primary transition-colors bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedId === msg.id ? "Copied" : "Copy Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-primary/10">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
                    AI is thinking
                  </span>
                  <div className="flex gap-1 pt-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === "colors" && (
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            <div className="space-y-4">
              <div className="px-1 mt-2">
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Scene Colors
                </h3>
              </div>
              {colors.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                  <Palette className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">
                    No editable colors found.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {colors.map((color, idx) => (
                    <div
                      key={`${color}-${idx}`}
                      className="flex items-center gap-3 bg-white dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-sm"
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) =>
                            handleColorChange(color, e.target.value)
                          }
                          className="w-8 h-8 rounded-md cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                        />
                        <div className="absolute inset-0 border border-zinc-200 dark:border-zinc-600 rounded-md pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono text-zinc-600 dark:text-zinc-300 block truncate">
                          {color}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Tab */}
        {activeTab === "code" && (
          <div className="flex-1 flex flex-col min-h-0 px-4 py-2">
            <div className="flex justify-between items-center mb-3 px-1 flex-shrink-0">
              <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Source Code
              </h3>
              <button
                onClick={applyCodeChange}
                className="flex items-center gap-1 text-[10px] bg-green-50 dark:bg-green-900/30 text-primary hover:bg-green-100 dark:hover:bg-green-900/50 px-2 py-1 rounded transition-colors border border-green-200 dark:border-green-800"
              >
                <Check className="w-3 h-3" /> Apply
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <CodeEditor
                value={localCode}
                onChange={handleCodeChange}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            <div className="space-y-3 mt-2">
              <div className="px-1 flex justify-between items-center">
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Version History
                </h3>
                <span className="text-[10px] text-zinc-400">
                  {history.length} versions
                </span>
              </div>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    ref={idx === history.length - 1 ? historyEndRef : null}
                    onClick={() => onHistorySelect(idx)}
                    className={`group cursor-pointer flex gap-3 p-2 rounded-xl border transition-all duration-200 ${
                      idx === currentIndex
                        ? "bg-white dark:bg-zinc-800/80 border-primary ring-1 ring-primary/20 shadow-sm"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Thumbnail Component */}
                    <HistoryThumbnail svgCode={item.svgCode} />

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            idx === currentIndex
                              ? "bg-primary text-white"
                              : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300"
                          }`}
                        >
                          v{idx + 1}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wide">
                            Original
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs leading-snug line-clamp-2 ${
                          idx === currentIndex
                            ? "text-zinc-800 dark:text-zinc-100"
                            : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                        }`}
                      >
                        {item.explanation || "Manual edit"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Chat Input - Always Visible */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 z-30">
        <div className="relative flex items-end gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe changes or a new animation..."
            className="w-full max-h-60 min-h-[44px] bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none resize-y py-2.5 px-2 custom-scrollbar"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAiSubmit(e);
              }
            }}
          />
          <Button
            onClick={handleAiSubmit as React.MouseEventHandler}
            variant="primary"
            disabled={prompt.trim().length === 0 || isLoading}
            isLoading={isLoading}
            className="mb-1 rounded-lg px-3 py-2 h-9"
          >
            {!isLoading && <Send className="w-4 h-4" />}
          </Button>
        </div>
        <div className="text-[10px] text-center text-zinc-400 mt-2">
          Gemini 3.0 Pro can make mistakes. Check code.
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
