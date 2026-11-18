# Answer bank page (`options/`) — update history

`git log --follow` on `options/options.js` and `options/options.html` shows one commit: `2619e31` "Initial commit" (2026-11-18), which already contains everything below. Reasons come from the development session (source: "Development session, 2026-11-18").

| # | Date | What changed | Why | Source |
|---|---|---|---|---|
| 1 | 2026-11-18 | **Page built:** bank editor with autosave, resume import with review, import/export, overwrite setting | The user found application questions repetitive and wanted to answer each once. They also asked for a resume upload that fills the bank | Development session, 2026-11-18 |
| 2 | 2026-11-18 | **Resume crash fixed:** pdf.js gets a copy of the bytes; the file is saved before reading | The first real upload failed with "Couldn't read that file…" on a normal PDF. Cause: pdf.js handed the bytes to its worker, emptying the original, and the later save crashed ("detached ArrayBuffer"). Reproduced in Node before fixing | Development session, 2026-11-18 (user bug report) |
| 3 | 2026-11-18 | **Specific error messages** for save failure, read failure (with the reason) and no readable text | The generic message blamed the user's PDF for an add-on bug and hid the real error | Development session, 2026-11-18 |

## Reversed decisions (don't undo these)

| Original choice | Reversed to | Reason | Don't go back because |
|---|---|---|---|
| Parse the PDF, then save the same buffer | Save first; parse a copy | The original buffer is emptied by pdf.js | The upload crashes on every PDF |
| One catch-all error: "Couldn't read that file. If it's a scanned image…" | Separate messages with the real reason | The message was wrong and hid the bug | Users and future debugging lose the real cause |
