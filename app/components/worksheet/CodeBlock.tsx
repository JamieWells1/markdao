"use client";

import { useMemo } from "react";
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
import { EditorView } from "@codemirror/view";

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
  language: string;
  content: string;
}

export default function CodeBlock({ language, content }: Props) {
  const extensions = useMemo(() => {
    const exts: Extension[] = [EditorView.editable.of(false)];
    const factory = LANG_MAP[language];
    if (factory) exts.push(factory());
    return exts;
  }, [language]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-3 py-1 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
      </div>
      <CodeMirror
        value={content}
        extensions={extensions}
        editable={false}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
        }}
        theme="light"
      />
    </div>
  );
}
