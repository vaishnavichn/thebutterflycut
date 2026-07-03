import React from 'react';
import * as THREE from 'three';
import { CartoonEye } from './CartoonEye';

const SK_DARK  = '#8a6040';
const HAIR_BLK = '#0a0806';

interface ArmRefs {
  leftArmRef: React.MutableRefObject<THREE.Group | null>;
  rightArmRef: React.MutableRefObject<THREE.Group | null>;
}

export function SecurityBody({ leftArmRef, rightArmRef }: ArmRefs) {
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
