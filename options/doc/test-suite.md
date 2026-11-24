# Answer bank page (`options/`) — test suite

Manual, in Firefox with the add-on loaded from `about:debugging`. Not covered by `npm test` (the page needs the extension APIs and pdf.js). Flow numbers refer to `workflow-diagram.md`.

## Opening and editing (flows 1–2)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| OPT-01 | First open | Fresh profile: load the add-on, click the toolbar icon, then **Open answer bank** | Sections Basics, Education, Logistics, Defense, Short answers, Disclosures with empty answers, each showing "0/N answered" |
| OPT-02 | Autosave | Type an answer for Email, wait 1 second, close and reopen the page | "Saved" flashed; the answer is still there |
| OPT-03 | Other wordings | Add "contact email" to Email's other wordings; fill a form labeled "Contact email" | The form filler fills it from Email |
| OPT-04 | Search | Type "sponsor" in search | Only the sponsorship question shows; clearing search shows all |
| OPT-05 | Add question | Pick section Defense, click **Add question**, type a question and answer | A new row appears with "New question" selected; after typing, it's saved |
| OPT-06 | Delete needs two clicks | Click **Delete** on a question once, then again | The first click shows "Confirm"; the second removes it |
| OPT-07 | Overwrite setting | Tick **Replace answers already typed on a form**; fill a form whose fields already have text | The form filler replaces them; with the box unticked, it leaves them |

## Resume (flows 3–4)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| OPT-08 | Normal PDF | Upload a text-based resume PDF | "Attached to forms: name.pdf"; review list with found values; empty answers pre-ticked |
| OPT-09 | Review and save | Untick one value, edit another, click **Save checked answers** | "Saved N answers"; only ticked values change; the bank list updates |
| OPT-10 | Existing answers protected | Upload again after filling answers | Rows for answered questions show "You already have: …" and are unticked |
| OPT-11 | Scanned PDF | Upload an image-only PDF | "Saved … for upload fields, but it has no readable text…"; no review list |
| OPT-12 | Plain text resume | Upload a `.txt` resume | Same review flow as a PDF |
| OPT-13 | Nothing found | Upload a text file with no contact details or education | "Nothing recognizable was found…" |
| OPT-14 | Remove resume | Click **Remove resume**, then Fill a form with a resume upload | The resume name disappears; the form filler shows "Add your resume…" |
| OPT-15 | Regression: buffer crash | Upload any PDF | No "Couldn't save/read" error. (This failed before history #2) |

## Import and export (flow 5)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| OPT-16 | Export | Click **Export as JSON** | `answer-bank.json` downloads with `{"bank": [...]}` |
| OPT-17 | Import merges | Change one answer in the exported file, add one new entry, import it | "Imported: 1 new, 1 updated"; other answers unchanged |
| OPT-18 | Bad file | Import a random JSON or text file | "That file isn't an answer bank export." Nothing changes |

## Known bug check (backlog)

| ID | Scenario | Steps | Expected today → after the fix |
|---|---|---|---|
| OPT-19 | Bank page open while learning | Open the bank page. In another tab, fill a form, type into a red field, click **Save my new answers**. Back on the bank page, edit any answer. Reopen the page | Today: the learned answer is gone. After the fix: it's still there |
