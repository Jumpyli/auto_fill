# Extension shell (`background/` + `manifest.json`) — test suite

Manual, in Firefox. **Automated checks:** `npx web-ext lint` (manifest and file paths; expect 0 errors, warnings only inside `vendor/` and one about the panel's `innerHTML`). `npm test` doesn't cover this component. Flow numbers refer to `workflow-diagram.md`.

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| SH-01 | Loads | `about:debugging` → Load Temporary Add-on → `manifest.json` | Loads without errors; the toolbar icon appears |
| SH-02 | First install seeds the bank (flow 1) | Fresh Firefox profile; load the add-on; open the answer bank | All starter questions, answers empty |
| SH-03 | Update adds new starter questions (flow 1) | With a filled bank, add a new id to `lib/defaults.js`; click **Reload** in `about:debugging` | The new question appears; existing answers unchanged |
| SH-04 | Deleted starter questions stay deleted (flow 1) | Delete a starter question; reload the add-on | It doesn't come back |
| SH-05 | Old bank gets the Defense section once (flow 1) | Bank saved by a version without `seenDefaults` and without Defense questions; reload | The Defense questions are added once; a second reload adds nothing |
| SH-06 | Fill via popup (flow 2) | Open an application; click **Fill this page** | The panel appears on the page; the popup shows the counts |
| SH-07 | Tab opened before loading (flow 2) | Open an application tab; reload the add-on; click Fill without reloading the tab | Fills normally (injected on demand); one panel only |
| SH-08 | Restricted page (flow 2) | Open `about:addons`; click Fill | Popup: "Can't fill this page…" |
| SH-09 | Embedded form (flow 2) | A company careers page with an embedded Greenhouse iframe; click Fill | The iframe's form fills |
| SH-10 | Shortcut (flow 3) | On an application, press Alt+Shift+A | Same result as SH-06, without opening the popup |
| SH-11 | Shortcut on a restricted page (flow 3) | On `about:addons`, press Alt+Shift+A | Nothing happens (known: no message, see backlog) |
| SH-12 | Paths after moving files | Run `npx web-ext lint` | 0 errors. (Guards against a repeat of the `c788755` path break) |
