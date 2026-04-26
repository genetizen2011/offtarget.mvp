export type RiskLevel = "low" | "medium" | "high";

export type Guide = {
  sequence: string;
  pam: string;
  position: number;
  gc_content: number;
  score: number;
  risk: RiskLevel;
  risk_reason: string;
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
  let sequence = input;

  sequence = sequence.replace(/^>.*$/gm, "");
  sequence = sequence.replace(/\s/g, "");
  sequence = sequence.toUpperCase().replace(/U/g, "T");

  if (sequence.length < 20) {
    throw new ApiError("Sequence too short — minimum 20 bp", 422);
  }

  if (sequence.length > 200) {
    throw new ApiError("Sequence too long — maximum 200 bp", 422);
  }

  const invalid = sequence.replace(/[ACGTN]/g, "");
  if (invalid.length > 0) {
    throw new ApiError(
      `Invalid characters: ${[...new Set(invalid)].join(", ")}`,
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

function classifyRisk(guide: string, score: number): [RiskLevel, string] {
  const gc = gcContent(guide);
  const density = repeatDensity(guide);

  if (gc < 25 || gc > 75) {
    return ["high", "Extreme GC content can reduce specificity and binding quality."];
  }

  if (hasHomopolymer(guide)) {
    return ["high", "Contains a homopolymer run that may increase off-target behavior."];
  }

  if (density > 0.22) {
    return ["medium", "Contains repeated short motifs that may appear elsewhere."];
  }

  if (gc < 40 || gc > 65) {
    return ["medium", "GC content is outside the preferred 40-65% design window."];
  }

  if (score < 0.55) {
    return ["medium", "Predicted efficiency is modest compared with other guides."];
  }

  return ["low", "Balanced GC content and no obvious repetitive sequence risk."];
}

export function analyzeCrisprSequence(input: string): AnalyzeResponse {
  const sequence = normalizeSequence(input);
  const guides: Guide[] = [];
  const pamPattern = /[ACGT]GG/g;

  for (const match of sequence.matchAll(pamPattern)) {
    const pamIndex = match.index ?? -1;
    if (pamIndex < 20) continue;

    const guideSequence = sequence.slice(pamIndex - 20, pamIndex);
    const pam = match[0];
    const score = efficiencyScore(guideSequence, pam);
    const [risk, riskReason] = classifyRisk(guideSequence, score);

    guides.push({
      sequence: guideSequence,
      pam,
      position: pamIndex + 1,
      gc_content: gcContent(guideSequence),
      score,
      risk,
      risk_reason: riskReason,
    });
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
