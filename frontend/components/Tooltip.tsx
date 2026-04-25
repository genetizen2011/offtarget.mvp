"use client";

import { useState } from "react";

export type ScientificTerm = "pam" | "gc-content" | "off-target" | "grna";

const termDefinitions: Record<ScientificTerm, string> = {
  pam: "A protospacer-adjacent motif. For SpCas9, NGG is required next to the target sequence before Cas9 can bind and cut.",
  "gc-content": "The percentage of G and C bases in a sequence. Balanced GC content often supports guide stability without excessive non-specific binding.",
  "off-target": "Potential editing at genomic sites similar to the intended target, influenced by sequence similarity, PAM context, and guide properties.",
  grna: "A guide RNA contains the spacer sequence that directs Cas9 to a complementary genomic target.",
};

type TooltipProps = {
  label?: string;
  term?: ScientificTerm;
  children?: React.ReactNode;
};

export default function Tooltip({ label, term, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const content = children ?? (term ? termDefinitions[term] : "");

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
        aria-label={label ?? "Scientific term definition"}
      >
        ?
      </button>
      {isOpen ? (
        <span className="absolute left-1/2 top-6 z-20 w-60 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left text-xs font-normal leading-5 text-gray-600 shadow-lg">
          {content}
        </span>
      ) : null}
    </span>
  );
}
