import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RoomTile, Clue, CaseGraph, InterrogationMessage, Case } from '../types';
import GalleryScene from './world3d/GalleryScene';
import CaseGraphView from './CaseGraphView';
import SuspectInterrogator from './SuspectInterrogator';
import AccusationDesk from './AccusationDesk';
import NotebookPanel from './NotebookPanel';
import TerminalLog from './TerminalLog';
import CaseTransition from './CaseTransition';
import { HelpCircle, BookOpen, Skull, Terminal, RefreshCw, Volume2, Sparkles, ShieldAlert, X, ShieldCheck, Eye, EyeOff, LayoutGrid } from 'lucide-react';

export default function CaseWorld() {
  const { caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Active case data
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transition overlay state
  const [showTransition, setShowTransition] = useState(true);

  // Game state
  const [roomMatrix, setRoomMatrix] = useState<RoomTile[][]>([]);
  const [discoveredClues, setDiscoveredClues] = useState<Clue[]>([]);
  const [graph, setGraph] = useState<CaseGraph>({ nodes: [], edges: [] });
  const [activeSuspectId, setActiveSuspectId] = useState<string | null>(null);
  const [interrogationHistory, setInterrogationHistory] = useState<{ [suspectId: string]: InterrogationMessage[] }>({});
  
  // UI helpers
  const [selectedTile, setSelectedTile] = useState<RoomTile | null>(null);
  const [accusationFeedback, setAccusationFeedback] = useState<string | null>(null);
  const [paradigmShiftsCount, setParadigmShiftsCount] = useState<number>(0);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isShifting, setIsShifting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  // Immersive UI & Accusation Modal States
  const [rightPanelTab, setRightPanelTab] = useState<'notebook' | 'graph'>('notebook');
  const [isAccusationModalOpen, setIsAccusationModalOpen] = useState(false);
  const [isFlashingRed, setIsFlashingRed] = useState(false);
  const [victoryData, setVictoryData] = useState<any>(null);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);

  // Load / Bootstrap Case
  useEffect(() => {
    const bootstrapCase = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let caseData = location.state?.caseData;

        // Fetch case if not passed via router state (e.g. page refreshed)
        if (!caseData) {
          const res = await fetch('/api/start-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId: caseId || 'case_01' }),
          });
          if (!res.ok) {
            throw new Error(`Failed to retrieve case details (${res.status})`);
          }
          caseData = await res.json();
        }

        // Initialize active case
        const mappedCase: Case = {
          id: 1,
          title: caseData.title,
          description: caseData.setting,
          baselineScene: caseData.setting,
          suspects: caseData.suspects.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            alibi: s.alibi,
            secret: s.secret,
            contradiction: s.contradiction,
            contradictionTrigger: s.contradictionTrigger,
            isCulprit: s.id === 'security',
            persona: s.persona || `${s.emotional_state || ''}. ${s.verbal_tell || ''}`.trim()
          })),
          solved: false,
          initialNarrative: caseData.premise,
          roomMatrix: []
        };

        // Construct 3x3 room matrix from backend "rooms" structure
        const roomsData = caseData.rooms || {};
        const order = [
          ['Vault', 'Storage_Room', 'Security_Booth'],
          ['Front_Desk', 'East_Wing', 'West_Wing'],
          ['Curators_Office', 'Break_Room', 'Main_Hall']
        ];

        const matrix: RoomTile[][] = order.map((rowKeys, rIndex) => 
          rowKeys.map((key, cIndex) => {
            const r = roomsData[key] || { name: key, description: 'No readings.', occupant: null };
            return {
              id: key,
              name: r.name || key.replace(/_/g, ' '),
              description: r.description,
              hasClue: false, // Discovered on fly via inspect
              isInspected: false,
              occupant: r.occupant
            };
          })
        );

        mappedCase.roomMatrix = matrix;
        setActiveCase(mappedCase);
        setRoomMatrix(matrix);
        setDiscoveredClues([]);
        setSelectedTile(null);
        setAccusationFeedback(null);
        setActiveSuspectId(null);
        setInterrogationHistory({});

        // Initialize suspect nodes in Cognee Graph representation
        const initialNodes = mappedCase.suspects.map(s => ({
          id: s.id,
          label: s.name,
          type: 'suspect' as const,
          description: `${s.role}. Alibi: "${s.alibi}".`
        }));

        setGraph({
          nodes: initialNodes,
          edges: []
        });

        // Initialize logs
        const openingLogs = [
          `Initializing Case Gateway: "${mappedCase.title}"...`,
          `=============================================================`,
          caseData.premise,
          `=============================================================`,
          `Primary Setting: ${caseData.setting}`,
          `Navigate the 3x3 investigation matrix, and review suspects.`
        ];

        // Append 3x3 ASCII layout matrix
        const asciiLines = getAsciiLayoutMatrix(matrix);
        setConsoleLogs([...openingLogs, ...asciiLines]);

      } catch (err: any) {
        console.error('Error bootstrapping CaseWorld:', err);
        setError(err.message || 'Error syncing with secure mainframe.');
      } finally {
        setLoading(false);
      }
    };

    bootstrapCase();
  }, [caseId]);

  // Generate the 3x3 layout ASCII matrix lines
  const getAsciiLayoutMatrix = (matrix: RoomTile[][]) => {
    if (!matrix || matrix.length === 0) return [];
    const lines = [
      "┌───────────────────────┬───────────────────────┬───────────────────────┐",
      "│                     ROOM SCANNER 2D LAYOUT MATRIX             │",
      "├───────────────────────┼───────────────────────┼───────────────────────┤"
    ];
    for (let r = 0; r < 3; r++) {
      let rowStr = "│ ";
      for (let c = 0; c < 3; c++) {
        const tile = matrix[r][c];
        const dispName = tile.name.padEnd(21).substring(0, 21);
        rowStr += `${dispName} │ `;
      }
      lines.push(rowStr);
      if (r < 2) {
        lines.push("├───────────────────────┼───────────────────────┼───────────────────────┤");
      }
    }
    lines.push("└───────────────────────┴───────────────────────┴───────────────────────┘");
    return lines;
  };

  // Inspect Tile action - calling `/inspect` in real-time
  const handleInspectTile = async (tile: RoomTile) => {
    if (!activeCase) return;

    try {
      setConsoleLogs(prev => [...prev, `[TRANSMITTING] Inspecting location coordinates: [${tile.name}]`]);

      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'case_01',
          roomId: tile.id
        })
      });

      if (!res.ok) {
        throw new Error(`Inspect failed: ${res.status}`);
      }

      const inspectResult = await res.json();
      const newClues = inspectResult.newly_discovered_clues || [];

      // Update tile inspection state and clue flags locally
      const updatedMatrix = roomMatrix.map(row =>
        row.map(t => {
          if (t.id === tile.id) {
            return {
              ...t,
              isInspected: true,
              description: inspectResult.description,
              hasClue: t.hasClue || newClues.length > 0
            };
          }
          return t;
        })
      );
      setRoomMatrix(updatedMatrix);

      const updatedSelectedTile = {
        ...tile,
        isInspected: true,
        description: inspectResult.description,
        hasClue: tile.hasClue || newClues.length > 0
      };
      setSelectedTile(updatedSelectedTile);

      const newLogs = [
        `Inspecting Coordinates: [${tile.name}]`,
        inspectResult.description
      ];

      // Handle newly discovered clues
      if (newClues.length > 0) {
        newClues.forEach((clue: Clue) => {
          // Add to discovered clues
          setDiscoveredClues(prev => {
            if (prev.some(c => c.id === clue.id)) return prev;
            return [...prev, clue];
          });

          // Add clue node to Case Graph and connect it to its suspect
          setGraph(prev => {
            if (prev.nodes.some(n => n.id === clue.id)) return prev;

            const newNode = {
              id: clue.id,
              label: clue.title,
              type: 'clue' as const,
              description: `${clue.description} (Found in: ${tile.name})`
            };

            // Case 1 specific connections
            let targetSuspectId = '';
            if (clue.id === 'signout_sheet') targetSuspectId = 'curator';
            else if (clue.id === 'cleaning_schedule') targetSuspectId = 'cleaner';
            else if (clue.id === 'nanny_phone_log') targetSuspectId = 'nanny';
            else if (clue.id === 'security_maintenance_note') targetSuspectId = 'security';

            const newEdge = targetSuspectId ? {
              source: clue.id,
              target: targetSuspectId,
              relation: 'Refutes Alibi'
            } : null;

            return {
              nodes: [...prev.nodes, newNode],
              edges: newEdge ? [...prev.edges, newEdge] : prev.edges
            };
          });

          newLogs.push(`*** CLUE ACQUIRED: "${clue.title}" ***`);
          newLogs.push(clue.description);
          newLogs.push(`Cognee graph persistence log synchronized.`);
        });
      }

      setConsoleLogs(prev => [...prev, ...newLogs]);

    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [...prev, `ERROR: Inspection line transmission failed: ${err.message}`]);
    }
  };

  // Talk to suspect action (free text)
  const handleSendMessage = async (text: string) => {
    if (!activeCase || !activeSuspectId || isChatLoading) return;

    const activeSuspect = activeCase.suspects.find(s => s.id === activeSuspectId);
    if (!activeSuspect) return;

    // Log input to chat
    const playerMsg: InterrogationMessage = {
      sender: 'player',
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    const priorHistory = interrogationHistory[activeSuspectId] || [];
    const updatedHistory = [...priorHistory, playerMsg];

    setInterrogationHistory(prev => ({
      ...prev,
      [activeSuspectId]: updatedHistory
    }));

    setIsChatLoading(true);
    setConsoleLogs(prev => [...prev, `Interrogating ${activeSuspect.name} on topic: "${text}"`]);

    try {
      const hasTriggerClue = discoveredClues.some(
        c => c.title === activeSuspect.contradictionTrigger || c.id === activeSuspect.contradictionTrigger
      );

      const response = await fetch('/api/suspect/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'case_01',
          suspectId: activeSuspectId,
          suspectName: activeSuspect.name,
          role: activeSuspect.role,
          alibi: activeSuspect.alibi,
          secret: activeSuspect.secret,
          contradiction: activeSuspect.contradiction,
          contradictionTrigger: activeSuspect.contradictionTrigger,
          hasTriggerClue,
          history: updatedHistory,
          userInput: text,
          persona: activeSuspect.persona
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Interrogation failed (${response.status})`);
      }
      
      const suspectMsg: InterrogationMessage = {
        sender: 'suspect',
        text: data.text || `[Static noise...] Ask me something else.`,
        timestamp: new Date().toLocaleTimeString()
      };

      setInterrogationHistory(prev => ({
        ...prev,
        [activeSuspectId]: [...(prev[activeSuspectId] || []), suspectMsg]
      }));

    } catch (error: any) {
      console.error(error);
      setConsoleLogs(prev => [...prev, `ERROR: Interrogation line transmission failed: ${error.message || 'Unknown error'}`]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Confront suspect directly with a clue
  const handleConfrontSuspect = (clue: Clue) => {
    if (!activeCase || !activeSuspectId) return;

    const activeSuspect = activeCase.suspects.find(s => s.id === activeSuspectId);
    if (!activeSuspect) return;

    const isMatch = activeSuspect.contradictionTrigger === clue.title;
    let textResponse = '';

    setConsoleLogs(prev => [...prev, `Confronting ${activeSuspect.name} with clue: "${clue.title}"`]);

    if (isMatch) {
      // Suspect cracks! Add contradiction node to graph
      textResponse = `[PSYCHOLOGICAL BREAKDOWN] What?! How did you get that? Fine, yes! I lied about that, okay? ${activeSuspect.secret} But I swear, I didn't wipe those servers or take the painting! You have to believe me!`;
      
      setGraph(prev => {
        const confNodeId = `${activeSuspectId}_confession`;
        if (prev.nodes.some(n => n.id === confNodeId)) return prev;

        const newNode = {
          id: confNodeId,
          label: `${activeSuspect.name} Cracked`,
          type: 'contradiction' as const,
          description: `Under confrontation with "${clue.title}", ${activeSuspect.name} cracked and confessed: "${activeSuspect.secret}"`
        };

        const newEdges = [
          { source: confNodeId, target: activeSuspectId, relation: 'Exposes Lie' },
          { source: clue.id, target: confNodeId, relation: 'Triggers' }
        ];

        return {
          nodes: [...prev.nodes, newNode],
          edges: [...prev.edges, ...newEdges]
        };
      });

      setConsoleLogs(prev => [
        ...prev, 
        `*** CONTRADICTION UNCOVERED ***`, 
        `${activeSuspect.name} has cracked and admitted: ${activeSuspect.secret}`, 
        `Cognee persistent graph updated.`
      ]);
    } else {
      textResponse = `That has absolutely nothing to do with me, detective. You are clutching at straws. I told you, ${activeSuspect.alibi}`;
      setConsoleLogs(prev => [...prev, `${activeSuspect.name} deflected your confrontation.`]);
    }

    const suspectMsg: InterrogationMessage = {
      sender: 'suspect',
      text: textResponse,
      timestamp: new Date().toLocaleTimeString()
    };

    setInterrogationHistory(prev => ({
      ...prev,
      [activeSuspectId]: [...(prev[activeSuspectId] || []), suspectMsg]
    }));
  };

  // Accusation & Paradigm Shift Twist Mechanic
  const handleAccuseCulprit = async (suspectId: string, contradictingClueTitle: string) => {
    if (!activeCase) return;

    const suspect = activeCase.suspects.find(s => s.id === suspectId);
    if (!suspect) return;

    setConsoleLogs(prev => [
      ...prev,
      `Launching formal accusation against: ${suspect.name}`,
      `Supporting evidence presented: "${contradictingClueTitle}"`
    ]);

    setIsShifting(true);
    setAccusationFeedback(null);

    try {
      const graphState = graph.nodes.map(n => `Node: [${n.type.toUpperCase()}] ${n.label} - ${n.description}`).join('\n') + 
                         '\n' + 
                         graph.edges.map(e => `Edge: ${e.source} --(${e.relation})--> ${e.target}`).join('\n');

      const response = await fetch('/api/accuse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'case_01',
          suspectId: suspect.id,
          suspectName: suspect.name,
          graphState
        })
      });

      const twist = await response.json();

      if (twist.result === 'correct') {
        // Solved successfully!
        setActiveCase(prev => prev ? { ...prev, solved: true } : null);
        setAccusationFeedback(`SUCCESS: You have broken the case wide open! ${suspect.name} has signed a full confession. The mystery is resolved.`);
        setConsoleLogs(prev => [...prev, `[ACCUSATION SUCCESSFUL] Marcus Reyes confesses. Case solved, Detective.`]);
        setVictoryData({
          narration: twist.narration,
          suspectName: suspect.name,
          role: suspect.role
        });
        setIsAccusationModalOpen(false);
      } else {
        // Falsely accused an innocent suspect! Trigger the Twist Engine & Red Glitch overlay.
        setIsFlashingRed(true);
        setTimeout(() => setIsFlashingRed(false), 2000);

        setConsoleLogs(prev => [...prev, `[ACCUSATION INSUFFICIENT] ${suspect.name} maintains innocence. Timeline anomaly triggered...`]);

        if (twist.fabricatedClue) {
          const newFabricatedClue: Clue = {
            id: `fabricated_${Date.now()}`,
            title: twist.fabricatedClue.title,
            description: twist.fabricatedClue.description,
            sourceTile: twist.fabricatedClue.sourceTile,
            isDiscovered: true
          };

          // Update Room Matrix to place the new clue
          const updatedMatrix = roomMatrix.map(row =>
            row.map(tile => {
              if (tile.name.toLowerCase() === twist.fabricatedClue.sourceTile.toLowerCase() || 
                  tile.id.replace(/_/g, ' ').toLowerCase() === twist.fabricatedClue.sourceTile.toLowerCase()) {
                return {
                  ...tile,
                  hasClue: true,
                  description: `${tile.description} (You notice a suspicious anomaly: ${twist.fabricatedClue.description})`
                };
              }
              return tile;
            })
          );

          setRoomMatrix(updatedMatrix);
          setDiscoveredClues(prev => [...prev, newFabricatedClue]);
          setParadigmShiftsCount(prev => prev + 1);

          // Update Graph Nodes with the fabricated evidence pointing to the accused suspect (frames them)
          setGraph(prev => {
            const newClueNode = {
              id: newFabricatedClue.id,
              label: newFabricatedClue.title,
              type: 'clue' as const,
              description: `${newFabricatedClue.description} (Frames: ${suspect.name})`
            };

            const newEdge = {
              source: newClueNode.id,
              target: suspect.id,
              relation: 'Frames Suspect'
            };

            return {
              nodes: [...prev.nodes, newClueNode],
              edges: [...prev.edges, newEdge]
            };
          });

          setAccusationFeedback(`[THE TWIST MECHANIC ACTIVATED: PARADIGM SHIFT]\n${twist.narration}\n\nEvidence framing ${suspect.name} was planted in the ${twist.fabricatedClue.sourceTile}. Examine the room grid for the newly discovered Forensic Lead.`);
          
          setConsoleLogs(prev => [
            ...prev,
            `=================== PARADIGM SHIFT REGISTERED ===================`,
            twist.narration,
            `==================================================================`,
            `New Clue Emerged: "${twist.fabricatedClue.title}" at location: ${twist.fabricatedClue.sourceTile}.`,
            `Alibis and suspect culpability matrix recalculated.`
          ]);
        } else {
          setAccusationFeedback(twist.narration);
        }
      }
    } catch (error) {
      console.error(error);
      setConsoleLogs(prev => [...prev, `ERROR: Accusation algorithm transmission failure.`]);
    } finally {
      setIsShifting(false);
    }
  };

  // Command input terminal console handler
  const handleCommand = (cmd: string) => {
    const rawCmd = cmd.toLowerCase().trim();
    setConsoleLogs(prev => [...prev, `Executing: "${cmd}"`]);

    if (rawCmd === 'help') {
      setConsoleLogs(prev => [
        ...prev,
        `========= TERMINAL COMMAND INDEX =========`,
        `- inspect [location]: Inspect a 3x3 location (e.g. "inspect vault")`,
        `- talk [suspect_id]: Interrogate suspect by ID (curator, cleaner, nanny, security)`,
        `- query graph: Output current persistent nodes & links from Cognee DB`,
        `- accuse [suspect_id] [clue_title]: Launch accusation (e.g. "accuse curator signout sheet")`,
        `- clear: Flush terminal log screen`,
        `==========================================`
      ]);
      return;
    }

    if (rawCmd === 'clear') {
      setConsoleLogs([]);
      return;
    }

    if (rawCmd === 'query graph') {
      if (graph.nodes.length === 0) {
        setConsoleLogs(prev => [...prev, `Cognee DB empty. Explore locations to seed clues.`]);
        return;
      }
      const nodeLines = graph.nodes.map(n => `  • [${n.type.toUpperCase()}] ${n.label}: ${n.description}`);
      const edgeLines = graph.edges.map(e => `  └─ (${e.source}) ──[${e.relation}]──> (${e.target})`);
      setConsoleLogs(prev => [
        ...prev,
        `========= COGNEE GRAPH QUERY DATA =========`,
        `NODES:`,
        ...nodeLines,
        `EDGES/LINKS:`,
        ...edgeLines,
        `===========================================`
      ]);
      return;
    }

    if (rawCmd.startsWith('inspect ')) {
      const targetName = rawCmd.replace('inspect ', '').trim();
      let matchedTile: RoomTile | null = null;
      for (const row of roomMatrix) {
        for (const tile of row) {
          if (tile.name.toLowerCase().includes(targetName) || tile.id.replace(/_/g, ' ').toLowerCase().includes(targetName)) {
            matchedTile = tile;
            break;
          }
        }
      }

      if (matchedTile) {
        handleInspectTile(matchedTile);
      } else {
        setConsoleLogs(prev => [...prev, `Location matches "${targetName}" not found.`]);
      }
      return;
    }

    if (rawCmd.startsWith('talk ')) {
      const suspectId = rawCmd.replace('talk ', '').trim();
      const matched = activeCase?.suspects.find(s => s.id === suspectId || s.name.toLowerCase().includes(suspectId));
      if (matched) {
        setActiveSuspectId(matched.id);
        setConsoleLogs(prev => [...prev, `Interrogator assigned to: ${matched.name}.`]);
      } else {
        setConsoleLogs(prev => [...prev, `Suspect matching "${suspectId}" not found.`]);
      }
      return;
    }

    if (rawCmd.startsWith('accuse ')) {
      const args = rawCmd.replace('accuse ', '').trim();
      const firstSpace = args.indexOf(' ');
      if (firstSpace === -1) {
        setConsoleLogs(prev => [...prev, `Invalid format. Use "accuse [suspect_id] [clue_title]"`]);
        return;
      }
      const subId = args.substring(0, firstSpace).trim();
      const clueTitle = args.substring(firstSpace).trim();

      const matchedSus = activeCase?.suspects.find(s => s.id === subId || s.name.toLowerCase().includes(subId));
      const matchedClue = discoveredClues.find(c => c.title.toLowerCase().includes(clueTitle));

      if (matchedSus && matchedClue) {
        handleAccuseCulprit(matchedSus.id, matchedClue.title);
      } else {
        setConsoleLogs(prev => [
          ...prev, 
          `Accusation parameters invalid. Verify suspect ID and that the clue is discovered.`
        ]);
      }
      return;
    }

    setConsoleLogs(prev => [...prev, `Command "${cmd}" not recognized. Type "help" for guidelines.`]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#FFB000] font-mono flex flex-col justify-center items-center gap-4">
        <RefreshCw className="animate-spin" size={32} />
        <span className="text-xs uppercase tracking-widest">LOADING CASE MATRIX FILES...</span>
      </div>
    );
  }

  if (error || !activeCase) {
    return (
      <div className="min-h-screen bg-[#080808] text-red-500 font-mono flex flex-col justify-center items-center p-6 gap-4">
        <ShieldAlert size={48} />
        <span className="text-sm uppercase tracking-widest font-bold">COMMUNICATION INTERRUPTED</span>
        <p className="text-xs text-gray-500 max-w-md text-center">{error || 'Unknown mainframe connection issue.'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 px-4 py-2 font-bold uppercase text-xs cursor-pointer"
        >
          RETURN TO DOSSIER OVERVIEW
        </button>
      </div>
    );
  }

  // Typewriter premise reveal transition overlay
  if (showTransition) {
    return (
      <CaseTransition
        premise={activeCase.initialNarrative}
        onComplete={() => setShowTransition(false)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white p-4 md:p-6 font-sans relative select-none overflow-x-hidden">
      {/* CRT Scanline / Distortion Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.04] z-50"></div>
      
      {/* Glitch Overlay for False Accusations */}
      {isFlashingRed && (
        <div className="fixed inset-0 bg-red-950/90 z-50 flex flex-col items-center justify-center border-4 border-red-500 animate-pulse font-mono p-6">
          <ShieldAlert size={64} className="text-red-500 mb-4 animate-bounce" />
          <h2 className="text-2xl md:text-3xl font-black tracking-widest text-red-500 uppercase text-center glitch">
            SYSTEM ANOMALY: REALITY SHIFTED
          </h2>
          <div className="w-64 h-1 bg-red-600 my-4"></div>
          <p className="text-xs text-red-400 max-w-md text-center leading-relaxed">
            Your accusation collapsed under scrutiny. Timeline restructuring complete. Fabricating forensic anomaly...
          </p>
        </div>
      )}

      {/* Fullscreen Victory / Case Solved Screen */}
      {victoryData && (
        <div className="fixed inset-0 bg-[#0c0c0c] z-40 flex flex-col items-center justify-center p-6 border-4 border-[#00ffd2]/60 animate-fade-in font-mono">
          <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.05]"></div>
          
          <div className="max-w-2xl text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-[#111] border-2 border-[#00ffd2] flex items-center justify-center text-[#00ffd2] animate-pulse">
              <ShieldCheck size={36} />
            </div>

            <div>
              <span className="text-[#00ffd2] text-xs font-bold uppercase tracking-[0.3em] block mb-2">
                CASE RESOLVED PROTOCOL
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-widest text-white uppercase">
                {activeCase.title}
              </h1>
            </div>

            <div className="border border-[#00ffd2]/30 bg-[#162923]/30 p-5 rounded-none text-left leading-relaxed text-xs text-[#00ffd2] max-h-[300px] overflow-y-auto">
              <p className="font-semibold text-[11px] text-white uppercase mb-3 border-b border-[#00ffd2]/20 pb-1">
                CULPRIT CONFESSION DOSSIER: {victoryData.suspectName} ({victoryData.role})
              </p>
              {victoryData.narration}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setVictoryData(null);
                  navigate('/');
                }}
                className="bg-[#00ffd2]/10 hover:bg-[#00ffd2]/20 text-[#00ffd2] border border-[#00ffd2]/40 px-6 py-3 rounded-none text-xs font-bold tracking-widest cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,210,0.2)]"
              >
                CLOSE FILE & LEAVE CASE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4 h-[calc(100vh-5rem)]">
        
        {/* Modern Cyber-Noir Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#333] pb-2 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 bg-[#0c0c0c] border border-[#FFB000]/40 rounded-none cursor-pointer hover:border-[#FFB000]"
              title="Return to Main Menu"
            >
              <Skull size={20} className="text-[#FFB000]" />
            </button>
            <div>
              <h1 className="font-mono text-lg md:text-xl font-black tracking-[0.2em] text-[#FFB000] uppercase flex items-center gap-2">
                NOIR PROTOCOL
                <span className="text-[8px] px-1.5 py-0.5 bg-[#FFB000]/10 border border-[#FFB000]/30 text-[#FFB000] rounded-none">
                  SECURE_GATEWAY_V1
                </span>
              </h1>
              <p className="font-mono text-[9px] text-[#666] tracking-wider uppercase">
                CASE MATRIX PERSISTENCE ENGINE & COGNEE GRAPHS
              </p>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 bg-[#0c0c0c] border border-[#333] text-[#FFB000] font-mono text-[9px] uppercase font-bold">
              Active Case: {activeCase.title}
            </div>
            {activeCase.solved ? (
              <div className="px-3 py-1 bg-[#00221a] border border-[#00ffd2]/40 text-[#00ffd2] rounded-none font-mono text-[9px] uppercase animate-pulse">
                STATUS: SOLVED
              </div>
            ) : (
              <button
                onClick={() => setIsAccusationModalOpen(true)}
                className="px-3 py-1 bg-red-950/80 border border-red-500/50 hover:bg-red-900 text-red-300 rounded-none font-mono text-[9px] uppercase font-bold tracking-wider cursor-pointer animate-pulse"
              >
                🚨 INITIATE ACCUSATION
              </button>
            )}
          </div>
        </header>

        {/* SCREEN 2: GAME WORKSPACE (FULL-SCREEN 3D VIEWPORT WITH FLOATING HUDS) */}
        <div className="flex-1 relative w-full border border-[#333] bg-[#0a0a0a] rounded-lg shadow-2xl flex flex-col" style={{ minHeight: 0 }}>
          {/* WebGL 3D Gallery Canvas Container */}
          <div className="flex-1 relative" style={{ minHeight: '480px' }}>
            <GalleryScene
              roomMatrix={roomMatrix}
              discoveredClues={discoveredClues}
              onInspectTile={handleInspectTile}
              selectedTile={selectedTile}
              onSelectSuspect={setActiveSuspectId}
              activeSuspectId={activeSuspectId}
              onTerminalLog={(log) => setConsoleLogs(prev => [...prev, `[SYSTEM] ${log}`])}
            />
          </div>

          {/* FLOATING HUD 1: SELECTED TILE / FORENSIC EXAMINER */}
          {selectedTile && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-xl z-20 px-4 animate-fade-in">
              <div className="bg-[#080808]/95 border border-[#00ffd2]/50 p-4 font-mono text-xs shadow-2xl rounded-sm backdrop-blur-md relative">
                <button
                  onClick={() => setSelectedTile(null)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors cursor-pointer text-[10px] px-1.5 py-0.5 border border-dashed border-gray-800"
                >
                  [X] CLOSE
                </button>
                <div className="border-b border-[#00ffd2]/20 pb-1.5 mb-2 font-bold text-[#00ffd2] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Eye size={12} />
                  FORENSIC TRACE ANALYSIS: {selectedTile.name}
                </div>
                <p className="text-[#bbb] leading-relaxed text-[11px] select-text">
                  {selectedTile.description}
                </p>
              </div>
            </div>
          )}

          {/* FLOATING HUD 2: SUSPECT INTERROGATION TERMINAL OVERLAY */}
          {activeSuspectId && (
            <div className="absolute inset-4 lg:right-auto lg:w-[840px] z-30 bg-black/95 border border-[#FFB000]/50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-fade-in">
              <div className="bg-[#0c0c0c] px-4 py-3 border-b border-[#333] flex items-center justify-between font-mono">
                <span className="text-[#FFB000] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <ShieldAlert size={14} className="animate-pulse" />
                  INTERROGATION CHANNEL ACTIVE // {activeCase.suspects.find(s => s.id === activeSuspectId)?.name.toUpperCase()}
                </span>
                <button
                  onClick={() => setActiveSuspectId(null)}
                  className="px-3 py-1 bg-black hover:bg-[#FFB000]/10 border border-[#FFB000]/30 text-[#FFB000] font-mono text-xs font-bold rounded-sm cursor-pointer hover:border-[#FFB000] transition-colors"
                >
                  [ ESC / DISCONNECT ]
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-black/20">
                <SuspectInterrogator
                  suspects={activeCase.suspects}
                  activeSuspectId={activeSuspectId}
                  onSelectSuspect={setActiveSuspectId}
                  discoveredClues={discoveredClues}
                  messages={interrogationHistory[activeSuspectId] || []}
                  onSendMessage={handleSendMessage}
                  onConfrontSuspect={handleConfrontSuspect}
                  isChatLoading={isChatLoading}
                />
              </div>
            </div>
          )}

          {/* FLOATING HUD 3: CASE NOTEBOOK / COGNEE GRAPH DRAWER */}
          {isNotebookOpen ? (
            <div className="absolute right-4 top-4 bottom-4 w-96 max-w-[calc(100%-2rem)] z-30 bg-[#080808]/95 border border-[#FFB000]/40 shadow-2xl backdrop-blur-md flex flex-col rounded-lg overflow-hidden animate-fade-in">
              {/* Drawer Header */}
              <div className="bg-[#111] px-4 py-3 border-b border-[#333] flex items-center justify-between font-mono">
                <span className="text-[#FFB000] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} className="text-[#FFB000]" />
                  CASE NOTEBOOK
                </span>
                <button
                  onClick={() => setIsNotebookOpen(false)}
                  className="text-[#666] hover:text-[#FFB000] transition-colors cursor-pointer text-xs font-bold font-mono"
                >
                  [ CLOSE ]
                </button>
              </div>
              
              {/* View Mode Tabs */}
              <div className="grid grid-cols-2 border-b border-[#333] bg-[#0c0c0c] p-1 font-mono text-[10px]">
                <button
                  onClick={() => setRightPanelTab('notebook')}
                  className={`py-1.5 font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    rightPanelTab === 'notebook'
                      ? 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/30'
                      : 'text-[#666] hover:text-[#aaa]'
                  }`}
                >
                  <BookOpen size={12} />
                  Evidence Files
                </button>
                <button
                  onClick={() => setRightPanelTab('graph')}
                  className={`py-1.5 font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    rightPanelTab === 'graph'
                      ? 'bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/30'
                      : 'text-[#666] hover:text-[#aaa]'
                  }`}
                >
                  <RefreshCw size={12} />
                  Cognee Graph
                </button>
              </div>

              {/* Tab Body */}
              <div className="flex-1 overflow-y-auto p-3">
                {rightPanelTab === 'notebook' ? (
                  <NotebookPanel
                    discoveredClues={discoveredClues}
                    suspects={activeCase.suspects}
                    graph={graph}
                    activeCaseTitle={activeCase.title}
                  />
                ) : (
                  <CaseGraphView graph={graph} />
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsNotebookOpen(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-[#0c0c0c]/90 border border-[#FFB000]/40 text-[#FFB000] p-3 font-mono text-xs font-bold tracking-[0.2em] hover:bg-[#FFB000]/10 hover:border-[#FFB000] shadow-md cursor-pointer flex flex-col items-center gap-2 rounded-l-md hover:shadow-[0_0_15px_rgba(255,176,0,0.15)] transition-all duration-300"
              style={{ writingMode: 'vertical-lr' }}
            >
              <span>📓 CASE NOTEBOOK / COGNEE GRAPH</span>
            </button>
          )}

          {/* FLOATING HUD 4: COMPACT COLLAPSIBLE TERMINAL CONSOLE LOGS */}
          {isTerminalExpanded ? (
            <div className="absolute bottom-4 left-4 z-20 w-full max-w-xl bg-[#050505]/95 border border-[#333] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#333] px-3 py-1.5 text-[10px] text-[#00ffd2]/60 font-bold uppercase tracking-widest bg-[#111]">
                <span className="flex items-center gap-1.5 font-mono">
                  <Terminal size={12} className="animate-pulse text-[#00ffd2]" />
                  CASE CONSOLE TERMINAL
                </span>
                <button
                  onClick={() => setIsTerminalExpanded(false)}
                  className="text-[#666] hover:text-white transition-colors cursor-pointer text-[10px] font-bold font-mono"
                >
                  [ MINIMIZE ]
                </button>
              </div>
              <div className="h-[200px] overflow-hidden">
                <TerminalLog logs={consoleLogs} onCommand={handleCommand} />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsTerminalExpanded(true)}
              className="absolute bottom-4 left-4 z-20 bg-[#0c0c0c]/90 hover:bg-[#00ffd2]/10 border border-[#00ffd2]/30 text-[#00ffd2] px-3.5 py-2 font-mono text-xs rounded-sm shadow-lg cursor-pointer flex items-center gap-2 tracking-wider transition-all duration-300 hover:border-[#00ffd2]"
            >
              <Terminal size={12} className="animate-pulse text-[#00ffd2]" />
              <span>&gt;_ OPEN SECURE CONSOLE LOGS</span>
            </button>
          )}

        </div>

        {/* SCREEN 3: ACCUSATION MODAL LAYOUT */}
        {isAccusationModalOpen && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0c0c0c] border border-[#FFB000]/60 max-w-lg w-full font-mono shadow-[0_0_30px_rgba(255,176,0,0.15)] overflow-hidden relative">
              <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]"></div>
              
              {/* Modal Header */}
              <div className="bg-[#111] p-3.5 border-b border-[#333] flex items-center justify-between">
                <span className="text-[#FFB000] text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#FFB000]" />
                  SUBMIT FINAL DEDUCTION FILE
                </span>
                <button
                  onClick={() => setIsAccusationModalOpen(false)}
                  className="text-[#666] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4">
                <AccusationDesk
                  suspects={activeCase.suspects}
                  discoveredClues={discoveredClues}
                  onAccuseCulprit={handleAccuseCulprit}
                  accusationFeedback={accusationFeedback}
                  paradigmShiftsCount={paradigmShiftsCount}
                  onAdvanceCase={() => {
                    setIsAccusationModalOpen(false);
                    navigate('/');
                  }}
                  isSolved={activeCase.solved}
                  isShifting={isShifting}
                  activeCaseId={1}
                />
              </div>
              
              {/* Modal Footer helper */}
              <div className="bg-[#050505] p-2 border-t border-[#222] text-center text-[8px] text-[#555] uppercase tracking-wider">
                Secure transmission system under regulatory audit
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
