import React, { useState } from 'react';
import { CaseGraph, GraphNode, GraphEdge } from '../types';
import { Share2, FileText, User, HelpCircle, ShieldAlert } from 'lucide-react';

interface CaseGraphViewProps {
  graph: CaseGraph;
}

export default function CaseGraphView({ graph }: CaseGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Simple static force/position layout for nodes based on their type to prevent overlap
  const getNodeCoordinates = (node: GraphNode, index: number, total: number) => {
    // If it's a suspect, arrange on the left side/top
    if (node.type === 'suspect') {
      const spacing = 120;
      return {
        x: 80,
        y: 80 + index * spacing,
      };
    }

    // If it's a clue, distribute in a semi-circle or grid on the right side
    const clueNodes = graph.nodes.filter(n => n.type !== 'suspect');
    const clueIndex = clueNodes.findIndex(n => n.id === node.id);
    const totalClues = clueNodes.length || 1;

    // Radius distribution or grid
    const x = 320 + (clueIndex % 2) * 120;
    const y = 60 + Math.floor(clueIndex / 2) * 90;

    return { x, y };
  };

  // Pre-calculate all node positions so we can draw lines
  const nodePositions = graph.nodes.reduce((acc, node, index) => {
    acc[node.id] = getNodeCoordinates(node, index, graph.nodes.length);
    return acc;
  }, {} as { [id: string]: { x: number; y: number } });

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'suspect':
        return {
          bg: 'bg-[#0c0c0c]',
          border: 'border-[#00ffd2]/40',
          text: 'text-white',
          fill: '#00ffd2',
        };
      case 'clue':
        return {
          bg: 'bg-[#0c0c0c]',
          border: 'border-[#00ffd2]/80',
          text: 'text-[#00ffd2]',
          fill: '#00ffd2',
        };
      case 'contradiction':
        return {
          bg: 'bg-[#120000]',
          border: 'border-red-500/80',
          text: 'text-red-500',
          fill: '#ef4444',
        };
      default:
        return {
          bg: 'bg-[#050505]',
          border: 'border-[#333]',
          text: 'text-[#666]',
          fill: '#666',
        };
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-[#080808] p-4 border border-[#333] rounded-lg shadow-2xl relative h-[480px]">
      <div className="flex items-center justify-between border-b border-[#333] pb-2">
        <h3 className="font-mono text-xs tracking-widest text-[#00ffd2] uppercase flex items-center gap-2">
          <Share2 size={16} className="text-[#00ffd2]" />
          [ COGNEE GATEWAY — ACTIVE CASE GRAPH ]
        </h3>
        <span className="font-mono text-[9px] px-2 py-0.5 bg-[#00ffd2]/10 border border-[#00ffd2]/30 text-[#00ffd2] rounded">
          PERSISTENT_CLUES_LOGGED: {graph.nodes.filter(n => n.type === 'clue').length}
        </span>
      </div>

      <div className="flex-1 relative border border-[#333] rounded bg-[#030303] overflow-auto">
        {graph.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <HelpCircle size={40} className="text-[#444] animate-pulse mb-2" />
            <p className="font-mono text-xs text-[#666]">
              No clues discovered yet. Explore the 3x3 layout to populate the Case Graph database.
            </p>
          </div>
        ) : (
          <div className="w-full h-full min-w-[500px] min-h-[400px] relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Define Arrow Markers */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#00ffd2" opacity="0.6" />
                </marker>
                <marker
                  id="arrow-contradicts"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" opacity="0.8" />
                </marker>
              </defs>

              {/* Draw Edges */}
              {graph.edges.map((edge, idx) => {
                const sourcePos = nodePositions[edge.source];
                const targetPos = nodePositions[edge.target];
                if (!sourcePos || !targetPos) return null;

                const isContradiction = edge.relation.toLowerCase() === 'contradicts' || edge.relation.toLowerCase().includes('lie');

                return (
                  <g key={`edge-${idx}`}>
                    {/* Background wider glow line */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isContradiction ? '#ef4444' : '#00ffd2'}
                      strokeOpacity="0.1"
                      strokeWidth="4"
                    />
                    {/* Primary connection line with markers */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isContradiction ? '#ef4444' : '#00ffd2'}
                      strokeOpacity="0.5"
                      strokeWidth="1.5"
                      strokeDasharray={isContradiction ? "4 4" : "none"}
                      markerEnd={isContradiction ? "url(#arrow-contradicts)" : "url(#arrow)"}
                      className={isContradiction ? "animate-dash-fast" : ""}
                    />
                    {/* Text labels for relations */}
                    <text
                      x={(sourcePos.x + targetPos.x) / 2}
                      y={(sourcePos.y + targetPos.y) / 2 - 6}
                      fill={isContradiction ? '#f87171' : '#00ffd2'}
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-70 bg-black px-1"
                    >
                      {edge.relation}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes */}
            {graph.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const style = getNodeColor(node.type);
              const isSelected = selectedNode?.id === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{ left: pos.x - 16, top: pos.y - 16 }}
                  className={`
                    absolute w-8 h-8 rounded-none border flex items-center justify-center transition-all duration-300 shadow-lg
                    ${style.bg} ${style.border} ${style.text}
                    ${isSelected ? 'scale-125 ring-2 ring-[#00ffd2]/30 shadow-[0_0_15px_rgba(0,255,210,0.3)]' : 'hover:scale-110'}
                  `}
                  title={node.label}
                >
                  {node.type === 'suspect' ? (
                    <User size={14} className="text-[#00ffd2]" />
                  ) : node.type === 'contradiction' ? (
                    <ShieldAlert size={14} className="text-red-500 animate-pulse" />
                  ) : (
                    <FileText size={14} className="text-[#00ffd2]" />
                  )}

                  {/* Tiny text label below the node */}
                  <span className="absolute top-10 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-tight text-[#d1d5db] font-semibold bg-[#0c0c0c] px-1.5 py-0.5 rounded-none border border-[#333] whitespace-nowrap z-10">
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Node Inspector Sidebar / Bottombar Overlay */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-[#0c0c0c] border border-[#00ffd2]/40 rounded-none p-3 text-[#00ffd2] font-mono text-xs shadow-2xl animate-fade-in z-20">
          <div className="flex items-center justify-between border-b border-[#333] pb-1 mb-1.5">
            <span className="font-bold text-white uppercase tracking-widest flex items-center gap-1">
              [{selectedNode.type.toUpperCase()}] {selectedNode.label}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[#666] hover:text-[#00ffd2] px-1 font-bold"
            >
              [CLOSE]
            </button>
          </div>
          <p className="text-[#bbb] leading-relaxed text-[11px]">{selectedNode.description}</p>
        </div>
      )}

      <div className="text-[9px] font-mono text-[#555] flex items-center justify-between border-t border-[#333] pt-1">
        <span>Click nodes to inspect relationships and details</span>
        <span>COGNEE_VISUAL_GRID v4.1</span>
      </div>
    </div>
  );
}
