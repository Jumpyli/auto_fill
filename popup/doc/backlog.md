# Toolbar popup (`popup/`) — backlog

There are no TODO/FIXME/HACK comments in `popup/` (checked with grep).

| Priority | Type | Item | Where | Details |
|---|---|---|---|---|
| Med | Bug | Every error is described as "Firefox doesn't let add-ons run on its own pages…" | popup.js:15–16 | An injection or script failure on a normal site shows the same wrong reason |
| Low | Bug | The counts come from only one frame | popup.js:11–13 | On pages with forms in several frames, other frames' counts are missing (see `background/doc/backlog.md`) |
| Low | Bug | `skip` count isn't shown | popup.js:13 | Fields left alone on purpose (agreements, already filled) aren't mentioned |
| Low | Improvement | The count line doesn't update while the popup is open | popup.js:31–34 | Read once on open |
| Low | Improvement | Show "N to check" with a hint to look at yellow fields | popup.js:13 | — |
