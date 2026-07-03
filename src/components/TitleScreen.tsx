import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Skull, ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

export default function TitleScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/start-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: 'case_01' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize session (${response.status})`);
      }

      const caseData = await response.json();
      
      // Navigate to CaseWorld, passing state
      navigate('/case/case_01', { state: { caseData } });
    } catch (err: any) {
      console.error('Error starting case:', err);
      setError(err.message || 'Error communicating with secure gateway. Check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col justify-center items-center relative overflow-hidden select-none">
      {/* CRT Scanline / Distortion Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.04] z-50"></div>
      
      <div className="max-w-4xl w-full flex flex-col gap-8">
        {/* Header Block */}
        <header className="flex items-center gap-4 border-b border-[#222] pb-4">
          <div className="p-3 bg-[#111] border border-[#FFB000]/40 rounded-none animate-pulse">
            <Skull size={32} className="text-[#FFB000]" />
          </div>
          <div>
            <h1 className="font-mono text-2xl md:text-3xl font-black tracking-[0.3em] text-[#FFB000] uppercase">
              NOIR PROTOCOL
            </h1>
            <p className="font-mono text-[10px] text-[#555] tracking-widest uppercase">
              COGNITIVE GRAPH CASE MATRIX & PERSISTENCE NETWORK
            </p>
          </div>
        </header>

        {error && (
          <div className="border border-red-500/50 bg-red-950/20 p-4 font-mono text-xs text-red-400 flex items-start gap-3 rounded-none animate-fade-in">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold uppercase mb-1">SECURE_GATEWAY_FAILURE</p>
              <p className="leading-relaxed">{error}</p>
              <button
                onClick={handleStartCase}
                className="mt-3 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 px-3 py-1.5 font-bold uppercase cursor-pointer"
              >
                RE-ESTABLISH CONNECTION
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Case Dossier Box */}
          <div className="md:col-span-7 border border-[#333] bg-[#0c0c0c] p-6 relative flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFB000]/5 border-b border-l border-[#333] flex items-center justify-center text-[#FFB000]/40 font-mono text-xs">
              SEC-01
            </div>

            <div>
              <span className="text-[#FFB000] text-[10px] tracking-[0.2em] uppercase block font-bold mb-1">
                CLASSIFIED ACTIVE CASE DOSSIER
              </span>
              <h2 className="font-mono text-2xl font-black text-white tracking-wide uppercase mb-3 border-b border-[#222] pb-2">
                THE MIDNIGHT SERENADE
              </h2>
              
              <p className="font-mono text-xs text-[#999] leading-relaxed mb-4">
                A priceless masterpiece, <span className="text-[#FFB000]">"The Midnight Serenade"</span>, has been stolen from the highly secure private vault at the Lumina Gallery. In its place lies a masterful forgery. Simultaneously, a young, innocent child has been found unconscious in the gallery courtyard. The security logs show no alarms, and the biometric entries reveal only routine personnel visits. This is an inside job.
              </p>

              <div className="grid grid-cols-2 gap-3 text-left font-mono text-[11px] mb-4">
                <div className="p-2.5 bg-[#1a1a1a]/40 border border-[#222]">
                  <span className="text-[#666] uppercase block text-[8px]">PRIMARY SETTING</span>
                  <span className="text-white font-semibold">The Lumina Gallery</span>
                </div>
                <div className="p-2.5 bg-[#1a1a1a]/40 border border-[#222]">
                  <span className="text-[#666] uppercase block text-[8px]">SECURITY ENCRYPTION</span>
                  <span className="text-[#00ffd2] font-semibold">Active - Cognee DB v1.0</span>
                </div>
              </div>
            </div>

            <div className="border border-[#222] bg-[#050505] p-3 font-mono text-[10px] text-[#555] leading-relaxed">
              <p className="text-[#FFB000]/80 font-bold mb-1 uppercase tracking-wider">INVESTIGATION DIRECTIVES:</p>
              <p>1. Map coordinates across the 3x3 layout to discover physical clues.</p>
              <p>2. Establish persistent facts in the knowledge graph database.</p>
              <p>3. Question subjects. Confront them with contradictory clues to crack their alibi.</p>
              <p>4. Trigger the Twist paradigm engine by submitting formal files.</p>
            </div>
          </div>

          {/* Suspect Bios and Start Trigger */}
          <div className="md:col-span-5 border border-[#333] bg-[#0c0c0c] p-5 font-mono flex flex-col justify-between">
            <div>
              <span className="text-[#FFB000] text-[9px] tracking-widest font-bold uppercase block mb-3 border-b border-[#222] pb-1.5">
                [ VERIFIED SUSPECT INTERROGATION DOSSIERS ]
              </span>

              <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto mb-5 pr-1">
                <div className="p-2 bg-[#1a1a1a]/30 border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <p className="text-white font-semibold">Eleanor Voss</p>
                    <p className="text-[10px] text-[#666]">Refined, protective gallery curator</p>
                  </div>
                  <span className="text-[8px] bg-[#333] px-1.5 py-0.5 rounded uppercase font-bold text-[#FFB000]/90">Curator</span>
                </div>
                <div className="p-2 bg-[#1a1a1a]/30 border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <p className="text-white font-semibold">Rosa Delgado</p>
                    <p className="text-[10px] text-[#666]">Observant, nervous night cleaner</p>
                  </div>
                  <span className="text-[8px] bg-[#333] px-1.5 py-0.5 rounded uppercase font-bold text-[#FFB000]/90">Cleaner</span>
                </div>
                <div className="p-2 bg-[#1a1a1a]/30 border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <p className="text-white font-semibold">Priya Kapoor</p>
                    <p className="text-[10px] text-[#666]">Tense, private nanny of the child</p>
                  </div>
                  <span className="text-[8px] bg-[#333] px-1.5 py-0.5 rounded uppercase font-bold text-[#FFB000]/90">Nanny</span>
                </div>
                <div className="p-2 bg-[#1a1a1a]/30 border border-[#222] flex items-center justify-between text-xs">
                  <div>
                    <p className="text-white font-semibold">Marcus Reyes</p>
                    <p className="text-[10px] text-[#666]">Authoritative, procedural head of security</p>
                  </div>
                  <span className="text-[8px] bg-[#333] px-1.5 py-0.5 rounded uppercase font-bold text-[#FFB000]/90">Security</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartCase}
              disabled={loading}
              className="w-full bg-[#FFB000]/10 hover:bg-[#FFB000]/20 text-[#FFB000] border-2 border-[#FFB000]/50 py-3.5 rounded-none font-mono text-xs font-bold tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,176,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin text-[#FFB000]" size={14} />
                  SECURING NETWORK CHANNELS...
                </>
              ) : (
                <>
                  <Play size={14} />
                  BOOT INVESTIGATION SEQUENCE
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
