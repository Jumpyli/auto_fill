/* Standard forms: text boxes, native dropdowns, radio buttons, agreements, signatures, learning. */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadPage, bankWith, checked } = require("./helpers");

test("fills a Greenhouse-style form, keeps existing values, never submits, learns typed answers", async () => {
  const bank = bankWith({
    "first-name": "Jimmy", "last-name": "Li", email: "jimmy@example.com", phone: "415-555-0134",
    linkedin: "https://linkedin.com/in/jimmy-li", "work-auth": "Yes", sponsorship: "No", source: "LinkedIn",
    gender: "Decline to self-identify", degree: "Master's", "why-company": "Because of the payments infra work.",
  });
  const html = `<form id="f">
   <div><label for="first_name">First Name <span>*</span></label><input id="first_name" name="job_application[first_name]" type="text"></div>
   <div><label for="last_name">Last Name *</label><input id="last_name" type="text"></div>
   <div><label for="email">Email *</label><input id="email" type="text"></div>
   <div><label for="phone">Phone</label><input id="phone" type="text" value="already here"></div>
   <div><label>LinkedIn Profile<input type="text" name="q1"></label></div>
   <div><label for="auth">Are you legally authorized to work in the United States? *</label>
     <select id="auth"><option value="">Please select</option><option value="1">Yes</option><option value="0">No</option></select></div>
   <fieldset><legend>Will you now or in the future require sponsorship for employment visa status?</legend>
     <label><input type="radio" name="spons" value="y"> Yes</label><label><input type="radio" name="spons" value="n"> No</label></fieldset>
   <div><div class="label">How did you hear about this job?</div>
     <div><label><input type="radio" name="src" value="a">Company website</label><label><input type="radio" name="src" value="b">LinkedIn</label></div></div>
   <div><label for="gender">Gender</label><select id="gender"><option value="">Select...</option><option>Male</option><option>Female</option><option>Decline To Self Identify</option></select></div>
   <div><label for="deg">Degree</label><select id="deg"><option value="">--</option><option>Bachelor's Degree</option><option>Master's Degree</option></select></div>
   <div><label for="why">Why do you want to work at Stripe?</label><textarea id="why"></textarea></div>
   <div><label for="fav">What's your favorite Stripe product?</label><input id="fav" type="text"></div>
   <div><label><input type="checkbox" id="agree"> I certify that the information above is true</label></div>
   <div><label for="resume">Resume/CV</label><input id="resume" type="file"></div>
   <button type="submit" id="submit">Submit Application</button>
  </form>`;
  const pageScript = `window.submitted = false;
    document.getElementById("f").addEventListener("submit", (e) => { window.submitted = true; e.preventDefault(); });
    document.getElementById("submit").addEventListener("click", () => { window.submitted = true; });`;
  const { w, d, store, send } = loadPage(html, { bank, pageScript });
  await send({ type: "fill" });
  const $ = (id) => d.getElementById(id);
  assert.equal($("first_name").value, "Jimmy");
  assert.equal($("last_name").value, "Li");
  assert.equal($("email").value, "jimmy@example.com");
  assert.equal($("phone").value, "already here", "an existing value is left alone");
  assert.equal(d.querySelector("input[name=q1]").value, "https://linkedin.com/in/jimmy-li");
  assert.equal($("auth").value, "1");
  assert.equal(checked(d, "spons"), "n");
  assert.equal(checked(d, "src"), "b");
  assert.equal($("gender").value, "Decline To Self Identify");
  assert.equal($("deg").value, "Master's Degree");
  assert.equal($("why").value, "Because of the payments infra work.");
  assert.equal($("fav").value, "", "unknown question stays empty");
  assert.equal($("agree").checked, false, "certify box is left for the user");
  assert.equal(w.submitted, false, "never submits");

  $("fav").value = "Stripe Terminal";
  assert.equal((await send({ type: "learn" })).learned, 1);
  assert.equal(store.bank.find((b) => b.q.startsWith("What's your favorite")).a, "Stripe Terminal");
});

test("Lockheed layout: per-question text inside one section, follow-up left alone and learnable", async () => {
  const bank = bankWith({ "recent-grad": "Yes", "us-citizen": "Yes", "prev-employee": "No", "preferred-name": "Jimmy" });
  const html = `<form><fieldset><legend>Application Questions</legend>
    <div><div>Have you received a Bachelor’s or Master's degree within the last 24 months or will you graduate with a Bachelor’s or Master’s degree within the next 12 months?<span>*</span></div>
      <div><label><input type="radio" name="q1" value="yes">Yes</label><label><input type="radio" name="q1" value="no">No</label></div></div>
    <div><div>The clearance required for this position is granted by the U.S. federal government and only U.S. citizens are eligible. Do you meet the citizenship requirement for the security clearance for this position?*</div>
      <div><label><input type="radio" name="q2" value="yes">Yes</label><label><input type="radio" name="q2" value="no">No</label></div></div>
    <h3>Application Information</h3>
    <div><label for="pn">Preferred Name</label><input id="pn" type="text"></div>
    <div><label for="emp">If you answered "Yes" and are a former LM employee: Enter the LM Person/Employee ID you received while working at LM</label><input id="emp" type="text"></div>
  </fieldset></form>`;
  const { d, store, send, panel } = loadPage(html, { bank });
  await send({ type: "fill" });
  assert.equal(checked(d, "q1"), "yes");
  assert.equal(checked(d, "q2"), "yes");
  assert.equal(d.getElementById("pn").value, "Jimmy");
  assert.equal(d.getElementById("emp").value, "", "follow-up is never filled from a broad answer");
  assert.ok(!panel().some((row) => row.startsWith("Application Questions")), "section title is not used as a question");

  d.getElementById("emp").value = "N/A";
  assert.equal((await send({ type: "learn" })).learned, 1);
  assert.equal(store.bank.find((b) => b.q.startsWith("If you answered")).a, "N/A");
});

test("signatures and agreements are never filled, whatever the field type", async () => {
  const bank = bankWith({ "full-name": "Jimmy Li", "us-citizen": "Yes" });
  const html = `<form>
    <div><label for="sig">Please sign by typing your full legal name</label><input id="sig" type="text"></div>
    <div><div>I have read and understand and I agree to the above</div>
      <div><label><input type="radio" name="ag" value="y">Yes</label><label><input type="radio" name="ag" value="n">No</label></div></div>
    <div><label for="nm">Full legal name</label><input id="nm" type="text"></div></form>`;
  const { d, send } = loadPage(html, { bank });
  await send({ type: "fill" });
  assert.equal(d.getElementById("sig").value, "");
  assert.equal(checked(d, "ag"), undefined);
  assert.equal(d.getElementById("nm").value, "Jimmy Li", "the ordinary name field still fills");
});

test("yes/no question matched to a descriptive answer: explains, then learns the exact wording", async () => {
  const degree = "Bachelor's degree in Computer Science and Math";
  const bank = bankWith({ degree });
  const html = `<form><div><div>Do you possess the Bachelor’s Degree?</div>
    <div><label><input type="radio" name="bs" value="y">Yes</label><label><input type="radio" name="bs" value="n">No</label></div></div></form>`;
  const { d, store, send, panel } = loadPage(html, { bank });
  await send({ type: "fill" });
  assert.equal(checked(d, "bs"), undefined);
  assert.ok(panel().some((row) => row.includes("Yes/no question")), "panel explains what to do");

  d.querySelector("input[name=bs][value=y]").click();
  assert.equal((await send({ type: "learn" })).learned, 1);
  assert.equal(store.bank.find((b) => b.q.startsWith("Do you possess")).a, "Yes");
  assert.equal(store.bank.find((b) => b.id === "degree").a, degree, "the broader answer is not overwritten");

  d.querySelector("input[name=bs][value=y]").checked = false;
  await send({ type: "fill" });
  assert.equal(checked(d, "bs"), "y", "next fill uses the learned answer");
});
