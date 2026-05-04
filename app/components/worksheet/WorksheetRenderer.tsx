"use client";

import { useState, useMemo, useCallback } from "react";
import { renderInlineMarkdown } from "../../lib/inline-markdown";
import type { ParsedWorksheet, Block } from "../../lib/parser";
import { parseWorksheet } from "../../lib/parser";
import { serializeWorksheet } from "../../lib/serializer";
import type { Answers, AnswerValue } from "../../lib/serializer";
import ShortAnswer from "./ShortAnswer";
import LongAnswer from "./LongAnswer";
import MultipleChoice from "./MultipleChoice";
import MultiSelect from "./MultiSelect";
import FillBlank from "./FillBlank";
import MatchUp from "./MatchUp";
import dynamic from "next/dynamic";

const CodeAnswer = dynamic(() => import("./CodeAnswer"), { ssr: false });

function BlockRenderer({
  block,
  answer,
  onAnswer,
}: {
  block: Block;
  answer: AnswerValue | undefined;
  onAnswer: (id: number, value: AnswerValue) => void;
}) {
  switch (block.type) {
    case "text": {
      const lines = block.content.split("\n");
      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        return (
          <ul className="list-disc list-inside space-y-1 text-foreground">
            {lines.map((l, i) => (
              <li key={i} className="leading-relaxed">
                {renderInlineMarkdown(l.replace(/^- /, ""))}
              </li>
            ))}
          </ul>
        );
      }
      return <p className="text-foreground leading-relaxed">{renderInlineMarkdown(block.content)}</p>;
    }

    case "table":
      return (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left px-3 py-2 font-medium">
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-t border-border">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "short-answer":
      return (
        <ShortAnswer
          id={block.id}
          question={block.question}
          hint={block.hint}
          value={(answer as string) || ""}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "long-answer":
      return (
        <LongAnswer
          id={block.id}
          question={block.question}
          hint={block.hint}
          value={(answer as string) || ""}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "multiple-choice":
      return (
        <MultipleChoice
          id={block.id}
          question={block.question}
          options={block.options}
          hint={block.hint}
          value={(answer as string) || ""}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "multi-select":
      return (
        <MultiSelect
          id={block.id}
          question={block.question}
          options={block.options}
          hint={block.hint}
          value={(answer as boolean[]) || block.options.map(() => false)}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "fill-blank":
      return (
        <FillBlank
          id={block.id}
          questionTemplate={block.questionTemplate}
          blankCount={block.blankCount}
          hint={block.hint}
          value={(answer as string[]) || []}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "match-up":
      return (
        <MatchUp
          id={block.id}
          question={block.question}
          pairs={block.pairs}
          hint={block.hint}
          value={(answer as Record<string, string>) || {}}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    case "code":
      return (
        <CodeAnswer
          id={block.id}
          question={block.question}
          language={block.language}
          hint={block.hint}
          value={(answer as string) || ""}
          onChange={(v) => onAnswer(block.id, v)}
        />
      );

    default:
      return null;
  }
}

interface Props {
  rawMarkdown: string;
  onComplete: (completedMarkdown: string) => void;
  onBack: () => void;
}

export default function WorksheetRenderer({ rawMarkdown, onComplete, onBack }: Props) {
  const parsed: ParsedWorksheet = useMemo(
    () => parseWorksheet(rawMarkdown),
    [rawMarkdown]
  );
  const [answers, setAnswers] = useState<Answers>({});

  const handleAnswer = useCallback((id: number, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleDone = () => {
    const completed = serializeWorksheet(parsed, answers);
    onComplete(completed);
  };

  return (
    <div className="space-y-8">
      {parsed.frontmatter.title && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {parsed.frontmatter.title}
          </h1>
          {parsed.frontmatter.difficulty && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              {parsed.frontmatter.difficulty}
            </span>
          )}
        </div>
      )}

      {parsed.sections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {renderInlineMarkdown(section.description)}
              </p>
            )}
          </div>

          {section.blocks.map((block, bIdx) => (
            <BlockRenderer
              key={`${sIdx}-${bIdx}`}
              block={block}
              answer={answers[block.type !== "text" && block.type !== "table" ? block.id : -1]}
              onAnswer={handleAnswer}
            />
          ))}
        </div>
      ))}

      <div className="flex justify-between pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleDone}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
