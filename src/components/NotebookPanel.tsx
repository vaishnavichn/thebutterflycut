import React, { useState } from 'react';
import { Clue, Suspect, CaseGraph } from '../types';
import { BookOpen, User, FileText, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface NotebookPanelProps {
  discoveredClues: Clue[];
  suspects: Suspect[];
  graph: CaseGraph;
  activeCaseTitle: string;
}

export default function NotebookPanel({
  discoveredClues,
  suspects,
  graph,
  activeCaseTitle
}: NotebookPanelProps) {
  const [activeTab, setActiveTab] = useState<'clues' | 'suspects' | 'graph'>('clues');

  // Find if a suspect has confessed/cracked based on graph nodes
  const hasConfessed = (suspectId: string) => {
    return graph.nodes.some(n => n.id === `${suspectId}_confession`);
  };

  return (
    <div className="flex flex-col gap-4 bg-[#080808] p-4 border border-[#333] rounded-lg shadow-2xl relative h-[500px]">
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333] pb-2">
        <h3 className="font-mono text-xs tracking-widest text-[#FFB000] uppercase flex items-center gap-2">
          <BookOpen size={16} className="text-[#FFB000]" />
          [ DETECTIVE NOTEBOOK ]
        </h3>
        <span className="font-mono text-[8px] text-[#666] uppercase">{activeCaseTitle}</span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border border-[#333] bg-[#050505] p-1 font-mono text-[10px]">
        <button
          onClick={() => setActiveTab('clues')}
          className={`py-1.5 font-bold uppercase transition-all duration-300 ${
            activeTab === 'clues'
              ? 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/40'
              : 'text-[#666] hover:text-[#bbb]'
          }`}
        >
          Clues ({discoveredClues.length})
        </button>
        <button
          onClick={() => setActiveTab('suspects')}
          className={`py-1.5 font-bold uppercase transition-all duration-300 ${
            activeTab === 'suspects'
              ? 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/40'
              : 'text-[#666] hover:text-[#bbb]'
          }`}
        >
          Suspects ({suspects.length})
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`py-1.5 font-bold uppercase transition-all duration-300 ${
            activeTab === 'graph'
              ? 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/40'
              : 'text-[#666] hover:text-[#bbb]'
          }`}
        >
          Database
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'clues' && (
          <div className="flex flex-col gap-2.5">
            {discoveredClues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 font-mono text-xs text-[#666]">
                <FileText size={32} className="mb-2" />
                No clues discovered. Click coordinates on the navigation grid to inspect locations.
              </div>
            ) : (
              discoveredClues.map((clue) => (
                <div
                  key={clue.id}
                  className="bg-[#0c0c0c] border border-[#333] p-2.5 font-mono text-xs transition-all hover:border-[#FFB000]/40"
                >
                  <div className="flex items-center justify-between gap-1 mb-1 border-b border-[#222] pb-1">
                    <span className="font-bold text-[#FFB000] uppercase truncate">
                      {clue.title}
                    </span>
                    <span className="text-[8px] px-1 bg-[#1a1a1a] text-[#888] border border-[#333] rounded">
                      {clue.sourceTile}
                    </span>
                  </div>
                  <p className="text-[#bbb] leading-relaxed text-[11px]">{clue.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suspects' && (
          <div className="flex flex-col gap-2.5">
            {suspects.map((sus) => {
              const cracked = hasConfessed(sus.id);
              return (
                <div
                  key={sus.id}
                  className={`bg-[#0c0c0c] border p-2.5 font-mono text-xs transition-all ${
                    cracked ? 'border-red-900/50 bg-[#120000]' : 'border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#222] pb-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className={cracked ? 'text-red-500 animate-pulse' : 'text-[#888]'} />
                      <span className="font-bold text-white text-[11px]">{sus.name}</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.25 uppercase font-bold ${
                      cracked ? 'bg-red-500 text-white animate-pulse' : 'bg-[#222] text-[#aaa]'
                    }`}>
                      {cracked ? 'CRACKED / ADMITTED' : sus.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] leading-relaxed">
                    <p className="text-[#888]">
                      <span className="text-[#FFB000]/80 font-semibold uppercase text-[9px] mr-1">[ALIBI]:</span>
                      "{sus.alibi}"
                    </p>
                    
                    {cracked ? (
                      <p className="text-red-400 border-l border-red-500/50 pl-1.5 mt-1.5 italic bg-red-950/20 p-1">
                        <span className="text-red-500 font-bold uppercase text-[9px] block mb-0.5">[CONFESSION]:</span>
                        {sus.secret}
                      </p>
                    ) : (
                      <p className="text-[#555] italic text-[10px]">
                        *Has not cracked. Confront with the right evidence from the graph to expose their lie.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="flex flex-col gap-2 font-mono text-xs">
            {graph.edges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 text-[#666]">
                <ShieldAlert size={32} className="mb-2" />
                No cognitive connections logged. Crack a suspect's alibi to seed logical relationships.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-[#555] uppercase tracking-wider block mb-1">
                  Active Logical Contradictions:
                </span>
                {graph.edges.map((edge, i) => {
                  const sourceNode = graph.nodes.find(n => n.id === edge.source);
                  const targetNode = graph.nodes.find(n => n.id === edge.target);
                  return (
                    <div
                      key={i}
                      className="bg-[#0a0a0a] border border-[#222] p-2 flex flex-col gap-1 rounded-none hover:border-red-900/30"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#FFB000] font-semibold">{sourceNode?.label || edge.source}</span>
                        <span className="text-red-400 uppercase text-[8px] font-bold tracking-widest px-1 py-0.25 bg-red-950/30 border border-red-900/40 rounded animate-pulse">
                          {edge.relation}
                        </span>
                      </div>
                      <p className="text-[#666] text-[10px] leading-relaxed">
                        Refutes statement made by: <span className="text-[#aaa] font-medium">{targetNode?.label || edge.target}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="text-[8px] font-mono text-[#555] border-t border-[#333] pt-2 flex items-center justify-between">
        <span>GATEWAY: COGNEE LOGIC persistence</span>
        <span className="flex items-center gap-1">
          <Sparkles size={8} className="text-[#FFB000]" />
          ACTIVE KNOWLEDGE GRAPH
        </span>
      </div>
    </div>
  );
}
