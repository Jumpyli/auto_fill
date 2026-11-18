/* Starter answer bank. Each entry: the question, other ways forms phrase it, and your answer.
   An alias starting with "=" only matches when the form's label is exactly that text. */
var DEFAULT_BANK = [
  // Basics
  { id: "first-name", cat: "Basics", q: "First name", aliases: ["given name", "legal first name", "=first"] },
  { id: "last-name", cat: "Basics", q: "Last name", aliases: ["family name", "surname", "legal last name", "=last"] },
  { id: "full-name", cat: "Basics", q: "Full name", aliases: ["legal name", "full legal name", "your name", "=name"] },
  { id: "preferred-name", cat: "Basics", q: "Preferred name", aliases: ["preferred first name", "nickname", "what should we call you"] },
  { id: "pronouns", cat: "Basics", q: "Pronouns", aliases: ["preferred pronouns"] },
  { id: "email", cat: "Basics", q: "Email", aliases: ["email address", "e mail"] },
  { id: "phone", cat: "Basics", q: "Phone", aliases: ["phone number", "mobile", "cell phone", "telephone", "contact number"] },
  { id: "location", cat: "Basics", q: "Current location", aliases: ["location", "city", "where are you located", "where are you based", "current city"] },
  { id: "linkedin", cat: "Basics", q: "LinkedIn profile", aliases: ["linkedin", "linkedin url", "linkedin profile url"] },
  { id: "github", cat: "Basics", q: "GitHub", aliases: ["github url", "github profile"] },
  { id: "website", cat: "Basics", q: "Website", aliases: ["portfolio", "personal website", "portfolio url", "other website", "personal site"] },

  // Education
  { id: "school", cat: "Education", q: "School", aliases: ["university", "college", "institution", "school name", "name of school"] },
  { id: "degree", cat: "Education", q: "Degree", aliases: ["highest degree", "degree type", "level of education", "education level", "highest level of education"] },
  { id: "major", cat: "Education", q: "Major", aliases: ["field of study", "discipline", "area of study", "concentration"] },
  { id: "gpa", cat: "Education", q: "GPA", aliases: ["grade point average", "cumulative gpa", "overall gpa"] },
  { id: "grad-date", cat: "Education", q: "Graduation date", aliases: ["expected graduation", "graduation year", "when do you graduate", "expected graduation date", "graduation"] },

  // Logistics
  { id: "work-auth", cat: "Logistics", q: "Are you legally authorized to work in the United States?", aliases: ["authorized to work", "legally authorized", "work authorization", "eligible to work", "right to work"] },
  { id: "sponsorship", cat: "Logistics", q: "Will you now or in the future require visa sponsorship?", aliases: ["require sponsorship", "visa sponsorship", "sponsorship", "require visa", "immigration sponsorship", "employment visa"] },
  { id: "age18", cat: "Logistics", q: "Are you at least 18 years old?", aliases: ["at least 18", "18 years of age", "over 18"] },
  { id: "prev-employee", cat: "Logistics", q: "Have you previously worked for this company?", aliases: ["previously worked", "previously been employed", "worked for us before", "former employee"] },
  { id: "start-date", cat: "Logistics", q: "Earliest start date", aliases: ["start date", "earliest start", "when can you start", "available to start", "availability"] },
  { id: "relocate", cat: "Logistics", q: "Are you willing to relocate?", aliases: ["relocate", "relocation", "willing to relocate", "open to relocation"] },
  { id: "onsite", cat: "Logistics", q: "Preferred office location / onsite or remote", aliases: ["work onsite", "in office", "hybrid", "in person", "preferred location", "preferred office", "which office", "office location"] },
  { id: "salary", cat: "Logistics", q: "Salary expectations", aliases: ["salary", "compensation", "expected salary", "pay expectations", "desired pay", "compensation expectations"] },
  { id: "source", cat: "Logistics", q: "How did you hear about us?", aliases: ["how did you hear about", "how did you find", "where did you hear", "source", "referral source"] },
  { id: "current-company", cat: "Logistics", q: "Current or most recent company", aliases: ["current company", "current employer", "most recent employer", "=company", "=employer"] },
  { id: "current-title", cat: "Logistics", q: "Current or most recent job title", aliases: ["current title", "job title", "most recent title", "=title"] },

  // Short answers
  { id: "why-company", cat: "Short answers", q: "Why do you want to work here?", aliases: ["why are you interested in working at", "why this company", "why us", "what interests you about", "why do you want to join"] },
  { id: "why-role", cat: "Short answers", q: "Why are you interested in this role?", aliases: ["interested in this role", "why this role", "why this position", "interest in this position"] },
  { id: "project", cat: "Short answers", q: "Tell us about a project you're proud of", aliases: ["project you are proud of", "describe a project", "technical project"] },
  { id: "challenge", cat: "Short answers", q: "Describe a challenge you overcame", aliases: ["challenge", "difficult problem", "obstacle", "overcame"] },
  { id: "cover-letter", cat: "Short answers", q: "Cover letter", aliases: ["cover letter text"] },
  { id: "anything-else", cat: "Short answers", q: "Anything else you'd like us to know?", aliases: ["anything else", "additional information", "additional comments"] },
  { id: "skills", cat: "Short answers", q: "Technical skills", aliases: ["skills", "programming languages", "languages and tools", "technologies"] },

  // Defense and government roles
  { id: "us-citizen", cat: "Defense", q: "Are you a U.S. citizen?", aliases: ["us citizen", "united states citizen", "u s citizenship", "meet the citizenship requirement", "citizenship requirement for the security clearance"] },
  { id: "dual-citizen", cat: "Defense", q: "Do you hold dual citizenship?", aliases: ["dual citizenship", "citizen of another country", "other citizenship"] },
  { id: "clearance-active", cat: "Defense", q: "Do you currently hold an active security clearance?", aliases: ["active security clearance", "active clearance", "currently hold a clearance", "current security clearance"] },
  { id: "clearance-level", cat: "Defense", q: "Security clearance level", aliases: ["clearance level", "level of clearance", "highest clearance", "type of clearance"] },
  { id: "clearance-willing", cat: "Defense", q: "Are you willing and able to obtain a security clearance?", aliases: ["willing to obtain", "able to obtain a security clearance", "obtain and maintain", "eligible for a security clearance"] },
  { id: "export-control", cat: "Defense", q: "Are you a U.S. person eligible to access export-controlled (ITAR/EAR) information?", aliases: ["export controlled", "itar", "us person", "u s person"] },
  { id: "drug-test", cat: "Defense", q: "Are you willing to take a drug test?", aliases: ["drug test", "drug screen", "drug screening"] },
  { id: "recent-grad", cat: "Defense", q: "Have you received a degree within the last 24 months, or will you graduate within the next 12 months?", aliases: ["degree within the last 24 months", "graduate within the next 12 months", "recent graduate"] },

  // Voluntary disclosures
  { id: "gender", cat: "Disclosures", q: "Gender", aliases: ["gender identity", "=sex"] },
  { id: "hispanic", cat: "Disclosures", q: "Are you Hispanic or Latino?", aliases: ["hispanic", "latino", "hispanic latino"] },
  { id: "race", cat: "Disclosures", q: "Race / ethnicity", aliases: ["race", "ethnicity", "racial", "race ethnicity"] },
  { id: "veteran", cat: "Disclosures", q: "Veteran status", aliases: ["veteran", "protected veteran", "military service"] },
  { id: "disability", cat: "Disclosures", q: "Disability status", aliases: ["disability", "disabled"] },
].map((e) => ({ a: "", ...e }));

var CATEGORIES = ["Basics", "Education", "Logistics", "Defense", "Short answers", "Disclosures", "Learned"];

if (typeof module !== "undefined") module.exports = { DEFAULT_BANK, CATEGORIES };
