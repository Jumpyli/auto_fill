/* Matches form labels to answer-bank questions, and saved answers to dropdown / radio options.
   Pure functions, shared by the content script, the options page and the tests. */
var ApplyMatch = (() => {
  const GOOD = 0.8;   // fill and mark green
  const MAYBE = 0.55; // fill and mark yellow

  const STOP = new Set(("a an the you your yours are is am be been do does did to of in on for with at by as or and if it " +
    "this that these those we our us will would can could please what which who how when where any have has had there " +
    "their from into about i me my").split(" "));

  const clean = (s) => String(s || "")
    .replace(/\(?\brequired\b\)?/gi, " ").replace(/[*✱]/g, " ").replace(/\s+/g, " ").trim();
  const norm = (s) => clean(s).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const stem = (w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  const tokens = (s) => norm(s).split(" ").filter((w) => w && !STOP.has(w)).map(stem);

  /** How well a form label matches one way of phrasing a bank question, 0..1. */
  function similarity(label, cand) {
    let exactOnly = false;
    if (cand.startsWith("=")) { exactOnly = true; cand = cand.slice(1); }
    const nl = norm(label), nc = norm(cand);
    if (!nl || !nc) return 0;
    if (nl === nc) return 1;
    if (exactOnly) return 0;
    const tl = new Set(tokens(label)), tc = new Set(tokens(cand));
    if (!tl.size || !tc.size) return 0;
    let inter = 0;
    for (const t of tc) if (tl.has(t)) inter++;
    const dice = (2 * inter) / (tl.size + tc.size);
    let cover = 0;
    // Every word of the bank phrasing appears in the label. One-word phrasings are weaker evidence on long labels.
    if (inter === tc.size) cover = tc.size >= 2 ? 0.88 : 0.6 + 0.4 / tl.size;
    // The phrasing appears word for word inside the label.
    if (nc.includes(" ") && (" " + nl + " ").includes(" " + nc + " ")) cover = Math.max(cover, 0.92);
    return Math.max(dice, cover);
  }

  /** Best bank entry for a label: {entry, score}. Entries with empty answers still match, so we can say what's missing. */
  function matchQuestion(label, bank) {
    let entry = null, score = 0;
    for (const e of bank) {
      for (const c of [e.q, ...(e.aliases || [])]) {
        const s = similarity(label, c);
        if (s > score) { score = s; entry = e; }
      }
    }
    return { entry, score };
  }

  const DECLINE = /\b(decline|prefer not|not wish|dont wish|do not wish|choose not|rather not|not to (say|answer|disclose|self identify))\b/;
  const polarity = (s) => { const n = norm(s); return /^(yes|y|true)\b/.test(n) ? 1 : /^(no|n|false)\b/.test(n) ? -1 : 0; };
  const negated = (s) => /\b(no|not|dont|do not|wont|will not|cannot|cant|am not|n a)\b/.test(norm(s));

  /** Which of `options` (strings) best fits a saved answer: {index, score}; index -1 when nothing fits. */
  function pickOption(answer, options) {
    const na = norm(answer);
    let index = -1, score = 0;
    if (!na) return { index, score };
    const pol = polarity(answer), decline = DECLINE.test(na);
    options.forEach((opt, i) => {
      const no = norm(opt);
      if (!no) return;
      let s;
      if (no === na) s = 1;
      else if (decline) s = DECLINE.test(no) ? 0.9 : 0;
      else if (pol && polarity(opt)) s = polarity(opt) === pol ? 0.95 : 0;
      // "Yes" against options like "I am authorized..." / "I am not authorized..."
      else if (pol && options.length <= 4) s = (negated(opt) ? -1 : 1) === pol ? 0.7 : 0;
      else s = 0.95 * Math.max(similarity(opt, answer), similarity(answer, opt));
      if (s > score) { score = s; index = i; }
    });
    return { index, score };
  }

  /** Checkboxes and fields that sign or agree to something. The user answers these, always. */
  const isConsent = (label) =>
    /\b(i agree|agree to|i certify|certify that|i acknowledge|acknowledge that|i consent|consent to|i understand|attest|terms of|privacy policy|signature|e signature|sign your name)\b/.test(norm(label));

  /** Questions that only apply depending on an earlier answer ("If you answered Yes…", "If so, …"). */
  const isFollowUp = (label) => /^(if (you answered|you selected|yes|no|so|applicable)|please (explain|specify|describe) if)\b/.test(norm(label));

  return { GOOD, MAYBE, clean, norm, tokens, similarity, matchQuestion, pickOption, polarity, isConsent, isFollowUp };
})();

if (typeof module !== "undefined") module.exports = ApplyMatch;
