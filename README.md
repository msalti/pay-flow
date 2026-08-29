# Paygrid

A free, no-login payday budget grid. Budget by **payday**, not by calendar month.

Two halves (H1 and H2). Each half has income, allocated lines (description, account tag, amount), and a remainder. Built for people paid twice a month — or anyone who approximates two pays.

Open the page, edit the grid, refresh: your numbers are still there. Nothing is uploaded.

## What stays local

Paygrid has no accounts, no backend, no bank sync, and no tracking. The grid is saved in `localStorage` in this browser. Export JSON or CSV if you want a file copy. Import JSON to restore one.

The first-run household (Alex & Jordan, Northbank, Paper Card, Oak Ledger) is invented example data.

## Run locally

```bash
npm install
npm run dev
```

The app is served at [http://127.0.0.1:4821](http://127.0.0.1:4821).

```bash
npm run build
npm run preview
```

`preview` uses the same port. Deploy the `dist` folder as a static site.

## Using the grid

- Rename each half and set its pay day. Toggle **14th & 31st** or **1st & 15th**, or pick custom days.
- Income rows sit on yellow. Allocations (bills, transfers, envelopes) sit on white. Amounts: green for in, red parentheses for out.
- Type in an empty row to add a line. Row menu: reorder, convert income/allocation, note, remove. Drag a row to reorder within its kind.
- Half Total is the signed remainder for that pay. The top bar is both halves together. Leftover is unassigned until you give it a line.
- Settings: currency symbol and label (no FX math), account tags, export / import, reset to sample.

Print uses a simple stylesheet that keeps the two grids and hides chrome.
