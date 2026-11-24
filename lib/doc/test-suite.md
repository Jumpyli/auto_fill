# Shared logic (`lib/`) — test suite

**Automated:** `npm test` (after `npm install`). `test/run.js` checks the cases marked ✓ directly. The form filler's page tests in `test/dom/` exercise `match.js` end to end. Flow numbers refer to `workflow-diagram.md`.

## Matching questions (flow 1)

| ID | Scenario | Steps | Expected | Auto |
|---|---|---|---|---|
| LIB-01 | Exact label | Match "Email Address" against the starter bank | Email entry, score 1.0 | ✓ |
| LIB-02 | Long question containing a phrasing | "Will you now or in the future require sponsorship for employment visa status (e.g. H-1B visa status)?" | Sponsorship, score ≥ 0.8 | ✓ |
| LIB-03 | Phrase with filler words | "How did you hear about this job?" | Source ("How did you hear about us?"), ≥ 0.8 | ✓ |
| LIB-04 | Exact-only phrasing | "Name" | Full name (via `=name`). "Company name of your reference" must stay below 0.8 | ✓ |
| LIB-05 | Unrelated question | "Favorite color" | Below 0.8 | ✓ |
| LIB-06 | Lockheed wordings | The recent-graduate, citizenship-for-clearance and active-clearance questions as worded on Lockheed's form | recent-grad, us-citizen, clearance-active | ✓ |
| LIB-07 | Matched but empty | "Preferred Pronoun" with an empty Pronouns answer | Pronouns entry returned (score ≥ 0.55) so the caller can say it's empty | ✓ |

## Picking options (flow 2)

| ID | Scenario | Steps | Expected | Auto |
|---|---|---|---|---|
| LIB-08 | Yes/No | Answer "No" against [Yes, No] | "No" | ✓ |
| LIB-09 | Yes/No against sentences | Answer "No" against "I am authorized and will not require sponsorship" / "I will require sponsorship" | The first (negation agrees) | ✓ |
| LIB-10 | Decline wording | "Decline to self-identify" against [Male, Female, Non-binary, I don't wish to answer] | "I don't wish to answer" | ✓ |
| LIB-11 | Partial wording | "Asian" against the ethnicity list with "(Not Hispanic or Latino)" suffixes | "Asian (Not Hispanic or Latino)" | ✓ |
| LIB-12 | Degree level | "Master's" against [High school, Bachelor's Degree, Master's Degree, PhD] | "Master's Degree" | ✓ |
| LIB-13 | Yes against a long list | Answer "Yes" against 50 state names | No option chosen (score 0) | — |

## Agreement and follow-up checks (flow 3)

| ID | Scenario | Steps | Expected | Auto |
|---|---|---|---|---|
| LIB-14 | Certify | "I certify that the information provided is true" | `isConsent` true | ✓ |
| LIB-15 | Typed signature | "Please sign by typing your full legal name" | `isConsent` true | ✓ |
| LIB-16 | Agree statement | "I have read and understand and I agree to the above" | `isConsent` true | ✓ |
| LIB-17 | Not an agreement | "Describe a design you are proud of", "Are you willing to relocate?" | `isConsent` false | ✓ |
| LIB-18 | Follow-up | "If you answered "Yes" and are a former LM employee: Enter the LM Person/Employee ID" | `isFollowUp` true; "Have you previously worked for Lockheed Martin?" is false | ✓ |

## Resume parsing (flow 4)

| ID | Scenario | Steps | Expected | Auto |
|---|---|---|---|---|
| LIB-19 | Typical one-column resume | Parse the sample in `test/run.js` (ALL-CAPS name, contact line, Education, Skills) | Name "Jimmy Li", email, phone, LinkedIn, GitHub, website, "University of California", "Master of Science in Computer Science", major "Computer Science", GPA "3.87/4.0", graduation "May 2026", skills | ✓ |
| LIB-20 | Real PDF in Firefox | Upload your resume on the answer bank page | The review list shows the values above for your resume; nothing is saved until you click Save | — |
| LIB-21 | No Education heading | Text with a university line but no heading | School still found; no graduation date | — |
| LIB-22 | Scanned (image) PDF | Upload an image-only PDF | `options/` says it has no readable text; the file is still saved for upload fields | — |

## Starter questions over time (flow 5)

| ID | Scenario | Steps | Expected | Auto |
|---|---|---|---|---|
| LIB-23 | First install | Fresh Firefox profile; load the add-on | The bank equals the starter questions, all answers empty | — |
| LIB-24 | Update adds a question | With an existing bank, add a new id to `DEFAULT_BANK`, reload the add-on | The new question appears; existing answers are unchanged | — |
| LIB-25 | Deleted stays deleted | Delete a starter question on the bank page, reload the add-on | It doesn't come back | — |
