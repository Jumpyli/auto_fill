/* Custom (site-built) dropdowns: role="combobox" + role="listbox" menus. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadPage, bankWith } = require("./helpers");

// Page code shared by the tests: builds a menu the way a site's widget would.
const MENU = `
  function menu(id, items, onPick, parent) {
    document.getElementById(id)?.remove();
    const lb = document.createElement("ul"); lb.id = id; lb.setAttribute("role", "listbox");
    for (const t of items) {
      const li = document.createElement("li"); li.setAttribute("role", "option"); li.textContent = t;
      li.addEventListener("click", () => { onPick(t); lb.remove(); }); lb.append(li);
    }
    (parent || document.body).append(lb);
  }`;

test("opens, picks and closes common dropdown styles; leaves answered ones alone", async () => {
  const bank = bankWith({ sponsorship: "No", veteran: "Not a veteran", location: "Texas", gender: "Male" });
  const html = `<form>
   <div><label id="l1">Will you require sponsorship for an employment Visa?</label>
     <input id="c1" role="combobox" aria-labelledby="l1" aria-controls="lb1" aria-expanded="false" readonly><div id="slot"></div></div>
   <div><span id="l2">Please select your Protected Veteran Status. (A definition of each group is provided above.)</span>
     <button type="button" id="c2" aria-haspopup="listbox" aria-labelledby="l2">Select...</button></div>
   <div><label for="c3">Current location</label><input id="c3" role="combobox" aria-controls="lb3" aria-autocomplete="list"></div>
   <div><label for="c4">Gender</label><input id="c4" role="combobox" aria-controls="lb4" value="Female"></div>
   <button type="submit" id="submit">Submit</button>
  </form>`;
  const pageScript = MENU + `
    const c1 = document.getElementById("c1");   // read-only input, opens on mousedown
    c1.addEventListener("mousedown", () => { c1.setAttribute("aria-expanded", "true");
      menu("lb1", ["Yes", "No"], (t) => { c1.value = t; c1.setAttribute("aria-expanded", "false"); }, document.getElementById("slot")); });
    const c2 = document.getElementById("c2");   // button that opens a menu at the end of the page
    c2.addEventListener("click", () => menu("portal", ["I identify as one or more of the classifications of protected veteran",
      "I am not a protected veteran", "I don't wish to answer"], (t) => { c2.textContent = t; }));
    const c3 = document.getElementById("c3");   // long list that only shows matches after typing
    const states = ["Alabama", "Alaska", "Arizona", "Texas", "Utah"];
    c3.addEventListener("input", () => { const q = c3.value.toLowerCase();
      menu("lb3", states.filter((s) => s.toLowerCase().startsWith(q)).slice(0, 2), (t) => { c3.value = t; }); });
    c3.addEventListener("mousedown", () => menu("lb3", states.slice(0, 2), (t) => { c3.value = t; }));
    window.submitted = false;
    document.getElementById("submit").addEventListener("click", () => (window.submitted = true));`;
  const { w, d, send } = loadPage(html, { bank, pageScript });
  await send({ type: "fill" });
  assert.equal(d.getElementById("c1").value, "No");
  assert.equal(d.getElementById("c2").textContent, "I am not a protected veteran");
  assert.equal(d.getElementById("c3").value, "Texas");
  assert.equal(d.getElementById("c4").value, "Female", "an answered dropdown is left alone");
  assert.equal(d.querySelectorAll("[role=listbox]").length, 0, "no menu left open");
  assert.equal(w.submitted, false);
});

test("Lockheed (Eightfold) case: never reads or clicks another question's open menu", async () => {
  const bank = bankWith({ veteran: "Not a veteran", sponsorship: "No", "work-auth": "Yes" },
    [{ id: "learned-visa", cat: "Learned", q: "If yes, please indicate Visa status", aliases: [], a: "A citizen of the U.S." }]);
  const html = `<form>
   <div><label id="sp_l">Will you require sponsorship for an employment Visa?</label>
     <input id="sp" role="combobox" aria-controls="list-10" aria-expanded="false" aria-labelledby="sp_l" placeholder="Select" value=""></div>
   <ul id="list-5" role="listbox" class="stale"><li role="option">Yes</li><li role="option">No</li></ul>
   <div><label id="visa_l">If yes, please indicate Visa status</label>
     <input id="input-41" role="combobox" aria-controls="list-39" aria-expanded="false" aria-labelledby="visa_l" placeholder="Select" value=""></div>
   <div><label id="vet_l">Please select your Protected Veteran Status. (A definition of each group is provided above.)</label>
     <input id="input-80" role="combobox" aria-controls="list-78" aria-expanded="false" aria-labelledby="vet_l" placeholder="Select" value="Not a veteran"></div>
   <div><label id="auth_l">Are you legally authorized to work in the United States?</label>
     <input id="auth" role="combobox" aria-controls="list-90" aria-expanded="false" aria-labelledby="auth_l" placeholder="Select" value=""></div>
  </form>`;
  // The stale Yes/No list belongs to no dropdown here; the work-auth dropdown opens its own menu only when typed into.
  const pageScript = MENU + `
    window.staleClicks = 0;
    document.querySelectorAll(".stale li").forEach((li) => li.addEventListener("click", () => window.staleClicks++));
    const a = document.getElementById("auth");
    a.addEventListener("input", () => { menu("list-90", ["Yes", "No"], (t) => { a.value = t; }); a.setAttribute("aria-expanded", "true"); });`;
  const { w, d, send, panel, hasDebugButton } = loadPage(html, { bank, settings: { overwrite: true }, pageScript });
  await send({ type: "fill" });
  assert.equal(w.staleClicks, 0, "nothing clicked in another question's menu");
  assert.equal(d.getElementById("sp").value, "");
  assert.equal(d.getElementById("input-41").value, "");
  assert.equal(d.getElementById("input-80").value, "Not a veteran", "already-correct dropdown is not opened");
  assert.equal(d.getElementById("auth").value, "Yes", "a menu that opens on typing still works");
  assert.ok(panel().some((row) => row.includes("Couldn't open this dropdown's menu")));
  assert.ok(hasDebugButton());
});

test("Lockheed (Eightfold) with Replace answers on: answered dropdowns with no bank answer keep their value and aren't red", async () => {
  const bank = bankWith({ "clearance-active": "No" });
  // Markup from the real page's Copy debug info (2026-11-23), trimmed. Saved progress puts the answer in the input's value.
  const combo = (id, label, list, value) => `<div><span id="${id}_l">${label}</span>
    <div class="input-module_expandable-wrapper__bunkT"><div class="select-module_select-input-group__g64bR">
      <input aria-controls="${list}" aria-expanded="false" aria-labelledby="${id}_l" aria-required="true" role="combobox" id="${id}" placeholder="Select" type="text" value="${value}">
      <div class="input-module_action-wrapper__QLmr7"><button aria-label="Clear ${label}" type="button">×</button>
        <button aria-hidden="true" tabindex="-1" type="button">v</button></div></div></div></div>`;
  const html = `<form>
    ${combo("hear", "How did you hear about this position?", "list-176", "Company Website")}
    ${combo("age", "Are you 16 years or older?", "list-179", "Yes")}
    ${combo("pron", "Preferred Pronoun", "list-173", "")}
    ${combo("clr", "Security Clearance - Active", "list-215", "None of the Above")}
  </form>`;
  const pageScript = MENU + `
    const clr = document.getElementById("clr");
    clr.addEventListener("mousedown", () => { clr.setAttribute("aria-expanded", "true");
      menu("list-215", ["Secret", "Top Secret", "None of the Above"], (t) => { clr.value = t; clr.setAttribute("aria-expanded", "false"); }); });`;
  const page = loadPage(html, { bank, pageScript, settings: { overwrite: true } });
  await page.send({ type: "fill" });
  const rows = page.panel();
  const row = (q) => rows.find((r) => r.startsWith(q)) || "";
  assert.match(row("How did you hear about this position?"), /Already filled in/, rows.join("\n"));
  assert.match(row("Are you 16 years or older?"), /Already filled in/, rows.join("\n"));
  assert.doesNotMatch(row("Preferred Pronoun"), /Already filled in|Kept/, "an empty dropdown stays red");
  assert.match(row("Security Clearance - Active"), /Kept "None of the Above"/, rows.join("\n"));
  assert.equal(page.d.getElementById("clr").value, "None of the Above", "the site's value is untouched");
  assert.equal(page.d.getElementById("hear").value, "Company Website");
  assert.equal(page.hasDebugButton(), true, "red dropdowns can be copied as debug info");
});

test("Lockheed case: changing an already-answered dropdown after Fill, then Save, learns the new choice", async () => {
  const bank = bankWith({ veteran: "Not a veteran" });
  const q = "Please select your Protected Veteran Status. (A definition of each group is provided above.)";
  const html = `<form><div><span id="vet_l">${q}</span>
    <div><input id="vet" role="combobox" aria-controls="list-78" aria-expanded="false" aria-labelledby="vet_l" placeholder="Select" value="I am not a protected veteran"></div></div>
    <div><span id="ac_l">Security Clearance - Active</span>
    <div><input id="ac" role="combobox" aria-controls="list-80" aria-expanded="false" aria-labelledby="ac_l" placeholder="Select" value=""></div></div></form>`;
  const extra = [{ id: "learned-ac", cat: "Learned", q: "Security Clearance - Active", aliases: [], a: "Secret" }];
  const page = loadPage(html, { bank: bank.concat(extra) });
  await page.send({ type: "fill" }); // both left alone or failed: no menus in this page
  page.d.getElementById("vet").value = "I don't wish to answer";             // the user picks a different option
  page.d.getElementById("ac").value = "None of the Above";                   // conflicts with an exact saved answer
  assert.equal((await page.send({ type: "learn" })).learned, 1);
  const saved = page.store.bank.find((b) => b.q === q);
  assert.equal(saved && saved.a, "I don't wish to answer", "saved under the form's exact wording");
  assert.equal(page.store.bank.find((b) => b.id === "veteran").a, "Not a veteran", "the broader answer is unchanged");
  assert.equal(page.store.bank.find((b) => b.id === "learned-ac").a, "Secret", "an exact saved answer is never overwritten");
  const shadow = [...page.d.documentElement.children].pop().shadowRoot;
  assert.match(shadow.querySelector(".msg").textContent, /already has a different answer for "Security Clearance - Active"/);
  assert.equal((await page.send({ type: "learn" })).learned, 0, "saving twice adds nothing");
});
