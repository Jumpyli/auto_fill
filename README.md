# Apply Autofill

A Firefox add-on that fills job applications from your own answer bank. It runs entirely in your browser,
and it never clicks Submit, Next, or any other button.

## Install (Firefox)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and pick `manifest.json` in this folder.
3. Click the add-on's toolbar icon, then **Open answer bank**. Upload your resume PDF, check what it found, and fill in the rest.

Temporary add-ons are removed when Firefox restarts. Your saved answers are kept, so step 2 is all you repeat.
To install it permanently, sign it for free as an unlisted add-on: `npx web-ext sign --channel=unlisted`
(needs API keys from addons.mozilla.org). Or use Firefox Developer Edition with
`xpinstall.signatures.required` set to `false` in `about:config`.

## Use

1. Open an application page and click **Fill this page** (or press `Alt+Shift+A`).
2. Fields are outlined:
   - green: filled from a confident match
   - yellow: filled, but check it
   - red: no answer yet, so answer it yourself
3. The panel in the corner lists every question. Click one to jump to it.
4. Type answers into the red fields, then click **Save my new answers** so next time they fill automatically.
5. Review everything and submit it yourself.

Checkboxes and fields that agree to terms or ask for a signature are always left for you.

## How matching works

Each bank entry has a question plus other ways forms phrase it ("Other wordings" on the bank page).
The add-on scores each form label against those by word overlap and exact phrases. It also uses the
field's own hints, such as `autocomplete="given-name"` or `type="email"`. For dropdowns and radio buttons
it picks the option closest to your answer, and it understands yes/no and "decline to answer" answers.

## Files

- `lib/defaults.js`: starter questions
- `lib/match.js`: label and option matching
- `lib/resume.js`: resume parsing
- `content/fill.js`: reads and fills the page, draws the panel
- `options/`: answer bank page
- `popup/`: toolbar menu
- `vendor/`: pdf.js (Apache 2.0)

## Tests

`node test/run.js` covers matching and resume parsing.

## Known gaps

- **v1 uses no AI model.** Matching is word overlap plus the learning button. A local model is planned for v2 (see the `TODO(v2, local model)` comments in `lib/match.js`).
- **Custom dropdowns** (site-built menus) are opened and picked automatically, but some sites' menus aren't recognized yet. Lockheed's (Eightfold) is one of them. Those show as red with the reason, plus a **Copy debug info** button.
- **Workday** spreads applications over several pages. Run Fill on each page.
- **Rewordings with no shared words** won't match until you add them as "other wordings", or until the local matching model (planned next) is added.
