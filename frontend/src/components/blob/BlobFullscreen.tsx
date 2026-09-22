"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { BlobVariant } from "./shaders";

function createGeometry(v: BlobVariant): THREE.BufferGeometry {
  if (v.geometry === "sphere") return new THREE.SphereGeometry(1.2, v.detail, v.detail);
  return new THREE.IcosahedronGeometry(1.2, v.detail);
}

export default function BlobFullscreen({
  variant,
  onClose,
}: {
  variant: BlobVariant;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = variant.cameraZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const geometry = createGeometry(variant);
    const material = new THREE.ShaderMaterial({
      vertexShader: variant.vertexShader,
      fragmentShader: variant.fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: variant.renderAs === "mesh",
      blending: variant.blending === "additive" ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const obj = variant.renderAs === "points"
      ? new THREE.Points(geometry, material)
      : new THREE.Mesh(geometry, material);
    scene.add(obj);

    const clock = new THREE.Clock();

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;
      obj.rotation.y = t * variant.rotationSpeed;
      obj.rotation.z = Math.sin(t * 0.1) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div className="fixed inset-0 z-[999] bg-[#030008]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
        <div>
          <h2 className="text-2xl font-light text-white sm:text-3xl">{variant.name}</h2>
          <p className="text-sm text-muted-foreground">{variant.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-white/10"
        >
          ESC
        </button>
      </div>
    </div>
  );
}
