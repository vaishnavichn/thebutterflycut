import React from 'react';
import * as THREE from 'three';
import { CartoonEye } from './CartoonEye';

const SK_LIGHT = '#ffd5b0';
const HAIR_BLK = '#0a0806';

interface ArmRefs {
  leftArmRef: React.MutableRefObject<THREE.Group | null>;
  rightArmRef: React.MutableRefObject<THREE.Group | null>;
}

export function CuratorBody({ leftArmRef, rightArmRef }: ArmRefs) {
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

      {/* ── TALL NECK ── */}
      <mesh position={[0, 1.25, 0.01]} castShadow>
        <cylinderGeometry args={[0.078, 0.085, 0.18, 8]} />
        <meshStandardMaterial color={SK_LIGHT} roughness={0.65} />
      </mesh>

      {/* ── ELEGANT POSED HEAD ── */}
      <group position={[0, 1.45, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.165, 10, 10]} />
          <meshStandardMaterial color={SK_LIGHT} roughness={0.65} />
        </mesh>
        {/* Bun hairstyle behind head */}
        <mesh position={[0, 0.078, -0.155]}>
          <sphereGeometry args={[0.078, 8, 8]} />
          <meshStandardMaterial color={HAIR_BLK} roughness={0.8} />
        </mesh>
        {/* Hair wrap */}
        <mesh position={[0, 0.08, -0.06]} rotation={[-0.2, 0, 0]}>
          <sphereGeometry args={[0.174, 10, 10]} />
          <meshStandardMaterial color={HAIR_BLK} roughness={0.85} />
        </mesh>
      </group>

      {/* ── POISED CARTOON EYES ── */}
      <CartoonEye x={-0.075} y={1.485} z={0.16} color="#4ade80" />
      <CartoonEye x={0.075}  y={1.485} z={0.16} color="#4ade80" />

      {/* ── SPECTACLES / GLASSES ── */}
      <group position={[0, 1.5, 0.16]}>
        {([-1, 1] as const).map((s) => (
          <mesh key={s} position={[s * 0.07, -0.01, 0.016]}>
            <torusGeometry args={[0.046, 0.007, 4, 10]} />
            <meshBasicMaterial color="#a63a2b" />
          </mesh>
        ))}
        {/* Bridge */}
        <mesh position={[0, -0.01, 0.016]}>
          <boxGeometry args={[0.06, 0.008, 0.008]} />
          <meshBasicMaterial color="#a63a2b" />
        </mesh>
      </group>

      {/* ── LIPSTICK MOUTH ── */}
      <mesh position={[0, 1.37, 0.174]}>
        <boxGeometry args={[0.044, 0.012, 0.007]} />
        <meshBasicMaterial color="#a63a2b" />
      </mesh>
    </group>
  );
}
