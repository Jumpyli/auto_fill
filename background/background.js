/* Seeds the answer bank on install and relays "fill" requests to the page. */
// On updates, add starter questions introduced since last time. Ones you deleted stay deleted.
browser.runtime.onInstalled.addListener(async () => {
  const { bank, seenDefaults } = await browser.storage.local.get(["bank", "seenDefaults"]);
  const allIds = DEFAULT_BANK.map((e) => e.id);
  if (!bank) {
    await browser.storage.local.set({ bank: DEFAULT_BANK, seenDefaults: allIds, settings: { overwrite: false } });
    return;
  }
  const seen = new Set(seenDefaults || bank.map((e) => e.id));
  const have = new Set(bank.map((e) => e.id));
  const added = DEFAULT_BANK.filter((e) => !seen.has(e.id) && !have.has(e.id));
  await browser.storage.local.set({ bank: bank.concat(added), seenDefaults: [...new Set([...seen, ...allIds])] });
});

// Pages opened before the extension was installed don't have the content script yet; inject it on demand.
async function sendToTab(tabId, msg) {
  try {
    return await browser.tabs.sendMessage(tabId, msg);
  } catch {
    for (const file of ["/lib/match.js", "/content/fill.js"]) {
      await browser.tabs.executeScript(tabId, { file, allFrames: true }).catch(() => {});
    }
    return browser.tabs.sendMessage(tabId, msg);
  }
}

browser.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "fill-page") return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) sendToTab(tab.id, { type: "fill" }).catch(() => {});
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "to-tab") return sendToTab(msg.tabId, msg.payload);
});
