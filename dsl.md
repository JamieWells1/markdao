# markdao Worksheet DSL

A lightweight markdown-based format for interactive learning worksheets. The format is designed to be readable as plain markdown while containing enough structure for a renderer to create interactive input fields.

---

## Document Structure

A worksheet is a standard markdown document with a YAML frontmatter block and a sequence of sections containing questions.

### Frontmatter

```
---
title: "Photosynthesis Basics"
topic: "Biology"
difficulty: "Intermediate"
---
```

### Sections

Use `## Section Title` headings to group questions. An optional paragraph after the heading serves as a section description.

```
## Cell Structure

This section covers the basic components of plant and animal cells.
```

### Hints

Any question can include a hint using a blockquote prefixed with **Hint:**

```
> **Hint:** Think about the organelle responsible for energy production.
```

---

## Question Types

Each question starts with a numbered markdown list item (`1.`, `2.`, etc.) and is followed by an answer block that tells the renderer what kind of input to display.

### Short Answer

A single-line text input. Use a blank answer line `> _` to mark the answer field.

```
1. What is the powerhouse of the cell?

> _
```

When the user fills it in, the answer line becomes:

```
> mitochondria
```

### Long Answer

A multi-line text area. Use `> ___` (three or more underscores) to mark it.

```
2. Explain the process of photosynthesis in your own words.

> ___
```

When filled in:

```
> Photosynthesis is the process by which plants convert
> sunlight, water, and carbon dioxide into glucose and
> oxygen. It occurs primarily in the chloroplasts.
```

### Multiple Choice

A list of options using `- [ ]` (unchecked) and one correct answer isn't marked — the user selects by checking. All options start unchecked.

```
3. Which organelle is responsible for photosynthesis?

- [ ] Mitochondria
- [ ] Nucleus
- [ ] Chloroplast
- [ ] Ribosome
```

When the user selects:

```
- [ ] Mitochondria
- [ ] Nucleus
- [x] Chloroplast
- [ ] Ribosome
```

### Multi-Select

Similar to multiple choice, but the user can select more than one answer. Indicated by a `<!-- select-many -->` comment before the options.

```
4. Which of the following are components of plant cells? (Select all that apply)

<!-- select-many -->
- [ ] Cell wall
- [ ] Chloroplast
- [ ] Centriole
- [ ] Vacuole
```

When the user selects:

```
<!-- select-many -->
- [x] Cell wall
- [x] Chloroplast
- [ ] Centriole
- [x] Vacuole
```

### Fill-in-the-Blank

Inline blanks within a sentence, marked with `____` (four or more underscores). Each blank is a short inline text input.

```
4. The process of ____ converts light energy into ____ energy stored in glucose.
```

When filled in:

```
4. The process of photosynthesis converts light energy into chemical energy stored in glucose.
```

### Match Up

A two-column matching exercise. Uses a table with a `Match` header row. The left column contains items, the right column contains shuffled options. The user assigns each left item a number/letter corresponding to the right column.

```
5. Match each organelle to its function.

| Match | |
|---|---|
| 1. Mitochondria | A. Protein synthesis |
| 2. Ribosome | B. Photosynthesis |
| 3. Chloroplast | C. Cellular respiration |
| 4. Nucleus | D. Stores genetic material |

> 1=__ 2=__ 3=__ 4=__
```

When filled in:

```
> 1=C 2=A 3=B 4=D
```

### Code

A code input with syntax highlighting. Uses a fenced code block inside a blockquote, with the language tag specifying which syntax highlighting to apply. Supported languages: `python`, `javascript`, `typescript`, `java`, `c`, `cpp`, `rust`, `go`, `sql`, `html`, `css`, `php`, `markdown`.

```
6. Write a Python function that returns the factorial of a number.

> ```python
> ```
```

When filled in:

```
> ```python
> def factorial(n):
>     if n <= 1:
>         return 1
>     return n * factorial(n - 1)
> ```
```

---

## Non-Question Elements

### Reference Tables

Standalone markdown tables (not inside a question) are rendered as formatted reference tables. Use these for providing reference material, data, or context that the student can refer to while answering questions.

```
| Uppercase | Lowercase | Name |
|---|---|---|
| Α | α | alpha |
| Β | β | beta |
| Γ | γ | gamma |
```

Note: Tables that are part of a Match Up question (with a `| Match |` header) are handled separately as interactive match-up exercises.

### Bullet Lists

Unordered lists (using `-`) outside of question answer areas are rendered as plain text content.

```
A good way to study is to connect each letter with:
- its name
- its uppercase and lowercase form
- its approximate pronunciation
```

---

## Complete Example

```markdown
---
title: "Cell Biology Worksheet"
topic: "Biology"
difficulty: "Beginner"
---

## Cell Basics

Answer the following questions about cell structure and function.

1. What is the basic unit of life?

> _

2. Explain the difference between prokaryotic and eukaryotic cells.

> ___

3. Which of the following is NOT a component of animal cells?

- [ ] Cell membrane
- [ ] Cell wall
- [ ] Cytoplasm
- [ ] Nucleus

> **Hint:** Think about what gives plants their rigid structure.

4. The ____ is the control center of the cell, containing the cell's ____.

## Energy and Metabolism

5. Describe the relationship between photosynthesis and cellular respiration.

> ___

6. Match each process to its correct location.

| Match | |
|---|---|
| 1. Glycolysis | A. Inner mitochondrial membrane |
| 2. Krebs cycle | B. Chloroplast thylakoids |
| 3. Electron transport chain | C. Cytoplasm |
| 4. Light reactions | D. Mitochondrial matrix |

> 1=__ 2=__ 3=__ 4=__

7. What molecule is the primary energy currency of cells?

- [ ] DNA
- [ ] ATP
- [ ] RNA
- [ ] NADH
```

---

## Design Principles

1. **Plain markdown compatible** — the worksheet is readable and editable in any markdown viewer or text editor.
2. **Minimal syntax** — uses standard markdown constructs (lists, blockquotes, tables, checkboxes) rather than inventing new syntax.
3. **Round-trip safe** — a filled-in worksheet is still valid markdown, and the changes are localized to answer fields only.
4. **LLM-friendly** — the format is simple enough that any LLM can produce valid worksheets from a brief description of the format.
