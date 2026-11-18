/* Pulls answer-bank values out of resume text. Rule-based and offline; everything it finds is shown for review first. */
var ResumeParser = (() => {
  const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const DATE = new RegExp(`\\b${MONTH}\\s+(?:19|20)\\d{2}\\b|\\b(?:19|20)\\d{2}\\b`, "gi");
  const HEADING = /^(education|experience|work experience|professional experience|employment|projects|personal projects|skills|technical skills|publications|awards|honors|leadership|activities|coursework|relevant coursework|certifications|research|research experience|summary|objective)\s*:?$/i;
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const FULL_MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function sections(lines) {
    const out = {};
    let cur = "header";
    for (const l of lines) {
      const m = l.match(HEADING);
      if (m && l.length < 40) { cur = m[1].toLowerCase(); continue; }
      (out[cur] = out[cur] || []).push(l);
    }
    return out;
  }
  const pick = (secs, ...names) => names.flatMap((n) => secs[n] || []);
  const dateValue = (s) => {
    const y = +(s.match(/(19|20)\d{2}/) || [0])[0];
    const mi = MONTHS.findIndex((m) => s.toLowerCase().startsWith(m));
    return { y, m: mi, label: mi >= 0 ? `${FULL_MONTH[mi]} ${y}` : String(y) };
  };
  const titleCase = (s) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const stripDates = (s) => s.replace(DATE, " ").replace(/\b(expected|present|current)\b/gi, " ")
    .replace(/GPA[:\s]*[0-4]\.\d+(\s*\/\s*[0-9.]+)?/i, " ").replace(/\s*[|•–—-]\s*$/g, "").replace(/\s{2,}/g, " ").replace(/^[\s,|•–—-]+|[\s,|•–—-]+$/g, "").trim();

  /** Returns {values: {bankId: value}}. */
  function parse(text) {
    const lines = String(text).split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
    const all = lines.join("\n");
    const v = {};
    const secs = sections(lines);

    const email = all.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/);
    if (email) v.email = email[0];
    const phone = all.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/);
    if (phone) v.phone = phone[0].trim();
    const li = all.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[\w%-]+\/?/i);
    if (li) v.linkedin = "https://" + li[0].replace(/^https?:\/\//i, "").replace(/\/$/, "");
    const gh = all.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
    if (gh) v.github = "https://" + gh[0].replace(/^https?:\/\//i, "");
    const emailDomain = email ? email[0].split("@")[1].toLowerCase() : "";
    for (const m of all.matchAll(/\b(?:https?:\/\/)?(?:[\w-]+\.)+(?:com|io|dev|me|net|org|ai|app|xyz|site|page)(?:\/[\w\-./~]*)?/gi)) {
      const u = m[0], low = u.toLowerCase();
      if (/linkedin|github/.test(low) || low.includes("@") || low === emailDomain || all[m.index - 1] === "@") continue;
      v.website = /^https?:/i.test(u) ? u : "https://" + u;
      break;
    }

    // Name: an early line of 2-4 capitalized words with no digits or symbols.
    for (const l of lines.slice(0, 4)) {
      if (/[\d@|/:]/.test(l)) continue;
      const words = l.split(" ");
      if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][A-Za-z.'-]*$/.test(w))) {
        const name = l === l.toUpperCase() ? titleCase(l) : l;
        v["full-name"] = name;
        v["first-name"] = name.split(" ")[0];
        v["last-name"] = name.split(" ").slice(-1)[0];
        break;
      }
    }

    const edu = secs.education || lines;
    const schoolLine = edu.find((l) => /\b(university|college|institute|polytechnic|school of)\b/i.test(l));
    if (schoolLine) {
      const m = schoolLine.match(/[^,|•–—]*\b(university|college|institute|polytechnic|school of)\b[^,|•–—]*/i);
      v.school = stripDates(m ? m[0] : schoolLine);
    }
    const degRe = /\b(Bachelor(?:'s)?|Master(?:'s)?|Doctor(?:ate)?|Ph\.?\s?D\.?|B\.\s?S\.?|M\.\s?S\.?|B\.\s?A\.?|M\.\s?A\.?|B\.?\s?Sc\.?|M\.?\s?Sc\.?|B\.?\s?Eng\.?|M\.?\s?Eng\.?|BS|MS|BA|MA|MBA|BSE|MSE)\b[^|;•\n]*/;
    const degLine = edu.find((l) => degRe.test(l));
    if (degLine) {
      const deg = stripDates(degLine.match(degRe)[0]);
      v.degree = deg;
      const major = deg.match(/\bin\s+([A-Z][A-Za-z&\s]+?)(?:\s*(?:,|$|\(|minor))/) ||
        deg.match(/\bof\s+((?!Science\b|Arts\b|Engineering\b)[A-Z][A-Za-z&\s]+?)(?:\s*(?:,|$|\(|minor))/);
      if (major) v.major = major[1].trim();
    }
    const gpa = edu.join("\n").match(/GPA[:\s]*([0-4]\.\d{1,2})(?:\s*\/\s*([0-9.]+))?/i) || all.match(/GPA[:\s]*([0-4]\.\d{1,2})(?:\s*\/\s*([0-9.]+))?/i);
    if (gpa) v.gpa = gpa[2] ? `${gpa[1]}/${gpa[2]}` : gpa[1];

    const eduText = edu.join("\n");
    const expected = eduText.match(new RegExp(`expected[:\\s]+(${MONTH}\\s+(?:19|20)\\d{2}|(?:19|20)\\d{2})`, "i"));
    if (expected) v["grad-date"] = dateValue(expected[1]).label;
    else if (secs.education) {
      const dates = [...eduText.matchAll(DATE)].map((m) => dateValue(m[0])).sort((a, b) => b.y - a.y || b.m - a.m);
      if (dates.length) v["grad-date"] = dates[0].label;
    }

    const skills = pick(secs, "skills", "technical skills");
    if (skills.length) v.skills = skills.join("\n").slice(0, 800);

    return { values: v };
  }

  return { parse };
})();

if (typeof module !== "undefined") module.exports = ResumeParser;
