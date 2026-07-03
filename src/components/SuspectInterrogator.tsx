import React, { useState, useEffect, useRef } from 'react';
import { Suspect, Clue, InterrogationMessage } from '../types';
import { MessageSquare, ShieldAlert, Send, HelpCircle, AlertTriangle } from 'lucide-react';

interface SuspectInterrogatorProps {
  suspects: Suspect[];
  activeSuspectId: string | null;
  onSelectSuspect: (id: string) => void;
  discoveredClues: Clue[];
  messages: InterrogationMessage[];
  onSendMessage: (text: string) => void;
  onConfrontSuspect: (clue: Clue) => void;
  isChatLoading: boolean;
}

export default function SuspectInterrogator({
  suspects,
  activeSuspectId,
  onSelectSuspect,
  discoveredClues,
  messages,
  onSendMessage,
  onConfrontSuspect,
  isChatLoading
}: SuspectInterrogatorProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeSuspect = suspects.find(s => s.id === activeSuspectId);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-[#080808] p-4 border border-[#333] rounded-lg shadow-2xl relative">
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]"></div>

      {/* Left panel: List of suspects */}
      <div className="lg:col-span-1 border-r border-[#333] pr-4 flex flex-col gap-3">
        <h3 className="font-mono text-xs tracking-widest text-[#00ffd2] uppercase border-b border-[#333] pb-2 flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#00ffd2]" />
          [ SUBJECTS OF INTEREST ]
        </h3>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px]">
          {suspects.map((sus) => {
            const isActive = sus.id === activeSuspectId;
            return (
              <button
                key={sus.id}
                onClick={() => onSelectSuspect(sus.id)}
                className={`
                  w-full text-left p-3 border font-mono transition-all duration-300 rounded-none relative
                  ${isActive 
                    ? 'bg-[#00221a] border-[#00ffd2]/50 text-[#00ffd2] shadow-[0_0_10px_rgba(0,255,210,0.15)]' 
                    : 'bg-[#0c0c0c] border-[#333] text-[#888] hover:border-[#00ffd2]/40 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-xs ${isActive ? 'text-white' : 'text-[#bbb]'}`}>
                    {sus.name}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase ${
                    isActive ? 'bg-[#00ffd2] text-black' : 'bg-[#333] text-white'
                  }`}>
                    {sus.role}
                  </span>
                </div>
                
                {/* Alibi preview */}
                <p className={`text-[9px] mt-2 italic leading-normal truncate ${isActive ? 'text-[#00ffd2]/80' : 'text-[#666]'}`}>
                  Last seen: "{sus.alibi}"
                </p>

                {isActive && (
                  <div className="absolute right-2 bottom-2 w-1.5 h-1.5 bg-[#00ffd2] rounded-full animate-ping"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic interrogation tips */}
        <div className="mt-auto bg-[#030303] border border-[#222] p-2.5 rounded-none font-mono text-[9px] text-[#555]">
          <p className="text-[#00ffd2]/70 font-semibold mb-1 uppercase tracking-wider">Interrogation Directives:</p>
          <ul className="list-disc pl-3 space-y-1">
            <li>Confront a suspect using discovered clues from the panel on the right.</li>
            <li>Free-text interrogate below; the AI models simulate their psychological responses.</li>
          </ul>
        </div>
      </div>

      {/* Main & Right area: Chat console & Clue confrontations */}
      <div className="lg:col-span-2 flex flex-col md:grid md:grid-cols-3 gap-3 min-h-[400px]">
        {activeSuspect ? (
          <>
            {/* Interrogation Terminal Console */}
            <div className="md:col-span-2 flex flex-col border border-[#333] bg-[#0c0c0c] rounded-none overflow-hidden h-[380px] md:h-auto">
              <div className="bg-[#050505] p-2 border-b border-[#333] flex items-center justify-between font-mono text-[10px]">
                <span className="text-[#00ffd2] flex items-center gap-1.5 font-bold uppercase">
                  <MessageSquare size={12} />
                  INTERROGATION ROOM: {activeSuspect.name}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectSuspect(null as any)}
                  className="px-2 py-0.5 bg-red-950/50 border border-red-500/30 text-red-400 hover:bg-red-900/60 transition-colors font-bold uppercase text-[9px] cursor-pointer"
                >
                  [ CLOSE INTERROGATION ]
                </button>
              </div>

              {/* Chat Log Window */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 font-mono text-xs max-h-[280px]">
                {messages.length === 0 ? (
                  <div className="text-center my-auto flex flex-col items-center justify-center text-[#555] p-4">
                    <HelpCircle size={32} className="opacity-40 animate-pulse mb-1 text-[#00ffd2]" />
                    <span>The suspect sits in silence. Type a question or select a confrontation topic.</span>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col max-w-[85%] rounded-none p-2.5 leading-relaxed ${
                        msg.sender === 'player'
                          ? 'bg-[#050505] border border-[#00ffd2]/30 text-[#00ffd2] self-end text-right'
                          : 'bg-[#1a1300] border border-orange-900/30 text-[#d1d5db] self-start text-left'
                      }`}
                    >
                      <span className={`text-[8px] uppercase tracking-wider mb-1 block opacity-60 ${
                        msg.sender === 'player' ? 'text-[#00ffd2]' : 'text-orange-400 font-bold'
                      }`}>
                        {msg.sender === 'player' ? 'DETECTIVE' : activeSuspect.name}
                      </span>
                      <span className="whitespace-pre-wrap select-text">{msg.text}</span>
                    </div>
                  ))
                )}
                
                {isChatLoading && (
                  <div className="bg-[#00221a] border border-[#00ffd2]/20 text-[#00ffd2] p-2 rounded-none self-start flex items-center gap-2 animate-pulse max-w-[50%]">
                    <span className="w-1.5 h-1.5 bg-[#00ffd2] rounded-full animate-bounce"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Formulating response...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* User text form */}
              <form onSubmit={handleSend} className="p-2 bg-[#050505] border-t border-[#333] flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isChatLoading}
                  placeholder={`Ask ${activeSuspect.name} about their alibi or whereabouts...`}
                  className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#00ffd2] px-3 py-1.5 rounded-none font-mono text-xs focus:outline-none focus:border-[#00ffd2] placeholder:text-[#333]"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputText.trim()}
                  className="bg-[#00ffd2]/10 hover:bg-[#00ffd2]/20 text-[#00ffd2] border border-[#00ffd2]/40 px-3 py-1.5 rounded-none font-mono text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Send size={12} />
                  SEND
                </button>
              </form>
            </div>

            {/* Right side confrontation desk */}
            <div className="md:col-span-1 border border-[#333] bg-[#0c0c0c] rounded-none p-2.5 flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-wider text-[#00ffd2] uppercase font-semibold flex items-center gap-1 border-b border-[#333] pb-1.5">
                <AlertTriangle size={12} className="text-orange-500" />
                CONFRONT WITH CLUES
              </span>

              <div className="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-1.5 pr-1">
                {discoveredClues.length === 0 ? (
                  <div className="font-mono text-[9px] text-[#555] text-center py-6 italic">
                    No clues discovered yet. Explore room coordinates to find evidence.
                  </div>
                ) : (
                  discoveredClues.map((clue) => {
                    const matchesTrigger = activeSuspect.contradictionTrigger === clue.title;
                    return (
                      <button
                        key={clue.id}
                        onClick={() => onConfrontSuspect(clue)}
                        className={`
                          w-full p-2 border font-mono text-left rounded-none transition-all duration-200
                          ${matchesTrigger 
                            ? 'bg-[#120000] border-red-950 hover:border-red-500 text-[#d1d5db]' 
                            : 'bg-[#050505] border-[#222] text-[#888] hover:border-[#333] hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold truncate leading-tight flex-1">
                            {clue.title}
                          </span>
                          {matchesTrigger && (
                            <span className="text-[7px] px-1 py-0.25 bg-red-950 border border-red-500 text-red-400 rounded animate-pulse">
                              CONTRADICTS
                            </span>
                          )}
                        </div>
                        <p className="text-[8px] text-[#666] leading-normal truncate">
                          {clue.description}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#333] rounded-none">
            <MessageSquare size={36} className="text-[#333] mb-2 animate-pulse" />
            <p className="font-mono text-xs text-[#555]">
              Select a suspect from the list to begin the interrogation sequence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
