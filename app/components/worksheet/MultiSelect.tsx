"use client";

import { renderInlineMarkdown } from "../../lib/inline-markdown";

interface Props {
  id: number;
  question: string;
  options: string[];
  hint?: string;
  value: boolean[];
  onChange: (value: boolean[]) => void;
}

export default function MultiSelect({ id, question, options, hint, value, onChange }: Props) {
  const checks = value.length === options.length ? value : options.map(() => false);

  const toggle = (idx: number) => {
    const next = [...checks];
    next[idx] = !next[idx];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-foreground">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {renderInlineMarkdown(question)}
      </p>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => toggle(i)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
              checks[i]
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <span className="mr-2">{checks[i] ? "\u2713" : "\u00A0\u00A0"}</span>
            {opt}
          </button>
        ))}
      </div>
      {hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {hint}</p>
      )}
    </div>
  );
}
