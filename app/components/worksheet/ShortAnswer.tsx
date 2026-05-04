"use client";

import { renderInlineMarkdown } from "../../lib/inline-markdown";

interface Props {
  id: number;
  question: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ShortAnswer({ id, question, hint, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-foreground">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {renderInlineMarkdown(question)}
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      />
      {hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {hint}</p>
      )}
    </div>
  );
}
