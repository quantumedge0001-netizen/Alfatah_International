"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

// A native <select>'s open direction is decided by the browser based on
// viewport space, which can pop the list upward and look broken when the
// field sits low on the page. This one always drops down, and is styled to
// match the app's navy/cyan theme instead of the OS default.
export default function Select({
  value,
  onChange,
  options,
  className = "input",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${className} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected ? selected.label : "Select…"}
        </span>
        <ChevronDown size={15} className={`text-[#072F5F]/60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-lg border border-[#072F5F]/15 bg-white shadow-lg shadow-[#072F5F]/10">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-[#072F5F]/[0.06] ${
                opt.value === value ? "bg-[#072F5F]/[0.05] font-medium text-[#072F5F]" : "text-ink"
              }`}
            >
              {opt.label}
              {opt.value === value && <Check size={14} className="text-[#072F5F]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
