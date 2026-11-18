# Extension shell (`background/` + `manifest.json`) — architecture

`background/background.js` (36 lines) and the root `manifest.json` (27 lines). The glue: what Firefox loads, with which permissions, and how a "fill" request gets from the popup or keyboard to the page.

## What it does

- **`manifest.json`**: declares the add-on (Manifest V2), its permissions, the popup, the answer bank page, the content scripts and the Alt+Shift+A shortcut.
- **`background.js`**:
  1. On install, seeds the answer bank with the starter questions. On update, adds starter questions that are new since last time (lines 2–14).
  2. Relays `{type:"to-tab"}` messages from the popup to the page's content script (lines 34–36).
  3. If the page has no content script yet, injects `lib/match.js` and `content/fill.js` into all frames and retries (lines 16–26).
  4. Runs the keyboard shortcut: sends "fill" to the active tab (lines 28–32).

## Boundaries

| Owns | Uses (does not own) |
|---|---|
| Permissions, entry points, load order of scripts | `DEFAULT_BANK` from `lib/defaults.js` (loaded first via `background.scripts`) |
| `storage.local` keys `seenDefaults`; initial `bank` and `settings` | The content script's `fill`/`learn` handlers (`content/`) |
| Message relay and on-demand injection | The popup UI (`popup/`) and the answer bank page (`options/`) |

## `manifest.json` entries

| Entry | Value | Purpose |
|---|---|---|
| `manifest_version` | 2 | See decisions |
| `browser_specific_settings.gecko` | id `apply-autofill@local`, `strict_min_version` 115.0 | Stable id (storage is tied to it); minimum Firefox |
| `permissions` | `storage`, `unlimitedStorage`, `tabs`, `<all_urls>` | Bank storage; room for the resume file; tab access; run on any site and frame |
| `background.scripts` | `lib/defaults.js`, `background/background.js` | Order matters: defaults first |
| `browser_action.default_popup` | `popup/popup.html` | Toolbar menu |
| `options_ui` | `options/options.html`, open in a tab | Answer bank page |
| `content_scripts` | `<all_urls>`, `all_frames: true`, `document_idle`, `lib/match.js` then `content/fill.js` | Form filler in every page and frame; order matters |
| `commands.fill-page` | Alt+Shift+A | Fill without opening the popup |

## Dependencies

| Dependency | Notes |
|---|---|
| Firefox WebExtension APIs | `runtime`, `storage`, `tabs` (`sendMessage`, `executeScript`, `query`), `commands` |
| Firefox ≥ 115 (declared) | Developed and tested on 160 |
| `lib/defaults.js` | Must load before `background.js` |

## Decisions

| Decision | Choice made | Alternatives | Why | Source |
|---|---|---|---|---|
| Browser | Firefox add-on | Chrome extension | The user uses Firefox | Development session, 2026-11-18 |
| Manifest version | **MV2** | MV3 | MV2 grants host access at install, so content scripts run in cross-origin iframes (e.g. a Greenhouse form embedded on a company site). In Firefox MV3, host access is opt-in per site, and `activeTab` doesn't cover cross-origin frames. Firefox still supports MV2 | Development session, 2026-11-18 |
| Content script on every page | Declared for `<all_urls>`, all frames; does nothing until asked | Inject only on click | Works inside embedded application iframes; costs little because the script waits for a message | Development session, 2026-11-18 |
| On-demand injection | Retry after injecting into all frames when `sendMessage` fails | Ask the user to reload the tab | Tabs opened before install/reload have no content script. The content script's load guard prevents double loading | Comment background.js:16; development session, 2026-11-18 |
| Starter questions on update | Add only ids never seen before (`seenDefaults`); never re-add deleted ones | Re-seed; or never add new ones | New starter questions (e.g. the Defense section) must reach existing banks without overwriting answers or reviving questions the user deleted | Comment background.js:2; development session, 2026-11-18 |
| Background script location | `background/background.js` (moved from the root) | Root, with a root `doc/` | So the shell has its own `doc/` folder beside its code; a root `doc/` would look project-wide | User decision, 2026-11-18 (commits `c788755`, `81f9dc0`) |
| Shortcut | Alt+Shift+A | Reason for this exact key unknown — ask team | — | — |

## Constraints (don't "fix" these without checking)

- **Don't move to MV3 without a plan for iframes and host permissions.** It also changes background scripts to event pages and `tabs.executeScript` to `scripting.executeScript`.
- **Never change `gecko.id`.** Firefox ties `storage.local` (the user's whole bank and resume) to it; a new id starts with an empty bank.
- **Keep script order:** `lib/defaults.js` before `background.js`; `lib/match.js` before `content/fill.js`, in both the manifest and `sendToTab` (background.js:21).
- **Paths in the manifest must match the files.** After any move, run `npx web-ext lint` and load the add-on once. The move of `background.js` without updating the manifest left `main` broken until commit `81f9dc0`.
