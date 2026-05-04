import React from "react";

interface Segment {
  type: "text" | "bold" | "italic" | "bold-italic" | "code" | "break";
  content: string;
}

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];
  // Process line by line to handle line breaks
  const lines = text.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lineIdx > 0) {
      segments.push({ type: "break", content: "" });
    }

    const line = lines[lineIdx];
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", content: line.slice(lastIndex, match.index) });
      }

      if (match[2]) {
        segments.push({ type: "bold-italic", content: match[2] });
      } else if (match[3]) {
        segments.push({ type: "bold", content: match[3] });
      } else if (match[4]) {
        segments.push({ type: "italic", content: match[4] });
      } else if (match[5]) {
        segments.push({ type: "code", content: match[5] });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      segments.push({ type: "text", content: line.slice(lastIndex) });
    }
  }

  return segments;
}

export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const segments = tokenize(text);

  return segments.map((seg, i) => {
    switch (seg.type) {
      case "bold":
        return <strong key={i}>{seg.content}</strong>;
      case "italic":
        return <em key={i}>{seg.content}</em>;
      case "bold-italic":
        return <strong key={i}><em>{seg.content}</em></strong>;
      case "code":
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
          >
            {seg.content}
          </code>
        );
      case "break":
        return <br key={i} />;
      case "text":
      default:
        return <React.Fragment key={i}>{seg.content}</React.Fragment>;
    }
  });
}
