import React, { useRef } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, className = '' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync scroll positions
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const highlightCode = (code: string) => {
    if (!code) return '';
    
    // Split into tokens: Comments vs Tags vs Text
    // Regex splits by: 
    // 1. Comments (<!-- ... -->)
    // 2. Tags (< ... >)
    const tokens = code.split(/(<!--[\s\S]*?-->|<[^>]*>)/g);

    return tokens.map((token) => {
      // 1. Comments
      if (token.startsWith('<!--')) {
        return `<span class="text-zinc-400 italic">${escapeHtml(token)}</span>`;
      }
      
      // 2. Tags
      if (token.startsWith('<')) {
        let content = escapeHtml(token);
        
        // Highlight Tag Name (start)
        // Matches &lt;tag or &lt;/tag
        content = content.replace(
            /^(&lt;\/?)([\w:-]+)/, 
            '$1<span class="text-rose-600 dark:text-rose-400 font-bold">$2</span>'
        );
        
        // Highlight Attributes & Values
        // Looks for: space + name + = + value
        content = content.replace(
            /(\s+)([\w:-]+)(=)(".*?"|'.*?')/g,
            (_match, space, name, eq, val) => {
                return `${space}<span class="text-violet-600 dark:text-violet-400">${name}</span><span class="text-zinc-500">${eq}</span><span class="text-emerald-600 dark:text-emerald-400">${val}</span>`;
            }
        );

        return `<span class="text-zinc-500 dark:text-zinc-500">${content}</span>`;
      }
      
      // 3. Text Content / Whitespace
      return `<span class="text-zinc-700 dark:text-zinc-300">${escapeHtml(token)}</span>`;
    }).join('');
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Syntax Highlighted Background Layer */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 m-0 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all pointer-events-none z-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-transparent"
        dangerouslySetInnerHTML={{ __html: highlightCode(value) + '<br/>' }} 
      />

      {/* Transparent Editable Layer */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all bg-transparent text-transparent caret-zinc-900 dark:caret-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none z-10 custom-scrollbar selection:bg-blue-500/30"
      />
    </div>
  );
};

export default CodeEditor;

