# Toolbar popup (`popup/`) — workflows

Line numbers refer to `popup/popup.js`. The relay and injection steps are in `background/doc/workflow-diagram.md` (flow 2).

## 1. Fill this page (lines 8–18)

```mermaid
flowchart TD
    A[Click Fill this page] --> B[Status: Filling…]
    B --> C[Send fill to the active tab via background.js]
    C --> D{Result}
    D -- counts --> E["Filled X, Y to check, Z to answer yourself. Details are on the page."]
    D -- nothing: no frame had fields --> F[No form fields found on this page.]
    D -- error: restricted page or injection failed --> G[Can't fill this page. Firefox doesn't let add-ons run on its own pages or add-on store pages.]
```

## 2. Save answers I typed (lines 20–27)

```mermaid
flowchart TD
    A[Click Save answers I typed to my bank] --> B[Send learn via background.js]
    B --> C{Result}
    C -- learned count --> D["Saved N new answer(s)."]
    C -- nothing: page not filled yet --> E[Fill the page first, then type answers into the red fields.]
    C -- error --> E
```

## 3. Open answer bank and the count line (lines 29–34)

```mermaid
flowchart LR
    A[Popup opens] --> B[Read bank from storage] --> C["N of M answers saved."]
    D[Click Open answer bank] --> E[Open the options page in a tab] --> F[Close the popup]
```
