"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const WorksheetRenderer = dynamic(
  () => import("./components/worksheet/WorksheetRenderer"),
  { ssr: false }
);

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
const QUESTION_TYPES = [
  "Short Answer",
  "Long Answer",
  "Multiple Choice",
  "Multi-Select",
  "Fill-in-the-Blank",
  "Match Up",
  "Code",
] as const;

type Difficulty = (typeof DIFFICULTIES)[number] | null;
type QuestionType = (typeof QUESTION_TYPES)[number];

interface FormData {
  topic: string;
  details: string;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
}

const TOTAL_STEPS = 5;

function generatePrompt(form: FormData): string {
  const ticks = "```";
  const parts: string[] = [];

  parts.push(`Generate a markdown worksheet about "${form.topic}" using the markdao format below.`);
  if (form.details) parts.push(`Context: ${form.details}`);
  if (form.difficulty) parts.push(`Difficulty: ${form.difficulty}`);

  if (form.questionTypes.length > 0 && form.questionTypes.length < QUESTION_TYPES.length) {
    parts.push(`Question types to use: ${form.questionTypes.join(", ")}`);
  }

  parts.push(`
--- FORMAT ---

Start with YAML frontmatter:
---
title: "Title"
topic: "${form.topic}"${form.difficulty ? `\ndifficulty: "${form.difficulty}"` : ""}
---

Group questions under ## Section headings. Number all questions (1., 2., etc.). You may add a description paragraph after each heading. Optionally add hints as: > **Hint:** text`);

  const types: string[] = [];

  if (form.questionTypes.includes("Short Answer")) {
    types.push(`Short Answer — answer line is \`> _\`
  1. What is the capital of France?
  > _`);
  }
  if (form.questionTypes.includes("Long Answer")) {
    types.push(`Long Answer — answer line is \`> ___\` (3+ underscores)
  2. Explain the causes of World War I.
  > ___`);
  }
  if (form.questionTypes.includes("Multiple Choice")) {
    types.push(`Multiple Choice — unchecked checkboxes, single selection
  3. Which planet is closest to the Sun?
  - [ ] Venus
  - [ ] Mercury
  - [ ] Earth`);
  }
  if (form.questionTypes.includes("Multi-Select")) {
    types.push(`Multi-Select — add \`<!-- select-many -->\` before checkboxes
  4. Which are prime? (Select all that apply)
  <!-- select-many -->
  - [ ] 2
  - [ ] 4
  - [ ] 7`);
  }
  if (form.questionTypes.includes("Fill-in-the-Blank")) {
    types.push(`Fill-in-the-Blank — use \`____\` (4+ underscores) inline
  5. Water has two ____ atoms and one ____ atom.`);
  }
  if (form.questionTypes.includes("Match Up")) {
    types.push(`Match Up — table with numbered left items, lettered right options (shuffled), then answer line
  6. Match each country to its capital.
  | Match | |
  |---|---|
  | 1. France | A. Tokyo |
  | 2. Japan | B. Paris |
  > 1=__ 2=__`);
  }
  if (form.questionTypes.includes("Code")) {
    types.push(`Code — fenced code block inside a blockquote with language tag (python, javascript, typescript, java, c, cpp, rust, go, sql, html, css, php, markdown)
  7. Write a function that returns the factorial of n.
  > ${ticks}python
  > ${ticks}`);
  }

  parts.push("\n--- QUESTION TYPES ---\n");
  parts.push(types.join("\n\n"));
  parts.push(`
--- OTHER ELEMENTS ---

You can include reference tables anywhere in the worksheet to provide context or data for the student. Use standard markdown table syntax:

  | Column A | Column B |
  |---|---|
  | data 1 | data 2 |

These are distinct from Match Up questions (which use a \`| Match |\` header). Reference tables are read-only and help the student while they answer questions.

You may also use bullet lists (\`-\`) for supplementary information outside of question areas.

You can include display-only code blocks with syntax highlighting using standard fenced code blocks with a language tag. These are read-only (not editable by the student) and are for showing examples, reference code, or starter snippets:

  \`\`\`cpp
  double square(double x) {
      return x * x;
  }
  \`\`\`

These are distinct from code *answer* blocks (which use \`> \`\`\`language\` inside a blockquote).

--- GUIDELINES ---

- Include brief teaching content and context before question sections — this is a learning worksheet, not just a quiz. Help the student understand the material, not just test them.
- Use progressive difficulty within each section: start with foundational questions and build toward harder ones.
- For multiple choice and multi-select, use plausible distractors that test real understanding, not obviously wrong answers.
- Vary question types naturally throughout the worksheet for engagement — but only if it serves the learning experience. If the topic or user request calls for a single type, that's fine. Use whatever fits best.

Output ONLY the markdown worksheet. Wrap the entire output in a quadruple-backtick code fence (using \`\`\`\` not \`\`\`) so it displays as copyable raw text rather than rendered markdown. This is important because triple backticks may appear inside the worksheet for code questions — the quadruple fence avoids conflicts. No explanation before or after the code fence.

Example wrapper:
\`\`\`\`markdown
---
title: "..."
...
\`\`\`\``);

  return parts.join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
    >
      {copied ? "Copied!" : "Copy to Clipboard"}
    </button>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i <= current ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function StepForm({
  form,
  setForm,
  onNext,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
}) {
  const toggleType = (type: QuestionType) => {
    const types = form.questionTypes.includes(type)
      ? form.questionTypes.filter((t) => t !== type)
      : [...form.questionTypes, type];
    setForm({ ...form, questionTypes: types });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create a Worksheet
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe what you want to learn and we&apos;ll generate a prompt for
          your LLM.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Topic <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Photosynthesis, Linear Algebra, World War II"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Details</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            placeholder="Any specific areas to focus on, prior knowledge, or context..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() =>
                  setForm({
                    ...form,
                    difficulty: form.difficulty === d ? null : d,
                  })
                }
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  form.difficulty === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Question Types
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  form.questionTypes.includes(type)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="mr-2">
                  {form.questionTypes.includes(type) ? "\u2713" : "\u00A0\u00A0"}
                </span>
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!form.topic.trim()}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StepPrompt({
  form,
  onNext,
  onBack,
}: {
  form: FormData;
  onNext: () => void;
  onBack: () => void;
}) {
  const prompt = generatePrompt(form);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Your LLM Prompt
        </h1>
        <p className="text-muted-foreground mt-1">
          Copy this prompt and paste it into Claude or your preferred LLM.
        </p>
      </div>

      <div>
        <div className="flex justify-end mb-2">
          <CopyButton text={prompt} />
        </div>
        <pre className="w-full p-4 rounded-lg border border-border bg-muted/50 text-sm font-mono whitespace-pre-wrap leading-relaxed min-h-[200px] max-h-[60vh] overflow-y-auto">
          {prompt}
        </pre>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StepPaste({
  worksheet,
  setWorksheet,
  onNext,
  onBack,
}: {
  worksheet: string;
  setWorksheet: (s: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Paste Your Worksheet
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste the markdown worksheet your LLM generated.
        </p>
      </div>

      <textarea
        value={worksheet}
        onChange={(e) => setWorksheet(e.target.value)}
        placeholder="Paste your markdown worksheet here..."
        rows={14}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
      />

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!worksheet.trim()}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Worksheet
        </button>
      </div>
    </div>
  );
}

function StepWorksheet({
  worksheet,
  onComplete,
  onBack,
}: {
  worksheet: string;
  onComplete: (completedMarkdown: string) => void;
  onBack: () => void;
}) {
  return (
    <WorksheetRenderer
      rawMarkdown={worksheet}
      onComplete={onComplete}
      onBack={onBack}
    />
  );
}

function StepComplete({
  worksheet,
  onStartOver,
  onBack,
}: {
  worksheet: string;
  onStartOver: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Completed Worksheet
        </h1>
        <p className="text-muted-foreground mt-1">
          Copy this and paste it back into your LLM for feedback and grading.
        </p>
      </div>

      <div>
        <div className="flex justify-end mb-2">
          <CopyButton text={worksheet} />
        </div>
        <pre className="w-full p-4 rounded-lg border border-border bg-muted/50 text-sm font-mono whitespace-pre-wrap leading-relaxed min-h-[200px] max-h-[60vh] overflow-y-auto">
          {worksheet}
        </pre>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={onStartOver}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    topic: "",
    details: "",
    difficulty: null,
    questionTypes: [...QUESTION_TYPES],
  });
  const [worksheet, setWorksheet] = useState("");
  const [completedMarkdown, setCompletedMarkdown] = useState("");

  const scrollTop = () => window.scrollTo({ top: 0 });
  const next = () => { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); scrollTop(); };
  const back = () => { setStep((s) => Math.max(s - 1, 0)); scrollTop(); };
  const handleWorksheetComplete = (md: string) => {
    setCompletedMarkdown(md);
    next();
  };
  const startOver = () => {
    setStep(0);
    setForm({
      topic: "",
      details: "",
      difficulty: null,
      questionTypes: [...QUESTION_TYPES],
    });
    setWorksheet("");
    setCompletedMarkdown("");
    scrollTop();
  };

  return (
    <main className="flex-1 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full flex-shrink-0 px-1">
                {i === 0 && (
                  <StepForm form={form} setForm={setForm} onNext={next} />
                )}
                {i === 1 && <StepPrompt form={form} onNext={next} onBack={back} />}
                {i === 2 && (
                  <StepPaste
                    worksheet={worksheet}
                    setWorksheet={setWorksheet}
                    onNext={next}
                    onBack={back}
                  />
                )}
                {i === 3 && (
                  <StepWorksheet
                    worksheet={worksheet}
                    onComplete={handleWorksheetComplete}
                    onBack={back}
                  />
                )}
                {i === 4 && (
                  <StepComplete
                    worksheet={completedMarkdown}
                    onStartOver={startOver}
                    onBack={back}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
