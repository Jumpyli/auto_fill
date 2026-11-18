# Form filler — workflows

Line numbers refer to `content/fill.js`.

## 1. Main flow: "Fill this page"

The user clicks **Fill this page** (or presses Alt+Shift+A). Every frame with fields fills itself and draws its own panel. The popup shows the counts from whichever frame answers first.

```mermaid
sequenceDiagram
    actor U as User
    participant P as Popup / shortcut
    participant B as background.js
    participant C as fill.js (each frame)
    participant S as storage.local
    U->>P: Fill this page
    P->>B: {type:"to-tab", payload:{type:"fill"}}
    B->>C: tabs.sendMessage {type:"fill"}
    C->>C: collect() fields
    alt no fields in this frame
        C-->>B: (no answer)
    else fields found
        C->>S: get bank, resume, settings
        C->>C: handle() each field
        C->>C: fillCombo() each custom dropdown, one at a time
        C->>C: outline fields, renderPanel()
        C-->>B: counts {good, check, missing, skip}
    end
    B-->>P: first answer
    P-->>U: "Filled X, Y to check, Z to answer yourself"
```

## 2. Script missing on the page (opened before install, or after a reload)

```mermaid
sequenceDiagram
    participant B as background.js
    participant C as Page
    B->>C: tabs.sendMessage
    C--xB: error: no listener
    B->>C: executeScript lib/match.js (all frames)
    B->>C: executeScript content/fill.js (all frames)
    Note over C: Load guard (line 4) stops a double load
    B->>C: tabs.sendMessage again
```

If the page is a Firefox page or the add-ons store, injection fails and the popup says "Can't fill this page."

## 3. One field: `handle()` decisions (lines 263–347)

```mermaid
flowchart TD
    A[Field] --> F{File input?}
    F -- yes --> F1{Label says resume/CV,<br/>not cover letter?}
    F1 -- no --> SK1[skip: attach it yourself]
    F1 -- yes --> F2{File already attached<br/>and overwrite off?}
    F2 -- yes --> SK2[skip]
    F2 -- no --> F3{Resume saved?}
    F3 -- no --> M1[missing: add resume in bank]
    F3 -- yes --> F4{Upload worked?}
    F4 -- no --> M2[missing: site blocked upload]
    F4 -- yes --> CK1[check: attached]
    F -- no --> C{Agreement or signature?<br/>any field type}
    C -- yes --> SK3[skip: answer yourself]
    C -- no --> E{Already has a value<br/>and overwrite off?}
    E -- yes --> SK4[skip: left as is]
    E -- no --> L[lookup: match label to bank<br/>+ autocomplete/name hints for text]
    L --> FU{Starts with 'If you answered…'<br/>and score < 0.99?}
    FU -- yes --> SK5[skip, learnable]
    FU -- no --> NM{score ≥ 0.55?}
    NM -- no --> M3[missing: no matching question]
    NM -- yes --> EA{Saved answer empty?}
    EA -- yes --> M4[missing: answer is empty]
    EA -- no --> K{Field kind}
    K -- custom dropdown --> PD[pending → flow 4]
    K -- text --> T[set value → good/check<br/>check if longer than maxlength]
    K -- select / radio --> YN{All options yes/no<br/>but answer isn't?}
    YN -- yes --> M8[missing: yes/no question,<br/>choose one and save]
    YN -- no --> O{Option score ≥ 0.6?}
    O -- no --> M5[missing: no option fits]
    O -- yes --> O2[select it → good if both scores high, else check]
    K -- single checkbox --> Y{Answer is yes/no?}
    Y -- no --> M6[missing]
    Y -- yes --> Y2[check or uncheck → good/check]
    K -- checkbox list --> CL{Any option matches<br/>a comma-separated part?}
    CL -- no --> M7[missing]
    CL -- yes --> CK2[tick matches → always check]
```

Any exception inside `handle()` turns that field into **missing: "Couldn't fill this one automatically"** (line 444). The other fields continue.

## 4. Custom dropdown: `fillCombo()` (lines 198–237)

```mermaid
flowchart TD
    S{Already shows the answer?} -- yes --> G0[good/check, not opened]
    S -- no --> A[Scroll to and focus the dropdown]
    A --> B[Press: pointer + mouse + click events]
    B --> C{Menu options appear<br/>within 0.8s?}
    C -- no --> D[Send ArrowDown key] --> E{Options within 0.8s?}
    C -- yes --> P
    E --> P{Best option score ≥ 0.6?}
    P -- no, and it's a text input --> T[Type the answer to filter the list] --> T2{Options within 1.2s<br/>and score ≥ 0.6?}
    P -- no, not an input --> X
    T2 -- no --> X[Escape; clear typed text if no menu appeared<br/>→ missing, with the reason:<br/>couldn't open the menu / no option matched<br/>+ HTML kept for Copy debug info]
    P -- yes --> K[Click the option]
    T2 -- yes --> K
    K --> W[Wait 150ms; Escape if the menu is still open]
    W --> V{Dropdown now shows the option?}
    V -- yes, and confident --> G[good]
    V -- yes, less confident --> CK[check]
    V -- no --> CK2[check: make sure it stuck]
```

A dropdown's menu is the element named by its `aria-controls`/`aria-owns`, and only that. Without a named menu, it's a visible `role="listbox"` that appeared after the dropdown was opened (`menuOptions`). Every exit closes the menu (Escape, blur) before the next dropdown starts. Only `role="option"` elements are clicked. If `fillCombo` throws, the field becomes **missing: pick it yourself** (line 449).

## 5. "Save my new answers": `learn()` (lines 471–498)

```mermaid
flowchart TD
    A[Each item from the last fill] --> B{Red, or a follow-up,<br/>and text/select/radio/custom dropdown?}
    B -- no --> Z[ignore]
    B -- yes --> C{User has entered a value<br/>and it's not a consent question?}
    C -- no --> Z
    C -- yes --> D{Bank already has this question?<br/>same entry id or same wording}
    D -- exact same question, answered --> Z
    D -- exact or matched question, answer empty --> E[Fill that answer]
    D -- matched a broader question, same answer --> Z
    D -- matched a broader question, different answer --> F
    D -- no match --> F[Add to 'Learned' with the form's exact wording]
    E --> G[Mark item green: saved]
    F --> G
    G --> H[Save bank once; redraw panel with 'Saved N new answers']
```

## 6. Clear highlights / close

The **×** button or **Clear highlights** restores each field's original outline and removes the panel (lines 357–361). Field values stay as filled.
