# Research Capture — §18 Price Chart with Targets and Trades

**Owner:** Evan Jones (DUMAC) · **Date:** 2026-10-07
**Applies to:** `reports.html` · `rc-core.js` · new `rc-chart.js` · Arcana pipeline script
**Slots into:** `research-capture-spec-v1.4-delta.md` as §18. No schema change to note records.

---

## 18.1 What it does

On any ticker, a **Chart** button opens a panel with:

- FMP daily closes over a selectable range
- The viewing user's buy/sell targets as dotted **step lines**, changing on the
  date each new target record was filed
- ▲ / ▼ markers on dates the position was bought or sold
- A tile showing current position size from Arcana

Hover any step or marker → the record's `why`. Click → opens it in the reader
modal.

---

## 18.2 Decisions

| # | Decision |
|---|---|
| 1 | **Placement.** Chart button on the Company drill-in and on each Price Targets row in `reports.html`. Render on click only. |
| 2 | **Price source.** FMP non-split-adjusted EOD, key from `_config.json`, ticker through the existing Bloomberg→FMP suffix map. `sessionStorage` cache keyed `ticker|from|to|asOfDate`. On failure, draw targets and trades anyway with a "price unavailable" note. |
| 3 | **Non-split-adjusted.** Targets are typed in the prices of their day. A split-adjusted series misplaces every pre-split target. |
| 4 | **Default range.** 30 days before the user's earliest target record for the ticker → today. Presets: `6M / 1Y / 3Y / Since first target`. |
| 5 | **Targets from records.** Each record with `price_target_buy` or `price_target_sell` starts a step on its `date`; held until the same contributor's next target record. Nothing new to capture — immutability already produces the history. |
| 5a | **Scope: per user** (answer A). Default view = the viewing user's targets. A contributor chip row lets them add other contributors' lines. Targets are views, not positions, so they are **not** scoped by strategy. |
| 6 | **Trades from Trade records.** `record_type: Trade`; `initiate / add` → ▲, `trim / exit` → ▼. The page never calls Arcana. |
| 6a | **Non-trading-day trades snap to the prior close** (answer B). Tooltip shows the true trade date. |
| 7 | **Arcana pipeline** writes Trade records (`origin: position-diff`, `strategy` set, `why` blank → Open Whys) **and** a positions snapshot (§18.4). |
| 8 | **Strategy filter.** Chips from `cfg.strategies`, default all. Applies to trade markers and the position tile, not targets. |
| 9 | **Renderer.** Hand-rolled inline SVG in `rc-chart.js`. No dependency. |
| 10 | **PNG export.** SVG → canvas → blob download. |
| 11 | **Position tile from Arcana** (answer C). Reads the latest snapshot; shows age (§18.4). |

---

## 18.3 Target step construction

```
input:  records for ticker, filtered to contributor(s)
sort:   by date ascending, then last_updated
for each record with a buy or sell target:
  close the contributor's previous step for that side at (record.date − 1 day)
  open a new step at record.date
blank target on a later record → no change (blank is "not stated," not "removed")
last step runs to range end
```

A step that starts before the range is clipped to the range start and still
drawn. A step whose whole span falls outside the range is dropped.

**Open check:** confirm blank-means-unchanged matches how contributors actually
withdraw a target. If someone needs to *remove* a target, that needs an explicit
value. Do not invent one now.

---

## 18.4 Position snapshot

Written by the same Arcana pipeline that writes Trade records.

```
NOTES/_positions/
  direct-global-ideas/
    2026-10-07.json
    latest.json          ← stable path the tile reads
```

```json
{
  "as_of": "2026-10-07",
  "strategy": "Direct Global Ideas",
  "portfolio_id": 9030956,
  "source": "arcana",
  "positions": [
    { "ticker": "GOOGL", "shares": 0, "market_value": 0, "nav_pct": 0 }
  ]
}
```

**Underscore folder, like `_config.json`:** `walkNotes()` must skip any path
segment starting with `_`. Verify this before the first snapshot lands, or the
snapshots will be read as records.

**Tile behaviour:**
- Shows shares, market value, % of NAV, and `as_of`. One tile per strategy
  holding the name.
- If `as_of` is more than 7 days old, the tile shows the age in amber.
  Staleness is a display problem — a tile that silently looks current is the
  failure mode.
- If there is no snapshot or no position, the tile reads "No position" and
  states the snapshot date.

**Field names are placeholders.** Map from the actual
`get_portfolio_positions` / `get_historical_portfolio_positions` output when
building the pipeline; keep the snapshot shape above stable.

---

## 18.5 Pure functions — `rc-core.js`

All unit-testable under the Node shim.

| Function | Returns |
|---|---|
| `fmpHistoryUrl(ticker, from, to, key)` | Non-split-adjusted EOD URL, ticker already mapped |
| `parseFmpHistory(json)` | `[{date, close}]` ascending; drops rows with no close |
| `buildTargetSteps(records, contributors, range)` | `[{contributor, side, value, from, to, note_id}]` |
| `snapToPriorClose(date, series)` | Last series date ≤ `date`, or `null` if before the series |
| `tradesToMarkers(records, series, strategies)` | `[{date, tradeDate, close, dir, action, strategy, why, note_id}]` |
| `positionTile(snapshot, ticker, strategies, today)` | `{shares, mv, navPct, asOf, ageDays, stale}` or `{none: true, asOf}` |
| `defaultRange(records, contributor, today)` | `{from, to}` per decision 4 |

---

## 18.6 Build order

1. **Targets + price** — decisions 1–5a, 9. Ships on existing data.
2. **Trade markers** from hand-entered Trading Log records — 6, 6a, 8.
3. **PNG export** — 10.

**Deferred until the Arcana API is set up (2026-10-07):** decision 7 (pipeline),
decision 11 and §18.4 (position tile and snapshot). Design stands; do not build.
Markers from step 2 pick up pipeline-written Trade records automatically once
they exist — no chart change needed.

---

## 18.7 Claude Code prompt

> Implement §18 steps 1–3 of `research-capture-spec-v1.6-price-chart.md` in
> the research capture repo. Patch, don't rewrite.
>
> 1. Read `rc-core.js`, `reports.html`, `test-rc-core.js` first. Report how
>    `reports.html` currently knows the viewing contributor; if it doesn't,
>    propose the smallest way (likely the `localStorage` key `entry.html`
>    already uses) and wait for approval.
> 2. Confirm `walkNotes()` skips `_`-prefixed path segments. If not, fix and
>    add a regression test.
> 3. Add the pure functions in §18.5 to `rc-core.js` with Node assertions in
>    `test-rc-core.js`: step construction including clipping and blank-means-
>    unchanged; snap-to-prior-close including a weekend and a pre-series date;
>    marker direction for each `action` value.
> 4. Verify the FMP non-split-adjusted endpoint path and response field names
>    against FMP's current docs before writing `fmpHistoryUrl` /
>    `parseFmpHistory`. Use a saved real response as the test fixture.
> 5. Create `rc-chart.js`: inline SVG line + step lines (buy green, sell red,
>    dotted; contributors distinguished by dash pattern and label) + ▲/▼
>    markers + crosshair tooltip. Theme-aware colors via CSS variables.
> 6. Wire the Chart button into the Company drill-in and the Price Targets tab.
>    Contributor chips and strategy chips per §18.2.
> 7. Puppeteer smoke test against fixture data: chart renders, a step tooltip
>    shows `why`, clicking a marker opens the reader modal.
>
> 8. PNG export button (SVG → canvas → blob).
>
> Do not touch the position tile or Arcana pipeline — deferred.
> Report the decisions you had to make that this spec did not cover.
