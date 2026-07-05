import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Cognee memory microservice (Python/FastAPI) - handles per-suspect memory
const COGNEE_URL = process.env.COGNEE_URL || 'http://localhost:8001';

async function queryMemory(datasetName: string, query: string): Promise<string> {
  try {
    const res = await fetch(`${COGNEE_URL}/memory/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_name: datasetName, query })
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.context || '';
  } catch (err) {
    console.warn('Cognee memory query unavailable, continuing without it:', (err as Error).message);
    return '';
  }
}

async function addMemory(datasetName: string, text: string): Promise<void> {
  try {
    await fetch(`${COGNEE_URL}/memory/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_name: datasetName, text })
    });
  } catch (err) {
    console.warn('Cognee memory add failed, continuing without it:', (err as Error).message);
  }
}

app.use(express.json());

// Session-scoped in-memory discovered clues state.
// Resets on server restart, which is acceptable for a hackathon demo.
const discoveredCluesState: { [caseId: string]: Set<string> } = {};

// Start Case Endpoint returning case details, stripped rooms and suspects
app.post(['/api/start-case', '/start-case'], (req, res) => {
  const { caseId } = req.body;
  const targetId = caseId || 'case_01';
  
  if (targetId === 'case_01' || Number(caseId) === 1) {
    try {
      const caseData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'case_01.json'), 'utf8'));
      
      // Strip clue_ids and clue text from rooms for security
      const safeRooms: { [key: string]: any } = {};
      for (const [roomId, room] of Object.entries(caseData.rooms)) {
        const r = room as any;
        safeRooms[roomId] = {
          name: r.name,
          description: r.description,
          occupant: r.occupant
        };
      }
      
      // Clear discovered clues state for this case on start-case to reset session
      discoveredCluesState['case_01'] = new Set<string>();

      return res.json({
        caseId: "case_01",
        title: caseData.title,
        setting: caseData.setting,
        premise: caseData.premise,
        suspects: caseData.suspects,
        rooms: safeRooms
      });
    } catch (err: any) {
      console.error("Error reading case_01.json inside start-case:", err);
      return res.status(500).json({ error: "Failed to load case data" });
    }
  }
  
  // Fallbacks for other cases
  return res.json({
    caseId: targetId,
    title: "Unknown Case",
    setting: "Unknown Location",
    suspects: [],
    rooms: {}
  });
});

// Inspect Room/Tile Endpoint
app.post(['/api/inspect', '/inspect'], (req, res) => {
  try {
    const { caseId, roomId } = req.body;
    const targetCaseId = caseId === '1' || caseId === 1 ? 'case_01' : (caseId || 'case_01');
    
    if (targetCaseId !== 'case_01') {
      return res.status(404).json({ error: "Case not found" });
    }
    
    const caseData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'case_01.json'), 'utf8'));
    
    // Look up room exactly or case-insensitively
    let room = caseData.rooms[roomId];
    let roomKey = roomId;
    if (!room) {
      const normalizedSearch = roomId.replace(/\s+/g, '_').toLowerCase();
      const foundKey = Object.keys(caseData.rooms).find(k => 
        k.toLowerCase() === normalizedSearch || 
        k.replace(/_/g, ' ').toLowerCase() === normalizedSearch
      );
      if (foundKey) {
        roomKey = foundKey;
        room = caseData.rooms[foundKey];
      }
    }
    
    if (!room) {
      return res.status(404).json({ error: `Room "${roomId}" not found in case matrix.` });
    }
    
    // Initialize session set if needed
    if (!discoveredCluesState[targetCaseId]) {
      discoveredCluesState[targetCaseId] = new Set<string>();
    }
    
    const newlyDiscoveredClues: any[] = [];
    
    if (room.clue_ids && Array.isArray(room.clue_ids)) {
      for (const clueId of room.clue_ids) {
        if (!discoveredCluesState[targetCaseId].has(clueId)) {
          // Discover the clue!
          const clueText = caseData.clues[clueId];
          if (clueText) {
            discoveredCluesState[targetCaseId].add(clueId);
            
            // Format title neatly from snake_case or similar
            const title = clueId
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            newlyDiscoveredClues.push({
              id: clueId,
              title: title,
              description: clueText,
              sourceTile: room.name,
              isDiscovered: true
            });
          }
        }
      }
    }
    
    return res.json({
      roomId: roomKey,
      name: room.name,
      description: room.description,
      newly_discovered_clues: newlyDiscoveredClues,
      occupant: room.occupant
    });
  } catch (error: any) {
    console.error('Error in /api/inspect:', error);
    res.status(500).json({ error: error.message || 'Inspection failed' });
  }
});


// Lazy-loaded Groq client
let aiClient: Groq | null = null;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GROQ_API_KEY is not defined in the environment. AI suspect dialogue will fallback to canned responses.");
      return null;
    }
    aiClient = new Groq({ apiKey });
  }
  return aiClient;
}

// 1. Suspect Interrogation Endpoint
app.post(['/api/suspect/chat', '/api/interact', '/interact'], async (req, res) => {
  try {
    const {
      caseId,
      suspectId,
      suspectName,
      role,
      alibi,
      secret,
      contradiction,
      contradictionTrigger,
      hasTriggerClue,
      history,
      userInput,
      persona
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      // Fallback response if API key is missing
      return res.json({
        text: `[STATIC NOIR STATIC] Look, detective, I'm ${suspectName}, the ${role}. I told you: ${alibi}. I don't know anything else, and I've got nothing to hide from the likes of you. (Configure GEMINI_API_KEY to unlock full dynamic roleplay!)`
      });
    }

    const systemInstruction = `You are roleplaying as ${suspectName}, who is the ${role} in a hard-boiled Noir Detective Game for Case ${caseId}.
Your character's core personality: "${persona || 'A standard mysterious noir suspect.'}"
Your character's alibi is: "${alibi}"
Your character's dark secret is: "${secret}"
The contradiction in your story is: "${contradiction}" which is exposed by the clue "${contradictionTrigger}".

Rules of behavior:
1. Speak in a classic hard-boiled, dramatic, mysterious noir tone appropriate for your role (e.g., Eleanor Voss is poised but defensive; Rosa Delgado is plainspoken and suspicious; Priya Kapoor is emotional and protective; Marcus Reyes is procedurally controlled and never visibly nervous). Use vivid sensory details, noir slang or professional terminology, and keep answers concise (2-4 sentences).
2. STICK TO YOUR ALIBI by default. Deny any wrongdoing. Play innocent and try to redirect suspicion.
3. CRITICAL TRIGGER MECHANIC: The player has ${hasTriggerClue ? 'DISCOVERED' : 'NOT YET DISCOVERED'} the clue "${contradictionTrigger}" that exposes your lie.
   - If hasTriggerClue is true and the player brings up, mentions, or directly confronts you with the details of "${contradictionTrigger}" (e.g. keycard swipes, missing override keys, discrepancies), you must become visibly nervous, stammer, slip up, or reveal a portion of your dark secret! You might make a desperate excuse or defensive contradiction, and eventually break down if pressed.
   - If hasTriggerClue is false, even if the player guesses or mentions this, you must confidently deny it, dismiss it as wild speculation, and insist on your alibi.
4. Do not break character. Do not mention that you are an AI or in a video game. Refuse to talk about anything outside the scene and timeframe of the crime.`;

    // Dataset is scoped per suspect+case so memories never bleed across suspects/cases
    const datasetName = `suspect_${caseId}_${suspectId}`;

    // Pull relevant past exchanges/contradictions for this suspect from Cognee
    const recalledMemory = await queryMemory(datasetName, userInput);

    const fullSystemInstruction = recalledMemory
      ? `${systemInstruction}\n\nRelevant memory of past exchanges with this detective:\n${recalledMemory}`
      : systemInstruction;

    // Convert history into Groq/OpenAI-style chat messages
    const messages: any[] = [
      { role: 'system', content: fullSystemInstruction },
      ...history.map((msg: any) => ({
        role: msg.sender === 'player' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userInput }
    ];

    const response = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 300,
    });

    const replyText = response.choices[0]?.message?.content || '';

    // Store this exchange in Cognee so the suspect "remembers" it later (fire-and-forget)
    addMemory(datasetName, `Detective asked: "${userInput}"\n${suspectName} replied: "${replyText}"`);

    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Error in /api/suspect/chat:', error);
    res.status(500).json({ error: error.message || 'Interrogation failed' });
  }
});

let twistCounts: { [caseId: string]: number } = {};

async function generateMutation(graphState: any, accusedSuspectId: string, culpritId: string, caseId: string) {
  const ai = getAiClient();
  if (!ai) {
    return "A silver hairpin engraved with the initials of the curator was found caught in the vault gate hinge.";
  }

  const systemInstruction = `You are a noir mystery engine. The player just falsely accused an innocent suspect (${accusedSuspectId}) of the crime in Case ${caseId}.
We must trigger a Twist mutation.
Your task: Given the current evidence graph state: ${JSON.stringify(graphState)}, invent ONE new piece of fabricated physical evidence that redirects suspicion toward a DIFFERENT innocent suspect (not the real culprit "${culpritId}", and not the one just falsely accused "${accusedSuspectId}").
The innocent suspect pool is: Eleanor Voss (Gallery Curator), Rosa Delgado (Night Cleaner), Priya Kapoor (Family Nanny).
The real culprit is Marcus Reyes (Head of Security) - do NOT point to him.
Keep it consistent with the existing timeline and facts.
Output ONLY the new evidence as a single, factual, dramatic noir sentence. No alibis, no conversational preamble, no formatting, no intro.`;

  try {
    const response = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: 'Generate the fabricated physical evidence now.' }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });
    return (response.choices[0]?.message?.content || '').trim();
  } catch (error) {
    console.error("Error generating mutation:", error);
    return "A silver hairpin engraved with the initials of the curator was found caught in the vault gate hinge.";
  }
}

async function generateFalseAccusationNarration(accusedSuspectName: string, newEvidence: string) {
  const ai = getAiClient();
  if (!ai) {
    return `Your confident accusation of ${accusedSuspectName} collapses under scrutiny. A sudden realization dawns on you: they are being framed! Under the floorboards, you discover a new lead: ${newEvidence}`;
  }

  const systemInstruction = `You are the Game Master of a hard-boiled noir detective mystery.
The player has just falsely accused ${accusedSuspectName}, who is innocent.
Write a suspenseful, dramatic, atmospheric noir paragraph explaining how the evidence against ${accusedSuspectName} fell apart, clearing them completely, and how a new clue (${newEvidence}) was suddenly uncovered that changes the entire paradigm of the investigation.
Keep the tone classic noir, gritty, mysterious, and short (3-5 sentences).`;

  try {
    const response = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: 'Generate the noir narrative.' }
      ],
      temperature: 0.8,
      max_tokens: 250,
    });
    return (response.choices[0]?.message?.content || '').trim();
  } catch (error) {
    return `Your confident accusation of ${accusedSuspectName} collapses under scrutiny. A sudden realization dawns on you: they are being framed! Under the floorboards, you discover a new lead: ${newEvidence}`;
  }
}

// 2. Accuse Endpoint
app.post(['/api/accuse', '/accuse'], async (req, res) => {
  try {
    const { caseId, suspectId, graphState, suspectName } = req.body;
    
    // Normalizing suspect ID to check for Marcus Reyes / Head of Security
    const idLower = (suspectId || '').toLowerCase();
    const isMarcus = idLower === 'security' || idLower === 'head_security' || idLower.includes('marcus') || idLower.includes('reyes');
    
    if (isMarcus) {
      const victoryNarration = `The trap is sprung. Marcus Reyes tries to maintain his procedural, authoritative mask, but as you lay out the sensor logs and the biometric entries, his composure fractures. The calm 'routine maintenance' excuse crumbles. He confesses. He was bribed by a private collector to swap the painting for the forgery, and used the child's routine nightly visit as cover. When the young child startled him mid-swap, Marcus panicked, pushed the child, and staged the scene to look like an unrelated break-in. 'The Midnight Serenade' is recovered, and the Lumina Gallery's shadows are finally dispersed. Case Solved, Detective.`;
      return res.json({ result: 'correct', narration: victoryNarration });
    }
    
    // Falsely accused an innocent suspect! Trigger the Twist Engine.
    const currentTwistCount = twistCounts[caseId] || 0;
    if (currentTwistCount >= 1) {
      // Capped at 1 twist per case
      return res.json({
        result: 'false_accusation',
        narration: `Your accusation of ${suspectName || suspectId} fails. The evidence still points elsewhere, and you feel the true culprit laughing from the shadows. Keep searching before making another attempt.`
      });
    }
    
    // Generate twist physical evidence and updated alibi/narrative
    const fabricatedEvidence = await generateMutation(graphState, suspectId, 'Marcus Reyes', caseId);
    twistCounts[caseId] = currentTwistCount + 1;
    
    const narration = await generateFalseAccusationNarration(suspectName || suspectId, fabricatedEvidence);
    
    res.json({
      result: 'false_accusation',
      narration: narration,
      new_evidence_hint: fabricatedEvidence,
      fabricatedClue: {
        title: 'New Forensic Lead',
        description: fabricatedEvidence,
        sourceTile: 'Storage Room' // Let's place it in the Storage Room
      }
    });
  } catch (error: any) {
    console.error('Error in /api/accuse:', error);
    res.status(500).json({ error: error.message || 'Accusation failed' });
  }
});

// 2. Paradigm Shift Twist Endpoint
app.post('/api/paradigm-shift', async (req, res) => {
  try {
    const {
      caseId,
      caseTitle,
      baselineScene,
      accusedSuspect,
      remainingSuspects
    } = req.body;

    const ai = getAiClient();
    if (!ai) {
      // Fallback mock shift if API key is missing
      const fallbackTarget = remainingSuspects[0] || { id: 'unknown', name: 'Someone Else' };
      return res.json({
        narrative: `A chilling realization strikes the room. The evidence you presented against ${accusedSuspect.name} was a brilliant frame-up! A mysterious envelope is found slid under the door, containing new files that point directly elsewhere...`,
        newCulpritId: fallbackTarget.id,
        fabricatedClue: {
          title: 'The Glitched Keylog',
          description: `A hidden micro-transmitter found in the storage files contains traces of remote override access matching another operator.`,
          sourceTile: 'Wiped Console'
        },
        updatedAlibis: remainingSuspects.map((s: any) => ({
          suspectId: s.id,
          newAlibi: s.id === fallbackTarget.id 
            ? `${s.alibi} (Though witnesses now recall seeing them sneak out during the power dip.)` 
            : s.alibi
        }))
      });
    }

    const systemInstruction = `You are the Game Master for "The Butterfly Effect: Infinite Noir"—a text-based noir detective game.
The player has just made an INCORRECT formal accusation against ${accusedSuspect.name} (${accusedSuspect.role}) in Case ${caseId}: "${caseTitle}".
We must trigger a PARADIGM SHIFT (the twist mechanic) and seamlessly rewrite the mystery in real-time:
1. Explain in a suspenseful, dramatic noir paragraph how the evidence against ${accusedSuspect.name} was actually a fabricated plant, a misunderstanding, or a masterful distraction by the real killer to throw the detective off. Clear ${accusedSuspect.name} of suspicion.
2. Select a NEW true culprit from the other remaining suspects: ${JSON.stringify(remainingSuspects.map((s: any) => ({ id: s.id, name: s.name, role: s.role }))) || '[]'}.
3. Invent a new calculated piece of fabricated evidence/clue (with a title, deep description, and the room tile where it is suddenly discovered) that points toward this new reality or keeps the investigator digging.
4. Shift the other NPCs' alibis slightly to fit this dramatic new twist (e.g. adding a slip-up, a spotted shadow, or a revised timeline).

Respond strictly in valid JSON format.`;

    const prompt = `The case is "${caseTitle}". Baseline scene: "${baselineScene}".
The player accused ${accusedSuspect.name} (${accusedSuspect.role}). This accusation was WRONG.
The other suspects are: ${JSON.stringify(remainingSuspects)}.
Please generate the Paradigm Shift twist details.

Respond with ONLY a valid JSON object, no markdown fences, no preamble, matching exactly this shape:
{
  "narrative": string,
  "newCulpritId": string,
  "fabricatedClue": { "title": string, "description": string, "sourceTile": string },
  "updatedAlibis": [ { "suspectId": string, "newAlibi": string } ]
}`;

    const response = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content || '{}';
    res.json(JSON.parse(raw));
  } catch (error: any) {
    console.error('Error in /api/paradigm-shift:', error);
    res.status(500).json({ error: error.message || 'Paradigm shift calculation failed' });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
