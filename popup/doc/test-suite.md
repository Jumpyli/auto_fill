# Toolbar popup (`popup/`) — test suite

Manual, in Firefox. Not covered by `npm test`. Flow numbers refer to `workflow-diagram.md`.

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| POP-01 | Fill an application (flow 1) | Open an application; click the toolbar icon, then **Fill this page** | "Filling…", then "Filled X, Y to check, Z to answer yourself…"; the page panel appears |
| POP-02 | Page without a form (flow 1) | Open a news article; click Fill | "No form fields found on this page." |
| POP-03 | Restricted page (flow 1) | Open `about:addons`; click Fill | "Can't fill this page…" |
| POP-04 | Save typed answers (flow 2) | After POP-01, type into a red field; open the popup; click **Save answers I typed to my bank** | "Saved 1 new answer." |
| POP-05 | Save before filling (flow 2) | On a fresh page, click **Save answers I typed** | "Fill the page first, then type answers into the red fields." |
| POP-06 | Open answer bank (flow 3) | Click **Open answer bank** | The bank opens in a tab; the popup closes |
| POP-07 | Count line (flow 3) | Fill in 3 answers in the bank; open the popup | "3 of N answers saved." |
| POP-08 | Dark mode | Switch the system to dark mode; open the popup | Dark background, readable text and buttons |
