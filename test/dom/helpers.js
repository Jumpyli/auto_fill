/* Loads the content script into a simulated page (jsdom) with a fake `browser` API, so page tests run in Node. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const { DEFAULT_BANK } = require(path.join(ROOT, "lib/defaults.js"));

/** The starter bank with answers filled in by id, plus any extra entries. */
const bankWith = (answers, extra = []) => DEFAULT_BANK.map((e) => ({ ...e, a: answers[e.id] || "" })).concat(extra);

/**
 * html: the page's form. pageScript: code that plays the site's own widgets (runs before the add-on loads).
 * Returns the window, a `send(msg)` that talks to the content script like background.js does, the fake storage,
 * and `panel()` with the results panel's rows as text.
 */
function loadPage(html, { bank, settings = {}, pageScript = "" } = {}) {
  const dom = new JSDOM(html, { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  // jsdom has no layout: treat every element as visible, and make scrolling a no-op.
  w.Element.prototype.getClientRects = function () { return [{}]; };
  w.Element.prototype.scrollIntoView = function () {};
  // Open the panel's shadow root so tests can read it.
  const attach = w.Element.prototype.attachShadow;
  w.Element.prototype.attachShadow = function (o) { return attach.call(this, { ...o, mode: "open" }); };
  if (pageScript) w.eval(pageScript);

  let listener;
  const store = { bank, settings, resume: null };
  w.browser = {
    runtime: { onMessage: { addListener: (f) => (listener = f) } },
    storage: { local: { get: async () => store, set: async (o) => Object.assign(store, o) } },
  };
  for (const f of ["lib/match.js", "content/fill.js"]) w.eval(fs.readFileSync(path.join(ROOT, f), "utf8"));

  const shadow = () => {
    const host = [...w.document.documentElement.children].pop();
    return host && host.shadowRoot;
  };
  return {
    w,
    d: w.document,
    store,
    send: (msg) => listener(msg),
    panel: () => [...(shadow()?.querySelectorAll("li") || [])].map((li) => li.textContent.replace(/\s+/g, " ").trim()),
    hasDebugButton: () => !!shadow()?.querySelector("[data-a=debug]"),
  };
}

const checked = (d, name) => [...d.querySelectorAll(`input[name="${name}"]`)].find((i) => i.checked)?.value;

module.exports = { loadPage, bankWith, checked };
