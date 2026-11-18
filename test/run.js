// Run with: node test/run.js
const M = require("../lib/match.js");
const { DEFAULT_BANK } = require("../lib/defaults.js");
const R = require("../lib/resume.js");
let fails = 0;
const check = (name, ok, got) => { if (!ok) { fails++; console.log("FAIL", name, "->", got); } else console.log("ok  ", name); };

const labels = {
  "First Name *": "first-name", "Last Name": "last-name", "Email Address": "email", "Phone *": "phone",
  "LinkedIn Profile": "linkedin", "Website or Portfolio": "website",
  "Will you now or in the future require sponsorship for employment visa status (e.g. H-1B visa status)?": "sponsorship",
  "Are you legally authorized to work in the United States?": "work-auth",
  "How did you hear about this job?": "source", "What is your expected graduation date?": "grad-date",
  "Why do you want to work at Stripe?": "why-company", "Current Company": "current-company",
  "Name": "full-name", "Gender": "gender", "Are you Hispanic/Latino?": "hispanic", "Veteran Status": "veteran",
  "Cumulative GPA": "gpa",
  "Have you received a Bachelor’s or Master's degree within the last 24 months or will you graduate with a Bachelor’s or Master’s degree within the next 12 months?": "recent-grad",
  "The clearance required for this position is granted by the U.S. federal government and only U.S. citizens are eligible. Do you meet the citizenship requirement for the security clearance for this position?": "us-citizen",
  "Do you currently possess an active security clearance?": "clearance-active",
  "Preferred Pronoun": "pronouns", "School": "school", "Are you open to relocation?": "relocate",
};
for (const [label, id] of Object.entries(labels)) {
  const { entry, score } = M.matchQuestion(label, DEFAULT_BANK);
  check(`"${label}" -> ${id}`, entry && entry.id === id && score >= M.MAYBE, `${entry && entry.id} ${score.toFixed(2)}`);
}
for (const label of ["Company name of your reference", "Favorite color"]) {
  const { entry, score } = M.matchQuestion(label, DEFAULT_BANK);
  check(`"${label}" stays unmatched`, score < M.GOOD, `${entry && entry.id} ${score.toFixed(2)}`);
}

const opt = (a, opts, want) => { const r = M.pickOption(a, opts); check(`"${a}" picks "${want}"`, opts[r.index] === want, `${opts[r.index]} ${r.score.toFixed(2)}`); };
opt("Yes", ["Yes", "No"], "Yes");
opt("No", ["Yes", "No"], "No");
opt("No", ["I am authorized and will not require sponsorship", "I will require sponsorship"], "I am authorized and will not require sponsorship");
opt("Decline to self-identify", ["Male", "Female", "Non-binary", "I don't wish to answer"], "I don't wish to answer");
opt("Male", ["Male", "Female", "Decline To Self Identify"], "Male");
opt("Asian", ["White (Not Hispanic or Latino)", "Asian (Not Hispanic or Latino)", "Two or More Races"], "Asian (Not Hispanic or Latino)");
opt("LinkedIn", ["Company website", "LinkedIn", "Referral", "Other"], "LinkedIn");
opt("Master's", ["High school", "Bachelor's Degree", "Master's Degree", "PhD"], "Master's Degree");
check("follow-up detected", M.isFollowUp("If you answered \"Yes\" and are a former LM employee: Enter the LM Person/Employee ID"), "");
check("normal question not follow-up", !M.isFollowUp("Have you previously worked for Lockheed Martin?"), "");
check("consent detected", M.isConsent("I certify that the information provided is true"), "");
check("signature detected", M.isConsent("Please sign by typing your full legal name"), "");
check("agreement detected", M.isConsent("I have read and understand and I agree to the above"), "");
check("design question not consent", !M.isConsent("Describe a design you are proud of"), "");
check("normal question not consent", !M.isConsent("Are you willing to relocate?"), "");

const resume = `JANE DOE
San Francisco, CA | (415) 555-0134 | jane.doe@example.com | linkedin.com/in/jane-doe | github.com/janedoe | janedoe.dev
EDUCATION
University of California, Berkeley Berkeley, CA
Master of Science in Computer Science GPA: 3.87/4.0 Expected May 2026
Bachelor of Science in Data Science Aug 2020 - May 2024
EXPERIENCE
Software Engineer Intern, Acme Corp June 2025 - Aug 2025
SKILLS
Languages: Python, C++, SQL
Tools: PyTorch, Docker`;
const v = R.parse(resume).values;
const want = { "full-name": "Jane Doe", "first-name": "Jane", "last-name": "Doe", email: "jane.doe@example.com", phone: "(415) 555-0134",
  linkedin: "https://linkedin.com/in/jane-doe", github: "https://github.com/janedoe", website: "https://janedoe.dev",
  school: "University of California", degree: "Master of Science in Computer Science", major: "Computer Science", gpa: "3.87/4.0", "grad-date": "May 2026" };
for (const [k, val] of Object.entries(want)) check(`resume ${k}`, v[k] === val, v[k]);
check("resume skills", /PyTorch/.test(v.skills || ""), v.skills);
console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
