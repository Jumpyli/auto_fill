# Shared logic (`lib/`) — update history

`git log --follow` on `lib/` shows two commits: `2619e31` "Initial commit" (2026-11-18), which already contains most items below, and `c5f10fd` "Form filler: fixes from real Lockheed (Eightfold) testing" (2026-11-18). Reasons come from the development session (source: "Development session, 2026-11-18"). Oldest first.

| # | Date | Module | What changed | Why | Source |
|---|---|---|---|---|---|
| 1 | 2026-11-18 | all | **Created as plain-JS modules** usable by content scripts, the options page and Node tests | One copy of the logic for every caller, testable without a browser | Development session, 2026-11-18 |
| 2 | 2026-11-18 | match.js | **Rule-based matching, no AI model** | v1 simplicity. The user's original idea of a light local model is deferred to v2 | Development session, 2026-11-18 |
| 3 | 2026-11-18 | match.js, defaults.js | **Exact-only `=` phrasings and length-scaled one-word scores** | Generic words ("name", "company", "title") would match unrelated labels such as "Company name of your reference" | Development session, 2026-11-18 |
| 4 | 2026-11-18 | match.js | **Phrase rule counts all words, not meaningful words** | "how did you hear about" shrinks to "hear" once filler words are removed | Development session, 2026-11-18 |
| 5 | 2026-11-18 | resume.js | **Major prefers "in X" over "of X"** | First test run gave "Science in Computer Science" for "Master of Science in Computer Science" | Development session, 2026-11-18 (failing test) |
| 6 | 2026-11-18 | defaults.js | **Defense section** (8 questions) with Lockheed's exact wordings as other wordings | The user is focusing on Lockheed Martin; defense applications ask citizenship, clearance, ITAR and drug-test questions | Development session, 2026-11-18 |
| 7 | 2026-11-18 | match.js | **`isFollowUp` added** | Lockheed's "If you answered 'Yes' and are a former LM employee: Enter the LM Person/Employee ID" matched "previously worked here" | Development session, 2026-11-18 (Lockheed screenshot) |
| 8 | 2026-11-18 | match.js | **`isConsent` recognizes typed signatures** ("please sign", "sign by", "sign here/below") — commit `c5f10fd` | Lockheed's "Please sign by typing your full legal name" would have received the full-name answer | Development session, 2026-11-18 (Lockheed screenshot) |
| 9 | 2026-11-18 | match.js | **`TODO(v2, local model)` comments** at `matchQuestion` and `pickOption` — commit `c5f10fd` | Make it visible in the code that v1 uses no AI model, and where one would plug in | Development session, 2026-11-18 (user request) |

## Reversed decisions (don't undo these)

| Original choice | Reversed to | Reason | Don't go back because |
|---|---|---|---|
| Signature detection: "signature", "e-signature", "sign your name" only | Also "please sign", "sign by", "sign here", "sign below", "type your name to sign" | Lockheed's typed-signature field wasn't recognized | Removing them lets the form filler type the user's name into a signature box |
| Major: first "in X" or "of X" | Prefer "in X" | Wrong major for "Master of Science in …" | Common US degree titles put the field after "in" |
