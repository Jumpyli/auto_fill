# Form filler — architecture

`content/fill.js` (one file, about 560 lines). A content script injected into every page and frame.

## What it does

When asked to, it finds the questions on an application page, fills them from the answer bank, outlines each field by confidence, and shows a results panel. Separately, it saves answers the user typed into fields it couldn't fill.

**It never submits.** It never clicks a button, link, or anything other than form controls and `role="option"` menu items, and never sends Enter.

## Boundaries

| Owns | Calls / reads (does not own) |
|---|---|
| Finding fields and their question text on the page | `ApplyMatch` from `lib/match.js`: label matching, option picking, consent and follow-up detection |
| Writing values in a way page frameworks (React and similar) accept | `browser.storage.local` keys `bank`, `resume`, `settings`. These are written by `options/` and `background/`; this component only writes `bank` (in `learn()`) |
| Driving custom dropdowns (role=combobox → role=listbox) | Messages `{type:"fill"}` and `{type:"learn"}` sent by `background/background.js`, relayed from `popup/` or the keyboard shortcut |
| Field outlines and the results panel | — |
| "Save my new answers" (learning) | — |

## Key parts of `fill.js`

| Lines | Part | Purpose |
|---|---|---|
| 3–5 | Load guard | `window.__applyAutofillLoaded` stops a double load when `background/` re-injects the script |
| 13–86 | Reading the page | `labelFor` (question text for one field), `optionText` (radio/checkbox label), `groupQuestion` (question text for a radio/checkbox group) |
| 88–125 | `collect()` | Lists every fillable field in document order: text, select, radio group, checkbox group, single checkbox, file, custom dropdown |
| 127–151 | Writing to the page | `setValue`, `setChecked`, `attachFile` |
| 153–262 | Custom dropdowns | `fillCombo`: open the menu, pick the closest option, close it, then confirm the choice stuck. On failure it records the reason and HTML for **Copy debug info** |
| 264–382 | Decisions | `hintId` (autocomplete/name attribute hints), `lookup`, `handle` (one field to a status: good/check/missing/skip) |
| 384–471 | Results panel | Outlines, the panel in a closed shadow root, and the Copy debug info button |
| 473–495 | `fill()` | Runs `handle` on every field, then custom dropdowns one at a time, then draws the results |
| 497–551 | `currentValue()` + `learn()` | Saves answers typed into red or follow-up fields, or changed in any field after Fill, to the bank. `learnMessage` words the result |
| 553–560 | Message listener | Answers `fill` and `learn` requests |

## Item statuses (shown as outline and panel color)

| Status | Color | Meaning |
|---|---|---|
| `good` | green | Filled from a confident match (question score ≥ 0.8, option score ≥ 0.85) |
| `check` | yellow | Filled, but the user should look: a weaker match, file attached, checkbox list, answer longer than the box, or the dropdown pick couldn't be confirmed |
| `missing` | red | Not filled: no match, empty answer, no fitting option, or an error |
| `skip` | none | Deliberately left alone: already filled, consent/signature, other file uploads, follow-up questions |

## Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `lib/match.js` | internal | Must load **before** `fill.js`. It defines the global `var ApplyMatch`. The order is fixed in `manifest.json` and in `background/background.js` `sendToTab` |
| `browser.*` WebExtension API | external (Firefox) | `runtime.onMessage`, `storage.local` |
| DOM APIs | browser | `DataTransfer` (resume upload), `attachShadow`, `PointerEvent`/`MouseEvent`/`KeyboardEvent` |
| Firefox ≥ 115 | platform | Set by `strict_min_version` in `manifest.json`. Developed against Firefox 160 |

## Decisions

| Decision | Choice made | Alternatives | Why | Source |
|---|---|---|---|---|
| How to see the form | Read the page's HTML structure (labels, inputs, ARIA roles) | A local vision model screenshots and scrolls the screen (the user's original idea) | Exact question and option text, no scrolling, much faster and lighter than a vision model | Development session, 2026-11-18 |
| Submitting | Never click buttons or press Enter. Custom dropdowns click only `role="option"` items inside the open menu | Auto-advance or submit | User requirement: the AI must not submit by accident; the user reviews first | Development session, 2026-11-18; comments at fill.js:1–2, 155 |
| Setting values | Prototype `value` setter + `input`/`change`/`blur` events (fill.js:128–136) | `el.value = x` | React and similar frameworks ignore direct assignment and drop the value | Code comment fill.js:128 |
| Existing values | Skip fields that already have a value unless `settings.overwrite` is on | Always overwrite | Don't replace what the user or the site already entered. Lockheed's Eightfold form prefills from your profile | Development session, 2026-11-18 |
| Already-filled fields with "Replace answers" on | Replace only when the bank gives a usable answer; otherwise keep the value and show skip (no answer) or yellow (answer didn't fit), never red (`handle` wrapping `decide`) | Red "No matching question" (the earlier behavior) | Red means "not filled". On Lockheed's saved applications most answered dropdowns showed red, hiding the fields that really were empty | Development session, 2026-11-23 (Lockheed debug info) |
| Agreements and signatures | Always `skip` (`isConsent`), for **every** field type | Fill from the bank; or check only text boxes and checkboxes (the v1 behavior) | The user must agree or sign personally. Lockheed asks for a typed signature ("Please sign by typing your full legal name"), which would otherwise match the full-name answer | Development session, 2026-11-18 |
| "If you answered Yes…" follow-ups | `skip` unless the bank has an answer saved for that exact question (score ≥ 0.99, fill.js:324). Still learnable | Match normally | On Lockheed's form, "If you answered Yes and are a former LM employee: Enter the LM Person/Employee ID" matched "previously worked here" and would have typed "No" into an ID box | Development session, 2026-11-18 (Lockheed screenshot) |
| Question text for radio/checkbox groups | Use a fieldset legend / group label / container text only if that container holds **only this group** (`onlyThis`, fill.js:62) | Nearest fieldset legend | On Lockheed's form, the section title "Application Questions" became the question for every yes/no question in it | Development session, 2026-11-18 (Lockheed screenshot) |
| Custom dropdowns | Drive them: open → pick → close → confirm (fill.js:202–262) | Flag "pick it yourself" (the original v1 behavior) | Lockheed's sponsorship and veteran questions are custom dropdowns, and Lockheed is the user's focus. **This reversed the v1 choice**; see update-history | Development session, 2026-11-18 |
| Which menu a dropdown reads | Only its named menu (`aria-controls`/`aria-owns`); otherwise only a listbox that appeared after opening it. Close each menu before the next | Any visible `role="listbox"` on the page (the first version) | On Lockheed's form, a leftover Yes/No menu from another question was read, and could have been clicked, for the Visa and Veteran questions | Development session, 2026-11-18 (Lockheed debug info) |
| When dropdowns are filled | After all other fields, one at a time (fill.js:481–485) | Inline with other fields | Each menu opens and closes; doing them in parallel would mix their options up | Code (fill.js:481) |
| Read-only inputs | Skip them unless they're custom dropdowns (fill.js:103–105) | Skip all read-only | Sites often make custom dropdown inputs read-only; skipping them hid those questions | Development session, 2026-11-18; comment fill.js:103 |
| Multiple frames | A frame with no fields doesn't answer the message (fill.js:540) | Every frame answers | `tabs.sendMessage` resolves with the first answer, so an empty frame could hide the real form's result. Matters for Greenhouse forms embedded in an iframe | Comment fill.js:540; development session, 2026-11-18 |
| Which fields learning reads | Red fields, follow-ups, and any field whose value changed since Fill finished (`it.initial`) | Red and follow-up fields only (v1) | On Lockheed, the user changed an already-answered Veteran Status dropdown and Save said "No new answers to save" | Development session, 2026-11-23 |
| Changed field whose exact question already has a saved answer | Not overwritten; the panel says the bank already has a different answer and to change it on the bank page | Overwrite it from the form | Keeps the existing "never overwrite an existing answer" rule; the user didn't decide to reverse it | Development session, 2026-11-23 |
| Learning when a broader question matched | Save the manual answer as a new "Learned" entry with the form's exact wording; never overwrite an existing answer | Overwrite the matched entry; or refuse (the v1 behavior) | Overwriting would break other forms that rely on the broad answer ("Degree"). Refusing meant the fix was never remembered. An exact-wording entry scores 1.0 next time, so it wins | Development session, 2026-11-18 (Lockheed screenshot) |
| Dropdown failure details | Record the reason and the HTML around the dropdown (also for any dropdown left red, since 2026-11-23); the user copies it with **Copy debug info** | Log to the console only | The user can't easily open the developer console, and the real menu markup is needed to fix site-specific dropdowns. Nothing is sent anywhere automatically; the user decides what to share | Development session, 2026-11-18 |
| Results panel | Closed shadow DOM, fixed bottom-right, highest z-index | Plain DOM elements | Keeps the page's CSS from restyling the panel and the page's scripts from reaching into it | Development session, 2026-11-18 |
| Matching method | Rule-based word overlap (in `lib/match.js`) | Local embedding model; local LLM via Ollama | Simple and predictable for v1. For one company's repeated form, learning covers most gaps. A local model is planned as an upgrade | Development session, 2026-11-18 |

## Constraints (don't "fix" these without checking)

- **Don't make `fill.js` an ES module or remove the `var ApplyMatch` global.** Firefox MV2 content scripts listed in the manifest are classic scripts that share globals. A module would break the `ApplyMatch` lookup.
- **Don't merge the custom dropdown step into `handle()`.** `handle()` is synchronous, and dropdowns need to await menus opening.
- **Don't set `el.value` directly** (see Decisions). It looks equivalent but silently fails on React-based forms.
- **Don't let a dropdown fall back to "any open menu on the page."** See the decision above; it clicked into the wrong question's menu.
- **The `isFollowUp` threshold is 0.99 on purpose.** It means "only an exact saved question." Lowering it brings back the Lockheed employee-ID bug.
