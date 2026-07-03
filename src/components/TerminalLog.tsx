import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CornerDownLeft } from 'lucide-react';

interface TerminalLogProps {
  logs: string[];
  onCommand: (cmd: string) => void;
}

export default function TerminalLog({ logs, onCommand }: TerminalLogProps) {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onCommand(input.trim());
    setInput('');
  };

  return (
    <div className="bg-[#050505] border border-[#333] rounded-lg p-3 font-mono text-xs flex flex-col gap-2 shadow-2xl h-[240px] relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.04]"></div>

      <div className="flex items-center justify-between border-b border-[#333] pb-1 text-[10px] text-[#00ffd2]/60 font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <Terminal size={12} className="animate-pulse text-[#00ffd2]" />
          CASE CONSOLE TERMINAL
        </span>
        <span>INTELLIGENCE_STREAM_LIVE</span>
      </div>

      {/* Log Output Stream */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 text-[#00ffd2] font-mono select-text leading-relaxed">
        {logs.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap">
            <span className="text-[#00ffd2]/40 mr-1.5">&gt;</span>
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="border-t border-[#333] pt-2 flex items-center gap-2">
        <span className="text-[#00ffd2]/60 font-bold select-none animate-pulse">NOIR_DB_USER@CASE_SYSTEM:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type "help" to view full command index...'
          className="flex-1 bg-transparent text-white outline-none border-none font-mono text-xs placeholder:text-[#333]"
        />
        <button
          type="submit"
          className="text-[#00ffd2] hover:text-white p-1 rounded hover:bg-[#00ffd2]/10 transition-colors flex items-center justify-center cursor-pointer"
        >
          <CornerDownLeft size={14} />
        </button>
      </form>
    </div>
  );
}
