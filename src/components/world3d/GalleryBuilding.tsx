import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM_ZONES, WALLS, RoomZone, Wall } from '../world/galleryMap';

// Helper: 2D map → 3D world coords
export function to3DCoords(x: number, y: number) {
  return { x: (x - 400) / 40, z: (y - 315) / 40 };
}

// Procedural texture generators
function createProceduralArtTexture(baseColor: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#0f1114';
  ctx.fillRect(0, 0, 256, 256);
  
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#181d22');
  grad.addColorStop(0.5, baseColor);
  grad.addColorStop(1, '#0a0d10');
  ctx.fillStyle = grad;
  ctx.fillRect(16, 16, 224, 224);
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.moveTo(128, 16);
  ctx.lineTo(128, 240);
  ctx.moveTo(16, 128);
  ctx.lineTo(240, 128);
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(128, 128, 55, 0, Math.PI * 2);
  ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#16191c';
  ctx.fillRect(0, 0, 512, 512);
  
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 1.5;
    ctx.globalAlpha = Math.random() * 0.03;
    ctx.fillRect(x, y, size, size);
  }
  
  ctx.strokeStyle = '#0a0d0f';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.strokeRect(256, 0, 256, 512);
  ctx.strokeRect(0, 256, 512, 256);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#242a30';
  ctx.fillRect(0, 0, 256, 256);
  
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const size = Math.random() * 1.8;
    ctx.globalAlpha = Math.random() * 0.04;
    ctx.fillRect(x, y, size, size);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Convert numeric hex (e.g. 0x6b4545) → CSS string '#6b4545'
function toHex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: Animated ceiling spotlight with point light
// ─────────────────────────────────────────────────────────────
function CeilingSpotlight({
  position,
  color,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  phase?: number;
}) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 1.3 + phase) * 0.04;
    }
  });

  return (
    <group position={position}>
      {/* Housing ring */}
      <mesh>
        <torusGeometry args={[0.11, 0.028, 6, 14]} />
        <meshStandardMaterial color="#4A5768" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Animated glow disk */}
      <mesh ref={glowRef}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} side={THREE.DoubleSide} />
      </mesh>
      {/* Downward light cone (visual only) */}
      <mesh position={[0, -0.48, 0]}>
        <coneGeometry args={[0.3, 0.85, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.015} side={THREE.DoubleSide} />
      </mesh>
      {/* Actual light */}
      <pointLight color={color} intensity={0.8} distance={4.2} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: Security camera with blinking LED
// ─────────────────────────────────────────────────────────────
function SecurityCamera({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = Math.floor(state.clock.elapsedTime * 1.5) % 2 === 0 ? 0.8 : 0.05;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Wall mount arm */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
        <meshStandardMaterial color="#1E252B" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Camera body cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.052, 0.068, 0.2, 8]} />
        <meshStandardMaterial color="#2D353C" metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Lens dome */}
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Blinking LED */}
      <mesh ref={ledRef} position={[0.062, 0.06, 0]}>
        <sphereGeometry args={[0.013, 6, 6]} />
        <meshStandardMaterial
          color="#A63A2B"
          emissive="#A63A2B"
          emissiveIntensity={0.5}
        />
      </mesh>
      <pointLight color="#A63A2B" intensity={0.1} distance={0.4} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: Interactive Security Gate (Door)
// ─────────────────────────────────────────────────────────────
function SecurityGate({
  door,
  onToggle,
}: {
  door: { id: string; name: string; x: number; y: number; width: number; height: number; isOpen: boolean };
  onToggle: () => void;
}) {
  const gateRef = useRef<THREE.Group>(null);
  const p = to3DCoords(door.x, door.y);
  const sx = door.width / 40;
  const sz = door.height / 40;
  const h = 1.92; // wall height

  useFrame((state, delta) => {
    if (gateRef.current) {
      // Smooth shutter lifting animation: Y position lifts up by 2.1 units when open
      const targetY = door.isOpen ? 2.15 : 0.0;
      gateRef.current.position.y += (targetY - gateRef.current.position.y) * 8 * delta;
    }
  });

  return (
    <group position={[p.x, 0, p.z]}>
      <group ref={gateRef}>
        {/* Door Frame */}
        <mesh castShadow position={[0, h / 2, 0]}>
          <boxGeometry args={[sx + 0.02, h, sz + 0.02]} />
          <meshStandardMaterial
            color={door.isOpen ? "#4A5768" : "#A63A2B"}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>
        {/* Caution stripe detail */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[sx + 0.04, 0.08, sz + 0.04]} />
          <meshStandardMaterial color="#1E252B" roughness={0.9} />
        </mesh>
      </group>

      {/* Floating HTML Terminal Switch */}
      <Html position={[0, 1.1, 0]} center distanceFactor={8}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`px-2 py-1 font-mono text-[9px] font-black border transition-all duration-300 shadow-lg rounded-sm ${
            door.isOpen
              ? "bg-[#1E252B] text-[#A63A2B] border-[#A63A2B]/40 hover:bg-[#A63A2B] hover:text-white"
              : "bg-[#A63A2B] text-white border-transparent hover:bg-[#D34E3C]"
          }`}
          style={{ cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {door.isOpen ? "CLOSE GATE" : "OPEN GATE"}
        </button>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// DATA: Gallery paintings on each wall section
// ─────────────────────────────────────────────────────────────
const PAINTINGS: Array<{
  pos: [number, number, number];
  rot: [number, number, number];
  w: number;
  h: number;
  color: string;
}> = [
  // North wall — Vault section
  { pos: [-7.5,  1.1, -7.32], rot: [0, 0, 0],            w: 0.72, h: 0.54, color: '#A63A2B' },
  { pos: [-5.9,  1.1, -7.32], rot: [0, 0, 0],            w: 0.54, h: 0.42, color: '#4A5768' },
  // North wall — Storage section
  { pos: [-1.2,  1.1, -7.32], rot: [0, 0, 0],            w: 0.88, h: 0.62, color: '#1E252B' },
  { pos: [ 0.9,  1.1, -7.32], rot: [0, 0, 0],            w: 0.64, h: 0.5,  color: '#2D353C' },
  // North wall — Security section
  { pos: [ 7.1,  1.1, -7.32], rot: [0, 0, 0],            w: 0.7,  h: 0.54, color: '#1A1F24' },
  // Left (west) outer wall
  { pos: [-9.38, 1.1, -4.5],  rot: [0,  Math.PI/2, 0],  w: 0.8,  h: 0.58, color: '#A63A2B' },
  { pos: [-9.38, 1.1,  1.8],  rot: [0,  Math.PI/2, 0],  w: 0.88, h: 0.62, color: '#4A5768' },
  { pos: [-9.38, 1.1,  5.5],  rot: [0,  Math.PI/2, 0],  w: 0.72, h: 0.54, color: '#2D353C' },
  // Right (east) outer wall
  { pos: [ 9.38, 1.1, -2.5],  rot: [0, -Math.PI/2, 0],  w: 0.74, h: 0.5,  color: '#1E252B' },
  { pos: [ 9.38, 1.1,  1.5],  rot: [0, -Math.PI/2, 0],  w: 0.68, h: 0.52, color: '#A63A2B' },
  { pos: [ 9.38, 1.1,  5.5],  rot: [0, -Math.PI/2, 0],  w: 0.8,  h: 0.6,  color: '#4A5768' },
  // South wall Area
  { pos: [-5.5,  1.1,  7.52], rot: [0,  Math.PI, 0],    w: 0.8,  h: 0.6,  color: '#1E252B' },
  { pos: [ 6.0,  1.1,  7.52], rot: [0,  Math.PI, 0],    w: 0.7,  h: 0.54, color: '#A63A2B' },
];

// ─────────────────────────────────────────────────────────────
// DATA: Ceiling spotlights [position, warm color, phase offset]
// ─────────────────────────────────────────────────────────────
const SPOTLIGHTS: Array<{ pos: [number, number, number]; color: string; phase: number }> = [
  // Vault (×2)
  { pos: [-7.2, 1.91, -5.6], color: '#d3d8e0', phase: 0.0 },
  { pos: [-5.6, 1.91, -5.0], color: '#A63A2B', phase: 1.4 },
  // Storage Room (×2)
  { pos: [-0.5, 1.91, -5.5], color: '#8B9BB4', phase: 0.7 },
  { pos: [ 1.5, 1.91, -5.2], color: '#d3d8e0', phase: 2.0 },
  // Security Booth
  { pos: [ 7.0, 1.91, -5.6], color: '#d3d8e0', phase: 0.2 },
  // Main Hall (×3)
  { pos: [-1.2, 1.91,  0.1], color: '#8B9BB4', phase: 0.5 },
  { pos: [ 1.2, 1.91,  0.1], color: '#8B9BB4', phase: 1.8 },
  { pos: [ 0.0, 1.91,  1.6], color: '#d3d8e0', phase: 1.1 },
  // East Wing
  { pos: [ 7.0, 1.91,  1.0], color: '#8B9BB4', phase: 1.3 },
  // West Wing
  { pos: [-7.0, 1.91, -1.5], color: '#d3d8e0', phase: 0.8 },
  // Front Desk
  { pos: [-7.0, 1.91,  2.5], color: '#8B9BB4', phase: 1.6 },
  // Curator's Office
  { pos: [-6.5, 1.91,  5.5], color: '#d3d8e0', phase: 0.4 },
  // Break Room
  { pos: [ 6.25,1.91,  5.5], color: '#d3d8e0', phase: 0.9 },
];

// ─────────────────────────────────────────────────────────────
// DATA: Decorative columns at room junction points
// ─────────────────────────────────────────────────────────────
const COLUMNS: Array<[number, number]> = [
  [-3.75, -3.75],
  [ 3.75, -3.75],
  [-3.75,  4.5 ],
  [ 3.75,  4.5 ],
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
interface GalleryBuildingProps {
  currentRoomId: string | null;
  doors: Array<{ id: string; name: string; x: number; y: number; width: number; height: number; isOpen: boolean }>;
  onToggleDoor: (doorId: string) => void;
}

export default function GalleryBuilding({ currentRoomId, doors = [], onToggleDoor }: GalleryBuildingProps) {
  const recepPos  = to3DCoords(110, 415);
  const vaultPed  = to3DCoords(80,  85);
  const floorTex = useMemo(() => createFloorTexture(), []);
  const wallTex = useMemo(() => createWallTexture(), []);

  return (
    <group>

      {/* ═══════════════════════════════════════
          CEILING PANELS & ROOF BEAMS per room
      ═══════════════════════════════════════ */}
      {ROOM_ZONES.map((zone) => {
        const cx = zone.x + zone.width  / 2;
        const cy = zone.y + zone.height / 2;
        const p  = to3DCoords(cx, cy);
        const sx = zone.width / 40;
        const sz = zone.height / 40;
        return (
          <group key={`ceil-group-${zone.id}`}>
            {/* Main Roof Slab (Ash Gray) */}
            <mesh position={[p.x, 2.02, p.z]}>
              <boxGeometry args={[sx + 0.04, 0.06, sz + 0.04]} />
              <meshStandardMaterial color="#1E252B" roughness={0.9} metalness={0.1} />
            </mesh>
            {/* Concrete Support Beams (Muted Concrete) */}
            <mesh position={[p.x, 1.96, p.z]}>
              <boxGeometry args={[sx - 0.1, 0.12, 0.25]} />
              <meshStandardMaterial color="#2D353C" roughness={0.85} metalness={0.05} />
            </mesh>
            <mesh position={[p.x, 1.96, p.z]}>
              <boxGeometry args={[0.25, 0.12, sz - 0.1]} />
              <meshStandardMaterial color="#2D353C" roughness={0.85} metalness={0.05} />
            </mesh>
          </group>
        );
      })}

      {/* ═══════════════════════════════════════
          CEILING SPOTLIGHTS
      ═══════════════════════════════════════ */}
      {SPOTLIGHTS.map((s, i) => (
        <CeilingSpotlight key={`spot-${i}`} position={s.pos} color={s.color} phase={s.phase} />
      ))}

      {/* ═══════════════════════════════════════
          FLOOR PLATES + TRIM + ROOM LABELS
      ═══════════════════════════════════════ */}
      {ROOM_ZONES.map((zone: RoomZone) => {
        const cx = zone.x + zone.width  / 2;
        const cy = zone.y + zone.height / 2;
        const p  = to3DCoords(cx, cy);
        const sx = zone.width  / 40;
        const sz = zone.height / 40;
        const active = currentRoomId === zone.id;

        return (
          <group key={zone.id}>
            {/* Main floor tile - Poured Screed Concrete color (#1A1F24) */}
            <mesh position={[p.x, -0.05, p.z]} receiveShadow>
              <boxGeometry args={[sx, 0.1, sz]} />
              <meshStandardMaterial 
                map={useMemo(() => {
                  const tex = floorTex.clone();
                  tex.repeat.set(sx, sz);
                  tex.needsUpdate = true;
                  return tex;
                }, [floorTex, sx, sz])} 
                roughness={0.8} 
                metalness={0.1} 
              />
            </mesh>

            {/* Active-room wireframe highlight (Dried Blood accent) */}
            <mesh position={[p.x, 0.006, p.z]}>
              <boxGeometry args={[sx, 0.01, sz]} />
              <meshBasicMaterial
                color={active ? '#A63A2B' : '#4A5768'}
                wireframe transparent
                opacity={active ? 0.45 : 0.06}
              />
            </mesh>

            {/* Dried Blood floor-trim strips — all 4 edges */}
            <mesh position={[p.x, 0.001, p.z + sz / 2 - 0.012]}>
              <boxGeometry args={[sx, 0.016, 0.025]} />
              <meshBasicMaterial color="#A63A2B" transparent opacity={active ? 0.78 : 0.15} />
            </mesh>
            <mesh position={[p.x, 0.001, p.z - sz / 2 + 0.012]}>
              <boxGeometry args={[sx, 0.016, 0.025]} />
              <meshBasicMaterial color="#A63A2B" transparent opacity={active ? 0.78 : 0.15} />
            </mesh>
            <mesh position={[p.x + sx / 2 - 0.012, 0.001, p.z]}>
              <boxGeometry args={[0.025, 0.016, sz]} />
              <meshBasicMaterial color="#A63A2B" transparent opacity={active ? 0.78 : 0.15} />
            </mesh>
            <mesh position={[p.x - sx / 2 + 0.012, 0.001, p.z]}>
              <boxGeometry args={[0.025, 0.016, sz]} />
              <meshBasicMaterial color="#A63A2B" transparent opacity={active ? 0.78 : 0.15} />
            </mesh>

            {/* Room label */}
            <Html
              position={[p.x, 0.13, p.z]}
              center
              distanceFactor={12}
              occlude={false}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: active ? '#A63A2B' : '#8B9BB4',
                  opacity: active ? 1.0 : 0.55,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  textShadow: active ? '0 0 10px rgba(166,58,43,0.6)' : 'none',
                }}
              >
                {zone.name.toUpperCase()}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ═══════════════════════════════════════
          INTERACTIVE DOORS / GATES
      ═══════════════════════════════════════ */}
      {doors.map((door) => (
        <SecurityGate key={door.id} door={door} onToggle={() => onToggleDoor(door.id)} />
      ))}

      {/* ═══════════════════════════════════════
          GALLERY ART FRAMES & PAINTINGS
      ═══════════════════════════════════════ */}
      {PAINTINGS.map((p, i) => (
        <group key={`paint-${i}`} position={p.pos} rotation={p.rot}>
          {/* Frame (Slate Blue details) */}
          <mesh castShadow>
            <boxGeometry args={[p.w + 0.12, p.h + 0.12, 0.038]} />
            <meshStandardMaterial
              color="#4A5768"
              roughness={0.65}
              metalness={0.35}
              emissive="#1E252B"
              emissiveIntensity={0.15}
            />
          </mesh>
          {/* Canvas */}
          <mesh position={[0, 0, 0.028]}>
            <boxGeometry args={[p.w, p.h, 0.012]} />
            <meshStandardMaterial 
              map={useMemo(() => createProceduralArtTexture(p.color), [p.color])} 
              roughness={0.7} 
              metalness={0.1} 
            />
          </mesh>
          {/* Soft painting spotlight */}
          <pointLight position={[0, 0.6, 0.4]} color="#ffe8c0" intensity={0.15} distance={1.1} decay={2} />
        </group>
      ))}

      {/* ═══════════════════════════════════════
          DECORATIVE COLUMNS at junctions
      ═══════════════════════════════════════ */}
      {COLUMNS.map(([cx, cz], i) => (
        <group key={`col-${i}`} position={[cx, 0, cz]}>
          {/* Muted Concrete Base */}
          <mesh position={[0, 0.056, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.112, 0.3]} />
            <meshStandardMaterial color="#2D353C" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Slate Blue Shaft */}
          <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.088, 0.108, 1.82, 8]} />
            <meshStandardMaterial color="#4A5768" roughness={0.6} metalness={0.25} />
          </mesh>
          {/* Muted Concrete Capital */}
          <mesh position={[0, 1.912, 0]} castShadow>
            <boxGeometry args={[0.27, 0.1, 0.27]} />
            <meshStandardMaterial color="#2D353C" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Lower Dried Blood accent ring */}
          <mesh position={[0, 0.55, 0]}>
            <torusGeometry args={[0.102, 0.014, 6, 14]} />
            <meshBasicMaterial color="#A63A2B" transparent opacity={0.48} />
          </mesh>
          {/* Upper Dried Blood accent ring */}
          <mesh position={[0, 1.32, 0]}>
            <torusGeometry args={[0.102, 0.014, 6, 14]} />
            <meshBasicMaterial color="#A63A2B" transparent opacity={0.48} />
          </mesh>
        </group>
      ))}

      {/* ═══════════════════════════════════════
          SOLID WALLS with moldings
      ═══════════════════════════════════════ */}
      {WALLS.map((wall: Wall, idx: number) => {
        const p  = to3DCoords(wall.x, wall.y);
        const sx = wall.width  / 40;
        const sz = wall.height / 40;
        const h  = 1.92;

        return (
          <group key={`wall-${idx}`}>
            {/* Main wall body (Muted Concrete) */}
            <mesh position={[p.x, h / 2, p.z]} castShadow receiveShadow>
              <boxGeometry args={[sx, h, sz]} />
              <meshStandardMaterial 
                map={useMemo(() => {
                  const tex = wallTex.clone();
                  tex.repeat.set(sx * 2, h * 2);
                  tex.needsUpdate = true;
                  return tex;
                }, [wallTex, sx, h])}
                roughness={0.8} 
                metalness={0.08} 
              />
            </mesh>
            {/* Horizontal molding strip (Slate Blue) */}
            <mesh position={[p.x, 0.92, p.z]}>
              <boxGeometry args={[sx + 0.04, 0.05, sz + 0.04]} />
              <meshStandardMaterial color="#4A5768" roughness={0.65} metalness={0.2} />
            </mesh>
            {/* Dried Blood baseboard trim accent */}
            <mesh position={[p.x, 0.016, p.z]}>
              <boxGeometry args={[sx + 0.02, 0.032, sz + 0.02]} />
              <meshBasicMaterial color="#A63A2B" transparent opacity={0.22} />
            </mesh>
          </group>
        );
      })}

      {/* ═══════════════════════════════════════
          OUTER WALL ACCENT LINES (Slate Blue / Dried Blood mix)
      ═══════════════════════════════════════ */}
      {/* North wall */}
      <mesh position={[0, 0.85, -7.37]}>
        <boxGeometry args={[19.2, 0.04, 0.016]} />
        <meshBasicMaterial color="#4A5768" transparent opacity={0.35} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, 0.85, 7.37]}>
        <boxGeometry args={[19.2, 0.04, 0.016]} />
        <meshBasicMaterial color="#4A5768" transparent opacity={0.35} />
      </mesh>
      {/* West wall */}
      <mesh position={[-9.5, 0.85, 0]}>
        <boxGeometry args={[0.016, 0.04, 15.5]} />
        <meshBasicMaterial color="#A63A2B" transparent opacity={0.3} />
      </mesh>
      {/* East wall */}
      <mesh position={[9.5, 0.85, 0]}>
        <boxGeometry args={[0.016, 0.04, 15.5]} />
        <meshBasicMaterial color="#A63A2B" transparent opacity={0.3} />
      </mesh>

      {/* ═══════════════════════════════════════
          FRONT DESK — reception area
      ═══════════════════════════════════════ */}
      <group position={[recepPos.x, 0, recepPos.z]}>
        {/* Desk body (Slate Blue) */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[1.55, 0.76, 0.58]} />
          <meshStandardMaterial color="#4A5768" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Desk top (weathered gray vinyl) */}
        <mesh position={[0, 0.776, 0]}>
          <boxGeometry args={[1.55, 0.022, 0.58]} />
          <meshStandardMaterial color="#3F4A56" roughness={0.5} metalness={0.15} />
        </mesh>
        {/* Monitor screen (Dried Blood red terminal glow) */}
        <mesh position={[0.28, 1.04, -0.08]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.44, 0.3, 0.022]} />
          <meshStandardMaterial
            color="#1E252B"
            emissive="#A63A2B"
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0.28, 0.88, -0.06]}>
          <cylinderGeometry args={[0.024, 0.04, 0.26, 6]} />
          <meshStandardMaterial color="#1E252B" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Red/Dried Blood glow from monitor */}
        <pointLight position={[0.28, 1.02, 0.22]} color="#A63A2B" intensity={0.4} distance={1.6} decay={2} />
        {/* Desk accent strip */}
        <mesh position={[0, 0.02, 0.27]}>
          <boxGeometry args={[1.55, 0.018, 0.016]} />
          <meshBasicMaterial color="#A63A2B" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════
          VAULT — stolen painting crime scene
      ═══════════════════════════════════════ */}
      <group position={[vaultPed.x, 0, vaultPed.z]}>
        {/* Pedestal body */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.44, 1.12, 0.44]} />
          <meshStandardMaterial color="#2D353C" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Pedestal top platform */}
        <mesh position={[0, 1.135, 0]}>
          <boxGeometry args={[0.56, 0.06, 0.56]} />
          <meshStandardMaterial color="#1E252B" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Empty easel */}
        <mesh position={[0, 1.38, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.52, 0.65, 0.012]} />
          <meshStandardMaterial
            color="#2D353C"
            roughness={0.7}
            metalness={0.15}
            emissive="#A63A2B"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Crime scene caution ring */}
        <mesh position={[0, 1.165, 0]}>
          <torusGeometry args={[0.38, 0.02, 4, 8]} />
          <meshBasicMaterial color="#A63A2B" transparent opacity={0.92} />
        </mesh>
        {/* Dramatic red crime scene light */}
        <pointLight position={[0, 1.9, 0]} color="#A63A2B" intensity={0.95} distance={2.5} decay={2} />
      </group>

      {/* ═══════════════════════════════════════
          SECURITY CAMERAS (×3)
      ═══════════════════════════════════════ */}
      <SecurityCamera
        position={[to3DCoords(742, 42).x, 1.72, to3DCoords(742, 42).z]}
        rotation={[0.32, Math.PI + 0.25, 0]}
      />
      <SecurityCamera
        position={[to3DCoords(542, 198).x, 1.72, to3DCoords(542, 198).z]}
        rotation={[0.3, -Math.PI / 2 - 0.4, 0]}
      />
      <SecurityCamera
        position={[to3DCoords(56, 44).x, 1.72, to3DCoords(56, 44).z]}
        rotation={[0.32, 0.45, 0]}
      />

    </group>
  );
}
