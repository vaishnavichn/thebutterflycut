import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NPC_SPAWNS, NpcSpawn } from '../world/galleryMap';
import { to3DCoords } from './GalleryBuilding';
import { gameAudio } from './Player3D';

// ─── Skin & hair palette ───────────────────────────────────────────────────
const SK_LIGHT = '#ffd5b0'; // Eleanor Voss
const SK_MED   = '#c88565'; // Rosa Delgado
const SK_TAN   = '#c07848'; // Priya Kapoor
const SK_DARK  = '#8a6040'; // Marcus Reyes
const HAIR_BLK = '#0a0806';
const HAIR_DRK = '#1a0c08';

// ─── Interfaces ────────────────────────────────────────────────────────────
interface NPC3DProps {
  player3DPosRef: React.RefObject<THREE.Vector3 | null>;
  onInterrogate: (id: string | null) => void;
  isChatOpen: boolean;
}

interface SingleNPCProps {
  npc: NpcSpawn;
  x3d: number;
  z3d: number;
  player3DPosRef: React.RefObject<THREE.Vector3 | null>;
  onInterrogate: (id: string | null) => void;
  isChatOpen: boolean;
}

interface ArmRefs {
  leftArmRef: React.MutableRefObject<THREE.Group | null>;
  rightArmRef: React.MutableRefObject<THREE.Group | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTOON EYE — Sclera + iris + pupil + specular highlight
// ─────────────────────────────────────────────────────────────────────────────
function CartoonEye({
  x, y, z, color, scale = 1,
}: { x: number; y: number; z: number; color: string; scale?: number }) {
  const s = scale;
  return (
    <group position={[x, y, z]}>
      {/* White sclera */}
      <mesh>
        <sphereGeometry args={[0.052 * s, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.05} />
      </mesh>
      {/* Colored iris */}
      <mesh position={[0, 0, 0.04 * s]}>
        <circleGeometry args={[0.034 * s, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Black pupil */}
      <mesh position={[0, 0, 0.052 * s]}>
        <circleGeometry args={[0.019 * s, 10]} />
        <meshBasicMaterial color="#080808" />
      </mesh>
      {/* Specular highlight */}
      <mesh position={[0.013 * s, 0.015 * s, 0.056 * s]}>
        <circleGeometry args={[0.009 * s, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURATOR BODY — Eleanor Voss  (purple · tall · elegant)
// Heeled shoes · A-line dress · blazer · pearl necklace · bun · clipboard
// ─────────────────────────────────────────────────────────────────────────────
function CuratorBody({ leftArmRef, rightArmRef }: ArmRefs) {
  return (
    <group>
      {/* ── HEELED SHOES ── */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.12, 0, 0]}>
          <mesh position={[0, 0.05, 0.05]} castShadow>
            <boxGeometry args={[0.13, 0.09, 0.21]} />
            <meshStandardMaterial color="#0a0808" roughness={0.45} metalness={0.38} />
          </mesh>
          {/* Stiletto heel */}
          <mesh position={[0, 0.02, -0.06]}>
            <cylinderGeometry args={[0.018, 0.013, 0.06, 5]} />
            <meshStandardMaterial color="#0a0808" metalness={0.55} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── STOCKINGS / LEGS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.12, 0.32, 0]} castShadow>
          <capsuleGeometry args={[0.062, 0.44, 4, 8]} />
          <meshStandardMaterial color="#1a1025" roughness={0.85} />
        </mesh>
      ))}

      {/* ── A-LINE DRESS (flared skirt) ── */}
      <mesh position={[0, 0.61, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.28, 0.38, 10]} />
        <meshStandardMaterial color="#180e2e" roughness={0.72} />
      </mesh>

      {/* ── BLAZER TORSO ── */}
      <mesh position={[0, 0.93, 0]} castShadow>
        <cylinderGeometry args={[0.186, 0.155, 0.52, 10]} />
        <meshStandardMaterial color="#2a1545" roughness={0.62} metalness={0.06} />
      </mesh>
      {/* White shirt peek */}
      <mesh position={[0, 0.85, 0.181]}>
        <boxGeometry args={[0.13, 0.24, 0.012]} />
        <meshStandardMaterial color="#f0eff5" roughness={0.8} />
      </mesh>
      {/* Blazer lapels */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.065, 0.97, 0.175]} rotation={[0, 0, s * 0.42]}>
          <boxGeometry args={[0.065, 0.24, 0.014]} />
          <meshStandardMaterial color="#2a1545" roughness={0.62} />
        </mesh>
      ))}

      {/* ── SHOULDER CAPS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.215, 1.12, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#2a1545" roughness={0.62} />
        </mesh>
      ))}

      {/* ── PEARL NECKLACE ── */}
      {Array.from({ length: 9 }, (_, i) => i * 40).map((deg) => (
        <mesh
          key={deg}
          position={[
            Math.sin((deg * Math.PI) / 180) * 0.1,
            1.19,
            Math.cos((deg * Math.PI) / 180) * 0.09,
          ]}
        >
          <sphereGeometry args={[0.016, 6, 6]} />
          <meshStandardMaterial color="#f8f0e8" roughness={0.05} metalness={0.45} />
        </mesh>
      ))}

      {/* ── PURPLE BROOCH ── */}
      <mesh position={[-0.04, 1.03, 0.194]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.55}
          metalness={0.6}
          roughness={0.15}
        />
      </mesh>

      {/* ── LEFT ARM ── */}
      <group ref={leftArmRef} position={[-0.215, 1.11, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.22, 4, 8]} />
          <meshStandardMaterial color="#2a1545" roughness={0.65} />
        </mesh>
        <mesh position={[-0.018, -0.43, 0.02]} castShadow>
          <capsuleGeometry args={[0.044, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_LIGHT} roughness={0.65} />
        </mesh>
        <mesh position={[-0.024, -0.59, 0.02]}>
          <sphereGeometry args={[0.048, 8, 8]} />
          <meshStandardMaterial color={SK_LIGHT} roughness={0.7} />
        </mesh>
      </group>

      {/* ── RIGHT ARM (holds clipboard) ── */}
      <group ref={rightArmRef} position={[0.215, 1.11, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.22, 4, 8]} />
          <meshStandardMaterial color="#2a1545" roughness={0.65} />
        </mesh>
        <mesh position={[0.018, -0.43, 0.02]} castShadow>
          <capsuleGeometry args={[0.044, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_LIGHT} roughness={0.65} />
        </mesh>
        {/* Clipboard */}
        <mesh position={[0.04, -0.6, 0.06]} rotation={[0.12, 0.08, 0]} castShadow>
          <boxGeometry args={[0.13, 0.17, 0.013]} />
          <meshStandardMaterial color="#0f0808" roughness={0.55} metalness={0.22} />
        </mesh>
        <mesh position={[0.04, -0.6, 0.069]} rotation={[0.12, 0.08, 0]}>
          <boxGeometry args={[0.11, 0.14, 0.004]} />
          <meshStandardMaterial color="#f5e8d0" roughness={0.9} />
        </mesh>
        <mesh position={[0.04, -0.524, 0.073]} rotation={[0.12, 0.08, 0]}>
          <boxGeometry args={[0.04, 0.022, 0.022]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.27, 0]}>
        <cylinderGeometry args={[0.058, 0.07, 0.12, 8]} />
        <meshStandardMaterial color={SK_LIGHT} roughness={0.65} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.205, 16, 16]} />
        <meshStandardMaterial color={SK_LIGHT} roughness={0.62} />
      </mesh>

      {/* ── HAIR BASE (dark, swept back) ── */}
      <mesh position={[0, 1.49, -0.04]}>
        <sphereGeometry args={[0.212, 12, 12]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.78} />
      </mesh>
      {/* Side hair panels */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.16, 1.58, 0.06]} rotation={[0, s * -0.3, 0]}>
          <boxGeometry args={[0.07, 0.09, 0.1]} />
          <meshStandardMaterial color={HAIR_BLK} roughness={0.78} />
        </mesh>
      ))}
      {/* Elegant bun */}
      <mesh position={[0, 1.698, -0.108]}>
        <sphereGeometry args={[0.097, 8, 8]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.72} />
      </mesh>
      {/* Gold bun pin */}
      <mesh position={[0.032, 1.72, -0.14]} rotation={[0.4, 0.4, 0]}>
        <cylinderGeometry args={[0.007, 0.005, 0.16, 4]} />
        <meshStandardMaterial color="#c8a000" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ── CARTOON EYES ── */}
      <CartoonEye x={-0.082} y={1.462} z={0.175} color="#a855f7" />
      <CartoonEye x={0.082}  y={1.462} z={0.175} color="#a855f7" />

      {/* ── ARCHED EYEBROWS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.082, 1.514, 0.19]} rotation={[0, 0, s * 0.28]}>
          <boxGeometry args={[0.062, 0.013, 0.008]} />
          <meshBasicMaterial color={HAIR_BLK} />
        </mesh>
      ))}

      {/* ── MOUTH (elegant smile) ── */}
      <mesh position={[0, 1.408, 0.194]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.028, 0.007, 4, 10, Math.PI * 0.68]} />
        <meshBasicMaterial color="#c07060" />
      </mesh>

      {/* ── CHEEK BLUSH ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.145, 1.434, 0.155]} rotation={[0, s * 0.25, 0]}>
          <circleGeometry args={[0.038, 8]} />
          <meshBasicMaterial color="#ffaa88" transparent opacity={0.48} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANER BODY — Rosa Delgado  (blue · short · round · friendly)
// Rubber boots · blue uniform · white apron · mop · cap
// ─────────────────────────────────────────────────────────────────────────────
function CleanerBody({ leftArmRef, rightArmRef }: ArmRefs) {
  return (
    <group>
      {/* ── RUBBER BOOTS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.14, 0.1, 0.03]} castShadow>
          <boxGeometry args={[0.17, 0.2, 0.23]} />
          <meshStandardMaterial color="#1a3a8a" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* ── LEGS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.135, 0.37, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.3, 4, 8]} />
          <meshStandardMaterial color="#1e40af" roughness={0.8} />
        </mesh>
      ))}

      {/* ── UNIFORM BODY (wide + round) ── */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.245, 0.215, 0.52, 10]} />
        <meshStandardMaterial color="#1e40af" roughness={0.72} />
      </mesh>

      {/* ── WHITE APRON ── */}
      <mesh position={[0, 0.72, 0.225]}>
        <boxGeometry args={[0.28, 0.44, 0.012]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.615, 0.233]}>
        <boxGeometry args={[0.14, 0.1, 0.009]} />
        <meshStandardMaterial color="#d2d2d2" roughness={0.85} />
      </mesh>
      {/* Apron straps */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.095, 0.935, 0.215]}>
          <boxGeometry args={[0.034, 0.14, 0.009]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.85} />
        </mesh>
      ))}

      {/* ── SHOULDER CAPS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.265, 0.985, 0]}>
          <sphereGeometry args={[0.108, 8, 8]} />
          <meshStandardMaterial color="#1e40af" roughness={0.72} />
        </mesh>
      ))}

      {/* ── LEFT ARM (holds mop handle) ── */}
      <group ref={leftArmRef} position={[-0.27, 0.97, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color="#1e40af" roughness={0.72} />
        </mesh>
        <mesh position={[-0.018, -0.42, 0]} castShadow>
          <capsuleGeometry args={[0.058, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_MED} roughness={0.65} />
        </mesh>
        {/* Mop handle */}
        <mesh position={[-0.04, -0.75, 0]} rotation={[0.12, 0, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 6]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* Mop head (fluffy) */}
        <mesh position={[-0.07, -1.12, 0.06]}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.97} />
        </mesh>
        {([-1, 0, 1] as const).map((ox) => (
          <mesh key={ox} position={[-0.07 + ox * 0.06, -1.16, 0.1]}>
            <sphereGeometry args={[0.04, 5, 5]} />
            <meshStandardMaterial color="#cccccc" roughness={0.98} />
          </mesh>
        ))}
      </group>

      {/* ── RIGHT ARM ── */}
      <group ref={rightArmRef} position={[0.27, 0.97, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color="#1e40af" roughness={0.72} />
        </mesh>
        <mesh position={[0.018, -0.42, 0]} castShadow>
          <capsuleGeometry args={[0.058, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_MED} roughness={0.65} />
        </mesh>
        <mesh position={[0.022, -0.58, 0]}>
          <sphereGeometry args={[0.064, 8, 8]} />
          <meshStandardMaterial color={SK_MED} roughness={0.7} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.065, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.1, 8]} />
        <meshStandardMaterial color={SK_MED} roughness={0.65} />
      </mesh>

      {/* ── HEAD (rounder, chubbier) ── */}
      <mesh position={[0, 1.26, 0]} castShadow>
        <sphereGeometry args={[0.228, 16, 16]} />
        <meshStandardMaterial color={SK_MED} roughness={0.62} />
      </mesh>

      {/* ── DARK HAIR BASE ── */}
      <mesh position={[0, 1.295, -0.042]}>
        <sphereGeometry args={[0.232, 12, 12]} />
        <meshStandardMaterial color={HAIR_DRK} roughness={0.82} />
      </mesh>

      {/* ── CLEANING CAP ── */}
      <mesh position={[0, 1.49, 0.04]}>
        <cylinderGeometry args={[0.192, 0.235, 0.068, 10]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.75} />
      </mesh>
      {/* Cap front brim */}
      <mesh position={[0, 1.464, 0.17]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.33, 0.024, 0.14]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.75} />
      </mesh>
      {/* Blue cap band */}
      <mesh position={[0, 1.462, 0.04]}>
        <torusGeometry args={[0.214, 0.016, 6, 14]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>

      {/* ── CARTOON EYES (bigger, friendlier) ── */}
      <CartoonEye x={-0.092} y={1.272} z={0.198} color="#3b82f6" scale={1.12} />
      <CartoonEye x={0.092}  y={1.272} z={0.198} color="#3b82f6" scale={1.12} />

      {/* ── RAISED FRIENDLY EYEBROWS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.092, 1.33, 0.214]} rotation={[0, 0, s * -0.14]}>
          <boxGeometry args={[0.07, 0.015, 0.008]} />
          <meshBasicMaterial color={HAIR_DRK} />
        </mesh>
      ))}

      {/* ── BIG FRIENDLY SMILE ── */}
      <mesh position={[0, 1.2, 0.216]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.04, 0.009, 4, 10, Math.PI * 0.82]} />
        <meshBasicMaterial color="#a04830" />
      </mesh>

      {/* ── ROSY CHEEKS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.16, 1.24, 0.178]} rotation={[0, s * 0.2, 0]}>
          <circleGeometry args={[0.052, 8]} />
          <meshBasicMaterial color="#ff9977" transparent opacity={0.58} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NANNY BODY — Priya Kapoor  (pink · warm · saree-inspired)
// Sandals · flowing saree · gold bangles · long hair · bindi · maang tikka
// ─────────────────────────────────────────────────────────────────────────────
function NannyBody({ leftArmRef, rightArmRef }: ArmRefs) {
  return (
    <group>
      {/* ── SANDALS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.11, 0.042, 0.06]} castShadow>
          <boxGeometry args={[0.14, 0.072, 0.22]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.82} />
        </mesh>
      ))}
      {/* Sandal straps */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.11, 0.068, 0.03]}>
          <boxGeometry args={[0.14, 0.018, 0.06]} />
          <meshStandardMaterial color="#c8a060" roughness={0.7} />
        </mesh>
      ))}

      {/* ── SAREE LOWER HALF (cone flare) ── */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.32, 0.58, 12]} />
        <meshStandardMaterial color="#ec4899" roughness={0.68} metalness={0.05} />
      </mesh>
      {/* Gold border at hem */}
      <mesh position={[0, 0.22, 0]}>
        <torusGeometry args={[0.295, 0.018, 6, 14]} />
        <meshBasicMaterial color="#d4a800" transparent opacity={0.88} />
      </mesh>
      {/* Gold border at waist */}
      <mesh position={[0, 0.79, 0]}>
        <torusGeometry args={[0.148, 0.015, 6, 12]} />
        <meshBasicMaterial color="#d4a800" transparent opacity={0.88} />
      </mesh>

      {/* ── BLOUSE / TORSO ── */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.175, 0.152, 0.4, 10]} />
        <meshStandardMaterial color="#be185d" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* ── SAREE DRAPE OVER LEFT SHOULDER ── */}
      <mesh position={[-0.14, 0.94, 0.12]} rotation={[0.3, 0.5, 0]}>
        <boxGeometry args={[0.08, 0.45, 0.026]} />
        <meshStandardMaterial color="#ec4899" roughness={0.7} />
      </mesh>
      <mesh position={[-0.2, 1.05, 0.1]} rotation={[0.2, 0.6, 0]}>
        <boxGeometry args={[0.065, 0.22, 0.018]} />
        <meshStandardMaterial color="#ec4899" roughness={0.7} />
      </mesh>

      {/* ── SHOULDERS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.2, 1.1, 0]}>
          <sphereGeometry args={[0.088, 8, 8]} />
          <meshStandardMaterial color="#be185d" roughness={0.65} />
        </mesh>
      ))}

      {/* ── LEFT ARM ── */}
      <group ref={leftArmRef} position={[-0.205, 1.09, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.056, 0.2, 4, 8]} />
          <meshStandardMaterial color="#be185d" roughness={0.65} />
        </mesh>
        <mesh position={[-0.015, -0.42, 0.01]} castShadow>
          <capsuleGeometry args={[0.047, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_TAN} roughness={0.65} />
        </mesh>
        {/* Gold bangles */}
        {([0, 0.04] as const).map((off, i) => (
          <mesh key={i} position={[-0.018, -0.58 - off, 0.01]}>
            <torusGeometry args={[0.05, 0.009, 5, 12]} />
            <meshStandardMaterial color="#d4a800" metalness={0.82} roughness={0.12} />
          </mesh>
        ))}
        <mesh position={[-0.022, -0.66, 0.01]}>
          <sphereGeometry args={[0.052, 8, 8]} />
          <meshStandardMaterial color={SK_TAN} roughness={0.7} />
        </mesh>
      </group>

      {/* ── RIGHT ARM ── */}
      <group ref={rightArmRef} position={[0.205, 1.09, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.056, 0.2, 4, 8]} />
          <meshStandardMaterial color="#be185d" roughness={0.65} />
        </mesh>
        <mesh position={[0.015, -0.42, 0.01]} castShadow>
          <capsuleGeometry args={[0.047, 0.18, 4, 8]} />
          <meshStandardMaterial color={SK_TAN} roughness={0.65} />
        </mesh>
        <mesh position={[0.018, -0.58, 0.01]}>
          <torusGeometry args={[0.05, 0.009, 5, 12]} />
          <meshStandardMaterial color="#d4a800" metalness={0.82} roughness={0.12} />
        </mesh>
        <mesh position={[0.022, -0.66, 0.01]}>
          <sphereGeometry args={[0.052, 8, 8]} />
          <meshStandardMaterial color={SK_TAN} roughness={0.7} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.185, 0]}>
        <cylinderGeometry args={[0.062, 0.072, 0.12, 8]} />
        <meshStandardMaterial color={SK_TAN} roughness={0.65} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[0, 1.375, 0]} castShadow>
        <sphereGeometry args={[0.215, 16, 16]} />
        <meshStandardMaterial color={SK_TAN} roughness={0.62} />
      </mesh>

      {/* ── HAIR BASE ── */}
      <mesh position={[0, 1.41, -0.05]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.8} />
      </mesh>
      {/* Long flowing hair down back */}
      <mesh position={[0, 1.2, -0.2]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.25, 0.55, 0.1]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.98, -0.22]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.08]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.82} />
      </mesh>
      {/* Hair parting */}
      <mesh position={[0, 1.585, -0.06]}>
        <boxGeometry args={[0.026, 0.08, 0.04]} />
        <meshStandardMaterial color="#100808" roughness={0.85} />
      </mesh>

      {/* ── GOLD MAANG TIKKA ── */}
      <mesh position={[0, 1.62, 0.08]}>
        <sphereGeometry args={[0.026, 6, 6]} />
        <meshStandardMaterial
          color="#d4a800"
          metalness={0.85}
          roughness={0.1}
          emissive="#c89000"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Chain */}
      <mesh position={[0, 1.6, 0.06]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.08, 4]} />
        <meshStandardMaterial color="#d4a800" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* ── BINDI (red dot on forehead) ── */}
      <mesh position={[0, 1.44, 0.211]}>
        <circleGeometry args={[0.016, 8]} />
        <meshBasicMaterial color="#cc0000" />
      </mesh>

      {/* ── CARTOON EYES ── */}
      <CartoonEye x={-0.083} y={1.393} z={0.188} color="#ec4899" />
      <CartoonEye x={0.083}  y={1.393} z={0.188} color="#ec4899" />

      {/* ── EYEBROWS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.083, 1.446, 0.202]} rotation={[0, 0, s * 0.18]}>
          <boxGeometry args={[0.066, 0.013, 0.008]} />
          <meshBasicMaterial color={HAIR_BLK} />
        </mesh>
      ))}

      {/* ── WARM SMILE ── */}
      <mesh position={[0, 1.334, 0.206]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.033, 0.008, 4, 10, Math.PI * 0.74]} />
        <meshBasicMaterial color="#8b4020" />
      </mesh>

      {/* ── CHEEKS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.152, 1.364, 0.168]} rotation={[0, s * 0.22, 0]}>
          <circleGeometry args={[0.046, 8]} />
          <meshBasicMaterial color="#ff8877" transparent opacity={0.52} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY BODY — Marcus Reyes  (red · tall · imposing)
// Combat boots · dark uniform · peaked cap with badge · walkie-talkie
// ─────────────────────────────────────────────────────────────────────────────
function SecurityBody({ leftArmRef, rightArmRef }: ArmRefs) {
  return (
    <group>
      {/* ── COMBAT BOOTS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.16, 0.1, 0.02]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.27]} />
          <meshStandardMaterial color="#080808" roughness={0.72} metalness={0.2} />
        </mesh>
      ))}
      {/* Boot toe cap */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.16, 0.1, 0.11]}>
          <boxGeometry args={[0.18, 0.12, 0.05]} />
          <meshStandardMaterial color="#0f0f0f" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}

      {/* ── PANTS (wide, authoritative) ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.155, 0.43, 0]} castShadow>
          <capsuleGeometry args={[0.094, 0.44, 4, 8]} />
          <meshStandardMaterial color="#0e0e0e" roughness={0.85} />
        </mesh>
      ))}
      {/* Trouser seam stripe */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.155, 0.43, 0.092]}>
          <boxGeometry args={[0.016, 0.44, 0.008]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* ── WIDE UNIFORM TORSO ── */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.56, 0.64, 0.32]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.72} metalness={0.1} />
      </mesh>
      {/* Jacket lapels */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.068, 0.98, 0.155]} rotation={[0, 0, s * 0.42]}>
          <boxGeometry args={[0.08, 0.3, 0.014]} />
          <meshStandardMaterial color="#080808" roughness={0.72} />
        </mesh>
      ))}
      {/* Chest pockets */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.15, 0.96, 0.162]}>
          <boxGeometry args={[0.11, 0.08, 0.01]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
      ))}

      {/* ── GOLD BADGE ── */}
      <mesh position={[-0.12, 0.97, 0.163]}>
        <boxGeometry args={[0.1, 0.07, 0.016]} />
        <meshStandardMaterial
          color="#c8a800"
          metalness={0.88}
          roughness={0.08}
          emissive="#a08800"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[-0.12, 0.97, 0.175]}>
        <boxGeometry args={[0.078, 0.048, 0.005]} />
        <meshStandardMaterial color="#e8c800" metalness={0.92} roughness={0.05} />
      </mesh>

      {/* ── BELT ── */}
      <mesh position={[0, 0.595, 0]}>
        <torusGeometry args={[0.245, 0.023, 6, 14]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.45} />
      </mesh>
      <mesh position={[0, 0.595, 0.245]}>
        <boxGeometry args={[0.062, 0.042, 0.018]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── WIDE SHOULDERS ── */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.325, 1.19, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.1, 0.28]} />
            <meshStandardMaterial color="#0e0e0e" roughness={0.72} />
          </mesh>
          {/* Rank stripe */}
          <mesh position={[0, 0.065, 0.14]}>
            <boxGeometry args={[0.1, 0.018, 0.012]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}

      {/* ── LEFT ARM ── */}
      <group ref={leftArmRef} position={[-0.325, 1.18, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.082, 0.28, 4, 8]} />
          <meshStandardMaterial color="#0e0e0e" roughness={0.72} />
        </mesh>
        <mesh position={[-0.02, -0.54, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={SK_DARK} roughness={0.65} />
        </mesh>
        <mesh position={[-0.024, -0.74, 0]}>
          <sphereGeometry args={[0.078, 8, 8]} />
          <meshStandardMaterial color={SK_DARK} roughness={0.7} />
        </mesh>
      </group>

      {/* ── RIGHT ARM (holds walkie-talkie) ── */}
      <group ref={rightArmRef} position={[0.325, 1.18, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.082, 0.28, 4, 8]} />
          <meshStandardMaterial color="#0e0e0e" roughness={0.72} />
        </mesh>
        <mesh position={[0.02, -0.54, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={SK_DARK} roughness={0.65} />
        </mesh>
        {/* Walkie-talkie body */}
        <mesh position={[0.04, -0.7, 0.04]} castShadow>
          <boxGeometry args={[0.1, 0.15, 0.052]} />
          <meshStandardMaterial color="#181818" roughness={0.52} metalness={0.3} />
        </mesh>
        {/* Screen */}
        <mesh position={[0.04, -0.67, 0.072]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} />
          <meshStandardMaterial
            color="#050505"
            emissive="#ef4444"
            emissiveIntensity={0.28}
            roughness={0}
          />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.04, -0.56, 0.06]} rotation={[0.08, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.1, 5]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── THICK NECK ── */}
      <mesh position={[0, 1.315, 0]}>
        <cylinderGeometry args={[0.088, 0.104, 0.14, 8]} />
        <meshStandardMaterial color={SK_DARK} roughness={0.65} />
      </mesh>

      {/* ── HEAD (slightly squarer) ── */}
      <mesh position={[0, 1.505, 0]} castShadow>
        <sphereGeometry args={[0.21, 14, 14]} />
        <meshStandardMaterial color={SK_DARK} roughness={0.62} />
      </mesh>

      {/* ── SHORT HAIR ── */}
      <mesh position={[0, 1.555, 0]}>
        <sphereGeometry args={[0.205, 10, 10]} />
        <meshStandardMaterial color={HAIR_BLK} roughness={0.82} />
      </mesh>

      {/* ── PEAKED CAP ── */}
      <mesh position={[0, 1.726, 0]}>
        <cylinderGeometry args={[0.225, 0.198, 0.112, 10]} />
        <meshStandardMaterial color="#080808" roughness={0.65} metalness={0.14} />
      </mesh>
      {/* Visor/peak */}
      <mesh position={[0, 1.692, 0.225]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.34, 0.04, 0.145]} />
        <meshStandardMaterial color="#080808" roughness={0.5} metalness={0.16} />
      </mesh>
      {/* Red cap band */}
      <mesh position={[0, 1.68, 0]}>
        <torusGeometry args={[0.208, 0.017, 6, 14]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Cap emblem */}
      <mesh position={[0, 1.726, 0.214]}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshStandardMaterial
          color="#c8a800"
          metalness={0.88}
          roughness={0.08}
          emissive="#a08800"
          emissiveIntensity={0.28}
        />
      </mesh>

      {/* ── CARTOON EYES (slightly narrowed — stern) ── */}
      <CartoonEye x={-0.08} y={1.515} z={0.183} color="#ef4444" />
      <CartoonEye x={0.08}  y={1.515} z={0.183} color="#ef4444" />

      {/* ── FURROWED EYEBROWS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.08, 1.568, 0.198]} rotation={[0, 0, s * -0.38]}>
          <boxGeometry args={[0.072, 0.017, 0.008]} />
          <meshBasicMaterial color={HAIR_BLK} />
        </mesh>
      ))}

      {/* ── STERN MOUTH (flat line) ── */}
      <mesh position={[0, 1.463, 0.198]}>
        <boxGeometry args={[0.072, 0.012, 0.007]} />
        <meshBasicMaterial color="#4a2818" />
      </mesh>

      {/* ── JAW SHADOW / STUBBLE ── */}
      <mesh position={[0, 1.458, 0.174]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.15, 0.042, 0.04]} />
        <meshBasicMaterial color="#6a4030" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE NPC — animation + proximity + interaction wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SingleNPC({
  npc, x3d, z3d, player3DPosRef, onInterrogate, isChatOpen,
}: SingleNPCProps) {
  const rootRef     = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const glowRef     = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState(false);
  const wasNearRef  = useRef(false);
  const phase       = useRef(npc.x * 0.05 + npc.y * 0.03);

  useFrame((state) => {
    const t  = state.clock.elapsedTime;
    const ph = phase.current;

    // Body breathing + gentle sway
    if (rootRef.current) {
      rootRef.current.position.y  = Math.sin(t * 1.9 + ph) * 0.022;
      rootRef.current.rotation.y  = Math.sin(t * 0.65 + ph) * 0.065;
    }

    // Arm swing
    if (leftArmRef.current)  leftArmRef.current.rotation.x  =  Math.sin(t * 2.1 + ph) * 0.18;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2.1 + ph) * 0.18;

    // Glow ring pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + Math.sin(t * 2.8 + ph) * 0.09;
    }

    // Horizontal-distance proximity check (ignores Y so height gap doesn't matter)
    if (player3DPosRef.current) {
      const dx = player3DPosRef.current.x - x3d;
      const dz = player3DPosRef.current.z - z3d;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const near = dist < 2.0;
      if (near !== isNear) setIsNear(near);
      if (near && !wasNearRef.current && !isChatOpen) gameAudio.playHighlightCue();
      wasNearRef.current = near;
    }
  });

  // E-key interaction
  useEffect(() => {
    if (!isNear || isChatOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) return;
      if (e.key.toLowerCase() === 'e') onInterrogate(npc.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isNear, isChatOpen, npc.id, onInterrogate]);

  return (
    <group position={[x3d, 0, z3d]}>
      {/* ── INTERACTION PROMPT (close) ── */}
      {isNear && !isChatOpen && (
        <Html distanceFactor={6} position={[0, 2.25, 0]} center>
          <div className="bg-[#0c0c0c]/95 border border-[#ffb000] text-[#ffb000] font-mono px-3 py-1.5 rounded-sm text-[10px] whitespace-nowrap shadow-[0_0_15px_rgba(255,176,0,0.45)] flex flex-col items-center gap-0.5 animate-bounce select-none pointer-events-none">
            <span className="font-black tracking-widest text-[11px]">[ E ] INTERROGATE</span>
            <span className="text-gray-400 text-[8px]">{npc.name.toUpperCase()}</span>
          </div>
        </Html>
      )}

      {/* ── NAME TAG (far) ── */}
      {!isNear && (
        <Html distanceFactor={10} position={[0, 2.05, 0]} center>
          <div
            className="font-mono text-[8px] tracking-wider px-1.5 py-0.5 bg-black/80 border border-white/20 rounded-sm whitespace-nowrap select-none pointer-events-none"
            style={{ color: npc.color }}
          >
            {npc.name.split(' ')[0].toUpperCase()}
          </div>
        </Html>
      )}

      {/* ── ANIMATED CHARACTER ── */}
      <group ref={rootRef}>
        {npc.id === 'curator'  && <CuratorBody  leftArmRef={leftArmRef} rightArmRef={rightArmRef} />}
        {npc.id === 'cleaner'  && <CleanerBody  leftArmRef={leftArmRef} rightArmRef={rightArmRef} />}
        {npc.id === 'nanny'    && <NannyBody    leftArmRef={leftArmRef} rightArmRef={rightArmRef} />}
        {npc.id === 'security' && <SecurityBody leftArmRef={leftArmRef} rightArmRef={rightArmRef} />}
      </group>

      {/* ── FLOOR GLOW RING ── */}
      <mesh ref={glowRef} position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 16]} />
        <meshBasicMaterial color={npc.color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function NPC3D({ player3DPosRef, onInterrogate, isChatOpen }: NPC3DProps) {
  return (
    <group>
      {NPC_SPAWNS.map((npc: NpcSpawn) => {
        const pos3D = to3DCoords(npc.x, npc.y);
        return (
          <SingleNPC
            key={npc.id}
            npc={npc}
            x3d={pos3D.x}
            z3d={pos3D.z}
            player3DPosRef={player3DPosRef}
            onInterrogate={onInterrogate}
            isChatOpen={isChatOpen}
          />
        );
      })}
    </group>
  );
}
