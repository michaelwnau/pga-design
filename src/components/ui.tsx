"use client";

import { useState, type ReactNode } from "react";

export function Panel({
  title,
  children,
  defaultOpen = true,
  right,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="mono text-[11px] font-medium tracking-[0.18em] text-text">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {right}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`text-text-faint transition-transform ${open ? "" : "-rotate-90"}`}
          >
            <path
              d="M2 4.5 L6 8 L10 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-md bg-panel-2 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`mono rounded-[4px] py-2 text-[11px] tracking-[0.12em] transition-colors ${
              active ? "bg-white text-black" : "text-text-dim hover:text-text"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <div className="py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-text-dim">{label}</span>
        <span className="mono text-[11px] text-text">
          {fmt ? fmt(value) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between py-2"
    >
      <span className="text-[12px] text-text-dim">{label}</span>
      <span
        className={`relative h-[18px] w-[32px] rounded-full transition-colors ${
          value ? "bg-white" : "bg-border-2"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-black transition-all ${
            value ? "left-[16px]" : "left-[2px] bg-text-dim"
          }`}
        />
      </span>
    </button>
  );
}

export function Button({
  children,
  onClick,
  variant = "solid",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "solid" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      className={`mono w-full rounded-md py-2.5 text-[11px] tracking-[0.14em] transition-colors ${
        variant === "solid"
          ? "bg-white text-black hover:bg-text-dim"
          : "border border-border-2 text-text-dim hover:border-text-dim hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
