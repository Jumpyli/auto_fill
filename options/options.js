import * as pdfjs from "../vendor/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc = browser.runtime.getURL("vendor/pdf.worker.min.mjs");

const $ = (id) => document.getElementById(id);
let bank = [];
let query = "";

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") el.value = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...kids.flat().filter((k) => k != null && k !== false));
  return el;
}

/* ---------- Saving ---------- */
let saveTimer;
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await browser.storage.local.set({ bank });
    $("saved").hidden = false;
    setTimeout(() => ($("saved").hidden = true), 1200);
  }, 400);
}

/* ---------- Bank editor ---------- */
function render() {
  const q = query.toLowerCase();
  const shown = bank.filter((e) => !q || [e.q, e.a, ...(e.aliases || [])].join(" ").toLowerCase().includes(q));
  const cats = [...CATEGORIES, ...new Set(bank.map((e) => e.cat).filter((c) => !CATEGORIES.includes(c)))];
  $("bank").replaceChildren(...cats.map((cat) => {
    const items = shown.filter((e) => e.cat === cat);
    if (!items.length) return null;
    const all = bank.filter((e) => e.cat === cat);
    return h("section", { class: "cat" },
      h("h2", {}, cat, h("span", { text: `${all.filter((e) => (e.a || "").trim()).length}/${all.length} answered` })),
      items.map(entryRow));
  }).filter(Boolean));
  if (!shown.length) $("bank").replaceChildren(h("p", { class: "muted", text: query ? `Nothing matches "${query}".` : "Your bank is empty. Add a question above." }));
}

function entryRow(e) {
  const ta = h("textarea", { rows: Math.min(10, Math.max(1, Math.ceil((e.a || "").length / 60))), placeholder: "Your answer", value: e.a || "", "aria-label": `Answer to ${e.q}` });
  const row = h("div", { class: "entry" + ((e.a || "").trim() ? "" : " empty") });
  ta.addEventListener("input", () => { e.a = ta.value; row.classList.toggle("empty", !ta.value.trim()); saveSoon(); });
  const q = h("input", { class: "q", value: e.q, "aria-label": "Question" });
  q.addEventListener("input", () => { e.q = q.value; saveSoon(); });
  const al = h("input", { class: "al", value: (e.aliases || []).join(", "), placeholder: "Other wordings, separated by commas", "aria-label": "Other wordings" });
  al.addEventListener("input", () => { e.aliases = al.value.split(",").map((s) => s.trim()).filter(Boolean); saveSoon(); });
  const del = h("button", { class: "ghost", text: "Delete", title: "Delete this question" });
  del.addEventListener("click", () => {
    if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = "Confirm"; del.classList.add("danger"); return; }
    bank = bank.filter((x) => x !== e); saveSoon(); render();
  });
  row.append(h("div", { class: "left" }, q, al), ta, del);
  return row;
}

$("search").addEventListener("input", (ev) => { query = ev.target.value.trim(); render(); });
for (const c of CATEGORIES) $("new-cat").append(h("option", { value: c, text: c }));
$("new-cat").value = "Short answers";
$("add").addEventListener("click", () => {
  bank.push({ id: "custom-" + Date.now().toString(36), cat: $("new-cat").value, q: "New question", aliases: [], a: "" });
  query = ""; $("search").value = ""; saveSoon(); render();
  const qs = document.querySelectorAll(".entry .q");
  const last = [...qs].find((i) => i.value === "New question");
  if (last) { last.select(); last.scrollIntoView({ block: "center" }); }
});
$("overwrite").addEventListener("change", (ev) => browser.storage.local.set({ settings: { overwrite: ev.target.checked } }));

/* ---------- Resume ---------- */
function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function pdfText(buf) {
  // pdf.js hands `data` off to its worker, which empties the original buffer, so give it a copy.
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)), isEvalSupported: false }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    for (const item of content.items) text += item.str + (item.hasEOL ? "\n" : " ");
    text += "\n";
  }
  return text;
}

$("resume-file").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  $("resume-current").textContent = "Reading…";
  let buf;
  try {
    buf = await file.arrayBuffer();
    await browser.storage.local.set({ resume: { name: file.name, type: file.type || "application/pdf", data: toBase64(buf) } });
    showResume(file.name);
  } catch (e) {
    console.error("Apply Autofill: saving resume failed", e);
    $("resume-current").textContent = `Couldn't save that file (${e.message || e}).`;
    return;
  }
  let text;
  try {
    text = /\.pdf$/i.test(file.name) || file.type === "application/pdf" ? await pdfText(buf) : new TextDecoder().decode(buf);
  } catch (e) {
    console.error("Apply Autofill: reading resume failed", e);
    $("resume-current").textContent = `Saved ${file.name} for upload fields, but couldn't read its text (${e.message || e}).`;
    return;
  }
  if (text.replace(/\s/g, "").length < 20) {
    $("resume-current").textContent = `Saved ${file.name} for upload fields, but it has no readable text. It may be a scanned image; export a text-based PDF from your editor to fill in answers from it.`;
    return;
  }
  showReview(ResumeParser.parse(text).values);
});

function showReview(values) {
  const rows = Object.entries(values).map(([id, val]) => ({ id, val, entry: bank.find((e) => e.id === id) })).filter((r) => r.entry);
  const review = $("review");
  if (!rows.length) {
    review.replaceChildren(h("p", { class: "muted", text: "Nothing recognizable was found. You can still fill in the bank by hand." }));
    review.hidden = false; $("review-actions").hidden = true;
    return;
  }
  review.replaceChildren(h("p", { class: "muted", text: `Found ${rows.length} answers. Fix anything that looks off, then save.` }),
    ...rows.map((r) => {
      const has = (r.entry.a || "").trim();
      const box = h("input", { type: "checkbox", checked: !has, "data-id": r.id, style: "width:auto" });
      const val = r.val.includes("\n") ? h("textarea", { rows: 3, value: r.val, "data-val": r.id }) : h("input", { value: r.val, "data-val": r.id });
      return h("div", {},
        h("label", {}, box, h("strong", { text: r.entry.q }), val),
        has ? h("div", { class: "cur", text: `You already have: ${has.slice(0, 120)}` }) : null);
    }));
  review.hidden = false; $("review-actions").hidden = false;
}

$("review-save").addEventListener("click", async () => {
  let n = 0;
  for (const box of document.querySelectorAll("#review input[type=checkbox]")) {
    if (!box.checked) continue;
    const entry = bank.find((e) => e.id === box.dataset.id);
    const val = document.querySelector(`[data-val="${box.dataset.id}"]`).value.trim();
    if (entry && val) { entry.a = val; n++; }
  }
  await browser.storage.local.set({ bank });
  $("review").replaceChildren(h("p", { class: "saved", text: `Saved ${n} answer${n === 1 ? "" : "s"}. Fill in the rest below.` }));
  $("review-actions").hidden = true;
  render();
});

function showResume(name) {
  $("resume-current").textContent = name ? `Attached to forms: ${name}` : "";
  $("resume-remove").hidden = !name;
}
$("resume-remove").addEventListener("click", async () => {
  await browser.storage.local.remove("resume");
  $("resume-file").value = "";
  showResume(null);
});

/* ---------- Import / export ---------- */
$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ bank }, null, 2)], { type: "application/json" });
  const a = h("a", { href: URL.createObjectURL(blob), download: "answer-bank.json" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("import").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data) ? data : data.bank;
    if (!Array.isArray(incoming)) throw new Error();
    let added = 0, updated = 0;
    for (const e of incoming) {
      if (!e || !e.q) continue;
      const mine = bank.find((b) => b.id === e.id || b.q.toLowerCase() === String(e.q).toLowerCase());
      if (mine) { if (e.a && e.a !== mine.a) { mine.a = e.a; updated++; } }
      else { bank.push({ id: e.id || "import-" + Date.now().toString(36) + added, cat: e.cat || "Learned", q: e.q, aliases: e.aliases || [], a: e.a || "" }); added++; }
    }
    await browser.storage.local.set({ bank });
    $("io-status").textContent = `Imported: ${added} new, ${updated} updated.`;
    render();
  } catch {
    $("io-status").textContent = "That file isn't an answer bank export.";
  }
  ev.target.value = "";
});

/* ---------- Start ---------- */
const stored = await browser.storage.local.get(["bank", "resume", "settings"]);
bank = stored.bank || DEFAULT_BANK.map((e) => ({ ...e }));
if (!stored.bank) await browser.storage.local.set({ bank });
$("overwrite").checked = !!(stored.settings && stored.settings.overwrite);
showResume(stored.resume && stored.resume.name);
render();
