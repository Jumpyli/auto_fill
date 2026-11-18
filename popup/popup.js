const status = document.getElementById("status");

async function send(payload) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return browser.runtime.sendMessage({ type: "to-tab", tabId: tab.id, payload });
}

document.getElementById("fill").addEventListener("click", async () => {
  status.textContent = "Filling…";
  try {
    const r = await send({ type: "fill" });
    status.textContent = r
      ? `Filled ${r.good}, ${r.check} to check, ${r.missing} to answer yourself. Details are on the page.`
      : "No form fields found on this page.";
  } catch {
    status.textContent = "Can't fill this page. Firefox doesn't let add-ons run on its own pages or add-on store pages.";
  }
});

document.getElementById("learn").addEventListener("click", async () => {
  try {
    const r = await send({ type: "learn" });
    status.textContent = r ? `Saved ${r.learned} new answer${r.learned === 1 ? "" : "s"}.` : "Fill the page first, then type answers into the red fields.";
  } catch {
    status.textContent = "Fill the page first, then type answers into the red fields.";
  }
});

document.getElementById("bank").addEventListener("click", () => { browser.runtime.openOptionsPage(); window.close(); });

browser.storage.local.get("bank").then(({ bank = [] }) => {
  const filled = bank.filter((b) => (b.a || "").trim()).length;
  document.getElementById("bank-count").textContent = `${filled} of ${bank.length} answers saved.`;
});
