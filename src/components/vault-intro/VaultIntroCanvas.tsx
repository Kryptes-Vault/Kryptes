import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { useReducedMotion } from "./useReducedMotion";

/* ── Emerald palette ─────────────────────────────────────────────── */
const EMERALD = new THREE.Color("#10B981");
const EMERALD_GLOW = new THREE.Color("#34D399");

/* ── Timing constants (seconds) ──────────────────────────────────── */
const ASSEMBLY_END = 2.5;
const PULSE_END = 3.2;
const DISSOLVE_END = 4.2;
const PARTICLE_COUNT = 400;
const FIELD_COUNT = 180;
const SCATTER_RADIUS = 12;

/* ── Easing ──────────────────────────────────────────────────────── */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

interface VaultIntroCanvasProps {
  onAnimationComplete?: () => void;
}

/**
 * Imperative Three.js 3D vault intro — no react-three-fiber dependency.
 * Uses a raw canvas ref + useEffect for full GPU control without
 * React reconciler version conflicts.
 */
export default function VaultIntroCanvas({
  onAnimationComplete,
}: VaultIntroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const disposeRef = useRef<(() => void) | null>(null);

  const handleComplete = useCallback(() => {
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Immediately complete if reduced motion ─────────────────────
    if (reducedMotion) {
      handleComplete();
      return;
    }

    // ── Renderer setup ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);

    // ── Mouse tracking ─────────────────────────────────────────────
    const mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // ── Resize handler ─────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ══════════════════════════════════════════════════════════════
    //  VAULT SHIELD — particle assembly
    // ══════════════════════════════════════════════════════════════

    // Build target positions from icosahedron
    const ico = new THREE.IcosahedronGeometry(2.8, 1);
    const verts = ico.attributes.position;
    const idx = ico.index!;
    const targets: THREE.Vector3[] = [];
    const edgeSet = new Set<string>();

    for (let i = 0; i < verts.count; i++) {
      targets.push(new THREE.Vector3(verts.getX(i), verts.getY(i), verts.getZ(i)));
    }
    
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const tri = [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)];
        for (let e = 0; e < 3; e++) {
          const a = tri[e], b = tri[(e + 1) % 3];
          const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            targets.push(new THREE.Vector3(
              (verts.getX(a) + verts.getX(b)) / 2,
              (verts.getY(a) + verts.getY(b)) / 2,
              (verts.getZ(a) + verts.getZ(b)) / 2
            ));
          }
        }
      }
    } else {
      // Non-indexed: every 3 vertices is a triangle
      for (let i = 0; i < verts.count; i += 3) {
        for (let e = 0; e < 3; e++) {
          const a = i + e;
          const b = i + ((e + 1) % 3);
          targets.push(new THREE.Vector3(
            (verts.getX(a) + verts.getX(b)) / 2,
            (verts.getY(a) + verts.getY(b)) / 2,
            (verts.getZ(a) + verts.getZ(b)) / 2
          ));
        }
      }
    }
    // Pad to PARTICLE_COUNT
    while (targets.length < PARTICLE_COUNT) {
      const a = targets[Math.floor(Math.random() * targets.length)];
      const b = targets[Math.floor(Math.random() * targets.length)];
      targets.push(new THREE.Vector3().lerpVectors(a, b, Math.random()));
    }

    // Scatter + target arrays
    const scatterPos = new Float32Array(PARTICLE_COUNT * 3);
    const targetPos = new Float32Array(PARTICLE_COUNT * 3);
    const currentPos = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SCATTER_RADIUS * (0.5 + Math.random() * 0.5);
      scatterPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPos[i * 3 + 2] = r * Math.cos(phi);

      const ti = i % targets.length;
      targetPos[i * 3] = targets[ti].x;
      targetPos[i * 3 + 1] = targets[ti].y;
      targetPos[i * 3 + 2] = targets[ti].z;

      currentPos[i * 3] = scatterPos[i * 3];
      currentPos[i * 3 + 1] = scatterPos[i * 3 + 1];
      currentPos[i * 3 + 2] = scatterPos[i * 3 + 2];

      scales[i] = 0.4 + Math.random() * 0.6;
      phases[i] = Math.random();
    }

    // Shield particle material (custom shader)
    const shieldMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uSize: { value: 50 },
        uColor: { value: EMERALD.clone() },
        uOpacity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uSize;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + aPhase * 6.28);
          gl_PointSize = uSize * aScale * pulse * uPixelRatio * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vAlpha = smoothstep(40.0, 2.0, -mv.z) * pulse;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float s = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5);
          gl_FragColor = vec4(uColor, s * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const shieldGeo = new THREE.BufferGeometry();
    shieldGeo.setAttribute("position", new THREE.BufferAttribute(currentPos, 3));
    shieldGeo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    shieldGeo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const shieldPoints = new THREE.Points(shieldGeo, shieldMat);

    // Wireframe
    const edges = new THREE.EdgesGeometry(ico);
    const wireMat = new THREE.LineBasicMaterial({
      color: EMERALD,
      transparent: true,
      opacity: 0,
    });
    const wireframe = new THREE.LineSegments(edges, wireMat);

    // Pulse ring
    const pulseMat = new THREE.MeshBasicMaterial({
      color: EMERALD_GLOW,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.0, 64), pulseMat);
    pulseRing.visible = false;

    const shieldGroup = new THREE.Group();
    shieldGroup.add(shieldPoints, wireframe, pulseRing);
    scene.add(shieldGroup);

    ico.dispose(); // free source geometry

    // ══════════════════════════════════════════════════════════════
    //  BACKGROUND PARTICLE FIELD — persistent ambient particles
    // ══════════════════════════════════════════════════════════════

    const fieldPositions = new Float32Array(FIELD_COUNT * 3);
    const fieldScales = new Float32Array(FIELD_COUNT);
    const fieldPhases = new Float32Array(FIELD_COUNT);

    for (let i = 0; i < FIELD_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 25;
      fieldPositions[i * 3] = Math.cos(angle) * radius;
      fieldPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      fieldPositions[i * 3 + 2] = Math.sin(angle) * radius - 10;
      fieldScales[i] = 0.3 + Math.random() * 0.7;
      fieldPhases[i] = Math.random();
    }

    const fieldMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: dpr },
        uSize: { value: 30 },
        uColor: { value: new THREE.Color("#10B981") },
        uOpacity: { value: 0.7 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uSize;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.3 + aPhase * 6.28) * 0.5;
          p.y += cos(uTime * 0.2 + aPhase * 3.14) * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float pulse = 0.7 + 0.3 * sin(uTime * 1.2 + aPhase * 6.28);
          gl_PointSize = uSize * aScale * pulse * uPixelRatio * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vAlpha = smoothstep(60.0, 5.0, -mv.z) * pulse;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float s = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5);
          gl_FragColor = vec4(uColor, s * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const fieldGeo = new THREE.BufferGeometry();
    fieldGeo.setAttribute("position", new THREE.BufferAttribute(fieldPositions, 3));
    fieldGeo.setAttribute("aScale", new THREE.BufferAttribute(fieldScales, 1));
    fieldGeo.setAttribute("aPhase", new THREE.BufferAttribute(fieldPhases, 1));
    const fieldPoints = new THREE.Points(fieldGeo, fieldMat);

    const fieldGroup = new THREE.Group();
    fieldGroup.add(fieldPoints);
    scene.add(fieldGroup);

    // ══════════════════════════════════════════════════════════════
    //  ANIMATION LOOP
    // ══════════════════════════════════════════════════════════════

    const clock = new THREE.Clock();
    let completeFired = false;
    let animFrame = 0;

    const animate = () => {
      animFrame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Mouse parallax (smooth LERP)
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.03;
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.03;

      // ── Shield animation ─────────────────────────────────────────
      shieldMat.uniforms.uTime.value = t;

      const posArr = shieldGeo.attributes.position.array as Float32Array;

      if (t < ASSEMBLY_END) {
        // Phase 1+2: scatter → assemble
        const progress = easeInOutQuart(Math.min(1, t / ASSEMBLY_END));
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          posArr[i * 3] = THREE.MathUtils.lerp(scatterPos[i * 3], targetPos[i * 3], progress);
          posArr[i * 3 + 1] = THREE.MathUtils.lerp(scatterPos[i * 3 + 1], targetPos[i * 3 + 1], progress);
          posArr[i * 3 + 2] = THREE.MathUtils.lerp(scatterPos[i * 3 + 2], targetPos[i * 3 + 2], progress);
        }
        shieldGeo.attributes.position.needsUpdate = true;

        // Wireframe fade-in in last 30%
        wireMat.opacity = Math.max(0, (progress - 0.7) / 0.3) * 0.6;
        shieldGroup.rotation.y = t * 0.3;
      } else if (t < PULSE_END) {
        // Phase 3: pulse
        const pp = (t - ASSEMBLY_END) / (PULSE_END - ASSEMBLY_END);
        pulseRing.visible = true;
        pulseRing.scale.setScalar(1 + easeOutCubic(pp) * 4);
        pulseMat.opacity = (1 - pp) * 0.8;
        shieldMat.uniforms.uColor.value.lerpColors(EMERALD, EMERALD_GLOW, Math.sin(pp * Math.PI));
        shieldGroup.rotation.y = ASSEMBLY_END * 0.3 + (t - ASSEMBLY_END) * 0.1;
      } else if (t < DISSOLVE_END) {
        // Phase 4: dissolve
        const dp = (t - PULSE_END) / (DISSOLVE_END - PULSE_END);
        const eased = easeOutCubic(dp);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          posArr[i * 3] = targetPos[i * 3] * (1 + eased * 3);
          posArr[i * 3 + 1] = targetPos[i * 3 + 1] * (1 + eased * 3);
          posArr[i * 3 + 2] = targetPos[i * 3 + 2] * (1 + eased * 2);
        }
        shieldGeo.attributes.position.needsUpdate = true;
        shieldMat.uniforms.uOpacity.value = 1 - eased;
        wireMat.opacity = 0.6 * (1 - eased);
        pulseRing.visible = false;
        shieldGroup.scale.setScalar(1 - eased * 0.3);
        shieldGroup.rotation.y =
          ASSEMBLY_END * 0.3 + (PULSE_END - ASSEMBLY_END) * 0.1 + (t - PULSE_END) * 0.05;
      } else if (!completeFired) {
        completeFired = true;
        shieldGroup.visible = false;
        handleComplete();
      }

      // ── Field animation ──────────────────────────────────────────
      fieldMat.uniforms.uTime.value = t;
      const scrollFade = Math.max(0, 1 - window.scrollY / window.innerHeight);
      fieldMat.uniforms.uOpacity.value = 0.7 * scrollFade;

      // Parallax on field
      fieldGroup.rotation.y = THREE.MathUtils.lerp(
        fieldGroup.rotation.y,
        mouse.smoothX * 0.15,
        0.05
      );
      fieldGroup.rotation.x = THREE.MathUtils.lerp(
        fieldGroup.rotation.x,
        mouse.smoothY * 0.08,
        0.05
      );

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ────────────────────────────────────────────────────
    const dispose = () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      shieldGeo.dispose();
      shieldMat.dispose();
      edges.dispose();
      wireMat.dispose();
      pulseMat.dispose();
      pulseRing.geometry.dispose();
      fieldGeo.dispose();
      fieldMat.dispose();
      renderer.dispose();
    };
    disposeRef.current = dispose;

    return dispose;
  }, [reducedMotion, handleComplete]);

  // Skip rendering entirely for reduced motion
  if (reducedMotion) {
    // Fire completion immediately (handled in useEffect above)
    return null;
  }

  return (
    <motion.div
      id="vault-intro-canvas"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
        willChange: "transform",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      />
    </motion.div>
  );
}
