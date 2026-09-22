"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BlobVariant } from "./shaders";

function createGeometry(v: BlobVariant): THREE.BufferGeometry {
  if (v.geometry === "sphere") return new THREE.SphereGeometry(1.2, v.detail, v.detail);
  return new THREE.IcosahedronGeometry(1.2, v.detail);
}

export default function BlobCard({ variant }: { variant: BlobVariant }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = variant.cameraZ;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
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

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#050510] transition-all hover:border-white/[0.12] hover:shadow-[0_0_40px_-12px_rgba(168,85,247,0.25)]">
      <div ref={containerRef} className="aspect-square w-full" />
      <div className="px-5 py-4">
        <h3 className="text-sm font-bold text-heading">{variant.name}</h3>
        <p className="text-xs text-muted-foreground">{variant.subtitle}</p>
      </div>
    </div>
  );
}
