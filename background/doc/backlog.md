# Extension shell (`background/` + `manifest.json`) — backlog

There are no TODO/FIXME/HACK comments in `background/` or `manifest.json` (checked with grep).

## Bugs and risks

| Priority | Item | Where | Details |
|---|---|---|---|
| Med | Declared minimum Firefox (115) is untested | manifest.json:7 | Only Firefox 160 was used. Test on ESR or raise the minimum |
| Med | The keyboard shortcut fails silently | background.js:31 | `.catch(() => {})`: on a restricted page or an error, nothing tells the user |
| Low | Starter-question update and an open bank page can race | background.js:13 | The bank page saves its in-memory copy (see `options/doc/backlog.md`, high) and can drop the newly added questions |
| Low | The popup sees only the first frame's answer | background.js:19 | `tabs.sendMessage` resolves with one frame's reply; other frames' counts are only in their own panels |
| Low | Injection errors are swallowed | background.js:22 | A real failure looks the same as "restricted page" |

## Tech debt

| Priority | Item |
|---|---|
| Low | The `tabs` permission may be unnecessary (`tabs.query` for the active tab, `sendMessage` and `executeScript` work with host permissions). Removing it would shrink the install prompt. Not verified |
| Low | MV2 will need a migration plan if Firefox ever ends MV2 support |

## Possible improvements

| Priority | Item |
|---|---|
| Med | Show a short notification when the shortcut can't fill a page |
| Low | Collect counts from every frame and add them up for the popup |
