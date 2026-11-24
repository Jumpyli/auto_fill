# Extension shell (`background/` + `manifest.json`) — update history

Sources: `git log --follow` on `background/background.js` and `manifest.json`, plus the development session (source: "Development session, 2026-11-18").

| # | Date | What changed | Why | Source |
|---|---|---|---|---|
| 1 | 2026-11-18 | **Firefox MV2 add-on** with content scripts in all frames, popup, options page, Alt+Shift+A | The user uses Firefox; MV2 gives host access at install for cross-origin iframes | Development session, 2026-11-18; `2619e31` |
| 2 | 2026-11-18 | **On-demand injection** in `sendToTab` | Tabs opened before the add-on loaded couldn't be filled | Development session, 2026-11-18; `2619e31` |
| 3 | 2026-11-18 | **Starter questions added on update** (`seenDefaults`) | The Defense section had to reach the user's existing bank without overwriting answers or reviving deleted questions | Development session, 2026-11-18; `2619e31` |
| 4 | 2026-11-18 | **`background.js` moved into `background/`** | Give the shell its own `doc/` folder beside its code (user chose this over a root `doc/`) | User decision, 2026-11-18; `c788755` |
| 5 | 2026-11-18 | **Manifest path fixed** to `background/background.js`; `.DS_Store` ignored | Commit `c788755` moved the file without the manifest line, so the background script didn't load on `main` (no bank seeding, no shortcut, no relay) | `81f9dc0` |

## Reversed decisions (don't undo these)

| Original choice | Reversed to | Reason | Don't go back because |
|---|---|---|---|
| `background.js` at the repo root | `background/background.js` | Docs live beside each component's code | A root `doc/` would read as project-wide docs |
| Re-seed only when there is no bank | Also add never-seen starter questions on update | Existing banks never got new starter questions | Users miss new questions such as the Defense section |
