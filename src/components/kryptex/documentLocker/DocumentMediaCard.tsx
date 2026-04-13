import type { KeyboardEvent, SyntheticEvent } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Trash2 } from "lucide-react";

export type CardDoc = {
  id: string;
  name: string;
  sizeLabel: string;
};

type Props = {
  doc: CardDoc;
  width: number;
  height: number;
  thumbUrl?: string | null;
  isThumbLoading?: boolean;
  onImageLoad?: (ev: SyntheticEvent<HTMLImageElement>) => void;
  onDelete: () => void;
  onDownload: () => void;
  onPreview: () => void;
  deletePending: boolean;
  hoveredId: string | null;
  onHoverChange: (id: string | null) => void;
};

export function DocumentMediaCard({
  doc,
  width,
  height,
  thumbUrl,
  isThumbLoading,
  onImageLoad,
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
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-black/5 bg-[#f7f7f7] shadow-sm"
      onMouseEnter={() => onHoverChange(doc.id)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onHoverChange(doc.id)}
      onBlur={() => onHoverChange(null)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deletePending}
        className="absolute right-2 top-2 z-20 rounded-full bg-white/90 p-1.5 text-black/35 shadow-sm backdrop-blur-sm transition hover:text-[#FF3300] disabled:opacity-40"
        aria-label="Remove"
      >
        {deletePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      <div
        role="button"
        tabIndex={0}
        className="relative block h-full w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-black/20"
        onClick={onPreview}
        onKeyDown={handlePreviewKeyDown}
      >
        {isThumbLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-black/[0.03]">
            <Loader2 className="h-6 w-6 animate-spin text-black/25" />
          </div>
        ) : thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={onImageLoad}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-black/[0.06] to-black/[0.02]" />
        )}

        <motion.div
          className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent"
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
          {!active && (
            <div className="pointer-events-none min-w-0">
              <p className="truncate text-[12px] font-bold text-white drop-shadow-sm">{doc.name}</p>
              <p className="text-[10px] font-medium text-white/75">{doc.sizeLabel}</p>
            </div>
          )}
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
