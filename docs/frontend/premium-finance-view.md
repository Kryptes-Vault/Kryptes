# Premium zero-knowledge Finance Tracker View

## Overview

The Vault Finance dashboard has been upgraded into a premium, analytical financial signal visualizer (`src/components/kryptex/FinanceView.tsx`). The interface leverages zero-knowledge principles to process, map, and graph transaction data safely client-side.

---

## 🎨 Visual Specifications & Tokens

The interface is built to feel extremely high-end, utilizing vibrant HSL-tailored colors, subtle light/dark mode contrasts, and rich micro-animations.

### 1. Typography Hierarchy
* **Primary Headers**: Rendered in heavy Outfit black (`font-black tracking-tighter text-black`) to anchor page sections.
* **Secondary Metadata**: Formatted in bold Inter uppercase letters (`font-bold text-[10px] uppercase tracking-widest text-gray-400`) to maximize legibility.

### 2. Color Palette & Chart Integration
To create a clean interface, we moved away from generic chart styles in favor of a cohesive, modern palette:
* **Primary Brand Accent**: Brand Orange (`#FF3B13` / `#f97316`)
* **Supporting Accents**: Emerald Green (`#34d399` / `#10b981`), Indigo Violet (`#818cf8`), and Amber Yellow (`#fbbf24`)
* **Grid Overlays**: Ultra-thin black lines (`rgba(0,0,0,0.04)`) to keep focus on the data trends.

---

## Technical Component Details

### 1. Zero-Knowledge Uploader Area
Features a drag-and-drop zone with animated feedback. PDF statements are processed fully client-side:

```tsx
<div
  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={handleDrop}
  className={`group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-8 transition-all duration-500 ${
    isDragging
      ? "border-orange-500 bg-orange-50/50 shadow-[0_0_42px_rgba(249,115,22,0.15)]"
      : "border-gray-200 bg-gray-50/50 hover:border-orange-500/50 hover:bg-orange-50/10"
  }`}
>
  {/* Drag feedback & icon states */}
</div>
```

### 2. Glassmorphic Recharts Tooltip
Custom tooltips provide smooth overlay details without breaking the minimalist aesthetic:

```tsx
const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3 py-2 text-xs text-gray-900 shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-bold text-gray-500">{label}</p>}
      {payload.map((item) => (
        <p key={item.dataKey || item.name} style={{ color: item.color }} className="font-medium">
          {item.name || item.dataKey}: {item.value}
        </p>
      ))}
    </div>
  );
};
```

---

## 🛠️ Verification Checklist

1. **Uploader Flow**:
   * Drag a PDF statement into the dragzone.
   * **Expected Result**: Drag state lights up in orange. Releasing files triggers a clean `Sparkles` loading spinner before displaying financial analytics and insights.
2. **Chart Responsiveness**:
   * Resize the window from desktop to tablet scale.
   * **Expected Result**: Charts adjust dynamically via the `<ResponsiveContainer>` wrapper without clipping.
