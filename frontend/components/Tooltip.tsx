"use client";

import { useState } from "react";

type TooltipProps = {
  label: string;
  children: React.ReactNode;
};

export default function Tooltip({ label, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-semibold text-gray-500 transition hover:border-blue-300 hover:text-blue-600"
        aria-label={label}
      >
        ?
      </button>
      {isOpen ? (
        <span className="absolute left-1/2 top-6 z-20 w-60 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal leading-5 text-gray-600 shadow-lg">
          {children}
        </span>
      ) : null}
    </span>
  );
}
