import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_ZONES, CLUE_OBJECTS, RoomZone } from '../world/galleryMap';
import { RoomTile, Clue } from '../../types';
import { HelpCircle, Navigation, ShieldCheck, Eye, AlertTriangle } from 'lucide-react';
import GalleryBuilding, { to3DCoords } from './GalleryBuilding';
import Player3D, { gameAudio } from './Player3D';
import NPC3D from './NPC3D';
import { Html, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';

const DEBUG = false;

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

  // Doors state: positions are aligned with the gaps in the 2D walls
  const [doors, setDoors] = useState([
    { id: 'door_vault_storage', name: 'Vault - Storage Gate', x: 240, y: 150, width: 10, height: 50, isOpen: false },
    { id: 'door_vault_west', name: 'Vault - West Wing Gate', x: 225, y: 180, width: 30, height: 10, isOpen: false },
    { id: 'door_west_front', name: 'West Wing - Front Desk Gate', x: 50, y: 320, width: 40, height: 10, isOpen: false },
    { id: 'door_west_main', name: 'West Wing - Main Hall Gate', x: 240, y: 210, width: 10, height: 50, isOpen: false },
    { id: 'door_front_main', name: 'Front Desk - Main Hall Gate', x: 240, y: 355, width: 10, height: 70, isOpen: false },
    { id: 'door_front_curator', name: 'Front Desk - Curator Gate', x: 240, y: 460, width: 10, height: 10, isOpen: false },
    { id: 'door_curator_main', name: 'Curator - Main Hall Gate', x: 240, y: 535, width: 10, height: 50, isOpen: false },
    { id: 'door_storage_main', name: 'Storage - Main Hall Gate', x: 295, y: 180, width: 50, height: 10, isOpen: false },
    { id: 'door_security_storage', name: 'Security - Storage Gate', x: 560, y: 150, width: 10, height: 50, isOpen: false },
    { id: 'door_security_east', name: 'Security - East Wing Gate', x: 580, y: 180, width: 40, height: 10, isOpen: false },
    { id: 'door_east_break', name: 'East Wing - Break Room Gate', x: 560, y: 460, width: 10, height: 10, isOpen: false },
    { id: 'door_break_main', name: 'Break Room - Main Hall Gate', x: 530, y: 535, width: 10, height: 50, isOpen: false },
    { id: 'door_main_east', name: 'Main Hall - East Wing Gate', x: 560, y: 355, width: 10, height: 70, isOpen: false },
  ]);

  const toggleDoor = (doorId: string) => {
    setDoors((prevDoors) =>
      prevDoors.map((d) => (d.id === doorId ? { ...d, isOpen: !d.isOpen } : d))
    );
    onTerminalLog(`[GATE PROTOCOL] Toggled state for: ${doors.find(d => d.id === doorId)?.name}`);
  };

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
    onTerminalLog('Use the [OPEN/CLOSE] buttons floating near room gateways to manage security doors.');
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
      if (DEBUG) console.log(`Pointer lock status changed: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
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

    if (DEBUG) console.log('Pointer lock requested');
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
      <div className="bg-[#1E252B] border-b border-[#4A5768]/35 p-3 flex items-center justify-between font-mono text-xs flex-shrink-0 text-white shadow-lg">
        <div className="flex items-center gap-2 text-[#A63A2B]">
          <Navigation size={14} className="animate-pulse" />
          <span className="uppercase tracking-widest font-black">SCANDINAVIAN NOIR SCANNER (SCAND-IV)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#8B9BB4] font-bold">SECTOR READOUT:</span>
          <span className="px-2 py-0.5 bg-[#A63A2B]/15 border border-[#A63A2B]/40 text-[#A63A2B] font-black rounded-sm animate-pulse uppercase">
            {ROOM_ZONES.find((z) => z.id === currentRoomId)?.name || 'TRANSIT'}
          </span>
        </div>
      </div>

      {/* Outer wrapper — measured by ResizeObserver for pixel-perfect canvas height */}
      <div ref={wrapperRef} className="flex-1" style={{ position: 'relative', minHeight: '440px' }}>
        {!webGLSupported ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E252B] font-mono text-center p-6">
            <AlertTriangle size={48} className="text-[#A63A2B] mb-4" />
            <p className="text-[#A63A2B] text-sm font-bold uppercase tracking-widest mb-2">WebGL Not Available</p>
            <p className="text-gray-400 text-xs max-w-sm">
              Your browser or environment does not support WebGL. Try opening the game directly in Chrome or Firefox at <span className="text-[#A63A2B]">http://localhost:3000</span>.
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
                gl.setClearColor('#121518', 1);
                scene.background = new THREE.Color('#121518');
                if (DEBUG) console.log('[R3F] Canvas created. Size:', gl.domElement.width, 'x', gl.domElement.height);
              }}
              style={{ width: '100%', height: `${canvasHeight}px`, display: 'block' }}
            >
              <color attach="background" args={['#121518']} />
              <fogExp2 attach="fog" color="#121518" density={0.042} />

              {/* Atmospheric noir lighting */}
              <ambientLight intensity={0.22} />
              <hemisphereLight args={['#4A5768', '#1A1F24', 0.5]} />
              <directionalLight 
                position={[8, 18, 6]} 
                intensity={0.5} 
                castShadow 
                shadow-mapSize-width={2048} 
                shadow-mapSize-height={2048} 
              />
              <directionalLight position={[-6, 12, -4]} intensity={0.2} />
              {/* Cold Slate fill from below for subtle bounce */}
              <pointLight position={[0, 0.1, 0]} color="#4A5768" intensity={0.3} distance={14} decay={1.5} />

              {/* 3D Scene Components */}
              <GalleryBuilding currentRoomId={currentRoomId} doors={doors} onToggleDoor={toggleDoor} />

              <Player3D
                onPositionUpdate={handlePositionUpdate}
                isChatOpen={isChatOpen}
                player3DPosRef={player3DPosRef}
                playerYawRef={playerYawRef}
                playerPitchRef={playerPitchRef}
                doors={doors}
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

              <Environment preset="night" />

              <ContactShadows 
                position={[0, -0.01, 0]} 
                opacity={0.65} 
                scale={24} 
                blur={2.0} 
                far={4.5} 
              />

              <EffectComposer>
                <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.9} height={300} intensity={0.7} />
                <Vignette eskil={false} offset={0.15} darkness={1.15} />
                <Noise opacity={0.025} />
                <ChromaticAberration offset={new THREE.Vector2(0.0012, 0.0012)} />
              </EffectComposer>
            </Canvas>

            {/* Sensory Mode Calibration Overlay Prompt / Mini-Tutorial */}
            {!isCalibrated && !isPointerLocked && !isChatOpen && (
              <div className="absolute inset-0 bg-[#1A1F24]/85 backdrop-blur-[3px] flex flex-col items-center justify-center font-mono text-center select-none z-20 animate-fade-in">
                <div className="border border-[#A63A2B]/60 bg-[#1E252B]/95 px-6 py-5 max-w-sm flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(166,58,43,0.3)] rounded-sm">
                  <span className="text-[#A63A2B] text-xs font-black tracking-[0.25em] animate-pulse">
                    [ SYSTEM INITIALIZATION & TUTORIAL ]
                  </span>
                  
                  <div className="w-full flex flex-col gap-2 border-t border-b border-[#4A5768]/25 py-3 my-1 text-[9px] text-[#8B9BB4]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="px-1.5 py-0.5 bg-[#4A5768]/45 text-white font-bold rounded-xs whitespace-nowrap">W, A, S, D</span>
                      <span className="text-right">Move Detective</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="px-1.5 py-0.5 bg-[#4A5768]/45 text-white font-bold rounded-xs whitespace-nowrap">Click & Drag</span>
                      <span className="text-right">Look / Rotate Camera</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="px-1.5 py-0.5 bg-[#A63A2B] text-white font-extrabold rounded-xs whitespace-nowrap">E Key</span>
                      <span className="text-right">Examine Clue / Interrogate</span>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider">
                    Click the button below to sync sensors, capture pointer, and initiate the investigation.
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleContainerClick}
                    className="text-[9px] px-3 py-1.5 bg-[#A63A2B]/20 hover:bg-[#A63A2B]/35 text-[#A63A2B] border border-[#A63A2B]/50 uppercase tracking-widest font-black cursor-pointer transition-colors"
                  >
                    SYNC PROTOCOL SENSORS
                  </button>
                </div>
              </div>
            )}

            {/* Pointer Lock Status Fallback Banner */}
            {isCalibrated && !isPointerLocked && !isChatOpen && (
              <div className="absolute top-2 right-2 bg-[#A63A2B]/90 border border-[#A63A2B]/50 p-2 font-mono text-[9px] text-white pointer-events-none select-none z-10 animate-pulse rounded-sm shadow-md max-w-xs">
                ⚠️ Calibration Active — Click and drag viewport to look around | WASD to move
              </div>
            )}

            {/* Minimap Radar HUD */}
            {isCalibrated && (
              <div className="absolute bottom-2 right-2 z-10 select-none pointer-events-none">
                {/* Minimap Container */}
                <div className="bg-[#0a0f14]/92 border border-[#4A5768]/40 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-sm">
                  {/* Minimap Header */}
                  <div className="px-2 py-0.5 bg-[#1E252B] border-b border-[#4A5768]/25 flex items-center justify-between">
                    <span className="text-[7px] font-mono text-[#A63A2B] font-bold tracking-[0.15em] uppercase">SECTOR MAP</span>
                    <span className="text-[6px] font-mono text-[#4A5768]">LIVE</span>
                  </div>
                  
                  {/* SVG Minimap Canvas */}
                  <svg
                    width="160"
                    height="120"
                    viewBox="0 0 800 600"
                    className="block"
                    style={{ background: '#0d1117' }}
                  >
                    {/* Room zone rectangles */}
                    {ROOM_ZONES.map((zone) => {
                      const isCurrent = zone.id === currentRoomId;
                      return (
                        <rect
                          key={zone.id}
                          x={zone.x}
                          y={zone.y}
                          width={zone.width}
                          height={zone.height}
                          fill={isCurrent ? 'rgba(166, 58, 43, 0.15)' : 'rgba(74, 87, 104, 0.08)'}
                          stroke={isCurrent ? '#A63A2B' : '#4A5768'}
                          strokeWidth={isCurrent ? 3 : 1}
                          strokeOpacity={isCurrent ? 0.8 : 0.3}
                        />
                      );
                    })}

                    {/* Room labels */}
                    {ROOM_ZONES.map((zone) => (
                      <text
                        key={`label-${zone.id}`}
                        x={zone.x + zone.width / 2}
                        y={zone.y + zone.height / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={zone.id === currentRoomId ? '#A63A2B' : '#4A5768'}
                        fontSize="24"
                        fontFamily="monospace"
                        fontWeight={zone.id === currentRoomId ? 'bold' : 'normal'}
                        opacity={zone.id === currentRoomId ? 1 : 0.5}
                      >
                        {zone.name.length > 10 ? zone.name.substring(0, 10) + '…' : zone.name}
                      </text>
                    ))}

                    {/* Clue marker dots */}
                    {CLUE_OBJECTS.map((clue) => {
                      const isFound = discoveredClues.some(dc => dc.id === clue.id);
                      return (
                        <circle
                          key={`minimap-clue-${clue.id}`}
                          cx={clue.x}
                          cy={clue.y}
                          r={isFound ? 6 : 8}
                          fill={isFound ? '#4A5768' : '#A63A2B'}
                          opacity={isFound ? 0.4 : 0.9}
                        >
                          {!isFound && (
                            <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
                          )}
                        </circle>
                      );
                    })}

                    {/* Player position dot */}
                    <circle
                      cx={playerCoords.x}
                      cy={playerCoords.y}
                      r={10}
                      fill="#00ffd2"
                      opacity={0.9}
                    >
                      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Player direction cone */}
                    {(() => {
                      const yaw = playerYawRef.current || 0;
                      // Convert yaw to 2D map direction (yaw 0 = looking along -Z in 3D = looking up on map)
                      const coneLength = 45;
                      const coneSpread = 0.35; // radians
                      const dx = Math.sin(yaw);
                      const dy = -Math.cos(yaw);
                      const tipX = playerCoords.x + dx * coneLength;
                      const tipY = playerCoords.y + dy * coneLength;
                      const leftX = playerCoords.x + Math.sin(yaw - coneSpread) * coneLength * 0.7;
                      const leftY = playerCoords.y - Math.cos(yaw - coneSpread) * coneLength * 0.7;
                      const rightX = playerCoords.x + Math.sin(yaw + coneSpread) * coneLength * 0.7;
                      const rightY = playerCoords.y - Math.cos(yaw + coneSpread) * coneLength * 0.7;
                      return (
                        <polygon
                          points={`${playerCoords.x},${playerCoords.y} ${leftX},${leftY} ${tipX},${tipY} ${rightX},${rightY}`}
                          fill="rgba(0, 255, 210, 0.15)"
                          stroke="#00ffd2"
                          strokeWidth={1.5}
                          strokeOpacity={0.5}
                        />
                      );
                    })()}

                    {/* Radar sweep overlay animation */}
                    <defs>
                      <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00ffd2" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#00ffd2" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <circle cx={playerCoords.x} cy={playerCoords.y} r="80" fill="url(#radar-grad)">
                      <animate attributeName="r" values="60;120;60" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </svg>

                  {/* Legend Row */}
                  <div className="px-2 py-1 border-t border-[#4A5768]/20 flex items-center gap-3 text-[7px] font-mono text-[#8B9BB4]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd2]"></span>
                      <span>You</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#A63A2B] animate-pulse"></span>
                      <span>Evidence</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full border border-[#A63A2B] bg-transparent"></span>
                      <span>Current</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

  // Muted Slate Blue when discovered, Dried Blood when undiscovered or highlighted
  const activeColor = isDiscovered ? '#4A5768' : (isHighlighted ? '#D34E3C' : '#A63A2B');
  const emissiveColor = isDiscovered ? '#1A1F24' : (isHighlighted ? '#D34E3C' : '#5A2018');

  return (
    <group position={[pos3D.x, pos3D.y, pos3D.z]}>
      {/* Immersive 3D HUD inspection target prompt */}
      {isHighlighted && !isDiscovered && (
        <Html distanceFactor={6} position={[0, 0.45, 0]} center>
          <div className="bg-[#1E252B]/95 border border-[#A63A2B] text-[#A63A2B] font-mono px-3 py-1.5 rounded-xs text-[10px] whitespace-nowrap shadow-[0_0_15px_rgba(166,58,43,0.45)] flex flex-col items-center gap-0.5 animate-bounce select-none pointer-events-none">
            <span className="font-extrabold tracking-widest text-[11px]">[ E ] EXAMINE EVIDENCE TRACE</span>
            <span className="text-[#8B9BB4] text-[8px]">{clue.title.toUpperCase()}</span>
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
