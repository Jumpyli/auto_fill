# Answer bank page (`options/`) — architecture

`options/options.html` (95 lines, page and styles) + `options/options.js` (207 lines, ES module). Opened from the popup's **Open answer bank** or Firefox's add-on settings. Runs as an extension page, not on websites.

## What it does

- Edit the answer bank: search, edit questions, other wordings and answers, add and delete questions. Saves automatically.
- Resume: read a PDF or text resume locally, show what was found for review, save only the ticked answers. Also keeps the file so the form filler can attach it to "Resume/CV" upload fields.
- The **Replace answers already typed on a form** setting.
- Back up or move the bank: export and import JSON.

## Boundaries

| Owns | Uses (does not own) |
|---|---|
| The page UI and its autosave | `browser.storage.local` keys `bank`, `resume`, `settings`. Also written by `background/` (bank on install/update) and `content/` (bank via "Save my new answers") |
| Turning a PDF into text (pdf.js) | `ResumeParser.parse` from `lib/resume.js` (text → answers) |
| The review step before resume answers are saved | `DEFAULT_BANK`, `CATEGORIES` from `lib/defaults.js` |
| JSON import/export format `{bank: [...]}` | `vendor/pdf.min.mjs` + `vendor/pdf.worker.min.mjs` |

## Key parts of `options.js`

| Lines | Part | Purpose |
|---|---|---|
| 1–3 | pdf.js import | Loads pdf.js and points it at its worker file inside the add-on |
| 23–32 | `saveSoon` | Writes the whole `bank` 400 ms after the last edit, then flashes "Saved" |
| 34–77 | Bank editor | `render` (sections, search filter, "x/y answered"), `entryRow` (question, other wordings, answer, two-click Delete), Add question, the overwrite setting |
| 79–96 | `toBase64`, `pdfText` | File → base64 for storage; PDF → text, giving pdf.js its own copy of the bytes |
| 98–125 | Resume upload | Save the file first, then read its text, then check it has text, then parse |
| 127–159 | Review | Shows each found value with a checkbox (pre-ticked only where the answer is empty); saves ticked, non-empty values |
| 161–169 | Resume status / remove | "Attached to forms: …" and **Remove resume** |
| 171–199 | Export / import | Download `answer-bank.json`; import merges by id or same question text |
| 201–207 | Start | Load storage; use `DEFAULT_BANK` if there's no bank yet; draw the page |

## Storage shapes

| Key | Shape |
|---|---|
| `bank` | `[{id, cat, q, aliases: [string], a}]` |
| `resume` | `{name, type, data}`: `data` is the file as base64 |
| `settings` | `{overwrite: boolean}` |

## Dependencies

| Dependency | Version | Notes |
|---|---|---|
| pdf.js (`pdfjs-dist`) | **4.10.38**, modern build (`build/pdf.min.mjs`) | Bundled in `vendor/`; extensions can't load code from the internet. Apache 2.0 (`vendor/LICENSE`) |
| `lib/defaults.js`, `lib/resume.js` | — | Loaded as plain `<script>` tags **before** the module (options.html:91–93) |
| Firefox | Tested on 160 | `manifest.json` says ≥ 115. pdf.js has not been tested below 160 (see backlog) |

## Decisions

| Decision | Choice made | Alternatives | Why | Source |
|---|---|---|---|---|
| Where the resume is read | In the browser with bundled pdf.js | Send it to an AI or online service | The resume stays on the user's computer; works offline | Development session, 2026-11-18 |
| Resume answers | Shown for review with checkboxes; existing answers unticked by default | Save everything found | Rule-based parsing makes mistakes; the user's own answers shouldn't be replaced silently | Development session, 2026-11-18 |
| pdf.js input | Pass a **copy** of the file's bytes (options.js:87–88), and save the file **before** reading it | Pass the original buffer | pdf.js transfers its input to a worker, which empties the original. Saving it afterwards crashed with "detached ArrayBuffer", shown to the user as "Couldn't read that file…" on a normal PDF | Development session, 2026-11-18 (user bug report); comment options.js:87 |
| Error messages | Separate messages for "couldn't save", "couldn't read text (reason)" and "no readable text (scanned?)" | One generic message | The generic message blamed the user's PDF for a bug in the add-on | Development session, 2026-11-18 |
| `isEvalSupported: false` | Turn off pdf.js's use of `eval` | Default | Extension pages don't allow `eval` | Development session, 2026-11-18 |
| Saving | Autosave the whole bank 400 ms after typing | A Save button; save each entry separately | Nothing to forget; the bank is small | Development session, 2026-11-18 |
| Delete | Two clicks (Delete → Confirm) on the page | `confirm()` dialog | Reason unknown — ask team | — |
| Import | Merge: same id or same question text updates the answer; others are added | Replace the whole bank | A partial or older export must not wipe newer answers | Development session, 2026-11-18 |
| Script loading | `lib/` files as plain `<script>`, `options.js` as a module | All modules | `lib/` must stay classic scripts for the content script (see `lib/doc/architecture.md`); `options.js` needs `import` for pdf.js | Code (options.html:91–93) |

## Constraints (don't "fix" these without checking)

- **Don't pass the original buffer to pdf.js or read it after `pdfText`.** It reintroduces the resume crash.
- **Keep the `<script>` order in options.html:** `defaults.js` and `resume.js` before `options.js`. The module uses their globals.
- **pdf.js must stay bundled in `vendor/`.** Add-ons can't load remote code. If you upgrade it, copy both `pdf.min.mjs` and `pdf.worker.min.mjs` from the same version.
- **The export format `{bank: [...]}` is what import reads** (a bare array is also accepted). Changing it breaks existing backups.
