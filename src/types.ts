export interface Suspect {
  id: string;
  name: string;
  role: string;
  alibi: string;
  secret: string;
  contradiction: string;
  contradictionTrigger: string; // The clue title or content that triggers their slip-up
  isCulprit: boolean;
  persona?: string;
}

export interface RoomTile {
  id: string;
  name: string;
  description: string;
  hasClue: boolean;
  clueId?: string;
  isInspected: boolean;
  occupant?: string | null;
}

export interface Case {
  id: number;
  title: string;
  description: string;
  baselineScene: string;
  suspects: Suspect[];
  roomMatrix: RoomTile[][]; // 3x3 layout
  initialNarrative: string;
  solved: boolean;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  sourceTile: string;
  isDiscovered: boolean;
}

// Case Graph Structure (Cognee Gateway mock representation)
export interface GraphNode {
  id: string;
  label: string;
  type: 'suspect' | 'clue' | 'evidence' | 'contradiction';
  description: string;
  discoveredAt?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string; // e.g. "Contradicts", "Belongs To", "Discovered In"
}

export interface CaseGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface InterrogationMessage {
  sender: 'player' | 'suspect';
  text: string;
  timestamp: string;
}

export interface GameState {
  currentCaseId: number;
  currentRoomTile: string | null;
  discoveredClues: Clue[];
  graph: CaseGraph;
  activeSuspectId: string | null;
  interrogationHistory: { [suspectId: string]: InterrogationMessage[] };
  accusationFeedback: string | null;
  paradigmShiftsCount: number;
  isGameOver: boolean;
  consoleLogs: string[];
}
