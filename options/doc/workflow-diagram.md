# Answer bank page (`options/`) — workflows

Line numbers refer to `options/options.js`.

## 1. Opening the page (lines 201–207)

```mermaid
flowchart TD
    A[Page opens] --> B[Load bank, resume, settings from storage]
    B --> C{Bank saved yet?}
    C -- yes --> D[Use it]
    C -- no --> E[Use a copy of DEFAULT_BANK and save it]
    D --> F[Tick the overwrite box from settings; show resume name; draw sections]
    E --> F
```

## 2. Editing and autosave (lines 23–77)

```mermaid
sequenceDiagram
    actor U as User
    participant P as Bank page
    participant S as storage.local
    U->>P: Types in a question, other wordings, or answer
    P->>P: Update the entry in memory, restart 400 ms timer
    Note over P: More typing restarts the timer
    P->>S: set {bank} (the whole bank)
    P-->>U: "Saved" flashes for 1.2 s
```

Branches:

```mermaid
flowchart LR
    A[Delete] --> B{Second click?}
    B -- no --> C[Button turns to Confirm]
    B -- yes --> D[Remove entry, autosave, redraw]
    E[Add question] --> F[New entry 'New question' in the chosen section;<br/>search cleared; its text selected]
    G[Search] --> H[Show entries whose question, wordings or answer contain the text;<br/>'Nothing matches' if none]
```

## 3. Resume upload (lines 98–159)

```mermaid
flowchart TD
    A[User picks a file] --> B[Read the bytes]
    B --> C{Save to storage as base64}
    C -- fails --> X1["Couldn't save that file (reason)"]
    C -- ok --> D[Show 'Attached to forms: name']
    D --> E{PDF?}
    E -- yes --> F[pdf.js reads a copy of the bytes, page by page]
    E -- no, .txt --> G[Decode as text]
    F -- fails --> X2["Saved for upload fields, but couldn't read its text (reason)"]
    F --> H{At least 20 non-space characters?}
    G --> H
    H -- no --> X3[Saved for upload fields, but no readable text:<br/>may be a scanned image]
    H -- yes --> I[ResumeParser.parse]
    I --> J{Any values for known bank questions?}
    J -- no --> X4[Nothing recognizable was found]
    J -- yes --> K[Review list: value boxes, ticked where the answer is empty,<br/>'You already have: …' otherwise]
    K --> L[User edits and clicks Save checked answers]
    L --> M[Ticked, non-empty values replace answers; save; 'Saved N answers']
```

Caption: in every failure after step C, the file is still saved, so upload fields still work.

## 4. Remove resume (lines 165–169)

The **Remove resume** button deletes `resume` from storage and clears the file picker. The form filler then shows "Add your resume…" on upload fields.

## 5. Export and import (lines 171–199)

```mermaid
flowchart TD
    A[Export as JSON] --> B["Download answer-bank.json = {bank: [...]}"]
    C[Import JSON] --> D{Valid JSON with a bank array<br/>or a bare array?}
    D -- no --> X["That file isn't an answer bank export."]
    D -- yes --> E[For each entry with a question]
    E --> F{Same id or same question text in my bank?}
    F -- yes --> G{Different, non-empty answer?}
    G -- yes --> H[Update my answer]
    G -- no --> I[Keep mine]
    F -- no --> J[Add it; section 'Learned' if none given]
    H & I & J --> K[Save; 'Imported: N new, M updated']
```
