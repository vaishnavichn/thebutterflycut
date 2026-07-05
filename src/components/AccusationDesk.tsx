import React, { useState } from 'react';
import { Suspect, Clue } from '../types';
import { ShieldAlert, AlertTriangle, Play, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface AccusationDeskProps {
  suspects: Suspect[];
  discoveredClues: Clue[];
  onAccuseCulprit: (suspectId: string, contradictingClueTitle: string) => void;
  accusationFeedback: string | null;
  paradigmShiftsCount: number;
  onAdvanceCase: () => void;
  isSolved: boolean;
  isShifting: boolean;
  activeCaseId: number;
}

export default function AccusationDesk({
  suspects,
  discoveredClues,
  onAccuseCulprit,
  accusationFeedback,
  paradigmShiftsCount,
  onAdvanceCase,
  isSolved,
  isShifting,
  activeCaseId
}: AccusationDeskProps) {
  const [selectedSuspectId, setSelectedSuspectId] = useState('');
  const [selectedClueTitle, setSelectedClueTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuspectId || !selectedClueTitle) return;
    onAccuseCulprit(selectedSuspectId, selectedClueTitle);
  };

  return (
    <div className="bg-[#080808] p-4 border border-[#333] rounded-lg shadow-2xl relative">
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]"></div>

      <div className="flex items-center justify-between border-b border-[#333] pb-2 mb-4">
        <h3 className="font-mono text-xs tracking-widest text-[#00ffd2] uppercase flex items-center gap-2">
          <ShieldAlert size={16} className={isShifting ? 'animate-spin text-red-500' : 'text-[#00ffd2]'} />
          [ ACCUSATION DESK — THE PARADIGM SHIFT ]
        </h3>
        <span className="font-mono text-[9px] text-[#555]">PARADIGM_SHIFTS_LOGGED: {paradigmShiftsCount}</span>
      </div>

      {isSolved ? (
        <div className="bg-[#00221a] border border-[#00ffd2]/30 p-6 rounded-none text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="w-12 h-12 bg-[#0c0c0c] border border-[#00ffd2] rounded-none flex items-center justify-center text-[#00ffd2]">
            <CheckCircle2 size={24} className="animate-bounce text-[#00ffd2]" />
          </div>
          <h4 className="font-mono text-white font-bold text-sm uppercase tracking-widest">
            Case {activeCaseId} Solved Successfully!
          </h4>
          <p className="font-mono text-xs text-[#bbb] max-w-md leading-relaxed">
            Your deduction was pristine. The suspect has cracked under pressure, confessed, and has been taken into custody.
          </p>
          {activeCaseId < 5 ? (
            <button
              onClick={onAdvanceCase}
              className="mt-2 bg-[#00ffd2]/10 hover:bg-[#00ffd2]/20 text-[#00ffd2] border border-[#00ffd2]/40 px-4 py-2 rounded-none font-mono text-xs font-semibold tracking-wider flex items-center gap-2 cursor-pointer transition-all duration-300"
            >
              <Sparkles size={14} />
              ADVANCE TO NEXT CASE
            </button>
          ) : (
            <div className="mt-2 text-[11px] font-mono text-orange-500 font-semibold uppercase tracking-widest border border-orange-900/30 bg-[#1a1300] px-4 py-2 rounded-none">
              🏆 Infinite Noir Mastered. All Cases Concluded.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col md:grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3 font-mono">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#666] uppercase tracking-widest">1. Name the Primary Culprit</label>
              <select
                value={selectedSuspectId}
                onChange={(e) => setSelectedSuspectId(e.target.value)}
                required
                className="bg-[#0c0c0c] border border-[#333] text-[#d1d5db] px-3 py-2 rounded-none text-xs focus:outline-none focus:border-[#00ffd2] cursor-pointer"
              >
                <option value="" disabled className="bg-[#050505]">-- Select Suspect --</option>
                {suspects.map((sus) => (
                  <option key={sus.id} value={sus.id} className="bg-[#0c0c0c]">
                    {sus.name} ({sus.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#666] uppercase tracking-widest">2. Select Contradictory Clue</label>
              <select
                value={selectedClueTitle}
                onChange={(e) => setSelectedClueTitle(e.target.value)}
                required
                className="bg-[#0c0c0c] border border-[#333] text-[#d1d5db] px-3 py-2 rounded-none text-xs focus:outline-none focus:border-[#00ffd2] cursor-pointer"
              >
                <option value="" disabled className="bg-[#050505]">-- Select Evidence from Graph --</option>
                {discoveredClues.map((clue) => (
                  <option key={clue.id} value={clue.title} className="bg-[#0c0c0c]">
                    {clue.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isShifting || !selectedSuspectId || !selectedClueTitle}
              className={`
                mt-2 py-2.5 rounded-none font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border
                ${isShifting 
                  ? 'bg-[#120000] border-red-900/40 text-red-400 animate-pulse' 
                  : 'bg-[#00ffd2]/10 hover:bg-[#00ffd2]/20 border-[#00ffd2]/40 text-[#00ffd2] hover:shadow-[0_0_15px_rgba(0,255,210,0.15)]'
                }
              `}
            >
              {isShifting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  CALCULATING REALITY TRANSFORMATION...
                </>
              ) : (
                <>
                  <Play size={14} />
                  LAUNCH FORMAL ACCUSATION
                </>
              )}
            </button>
          </div>

          {/* Feedback section, showing either Shift narrative or error logs */}
          <div className="border border-[#333] bg-[#0c0c0c] rounded-none p-3 flex flex-col justify-between min-h-[160px] font-mono">
            <div>
              <span className="text-[9px] text-[#666] uppercase tracking-widest flex items-center gap-1 mb-2">
                <AlertTriangle size={12} className={accusationFeedback?.includes('TWIST') ? 'text-red-500 animate-bounce' : 'text-[#444]'} />
                {accusationFeedback?.includes('TWIST') ? 'THE PARADIGM SHIFT REGISTERED' : 'ACCUSATION VERIFICATION FEEDBACK'}
              </span>
              <div className="text-[11px] text-[#bbb] leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                {accusationFeedback ? (
                  <p className={accusationFeedback.includes('TWIST') ? 'text-red-400 italic font-medium border-l-2 border-red-500 pl-2' : ''}>
                    {accusationFeedback}
                  </p>
                ) : (
                  <span className="text-[#666] italic">
                    Accusing the wrong suspect triggers a reality shift. The game will re-fabricate evidence, shift culprit allocations, and reconstruct the alibis of other NPCs dynamically through the Gemini Case Engine.
                  </span>
                )}
              </div>
            </div>

            <div className="text-[8px] text-[#555] border-t border-[#222] pt-2 mt-2 flex justify-between items-center">
              <span>COGNEE_SHIFT_PROTOCOL Active</span>
              <span>ENGINE: GEMINI-3.5-FLASH</span>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
