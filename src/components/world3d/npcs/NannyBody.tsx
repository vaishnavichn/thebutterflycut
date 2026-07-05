import React, { useMemo } from 'react';
import * as THREE from 'three';

// ── Priya Kapoor — Fully 3D Stylized Anime Redesign ──────────────────────────
const SK      = '#c8845a';   // warm tan skin
const HAIR    = '#0d0a08';   // deep black hair
const DRESS_D = '#3b1040';   // deep plum
const DRESS_M = '#5a1860';   // mid-plum highlights
const COAT    = '#1e0a28';   // dark coat
const GOLD    = '#c8942a';   // brass gold
const WINE    = '#7a1535';   // wine red

interface ArmRefs {
  leftArmRef:  React.MutableRefObject<THREE.Group | null>;
  rightArmRef: React.MutableRefObject<THREE.Group | null>;
}

export function NannyBody({ leftArmRef, rightArmRef }: ArmRefs) {
  // Generate a high-quality 2D face texture drawn cleanly on a square canvas
  const faceTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill with solid skin color
    ctx.fillStyle = SK;
    ctx.fillRect(0, 0, 512, 512);

    // 1. Draw soft blush ovals
    const drawBlush = (x: number, y: number) => {
      const grad = ctx.createRadialGradient(x, y, 5, x, y, 45);
      grad.addColorStop(0, 'rgba(224, 112, 96, 0.5)');
      grad.addColorStop(1, 'rgba(224, 112, 96, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fill();
    };
    drawBlush(150, 310);
    drawBlush(362, 310);

    // 2. Draw sharp, elegant anime eyes
    const drawEye = (cx: number, cy: number, side: 1 | -1) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(side, 1);

      // Eye White (Sclera)
      ctx.fillStyle = '#fcfaf6';
      ctx.beginPath();
      ctx.moveTo(-55, 0);
      ctx.quadraticCurveTo(-15, -35, 45, -5);
      ctx.quadraticCurveTo(20, 30, -55, 0);
      ctx.closePath();
      ctx.fill();

      // Large Violet Iris
      ctx.fillStyle = '#4a1870';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      // Inner Iris Glow (Light Violet)
      ctx.fillStyle = '#9e4cd0';
      ctx.beginPath();
      ctx.arc(0, 8, 16, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f0514';
      ctx.beginPath();
      ctx.arc(0, -2, 12, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, -10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-8, 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Upper Eyelash line (Thick black)
      ctx.strokeStyle = '#0d0a08';
      ctx.lineWidth = 7.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-60, -3);
      ctx.quadraticCurveTo(-15, -38, 52, -7);
      ctx.stroke();

      // Outer lash flick
      ctx.fillStyle = '#0d0a08';
      ctx.beginPath();
      ctx.moveTo(35, -12);
      ctx.lineTo(58, -25);
      ctx.lineTo(46, -5);
      ctx.closePath();
      ctx.fill();

      // Lower lash line
      ctx.strokeStyle = 'rgba(13, 10, 8, 0.75)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-45, 10);
      ctx.quadraticCurveTo(15, 28, 40, 5);
      ctx.stroke();

      ctx.restore();
    };

    drawEye(165, 240, 1);
    drawEye(347, 240, -1);

    // 3. Eyebrows
    const drawEyebrow = (sx: number, sy: number, ex: number, ey: number, side: 1 | -1) => {
      ctx.strokeStyle = '#0d0a08';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo((sx + ex) / 2, sy - 14 * side, ex, ey);
      ctx.stroke();
    };
    drawEyebrow(110, 185, 215, 195, 1);
    drawEyebrow(402, 185, 297, 195, -1);

    // 4. Nose Point
    ctx.fillStyle = '#a86a48';
    ctx.beginPath();
    ctx.moveTo(256, 280);
    ctx.lineTo(260, 295);
    ctx.lineTo(252, 295);
    ctx.closePath();
    ctx.fill();

    // 5. Delicate closed smile
    ctx.strokeStyle = '#7a3828';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(220, 345);
    ctx.quadraticCurveTo(256, 368, 292, 345);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <group>
      {/* ── SHOES (Heels) ── */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.1, 0.05, 0.03]}>
          <mesh castShadow>
            <boxGeometry args={[0.11, 0.08, 0.18]} />
            <meshStandardMaterial color="#110810" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.03, -0.04]}>
            <coneGeometry args={[0.016, 0.06, 4]} />
            <meshStandardMaterial color="#110810" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ── LEGS ── */}
      {([-1, 1] as const).map((s) => (
        <mesh key={s} position={[s * 0.1, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.032, 0.72, 8]} />
          <meshStandardMaterial color="#1a0a20" roughness={0.8} />
        </mesh>
      ))}

      {/* ── LAYERED ELEGANT DRESS/SKIRT ── */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 0.42, 10]} />
        <meshStandardMaterial color={DRESS_D} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 0.4, 12]} />
        <meshStandardMaterial color={DRESS_D} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.425, 0]}>
        <torusGeometry args={[0.31, 0.012, 6, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── TORSO & COAT ── */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.32, 10]} />
        <meshStandardMaterial color={DRESS_D} roughness={0.6} />
      </mesh>
      <mesh position={[-0.075, 1.14, 0.09]} rotation={[0, -0.15, 0.05]} castShadow>
        <boxGeometry args={[0.08, 0.38, 0.04]} />
        <meshStandardMaterial color={COAT} roughness={0.7} />
      </mesh>
      <mesh position={[0.075, 1.14, 0.09]} rotation={[0, 0.15, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.38, 0.04]} />
        <meshStandardMaterial color={COAT} roughness={0.7} />
      </mesh>

      {/* ── COLLAR & NECKLACE ── */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.04, 10]} />
        <meshStandardMaterial color={DRESS_M} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.28, 0.085]} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── ARMS ── */}
      <group ref={leftArmRef} position={[-0.17, 1.27, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.3, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.7} />
        </mesh>
        <mesh position={[-0.01, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.025, 0.26, 8]} />
          <meshStandardMaterial color={SK} roughness={0.6} />
        </mesh>
        <mesh position={[-0.012, -0.57, 0]}>
          <sphereGeometry args={[0.034, 8, 8]} />
          <meshStandardMaterial color={SK} roughness={0.6} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.17, 1.27, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.3, 8]} />
          <meshStandardMaterial color={COAT} roughness={0.7} />
        </mesh>
        <mesh position={[0.01, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.025, 0.26, 8]} />
          <meshStandardMaterial color={SK} roughness={0.6} />
        </mesh>
        <mesh position={[0.012, -0.57, 0]}>
          <sphereGeometry args={[0.034, 8, 8]} />
          <meshStandardMaterial color={SK} roughness={0.6} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 0.16, 8]} />
        <meshStandardMaterial color={SK} roughness={0.6} />
      </mesh>

      {/* ── STYLIZED 3D ANIME HEAD WITH FLAT FRONT FACE CARD ── */}
      <group position={[0, 1.58, 0]}>
        {/* Round Skull Back (solid hair base) */}
        <mesh castShadow position={[0, 0, -0.02]}>
          <sphereGeometry args={[0.165, 16, 16]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>

        {/* Flat Face Plate (placed in front of hair, perfect texture mapping) */}
        <mesh position={[0, 0, 0.138]} castShadow>
          <planeGeometry args={[0.26, 0.26]} />
          <meshStandardMaterial 
            color={SK} 
            roughness={0.6} 
            map={faceTexture || undefined} 
            transparent={false}
          />
        </mesh>

        {/* ── ANIME HAIR SPIKES & STRANDS ── */}
        {/* Hair Cap Base */}
        <mesh position={[0, 0.06, -0.02]} scale={[1.06, 1, 1.06]}>
          <sphereGeometry args={[0.174, 16, 16]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        
        {/* Hair Spikes - Back flowing hair */}
        {([-0.1, -0.05, 0, 0.05, 0.1] as const).map((xOff, i) => (
          <mesh key={i} position={[xOff, -0.22, -0.12]} rotation={[0.25, 0, xOff * -0.5]}>
            <coneGeometry args={[0.045, 0.35, 4]} />
            <meshStandardMaterial color={HAIR} roughness={0.7} />
          </mesh>
        ))}
        {/* Left Side Bangs */}
        <mesh position={[-0.14, -0.1, 0.08]} rotation={[0.4, 0.2, -0.3]}>
          <coneGeometry args={[0.038, 0.28, 4]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        {/* Right Side Bangs */}
        <mesh position={[0.14, -0.1, 0.08]} rotation={[0.4, -0.2, 0.3]}>
          <coneGeometry args={[0.038, 0.28, 4]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        {/* Front Fringe Spikes */}
        <mesh position={[-0.05, 0.12, 0.12]} rotation={[-0.2, -0.1, -0.5]}>
          <coneGeometry args={[0.03, 0.12, 4]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>
        <mesh position={[0.05, 0.12, 0.12]} rotation={[-0.2, 0.1, 0.5]}>
          <coneGeometry args={[0.03, 0.12, 4]} />
          <meshStandardMaterial color={HAIR} roughness={0.7} />
        </mesh>

        {/* Ornate Hairpin */}
        <group position={[0.14, 0.12, 0.08]} rotation={[0.2, 0.4, 0.6]}>
          <mesh>
            <cylinderGeometry args={[0.005, 0.005, 0.1, 4]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color={WINE} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
