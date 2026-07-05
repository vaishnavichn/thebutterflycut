import React from 'react';

export function CartoonEye({
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
