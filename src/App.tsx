import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import EditorPanel from "./components/EditorPanel";
import SvgPreview from "./components/SvgPreview";
import GifExportModal from "./components/GifExportModal";
import { generateOrRefineSvg } from "./services/geminiService";
import { GenerationStatus, SvgGenerationResponse, ChatMessage } from "./types";

const INITIAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <circle cx="100" cy="100" r="50" fill="#78c95a">
    <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
  </circle>
  <text x="50%" y="180" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="12">
    Ready to create...
  </text>
</svg>`;

const INITIAL_STATE: SvgGenerationResponse = {
  svgCode: INITIAL_SVG,
  explanation: "Describe an animation in the AI Studio to get started.",
};

const STORAGE_KEYS = {
  HISTORY: "animsvg_history",
  MESSAGES: "animsvg_messages",
  THEME: "animsvg_theme",
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);

  // Initialize Theme State: Check LocalStorage first, then System Preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        return savedTheme === "dark";
      }
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return true;
      }
    }
    return false;
  });

  // State initialization with LocalStorage check
  const [history, setHistory] = useState<SvgGenerationResponse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [INITIAL_STATE];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return savedHistory ? JSON.parse(savedHistory).length - 1 : 0;
  });

  const currentSvg = history[currentIndex] || INITIAL_STATE;

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Theme Effect: Apply class and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEYS.THEME, "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const addToHistory = (newState: SvgGenerationResponse) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleHistorySelect = (index: number) => {
    setCurrentIndex(index);
  };

  const handleAiRequest = async (prompt: string) => {
    setStatus(GenerationStatus.LOADING);

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      // Pass the current SVG code as context so the model can choose to refine it
      const result = await generateOrRefineSvg(prompt, currentSvg.svgCode);

      addToHistory(result);

      // Add AI Message with the SVG snapshot
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: result.explanation || "Animation generated successfully.",
        timestamp: Date.now(),
        svgCode: result.svgCode,
      };
      setChatMessages((prev) => [...prev, aiMsg]);

      setStatus(GenerationStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content:
          "Sorry, I encountered an error while generating the animation. Please try again.",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleUpdateSvg = (newCode: string) => {
    // Only update if code actually changed
    if (newCode !== currentSvg.svgCode) {
      addToHistory({
        ...currentSvg,
        svgCode: newCode,
        explanation: "Manual code edit",
      });
    }
  };

  return (
    <div className="h-screen bg-background dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 overflow-hidden">
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side - Editor & Controls */}
        <div className="order-2 md:order-1 flex-shrink-0 z-20 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 relative h-1/2 md:h-full md:w-[400px]">
          <EditorPanel
            svgCode={currentSvg.svgCode}
            onUpdateSvg={handleUpdateSvg}
            onAiRequest={handleAiRequest}
            status={status}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={currentIndex > 0}
            canRedo={currentIndex < history.length - 1}
            history={history}
            currentIndex={currentIndex}
            onHistorySelect={handleHistorySelect}
            chatMessages={chatMessages}
            onOpenGifModal={() => setIsGifModalOpen(true)}
          />
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 flex flex-col min-w-0 order-1 md:order-2 h-1/2 md:h-full relative">
          <SvgPreview
            svgCode={currentSvg.svgCode}
            explanation={currentSvg.explanation}
            isLoading={status === GenerationStatus.LOADING}
            isDarkMode={isDarkMode}
          />
        </div>
      </main>

      <GifExportModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        svgCode={currentSvg.svgCode}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default App;
