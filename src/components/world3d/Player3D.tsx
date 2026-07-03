import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { to3DCoords } from './GalleryBuilding';
import { WALLS } from '../world/galleryMap';

const DEBUG = false;

// -------------------------------------------------------------
// WEB AUDIO API ATMOSPHERIC SYNTHESIZER
// -------------------------------------------------------------
class GameAudio {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.startDrone();
      this.initialized = true;
      console.log('Noir audio environment online.');
    } catch (e) {
      console.warn('Audio Context failed to initialize:', e);
    }
  }

  private startDrone() {
    if (!this.ctx) return;
    try {
      this.droneOsc = this.ctx.createOscillator();
      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.setValueAtTime(45, this.ctx.currentTime); // Low subsonic hum

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.015, this.ctx.currentTime); // Very subtle background rumble

      this.droneOsc.connect(lowpass);
      lowpass.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      this.droneOsc.start();
    } catch (e) {
      console.error(e);
    }
  }

  playFootstep() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    try {
      // Soft echoey floor thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playHighlightCue() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    try {
      // Atmospheric cyber-chime echoing
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const feedback = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, this.ctx.currentTime); // E5
      osc.frequency.setValueAtTime(990, this.ctx.currentTime + 0.1); // B5 fifth

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      delay.delayTime.setValueAtTime(0.18, this.ctx.currentTime);
      feedback.gain.setValueAtTime(0.35, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.7);
    } catch (e) {}
  }

  // Dissonant alarm sting for wrong accusations
  playWrongAccusation() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    try {
      // Layer 1: harsh dissonant chord (tritone interval)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(185, this.ctx.currentTime); // F#3
      osc1.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.8);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(262, this.ctx.currentTime); // C4 — tritone against F#
      osc2.frequency.exponentialRampToValueAtTime(155, this.ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.8);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 1.0);
      osc2.stop(this.ctx.currentTime + 1.0);

      // Layer 2: sharp noise burst
      const bufferSize = this.ctx.sampleRate * 0.15;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  // Triumphant chime for correct accusation
  playCorrectAccusation() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    try {
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6 — major arpeggio
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, this.ctx!.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.12);
        osc.stop(this.ctx!.currentTime + i * 0.12 + 0.7);
      });
    } catch (e) {}
  }
}

export const gameAudio = new GameAudio();

// Simple 2D AABB bounding box check
function checkCollision(px: number, py: number, currentDoors: any[] = []): boolean {
  const pSize = 12; // player radius
  const minX = px - pSize;
  const maxX = px + pSize;
  const minY = py - pSize;
  const maxY = py + pSize;

  // Level boundary safety limits
  if (px < 25 || px > 775 || py < 25 || py > 605) return true;

  for (const wall of WALLS) {
    const wHalfW = wall.width / 2;
    const wHalfH = wall.height / 2;
    const wMinX = wall.x - wHalfW;
    const wMaxX = wall.x + wHalfW;
    const wMinY = wall.y - wHalfH;
    const wMaxY = wall.y + wHalfH;

    if (minX < wMaxX && maxX > wMinX && minY < wMaxY && maxY > wMinY) {
      return true;
    }
  }

  // Check closed doors
  for (const door of currentDoors) {
    if (!door.isOpen) {
      const wHalfW = door.width / 2;
      const wHalfH = door.height / 2;
      const wMinX = door.x - wHalfW;
      const wMaxX = door.x + wHalfW;
      const wMinY = door.y - wHalfH;
      const wMaxY = door.y + wHalfH;

      if (minX < wMaxX && maxX > wMinX && minY < wMaxY && maxY > wMinY) {
        return true;
      }
    }
  }

  return false;
}

interface Player3DProps {
  onPositionUpdate: (x: number, y: number) => void;
  isChatOpen: boolean;
  player3DPosRef: React.RefObject<THREE.Vector3 | null>;
  playerYawRef: React.MutableRefObject<number>;
  playerPitchRef: React.MutableRefObject<number>;
  doors: Array<{ id: string; isOpen: boolean; x: number; y: number; width: number; height: number }>;
}

export default function Player3D({
  onPositionUpdate,
  isChatOpen,
  player3DPosRef,
  playerYawRef,
  playerPitchRef,
  doors
}: Player3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const spotLightTargetRef = useRef<THREE.Object3D>(null);

  const playerPosRef = useRef({ x: 400, y: 380 }); // Spawn at Main Hall, offset from NPCs
  const keysRef = useRef({
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false
  });

  const isMouseDown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const stepTimer = useRef(0);
  const doorsRef = useRef(doors);

  useEffect(() => {
    doorsRef.current = doors;
  }, [doors]);

  // Initialize Web Audio upon interaction
  useEffect(() => {
    const handleTriggerAudio = () => {
      gameAudio.init();
    };

    window.addEventListener('click', handleTriggerAudio);
    window.addEventListener('keydown', handleTriggerAudio);
    return () => {
      window.removeEventListener('click', handleTriggerAudio);
      window.removeEventListener('keydown', handleTriggerAudio);
    };
  }, []);

  // Controls listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatOpen) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const key = e.key.toLowerCase();
      if (key in keysRef.current) {
        keysRef.current[key as keyof typeof keysRef.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current) {
        keysRef.current[key as keyof typeof keysRef.current] = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isChatOpen) return;

      // Sensitivity settings
      const mouseSens = 0.0025;

      if (document.pointerLockElement) {
        playerYawRef.current -= e.movementX * mouseSens;
        playerPitchRef.current -= e.movementY * mouseSens;
        playerPitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, playerPitchRef.current));
      } else if (isMouseDown.current) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        playerYawRef.current -= deltaX * mouseSens * 2;
        playerPitchRef.current -= deltaY * mouseSens * 2;
        playerPitchRef.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, playerPitchRef.current));
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerLockError = (err: Event) => {
      console.error('[Player3D] Pointer lock failed / was denied by the browser:', err);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isChatOpen) return;
      
      // Only drag if clicking inside the game frame
      const canvas = document.querySelector('canvas');
      if (canvas && canvas.contains(e.target as Node)) {
        isMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        
        if (DEBUG) console.log('[Player3D] Pointer lock requested on canvas click');
        // Request pointer lock for first-person look-around
        try {
          const promise = canvas.requestPointerLock() as any;
          if (promise && typeof promise.catch === 'function') {
            promise.catch((err: any) => {
              console.error('[Player3D] Pointer lock request rejected by promise catch:', err);
            });
          }
        } catch (err) {
          console.error('[Player3D] Pointer lock request failed with exception:', err);
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [isChatOpen, playerYawRef, playerPitchRef]);

  useFrame((state, delta) => {
    // 1. Handle Arrow Keys Rotation in addition to Mouse
    const rotSpeed = 1.6 * delta;
    if (!isChatOpen) {
      if (keysRef.current.arrowleft) playerYawRef.current += rotSpeed;
      if (keysRef.current.arrowright) playerYawRef.current -= rotSpeed;
      if (keysRef.current.arrowup) {
        playerPitchRef.current += rotSpeed;
        playerPitchRef.current = Math.max(-Math.PI / 3.5, Math.min(Math.PI / 3.5, playerPitchRef.current));
      }
      if (keysRef.current.arrowdown) {
        playerPitchRef.current -= rotSpeed;
        playerPitchRef.current = Math.max(-Math.PI / 3.5, Math.min(Math.PI / 3.5, playerPitchRef.current));
      }
    }

    // 2. Convert keyboard WASD to relative camera directions
    let strafeX = 0;
    let strafeZ = 0;
    const speed = 140; // 2D pixels per second

    if (!isChatOpen) {
      if (keysRef.current.w) strafeZ = -1; // Forward
      else if (keysRef.current.s) strafeZ = 1;  // Backward

      if (keysRef.current.a) strafeX = -1; // Strafe Left
      else if (keysRef.current.d) strafeX = 1;  // Strafe Right
    }

    const isMoving = strafeX !== 0 || strafeZ !== 0;

    // Relative movement vectors based on camera yaw
    let dx = 0;
    let dy = 0;

    if (isMoving) {
      const yaw = playerYawRef.current;
      
      // Calculate movement vector aligned to yaw
      // Forward: dx = sin(yaw), dy = -cos(yaw) (since in 2D map -Y is North/Forward)
      const forwardX = Math.sin(yaw);
      const forwardY = -Math.cos(yaw);

      // Right strafe: dx = cos(yaw), dy = sin(yaw)
      const rightX = Math.cos(yaw);
      const rightY = Math.sin(yaw);

      // Sum vectors
      dx = (forwardX * -strafeZ) + (rightX * strafeX);
      dy = (forwardY * -strafeZ) + (rightY * strafeX);

      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx = (dx / len) * speed * delta;
        dy = (dy / len) * speed * delta;
      }
    }

    // 3. Slide Collision Responses (try X then Y separately)
    if (isMoving) {
      const nextX = playerPosRef.current.x + dx;
      const nextY = playerPosRef.current.y + dy;

      if (!checkCollision(nextX, playerPosRef.current.y, doorsRef.current)) {
        playerPosRef.current.x = nextX;
      }
      if (!checkCollision(playerPosRef.current.x, nextY, doorsRef.current)) {
        playerPosRef.current.y = nextY;
      }

      // Notify CaseWorld of 2D location coordinates update (for room log, active wing, etc)
      onPositionUpdate(playerPosRef.current.x, playerPosRef.current.y);

      // 4. Subtle Footstep sound intervals
      stepTimer.current += delta;
      if (stepTimer.current > 0.48) {
        gameAudio.playFootstep();
        stepTimer.current = 0;
      }
    } else {
      stepTimer.current = 0.4; // Ready to step instantly when moving
    }

    // 5. Update shared and local positioning
    const pos3D = to3DCoords(playerPosRef.current.x, playerPosRef.current.y);
    
    if (player3DPosRef.current) {
      player3DPosRef.current.set(pos3D.x, 0.4, pos3D.z);
    }

    // Camera bob calculation
    const bob = isMoving ? Math.sin(state.clock.elapsedTime * 10) * 0.045 : 0;

    // Apply eye level position (Y = 1.4) + bobbing
    state.camera.position.set(pos3D.x, 1.4 + bob, pos3D.z);
    state.camera.rotation.set(playerPitchRef.current, playerYawRef.current, 0, 'YXZ');

    // Update spotlight and target positioning
    if (spotLightRef.current && spotLightTargetRef.current) {
      spotLightRef.current.position.copy(state.camera.position);
      const targetOffset = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      spotLightTargetRef.current.position.copy(state.camera.position).add(targetOffset);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[to3DCoords(playerPosRef.current.x, playerPosRef.current.y).x, 0.01, to3DCoords(playerPosRef.current.x, playerPosRef.current.y).z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.25, 16]} />
        <meshBasicMaterial color="#A63A2B" transparent opacity={0.35} />
      </mesh>
      <object3D ref={spotLightTargetRef} />
      <spotLight
        ref={spotLightRef}
        target={spotLightTargetRef.current || undefined}
        castShadow
        intensity={3.5}
        distance={20}
        angle={Math.PI / 5.5}
        penumbra={0.65}
        decay={1.6}
        color="#ffe8c0"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </group>
  );
}
