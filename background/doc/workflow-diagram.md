# Extension shell (`background/` + `manifest.json`) — workflows

Line numbers refer to `background/background.js`.

## 1. Install and update (lines 2–14)

```mermaid
sequenceDiagram
    participant F as Firefox
    participant B as background.js
    participant S as storage.local
    F->>B: onInstalled (install, update, or reload in about:debugging)
    B->>S: get bank, seenDefaults
    alt no bank (first install)
        B->>S: bank = DEFAULT_BANK, seenDefaults = all ids, settings.overwrite = false
    else bank exists
        B->>B: new = starter ids not in seenDefaults and not in bank
        B->>S: append new to bank, add all ids to seenDefaults
    end
```

Caption: banks from before `seenDefaults` existed use their own ids as "seen", so their missing starter questions (e.g. the Defense section) get added once.

## 2. Fill request from the popup (lines 17–26, 34–36)

```mermaid
sequenceDiagram
    participant P as Popup
    participant B as background.js
    participant C as Page (all frames)
    P->>B: runtime.sendMessage {type:"to-tab", tabId, payload}
    B->>C: tabs.sendMessage payload
    alt content script present
        C-->>B: first answer (counts, or learned count)
        B-->>P: that answer
    else no content script yet
        C--xB: error
        B->>C: executeScript lib/match.js (all frames, errors ignored)
        B->>C: executeScript content/fill.js (all frames, errors ignored)
        B->>C: tabs.sendMessage payload again
        alt works now
            C-->>B: answer
            B-->>P: answer
        else restricted page (about:, add-on store)
            C--xB: error
            B--xP: error → popup shows "Can't fill this page…"
        end
    end
```

## 3. Keyboard shortcut (lines 28–32)

```mermaid
flowchart LR
    A[Alt+Shift+A] --> B{command is fill-page?}
    B -- no --> Z[ignore]
    B -- yes --> C[Find the active tab]
    C --> D{Tab found?}
    D -- no --> Z
    D -- yes --> E[sendToTab fill, as in flow 2]
    E --> F[Results appear in the page's panel;<br/>errors are ignored silently]
```
