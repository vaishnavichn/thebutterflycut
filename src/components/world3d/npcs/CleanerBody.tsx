import React from 'react';
import * as THREE from 'three';
import { CartoonEye } from './CartoonEye';

const SK_MED   = '#c88565';
const HAIR_DRK = '#1a0c08';

interface ArmRefs {
  leftArmRef: React.MutableRefObject<THREE.Group | null>;
  rightArmRef: React.MutableRefObject<THREE.Group | null>;
}

export function CleanerBody({ leftArmRef, rightArmRef }: ArmRefs) {
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
