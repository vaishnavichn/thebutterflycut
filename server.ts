import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

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


// Lazy-loaded Google Gen AI client
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI suspect dialogue will fallback to canned responses.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
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

    // Convert history into the format required by contents
    const contents = history.map((msg: any) => ({
      role: msg.sender === 'player' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Append the new user input
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 300,
      }
    });

    res.json({ text: response.text });
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate the fabricated physical evidence now.',
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text.trim();
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate the noir narrative.',
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 250,
      }
    });
    return response.text.trim();
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
Please generate the Paradigm Shift twist details.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: {
              type: Type.STRING,
              description: 'A dark, cinematic noir paragraph explaining why the accusation against the innocent suspect fell apart, clearing them, and signaling a dramatic twist.'
            },
            newCulpritId: {
              type: Type.STRING,
              description: 'The ID of the newly assigned true culprit from the remaining suspects list.'
            },
            fabricatedClue: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Short, atmospheric title for the newly emerged clue.' },
                description: { type: Type.STRING, description: 'Noir description of this newly uncovered fabricated clue.' },
                sourceTile: { type: Type.STRING, description: 'The exact room tile name where this clue was found.' }
              },
              required: ['title', 'description', 'sourceTile']
            },
            updatedAlibis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  suspectId: { type: Type.STRING },
                  newAlibi: { type: Type.STRING, description: 'The updated alibi text incorporating the twist.' }
                },
                required: ['suspectId', 'newAlibi']
              }
            }
          },
          required: ['narrative', 'newCulpritId', 'fabricatedClue', 'updatedAlibis']
        }
      }
    });

    res.json(JSON.parse(response.text));
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
