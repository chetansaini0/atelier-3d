"use client";

import type { OutdoorElement } from "@/types/scene";

export function EnvironmentBuilder({ elements }: { elements: OutdoorElement[] }) {
  return (
    <group>
      {elements.map((el) => {
        const { width: w, depth: d, height: h } = el.dimensions;
        return (
          <group key={el.id} position={[el.position.x, el.position.y, el.position.z]} rotation={[0, el.rotation, 0]}>
            {el.kind === "grass" || el.kind === "terrain" ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[w, d]} />
                <meshPhysicalMaterial color={el.color ?? "#4d7a3e"} roughness={0.95} />
              </mesh>
            ) : null}
            {el.kind === "path" || el.kind === "parking" ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[w, d]} />
                <meshPhysicalMaterial color={el.color ?? "#b7b1a6"} roughness={0.8} />
              </mesh>
            ) : null}
            {el.kind === "water" ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[w, d]} />
                <meshPhysicalMaterial color="#4a7d8c" roughness={0.08} metalness={0.1} transparent opacity={0.55} />
              </mesh>
            ) : null}
            {el.kind === "tree" ? (
              <>
                <mesh position={[0, h * 0.18, 0]} castShadow>
                  <cylinderGeometry args={[0.16, 0.22, h * 0.36, 8]} />
                  <meshPhysicalMaterial color="#5c4030" roughness={0.85} />
                </mesh>
                <mesh position={[0, h * 0.55, 0]} castShadow>
                  <coneGeometry args={[w * 0.35, h * 0.55, 8]} />
                  <meshPhysicalMaterial color="#3f6b38" roughness={0.9} />
                </mesh>
                <mesh position={[0, h * 0.78, 0]} castShadow>
                  <coneGeometry args={[w * 0.25, h * 0.35, 8]} />
                  <meshPhysicalMaterial color="#4f7d42" roughness={0.9} />
                </mesh>
              </>
            ) : null}
            {el.kind === "lamp" ? (
              <>
                <mesh position={[0, h / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.04, 0.05, h, 8]} />
                  <meshPhysicalMaterial color="#3a3a38" metalness={0.6} roughness={0.35} />
                </mesh>
                <mesh position={[0, h, 0]}>
                  <sphereGeometry args={[0.12, 12, 10]} />
                  <meshPhysicalMaterial color="#ffe9c4" emissive="#ffcc88" emissiveIntensity={0.6} />
                </mesh>
                <pointLight position={[0, h, 0]} intensity={6} distance={8} color="#ffd7a0" />
              </>
            ) : null}
            {el.kind === "bench" ? (
              <>
                <mesh position={[0, 0.42, 0]} castShadow>
                  <boxGeometry args={[w, 0.06, d]} />
                  <meshPhysicalMaterial color="#6b4f32" />
                </mesh>
                <mesh position={[-w * 0.4, 0.21, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.42, d]} />
                  <meshPhysicalMaterial color="#4a3728" />
                </mesh>
                <mesh position={[w * 0.4, 0.21, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.42, d]} />
                  <meshPhysicalMaterial color="#4a3728" />
                </mesh>
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
