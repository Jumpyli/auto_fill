# Shared logic (`lib/`) — backlog

## TODO comments in the code

| Priority | Where | Comment |
|---|---|---|
| High | match.js:38 | `TODO(v2, local model)`: when no bank question reaches MAYBE, ask a local model (in-browser embedding model or Ollama) to pick the closest question. Needed for rewordings with no shared words ("Do you need visa support?" vs "Will you require sponsorship?") |
| Low | match.js:58 | `TODO(v2, local model)`: let a local LLM choose an option when nothing scores well ("Not a veteran" vs "I am not a protected veteran") |

## Bugs and risks

| Priority | Module | Item | Where | Details |
|---|---|---|---|---|
| Med | match.js | Lockheed's veteran option scores below green | `pickOption`, match.js:75 | "Not a veteran" vs "I am not a protected Veteran / I prefer not to answer" ends up yellow on the real page (2026-11-18). It still fills; the user has to glance at it |
| Med | match.js | "i understand" counts as an agreement | `isConsent`, match.js:83 | A question like "I understand this role requires travel. Are you willing?" would be skipped |
| Med | resume.js | Names with accents or lowercase parts aren't found | resume.js:56 | The name pattern only allows `A–Z` initials: "José", "de la Cruz" fail |
| Med | resume.js | Website can be a company domain | resume.js:45–50 | The first domain-like text that isn't LinkedIn/GitHub/email is taken, e.g. an employer's "acme.com" |
| Med | resume.js | Two-column resumes can mix sections | `sections`, resume.js:9–18 | pdf.js text order follows the PDF layout; a sidebar can land inside Education |
| Low | resume.js | Without an Education heading, school/degree come from anywhere | resume.js:65 | `edu = lines`: an "MS" in skills or a university in Experience can be picked up |
| Low | resume.js | Phone pattern is US-only | resume.js:38 | International numbers aren't found |
| Low | match.js | "us" is a filler word | `STOP`, match.js:7–9 | "U.S." questions lose that word; matching still works through the other words |
| Low | match.js | Equal scores keep the earlier bank entry | `matchQuestion`, match.js:48 | Order in the bank decides ties |

## Tech debt

| Priority | Item |
|---|---|
| Low | Scores (0.88, 0.92, 0.7, 0.95…) are inline numbers; naming them would make tuning safer |
| Low | `resume.js` doesn't extract experience or project blurbs; the user writes those in the bank |

## Possible improvements

| Priority | Item |
|---|---|
| High | Local matching model (see TODO match.js:38) |
| Med | Synonym list for common option wordings (veteran, disability, ethnicity) so these turn green without a model |
| Low | Resume: extract the most recent job title and company for "Current company" and "Current title" |
