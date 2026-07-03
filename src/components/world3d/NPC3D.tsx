import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NPC_SPAWNS, NpcSpawn } from '../world/galleryMap';
import { to3DCoords } from './GalleryBuilding';
import { gameAudio } from './Player3D';

// Import modular character body components
import { CuratorBody } from './npcs/CuratorBody';
import { CleanerBody } from './npcs/CleanerBody';
import { NannyBody } from './npcs/NannyBody';
import { SecurityBody } from './npcs/SecurityBody';

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

    // Horizontal-distance proximity check
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

      {/* Rim light for NPC silhouette definition */}
      <pointLight 
        position={[0, 1.4, -0.45]} 
        color="#8B9BB4" 
        intensity={0.65} 
        distance={2.8} 
        decay={2.0} 
      />

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
