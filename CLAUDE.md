# Apply Autofill

Firefox add-on (Manifest V2) that fills job application forms from the user's own answer bank. It reads the page's HTML, fills text boxes, dropdowns (including site-built ones), radio buttons, checkboxes and resume uploads, outlines each field green/yellow/red, and learns answers the user types. **It never submits**, and it always leaves agreements and signatures to the user. v1 uses no AI model (`TODO(v2, local model)` in `lib/match.js`). Everything stays in the browser.

## Components

Each component has a `doc/` folder beside its code: `architecture.md`, `workflow-diagram.md`, `update-history.md`, `backlog.md`, `test-suite.md`.

| Component | Code | Docs | Job |
|---|---|---|---|
| Form filler | `content/fill.js` | [`content/doc/`](content/doc/) | Finds questions on the page, fills them, results panel, learning |
| Shared logic | `lib/match.js`, `lib/defaults.js`, `lib/resume.js` | [`lib/doc/`](lib/doc/) | Question matching and option picking; starter questions; resume parsing |
| Answer bank page | `options/` | [`options/doc/`](options/doc/) | Edit the bank, resume import with review, import/export, settings |
| Toolbar popup | `popup/` | [`popup/doc/`](popup/doc/) | Fill / Save typed answers / Open answer bank |
| Extension shell | `background/background.js`, `manifest.json` | [`background/doc/`](background/doc/) | Permissions and entry points, install/update seeding, message relay, injection, shortcut |

Not components: `test/` (referenced from each `test-suite.md`) and `vendor/` (pdf.js 4.10.38, listed in `options/doc/architecture.md`).

## Commands

- `npm install` once, then `npm test`: matching/resume checks (`test/run.js`) and simulated-page tests (`test/dom/`, jsdom). No Firefox needed.
- `npx web-ext lint`: manifest and paths. Expect 0 errors.
- Try it: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → `manifest.json`; after code changes click **Reload**.

## Standing rules

- Before changing a component, read its `doc/` folder first, especially `architecture.md` and `update-history.md`.
- After changing a component, update its `doc/` files in the same task (new decisions, history entry, backlog, test cases, diagrams if the flow changed).
- Never reverse a decision listed in `architecture.md` or `update-history.md` without asking the user first.
- Commit each fix with a message that says **why**, so future history entries can come straight from `git log`.
