# Research Capture — Schema Delta v1.4 → v1.5

**Owner:** Evan Jones (DUMAC) · **Date:** 2026-09-20
**Applies to:** `rc-core.js` · `entry.html` · `reports.html` · `admin.html`
**Builds on:** `research-capture-spec-v1.4-delta.md`, which is not restated.

v1.4 was a schema change. v1.5 is mostly not: one config key, one field
reclassified, one field extended to a second record type, and two new
functions. The rest is report surface and four bugs, three of which were
silent.

The through-line: v1.4 gave records a queryable disposition. v1.5 makes the
corpus *navigable* — a company page you can read, a price-target history you
can follow, attachments you can open, and a ticker vocabulary that does not
fracture on whitespace.

---

## 1. What changes

| Change | Class | Breaks anything? |
|---|---|---|
| `fmp_api_key` in `_config.json` | config | no — blank is the default |
| `tickers[]` allowed on `record_type: Note` | record shape | no — was already legal, never written |
| `tickers[]` reclassified **curation**, not record | classification | no — no validation depended on it |
| `deleteNote()` | new function | no |
| `readAttachment()` | new function | no |
| price-target-without-body warning | validation | warning only |

No frontmatter field is added, renamed or removed. Records written under v1.4
are valid v1.5 records.

---

## 2. `fmp_api_key` — the first network dependency

```json
{
  "strategies": ["Direct Global Ideas", "Direct US"],
  "fmp_api_key": "..."
}
```

Seeded blank in `SEED`, backfilled by `loadConfig()` like every other key, so
an existing `_config.json` needs no edit on upgrade. Lives in `_config.json`
and not in the HTML, so the key is not in git. The shared NOTES folder is
already the trust boundary for every record in the system; the key does not
lower it.

The company page fetches a quote from

```
https://financialmodelingprep.com/stable/quote-short?symbol=<TK>&apikey=<KEY>
```

Three rules make this safe to add to a system whose whole premise is no
dependencies:

1. **A blank key means no call is made.** Not a failed call — no call.
2. **Failure is invisible and non-blocking.** The price renders after the page
   is on screen. A network error, a bad key, a rate limit and an unknown
   ticker all produce the same em dash. Nothing waits on it.
3. **The price is never written to a record.** It is decoration on a report,
   not data. Writing it would violate "never type a number you can look up"
   and would rot instantly.

Cached in `sessionStorage` per ticker, 15-minute TTL. Skipped entirely for a
`P.` prefix or `listed: false`, which render "private — no price data".

### 2.1 Bloomberg → FMP symbol conversion

The ticker upload carries Bloomberg tickers. FMP disagrees only on the
exchange suffix. Recorded here because it is the kind of table that otherwise
lives in one person's head.

| Bloomberg | FMP | Bloomberg | FMP | Bloomberg | FMP |
|---|---|---|---|---|---|
| US UN UW UA UQ UR | *(none)* | HK | `.HK` | IJ | `.JK` |
| LN | `.L` | CN CT | `.TO` | MK | `.KL` |
| JP JT | `.T` | CV | `.V` | TB | `.BK` |
| GR GY | `.DE` | AU | `.AX` | PM | `.PS` |
| FP | `.PA` | KS | `.KS` | NZ | `.NZ` |
| NA | `.AS` | KQ | `.KQ` | TI | `.IS` |
| SW SE | `.SW` | TT | `.TW` | PW | `.WA` |
| IM | `.MI` | IN | `.NS` | VN | `.VN` |
| SM | `.MC` | SP | `.SI` | BZ | `.SA` |
| SS | `.ST` | DC | `.CO` | MM | `.MX` |
| NO | `.OL` | FH | `.HE` | SJ | `.JO` |

Share classes use `-`, not `/`: `BRK/B` → `BRK-B`. Hong Kong codes zero-pad to
four digits: `700 HK` → `0700.HK`. London prices in **pence**.

Convert by rule, then verify in batches of 50 against `quote-short` with
comma-separated symbols; anything that returns no price gets fixed by hand.
Do not trust the rule alone — dual listings differ on which venue each vendor
treats as primary.

**Open:** whether the app's record key becomes the FMP symbol (`7203.T`) or
stays whatever the team types, with `_tickers.json` carrying a third column
mapping to FMP. The second is right if the team thinks in Bloomberg tickers,
and makes `_tickers.json` the place the mapping lives rather than a one-off
script output. Not yet decided; only US names are affected today.

---

## 3. `tickers[]` is curation, not a record field

**This is the classification decision of this version.**

`tickers[]` is a retrieval index. It says which names a note *touches* — the
same shape and the same job as `tags`, which has been freely editable since
v1. It does not say what anyone concluded.

| Field | Class | Reason |
|---|---|---|
| `ticker` (singular) | record, frozen | the record's subject. Changing it makes it a different record. |
| `tickers[]` | **curation, mutable** | a reverse index onto other names. Discovering later that a theme also touches a name is not revising a judgement. |

This was arguably already the intent — the reader's own immutability footer
lists date, subject, ticker, action, strategy, targets, bias, source and body
as frozen, and `tickers` is not among them. v1.5 makes it explicit and builds
the editor that follows from it.

### 3.1 Editing the union

The theme page shows the union of `tickers[]` across every record on the
theme, which means an edit needs a rule or the union will not match what was
just typed:

- **Adding** → written to the **newest record on the theme only**. The UI
  names which record that is, so it is never a guess.
- **Removing** → removed from **every record that carries it**, after a
  confirmation listing them by subject.

Both go through `setFMLine` → `last_updated` → `bumpRevision()`. All three
steps, per the existing rule; `rewriteNote()` alone remains insufficient.

### 3.2 `tickers[]` on `record_type: Note`

v1.4 §11 said a Quick Note has no ticker. That is still true of `ticker`
singular and is still enforced by `TYPE_RULES`. But it left a quick note about
three names unable to surface on any of their company pages, which was the
original point of the company page.

`entry.html` now shows the tickers block for **Theme and Quick Note**, driven
by a new `tickers` flag in `MODE_FIELDS`. `buildRecord()` writes
`rec.tickers` on a Note; `rec.ticker` stays null. A quick note that is really
about one company should be a Company note.

**Migration:** none. Existing Quick Notes carry `tickers: []` and simply do
not appear on a company page until re-entered. There are few enough that a
backfill is not worth writing.

---

## 4. Price-target notes are derived, not a fifth type

A note that sets a price target wants its thesis read next to the number, and
wants a history showing how that thesis moved. Both are now built. Neither
required a new `record_type`.

**A price-target note is a Company record where `price_target_buy` or
`price_target_sell` is set.** One filter:

```js
const targetNotes = ns => companies(ns).filter(hasTarget);
```

Why not a fifth type:

- Immutability already makes each target its own record — "price target
  changes create new records, not edits" — so the history is on disk already
  and `targetGrid()` has always walked it. A type would re-label what field
  presence says.
- Every target ever written qualifies instantly. A new type means all prior
  targets sit in the wrong bucket forever, which is the exact "adding a field
  later" failure v1.4 was written to avoid.
- There is no wrong door. With a separate type, a target typed on a Company
  note silently misses the target report.

### 4.1 Where each appears

| Surface | Shows |
|---|---|
| Company page | **latest target per contributor only**, with the note that set it |
| Price Targets tab | every target note, grouped by ticker, newest first, with the change against that contributor's previous target on that name |

The split exists because a name with five revisions would bury the company
page under its own history. The company page answers "where do we stand"; the
tab answers "how did we get here".

The change column is computed over the **unfiltered** corpus, so a date range
cannot fake a "first" target.

### 4.2 New validation warning

A target set with an empty body produces a warning: *"Price target set with no
note — write the thesis behind it."* Warning, not error, and only checked when
the caller passes a body. A number nobody can defend later is the thing the
Price Targets report exists to prevent, but the subject line can sometimes
carry it.

---

## 5. Ticker matching is normalized

**The bug this fixes was silent and produced unreachable records.**

The Price Targets view grouped on the raw `n.ticker` string. The company view
matched `n.ticker === tk`. A record whose frontmatter carried `"LRCX "` or
`"lrcx"` therefore *displayed* in one place and was *unfindable* in the other.

Every ticker comparison in `reports.html` now goes through

```js
const normTk = v => String(v==null?"":v).trim().toUpperCase();
```

Applied in five places: `recordsForTicker()`, the company `own` filter, the
all-companies grouping, the Price Targets grouping, and its per-contributor
previous-target key. The datalist is normalized too, so two spellings of one
name merge into one entry rather than appearing as near-duplicates.

**This patches the reader, not the data.** Dirty values are still on disk. A
pass rewriting `ticker` to its trimmed uppercase form belongs with the v1.4
§8.1 backfill, while those files are being rewritten anyway. `entry.html`
uppercases on input, so the exposure is historical records and any non-app
write path.

---

## 6. Deleting a record

v1.4 had no delete anywhere, and `rc-core.js` had no `removeEntry` call at
all. The §5 argument against moving folders — no move operation, recursive
delete, partial-failure risk on attachments — applies to deletion too.

Soft delete (`status: void`) was considered and rejected in favour of a real
delete, deliberately narrow:

- **`deleteNote(n)` in `rc-core.js`.** Validates `_path`, enumerates the folder
  contents, `removeEntry(id, {recursive:true})`, drops the record from
  `RC.notes`, returns the file list. Month and year folders are left in place;
  they are shared by every record written that month.
- **One record at a time, never bulk.** A checkbox sweep is the wrong gesture
  for the only operation in Admin with no undo.
- **The `note_id` must be typed back.** The prompt shows subject, type,
  ticker, date, contributor, folder path and every attachment by name.
- **The manifest is logged before the folder is touched.** Two lines to
  `_config_history.jsonl`: `note_delete` with the full record, then
  `note_delete_done` with the files actually removed. A delete that fails
  halfway is recoverable from OneDrive version history, but only if you know
  what to look for.
- Admin unlock required, same as every other destructive control.

**Recovery is OneDrive's recycle bin, not the app.** Nothing here restores a
record, and the deletion propagates to everyone on sync. Worth saying once to
the team before rollout.

---

## 7. Attachments are reachable

`openReader()` never read the `attachments` field. Files were on disk and
unreachable from Reports — the single largest gap between what the schema
recorded and what the app could show.

`readAttachment(n, name)` in `rc-core.js` returns a `File` from the record's
own folder. The reader turns each into a blob URL: images render inline with
name and size, everything else is a chip that opens in a new tab, and a file
listed in frontmatter but missing on disk shows an amber chip saying so rather
than failing silently.

Blob URLs are revoked when the reader closes or moves on. Leaving them alive
pins the file bytes for the life of the tab, which at PDF sizes is not free.

Note lines carry a paperclip with a count, so a record's attachments are
visible without opening it.

**Still broken (v1.4 §10, unchanged):** `![](chart.png)` inline in a note body
does not render, because the body is drawn as `textContent` in a `<pre>`. The
blob-URL plumbing this version adds is exactly what that fix needs.

---

## 8. Report surface

Recorded because the shape is now load-bearing, not because it is schema.

**Reports run full width** (`.wrap.wide{max-width:none}` plus 48px gutters).
Entry stays narrow on purpose — it is sized to sit beside a PDF. A report is
read on its own.

### 8.1 Company page

One name, **all dates**. The date-range filter applies to the listing only;
once you are on a ticker you want the whole record.

| Band | Contents |
|---|---|
| Header | ticker · name · current price · theme chips · ticker jump box · back link |
| Targets | one row per contributor: bias, buy, % vs price, sell, % vs price, last updated — each followed by the thesis that set it |
| Notes | every non-Trade record touching the ticker, newest first |

Notes are the union of Company records by `ticker` and Theme and Quick Note
records by `tickers[]`. Trades are excluded — a position change is a different
kind of fact from a view, and has its own tab.

**Typing filters; it does not drill in.** `"L"` is a prefix, not a name, and
`L` is also Loews. The detail page opens only on an exact match with records
behind it, on Enter, on a datalist pick, or on a click. Uncommitted text
filters the listing instead.

**Empty states distinguish two cases** — "no notes on this company yet" versus
"not in the ticker list" — and offer near misses, because at 4,400 tickers a
transposition is the likeliest reason a page comes up blank.

### 8.2 Theme page

Header box carries name, record count, catalyst count and the editable ticker
list. **Catalysts and Notes then sit side by side**, stacking under 980px.
Stacked, the notes list sat below the fold on every theme with more than two
catalysts.

### 8.3 Bias leads every note line

17px, monospace, coloured: green `+`, red `−`, grey `=`. It is the first thing
you want off a row and it was previously buried mid-line at body size.

---

## 9. Bugs fixed

**Partial-ticker entity freeze — silent, and it mislabelled records.**
`resolveEntity()` ran per keystroke and bailed on a non-blank name. Typing
`LRCX` fires `L` → `LR` → `LRC` → `LRCX`; `L` is Loews Corp's real NYSE
ticker, so the name filled on the first keystroke and froze. Every ticker
beginning with a letter that is itself a listed ticker resolved to the wrong
company. Invisible before the 4,400-row upload, because single-letter tickers
were not in the map.

Fixed with an `ENTITY_AUTO` flag distinguishing a name the app filled from one
a human typed. Ours to replace; theirs to leave alone.

*Retroactive consequence:* **records saved during that window carry the wrong
`entity`.** `ticker` is correct, so grouping is unaffected — it is the
displayed name that is wrong. Findable as any record where `entity` does not
match `companyFor(ticker)`. Rewriting a record field, so it wants a reviewed
list rather than a bulk apply.

**Ticker case and whitespace** — §5 above.

**Double render race.** Enter on a datalist input fires both `keydown` and
`change`. Two async `renderCompany()` calls raced and both appended. Fixed
with a generation counter: each render takes a number on entry and only the
newest may write after its `await`. Latent before the jump box existed — a
keystroke landing during a slow `walkNotes()` over 4,400 tickers could produce
the same doubling.

**Bias CSS specificity.** A leftover `.cpg .noterow .bias` rule at 13px beat
the new 17px rule. Caught by asserting computed style in a headless test, not
by looking at it.

---

## 10. Implementation status

**Done this version:**

- `rc-core.js` — `fmp_api_key` seed and backfill; `deleteNote()`;
  `readAttachment()`; price-target-without-body warning
- `entry.html` — tickers block for Theme and Quick Note; `ENTITY_AUTO` fix
- `reports.html` — full width; company page rebuild; Price Targets tab; ticker
  normalization; empty states; prefix filtering and commit rule; jump box;
  attachments in the reader; bias first; theme page rebuild with editable
  tickers
- `admin.html` — per-record delete with typed confirmation and history logging

**Still open, carried forward:**

1. `test-rc-core.js` (187 assertions) and `test-entry.js` (70) are **stale** —
   they predate every change in v1.4 §10 onward and all of v1.5. First task
   for Claude Code.
2. Image path rewriting so `![](chart.png)` renders (§7)
3. Backfill: pre-v1.4 records, the re-tag pass, dirty tickers (§5), wrong
   `entity` values (§9) — one pass, since all four rewrite the same files
4. `admin.html` — `action` / `why` / `origin` / `strategy` columns and the
   `origin` filter as the approval surface, still not built
5. SharePoint page + image extractor — hard deadline at Egnyte cutover
6. The 63-file ingestion as a scale test
7. `/note` SKILL.md; email reader on Task Scheduler
8. One screen end to end, then `screens.html`
9. `egnyte_path` / `ref_url` as a mutable field, before record volume grows

**Undecided:**

- Whether the record key becomes the FMP symbol (§2.1)
- Whether `pin` goes into the note schema (v1.4 §10)
- Whether a revised Theme framing supersedes or edits in place
- Whether unanswered position-diff `why` entries expire or accumulate
