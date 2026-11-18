# Form filler — backlog

There are no TODO/FIXME/HACK comments in `content/fill.js` (checked with grep). These items come from code review and real-site testing.

## Bugs and risks

| Priority | Item | Where | Details |
|---|---|---|---|
| Med | **Confirm Lockheed (Eightfold) dropdowns on a fresh application** | `fillCombo` in fill.js | After the own-menu fix (history #14), the Veteran Status menu opened and an option was picked on the real page (2026-11-18). So the earlier failure was the leftover-menu bug, and clicking the arrow button isn't needed. Sponsorship and Visa status were already set, so their menus weren't exercised; check them on a new application |
| Med | Radio buttons without a `name` attribute each become their own one-option group | `collect()` in fill.js | The group key falls back to `Math.random()`. Custom-built radio groups without names would be read as separate questions |
| Low | Outline lookups can throw on unusual markup | fill.js:341, 358 | `parentElement.parentElement` can be null. The error is caught (line 466), but the field shows "Couldn't fill this one automatically" instead of being filled |
| Low | A file field's outline can cover a large area | fill.js:289 | `closest("div")` may be a big wrapper |
| Low | Native `<select>` options starting with "Select/Choose/Please" are treated as placeholders | fill.js:331 | A real option worded like "Please contact me" would be ignored |
| Low | Follow-up detection only looks at the start of the label | lib/match.js `isFollowUp` | "Former employees: if yes, enter ID" isn't detected |

## Tech debt

| Priority | Item | Where |
|---|---|---|
| Low | `web-ext lint` warns "Unsafe assignment to innerHTML" | fill.js:391. Only constants and counts are inserted, and the message text goes in via `textContent`. Build the panel with DOM calls if this blocks signing |
| Low | The popup shows counts from only the first frame that answers | Each frame draws its own panel; summed counts would need the background script to collect from every frame |
| Low | `fill.js` is one 530-line file | Could split into reading / writing / dropdowns / panel. Must stay classic scripts (see architecture constraints) |

## Possible improvements

| Priority | Item |
|---|---|
| High | Local matching model (small embedding model in the browser, or Ollama) for questions reworded with no shared words. v1 uses no model, though the original design called for one. Marked in code as `TODO(v2, local model)` in `lib/match.js` (`matchQuestion`) |
| Med | Workday support: multi-page flow, its own dropdown widgets |
| Med | Let "Save my new answers" also learn from yellow and green fields the user changed (it currently learns only from red and follow-up fields) |
| Low | Make each custom dropdown faster. Each one waits up to about 2.8 s when its menu is slow or missing |
| Low | Local LLM to choose options when the saved answer and the option wording differ a lot. `TODO(v2, local model)` in `lib/match.js` (`pickOption`) |
