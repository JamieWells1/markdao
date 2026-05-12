import type { ParsedWorksheet, Block } from "./parser";

export type AnswerValue =
  | string
  | string[]
  | boolean[]
  | Record<string, string>;

export type Answers = Record<number, AnswerValue>;

function serializeBlock(block: Block, answers: Answers): string {
  if (block.type === "text") return block.content;

  if (block.type === "code-block") {
    return "```" + block.language + "\n" + block.content + "\n```";
  }

  if (block.type === "table") {
    const lines: string[] = [];
    lines.push("| " + block.headers.join(" | ") + " |");
    lines.push("| " + block.headers.map(() => "---").join(" | ") + " |");
    for (const row of block.rows) {
      lines.push("| " + row.join(" | ") + " |");
    }
    return lines.join("\n");
  }

  const answer = answers[block.id];

  switch (block.type) {

    case "short-answer": {
      const val = (answer as string) || "";
      const lines = [`${block.id}. ${block.question}`, ""];
      lines.push(val ? `> ${val}` : "> _");
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "long-answer": {
      const val = (answer as string) || "";
      const lines = [`${block.id}. ${block.question}`, ""];
      if (val) {
        lines.push(
          ...val.split("\n").map((l) => `> ${l}`)
        );
      } else {
        lines.push("> ___");
      }
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "multiple-choice": {
      const selected = (answer as string) || "";
      const lines = [`${block.id}. ${block.question}`, ""];
      for (const opt of block.options) {
        lines.push(opt === selected ? `- [x] ${opt}` : `- [ ] ${opt}`);
      }
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "multi-select": {
      const checks = (answer as boolean[]) || block.options.map(() => false);
      const lines = [`${block.id}. ${block.question}`, "", "<!-- select-many -->"];
      block.options.forEach((opt, i) => {
        lines.push(checks[i] ? `- [x] ${opt}` : `- [ ] ${opt}`);
      });
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "fill-blank": {
      const blanks = (answer as string[]) || [];
      let blankIdx = 0;
      const filled = block.questionTemplate.replace(/_{4,}/g, () => {
        const val = blanks[blankIdx] || "____";
        blankIdx++;
        return val;
      });
      const lines = [`${block.id}. ${filled}`];
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "match-up": {
      const matches = (answer as Record<string, string>) || {};
      const lines = [`${block.id}. ${block.question}`, ""];
      lines.push("| Match | |");
      lines.push("|---|---|");
      for (const pair of block.pairs) {
        lines.push(`| ${pair.left} | ${pair.right} |`);
      }
      lines.push("");
      const answerParts = block.pairs.map((_, i) => {
        const key = String(i + 1);
        return `${key}=${matches[key] || "__"}`;
      });
      lines.push(`> ${answerParts.join(" ")}`);
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    case "code": {
      const val = (answer as string) || "";
      const lines = [`${block.id}. ${block.question}`, ""];
      lines.push(`> \`\`\`${block.language}`);
      if (val) {
        lines.push(...val.split("\n").map((l) => `> ${l}`));
      }
      lines.push("> ```");
      if (block.hint) lines.push("", `> **Hint:** ${block.hint}`);
      return lines.join("\n");
    }

    default:
      return "";
  }
}

export function serializeWorksheet(
  worksheet: ParsedWorksheet,
  answers: Answers
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${worksheet.frontmatter.title}"`);
  lines.push(`topic: "${worksheet.frontmatter.topic}"`);
  if (worksheet.frontmatter.difficulty) {
    lines.push(`difficulty: "${worksheet.frontmatter.difficulty}"`);
  }
  lines.push("---");
  lines.push("");

  for (const section of worksheet.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    if (section.description) {
      lines.push(section.description);
      lines.push("");
    }
    for (const block of section.blocks) {
      lines.push(serializeBlock(block, answers));
      lines.push("");
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
