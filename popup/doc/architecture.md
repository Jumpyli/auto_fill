# Toolbar popup (`popup/`) — architecture

`popup/popup.html` (29 lines, layout and styles) + `popup/popup.js` (34 lines). The menu shown when the user clicks the add-on's toolbar icon.

## What it does

| Control | Action | Line |
|---|---|---|
| **Fill this page** | Sends `{type:"fill"}` to the active tab; shows "Filled X, Y to check, Z to answer yourself", "No form fields found", or "Can't fill this page…" | popup.js:8–18 |
| Status text | Explains it never submits; shows the Alt+Shift+A shortcut | popup.html:22 |
| **Save answers I typed to my bank** | Sends `{type:"learn"}`; shows "Saved N new answers" or "Fill the page first…" | popup.js:20–27 |
| **Open answer bank** | Opens `options/` in a tab and closes the popup | popup.js:29 |
| Count line | "N of M answers saved" from storage | popup.js:31–34 |

## Boundaries

| Owns | Uses (does not own) |
|---|---|
| The popup UI and its messages | `background/background.js` relays every request (`{type:"to-tab", tabId, payload}`) and injects the content script if needed |
| — | `content/fill.js` does the filling and learning, and draws the page panel |
| — | `storage.local` `bank` (read only) |

## Dependencies

| Dependency | Notes |
|---|---|
| `background/` | Must be running to relay messages |
| Firefox `tabs.query`, `runtime.sendMessage`, `runtime.openOptionsPage`, `storage.local` | — |

## Decisions

| Decision | Choice made | Alternatives | Why | Source |
|---|---|---|---|---|
| Route through the background script | Popup → background → tab | Popup sends to the tab directly | The background script can inject the content script and retry when the tab has none; one place handles that for both the popup and the shortcut | Development session, 2026-11-18 |
| Details live on the page, not in the popup | Popup shows counts only | Full results in the popup | The popup closes when focus leaves it; the page panel stays beside the fields it describes | Development session, 2026-11-18 |
| "Save answers I typed" in the popup too | Duplicate of the panel's **Save my new answers** | Panel only | Reason unknown — ask team | — |
| Light and dark theme | Follows the system setting | Light only | Reason unknown — ask team | — |

## Constraints

- **Message shapes are shared with `background/` and `content/`:** `{type:"to-tab", tabId, payload}` to the background script; payload `{type:"fill"}` returns `{good, check, missing, skip}`; `{type:"learn"}` returns `{learned}` or nothing. Change all three together.
