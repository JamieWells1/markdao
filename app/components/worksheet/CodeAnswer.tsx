"use client";

import { useMemo } from "react";
import { renderInlineMarkdown } from "../../lib/inline-markdown";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { sql } from "@codemirror/lang-sql";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { php } from "@codemirror/lang-php";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";

const LANG_MAP: Record<string, () => Extension> = {
  python: () => python(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  java: () => java(),
  c: () => cpp(),
  cpp: () => cpp(),
  rust: () => rust(),
  go: () => go(),
  sql: () => sql(),
  html: () => html(),
  css: () => css(),
  php: () => php(),
  markdown: () => markdown(),
};

interface Props {
  id: number;
  question: string;
  language: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CodeAnswer({ id, question, language, hint, value, onChange }: Props) {
  const extensions = useMemo(() => {
    const factory = LANG_MAP[language];
    return factory ? [factory()] : [];
  }, [language]);

  return (
    <div className="space-y-2">
      <p className="text-foreground">
        <span className="font-medium text-muted-foreground mr-2">{id}.</span>
        {renderInlineMarkdown(question)}
      </p>
      <div className="text-xs text-muted-foreground font-mono mb-1">{language}</div>
      <div className="rounded-lg border border-border overflow-hidden">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          placeholder={`Write your ${language} code here...`}
          minHeight="120px"
          maxHeight="400px"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
          }}
          theme="light"
        />
      </div>
      {hint && (
        <p className="text-sm text-muted-foreground italic">Hint: {hint}</p>
      )}
    </div>
  );
}
