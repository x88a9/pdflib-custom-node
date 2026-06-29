# n8n-nodes-pdf-text

An [n8n](https://n8n.io) community node that inserts text at precise **X/Y positions** into existing PDF files using [`pdf-lib`](https://pdf-lib.js.org/).

Perfect for stamping values onto pre-made form templates — invoices, expense forms, certificates, contracts — without rebuilding the document.

## Features

- Takes a PDF as **binary input** from any upstream node (configurable binary property, default `data`).
- Add **multiple text fields** — each with its own text, position, size, font and color.
- Text supports **n8n expressions**, so you can map values from previous nodes.
- Choose the target **page** (or apply to all pages).
- Outputs the modified PDF as **binary** (configurable property, default `data`).

## Installation

### Community Nodes (recommended)

1. In your n8n instance go to **Settings → Community Nodes**.
2. Click **Install**.
3. Enter the package name / GitHub URL:

   ```
   https://github.com/x88a9/pdflib-custom-node
   ```

4. Agree to the risks and click **Install**.

After installation the **PDF Text** node is available in the node panel.

> n8n must be configured to allow installing community nodes
> (`N8N_COMMUNITY_PACKAGES_ENABLED=true`, which is the default).

### Manual / self-hosted

```bash
cd ~/.n8n/nodes        # or your custom nodes folder
npm install https://github.com/x88a9/pdflib-custom-node
```

Then restart n8n.

## Node configuration

| Field | Description |
| --- | --- |
| **Input Binary Property** | Name of the binary property on the incoming item holding the source PDF (default `data`). |
| **Text Fields** | One or more text entries to draw (see below). |
| **Page Number** | 1-based page to draw on. Use `0` to apply text to **all** pages. |
| **Output Binary Property** | Name of the binary property to write the result to (default `data`). |

Each **Text Field** has:

| Property | Description |
| --- | --- |
| **Text** | The text to insert (supports expressions). |
| **X (pt from left)** | Horizontal position in points from the left edge. |
| **Y (pt from bottom)** | Vertical position in points from the **bottom** edge. |
| **Font Size** | Font size in points. |
| **Font** | Helvetica, Helvetica Bold, Times Roman, or Courier. |
| **Color** | Hex color string, e.g. `#000000`. |

## Coordinate system

`pdf-lib` uses a coordinate system where the **origin `(0, 0)` is the bottom-left
corner** of the page. This is the opposite of most screen/image coordinate
systems where `(0, 0)` is the top-left.

```
 (0, height) ┌───────────────┐ (width, height)
             │               │
             │   Y increases │
             │      ↑        │
             │               │
      (0, 0) └───────────────┘ (width, 0)
              X increases →
```

- **X** grows to the **right**.
- **Y** grows **upward** — a larger Y moves the text **higher** on the page.

Common page sizes (in points, 1 pt = 1/72 inch):

| Size | Width | Height |
| --- | --- | --- |
| A4 | 595 | 842 |
| Letter | 612 | 792 |

So to place text near the **top** of an A4 page, use a large Y value
(e.g. `Y ≈ 800`); near the **bottom**, use a small Y (e.g. `Y ≈ 40`).

## Example: German expense form (Spesenformular)

Suppose you have an A4 template (595 × 842 pt) with labels printed on it and you
want to fill in the values next to each label. Approximate coordinates:

| Feld | Text (example) | X | Y | Font Size | Font |
| --- | --- | --- | --- | --- | --- |
| Beantrager | `{{$json.name}}` | 180 | 760 | 11 | Helvetica |
| Datum | `{{$json.datum}}` | 180 | 730 | 11 | Helvetica |
| Betrag | `{{$json.betrag}} €` | 180 | 700 | 11 | Helvetica-Bold |
| Anzahl | `{{$json.anzahl}}` | 180 | 670 | 11 | Helvetica |
| Verwendungszweck | `{{$json.zweck}}` | 180 | 640 | 11 | Helvetica |

Remember: because Y is measured from the bottom, the first row (`Y = 760`) sits
near the top of the page and each subsequent row steps **down** by 30 pt.

> Tip: the exact X/Y values depend on your template. Start with rough values,
> run the workflow, open the output PDF, and nudge the numbers until the text
> lands where you want it.

## Development

```bash
npm install
npm run build      # compiles TypeScript to dist/ and copies assets
```

The compiled output in `dist/` is committed to the repository so the package can
be installed directly from GitHub without a build step.

## License

[MIT](LICENSE)
