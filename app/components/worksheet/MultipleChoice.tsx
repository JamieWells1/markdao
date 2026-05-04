"use client";

import { renderInlineMarkdown } from "../../lib/inline-markdown";

interface Props {
  id: number;
  question: string;
  options: string[];
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function MultipleChoice({ id, question, options, hint, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-foreground">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {renderInlineMarkdown(question)}
      </p>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? "" : opt)}
            className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
              value === opt
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <span className="mr-2">{value === opt ? "\u25C9" : "\u25CB"}</span>
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
