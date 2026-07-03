import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ROOM_ZONES, WALLS, RoomZone, Wall } from '../world/galleryMap';

// Helper: 2D map → 3D world coords
export function to3DCoords(x: number, y: number) {
  return { x: (x - 400) / 40, z: (y - 315) / 40 };
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
      mat.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 1.3 + phase) * 0.06;
    }
  });

  return (
    <group position={position}>
      {/* Housing ring */}
      <mesh>
        <torusGeometry args={[0.11, 0.028, 6, 14]} />
        <meshStandardMaterial color="#181818" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Animated glow disk */}
      <mesh ref={glowRef}>
        <circleGeometry args={[0.09, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      {/* Downward light cone (visual only) */}
      <mesh position={[0, -0.48, 0]}>
        <coneGeometry args={[0.3, 0.85, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.028} side={THREE.DoubleSide} />
      </mesh>
      {/* Actual light */}
      <pointLight color={color} intensity={1.15} distance={4.2} decay={2} />
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
      mat.emissiveIntensity = Math.floor(state.clock.elapsedTime * 1.8) % 2 === 0 ? 0.9 : 0.05;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Wall mount arm */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Camera body cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.052, 0.068, 0.2, 8]} />
        <meshStandardMaterial color="#0f0f0f" metalness={0.88} roughness={0.12} />
      </mesh>
      {/* Lens dome */}
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.042, 8, 8]} />
        <meshStandardMaterial color="#040404" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Blinking LED */}
      <mesh ref={ledRef} position={[0.062, 0.06, 0]}>
        <sphereGeometry args={[0.013, 6, 6]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>
      <pointLight color="#ff0000" intensity={0.12} distance={0.4} />
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
  { pos: [-7.5,  1.1, -7.32], rot: [0, 0, 0],            w: 0.72, h: 0.54, color: '#6b2222' },
  { pos: [-5.9,  1.1, -7.32], rot: [0, 0, 0],            w: 0.54, h: 0.42, color: '#1a2860' },
  // North wall — Storage section
  { pos: [-1.2,  1.1, -7.32], rot: [0, 0, 0],            w: 0.88, h: 0.62, color: '#1a106a' },
  { pos: [ 0.9,  1.1, -7.32], rot: [0, 0, 0],            w: 0.64, h: 0.5,  color: '#124a22' },
  // North wall — Security section
  { pos: [ 7.1,  1.1, -7.32], rot: [0, 0, 0],            w: 0.7,  h: 0.54, color: '#3a2210' },
  // Left (west) outer wall
  { pos: [-9.38, 1.1, -4.5],  rot: [0,  Math.PI/2, 0],  w: 0.8,  h: 0.58, color: '#4a1020' },
  { pos: [-9.38, 1.1,  1.8],  rot: [0,  Math.PI/2, 0],  w: 0.88, h: 0.62, color: '#101a3a' },
  { pos: [-9.38, 1.1,  5.5],  rot: [0,  Math.PI/2, 0],  w: 0.72, h: 0.54, color: '#1a2a10' },
  // Right (east) outer wall
  { pos: [ 9.38, 1.1, -2.5],  rot: [0, -Math.PI/2, 0],  w: 0.74, h: 0.5,  color: '#1a3010' },
  { pos: [ 9.38, 1.1,  1.5],  rot: [0, -Math.PI/2, 0],  w: 0.68, h: 0.52, color: '#301020' },
  { pos: [ 9.38, 1.1,  5.5],  rot: [0, -Math.PI/2, 0],  w: 0.8,  h: 0.6,  color: '#10182a' },
  // South wall — Curator's Office / Break Room area
  { pos: [-5.5,  1.1,  7.52], rot: [0,  Math.PI, 0],    w: 0.8,  h: 0.6,  color: '#1a0e06' },
  { pos: [ 6.0,  1.1,  7.52], rot: [0,  Math.PI, 0],    w: 0.7,  h: 0.54, color: '#06101a' },
];

// ─────────────────────────────────────────────────────────────
// DATA: Ceiling spotlights [position, warm color, phase offset]
// ─────────────────────────────────────────────────────────────
const SPOTLIGHTS: Array<{ pos: [number, number, number]; color: string; phase: number }> = [
  // Vault (×2)
  { pos: [-7.2, 1.91, -5.6], color: '#fff5e0', phase: 0.0 },
  { pos: [-5.6, 1.91, -5.0], color: '#fff8ea', phase: 1.4 },
  // Storage Room (×2)
  { pos: [-0.5, 1.91, -5.5], color: '#fff5e0', phase: 0.7 },
  { pos: [ 1.5, 1.91, -5.2], color: '#fff8ea', phase: 2.0 },
  // Security Booth
  { pos: [ 7.0, 1.91, -5.6], color: '#fff0e0', phase: 0.2 },
  // Main Hall (×3 — prominent centrepiece)
  { pos: [-1.2, 1.91,  0.1], color: '#fff5e0', phase: 0.5 },
  { pos: [ 1.2, 1.91,  0.1], color: '#fff5e0', phase: 1.8 },
  { pos: [ 0.0, 1.91,  1.6], color: '#fff8ee', phase: 1.1 },
  // East Wing
  { pos: [ 7.0, 1.91,  1.0], color: '#fff5e0', phase: 1.3 },
  // West Wing
  { pos: [-7.0, 1.91, -1.5], color: '#fff5e0', phase: 0.8 },
  // Front Desk (warm toned)
  { pos: [-7.0, 1.91,  2.5], color: '#ffe5a0', phase: 1.6 },
  // Curator's Office
  { pos: [-6.5, 1.91,  5.5], color: '#fff0e0', phase: 0.4 },
  // Break Room
  { pos: [ 6.25,1.91,  5.5], color: '#fff0e0', phase: 0.9 },
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
}

export default function GalleryBuilding({ currentRoomId }: GalleryBuildingProps) {
  const recepPos  = to3DCoords(110, 415);
  const vaultPed  = to3DCoords(80,  85);

  return (
    <group>

      {/* ═══════════════════════════════════════
          CEILING PANELS — dark slab per room
      ═══════════════════════════════════════ */}
      {ROOM_ZONES.map((zone) => {
        const cx = zone.x + zone.width  / 2;
        const cy = zone.y + zone.height / 2;
        const p  = to3DCoords(cx, cy);
        return (
          <mesh key={`ceil-${zone.id}`} position={[p.x, 1.97, p.z]}>
            <boxGeometry args={[zone.width / 40 + 0.04, 0.06, zone.height / 40 + 0.04]} />
            <meshStandardMaterial color="#0b0b0b" roughness={0.95} metalness={0.05} />
          </mesh>
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
            {/* Main floor tile */}
            <mesh position={[p.x, -0.05, p.z]} receiveShadow>
              <boxGeometry args={[sx, 0.1, sz]} />
              <meshStandardMaterial color={toHex(zone.color)} roughness={0.65} metalness={0.15} />
            </mesh>

            {/* Active-room wireframe highlight */}
            <mesh position={[p.x, 0.006, p.z]}>
              <boxGeometry args={[sx, 0.01, sz]} />
              <meshBasicMaterial
                color={active ? '#ffb000' : '#222222'}
                wireframe transparent
                opacity={active ? 0.38 : 0.08}
              />
            </mesh>

            {/* Amber floor-trim strips — all 4 edges */}
            <mesh position={[p.x, 0.001, p.z + sz / 2 - 0.012]}>
              <boxGeometry args={[sx, 0.016, 0.025]} />
              <meshBasicMaterial color="#ffb000" transparent opacity={active ? 0.78 : 0.2} />
            </mesh>
            <mesh position={[p.x, 0.001, p.z - sz / 2 + 0.012]}>
              <boxGeometry args={[sx, 0.016, 0.025]} />
              <meshBasicMaterial color="#ffb000" transparent opacity={active ? 0.78 : 0.2} />
            </mesh>
            <mesh position={[p.x + sx / 2 - 0.012, 0.001, p.z]}>
              <boxGeometry args={[0.025, 0.016, sz]} />
              <meshBasicMaterial color="#ffb000" transparent opacity={active ? 0.78 : 0.2} />
            </mesh>
            <mesh position={[p.x - sx / 2 + 0.012, 0.001, p.z]}>
              <boxGeometry args={[0.025, 0.016, sz]} />
              <meshBasicMaterial color="#ffb000" transparent opacity={active ? 0.78 : 0.2} />
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
                  color: active ? '#ffb000' : '#777777',
                  opacity: active ? 1.0 : 0.65,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  textShadow: active ? '0 0 10px rgba(255,176,0,0.7)' : 'none',
                }}
              >
                {zone.name.toUpperCase()}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ═══════════════════════════════════════
          GALLERY ART FRAMES & PAINTINGS
      ═══════════════════════════════════════ */}
      {PAINTINGS.map((p, i) => (
        <group key={`paint-${i}`} position={p.pos} rotation={p.rot}>
          {/* Ornate dark frame */}
          <mesh castShadow>
            <boxGeometry args={[p.w + 0.12, p.h + 0.12, 0.038]} />
            <meshStandardMaterial
              color="#100c06"
              roughness={0.55}
              metalness={0.42}
              emissive="#180e04"
              emissiveIntensity={0.25}
            />
          </mesh>
          {/* Canvas */}
          <mesh position={[0, 0, 0.028]}>
            <boxGeometry args={[p.w, p.h, 0.012]} />
            <meshStandardMaterial color={p.color} roughness={0.88} metalness={0.0} />
          </mesh>
          {/* Warm painting spotlight */}
          <pointLight position={[0, 0.6, 0.4]} color="#ffe8c0" intensity={0.22} distance={1.1} decay={2} />
        </group>
      ))}

      {/* ═══════════════════════════════════════
          DECORATIVE COLUMNS at junctions
      ═══════════════════════════════════════ */}
      {COLUMNS.map(([cx, cz], i) => (
        <group key={`col-${i}`} position={[cx, 0, cz]}>
          {/* Stone base */}
          <mesh position={[0, 0.056, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.112, 0.3]} />
            <meshStandardMaterial color="#1c1810" roughness={0.82} metalness={0.14} />
          </mesh>
          {/* Octagonal shaft */}
          <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.088, 0.108, 1.82, 8]} />
            <meshStandardMaterial color="#181408" roughness={0.65} metalness={0.32} />
          </mesh>
          {/* Capital */}
          <mesh position={[0, 1.912, 0]} castShadow>
            <boxGeometry args={[0.27, 0.1, 0.27]} />
            <meshStandardMaterial color="#1c1810" roughness={0.72} metalness={0.2} />
          </mesh>
          {/* Lower amber accent ring */}
          <mesh position={[0, 0.55, 0]}>
            <torusGeometry args={[0.102, 0.014, 6, 14]} />
            <meshBasicMaterial color="#ffb000" transparent opacity={0.58} />
          </mesh>
          {/* Upper amber accent ring */}
          <mesh position={[0, 1.32, 0]}>
            <torusGeometry args={[0.102, 0.014, 6, 14]} />
            <meshBasicMaterial color="#ffb000" transparent opacity={0.58} />
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
            {/* Main wall body */}
            <mesh position={[p.x, h / 2, p.z]} castShadow receiveShadow>
              <boxGeometry args={[sx, h, sz]} />
              <meshStandardMaterial color="#2a2018" roughness={0.8} metalness={0.06} />
            </mesh>
            {/* Horizontal molding strip at mid-height */}
            <mesh position={[p.x, 0.92, p.z]}>
              <boxGeometry args={[sx + 0.04, 0.05, sz + 0.04]} />
              <meshStandardMaterial color="#38301e" roughness={0.6} metalness={0.16} />
            </mesh>
            {/* Amber baseboard glow */}
            <mesh position={[p.x, 0.016, p.z]}>
              <boxGeometry args={[sx + 0.02, 0.032, sz + 0.02]} />
              <meshBasicMaterial color="#ffb000" transparent opacity={0.18} />
            </mesh>
          </group>
        );
      })}

      {/* ═══════════════════════════════════════
          OUTER WALL AMBER LED STRIPS
      ═══════════════════════════════════════ */}
      {/* North wall inner face */}
      <mesh position={[0, 0.85, -7.37]}>
        <boxGeometry args={[19.2, 0.04, 0.016]} />
        <meshBasicMaterial color="#ffb000" transparent opacity={0.32} />
      </mesh>
      {/* South wall inner face */}
      <mesh position={[0, 0.85, 7.37]}>
        <boxGeometry args={[19.2, 0.04, 0.016]} />
        <meshBasicMaterial color="#ffb000" transparent opacity={0.32} />
      </mesh>
      {/* West wall inner face */}
      <mesh position={[-9.5, 0.85, 0]}>
        <boxGeometry args={[0.016, 0.04, 15.5]} />
        <meshBasicMaterial color="#ffb000" transparent opacity={0.32} />
      </mesh>
      {/* East wall inner face */}
      <mesh position={[9.5, 0.85, 0]}>
        <boxGeometry args={[0.016, 0.04, 15.5]} />
        <meshBasicMaterial color="#ffb000" transparent opacity={0.32} />
      </mesh>

      {/* ═══════════════════════════════════════
          FRONT DESK — reception area
      ═══════════════════════════════════════ */}
      <group position={[recepPos.x, 0, recepPos.z]}>
        {/* Desk body */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[1.55, 0.76, 0.58]} />
          <meshStandardMaterial color="#0e0a06" roughness={0.72} metalness={0.26} />
        </mesh>
        {/* Desk top */}
        <mesh position={[0, 0.776, 0]}>
          <boxGeometry args={[1.55, 0.022, 0.58]} />
          <meshStandardMaterial color="#1a1608" roughness={0.48} metalness={0.38} />
        </mesh>
        {/* Monitor screen */}
        <mesh position={[0.28, 1.04, -0.08]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.44, 0.3, 0.022]} />
          <meshStandardMaterial
            color="#060606"
            emissive="#00ffd2"
            emissiveIntensity={0.25}
            roughness={0.0}
            metalness={0.2}
          />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0.28, 0.88, -0.06]}>
          <cylinderGeometry args={[0.024, 0.04, 0.26, 6]} />
          <meshStandardMaterial color="#0f0f0f" metalness={0.75} roughness={0.18} />
        </mesh>
        {/* Cyan glow from monitor */}
        <pointLight position={[0.28, 1.02, 0.22]} color="#00ffd2" intensity={0.32} distance={1.6} decay={2} />
        {/* Desk accent strip */}
        <mesh position={[0, 0.02, 0.27]}>
          <boxGeometry args={[1.55, 0.018, 0.016]} />
          <meshBasicMaterial color="#ffb000" transparent opacity={0.55} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════
          VAULT — stolen painting crime scene
      ═══════════════════════════════════════ */}
      <group position={[vaultPed.x, 0, vaultPed.z]}>
        {/* Pedestal body */}
        <mesh position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.44, 1.12, 0.44]} />
          <meshStandardMaterial color="#060606" roughness={0.52} metalness={0.58} />
        </mesh>
        {/* Pedestal top platform */}
        <mesh position={[0, 1.135, 0]}>
          <boxGeometry args={[0.56, 0.06, 0.56]} />
          <meshStandardMaterial color="#0f0f0f" roughness={0.24} metalness={0.82} />
        </mesh>
        {/* Empty easel (where stolen painting was) */}
        <mesh position={[0, 1.38, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.52, 0.65, 0.012]} />
          <meshStandardMaterial
            color="#0a0606"
            roughness={0.7}
            metalness={0.1}
            emissive="#280808"
            emissiveIntensity={0.45}
          />
        </mesh>
        {/* Crime scene caution ring */}
        <mesh position={[0, 1.165, 0]}>
          <torusGeometry args={[0.38, 0.02, 4, 8]} />
          <meshBasicMaterial color="#ff2222" transparent opacity={0.92} />
        </mesh>
        {/* Dramatic red crime scene light */}
        <pointLight position={[0, 1.9, 0]} color="#ff1a00" intensity={0.7} distance={2.2} decay={2} />
      </group>

      {/* ═══════════════════════════════════════
          SECURITY CAMERAS (×3)
      ═══════════════════════════════════════ */}
      {/* Security Booth */}
      <SecurityCamera
        position={[to3DCoords(742, 42).x, 1.72, to3DCoords(742, 42).z]}
        rotation={[0.32, Math.PI + 0.25, 0]}
      />
      {/* Main Hall corner */}
      <SecurityCamera
        position={[to3DCoords(542, 198).x, 1.72, to3DCoords(542, 198).z]}
        rotation={[0.3, -Math.PI / 2 - 0.4, 0]}
      />
      {/* Vault corner */}
      <SecurityCamera
        position={[to3DCoords(56, 44).x, 1.72, to3DCoords(56, 44).z]}
        rotation={[0.32, 0.45, 0]}
      />

    </group>
  );
}
