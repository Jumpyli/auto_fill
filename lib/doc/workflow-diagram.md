# Shared logic (`lib/`) — workflows

## 1. Matching a form question: `matchQuestion` + `similarity` (match.js:17–52)

For each bank entry, every phrasing (the question plus its other wordings) is scored; the highest score wins. Ties keep the earlier entry.

```mermaid
flowchart TD
    A[Form label + one bank phrasing] --> B[Clean both: drop *, required, punctuation, apostrophes; lowercase]
    B --> C{Either empty?}
    C -- yes --> Z0[0]
    C -- no --> D{Identical?}
    D -- yes --> Z1[1.0]
    D -- no --> E{Phrasing starts with '='?}
    E -- yes --> Z0b[0: exact-only]
    E -- no --> F[Words minus filler words, plural s removed]
    F --> G{2+ word phrasing appears<br/>word for word in label?}
    G -- yes --> Z2[0.92]
    G -- no --> H{All phrasing words in label?}
    H -- yes, 2+ words --> Z3[0.88]
    H -- yes, 1 word --> Z4[0.6 + 0.4 / label words]
    H -- no --> Z5[Dice overlap]
```

Caption: the caller (`content/fill.js`) then fills when the best score is ≥ 0.55 (yellow) or ≥ 0.8 (green), and treats an empty answer on the best entry as "answer is empty."

## 2. Picking an option: `pickOption` (match.js:54–79)

```mermaid
flowchart TD
    A[Saved answer + each option] --> B{Same text?}
    B -- yes --> S1[1.0]
    B -- no --> C{Answer means decline / prefer not?}
    C -- yes --> C2{Option means the same?}
    C2 -- yes --> S2[0.9]
    C2 -- no --> S0[0]
    C -- no --> D{Answer and option both start yes/no?}
    D -- yes --> D2{Agree?}
    D2 -- yes --> S3[0.95]
    D2 -- no --> S0b[0]
    D -- no --> E{Answer is yes/no and ≤ 4 options?}
    E -- yes --> E2{Option's negation agrees?}
    E2 -- yes --> S4[0.7]
    E2 -- no --> S0c[0]
    E -- no --> F[0.95 × best similarity either way]
```

Caption: the highest-scoring option wins. The form filler requires ≥ 0.6 to select it, and ≥ 0.85 for green.

## 3. Agreement and follow-up checks (match.js:81–86)

```mermaid
flowchart LR
    L[Form label] --> N[Clean + lowercase]
    N --> C{Contains an agreement or<br/>signature phrase?}
    C -- yes --> CS[isConsent = true:<br/>form filler always skips]
    N --> F{Starts with 'if you answered',<br/>'if yes', 'if so'…?}
    F -- yes --> FU[isFollowUp = true:<br/>filled only from an exact saved answer]
```

## 4. Resume parsing: `parse` (resume.js:29–95)

```mermaid
flowchart TD
    T[Resume text from options/ via pdf.js] --> L[Split into lines; drop blanks]
    L --> S[Group lines under headings:<br/>Education, Experience, Skills…]
    L --> P[Whole text: email, phone, LinkedIn,<br/>GitHub, first other website]
    L --> N[First 4 lines: a 2–4 word capitalized line = name]
    S --> E{Education section found?}
    E -- yes --> E1[Search it for school, degree, major, GPA,<br/>'Expected' date or latest date]
    E -- no --> E2[Search all lines for school, degree, GPA;<br/>no graduation date]
    S --> K[Skills section text, up to 800 chars]
    P & N & E1 & E2 & K --> R["{values: {bankId: value}}"]
    R --> O[options/ shows each value for review;<br/>only ticked ones are saved]
```

Edge cases: an ALL-CAPS name is title-cased; a GPA without a scale is kept as is (e.g. "3.9"); nothing found shows "Nothing recognizable was found" in `options/`.

## 5. Starter questions over time (`defaults.js` + `background/`)

```mermaid
sequenceDiagram
    participant F as Firefox
    participant B as background.js
    participant S as storage.local
    F->>B: onInstalled (install or update)
    B->>S: get bank, seenDefaults
    alt no bank yet (first install)
        B->>S: bank = DEFAULT_BANK, seenDefaults = all ids
    else bank exists (update)
        B->>B: new = DEFAULT_BANK ids not seen before and not in bank
        B->>S: append new to bank, add all ids to seenDefaults
    end
    Note over B,S: Questions the user deleted stay deleted,<br/>because their ids are in seenDefaults
```

Caption: `options/` also falls back to `DEFAULT_BANK` if it opens before the background script has saved a bank.
