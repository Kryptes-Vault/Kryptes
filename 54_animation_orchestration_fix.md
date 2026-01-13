# Protocol 54 — Animation Orchestration Fix

> **Status**: ACTIVE  
> **Author**: Kryptex Engineering  
> **Created**: 2026-04-07  
> **Affects**: `src/pages/Index.tsx`, `src/components/vault-intro/*`

---

## Problem Statement

When the Kryptex landing page loads, the 3D Vault Intro animation and the main Hero Section
were rendering simultaneously — producing a **Flash of Unstyled Content (FOUC)** where both
layers appeared overlapping or flickering before the intro shrunk away.

### Root Causes

1. **No state gate** — the Hero Section was always mounted in the DOM, visible behind the
   3D canvas from frame 0.
2. **Z-index collision** — the intro canvas sat at `z-1` (behind content) instead of
   overlaying it at a high z-index.
3. **No unmount lifecycle** — the 3D intro never left the DOM; it just became invisible,
   wasting GPU resources and creating stacking-context conflicts.

---

## Solution: React State + AnimatePresence

### Architecture

```
┌──────────────────────────────────────┐
│  Index.tsx                           │
│                                      │
│  state: isIntroComplete = false      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ <AnimatePresence>              │  │
│  │   {!isIntroComplete &&         │  │
│  │     <VaultIntroCanvas          │  │
│  │       onAnimationComplete={    │  │
│  │         () => set(true)        │  │
│  │       }                        │  │
│  │     />                         │  │
│  │   }                            │  │
│  │ </AnimatePresence>             │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ <AnimatePresence>              │  │
│  │   {isIntroComplete &&          │  │
│  │     <motion.main ...>          │  │
│  │       <Hero />                 │  │
│  │       <ProblemSection />       │  │
│  │     </motion.main>             │  │
│  │   }                            │  │
│  │ </AnimatePresence>             │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Key Decisions

#### 1. State-Based Gating (`isIntroComplete`)

```tsx
const [isIntroComplete, setIsIntroComplete] = useState(false);

const handleAnimationComplete = useCallback(() => {
  setIsIntroComplete(true);
}, []);
```

- The Hero Section is **conditionally unmounted** (not just `opacity: 0`).
- This prevents layout shift — there is literally no hero DOM to compete with the intro.

#### 2. AnimatePresence for Smooth Crossfade

The intro is wrapped in `<AnimatePresence>`:

```tsx
<AnimatePresence>
  {!isIntroComplete && (
    <VaultIntroCanvas onAnimationComplete={handleAnimationComplete} />
  )}
</AnimatePresence>
```

When `isIntroComplete` flips to `true`:
1. Framer Motion intercepts the unmount.
2. The `exit` animation on `VaultIntroCanvas` plays (`opacity: 0` over 0.6s).
3. Only after the exit completes does React remove the DOM node.
4. The Hero Section's `<AnimatePresence>` then mounts and plays its entrance.

#### 3. Z-Index Layering

```
z-50  VaultIntroCanvas (fixed, inset-0, pointer-events-none)
z-10  Main content (relative, normal flow)
z-0   Background grid (fixed, pointer-events-none)
```

The intro sits at `z-50` as a **true fullscreen overlay**. Even during the brief crossfade
window, it visually covers the hero content completely.

#### 4. Staggered Hero Reveal

Once the intro unmounts, hero elements enter with staggered delays:

```tsx
const heroReveal = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};
```

| Element          | custom(i) | Delay  |
|------------------|-----------|--------|
| "ZERO KNOWLEDGE" | 0         | 0ms    |
| ACCESS VAULT btn | 1         | 150ms  |
| "DIGITAL ECOSYS" | 2         | 300ms  |
| Protocol tagline | 3         | 450ms  |

---

## Three.js Integration (Imperative, No R3F)

### Why Not `@react-three/fiber`?

`react-reconciler@0.27.0` (required by `@react-three/fiber@8.x`) has an internal
incompatibility with React 18.3's restructured `ReactSharedInternals`. This causes a fatal
crash: `Cannot read properties of undefined (reading 'S')` at module evaluation time.

### Imperative Pattern

Instead of R3F's `<Canvas>`, we use raw Three.js attached to a `<canvas>` ref:

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

  // ... build geometry, materials, animation loop ...

  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();

  return () => { /* dispose everything */ };
}, []);
```

**Benefits**:
- Zero reconciler dependency — works with any React version.
- Single `useEffect` manages the entire lifecycle (mount → animate → dispose).
- All GPU resources explicitly disposed on unmount (no memory leaks).

---

## Accessibility

- `prefers-reduced-motion: reduce` → the 3D canvas is hidden entirely (CSS media query)
  and the `useReducedMotion` hook fires `onAnimationComplete` immediately, skipping
  straight to the hero section.

---

## Performance Considerations

| Technique                    | Purpose                                    |
|-----------------------------|--------------------------------------------|
| `React.lazy()` import       | Three.js bundle never blocks initial paint |
| `dpr` capped at 1.5         | Prevents retina overdraw                   |
| `antialias: false`          | ~30% fill rate savings                     |
| `alpha: true`               | Composites over CSS, no clear pass         |
| `Suspense` fallback         | Shows pulsing dot during chunk download    |
| Explicit `dispose()` calls  | Frees all GPU memory on unmount            |
| `will-change: transform`    | Promotes canvas to compositor layer        |
| Conditional unmount          | Hero DOM doesn't exist during intro        |
