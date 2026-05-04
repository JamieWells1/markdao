"use client";

interface Props {
  id: number;
  questionTemplate: string;
  blankCount: number;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export default function FillBlank({ id, questionTemplate, blankCount, hint, value, onChange }: Props) {
  const blanks = value.length === blankCount ? value : Array(blankCount).fill("");

  const updateBlank = (idx: number, val: string) => {
    const next = [...blanks];
    next[idx] = val;
    onChange(next);
  };

  // Split template on blanks and interleave inputs
  const parts = questionTemplate.split(/_{4,}/);

  return (
    <div className="space-y-2">
      <div className="text-foreground leading-relaxed">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                value={blanks[i] || ""}
                onChange={(e) => updateBlank(i, e.target.value)}
                placeholder="..."
                className="inline-block w-32 mx-1 px-2 py-0.5 rounded border border-border bg-background text-foreground text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            )}
          </span>
        ))}
      </div>
      {hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {hint}</p>
      )}
    </div>
  );
}
