"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { simplexNoise } from "@/components/blob/shaders";

export default function WhisperPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicActive(true);
      setError(null);
    } catch {
      setError("Microphone access denied");
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.z = 4.0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.2, 52);

    const vertexShader = `
      ${simplexNoise}
      varying vec3 vColor;
      uniform float uTime;
      uniform float uAmplitude;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      void main(){
        // breathing scales with voice amplitude
        float breath = sin(uTime * 1.5) * 0.03 + 1.0 + uAmplitude * 0.15;

        // noise displacement — amplitude drives intensity
        float noiseAmp = 0.12 + uAmplitude * 0.35;
        float noiseFreq = 1.2 + uMid * 0.8;
        vec3 np = vec3(position * noiseFreq + vec3(uTime * 0.3, -uTime * 0.2, 0.0));
        float d = snoise(np) * noiseAmp + abs(snoise(np * 2.5)) * noiseAmp * 0.3;

        // bass drives low-frequency bulges
        float bassBulge = snoise(vec3(position * 0.6 + uTime * 0.2)) * uBass * 0.2;
        d += bassBulge;

        // treble drives high-frequency spikes
        float trebleSpike = abs(snoise(vec3(position * 5.0 + uTime * 2.0))) * uTreble * 0.12;
        d += trebleSpike;

        vec3 newPos = (position * breath) + (normal * d);

        // color shifts with voice
        vec3 cSilent = vec3(0.08, 0.02, 0.18);
        vec3 cLow = vec3(0.3, 0.05, 0.6);
        vec3 cMid = vec3(0.6, 0.1, 0.9);
        vec3 cLoud = vec3(1.0, 0.3, 0.9);
        vec3 cPeak = vec3(1.0, 0.7, 1.0);

        float vol = uAmplitude;
        vec3 gc = mix(cSilent, cLow, smoothstep(0.0, 0.15, vol));
        gc = mix(gc, cMid, smoothstep(0.15, 0.35, vol));
        gc = mix(gc, cLoud, smoothstep(0.35, 0.6, vol));
        gc = mix(gc, cPeak, smoothstep(0.6, 0.9, vol));

        // highlight shimmer
        float hl = smoothstep(0.2, 0.6, snoise(np * 2.0 + uTime));
        vColor = gc + vec3(0.3, 0.15, 0.5) * hl * (0.4 + uAmplitude * 0.6);

        // treble adds bright white specks
        vColor += vec3(1.0, 0.95, 1.0) * pow(trebleSpike / max(uTreble * 0.12, 0.01), 3.0) * uTreble * 0.3;

        vec4 mvp = modelViewMatrix * vec4(newPos, 1.0);
        gl_Position = projectionMatrix * mvp;
        float baseSize = 3.5 + d * 14.0 + uAmplitude * 4.0;
        gl_PointSize = baseSize * (10.0 / -mvp.z);
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      void main(){
        vec2 c = 2.0 * gl_PointCoord - 1.0;
        float dist = dot(c, c);
        if (dist > 1.0) discard;
        float a = 1.0 - smoothstep(0.3, 1.0, dist);
        gl_FragColor = vec4(vColor, a * 0.85);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const blob = new THREE.Points(geometry, material);
    scene.add(blob);

    const clock = new THREE.Clock();
    const timeBuf = new Uint8Array(1024);
    const freqBuf = new Uint8Array(256);
    let smAmp = 0;
    let smBass = 0;
    let smMid = 0;
    let smTreble = 0;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const analyser = analyserRef.current;

      let amplitude = 0;
      let bass = 0;
      let mid = 0;
      let treble = 0;

      if (analyser) {
        // RMS amplitude
        analyser.getByteTimeDomainData(timeBuf);
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          const v = (timeBuf[i] - 128) / 128;
          sum += v * v;
        }
        amplitude = Math.min(1, Math.sqrt(sum / timeBuf.length) * 3.0);

        // frequency bands
        analyser.getByteFrequencyData(freqBuf);
        const binCount = freqBuf.length;
        let bassSum = 0, midSum = 0, trebleSum = 0;
        const bassEnd = Math.floor(binCount * 0.15);
        const midEnd = Math.floor(binCount * 0.5);
        for (let i = 0; i < binCount; i++) {
          const v = freqBuf[i] / 255;
          if (i < bassEnd) bassSum += v;
          else if (i < midEnd) midSum += v;
          else trebleSum += v;
        }
        bass = bassSum / bassEnd;
        mid = midSum / (midEnd - bassEnd);
        treble = trebleSum / (binCount - midEnd);
      } else {
        // idle animation when mic is off
        amplitude = 0.08 + Math.sin(t * 0.8) * 0.04;
      }

      smAmp += (amplitude - smAmp) * 0.2;
      smBass += (bass - smBass) * 0.18;
      smMid += (mid - smMid) * 0.22;
      smTreble += (treble - smTreble) * 0.25;

      material.uniforms.uTime.value = t;
      material.uniforms.uAmplitude.value = smAmp;
      material.uniforms.uBass.value = smBass;
      material.uniforms.uMid.value = smMid;
      material.uniforms.uTreble.value = smTreble;

      blob.rotation.y = t * 0.08 + smAmp * 0.5;
      blob.rotation.z = Math.sin(t * 0.1) * 0.05;

      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#030008]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Top text */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center pt-[6vh] text-center">
        <h1
          className="text-3xl font-light tracking-wide text-[#fce7f3] md:text-5xl"
          style={{ animation: "pulse-text 3s infinite ease-in-out" }}
        >
          {micActive ? "I'm listening..." : "Psst... Speak up"}
        </h1>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[5vh]">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {!micActive ? (
          <button
            type="button"
            onClick={startMic}
            className="pointer-events-auto rounded-full bg-gradient-to-r from-[#b79fff] to-[#ab8eff] px-8 py-3 text-sm font-bold text-[#0b0e14] shadow-[0_0_30px_rgba(183,159,255,0.4)] transition-all hover:shadow-[0_0_50px_rgba(183,159,255,0.6)] active:scale-95"
          >
            Enable Microphone
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <span className="text-sm text-white/50">Mic active — speak to see it react</span>
          </div>
        )}

        <a
          href="/dashboard/blob"
          className="pointer-events-auto text-xs text-white/30 transition hover:text-white/60"
        >
          ← Back to gallery
        </a>
      </div>

      <style>{`
        @keyframes pulse-text {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; text-shadow: 0 0 20px rgba(183, 159, 255, 0.6); }
        }
      `}</style>
    </div>
  );
}
