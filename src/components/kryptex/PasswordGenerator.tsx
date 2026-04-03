/** Password Generator — configurable entropy, inline sub-component. */
import { useState, useCallback } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import { generateSecurePassword } from "@/lib/passwordVaultService";

type Props = {
  onGenerated: (password: string) => void;
};

export function PasswordGenerator({ onGenerated }: Props) {
  const [length, setLength] = useState(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const pw = generateSecurePassword({ length, uppercase, lowercase, numbers, symbols });
    setPreview(pw);
    onGenerated(pw);
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols, onGenerated]);

  const entropyBits = Math.floor(
    length *
      Math.log2(
        (lowercase ? 26 : 0) +
          (uppercase ? 26 : 0) +
          (numbers ? 10 : 0) +
          (symbols ? 27 : 0) || 1
      )
  );

  const strength =
    entropyBits >= 80 ? "Strong" : entropyBits >= 50 ? "Good" : "Weak";
  const strengthColor =
    entropyBits >= 80
      ? "text-green-600 bg-green-50 border-green-200"
      : entropyBits >= 50
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-500 bg-red-50 border-red-200";

  async function copyPreview() {
    if (!preview) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-black/5 bg-[#fafafa] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF3B13]">
          Password Generator
        </p>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${strengthColor}`}
        >
          {strength} · {entropyBits} bits
        </span>
      </div>

      {/* Length slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-black/40 uppercase tracking-wider">
            Length
          </label>
          <span className="text-xs font-bold text-black tabular-nums">{length}</span>
        </div>
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-1.5 bg-black/10 rounded-full appearance-none cursor-pointer accent-[#FF3B13]"
        />
      </div>

      {/* Character toggles */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "A-Z", state: uppercase, set: setUppercase },
          { label: "a-z", state: lowercase, set: setLowercase },
          { label: "0-9", state: numbers, set: setNumbers },
          { label: "!@#$", state: symbols, set: setSymbols },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => opt.set(!opt.state)}
            className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
              opt.state
                ? "bg-[#FF3B13]/5 border-[#FF3B13]/20 text-[#FF3B13]"
                : "bg-white border-black/5 text-black/25 hover:border-black/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Preview + actions */}
      {preview && (
        <div className="relative bg-white border border-black/5 rounded-xl p-3">
          <code className="text-[10px] font-mono text-black/60 break-all leading-relaxed block pr-16">
            {preview}
          </code>
          <button
            type="button"
            onClick={() => void copyPreview()}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#fafafa] border border-black/5 flex items-center justify-center text-black/30 hover:text-[#FF3B13] hover:border-[#FF3B13]/20 transition-all"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        className="w-full h-10 rounded-xl border border-[#FF3B13]/20 text-[10px] font-bold uppercase tracking-widest text-[#FF3B13] hover:bg-[#FF3B13] hover:text-white transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Generate Password
      </button>
    </div>
  );
}
