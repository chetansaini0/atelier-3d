"use client";

import { useEffect, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import type { SceneDocument } from "@/types/scene";
import { collideWithWalls, groundHeightAt } from "@/scene/geometry";
import { useViewerStore } from "@/store/viewerStore";

const WALK = 1.45;
const RUN = 3.15;
const EYE = 1.7;
const RADIUS = 0.22;
const GRAVITY = 14;
const JUMP = 4.2;

export function FirstPersonController({ scene }: { scene: SceneDocument }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocityY = useRef(0);
  const grounded = useRef(true);
  const controls = useRef<ComponentRef<typeof PointerLockControls>>(null);
  const setPlayer = useViewerStore((s) => s.setPlayer);
  const setPointerLocked = useViewerStore((s) => s.setPointerLocked);
  const openDoorIds = useViewerStore((s) => s.openDoorIds);
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);

  useEffect(() => {
    camera.position.set(scene.spawn.x, scene.spawn.y, scene.spawn.z);
    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[e.code] = down;
      if (down && e.code === "Space") e.preventDefault();
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera, scene.spawn]);

  useFrame((_, dt) => {
    const locked = Boolean(controls.current?.isLocked);
    if (!locked) return;

    const speed = keys.current.ShiftLeft || keys.current.ShiftRight ? RUN : WALK;
    const forward = (keys.current.KeyW ? 1 : 0) + (keys.current.KeyS ? -1 : 0);
    const strafe = (keys.current.KeyD ? 1 : 0) + (keys.current.KeyA ? -1 : 0);

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

    let x = camera.position.x + (direction.x * forward + right.x * strafe) * speed * dt;
    let z = camera.position.z + (direction.z * forward + right.z * strafe) * speed * dt;

    const yHint = camera.position.y;
    const walls = scene.levels
      .filter((l) => yHint >= l.elevation - 0.4 && yHint <= l.elevation + l.height + 1.8)
      .flatMap((l) => l.walls);
    const collisionWalls = walls.length ? walls : (scene.levels.find((l) => l.id === visibleLevelId) ?? scene.levels[0]).walls;

    const collided = collideWithWalls({ x, z }, RADIUS, collisionWalls, openDoorIds);
    x = collided.x;
    z = collided.z;

    let ground = 0;
    for (const level of scene.levels) {
      const h = groundHeightAt(x, z, level.rooms, level.stairs, level.elevation);
      if (h <= yHint - EYE + 0.5) ground = Math.max(ground, h);
    }
    const desiredEye = ground + EYE;

    if (keys.current.Space && grounded.current) {
      velocityY.current = JUMP;
      grounded.current = false;
    }

    velocityY.current -= GRAVITY * dt;
    let y = camera.position.y + velocityY.current * dt;
    if (y <= desiredEye) {
      y = desiredEye;
      velocityY.current = 0;
      grounded.current = true;
    }

    camera.position.set(x, y, z);
    setPlayer({ x, y, z }, camera.rotation.y);
  });

  return (
    <PointerLockControls
      ref={controls}
      onLock={() => setPointerLocked(true)}
      onUnlock={() => setPointerLocked(false)}
      domElement={gl.domElement}
    />
  );
}
