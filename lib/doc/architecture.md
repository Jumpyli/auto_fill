# Shared logic (`lib/`) — architecture

Three small modules with no access to the page or the browser API: they take strings in and return values. Other components load them as plain scripts.

| Module | Global it defines | Job |
|---|---|---|
| `match.js` (91 lines) | `ApplyMatch` | Which bank question a form label is, which option fits a saved answer, and whether a question is an agreement or a follow-up |
| `defaults.js` (66 lines) | `DEFAULT_BANK`, `CATEGORIES` | The starter questions with other wordings, and the section order |
| `resume.js` (100 lines) | `ResumeParser` | Pulls bank answers out of resume text |

## Who uses what

| Module | Used by | How it's loaded |
|---|---|---|
| `match.js` | `content/fill.js` | Listed before `fill.js` in `manifest.json` `content_scripts`; also injected first by `background/background.js` `sendToTab` |
| `defaults.js` | `background/background.js` (seeds the bank on install; adds new starter questions on update); `options/` (fallback bank, section list) | `manifest.json` `background.scripts`; `<script>` in `options/options.html` |
| `resume.js` | `options/options.js` (after pdf.js has turned the PDF into text) | `<script>` in `options/options.html` |
| all three | `test/run.js`, `test/dom/` | `require()` through the `module.exports` guard at the end of each file |

**Boundaries:** `lib/` owns no storage, DOM or UI. It never reads the answer bank itself; callers pass it in. PDF reading (pdf.js) belongs to `options/`, not `resume.js`.

---

## `match.js`

### Key parts

| Lines | Part | Purpose |
|---|---|---|
| 4–5 | `GOOD` = 0.8, `MAYBE` = 0.55 | Confidence cutoffs: ≥ GOOD fills green, ≥ MAYBE fills yellow, lower doesn't fill |
| 7–15 | `STOP`, `clean`, `norm`, `stem`, `tokens` | Text cleanup: drops "*", "(required)", apostrophes, punctuation and filler words; strips plural "s" |
| 17–36 | `similarity(label, phrasing)` | Score 0–1 for one bank phrasing against a form label (see the rules below) |
| 42–52 | `matchQuestion(label, bank)` | Best bank entry over every question and its other wordings. **Entries with empty answers still match**, so the form filler can say "that answer is empty" |
| 54–79 | `pickOption(answer, options)` | Best option for a saved answer: exact text, "decline to answer" wording, yes/no, then word overlap |
| 81–83 | `isConsent(label)` | Agreements and signatures; the form filler never fills these |
| 85–86 | `isFollowUp(label)` | "If you answered…", "If yes…", "If so…" questions |

### `similarity` rules, in order

| Rule | Score |
|---|---|
| Same text after cleanup | 1.0 |
| Phrasing starts with `=` and the text isn't identical | 0 (exact-only phrasing) |
| The phrasing (2+ words) appears word for word in the label | 0.92 |
| Every word of a 2+ word phrasing appears in the label | 0.88 |
| Every word of a 1-word phrasing appears | 0.6 + 0.4 ÷ (words in the label) |
| Otherwise | Dice overlap: 2 × shared words ÷ (label words + phrasing words) |

### `pickOption` rules, per option

| Case | Score |
|---|---|
| Same text | 1.0 |
| Answer says decline / prefer not / don't wish… | 0.9 for options saying the same, else 0 |
| Answer and option both start with yes/no | 0.95 if they agree, else 0 |
| Answer is yes/no and there are ≤ 4 options | 0.7 for the option whose negation ("not", "don't"…) agrees with the answer |
| Otherwise | 0.95 × best `similarity` in either direction |

## `defaults.js`

- Each entry: `id`, `cat`, `q`, `aliases` (other wordings; `=` prefix means exact-only), `a` (answer, starts empty).
- Sections: Basics, Education, Logistics, **Defense** (citizenship, clearance, ITAR, drug test, Lockheed's recent-graduate question), Short answers, Disclosures, plus Learned (filled by the form filler).

## `resume.js`

- `parse(text)` returns `{values: {bankId: value}}`. It never writes the bank: `options/` shows each value for review first.
- It splits the text into sections by headings (Education, Experience, Skills…), then uses patterns for email, phone, LinkedIn, GitHub, website, name, school, degree, major, GPA, graduation date and skills.

## Dependencies

| Dependency | Notes |
|---|---|
| None external | Plain JavaScript; runs in the browser and in Node |
| Node ≥ 18 for tests | `test/run.js` uses `require`; developed on Node 25 |

## Decisions

| Decision | Choice made | Alternatives | Why | Source |
|---|---|---|---|---|
| How questions are matched (v1) | Word overlap and phrase rules, no AI model | Small in-browser embedding model; local LLM via Ollama (the user's original idea was a light local model) | Simple and predictable for v1. For one company's repeated form, the form filler's learning covers most gaps. Marked `TODO(v2, local model)` at match.js:38 and :58 | Development session, 2026-11-18 |
| Confidence cutoffs | GOOD 0.8, MAYBE 0.55 | Other values | Chosen so the test labels in `test/run.js` land right: real matches ≥ 0.8; "Company name of your reference" and "Favorite color" stay below GOOD. **Reason for the exact numbers beyond that: unknown — ask team** | Development session, 2026-11-18; `test/run.js` |
| One-word phrasings on long labels | Score falls with label length (0.6 + 0.4/n) | Full credit (0.88) | A single word like "name" would otherwise match "Company name…" confidently | Comment match.js:31; development session, 2026-11-18 |
| Exact-only phrasings | `=` prefix (e.g. `=name`, `=company`) | Leave single generic words out entirely | Lets a form label that is exactly "Name" match without "name" matching every label containing it | Comment in defaults.js line 2; development session, 2026-11-18 |
| Phrase containment rule | Needs 2+ **words** in the phrasing, not 2+ meaningful words | Count meaningful words | "how did you hear about" shrinks to one meaningful word ("hear") after filler words are removed, which would have blocked the strong phrase match | Development session, 2026-11-18 |
| Yes/no against long option lists | Negation heuristic only when ≤ 4 options | Always | With many options (e.g. 50 states), a "Yes" answer would give every non-negated option 0.7 and pick the first | Development session, 2026-11-18 |
| "Decline to answer" synonyms | Treated as one meaning (`DECLINE`) | Word overlap | "Decline to self-identify" and "I don't wish to answer" share no words | Development session, 2026-11-18; `test/run.js` |
| Agreement and signature list | Fixed phrase list (`isConsent`) incl. "please sign", "sign by" | Leave to word matching | The user must agree or sign personally. "Please sign by typing your full legal name" (Lockheed) was missed by the first list and would have received the full-name answer | Development session, 2026-11-18 (Lockheed screenshot) |
| Follow-up detection | Label **starts with** "if you answered/selected", "if yes/no/so/applicable", "please explain/specify/describe if" | Anywhere in the label | Only start-of-label patterns were seen (Lockheed's employee-ID question). Narrow on purpose to avoid skipping normal questions | Development session, 2026-11-18 |
| Module format | `var X = (() => …)()` + `if (typeof module …) module.exports` | ES modules | Firefox MV2 content scripts and the options page's plain `<script>` tags share globals; Node tests use `require`. One file works in all three | Code; development session, 2026-11-18 |
| Resume parsing | Rule-based, offline, shown for review before saving | Send the resume to an AI service | Keeps the resume on the user's computer; mistakes are caught in the review step | Development session, 2026-11-18 |
| Major from degree | Prefer "… **in** X"; use "of X" only when X isn't Science/Arts/Engineering | First "in/of" | "Master of Science in Computer Science" gave "Science in Computer Science" in the first test run | Development session, 2026-11-18 (failing test) |
| Defense section | Added 8 defense/government questions with Lockheed's exact wordings as other wordings | Leave to learning | The user is focused on Lockheed Martin; these appear on every defense application | Development session, 2026-11-18 |

## Constraints (don't "fix" these without checking)

- **Keep `var` and the IIFE + `module.exports` shape.** ES modules break the content script (classic scripts sharing globals) and the options page's plain `<script>` tags.
- **Never rename or reuse a `DEFAULT_BANK` id.** `background/background.js` adds new starter questions on update by id and remembers ids it has seen (`seenDefaults`). A renamed id shows up as a duplicate, and a reused id never gets added for existing users.
- **Every `cat` used in `DEFAULT_BANK` must be in `CATEGORIES`**, or the options page lists it last as an unknown section.
- **`isFollowUp` is used with a 0.99 threshold in `content/fill.js`.** Making it match more labels makes more questions manual-only.
- **Changing `GOOD`, `MAYBE` or any score changes colors and fills everywhere.** Run `npm test` and check `test/run.js` cases after any change.
