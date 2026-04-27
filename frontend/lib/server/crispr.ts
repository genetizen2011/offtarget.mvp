export type RiskLevel = "low" | "medium" | "high";
export type GuideStrand = "+" | "−";

export type Guide = {
  sequence: string;
  pam: string;
  position: number;
  strand: GuideStrand;
  gc_content: number;
  score: number;
  risk: RiskLevel;
  risk_reason: string;
  stability_flags: string[];
};

export type AnalyzeResponse = {
  guides: Guide[];
  best_guide: Guide | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeSequence(input: string) {
  const sequence = input
    .replace(/[^ATCGUatcgu]/g, "")
    .toUpperCase()
    .replace(/U/g, "T")
    .slice(0, 200);

  if (sequence.length < 20) {
    throw new ApiError(
      "Sequence too short — need at least 20 bp after removing non-DNA characters.",
      422,
    );
  }

  return sequence;
}

function gcContent(guide: string) {
  const gcCount = (guide.match(/[GC]/g) ?? []).length;
  return Math.round((gcCount / 20) * 100);
}

function hasHomopolymer(sequence: string) {
  return /(AAAA|TTTT|CCCC|GGGG)/.test(sequence);
}

function reverseComplement(sequence: string) {
  const complements: Record<string, string> = {
    A: "T",
    T: "A",
    C: "G",
    G: "C",
  };

  return sequence
    .split("")
    .reverse()
    .map((base) => complements[base] ?? base)
    .join("");
}

function firstPolyRunFlag(sequence: string) {
  const match = /(A{4,}|T{4,}|C{4,}|G{4,})/.exec(sequence);
  if (!match || match.index === undefined) return null;

  const run = match[0];
  const base = run[0];
  const start = match.index + 1;
  const end = match.index + run.length;

  if (base === "T") {
    return `Poly-T run detected at position ${start}-${end}; poly-T runs can cause Pol III premature termination.`;
  }

  if (base === "G") {
    return `Poly-G run detected at position ${start}-${end}; poly-G runs can form G-quadruplexes.`;
  }

  return `Poly-${base} run detected at position ${start}-${end}.`;
}

function lowComplexityFlag(sequence: string) {
  const counts = new Map<string, number>();

  for (const base of sequence) {
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }

  const dominant = [...counts.entries()].find(([, count]) => count / sequence.length > 0.7);
  if (!dominant) return null;

  const [base, count] = dominant;
  return `Low-complexity guide: ${base} makes up ${Math.round(
    (count / sequence.length) * 100,
  )}% of the spacer.`;
}

function repeatDensity(sequence: string) {
  const kmers = new Map<string, number>();

  for (let index = 0; index <= sequence.length - 4; index += 1) {
    const kmer = sequence.slice(index, index + 4);
    kmers.set(kmer, (kmers.get(kmer) ?? 0) + 1);
  }

  const duplicateCount = [...kmers.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
  return duplicateCount / Math.max(1, sequence.length - 3);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(1, score));
}

function efficiencyScore(guide: string, pam: string) {
  const gc = gcContent(guide) / 100;
  const gcBalance = Math.max(0, 1 - Math.abs(gc - 0.55) / 0.55);
  const terminalGcBonus = /[GC]$/.test(guide) ? 0.08 : 0;
  const pamBonus = pam === "GGG" ? 0.07 : 0.04;
  const homopolymerPenalty = hasHomopolymer(guide) ? 0.18 : 0;
  const repeatPenalty = Math.min(0.2, repeatDensity(guide) * 0.5);
  const rawScore =
    0.18 + gcBalance * 0.68 + terminalGcBonus + pamBonus - homopolymerPenalty - repeatPenalty;

  return Number(clampScore(rawScore).toFixed(2));
}

function classifyRisk(guide: string, score: number): [RiskLevel, string, string[]] {
  const gc = gcContent(guide);
  const density = repeatDensity(guide);
  const polyRunFlag = firstPolyRunFlag(guide);
  const lowComplexity = lowComplexityFlag(guide);
  const stabilityFlags = [polyRunFlag, lowComplexity].filter(
    (flag): flag is string => Boolean(flag),
  );

  if (polyRunFlag) {
    return ["high", polyRunFlag, stabilityFlags];
  }

  if (lowComplexity) {
    return ["medium", lowComplexity, stabilityFlags];
  }

  if (gc < 25 || gc > 75) {
    return [
      "high",
      "Extreme GC content can reduce specificity and binding quality.",
      stabilityFlags,
    ];
  }

  if (density > 0.22) {
    return [
      "medium",
      "Contains repeated short motifs that may appear elsewhere.",
      stabilityFlags,
    ];
  }

  if (gc < 40 || gc > 65) {
    return [
      "medium",
      "GC content is outside the preferred 40-65% design window.",
      stabilityFlags,
    ];
  }

  if (score < 0.55) {
    return [
      "medium",
      "Predicted efficiency is modest compared with other guides.",
      stabilityFlags,
    ];
  }

  return ["low", "Balanced GC content and no obvious repetitive sequence risk.", stabilityFlags];
}

export function analyzeCrisprSequence(input: string): AnalyzeResponse {
  const sequence = normalizeSequence(input);
  const guides: Guide[] = [];
  const pamPattern = /[ACGT]GG/g;

  for (const [scanSequence, strand] of [
    [sequence, "+"],
    [reverseComplement(sequence), "−"],
  ] as const) {
    for (const match of scanSequence.matchAll(pamPattern)) {
      const pamIndex = match.index ?? -1;
      if (pamIndex < 20) continue;

      const guideSequence = scanSequence.slice(pamIndex - 20, pamIndex);
      const pam = match[0];
      const score = efficiencyScore(guideSequence, pam);
      const [risk, riskReason, stabilityFlags] = classifyRisk(guideSequence, score);

      guides.push({
        sequence: guideSequence,
        pam,
        position: pamIndex + 1,
        strand,
        gc_content: gcContent(guideSequence),
        score,
        risk,
        risk_reason: riskReason,
        stability_flags: stabilityFlags,
      });
    }
  }

  const riskRank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
  const best_guide =
    [...guides].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (riskRank[a.risk] !== riskRank[b.risk]) {
        return riskRank[a.risk] - riskRank[b.risk];
      }
      return b.gc_content - a.gc_content;
    })[0] ?? null;

  return { guides, best_guide };
}
