import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_ZONES, CLUE_OBJECTS, RoomZone } from '../world/galleryMap';
import { RoomTile, Clue } from '../../types';
import { HelpCircle, Navigation, ShieldCheck, Eye, AlertTriangle } from 'lucide-react';
import GalleryBuilding, { to3DCoords } from './GalleryBuilding';
import Player3D, { gameAudio } from './Player3D';
import NPC3D from './NPC3D';
import { Html } from '@react-three/drei';

// ─────────────────────────────────────────────────────────
// Atmospheric dust motes floating through the gallery
// ─────────────────────────────────────────────────────────
function DustParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 90;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 18,
        y: Math.random() * 1.75 + 0.15,
        z: (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 0.006,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.006,
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += Math.sin(state.clock.elapsedTime * 0.45 + p.phase) * 0.0012;
      p.z += p.vz;
      if (p.x > 9.5) p.x = -9.5;
      if (p.x < -9.5) p.x = 9.5;
      if (p.z > 7.5) p.z = -7.5;
      if (p.z < -7.5) p.z = 7.5;
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.013, 4, 4]} />
      <meshBasicMaterial color="#ffe8c0" transparent opacity={0.3} />
    </instancedMesh>
  );
}

interface GallerySceneProps {
  roomMatrix: RoomTile[][];
  discoveredClues: Clue[];
  onInspectTile: (tile: RoomTile) => void;
  selectedTile: RoomTile | null;
  onSelectSuspect: (suspectId: string | null) => void;
  activeSuspectId: string | null;
  onTerminalLog: (log: string) => void;
}

export default function GalleryScene({
  roomMatrix,
  discoveredClues,
  onInspectTile,
  selectedTile,
  onSelectSuspect,
  activeSuspectId,
  onTerminalLog
}: GallerySceneProps) {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>('Main_Hall');
  const [playerCoords, setPlayerCoords] = useState({ x: 400, y: 320 });
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 3D Shared refs for high performance first-person interaction calculations
  const player3DPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.4, 0));
  const playerYawRef = useRef<number>(0);
  const playerPitchRef = useRef<number>(0);


  // Detect current room based on player 2D position
  const handlePositionUpdate = (x: number, y: number) => {
    setPlayerCoords({ x, y });

    // 1. Calculate room zone boundaries
    let insideRoom: RoomZone | null = null;
    for (const zone of ROOM_ZONES) {
      if (x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) {
        insideRoom = zone;
        break;
      }
    }

    if (insideRoom && currentRoomId !== insideRoom.id) {
      setCurrentRoomId(insideRoom.id);
    }
  };

  // Track wrapper height via ResizeObserver so canvas always has pixel-perfect height
  useEffect(() => {
    // Check WebGL support first
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      return;
    }

    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      if (h > 0) setCanvasHeight(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Log initial instructions to Terminal
  useEffect(() => {
    onTerminalLog('NOIR PROTOCOL 3D Gallery Environment Online.');
    onTerminalLog('CONTROLS: [W/A/S/D] to move. Click/drag or arrow keys to look around.');
    onTerminalLog('Walk up to clues or suspects and press [E] to investigate or interrogate.');
  }, []);


  const isChatOpen = activeSuspectId !== null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [pointerLockFailed, setPointerLockFailed] = useState(false);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement !== null;
      setIsPointerLocked(isLocked);
      console.log(`Pointer lock status changed: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
    };

    const handlePointerLockError = (err: Event) => {
      console.error('Pointer lock failed / was denied by the browser:', err);
      setPointerLockFailed(true);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);

  const handleContainerClick = () => {
    if (isChatOpen) return;

    // Explicitly set calibrated state to dismiss overlay fallback
    setIsCalibrated(true);

    console.log('Pointer lock requested');
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      try {
        const promise = canvas.requestPointerLock() as any;
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err: any) => {
            console.error('Pointer lock request was rejected:', err);
            setPointerLockFailed(true);
          });
        }
      } catch (err) {
        console.error('Failed to request pointer lock via canvas.requestPointerLock():', err);
        setPointerLockFailed(true);
      }
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Immersive HUD Panel */}
      <div className="bg-[#0c0c0c] border-b border-[#333] p-3 flex items-center justify-between font-mono text-xs flex-shrink-0">
        <div className="flex items-center gap-2 text-[#FFB000]">
          <Navigation size={14} className="animate-pulse" />
          <span className="uppercase tracking-widest font-black">LUMINA GALLERY HOLOGRAPHIC SCANNER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-bold">CURRENT SECTOR:</span>
          <span className="px-2 py-0.5 bg-[#FFB000]/10 border border-[#FFB000]/30 text-[#FFB000] font-black rounded-sm animate-pulse uppercase">
            {ROOM_ZONES.find((z) => z.id === currentRoomId)?.name || 'TRANSIT'}
          </span>
        </div>
      </div>

      {/* Outer wrapper — measured by ResizeObserver for pixel-perfect canvas height */}
      <div ref={wrapperRef} className="flex-1" style={{ position: 'relative', minHeight: '440px' }}>
        {!webGLSupported ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] font-mono text-center p-6">
            <AlertTriangle size={48} className="text-amber-500 mb-4" />
            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-2">WebGL Not Available</p>
            <p className="text-gray-500 text-xs max-w-sm">
              Your browser or environment does not support WebGL. Try opening the game directly in Chrome or Firefox at <span className="text-amber-400">http://localhost:3000</span>.
            </p>
          </div>
        ) : (
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' }}
          >
            <Canvas
              frameloop="always"
              shadows
              camera={{ fov: 75, position: [0, 1.4, -2], near: 0.05, far: 200 }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              onCreated={({ gl, scene }) => {
                gl.setClearColor('#0f0d0b', 1);
                scene.background = new THREE.Color('#0f0d0b');
                console.log('[R3F] Canvas created. Size:', gl.domElement.width, 'x', gl.domElement.height);
              }}
              style={{ width: '100%', height: `${canvasHeight}px`, display: 'block' }}
            >
              <color attach="background" args={['#0f0d0b']} />
              <fogExp2 attach="fog" color="#0f0d0b" density={0.038} />

              {/* Atmospheric noir lighting */}
              <ambientLight intensity={0.28} />
              <hemisphereLight args={['#2a1e0a', '#080608', 0.6]} />
              <directionalLight position={[8, 18, 6]} intensity={0.7} castShadow shadow-mapSize={1024} />
              <directionalLight position={[-6, 12, -4]} intensity={0.25} />
              {/* Warm fill from below for subtle bounce */}
              <pointLight position={[0, 0.1, 0]} color="#3a2810" intensity={0.4} distance={14} decay={1.5} />

              {/* 3D Scene Components */}
              <GalleryBuilding currentRoomId={currentRoomId} />

              <Player3D
                onPositionUpdate={handlePositionUpdate}
                isChatOpen={isChatOpen}
                player3DPosRef={player3DPosRef}
                playerYawRef={playerYawRef}
                playerPitchRef={playerPitchRef}
              />

              <NPC3D
                player3DPosRef={player3DPosRef}
                onInterrogate={onSelectSuspect}
                isChatOpen={isChatOpen}
              />

              <Clues3D
                discoveredClues={discoveredClues}
                player3DPosRef={player3DPosRef}
                roomMatrix={roomMatrix}
                onInspectTile={onInspectTile}
              />

              {/* Atmospheric floating dust motes */}
              <DustParticles />
            </Canvas>

            {/* Sensory Mode Calibration Overlay Prompt */}
            {!isCalibrated && !isPointerLocked && !isChatOpen && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center font-mono text-center select-none z-20 animate-fade-in">
                <div className="border border-[#FFB000]/60 bg-[#0c0c0c]/95 px-6 py-5 max-w-sm flex flex-col items-center gap-3 shadow-[0_0_30px_rgba(255,176,0,0.25)] rounded-sm">
                  <span className="text-[#FFB000] text-xs font-black tracking-[0.25em] animate-pulse">
                    [ SENSORY CALIBRATION REQUIRED ]
                  </span>
                  <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-wider">
                    Click inside the gallery scanner viewport to sync physical motion sensors and activate first-person controls.
                  </p>
                  <button
                    type="button"
                    onClick={handleContainerClick}
                    className="text-[9px] px-3 py-1.5 bg-[#FFB000]/20 hover:bg-[#FFB000]/30 text-[#FFB000] border border-[#FFB000]/50 uppercase tracking-widest font-black cursor-pointer transition-colors"
                  >
                    CLICK TO ACTIVATE PROTOCOL
                  </button>
                </div>
              </div>
            )}

            {/* Pointer Lock Status Fallback Banner */}
            {isCalibrated && !isPointerLocked && !isChatOpen && (
              <div className="absolute top-2 right-2 bg-amber-950/90 border border-amber-500/50 p-2 font-mono text-[9px] text-amber-300 pointer-events-none select-none z-10 animate-pulse rounded-sm shadow-md max-w-xs">
                ⚠️ Pointer lock unavailable — Click and drag viewport to look around | WASD to move
              </div>
            )}

            {/* HUD Overlay guides */}
            <div className="absolute top-2 left-2 bg-[#0c0c0c]/90 border border-[#333] p-2 text-[9px] font-mono text-[#aaa] pointer-events-none select-none z-10 flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">W,A,S,D</span>
                <span>Walk around</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 bg-[#333] text-white font-bold rounded-xs">Click + Drag</span> / <span className="px-1 py-0.2 bg-[#333] text-white font-bold rounded-xs">▲▼◀▶</span>
                <span>Look Around</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 bg-[#ffb000] text-black font-extrabold rounded-xs">E</span>
                <span>Investigate Clue / Interrogate NPC</span>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-[#0c0c0c]/90 border border-[#333] p-2 text-[9px] font-mono text-[#aaa] pointer-events-none select-none z-10 flex flex-col gap-1 shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-purple-500 bg-purple-950/40"></span>
                <span>Suspect — walk close and press E</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#ff4444] animate-pulse"></span>
                <span>Evidence — walk close and press E</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Helper: proximity check for clue interaction
function isNearTarget(
  playerPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  maxDistance = 2.2
): boolean {
  return playerPos.distanceTo(targetPos) <= maxDistance;
}

// -------------------------------------------------------------
// CLUES 3D CONTAINER COMPONENT
// -------------------------------------------------------------
interface Clues3DProps {
  discoveredClues: Clue[];
  player3DPosRef: React.RefObject<THREE.Vector3 | null>;
  roomMatrix: RoomTile[][];
  onInspectTile: (tile: RoomTile) => void;
}

function Clues3D({
  discoveredClues,
  player3DPosRef,
  roomMatrix,
  onInspectTile
}: Clues3DProps) {
  return (
    <group>
      {CLUE_OBJECTS.map((clue) => {
        const isDiscovered = discoveredClues.some((dc) => dc.id === clue.id);
        const pos2D = { x: clue.x, y: clue.y };
        const coords = to3DCoords(clue.x, clue.y);
        const pos3D = new THREE.Vector3(coords.x, 0.22, coords.z); // Clues lay close to floor

        return (
          <SingleClue
            key={clue.id}
            clue={clue}
            pos3D={pos3D}
            isDiscovered={isDiscovered}
            player3DPosRef={player3DPosRef}
            roomMatrix={roomMatrix}
            onInspectTile={onInspectTile}
          />
        );
      })}
    </group>
  );
}

// -------------------------------------------------------------
// INDIVIDUAL CLUE COMPONENT (WITH E KEY INTERACTION)
// -------------------------------------------------------------
interface SingleClueProps {
  clue: typeof CLUE_OBJECTS[0];
  pos3D: THREE.Vector3;
  isDiscovered: boolean;
  player3DPosRef: React.RefObject<THREE.Vector3 | null>;
  roomMatrix: RoomTile[][];
  onInspectTile: (tile: RoomTile) => void;
}

function SingleClue({
  clue,
  pos3D,
  isDiscovered,
  player3DPosRef,
  roomMatrix,
  onInspectTile
}: SingleClueProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const wasHighlightedRef = useRef(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (isDiscovered) {
        // Discovered clues float in place with constant spin
        meshRef.current.rotation.y = state.clock.elapsedTime * 1.2;
        meshRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 2.0) * 0.02;
      } else {
        // Undiscovered clues remain static/subtle on ground
        meshRef.current.position.y = 0.15;
      }
    }

    // Proximity check — walk up to clues to interact
    if (player3DPosRef.current && !isDiscovered) {
      const near = isNearTarget(player3DPosRef.current, pos3D);

      if (near !== isHighlighted) {
        setIsHighlighted(near);
      }

      if (near && !wasHighlightedRef.current) {
        gameAudio.playHighlightCue();
      }
      wasHighlightedRef.current = near;
    } else {
      if (isHighlighted) setIsHighlighted(false);
    }
  });

  // 2. Interact listener on 'E'
  useEffect(() => {
    if (!isHighlighted || isDiscovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key.toLowerCase() === 'e') {
        // Find corresponding RoomTile inside roomMatrix
        let matchedTile: RoomTile | null = null;
        for (const row of roomMatrix) {
          for (const t of row) {
            if (t.id === clue.roomId) {
              matchedTile = t;
              break;
            }
          }
          if (matchedTile) break;
        }

        if (matchedTile) {
          onInspectTile(matchedTile);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHighlighted, isDiscovered, clue, roomMatrix, onInspectTile]);

  // Different mesh shapes/colors depending on the evidence type
  const isCrate = clue.id === 'storage_crate';
  const isFootprint = clue.id === 'storage_footprint';
  const isPaper = clue.id === 'signout_sheet' || clue.id === 'cleaning_schedule' || clue.id === 'security_maintenance_note' || clue.id === 'draft_letter';

  // Bright red undiscovered, cyber-teal discovered
  const activeColor = isDiscovered ? '#00ffd2' : (isHighlighted ? '#ffb000' : '#d13c3c');
  const emissiveColor = isDiscovered ? '#00ffd2' : (isHighlighted ? '#ffb000' : '#661111');

  return (
    <group position={[pos3D.x, pos3D.y, pos3D.z]}>
      {/* Immersive 3D HUD inspection target prompt */}
      {isHighlighted && !isDiscovered && (
        <Html distanceFactor={6} position={[0, 0.45, 0]} center>
          <div className="bg-[#0c0c0c]/95 border border-[#ffb000] text-[#ffb000] font-mono px-3 py-1.5 rounded-xs text-[10px] whitespace-nowrap shadow-[0_0_15px_rgba(255,176,0,0.45)] flex flex-col items-center gap-0.5 animate-bounce select-none pointer-events-none">
            <span className="font-extrabold tracking-widest text-[11px]">[ E ] INVESTIGATE COGNITIVE TRACE</span>
            <span className="text-gray-400 text-[8px]">{clue.title.toUpperCase()}</span>
          </div>
        </Html>
      )}

      {/* Actual 3D Mesh Geometry representing physical clues */}
      <mesh ref={meshRef} castShadow receiveShadow>
        {isCrate ? (
          // Crate box
          <boxGeometry args={[0.35, 0.35, 0.35]} />
        ) : isFootprint ? (
          // Footprint ring decal
          <ringGeometry args={[0.04, 0.16, 8]} />
        ) : isPaper ? (
          // Sheet of paper thin board
          <boxGeometry args={[0.26, 0.01, 0.18]} />
        ) : (
          // Terminal/Device cylinder
          <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
        )}

        <meshStandardMaterial
          color={activeColor}
          emissive={emissiveColor}
          emissiveIntensity={isHighlighted ? 0.6 : (isDiscovered ? 0.35 : 0.2)}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}
