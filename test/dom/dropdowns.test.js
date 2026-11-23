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

test("Lockheed (Eightfold) case: a choice shown as a chip beside an empty input counts as answered", async () => {
  const bank = bankWith({});
  const html = `<form>
   <div><label id="h_l">How did you hear about this position?</label>
     <div class="select"><div class="chips"><span class="chip"><button type="button" aria-label="Remove">×</button><span>Company Website</span></span></div>
       <input id="hear" role="combobox" aria-controls="list-5" aria-expanded="false" aria-labelledby="h_l" placeholder="Select" value=""></div></div>
   <div><label id="a_l">Are you 16 years or older?</label>
     <div class="select"><div class="chips"><span class="chip"><svg aria-hidden="true"></svg><span>Yes</span></span></div>
       <input id="age" role="combobox" aria-controls="list-6" aria-expanded="false" aria-labelledby="a_l" aria-describedby="a_err" placeholder="Select" value="">
       <span id="a_err" class="field-error"></span></div></div>
   <div><label id="p_l">Preferred Pronoun</label>
     <div class="select"><input id="pron" role="combobox" aria-controls="list-7" aria-expanded="false" aria-labelledby="p_l" aria-describedby="p_err" placeholder="Select" value="">
       <span id="p_err">This field is required</span></div></div>
  </form>`;
  const page = loadPage(html, { bank });
  await page.send({ type: "fill" });
  const rows = page.panel();
  assert.ok(rows.some((r) => r.startsWith("How did you hear about this position?") && r.includes("Already filled in")), rows.join("\n"));
  assert.ok(rows.some((r) => r.startsWith("Are you 16 years or older?") && r.includes("Already filled in")), rows.join("\n"));
  assert.ok(rows.some((r) => r.startsWith("Preferred Pronoun") && !r.includes("Already filled in")), "an empty dropdown with an error message stays unanswered");
  assert.equal(page.hasDebugButton(), true, "red dropdowns can be copied as debug info");
});
