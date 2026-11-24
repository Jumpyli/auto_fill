# Answer bank page (`options/`) — backlog

There are no TODO/FIXME/HACK comments in `options/` (checked with grep).

## Bugs and risks

| Priority | Item | Where | Details |
|---|---|---|---|
| High | **An open bank page can undo "Save my new answers"** | `saveSoon`, options.js:25–32; start, options.js:202–203 | The page loads the bank once and always saves its whole in-memory copy. If the form filler saves learned answers (or `background/` adds starter questions) while the page is open, the next edit on the page writes the old copy back and those answers are lost. Fix: listen to `browser.storage.onChanged` and merge, or reload the bank before saving |
| Med | Firefox versions below 160 untested for resume reading | `vendor/pdf.min.mjs` | `manifest.json` allows Firefox ≥ 115. pdf.js 4.10.38's modern build has only been run on Firefox 160 here. Test on Firefox ESR, or switch to pdf.js's legacy build |
| Low | Import treats a different question with the same id as the same entry | options.js:188 | Imports from another person's or a much older bank could update the wrong answer |
| Low | Import doesn't bring in other wordings for existing questions | options.js:189 | Only answers are updated |
| Low | "Add question" twice selects the first "New question" | options.js:73–75 | Finds the entry by its placeholder text |
| Low | Delete's "Confirm" state never resets | options.js:59–61 | A later accidental click deletes without a fresh warning |
| Low | Saving the setting replaces the whole `settings` object | options.js:77 | Fine with one setting; a second setting would be wiped |

## Tech debt

| Priority | Item |
|---|---|
| Low | `web-ext lint` warns about `eval` inside the bundled pdf.js files (not our code). It may matter for add-on signing review |
| Low | The whole bank is rewritten on every keystroke pause; fine at today's size (about 50 entries) |

## Possible improvements

| Priority | Item |
|---|---|
| Med | Let the user tick which resume values to save when they already have an answer, with a side-by-side view (today: one line "You already have: …") |
| Low | Extract experience and project blurbs from the resume (see `lib/doc/backlog.md`) |
| Low | Show learned entries' source (which company's form) to make cleanup easier |
