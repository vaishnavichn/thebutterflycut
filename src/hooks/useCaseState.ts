import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RoomTile, Clue, CaseGraph, InterrogationMessage, Case } from '../types';
import { gameAudio } from '../components/world3d/Player3D';

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

export function useCaseState() {
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
  const [shakeKey, setShakeKey] = useState(0);
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
          { source: confNodeId, target: activeSuspectId!, relation: 'Exposes Lie' },
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
      [activeSuspectId!]: [...(prev[activeSuspectId!] || []), suspectMsg]
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
        gameAudio.playCorrectAccusation();
      } else {
        // Falsely accused an innocent suspect! Trigger the Twist Engine & Red Glitch overlay.
        setIsFlashingRed(true);
        setShakeKey(prev => prev + 1);
        gameAudio.playWrongAccusation();
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

  return {
    // Navigation
    navigate,
    
    // Case data
    activeCase,
    loading,
    error,
    showTransition,
    setShowTransition,
    
    // Game state
    roomMatrix,
    discoveredClues,
    graph,
    activeSuspectId,
    setActiveSuspectId,
    interrogationHistory,
    
    // UI state
    selectedTile,
    setSelectedTile,
    accusationFeedback,
    paradigmShiftsCount,
    isChatLoading,
    isShifting,
    consoleLogs,
    setConsoleLogs,
    rightPanelTab,
    setRightPanelTab,
    isAccusationModalOpen,
    setIsAccusationModalOpen,
    isFlashingRed,
    shakeKey,
    victoryData,
    setVictoryData,
    isNotebookOpen,
    setIsNotebookOpen,
    isTerminalExpanded,
    setIsTerminalExpanded,
    
    // Handlers
    handleInspectTile,
    handleSendMessage,
    handleConfrontSuspect,
    handleAccuseCulprit,
    handleCommand,
  };
}
