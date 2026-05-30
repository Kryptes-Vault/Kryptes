# Jitter-Free View Transitions and Unified Navigation Layout

## Problem Statement

Historically, moving between key dashboard sections (Document Locker, Authenticator, Finance Tracker) caused noticeable visual glitches:
1. **Double Scrollbars**: Each page view had its own internal sidebar or viewport container, causing multiple nested scroll contexts and double scrollbars to appear.
2. **Cumulative Layout Shift (CLS)**: As the old view unmounted and the new view mounted, the browser layout snapped abruptly, creating vertical jumps and shifts in page elements.

To solve this, we **consolidated all sidebars globally** and implemented **absolute container bounding** for all transitions.

---

## Technical Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │              Dashboard Sidebar               │
                  │  (Handles active navigation globally)         │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │        Relative Tab Content Viewport         │
                  │  (Overflow hidden, sets a stable structure)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      AnimatePresence (Wait Transition)       │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Absolute Wrapper: `absolute inset-0`   │
                  │  (Allows smooth overlay fade without jumps)  │
                  └──────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Global Navigation Unification (`Dashboard.tsx`)
All sidebars were removed from inside [DocumentLocker.tsx](file:///c:/VS/Kryptes/src/components/kryptex/DocumentLocker.tsx) and others. Sidebars are now managed exclusively in the main [Dashboard.tsx](file:///c:/VS/Kryptes/src/pages/Dashboard.tsx) container.

### 2. Absolute Inset Bounding for Transitions
We wrapped target screens in an absolute viewport frame, ensuring that mounting and unmounting heights do not affect the outer layout structure.

```tsx
// src/pages/Dashboard.tsx
<div className="relative flex-1 overflow-hidden">
  <AnimatePresence mode="wait">
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 overflow-y-auto px-6 py-8"
    >
      {renderActiveView()}
    </motion.div>
  </AnimatePresence>
</div>
```

* **`relative flex-1 overflow-hidden`**: Sets a permanent height boundary on the flex container, stopping parent components from expanding or collapsing.
* **`absolute inset-0 overflow-y-auto`**: Sets up a localized scroll container. During a tab transition, the old tab exits and the new tab slides in without affecting the page scroll position or container bounds.
* **`blur(4px) -> blur(0px)`**: An elegant transition that matches high-end desktop web applications.

---

## 🛠️ Verification Checklist

1. **Scroll Continuity Check**:
   * Navigate to a tab, scroll down, and switch tabs.
   * **Expected Result**: The new tab loads cleanly at the top of its viewport, and there are no screen jumps.
2. **Animation Smoke Test**:
   * Switch between Document Locker, Authenticator, and Finance.
   * **Expected Result**: Outgoing components fade out smoothly, and new components slide up fluidly.
