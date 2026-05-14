export interface Frontmatter {
  title: string;
  topic: string;
  difficulty?: string;
}

export interface Section {
  title: string;
  description?: string;
  blocks: Block[];
}

export interface ParsedWorksheet {
  frontmatter: Frontmatter;
  sections: Section[];
}

export type Block =
  | { type: "text"; content: string }
  | { type: "short-answer"; id: number; question: string; hint?: string }
  | { type: "long-answer"; id: number; question: string; hint?: string }
  | {
      type: "multiple-choice";
      id: number;
      question: string;
      options: string[];
      hint?: string;
    }
  | {
      type: "multi-select";
      id: number;
      question: string;
      options: string[];
      hint?: string;
    }
  | {
      type: "fill-blank";
      id: number;
      questionTemplate: string;
      blankCount: number;
      hint?: string;
    }
  | {
      type: "match-up";
      id: number;
      question: string;
      pairs: { left: string; right: string }[];
      hint?: string;
    }
  | {
      type: "code";
      id: number;
      question: string;
      language: string;
      hint?: string;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | {
      type: "code-block";
      language: string;
      content: string;
    };

function parseFrontmatter(text: string): Frontmatter {
  const fm: Frontmatter = { title: "", topic: "" };
  for (const line of text.split("\n")) {
    const match = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
    if (match) {
      const [, key, value] = match;
      if (key === "title") fm.title = value;
      else if (key === "topic") fm.topic = value;
      else if (key === "difficulty") fm.difficulty = value;
    }
  }
  return fm;
}

function extractHint(lines: string[], startIdx: number): string | undefined {
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    if (line.match(/^>\s*\*\*Hint:\*\*/)) {
      return line.replace(/^>\s*\*\*Hint:\*\*\s*/, "");
    }
    break;
  }
  return undefined;
}

export function parseWorksheet(markdown: string): ParsedWorksheet {
  const lines = markdown.split("\n");
  let idx = 0;

  // Extract frontmatter
  let frontmatter: Frontmatter = { title: "", topic: "" };
  if (lines[idx]?.trim() === "---") {
    idx++;
    const fmStart = idx;
    while (idx < lines.length && lines[idx].trim() !== "---") idx++;
    frontmatter = parseFrontmatter(
      lines.slice(fmStart, idx).join("\n")
    );
    idx++;
  }

  const sections: Section[] = [];
  let currentSection: Section | null = null;

  while (idx < lines.length) {
    const line = lines[idx];

    // Section heading
    if (line.match(/^## /)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.replace(/^## /, "").trim(),
        blocks: [],
      };
      idx++;

      // Collect first paragraph as description (stop at blank line, question, heading, table, or list)
      while (idx < lines.length && lines[idx].trim() === "") idx++;
      const descLines: string[] = [];
      while (idx < lines.length) {
        const l = lines[idx].trim();
        if (
          l === "" ||
          l.match(/^\d+\.\s/) ||
          l.match(/^## /) ||
          l.match(/^\|/) ||
          l.match(/^- /) ||
          l.match(/^>/) ||
          l.match(/^```/)
        ) break;
        descLines.push(l);
        idx++;
      }
      if (descLines.length > 0) {
        currentSection.description = descLines.join(" ");
      }
      continue;
    }

    // Question line
    const questionMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (questionMatch && currentSection) {
      const id = parseInt(questionMatch[1]);
      const questionText = questionMatch[2];
      idx++;

      // Check if question itself has blanks (fill-in-the-blank)
      if (questionText.match(/_{4,}/)) {
        const blankCount = (questionText.match(/_{4,}/g) || []).length;
        // Look for hint after
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "fill-blank",
          id,
          questionTemplate: questionText,
          blankCount,
          hint,
        });
        continue;
      }

      // Look ahead to determine question type
      let lookIdx = idx;
      while (lookIdx < lines.length && lines[lookIdx].trim() === "") lookIdx++;

      if (lookIdx >= lines.length) {
        // End of file, treat as text
        currentSection.blocks.push({ type: "text", content: line });
        continue;
      }

      const nextLine = lines[lookIdx].trim();

      // Short answer: > _
      if (nextLine === "> _") {
        idx = lookIdx + 1;
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "short-answer",
          id,
          question: questionText,
          hint,
        });
        continue;
      }

      // Long answer: > ___ (3+ underscores)
      if (nextLine.match(/^>\s*_{3,}$/)) {
        idx = lookIdx + 1;
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "long-answer",
          id,
          question: questionText,
          hint,
        });
        continue;
      }

      // Code: > ```language
      if (nextLine.match(/^>\s*```\w+/)) {
        const langMatch = nextLine.match(/^>\s*```(\w+)/);
        const language = langMatch ? langMatch[1] : "plaintext";
        idx = lookIdx + 1;
        // Skip to closing > ```
        while (idx < lines.length && !lines[idx].trim().match(/^>\s*```\s*$/)) idx++;
        idx++;
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "code",
          id,
          question: questionText,
          language,
          hint,
        });
        continue;
      }

      // Multi-select check
      if (nextLine === "<!-- select-many -->") {
        idx = lookIdx + 1;
        const options: string[] = [];
        while (idx < lines.length && lines[idx].trim().match(/^- \[[ x]\] /)) {
          options.push(lines[idx].trim().replace(/^- \[[ x]\] /, ""));
          idx++;
        }
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "multi-select",
          id,
          question: questionText,
          options,
          hint,
        });
        continue;
      }

      // Multiple choice: - [ ] option
      if (nextLine.match(/^- \[[ x]\] /)) {
        idx = lookIdx;
        const options: string[] = [];
        while (idx < lines.length && lines[idx].trim().match(/^- \[[ x]\] /)) {
          options.push(lines[idx].trim().replace(/^- \[[ x]\] /, ""));
          idx++;
        }
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "multiple-choice",
          id,
          question: questionText,
          options,
          hint,
        });
        continue;
      }

      // Match up: | Match |
      if (nextLine.match(/^\|\s*Match\s*\|/i)) {
        idx = lookIdx + 1;
        // Skip separator line |---|---|
        if (idx < lines.length && lines[idx].trim().match(/^\|[-\s|]+\|$/)) idx++;
        const pairs: { left: string; right: string }[] = [];
        while (idx < lines.length && lines[idx].trim().match(/^\|/)) {
          const cells = lines[idx]
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean);
          if (cells.length >= 2) {
            pairs.push({ left: cells[0], right: cells[1] });
          }
          idx++;
        }
        // Skip the answer template line (> 1=__ 2=__ ...)
        while (idx < lines.length && lines[idx].trim() === "") idx++;
        if (idx < lines.length && lines[idx].trim().match(/^>\s*\d+=__/)) idx++;
        const hint = extractHint(lines, idx);
        if (hint !== undefined) {
          while (idx < lines.length && !lines[idx].trim().match(/^>\s*\*\*Hint:\*\*/)) idx++;
          idx++;
        }
        currentSection.blocks.push({
          type: "match-up",
          id,
          question: questionText,
          pairs,
          hint,
        });
        continue;
      }

      // Fallback: treat as short answer if nothing matched
      currentSection.blocks.push({
        type: "short-answer",
        id,
        question: questionText,
      });
      continue;
    }

    // Standalone bullet list (not checkboxes)
    if (currentSection && line.trim().match(/^- /) && !line.trim().match(/^- \[[ x]\]/)) {
      const listLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().match(/^- /) && !lines[idx].trim().match(/^- \[[ x]\]/)) {
        listLines.push(lines[idx].trim());
        idx++;
      }
      currentSection.blocks.push({
        type: "text",
        content: listLines.join("\n"),
      });
      continue;
    }

    // Fenced code block (display-only, not inside a blockquote)
    if (currentSection && line.trim().match(/^```(\w*)/)) {
      const langMatch = line.trim().match(/^```(\w*)/);
      const language = langMatch?.[1] || "plaintext";
      idx++;
      const codeLines: string[] = [];
      while (idx < lines.length && !lines[idx].trim().match(/^```\s*$/)) {
        codeLines.push(lines[idx]);
        idx++;
      }
      idx++; // skip closing ```
      currentSection.blocks.push({
        type: "code-block",
        language,
        content: codeLines.join("\n"),
      });
      continue;
    }

    // Standalone hint/blockquote (not attached to a question)
    if (currentSection && line.trim().match(/^>/) && !line.trim().match(/^>\s*_/) && !line.trim().match(/^>\s*```/) && !line.trim().match(/^>\s*\d+=/) ) {
      const quoteLines: string[] = [];
      while (idx < lines.length && lines[idx].trim().match(/^>/)) {
        quoteLines.push(lines[idx].trim().replace(/^>\s*/, ""));
        idx++;
      }
      currentSection.blocks.push({
        type: "text",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    // Standalone table (not part of a question)
    if (currentSection && line.trim().match(/^\|/) && !line.trim().match(/^\|\s*Match\s*\|/i)) {
      // Parse header row
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      idx++;
      // Skip separator row
      if (idx < lines.length && lines[idx].trim().match(/^\|[-\s:|]+\|$/)) idx++;
      // Parse data rows
      const rows: string[][] = [];
      while (idx < lines.length && lines[idx].trim().match(/^\|/)) {
        const cells = lines[idx].split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0) rows.push(cells);
        idx++;
      }
      currentSection.blocks.push({
        type: "table",
        headers: headerCells,
        rows,
      });
      continue;
    }

    // H3 sub-heading
    if (currentSection && line.trim().match(/^### /)) {
      currentSection.blocks.push({
        type: "text",
        content: line.trim(),
      });
      idx++;
      continue;
    }

    // Non-question text content
    if (currentSection && line.trim() !== "") {
      // Skip hint lines and answer template lines that aren't attached to questions
      if (
        !line.trim().match(/^>\s*\*\*Hint:\*\*/) &&
        !line.trim().match(/^>\s*_/) &&
        !line.trim().match(/^>\s*```/) &&
        !line.trim().match(/^```/) &&
        !line.trim().match(/^- \[[ x]\]/) &&
        !line.trim().match(/^<!-- select-many -->/) &&
        !line.trim().match(/^>\s*\d+=/)
      ) {
        // Collect consecutive text lines (single newlines are soft wraps, join with space)
        const textLines: string[] = [line.trim()];
        idx++;
        while (
          idx < lines.length &&
          lines[idx].trim() !== "" &&
          !lines[idx].match(/^## /) &&
          !lines[idx].trim().match(/^### /) &&
          !lines[idx].match(/^\d+\.\s/) &&
          !lines[idx].trim().match(/^\|/) &&
          !lines[idx].trim().match(/^```/) &&
          !lines[idx].trim().match(/^- /) &&
          !lines[idx].trim().match(/^>/)
        ) {
          textLines.push(lines[idx].trim());
          idx++;
        }
        currentSection.blocks.push({
          type: "text",
          content: textLines.join(" "),
        });
        continue;
      }
    }

    idx++;
  }

  if (currentSection) sections.push(currentSection);

  return { frontmatter, sections };
}
