"use client";

import { useState } from "react";
import { renderInlineMarkdown } from "../../lib/inline-markdown";

const PAIR_COLORS = [
  { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700", badge: "bg-blue-500" },
  { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-700", badge: "bg-emerald-500" },
  { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-700", badge: "bg-amber-500" },
  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700", badge: "bg-purple-500" },
  { bg: "bg-rose-100", border: "border-rose-400", text: "text-rose-700", badge: "bg-rose-500" },
  { bg: "bg-cyan-100", border: "border-cyan-400", text: "text-cyan-700", badge: "bg-cyan-500" },
  { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", badge: "bg-orange-500" },
  { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-700", badge: "bg-indigo-500" },
];

interface Props {
  id: number;
  question: string;
  pairs: { left: string; right: string }[];
  hint?: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}

export default function MatchUp({ id, question, pairs, hint, value, onChange }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const leftLabels = pairs.map((p) => {
    const m = p.left.match(/^(\d+)\./);
    return m ? m[1] : String(pairs.indexOf(p) + 1);
  });

  const rightLabels = pairs.map((p) => {
    const m = p.right.match(/^([A-Z])\.\s/);
    return m ? m[1] : p.right.charAt(0);
  });

  // Build color assignments: each matched pair gets a consistent color
  const colorAssignments: Record<string, number> = {};
  let colorIdx = 0;
  for (const leftLabel of leftLabels) {
    const rightLabel = value[leftLabel];
    if (rightLabel) {
      colorAssignments[`L${leftLabel}`] = colorIdx;
      colorAssignments[`R${rightLabel}`] = colorIdx;
      colorIdx = (colorIdx + 1) % PAIR_COLORS.length;
    }
  }

  const getMatchedRight = (rightLabel: string): string | null => {
    for (const [left, right] of Object.entries(value)) {
      if (right === rightLabel) return left;
    }
    return null;
  };

  const handleLeftClick = (leftLabel: string) => {
    if (selectedLeft === leftLabel) {
      setSelectedLeft(null);
      return;
    }
    // If already matched, unmatch it
    if (value[leftLabel]) {
      const next = { ...value };
      delete next[leftLabel];
      onChange(next);
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(leftLabel);
  };

  const handleRightClick = (rightLabel: string) => {
    // If no left selected, ignore
    if (!selectedLeft) return;

    // If this right is already matched to something else, unmatch it first
    const next = { ...value };
    const existingLeft = getMatchedRight(rightLabel);
    if (existingLeft) {
      delete next[existingLeft];
    }

    // If the selected left was already matched, unmatch it
    if (next[selectedLeft]) {
      delete next[selectedLeft];
    }

    next[selectedLeft] = rightLabel;
    onChange(next);
    setSelectedLeft(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-foreground">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {renderInlineMarkdown(question)}
      </p>

      <p className="text-xs text-muted-foreground">
        Click an item on the left, then click its match on the right. Click a matched item to unpair it.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => {
            const leftLabel = leftLabels[i];
            const isMatched = !!value[leftLabel];
            const isSelected = selectedLeft === leftLabel;
            const colorKey = `L${leftLabel}`;
            const color = colorAssignments[colorKey] !== undefined
              ? PAIR_COLORS[colorAssignments[colorKey]]
              : null;

            return (
              <button
                key={i}
                onClick={() => handleLeftClick(leftLabel)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : isMatched && color
                    ? `${color.border} ${color.bg} ${color.text}`
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{renderInlineMarkdown(pair.left)}</span>
                  {isMatched && color && (
                    <span className={`${color.badge} text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                      {value[leftLabel]}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {pairs.map((pair, i) => {
            const rightLabel = rightLabels[i];
            const matchedTo = getMatchedRight(rightLabel);
            const isMatched = !!matchedTo;
            const colorKey = `R${rightLabel}`;
            const color = colorAssignments[colorKey] !== undefined
              ? PAIR_COLORS[colorAssignments[colorKey]]
              : null;

            return (
              <button
                key={i}
                onClick={() => handleRightClick(rightLabel)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  isMatched && color
                    ? `${color.border} ${color.bg} ${color.text}`
                    : selectedLeft
                    ? "border-border hover:bg-primary/5 hover:border-primary/40"
                    : "border-border"
                } ${!selectedLeft && !isMatched ? "opacity-80" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span>{renderInlineMarkdown(pair.right)}</span>
                  {isMatched && color && (
                    <span className={`${color.badge} text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2`}>
                      {matchedTo}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {hint}</p>
      )}
    </div>
  );
}
