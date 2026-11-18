# Form filler — test suite

These are end-to-end cases to run by hand in Firefox, with the add-on loaded from `about:debugging` and an answer bank containing the answers named in each case. **Automated coverage:** `node test/run.js` covers matching only. Automated page tests for FF-01–FF-05, FF-08–FF-10 and FF-14–FF-16 exist only as temporary scripts (see backlog).

Branch references point to the flows in `workflow-diagram.md`.

## Main flow (flow 1)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-01 | Standard form fills | Bank: first/last name, email, LinkedIn. Open a Greenhouse or Lever application. Click **Fill this page** | Those fields are filled and outlined green. The panel lists them under "filled". The popup shows the counts. Nothing is submitted |
| FF-02 | Never submits | On any filled form, watch the page after Fill | No navigation and no "application submitted" message. The Submit/Next buttons are never clicked |
| FF-03 | Form inside an iframe | Open a company careers page with an embedded Greenhouse form. Click Fill | The form inside the iframe is filled and its panel appears. The popup shows that frame's counts, not "No form fields found" |
| FF-04 | Page with no form | Open a news article and click Fill | The popup says "No form fields found on this page." No panel appears |

## Script injection (flow 2)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-05 | Tab opened before the add-on loaded | Open an application tab, then reload the add-on in `about:debugging`, then click Fill without reloading the tab | The page fills normally (the script is injected on demand). Clicking Fill a second time doesn't create duplicate panels |
| FF-06 | Restricted page | Open `about:addons` and click Fill | The popup says "Can't fill this page…" |

## Field decisions (flow 3)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-07 | Resume upload | Save a resume on the bank page. Open a form with a "Resume/CV" upload. Fill | The file is attached and the field is yellow: "Attached. Make sure the site shows your file." A "Cover letter" upload is left alone ("attach this one yourself") |
| FF-08 | No resume saved | Remove the resume on the bank page. Fill a form with a resume upload | Red: "Add your resume on the answer bank page…" |
| FF-09 | Agreement checkbox | Form with "I certify that the information above is true". Fill | The box stays unchecked and the panel says "Agreement or signature. Answer this yourself." |
| FF-09b | Typed signature | Fresh Lockheed form with "Please sign by typing your full legal name"; the bank has a full name. Fill | The signature box stays empty: "Agreement or signature. Answer this yourself." A separate "Full legal name" field still fills |
| FF-10 | Already filled | Type something in Phone yourself, then Fill (with "Replace answers" off on the bank page) | Phone keeps your text; the panel says "Already filled in. Left as is." With the setting on, it's replaced |
| FF-11 | Follow-up question | Lockheed form: "If you answered 'Yes' and are a former LM employee: Enter the LM Person/Employee ID". Fill | The box stays empty and is listed as a follow-up. It's never filled with a yes/no answer |
| FF-12 | Unknown question | A question that isn't in the bank (e.g. "Favorite product?"). Fill | Red: "No matching question in your answer bank." |
| FF-13 | Empty answer | Bank has "Pronouns" with no answer. Form asks "Preferred Pronoun". Fill | Red: 'Matches "Pronouns", but that answer is empty.' |
| FF-14 | Dropdown and radio options | Bank: sponsorship "No", gender "Decline to self-identify", degree "Master's". Form with a native select and radio buttons for these | The right options are chosen ("No", "Decline To Self Identify", "Master's Degree") |
| FF-15 | Lockheed yes/no questions | Bank: recent-grad "Yes", U.S. citizen "Yes". Open Lockheed's Application Questions step. Fill | Both radio questions are answered Yes. The panel shows each question's own text, not "Application Questions" |
| FF-16 | Answer longer than the box | Field with a 100-character limit and a longer saved answer | Filled and yellow: "Your answer is N characters; this box allows 100." |
| FF-17 | Checkbox list | Bank race answer "Asian, White". Form with a choose-all-that-apply list | Both boxes are ticked; the field is yellow: "Check that these are the boxes you want." |
| FF-18 | Weak match | A question that only loosely resembles a bank question | Filled and yellow, with 'Best guess: used your answer to "…"' |

## Custom dropdowns (flow 4)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-19 | Lockheed sponsorship dropdown | Bank sponsorship "No". On Lockheed's form, Fill | The menu opens and closes by itself, "No" is selected, and the field is green |
| FF-20 | Veteran status wording differs | Bank veteran "Not a veteran". Lockheed veteran dropdown | "I am not a protected veteran" (or the site's equivalent) is selected |
| FF-21 | Long searchable list | Bank location "Texas". A type-to-search state dropdown | The answer is typed, "Texas" appears and is selected |
| FF-22 | No option fits | Bank answer "Maybe" for a Yes/No custom dropdown | The menu closes; the field is red: 'Custom dropdown. Pick "Maybe" yourself.' No stray menu stays open |
| FF-23 | Already chosen | Pick a dropdown option yourself, then Fill | That dropdown is left as is |

| FF-32 | Another question's menu is open | Lockheed form with a dropdown whose menu doesn't open, while another question's Yes/No menu is visible. Fill (with "Replace answers" on) | No option in the other menu is clicked. The dropdown is red: "Couldn't open this dropdown's menu". Its value is unchanged. Copy debug info shows `steps` such as `click: expanded=false, menu=none` |
| FF-33 | Dropdown already shows the answer | Veteran Status already shows "Not a veteran". Fill with "Replace answers" on | The dropdown isn't opened; it's listed as filled with "Not a veteran" |

## Learning (flow 5)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-24 | Save a typed answer | After Fill, type into a red field ("Date Granted"). Click **Save my new answers** | The panel says "Saved 1 new answer". The bank page shows it under **Learned** with the form's exact wording. The next Fill on that form fills it green |
| FF-25 | Answer for an empty bank question | Red field "Preferred Pronoun" (bank entry empty). Type an answer, then Save | The existing "Pronouns" entry gets the answer; no duplicate is created |
| FF-26 | Save a follow-up | Type into the former-employee ID box (FF-11), then Save | Saved. The next Fill fills that exact question |
| FF-27 | Nothing to save | Click Save without typing anything | "No new answers to save. Type answers into the red fields first." |

| FF-29 | Yes/No question matched to a description | Bank Degree "Bachelor's degree in Computer Science…". Lockheed's "Do you possess the Bachelor's Degree?" (Yes/No). Fill | Red: 'Yes/no question, but your answer to "Degree" isn't yes or no…'. Pick Yes, click Save: "Saved 1 new answer". The Degree answer is unchanged. The next Fill selects Yes (green) |
| FF-30 | Dropdown that won't open | A custom dropdown whose menu the add-on can't find (currently Lockheed's Veteran Status). Fill | Red: "Couldn't open this dropdown's menu. Pick … yourself." A **Copy debug info** button appears; clicking it shows "Copied", and the clipboard holds JSON with the label, answer, reason and HTML |
| FF-31 | Dropdown opens, nothing matches | Custom dropdown whose options don't resemble the saved answer | Red: "Menu opened, but no option matched "…" (saw: …)". The listed options help you fix the bank answer |

## Clear (flow 6)

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| FF-28 | Clear highlights | After Fill, click **Clear highlights** (or ×) | Outlines and the panel disappear. Filled values stay |
