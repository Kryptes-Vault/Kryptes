import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, LucideIcon, Trash2 } from "lucide-react";
import type { CardDoc } from "./DocumentMediaCard";

type Props = {
  doc: CardDoc;
  icon: LucideIcon;
  accent: string;
  bg: string;
  typeLabel: string;
  updatedLabel: string;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  deletePending: boolean;
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
};

/** Uniform non-image tiles (PDF, DOCX): fixed width, same row height as gallery. */
export function DocumentFixedCard({
  doc,
  icon: Icon,
  accent,
  bg,
  typeLabel,
  updatedLabel,
  onDelete,
  onDownload,
  onPreview,
  deletePending,
  hoveredId,
  onHoverChange,
}: Props) {
  const active = hoveredId === doc.id;

  function handlePreviewKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPreview();
    }
  }

  return (
    <motion.article
      layout
      className="group relative h-56 w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
      onMouseEnter={() => onHoverChange(doc.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deletePending}
        className="absolute right-2 top-2 z-20 rounded-full bg-white/95 p-1.5 text-black/35 shadow-sm transition hover:text-[#FF3300] disabled:opacity-40"
      >
        {deletePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      <div
        role="button"
        tabIndex={0}
        className="relative flex h-full w-full cursor-pointer flex-col outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        onClick={onPreview}
        onKeyDown={handlePreviewKeyDown}
      >
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${bg}`}>
          <Icon className={`h-14 w-14 ${accent}`} />
          <p className="mt-3 line-clamp-2 text-center text-[11px] font-bold leading-tight text-[#111]">{doc.name}</p>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-black/35">{updatedLabel}</p>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        />

        <motion.div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3"
          initial={false}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 6 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="pointer-events-none min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/90">{typeLabel}</p>
            <p className="text-[10px] text-white/75">{doc.sizeLabel}</p>
          </div>
          <button
            type="button"
            aria-label={`Download ${doc.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white py-2 text-[10px] font-bold uppercase tracking-widest text-black shadow-md transition hover:bg-white/95"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </motion.div>
      </div>
    </motion.article>
  );
}
