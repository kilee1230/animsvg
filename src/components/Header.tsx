import React from 'react';
import { Sparkles, Command, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-green-400 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-zinc-800 dark:text-zinc-100">
            AnimSVG <span className="text-primary font-mono text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 font-medium">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           <span className="hidden md:flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
             <Command className="w-3 h-3" /> 
             Powered by Gemini 3.0 Pro
           </span>
           
           <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 hidden md:block"></div>

           <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

