/* Finds the questions on an application page, fills them from the answer bank, and shows what it did.
   It never clicks submit, next, or any other button, and never presses Enter. */
(() => {
  if (window.__applyAutofillLoaded) return;
  window.__applyAutofillLoaded = true;

  const M = ApplyMatch;
  const COLORS = { good: "#1F9D55", check: "#D99A00", missing: "#D64545", skip: "#7A869A" };
  const AUTOCOMPLETE = { "given-name": "first-name", "family-name": "last-name", name: "full-name", email: "email", tel: "phone", "tel-national": "phone" };
  let items = [];
  let outlined = [];

  /* ---------- Reading the page ---------- */
  const squash = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const textOf = (el) => squash(el.innerText || el.textContent);
  // Text of a container without the controls inside it (a <select> inside a label would add every option).
  function textWithout(container) {
    const c = container.cloneNode(true);
    c.querySelectorAll("select, option, input, textarea, button, [data-aa-opt]").forEach((n) => n.remove());
    return squash(c.textContent);
  }
  function visible(el) {
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }
  function byIds(ids) {
    return squash((ids || "").split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map(textOf).join(" "));
  }

  function labelFor(el) {
    const by = byIds(el.getAttribute("aria-labelledby"));
    if (by) return by;
    if (el.labels && el.labels.length) {
      const t = [...el.labels].map(textWithout).join(" ");
      if (t) return t;
    }
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label");
    const wrap = el.closest("label");
    if (wrap && textWithout(wrap)) return textWithout(wrap);
    let a = el.parentElement;
    for (let i = 0; a && i < 4; i++, a = a.parentElement) {
      if (a.querySelectorAll("input:not([type=hidden]), select, textarea").length > 1) break;
      const t = textWithout(a);
      if (t && t.length <= 300) return t;
    }
    return el.placeholder || (el.name || el.id || "").replace(/[_\-[\].]+/g, " ");
  }

  function optionText(input) {
    if (input.labels && input.labels.length) return textOf(input.labels[0]);
    if (input.getAttribute("aria-label")) return input.getAttribute("aria-label");
    const wrap = input.closest("label");
    if (wrap) return textOf(wrap);
    const next = input.nextElementSibling || input.nextSibling;
    return squash(next && (next.textContent || next.nodeValue)) || input.value;
  }

  function groupQuestion(inputs) {
    const first = inputs[0];
    // A section title ("Application Questions") wraps several questions; only trust a container that holds just this one.
    const onlyThis = (c) => [...c.querySelectorAll("input:not([type=hidden]), select, textarea")].every((i) => inputs.includes(i));
    const fs = first.closest("fieldset");
    const legend = fs && onlyThis(fs) && fs.querySelector("legend");
    if (legend && textOf(legend)) return textOf(legend);
    const g = first.closest('[role="radiogroup"], [role="group"]');
    if (g && onlyThis(g)) {
      const t = byIds(g.getAttribute("aria-labelledby")) || g.getAttribute("aria-label");
      if (t) return t;
    }
    // Smallest container holding every option, minus the option labels themselves.
    const optLabels = inputs.flatMap((i) => [...(i.labels || []), i.closest("label")]).filter(Boolean);
    optLabels.forEach((l) => l.setAttribute("data-aa-opt", ""));
    try {
      let a = first.parentElement;
      while (a && !inputs.every((i) => a.contains(i))) a = a.parentElement;
      for (let i = 0; a && i < 4 && onlyThis(a); i++, a = a.parentElement) {
        const t = textWithout(a);
        if (t.length >= 3 && t.length <= 400) return t;
        if (t.length > 400) break;
      }
    } finally {
      optLabels.forEach((l) => l.removeAttribute("data-aa-opt"));
    }
    return (first.name || "").replace(/[_\-[\].]+/g, " ");
  }

  function collect() {
    const fields = [];
    const groups = new Map();
    for (const el of document.querySelectorAll("input, select, textarea")) {
      const type = (el.type || "").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "password", "search"].includes(type)) continue;
      if (el.disabled) continue;
      if (type === "file") { fields.push({ kind: "file", el, label: labelFor(el) }); continue; }
      if (type === "radio" || type === "checkbox") {
        if (!visible(el) && !(el.labels && [...el.labels].some(visible))) continue;
        const key = type + ":" + (el.name || Math.random());
        if (!groups.has(key)) { const g = { kind: type, inputs: [] }; groups.set(key, g); fields.push(g); }
        groups.get(key).inputs.push(el);
        continue;
      }
      // Custom dropdowns are often read-only inputs, so check for them before skipping read-only fields.
      const combo = el.getAttribute("role") === "combobox" || (el.getAttribute("aria-autocomplete") && el.tagName === "INPUT");
      if (!visible(el) || (el.readOnly && !combo)) continue;
      fields.push({ kind: combo ? "combo" : el.tagName === "SELECT" ? "select" : "text", el, label: labelFor(el) });
    }
    for (const el of document.querySelectorAll('[role="combobox"]:not(input), button[aria-haspopup="listbox"]')) {
      if (!visible(el) || el.getAttribute("aria-disabled") === "true" || el.querySelector("input, select, textarea")) continue;
      if (fields.some((f) => f.el && f.el.contains && (f.el.contains(el) || el.contains(f.el)))) continue;
      fields.push({ kind: "combo", el, label: labelFor(el) });
    }
    fields.sort((a, b) => {
      const ea = a.el || a.inputs[0], eb = b.el || b.inputs[0];
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    for (const f of fields) {
      if (f.inputs) {
        if (f.kind === "checkbox" && f.inputs.length === 1) { f.kind = "check1"; f.el = f.inputs[0]; f.label = labelFor(f.el); }
        else { f.label = groupQuestion(f.inputs); f.el = f.inputs[0]; }
      }
      f.label = M.clean(f.label).slice(0, 300);
    }
    return fields;
  }

  /* ---------- Writing to the page ---------- */
  // Use the prototype setter so frameworks like React notice the change.
  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }
  function setChecked(el, on) {
    if (el.checked === on) return;
    el.click();
    if (el.checked !== on) { el.checked = on; el.dispatchEvent(new Event("change", { bubbles: true })); }
  }
  function attachFile(el, resume) {
    const bin = atob(resume.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], resume.name, { type: resume.type || "application/pdf" }));
    el.files = dt.files;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* ---------- Custom dropdowns ---------- */
  // Site-built menus (role="combobox" + role="listbox"). We open the menu, click the matching option, and close it.
  // Only elements with role="option" inside the menu are ever clicked.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function waitFor(fn, ms = 1500) {
    for (let t = 0; t < ms; t += 50) { const v = fn(); if (v) return v; await sleep(50); }
    return fn();
  }
  function comboValue(el) {
    const t = el.tagName === "INPUT" ? el.value.trim() : textWithout(el);
    return /^(select|choose|please|--|search)/i.test(t) ? "" : t;
  }
  function press(el) {
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      const E = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      el.dispatchEvent(new E(type, { bubbles: true, cancelable: true, button: 0 }));
    }
  }
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, code: k, bubbles: true, cancelable: true }));
  // The menu belonging to this dropdown. When the dropdown names its menu (aria-controls / aria-owns), only that menu
  // counts: borrowing another visible menu once made the add-on read, and could make it click, a different question's
  // options. Without a named menu, only a listbox that appeared after we opened this dropdown counts.
  function menuOptions(el, before) {
    const ids = `${el.getAttribute("aria-controls") || ""} ${el.getAttribute("aria-owns") || ""}`.split(/\s+/).filter(Boolean);
    const lists = ids.length
      ? ids.map((id) => document.getElementById(id)).filter(Boolean)
      : [...document.querySelectorAll('[role="listbox"]')].filter((l) => visible(l) && !(before && before.has(l)));
    const opts = lists.flatMap((l) => [...l.querySelectorAll('[role="option"]')]).filter((o) => o.getAttribute("aria-disabled") !== "true");
    return opts.length ? opts : null;
  }
  function typeText(el, text) {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Markup around a dropdown that couldn't be driven, so its structure can be studied ("Copy debug info").
  const cut = (h, n = 4000) => (h.length > n ? h.slice(0, n) + "…[cut]" : h);
  function snapshot(el) {
    const box = el.parentElement && el.parentElement.parentElement || el;
    return cut(box.outerHTML);
  }
  // When no role="listbox" turned up, look for anything that resembles an open menu.
  function openMenusHtml() {
    const guesses = [...document.querySelectorAll('[class*="menu" i], [class*="option" i], [class*="dropdown" i], [class*="popover" i], [class*="listbox" i], ul')]
      .filter((n) => visible(n) && n.querySelectorAll('li, [role="option"], [class*="option" i]').length > 1)
      .slice(-3); // menus are usually added at the end of the page when they open
    return guesses.map((n) => cut(n.outerHTML, 2500));
  }

  async function fillCombo(it) {
    const el = it.el;
    const steps = [];
    const state = (what) => steps.push(`${what}: expanded=${el.getAttribute("aria-expanded")}, menu=${menuOptions(el, before) ? "found" : "none"}`);
    const fail = (why, seen) => {
      it.status = "missing";
      it.note = why === "no-menu"
        ? `Couldn't open this dropdown's menu. Pick "${short(it.answer, 50)}" yourself.`
        : `Menu opened, but no option matched "${short(it.answer, 40)}" (saw: ${short(seen.join(", "), 80)}). Pick it yourself.`;
      // With "Replace answers" on, a dropdown that already had a value still has it: say so instead of showing it as empty.
      const kept = comboValue(el);
      if (kept) { it.status = "check"; it.value = kept; it.note = `Kept "${short(kept, 40)}". ` + it.note.replace(/ Pick (it|".*") yourself\.$/, " Check it's right."); }
      it.debug = { label: it.label, answer: it.answer, why, options: seen.slice(0, 30), steps, html: snapshot(el) };
    };
    // Already showing the answer: nothing to do, and no menu to open.
    const shown = comboValue(el);
    if (shown && M.pickOption(it.answer, [shown]).score >= 0.85) {
      it.status = it.sure ? "good" : "check"; it.value = shown;
      return;
    }
    const original = el.tagName === "INPUT" ? el.value : null;
    const before = new Set(document.querySelectorAll('[role="listbox"]'));
    el.scrollIntoView({ block: "center" });
    el.focus();
    press(el);
    let opts = await waitFor(() => menuOptions(el, before), 800);
    state("click");
    if (!opts) { key(el, "ArrowDown"); opts = await waitFor(() => menuOptions(el, before), 800); state("ArrowDown"); }
    const openHtml = opts ? null : openMenusHtml();
    // Long lists (states, schools) only show matches after typing.
    let pick = opts ? M.pickOption(it.answer, opts.map(textOf)) : { index: -1, score: 0 };
    if (pick.score < 0.6 && el.tagName === "INPUT") {
      typeText(el, it.answer.slice(0, 40));
      opts = await waitFor(() => menuOptions(el, before), 1200);
      state("typed answer");
      pick = opts ? M.pickOption(it.answer, opts.map(textOf)) : pick;
    }
    if (!opts || pick.index < 0 || pick.score < 0.6) {
      const seen = opts ? opts.map(textOf) : [];
      if (!opts) it.menuHtml = openHtml;
      await closeMenu(el, before);
      if (original !== null && el.value !== original) typeText(el, original); // undo our typing
      return fail(opts ? "no-match" : "no-menu", seen);
    }
    const chosen = textOf(opts[pick.index]);
    opts[pick.index].scrollIntoView({ block: "nearest" });
    press(opts[pick.index]);
    await sleep(150);
    await closeMenu(el, before);
    const now = comboValue(el) || textOf(el.closest('[class*="select" i], [class*="dropdown" i]') || el);
    const confirmed = M.norm(now).includes(M.norm(chosen));
    it.value = chosen;
    it.status = confirmed && it.sure && pick.score >= 0.85 ? "good" : "check";
    if (!confirmed) it.note = "Picked from the menu. Make sure it stuck.";
  }
  // Leave no menu open for the next dropdown to stumble on.
  async function closeMenu(el, before) {
    if (el.getAttribute("aria-expanded") === "true" || menuOptions(el, before)) key(el, "Escape");
    el.blur();
    await waitFor(() => !menuOptions(el, before), 600);
  }

  /* ---------- Deciding what goes where ---------- */
  function hintId(el) {
    const ac = (el.getAttribute("autocomplete") || "").toLowerCase().split(/\s+/).pop();
    if (AUTOCOMPLETE[ac]) return AUTOCOMPLETE[ac];
    if (el.type === "email") return "email";
    if (el.type === "tel") return "phone";
    const n = M.norm(`${el.name || ""} ${el.id || ""}`.replace(/([a-z])([A-Z])/g, "$1 $2"));
    if (/\b(first name|firstname|fname|given name)\b/.test(n)) return "first-name";
    if (/\b(last name|lastname|lname|family name|surname)\b/.test(n)) return "last-name";
    if (/\blinkedin\b/.test(n)) return "linkedin";
    if (/\bgithub\b/.test(n)) return "github";
    return null;
  }
  function lookup(f, bank) {
    let { entry, score } = M.matchQuestion(f.label, bank);
    if (score < M.GOOD && f.el && f.kind === "text") {
      const id = hintId(f.el);
      const e = id && bank.find((b) => b.id === id);
      if (e) { entry = e; score = 0.9; }
    }
    return { entry, score };
  }
  const short = (s, n = 80) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  function hasValue(f) {
    return f.inputs ? f.inputs.some((i) => i.checked) && f.kind !== "check1"
      : f.kind === "select" ? f.el.selectedIndex > 0 && f.el.value !== ""
      : f.kind === "combo" ? !!comboValue(f.el) : f.kind !== "check1" && !!f.el.value.trim();
  }
  // With "Replace answers" on, a field that already has a value but gets nothing new from the bank keeps its value.
  // Showing it red ("No matching question") would say it's empty when it isn't. Lockheed's saved progress hit this.
  function handle(f, bank, resume, overwrite) {
    const r = decide(f, bank, resume, overwrite);
    if (!overwrite || r.status !== "missing" || r.pending || f.kind === "file" || !hasValue(f)) return r;
    const entry = r.entryId && bank.find((b) => b.id === r.entryId);
    if (!entry || !(entry.a || "").trim()) return { ...r, status: "skip", note: "Already filled in. Left as is." };
    return { ...r, status: "check", note: "Kept what's already there. " + r.note };
  }

  function decide(f, bank, resume, overwrite) {
    const item = { label: f.label || "(unlabeled field)", el: f.el, inputs: f.inputs, kind: f.kind, status: "missing", value: "", note: "" };

    if (f.kind === "file") {
      item.outline = f.el.closest("div") || f.el;
      if (!/\b(resume|cv|curriculum vitae)\b/i.test(f.label) || /cover/i.test(f.label)) return { ...item, status: "skip", note: "File upload. Attach this one yourself." };
      if (f.el.files && f.el.files.length && !overwrite) return { ...item, status: "skip", note: "A file is already attached." };
      if (!resume) return { ...item, note: "Add your resume on the answer bank page to attach it automatically." };
      try { attachFile(f.el, resume); } catch { return { ...item, note: "This site blocked automatic upload. Attach your resume yourself." }; }
      return { ...item, status: "check", value: resume.name, note: "Attached. Make sure the site shows your file." };
    }

    if (M.isConsent(f.label)) {
      return { ...item, status: "skip", note: "Agreement or signature. Answer this yourself." };
    }

    // Leave answers that are already there.
    if (!overwrite && hasValue(f)) return { ...item, status: "skip", note: "Already filled in. Left as is." };

    const { entry, score } = lookup(f, bank);
    // "If you answered Yes…" questions depend on another answer; fill them only from an answer saved for that exact question.
    if (M.isFollowUp(f.label) && score < 0.99) return { ...item, status: "skip", learnable: true, note: "Follow-up question. Answer it only if it applies to you." };
    if (!entry || score < M.MAYBE) return { ...item, note: "No matching question in your answer bank." };
    item.entryId = entry.id;
    const answer = (entry.a || "").trim();
    if (!answer) return { ...item, note: `Matches "${short(entry.q, 50)}", but that answer is empty.` };
    const sure = score >= M.GOOD;
    const guessNote = sure ? "" : `Best guess: used your answer to "${short(entry.q, 50)}".`;
    const notYesNo = (opts) => opts.length >= 2 && opts.every((o) => M.polarity(o)) && !M.polarity(answer)
      ? { ...item, note: `Yes/no question, but your answer to "${short(entry.q, 40)}" isn't yes or no. Choose one, then click Save my new answers.` } : null;

    if (f.kind === "combo") return { ...item, pending: true, answer, sure, note: guessNote };

    if (f.kind === "text") {
      setValue(f.el, answer);
      const max = f.el.maxLength > 0 ? f.el.maxLength : 0;
      if (max && answer.length > max) return { ...item, status: "check", value: answer, note: `Your answer is ${answer.length} characters; this box allows ${max}.` };
      return { ...item, status: sure ? "good" : "check", value: answer, note: guessNote };
    }

    if (f.kind === "select") {
      const opts = [...f.el.options].filter((o) => o.value !== "" && !/^\s*(select|choose|please|--)/i.test(o.text));
      const pick = M.pickOption(answer, opts.map((o) => o.text));
      const yn = notYesNo(opts.map((o) => o.text));
      if (yn) return yn;
      if (pick.index < 0 || pick.score < 0.6) return { ...item, note: `Your answer "${short(answer, 40)}" doesn't match any option.` };
      setValue(f.el, opts[pick.index].value);
      return { ...item, status: sure && pick.score >= 0.85 ? "good" : "check", value: opts[pick.index].text, note: guessNote };
    }

    if (f.kind === "radio") {
      item.outline = f.inputs[0].closest("fieldset") || f.inputs[0].parentElement.parentElement;
      const pick = M.pickOption(answer, f.inputs.map(optionText));
      const yn = notYesNo(f.inputs.map(optionText));
      if (yn) return yn;
      if (pick.index < 0 || pick.score < 0.6) return { ...item, note: `Your answer "${short(answer, 40)}" doesn't match any choice.` };
      setChecked(f.inputs[pick.index], true);
      return { ...item, status: sure && pick.score >= 0.85 ? "good" : "check", value: optionText(f.inputs[pick.index]), note: guessNote };
    }

    if (f.kind === "check1") {
      const pol = M.polarity(answer);
      if (!pol) return { ...item, note: `Checkbox, but your answer "${short(answer, 40)}" isn't yes or no.` };
      setChecked(f.el, pol > 0);
      return { ...item, status: sure ? "good" : "check", value: pol > 0 ? "Checked" : "Left unchecked", note: guessNote };
    }

    if (f.kind === "checkbox") {
      item.outline = f.inputs[0].closest("fieldset") || f.inputs[0].parentElement.parentElement;
      const parts = answer.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      const chosen = [];
      f.inputs.forEach((input) => {
        const t = optionText(input);
        if (parts.some((p) => M.pickOption(p, [t]).score >= 0.75)) { setChecked(input, true); chosen.push(t); }
      });
      if (!chosen.length) return { ...item, note: `Your answer "${short(answer, 40)}" doesn't match any choice.` };
      return { ...item, status: "check", value: chosen.join(", "), note: "Check that these are the boxes you want." };
    }
    return item;
  }

  /* ---------- Results panel ---------- */
  let host = null;
  function outline(el, color) {
    if (!el || !el.style) return;
    outlined.push([el, el.style.outline, el.style.outlineOffset]);
    el.style.outline = `2px solid ${color}`;
    el.style.outlineOffset = "2px";
  }
  function clearOutlines() {
    for (const [el, o, off] of outlined) { el.style.outline = o; el.style.outlineOffset = off; }
    outlined = [];
  }
  function closePanel() { clearOutlines(); if (host) host.remove(); host = null; }

  function renderPanel(message) {
    if (host) host.remove();
    host = document.createElement("div");
    host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;";
    const root = host.attachShadow({ mode: "closed" });
    const count = (s) => items.filter((i) => i.status === s).length;
    root.innerHTML = `<style>
      .p{width:340px;max-height:65vh;display:flex;flex-direction:column;background:#fff;color:#172033;border:1px solid #D9DFEA;border-radius:12px;
         box-shadow:0 10px 30px rgba(20,30,50,.18);font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
      .h{padding:12px 14px 10px;border-bottom:1px solid #E6EAF2}
      .t{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:14px}
      .x{border:0;background:none;font-size:18px;cursor:pointer;color:#5B6680;padding:0 4px}
      .sum{display:flex;gap:10px;margin-top:6px;font-variant-numeric:tabular-nums}
      .sum span{display:inline-flex;align-items:center;gap:5px}
      .safe{margin-top:6px;color:#5B6680;font-size:12px}
      .msg{margin-top:6px;padding:6px 8px;background:#EEF6F1;color:#1F6B44;border-radius:6px;font-size:12px}
      ul{list-style:none;margin:0;padding:4px 0;overflow:auto}
      li{display:grid;grid-template-columns:10px 1fr;gap:8px;padding:8px 14px;cursor:pointer}
      li:hover{background:#F3F5F9}
      .q{font-weight:600;overflow-wrap:anywhere}
      .v{color:#172033;overflow-wrap:anywhere}
      .n{color:#5B6680;font-size:12px}
      .d{width:9px;height:9px;border-radius:50%;margin-top:5px}
      .f{display:flex;gap:8px;padding:10px 14px;border-top:1px solid #E6EAF2}
      button.b{font:inherit;font-weight:600;padding:7px 10px;border-radius:7px;border:1px solid #D9DFEA;background:#fff;color:#172033;cursor:pointer}
      button.b.pr{background:#2C45B5;border-color:#2C45B5;color:#fff}
    </style>
    <div class="p" role="dialog" aria-label="Apply Autofill results">
      <div class="h">
        <div class="t">Apply Autofill <button class="x" aria-label="Close" data-a="close">×</button></div>
        <div class="sum">
          <span><i class="d" style="background:${COLORS.good}"></i>${count("good")} filled</span>
          <span><i class="d" style="background:${COLORS.check}"></i>${count("check")} to check</span>
          <span><i class="d" style="background:${COLORS.missing}"></i>${count("missing")} to answer</span>
        </div>
        <div class="safe">Nothing was submitted. Review the page, then submit it yourself.</div>
        ${message ? `<div class="msg"></div>` : ""}
      </div>
      <ul></ul>
      <div class="f">
        <button class="b pr" data-a="learn" title="Save answers you typed into red fields, or changed after filling, to your answer bank">Save my new answers</button>
        <button class="b" data-a="close">Clear highlights</button>
        ${items.some((i) => i.debug) ? '<button class="b" data-a="debug" title="Copy details about dropdowns that could not be filled">Copy debug info</button>' : ""}
      </div>
    </div>`;
    if (message) root.querySelector(".msg").textContent = message;
    const ul = root.querySelector("ul");
    const order = { missing: 0, check: 1, good: 2, skip: 3 };
    [...items].sort((a, b) => order[a.status] - order[b.status]).forEach((it) => {
      const li = document.createElement("li");
      const dot = document.createElement("i"); dot.className = "d"; dot.style.background = COLORS[it.status];
      const body = document.createElement("div");
      const q = document.createElement("div"); q.className = "q"; q.textContent = short(it.label, 110);
      body.append(q);
      if (it.value) { const v = document.createElement("div"); v.className = "v"; v.textContent = short(it.value, 140); body.append(v); }
      if (it.note) { const n = document.createElement("div"); n.className = "n"; n.textContent = it.note; body.append(n); }
      li.append(dot, body);
      li.addEventListener("click", () => { it.el.scrollIntoView({ behavior: "smooth", block: "center" }); try { it.el.focus({ preventScroll: true }); } catch {} });
      ul.append(li);
    });
    root.querySelectorAll("[data-a=close]").forEach((b) => b.addEventListener("click", closePanel));
    const dbg = root.querySelector("[data-a=debug]");
    if (dbg) dbg.addEventListener("click", () => {
      const info = JSON.stringify({ page: location.host + location.pathname, dropdowns: items.filter((i) => i.debug).map((i) => ({ ...i.debug, menuHtml: i.menuHtml || [] })) }, null, 1);
      const done = () => { dbg.textContent = "Copied"; };
      navigator.clipboard.writeText(info).then(done, () => {
        const ta = document.createElement("textarea"); ta.value = info; root.append(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch { dbg.textContent = "Copy failed"; }
        ta.remove();
      });
    });
    root.querySelector("[data-a=learn]").addEventListener("click", () => learn().then((n) => renderPanel(learnMessage(n))));
    document.documentElement.append(host);
  }

  /* ---------- Actions ---------- */
  async function fill(fields) {
    const { bank = [], resume = null, settings = {} } = await browser.storage.local.get(["bank", "resume", "settings"]);
    closePanel();
    items = fields.map((f) => {
      try { return handle(f, bank, resume, !!settings.overwrite); }
      catch (e) { return { label: f.label, el: f.el, status: "missing", note: "Couldn't fill this one automatically." }; }
    });
    for (const it of items.filter((i) => i.pending)) {
      delete it.pending;
      try { await fillCombo(it); }
      catch { it.status = "missing"; it.note = `Custom dropdown. Pick "${short(it.answer, 60)}" yourself.`; }
    }
    // Red dropdowns keep their markup too, so a site whose dropdowns are misread can be studied from "Copy debug info".
    for (const it of items) if (it.kind === "combo" && it.status === "missing" && !it.debug) it.debug = { label: it.label, why: "not-filled", note: it.note, html: snapshot(it.el) };
    for (const it of items) if (it.status !== "skip") outline(it.outline || it.el, COLORS[it.status]);
    // What each field showed after filling, so learning can tell which ones the user changed.
    for (const it of items) { try { it.initial = currentValue(it); } catch { it.initial = ""; } }
    renderPanel();
    const counts = { good: 0, check: 0, missing: 0, skip: 0 };
    for (const it of items) counts[it.status]++;
    return counts;
  }

  function currentValue(it) {
    const el = it.el;
    if (it.kind === "text") return el.value.trim();
    if (it.kind === "select") return el.selectedIndex > 0 ? el.options[el.selectedIndex].text.trim() : "";
    if (it.kind === "radio") {
      const on = (it.inputs || [el]).find((i) => i.checked);
      return on ? optionText(on) : "";
    }
    if (it.kind === "combo") return comboValue(el);
    return "";
  }

  function learnMessage(n) {
    const saved = n ? `Saved ${n} new answer${n > 1 ? "s" : ""} to your bank.` : "";
    // An answer saved for this exact question is never overwritten from the form; say where to change it.
    const kept = unsaved.length ? ` Your bank already has a different answer for "${short(unsaved[0], 60)}"${unsaved.length > 1 ? ` and ${unsaved.length - 1} more` : ""}. Change it on the answer bank page.` : "";
    return (saved + kept).trim() || "No new answers to save. Type or change answers on the page first.";
  }
  // Answers the user typed into red fields, or changed in any other field after Fill, become bank entries.
  let unsaved = [];
  async function learn() {
    const { bank = [] } = await browser.storage.local.get("bank");
    let n = 0;
    unsaved = [];
    for (const it of items) {
      if (!["text", "select", "radio", "combo"].includes(it.kind)) continue;
      const value = currentValue(it);
      const changed = it.initial !== undefined && M.norm(value) !== M.norm(it.initial);
      if ((it.status !== "missing" && !it.learnable && !changed) || !value || M.isConsent(it.label)) continue;
      // An exact question already answered is never overwritten. A broader question that matched
      // (e.g. "Degree" for "Do you possess the Bachelor's Degree?") keeps its answer, and this form's
      // wording is saved as its own entry, which then wins as an exact match next time.
      // Fields left alone because they were already filled were never matched, so match them now.
      const found = !it.entryId && M.matchQuestion(it.label, bank);
      const exact = bank.find((b) => M.norm(b.q) === M.norm(it.label));
      const matched = it.entryId ? bank.find((b) => b.id === it.entryId) : found && found.score >= M.GOOD && found.entry;
      if (exact) {
        if ((exact.a || "").trim()) {
          if (M.norm(exact.a) !== M.norm(value)) unsaved.push(it.label);
          continue;
        }
        exact.a = value;
      } else if (matched && !(matched.a || "").trim()) {
        matched.a = value;
      } else if (matched && M.norm(matched.a) === M.norm(value)) {
        continue;
      } else {
        bank.push({ id: "learned-" + Date.now().toString(36) + n, cat: "Learned", q: it.label, aliases: [], a: value });
      }
      it.status = "good"; it.value = value; it.note = "Saved to your answer bank."; it.initial = value;
      n++;
    }
    if (n) await browser.storage.local.set({ bank });
    return n;
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "fill") {
      const fields = collect();
      if (!fields.length) return; // stay silent so the frame that holds the form answers
      return fill(fields);
    }
    if (msg && msg.type === "learn" && items.length) return learn().then((n) => { renderPanel(learnMessage(n)); return { learned: n }; });
  });
})();
