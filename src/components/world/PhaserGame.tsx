import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ROOM_ZONES, WALLS, NPC_SPAWNS, CLUE_OBJECTS, RoomZone } from './galleryMap';
import { RoomTile, Clue } from '../../types';
import { HelpCircle, Navigation, ShieldCheck, Eye } from 'lucide-react';

interface PhaserGameProps {
  roomMatrix: RoomTile[][];
  discoveredClues: Clue[];
  onInspectTile: (tile: RoomTile) => void;
  selectedTile: RoomTile | null;
  onSelectSuspect: (suspectId: string | null) => void;
  activeSuspectId: string | null;
  onTerminalLog: (log: string) => void;
}

// -------------------------------------------------------------
// PHASER CUSTOM CLASSES & SCENE
// -------------------------------------------------------------

class PlayerContainer extends Phaser.GameObjects.Container {
  body!: Phaser.Physics.Arcade.Body;
  graphics: Phaser.GameObjects.Graphics;
  direction: string = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(true);
    this.body.setSize(24, 24);
    this.body.setOffset(-12, -12);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawPlayer();
  }

  drawPlayer() {
    this.graphics.clear();
    // Outer shadow
    this.graphics.fillStyle(0x000000, 0.4);
    this.graphics.fillCircle(2, 2, 12);

    // Inner filled silhouette - carbon black
    this.graphics.fillStyle(0x0c0c0c, 1);
    this.graphics.fillCircle(0, 0, 12);

    // Outline - bright amber
    this.graphics.lineStyle(2, 0xffb000, 1);
    this.graphics.strokeCircle(0, 0, 12);

    // Directional indicator notch / triangle
    this.graphics.fillStyle(0xffb000, 1);
    if (this.direction === 'up') {
      this.graphics.fillTriangle(-4, -6, 4, -6, 0, -13);
    } else if (this.direction === 'down') {
      this.graphics.fillTriangle(-4, 6, 4, 6, 0, 13);
    } else if (this.direction === 'left') {
      this.graphics.fillTriangle(-6, -4, -6, 4, -13, 0);
    } else if (this.direction === 'right') {
      this.graphics.fillTriangle(6, -4, 6, 4, 13, 0);
    }
  }

  setDirection(dir: string) {
    if (this.direction !== dir) {
      this.direction = dir;
      this.drawPlayer();
    }
  }
}

class NpcContainer extends Phaser.GameObjects.Container {
  graphics: Phaser.GameObjects.Graphics;
  glowGraphics: Phaser.GameObjects.Graphics;
  npcId: string;
  npcName: string;
  colorHex: string;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string, colorHex: string) {
    super(scene, x, y);
    scene.add.existing(this);
    
    this.npcId = id;
    this.npcName = name;
    this.colorHex = colorHex;

    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;

    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // Draw main body silhouette
    this.graphics.fillStyle(0x0c0c0c, 1);
    this.graphics.fillCircle(0, 0, 14);
    this.graphics.lineStyle(2.5, color, 1);
    this.graphics.strokeCircle(0, 0, 14);

    // Draw distinguishing characteristics
    if (id === 'curator') {
      // Glasses/spectacles hint
      this.graphics.lineStyle(1.5, 0xffffff, 0.9);
      this.graphics.strokeCircle(-4, -2, 3.5);
      this.graphics.strokeCircle(4, -2, 3.5);
      this.graphics.beginPath();
      this.graphics.moveTo(-1, -2);
      this.graphics.lineTo(1, -2);
      this.graphics.strokePath();
    } else if (id === 'cleaner') {
      // Cap outline visor hint (curved visor on top)
      this.graphics.fillStyle(color, 0.8);
      this.graphics.fillTriangle(-7, -10, 7, -10, 0, -15);
    } else if (id === 'nanny') {
      // Soft hair form
      this.graphics.fillStyle(color, 0.5);
      this.graphics.fillCircle(0, -11, 4.5);
      this.graphics.lineStyle(1, 0xffffff, 0.6);
      this.graphics.strokeCircle(0, -11, 4.5);
    } else if (id === 'security') {
      // Broad shoulders / uniform detail
      this.graphics.fillStyle(0x0c0c0c, 1);
      this.graphics.fillRect(-16, 9, 32, 6);
      this.graphics.lineStyle(2, color, 1);
      this.graphics.strokeRect(-16, 9, 32, 6);
    }
  }

  updateGlow(time: number) {
    this.glowGraphics.clear();
    const colorVal = Phaser.Display.Color.HexStringToColor(this.colorHex).color;
    const radius = 17 + Math.sin(time * 0.005) * 3.5;
    const alpha = 0.12 + Math.sin(time * 0.005) * 0.06;
    this.glowGraphics.fillStyle(colorVal, alpha);
    this.glowGraphics.fillCircle(0, 0, radius);
  }
}

class ClueContainer extends Phaser.GameObjects.Container {
  graphics: Phaser.GameObjects.Graphics;
  clueId: string;
  roomId: string;
  title: string;

  constructor(scene: Phaser.Scene, x: number, y: number, clueId: string, roomId: string, title: string) {
    super(scene, x, y);
    scene.add.existing(this);
    this.clueId = clueId;
    this.roomId = roomId;
    this.title = title;

    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawClue(false);
  }

  drawClue(isInspected: boolean) {
    this.graphics.clear();
    if (!isInspected) {
      // Pulse background glow for undiscovered clue
      this.graphics.fillStyle(0xef4444, 0.2);
      this.graphics.fillCircle(0, 0, 14);
      
      // Outer red warning outline
      this.graphics.lineStyle(1.5, 0xef4444, 0.8);
      this.graphics.strokeCircle(0, 0, 8);
      
      // Small core
      this.graphics.fillStyle(0xef4444, 1);
      this.graphics.fillCircle(0, 0, 4);
    } else {
      // Discovered evidence log badge
      this.graphics.fillStyle(0x00ffd2, 0.1);
      this.graphics.fillCircle(0, 0, 10);
      
      this.graphics.fillStyle(0x00ffd2, 1);
      this.graphics.fillRect(-3, -3, 6, 6);
      this.graphics.lineStyle(1, 0xffffff, 0.8);
      this.graphics.strokeRect(-3, -3, 6, 6);
    }
  }
}

class GalleryScene extends Phaser.Scene {
  player!: PlayerContainer;
  npcGroup!: Phaser.GameObjects.Group;
  clueGroup!: Phaser.GameObjects.Group;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  keyE!: Phaser.Input.Keyboard.Key;
  keySpace!: Phaser.Input.Keyboard.Key;

  // React Callbacks and States
  onRoomEntered!: (roomId: string) => void;
  onSelectSuspect!: (suspectId: string | null) => void;
  onTerminalLog!: (log: string) => void;
  onInspectTile!: (tile: RoomTile) => void;
  
  roomMatrix!: RoomTile[][];
  discoveredClues!: Clue[];
  activeSuspectId!: string | null;

  currentRoomId: string | null = null;
  approachedNpcId: string | null = null;
  promptText!: Phaser.GameObjects.Text;
  roomLabels: { [key: string]: Phaser.GameObjects.Text } = {};

  // For throttling inspect logs
  visitedRooms: Set<string> = new Set();

  constructor() {
    super('GalleryScene');
  }

  init(data: any) {
    this.onRoomEntered = data.onRoomEntered;
    this.onSelectSuspect = data.onSelectSuspect;
    this.onTerminalLog = data.onTerminalLog;
    this.onInspectTile = data.onInspectTile;
    this.roomMatrix = data.roomMatrix;
    this.discoveredClues = data.discoveredClues;
    this.activeSuspectId = data.activeSuspectId;
  }

  create() {
    // Enable Arcade physics bounds matching layout bounds (800x630)
    this.physics.world.setBounds(0, 0, 800, 630);

    // 1. Draw Gallery floor plan room zones
    const floorGraphics = this.add.graphics();
    ROOM_ZONES.forEach((zone) => {
      // Room background floor
      floorGraphics.fillStyle(zone.color, 1);
      floorGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);

      // Subtle room grid borders
      floorGraphics.lineStyle(1.5, 0x222222, 1);
      floorGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Inner elegant thin border for style
      floorGraphics.lineStyle(1, 0xffb000, 0.05);
      floorGraphics.strokeRect(zone.x + 4, zone.y + 4, zone.width - 8, zone.height - 8);

      // Add elegant room labels matching retro terminal
      const label = this.add.text(
        zone.x + zone.width / 2,
        zone.y + 18,
        zone.name.toUpperCase(),
        {
          fontFamily: 'monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }
      ).setOrigin(0.5).setAlpha(0.35);

      this.roomLabels[zone.id] = label;
    });

    // 2. Set up physical solid walls as static bodies
    const wallGroup = this.physics.add.staticGroup();
    
    // Draw wall overlays for beautiful blueprint visuals
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x0c0c0c, 1);
    wallGraphics.lineStyle(2, 0xffb000, 0.3); // Cyber-noir Amber wall line

    WALLS.forEach((wall) => {
      // Create physics solid body
      const wBody = wallGroup.create(wall.x, wall.y) as Phaser.Physics.Arcade.Sprite;
      wBody.setVisible(false); // Render physically but customize visual drawing
      
      // Match physical size
      const body = wBody.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(wall.width, wall.height);
      body.updateFromGameObject();

      // Visual rectangle rendering
      const topX = wall.x - wall.width / 2;
      const topY = wall.y - wall.height / 2;
      wallGraphics.fillRect(topX, topY, wall.width, wall.height);
      wallGraphics.strokeRect(topX, topY, wall.width, wall.height);
    });

    // 3. Create NPC Suspect Sprites
    this.npcGroup = this.add.group();
    NPC_SPAWNS.forEach((spawn) => {
      const npc = new NpcContainer(this, spawn.x, spawn.y, spawn.id, spawn.name, spawn.color);
      this.npcGroup.add(npc);

      // Add a small label under the suspect
      this.add.text(
        spawn.x,
        spawn.y + 20,
        spawn.name.split(' ')[0].toUpperCase(),
        {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: spawn.color,
          stroke: '#000000',
          strokeThickness: 2
        }
      ).setOrigin(0.5);
    });

    // 4. Create Clue objects in rooms
    this.clueGroup = this.add.group();
    CLUE_OBJECTS.forEach((c) => {
      // Check if this clue has already been discovered in the session
      const isDiscovered = this.discoveredClues.some(dc => dc.id === c.id);
      
      const clueObj = new ClueContainer(this, c.x, c.y, c.id, c.roomId, c.title);
      clueObj.drawClue(isDiscovered);
      this.clueGroup.add(clueObj);
    });

    // 5. Spawn Player Character at Main Hall center
    this.player = new PlayerContainer(this, 400, 320);
    this.physics.add.collider(this.player, wallGroup);

    // 6. Camera Follow System
    this.cameras.main.setBounds(0, 0, 800, 630);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.15); // Slight zoom for cosy noir detective feel

    // 7. Input system cursors + WASD
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D
    }) as any;

    this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Floating Interaction Prompts above characters
    this.promptText = this.add.text(
      400, 
      300, 
      '', 
      {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffb000',
        backgroundColor: '#0c0c0c',
        padding: { x: 5, y: 3 },
        stroke: '#ffb000',
        strokeThickness: 1
      }
    ).setOrigin(0.5).setVisible(false).setDepth(100);

    // Track previously visited rooms to avoid initial log spam
    this.roomMatrix.forEach(row => {
      row.forEach(t => {
        if (t.isInspected) {
          this.visitedRooms.add(t.id);
        }
      });
    });

    this.onTerminalLog('Walkable Gallery initialized. Use WASD/Arrows to explore.');
  }

  update(time: number, delta: number) {
    // 1. Handle player movement & pulse walking juice
    let vx = 0;
    let vy = 0;
    const speed = 145; // Smooth slow noir exploration speed

    // Disable controls if typing in an input element
    const isInputActive = 
      document.activeElement?.tagName === 'INPUT' || 
      document.activeElement?.tagName === 'TEXTAREA';

    if (!isInputActive) {
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        vx = -speed;
        this.player.setDirection('left');
      } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        vx = speed;
        this.player.setDirection('right');
      }

      if (this.cursors.up.isDown || this.wasd.W.isDown) {
        vy = -speed;
        this.player.setDirection('up');
      } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
        vy = speed;
        this.player.setDirection('down');
      }
    }

    this.player.body.setVelocity(vx, vy);

    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      const pulse = 1 + Math.sin(time * 0.015) * 0.08;
      this.player.setScale(pulse);
    } else {
      this.player.setScale(1);
    }

    // 2. Room Detection & Inspect Auto-trigger
    let currentRoom: RoomZone | null = null;
    ROOM_ZONES.forEach((zone) => {
      if (
        this.player.x >= zone.x &&
        this.player.x <= zone.x + zone.width &&
        this.player.y >= zone.y &&
        this.player.y <= zone.y + zone.height
      ) {
        currentRoom = zone;
      }
    });

    if (currentRoom) {
      const rZone: RoomZone = currentRoom;
      // Highlight current room label
      Object.keys(this.roomLabels).forEach((id) => {
        if (id === rZone.id) {
          this.roomLabels[id].setAlpha(1.0).setColor('#ffb000');
        } else {
          this.roomLabels[id].setAlpha(0.35).setColor('#ffffff');
        }
      });

      if (this.currentRoomId !== rZone.id) {
        this.currentRoomId = rZone.id;
        this.onRoomEntered(rZone.id);

        // Auto trigger inspect if not inspected yet (or hasn't logged visited)
        if (!this.visitedRooms.has(rZone.id)) {
          this.visitedRooms.add(rZone.id);
          
          // Match matching RoomTile inside roomMatrix
          let matchedTile: RoomTile | null = null;
          this.roomMatrix.forEach(row => {
            row.forEach(t => {
              if (t.id === rZone.id) {
                matchedTile = t;
              }
            });
          });

          if (matchedTile) {
            this.onInspectTile(matchedTile);
          }
        }
      }
    }

    // 3. Update NPC Glows & Proximity Interaction checks
    let closestNpc: NpcContainer | null = null;
    let minDistance = 999999;

    this.npcGroup.getChildren().forEach((gameObject) => {
      const npc = gameObject as NpcContainer;
      npc.updateGlow(time);

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestNpc = npc;
      }
    });

    // If within 45px, trigger interaction prompt
    if (closestNpc && minDistance < 45) {
      const npc = closestNpc as NpcContainer;
      this.approachedNpcId = npc.npcId;
      
      // Display hover prompt E
      this.promptText
        .setPosition(npc.x, npc.y - 30)
        .setText(`[ E ] INTERROGATE ${npc.npcName.split(' ')[0].toUpperCase()}`)
        .setVisible(true);

      // Listen for E / Space press to select/chat
      if (!isInputActive && (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace))) {
        this.onSelectSuspect(npc.npcId);
        this.onTerminalLog(`Scanning suspect matrix: Interrogating ${npc.npcName}`);
      }
    } else {
      this.approachedNpcId = null;
      this.promptText.setVisible(false);
    }

    // 4. Update Clues discoveries visually
    this.clueGroup.getChildren().forEach((clueObj) => {
      const c = clueObj as ClueContainer;
      const isDiscovered = this.discoveredClues.some(dc => dc.id === c.clueId);
      c.drawClue(isDiscovered);
    });
  }

  // Handle external updates of state (e.g. newly discovered clues / inspections)
  syncExternalState(roomMatrix: RoomTile[][], discoveredClues: Clue[], activeSuspectId: string | null) {
    this.roomMatrix = roomMatrix;
    this.discoveredClues = discoveredClues;
    this.activeSuspectId = activeSuspectId;
  }
}

// -------------------------------------------------------------
// REACT PHASER COMPONENT WRAPPER
// -------------------------------------------------------------

export default function PhaserGame({
  roomMatrix,
  discoveredClues,
  onInspectTile,
  selectedTile,
  onSelectSuspect,
  activeSuspectId,
  onTerminalLog
}: PhaserGameProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GalleryScene | null>(null);

  const [currentArea, setCurrentArea] = useState<string>('MAIN HALL');

  useEffect(() => {
    if (!parentRef.current) return;

    // Destroy existing game instance if any
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 630,
      parent: parentRef.current,
      backgroundColor: '#070707',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [GalleryScene]
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Start scene with custom React state links
    game.scene.start('GalleryScene', {
      roomMatrix,
      discoveredClues,
      activeSuspectId,
      onInspectTile,
      onSelectSuspect,
      onTerminalLog,
      onRoomEntered: (roomId: string) => {
        // Map roomId back to human label for HUD
        const zone = ROOM_ZONES.find(z => z.id === roomId);
        if (zone) {
          setCurrentArea(zone.name.toUpperCase());
        }
      }
    });

    // Keep a handy handle on the scene
    const onSceneCreate = () => {
      const scene = game.scene.getScene('GalleryScene') as GalleryScene;
      if (scene) {
        sceneRef.current = scene;
      }
    };
    game.events.on('ready', onSceneCreate);

    return () => {
      game.events.off('ready', onSceneCreate);
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  // Update scene states dynamically when React props mutate
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncExternalState(roomMatrix, discoveredClues, activeSuspectId);
    }
  }, [roomMatrix, discoveredClues, activeSuspectId]);

  return (
    <div className="w-full h-full flex flex-col gap-3 relative">
      {/* Immersive HUD Panel */}
      <div className="bg-[#0c0c0c] border border-[#333] p-3 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-[#FFB000]">
          <Navigation size={14} className="animate-pulse" />
          <span className="uppercase tracking-widest font-black">DETECTOR COORDINATES</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">CURRENT REGION:</span>
          <span className="px-2 py-0.5 bg-[#FFB000]/10 border border-[#FFB000]/30 text-[#FFB000] font-black rounded-sm animate-pulse">
            {currentArea}
          </span>
        </div>
      </div>

      {/* Phaser Canvas Holder */}
      <div 
        ref={parentRef} 
        id="phaser-container"
        className="w-full flex-1 aspect-video min-h-[440px] bg-[#070707] border border-[#333] relative overflow-hidden"
      >
        {/* Subtle Canvas instruction overlays */}
        <div className="absolute top-2 left-2 bg-[#0c0c0c]/90 border border-[#333] p-2 text-[9px] font-mono text-[#aaa] pointer-events-none select-none z-10 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">WASD</span> / <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">▲▼◀▶</span>
            <span>Move Explorer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">E</span> / <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">Space</span>
            <span>Question Suspect</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-[#0c0c0c]/90 border border-[#333] p-2 text-[9px] font-mono text-[#aaa] pointer-events-none select-none z-10 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-yellow-500 bg-yellow-950/40"></span>
            <span>Player (You)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-purple-500 bg-purple-950/40"></span>
            <span>Suspect (NPC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>Unexplored Clue Traces</span>
          </div>
        </div>
      </div>
    </div>
  );
}
