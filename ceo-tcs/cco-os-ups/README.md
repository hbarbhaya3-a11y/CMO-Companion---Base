# CCO OS — UPS Commercial Decision Companion

A white-label **CXO decision companion** re-skinned for **Matt Guffey, Chief Commercial &
Strategy Officer, UPS**, built on the TwinX simulation layer.

The app is grounded in UPS's actual **1Q 2026** commercial position — the Amazon glide-down
completing in June 2026, revenue-per-piece at **$15.32 (+7.7%)** against an **~8%** volume
decline, **34.5%** record SMB penetration, and the first **$3B** healthcare quarter. The
central thread is the question on Matt's desk now: *can SMB + healthcare + international yield
backfill the network fast enough — and at the right quality?*

---

## ▶️ Run it now (no install, offline)

Open **`dist/index.html`** in any modern browser (double-click it). It is a single
self-contained file — all code is inlined, nothing is fetched at runtime, works on a plane
or behind a corporate firewall.

> Fonts (Archivo / IBM Plex Sans) load from Google Fonts when online and fall back to system
> fonts offline — layout is identical either way.

## 🛠 Develop / edit

Requires Node.js 18+.

```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:5173 (hot reload)
npm run build    # rebuild the single-file dist/index.html
npm run preview  # preview the production build
```

All content and styling live in **`src/App.jsx`**.

---

## What's inside (clickable flow)

| Area | What it shows |
|------|----------------|
| **Home — What Needs Attention** | Triaged cards: SMB backfill pacing (High Priority), Europe export / de-minimis yield (Emerging Risk), Healthcare cold-chain window (Opportunity). |
| **Investigate Backfill Gap** | Diagnostic: gap is in *newly acquired* accounts, not the installed base — 90-day retention −9.6%, first-90-day ship frequency −11.4%, new-vs-installed cohort decay curve. |
| **TwinX Commercial Growth Simulator** | **Interactive** — toggle recovery levers and drag the budget slider; "Your Hybrid %" recomputes live against the TwinX-tuned Recommended (62%). Expected lift on retention / sentiment / CAC. |
| **Signals** | Top-signal feed + KPI overview (RPP $15.32, ADV −8% YoY, SMB 34.5%, healthcare $3.0B, international $4.5B). |
| **Signal detail** | Overview, signal-strength score, and the Recommended Takeaways page. |
| **History / Decision Lab** | UPS-vertical decisions and simulation starters (Volume vs Yield, CFO Lens: SMB, Healthcare Push, …). |

## Data provenance

Public anchors are from UPS's **1Q 2026** results. Cohort, sentiment, CAC and simulation
figures — and any metric marked with `*` — are **illustrative TwinX scenario data** for
demonstration, not UPS disclosures.

## Tech

React 18 · Vite 5 · Recharts · lucide-react · `vite-plugin-singlefile`.

## To make it truly "yours" before the meeting

Swap the headline framing (SMB backfill ↔ Volume-vs-Yield), the second risk card
(Europe export ↔ Ground Saver / USPS transition), or add the On Demand Network
(Roadie / Happy Returns / The UPS Store) as its own signal lane — all in `src/App.jsx`.
