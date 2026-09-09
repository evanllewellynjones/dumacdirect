# Research Capture — Project History

## Session: 2026-09-07

**Participants:** Evan Jones (DUMAC) with Claude
**Files changed:** `rc-core.js`, `entry.html`
**Files created:** `research-capture-spec-v1.4-delta.md`, `test-rc-core.js`, `test-entry.js`
**Test state at end of session:** 187 assertions passing in `test-rc-core.js`, 70 in
`test-entry.js`

---

## 1. Where the session started

Reviewed an architecture document produced in a separate Claude chat
(`dumac-knowledge-base-architecture.md`) against the system already built.

**Assessment.** Most of its overlap with the existing system covered ground
already handled better here: one file per record, flat markdown on SharePoint,
frozen schema, a review surface, and a closed tag vocabulary that the document
proposed building from scratch. Its "harvest exhaust, don't author entries"
principle was rejected — the implementation depends on scheduled Cowork tasks,
Granola transcript extraction, Arcana position diffs and Outlook sweeps, which
is four auth surfaces and four silent-failure modes, against a system
deliberately designed to have none. It also has no place for attachments, which
is disqualifying for a research team that reads PDFs.

**Two ideas taken from it:** `action` (what was done about a name) and `why` (a
queryable one-line rationale). A third field, `origin`, was added independently.

---

## 2. Schema changes — v1.4 and v1.5

Documented in full in `research-capture-spec-v1.4-delta.md`. Summary:

| Field | Values | Required | Class |
|---|---|---|---|
| `action` | `initiate \| add \| trim \| exit \| pass \| observation \| reference` | yes | record |
| `why` | one line, ≤200 soft cap | yes unless `action: reference` | record, **write-once** |
| `origin` | `app \| note-skill \| ingest \| email \| screen \| position-diff` | yes, writer-set | record |
| `source` | free text | no | record |
| `outcome_check_date` | date | no | curation |
| `strategy` | from `cfg.strategies` | error on `position-diff`, warning on position actions | record |
| `screen_id` | lowercase slug | no | record |
| `screen_version` | integer | **yes when `screen_id` set** | record |
| `run_id` | `<screen_id>_v<n>_<date>` | no | record |

`record_type` gained a third value: `Note`.

### Key decisions and their reasoning

**`action` had to land before the SharePoint ingestion.** Adding an enum
*value* later is cheap; adding a *field* later means early records can't answer
the query. `reference` was included from the start even though only the
ingestion writes it.

**`why` is write-once, not immutable.** The position-diff pipeline writes it
blank and a human fills it in later. Completing a blank field is not revising a
judgement, so the rule is: settable while blank, frozen once set. Enforced by
`canSetWhy(prior)`. This preserves "a changed view is a new record" without
blocking the Open Whys queue.

**`origin` makes multiple write paths auditable.** Without it there is no way
to tell a hand-typed record from an LLM-drafted one, which means no way to
audit extraction quality, filter Claude output from a report, or roll back a
bad run without reading every file.

**`strategy` is scope, not a label.** Direct Global Ideas trimming a name while
Direct US adds to it is two decisions with two reasons. Closed vocabulary in
`_config.json`, Admin-edited, same shape as `themes` — free text would produce
"Direct US", "DirectUS" and "Direct U.S." within a month and destroy the
grouping query.

**`screen_version` is an error, not a warning, when `screen_id` is set.**
Without it, notes on a screen whose criteria changed twice become one
undifferentiated pile.

---

## 3. Correction: the approval surface

**The first draft of the delta was wrong about this and it was corrected after
reading the real `reports.html`.**

`review_status` is *not* an approval flag. The Review Queue filters on
`n.review_date && ...`, so a record with no review date never appears there
regardless of status. `review_status` is a `Pending` / `Done` toggle attached to
a scheduled catalyst, and overloading it would corrupt a working feature.

Approval of Claude- and pipeline-written records belongs in the **Admin records
table**, filtered on `origin` — it already does bulk `setFMLine` rewrites and
already has an `unclassified` filter pattern to copy.

Other corrections from the same review: `record_type` values are capitalized
(`Company` / `Theme`), `review_status` values are capitalized
(`Pending` / `Done`), and `FM_ORDER` contains four fields the first draft
omitted (`listed`, `tickers`, `review_date`, `priority`).

---

## 4. `record_type: Note` — the quick note

A thought about Brazil is neither a company nor a theme. Forcing it into
`Theme` would corrupt the theme vocabulary, since `admin.html` builds a theme
page per value and a `QUICK NOTE` theme would generate a meaningless page
accumulating unrelated content.

`Note` records have no ticker, no theme, no price targets. `entity` defaults to
the subject when blank. Tags do the retrieval.

**Open item — this is the current blocker on any team rollout.**
`reports.html` filters:

```js
const companies = ns => ns.filter(n => n.record_type==="Company" || (n.record_type==null && n.ticker));
const themes    = ns => ns.filter(n => n.record_type==="Theme"   || (n.record_type==null && !n.ticker));
```

A `Note` matches neither. Quick notes save correctly and are **invisible in
Reports** until a third bucket is added. Do not roll `entry.html` out to the
team before this lands.

---

## 5. New entry paths

### `/note` in Claude

Decided: writes to the local OneDrive-synced NOTES tree, not via SharePoint
MCP. Same path the app writes, identical behaviour.

Decided: writes to flat `NOTES/`, **not** a `NOTES/_inbox/`. The File System
Access API has no move operation — approval would mean read, write to a new
location, then recursively delete, with partial-failure risk on any record with
attachments. Flipping a field is correct; relocating a directory is not.

The skill must call `buildFM()` from `rc-core.js` rather than assembling
frontmatter itself. A Node shim was added to the file for this.

### Email

**Shared mailbox, not per-person folders.** The team's existing habit is to
send research to colleagues *and* file it — that is a CC, and a CC needs an
address. A folder in your own mailbox cannot be CC'd, so self-send would force
a second manual action per note. One mailbox is also one MSAL grant rather than
five.

The reader should move processed mail to a `Filed` subfolder so reprocessing is
impossible and a failed run is visibly retryable.

**Header block syntax:** bare `KEY: value` lines, terminated by the first blank
line. Not `**KEY**` or `(KEY)` — Outlook sends HTML by default and the reader
works from the plain-text conversion, where asterisks survive inconsistently or
arrive as tags. Keys are case- and space-insensitive; digits are significant.

Invented tags are dropped, never created — `resolveTagNames()` resolves against
the taxonomy and logs misses. The closed vocabulary is the point.

Scheduling: Task Scheduler + a local script first, same trade already made with
OneDrive sync over Graph writes. The effort is in the token flow, not the
writer.

### Why-response queue

Not a form. An inline field in a list alongside the Review Queue in
`reports.html` — "Open Whys", filtered on
`origin = position-diff AND why is blank`, saving on blur via `setFMLine`. Ten
answered in two minutes; nobody is composing.

---

## 6. Screens and runs

Three artifacts were being bundled into the word "agent": the **definition**
(mutable, versioned), the **run** (immutable fact), the **reaction** (a note).

```
NOTES/                                  ← immutable records
SCREENS/quality-no-debt/v1.md, v2.md, v3.md
RUNS/2026/09/quality-no-debt_v3_2026-09-05.csv
                                    ...md   ← sidecar
             quality-no-debt_latest.csv     ← stable path for Excel
```

**Screens do not live in `NOTES/`** — a note is immutable, a screen is tuned.
Folder per screen, because "show me all three versions" should be a directory
listing.

**Criteria are immutable.** Changing a threshold writes `v2.md`; it never edits
`v1.md`, because v1's historical runs mean nothing if what produced them can be
silently redefined.

**The sidecar copies `criteria` in rather than referencing it.** That
duplication is the entire point — six months later the definition may have been
superseded twice, and a run you cannot interpret is a number without
provenance. `validateRun()` treats missing `criteria` as an error.

**Use the LLM to write the screen, not to execute it.** A filter over a data
table is deterministic; an agent evaluating it in-context is slower, more
expensive, non-reproducible, and will occasionally get a number wrong in a way
that looks plausible. At an investment office where someone may have to
reconstruct why a name appeared on a list, that is a liability.

| Task | Tool |
|---|---|
| Write and iterate the runner | Claude Code |
| Explore data while designing | MCP, interactively |
| Interpret a run | Claude chat reading `RUNS/` from disk |
| Execute the scheduled run | Plain Python, direct API — **not MCP** |

**Build order:** one screen end to end before `screens.html`. The schema will
be wrong in at least two places and one file is cheap to redo.

---

## 7. SharePoint → Egnyte migration

### What the Semiconductors page actually contains

Read via the Microsoft 365 connector
(`page:///sites/eaac5976-.../pages/6c7e0d55-...`). Created April 2023 by EJ,
last edited August 2025 by William Hockett, version 12.

| Content | Kind |
|---|---|
| Sector primer bullets, dated "May 2023" | Curated |
| CoWoS explainer — S vs L, yield, the AI bottleneck | Curated |
| NVDA vs AMD CoWoS allocation commentary | Curated |
| Cloud capex vs chip share commentary | Curated |
| **7 PNG charts in `SiteAssets/SitePages/Semiconductors/`** | Reference |
| Semi Primers, podcasts, AMD $45B→$400B | Reference |
| Links to `AEVA.aspx`, `TSMC.aspx`, `Geo-Politics-&-Semiconductors.aspx` | Navigation |
| Highlighted Content webpart filtered on "Semis"/"Semiconductor" | Derived |
| Document library webpart → `Sectors/Semiconductors` | Derived |

**Roughly 20% of the page is what a report template would generate.** The rest
is authored analysis and charts. "Replace pages with report templates" is
therefore the wrong frame — the template replaces the two webparts at the
bottom, which are the least valuable things on it.

Notable: the Highlighted Content webpart is already a dynamic tag query and has
been since 2023. People kept hand-writing the CoWoS analysis above it anyway,
because that content is not derivable from notes.

### Urgent: the images

The 7 PNGs live in `SiteAssets`, not the Direct Team Library. **Egnyte will
migrate the document library and will not migrate SiteAssets.** When the site
goes, the charts go and every line of commentary becomes an orphan sentence.
59 pages matched "Semiconductors" alone, so the real exposure is likely a few
hundred images.

This is scriptable — Graph returns the page canvas as JSON and every image
carries a `data-imageurl` — and it has a hard deadline attached to the Egnyte
cutover. It is independent of every other decision here.

### Structural find

`AEVA.aspx`, `TSMC.aspx`, `Semiconductors.aspx`, `Geo-Politics-&-Semiconductors.aspx`
are company pages, sector pages and theme pages, cross-linked. That is
`record_type: Company` and `record_type: Theme`, built by hand over three years.
The migration is not a translation into a foreign structure — it is the same
structure independently arrived at in the app.

### Sequence

1. **Extract first.** Page canvas JSON → markdown, images downloaded per page,
   links rewritten. Nothing decided at this stage; just making content survive.
2. **Split by hand, one page at a time.** Curated prose → the body of a Theme or
   Company record. Images → attachments in that record's folder. Reference
   links → the body. Webparts → discard.
3. **Then build the sector template**, rendering underneath the curated
   framing, not instead of it.

---

## 8. Page architecture — how "dynamic" resolves

| Layer | Behaviour | Why |
|---|---|---|
| Curated | Authored, always rendered | Theme record body. Carries judgment. Not derivable. |
| Derived | Queried live, never cached | Filter over local markdown; milliseconds. Caching would reintroduce exactly the staleness the project exists to remove. |
| Synthesized | Generated, cached, re-runnable | Costs money and seconds, non-deterministic, and **someone will cite it** |

**A synthesis is a note.** `record_type: Note`, `origin: llm`, body is the
summary, linkage to what it summarized. It lands in the Review Queue and can be
marked wrong. If someone repeats "the market is under-appreciating CoWoS
constraint" in a meeting, that sentence needs to exist somewhere with a date on
it.

**Staleness is a display problem, not a dynamism problem.** Every section shows
its age — framing shows when the Theme record was written, derived shows the
newest note found, synthesis shows when it ran. A page that says "framing last
revised 14 months ago" gets fixed; one that silently looks current does not.
That is precisely what happened to the May 2023 bullets still sitting at the top
of the Semis page in August 2025.

**"Nobody has to build it" is mostly true, with one exception.** Nobody builds
the derived layer or the synthesis. Somebody writes the curated layer, and no
query over notes produces a CoWoS explainer. The gain is not eliminating that
work — it is that the work stops being buried among content going stale around
it.

Template definitions belong in `_config.json` as config, not code — sections,
tag, order. Sector / Company / Theme / Strategy templates share one renderer
with different section lists. The parameter is a **tag**, not a string, so
"Semis" resolves through the taxonomy's synonyms.

---

## 9. Decision: do not create sidecar MD files for migrated PDFs

Asked whether every migrated file should get an associated tagged `.md`.
**No — at library scale this inverts.**

Thousands of records whose entire content is a filename would flood the sector
pages with `MS_Spring Training 2024_TMT_Semiconductors.pdf` and bury the notes
that contain actual reasoning. That is the exact failure `action: reference`
exists to prevent. It also creates a maintenance surface nobody will service:
every file move or rename in Egnyte would have to be mirrored.

**The test: a record should exist because someone had a thought, not because a
file exists.** Egnyte has full-text search over the PDFs already.

Instead:

- **Folders, not sidecars.** The sector template links to the Egnyte folder,
  reproducing what the SharePoint document-library webpart did. One config line
  per sector, zero records.
- **Sidecars only where judgment exists** — memos, IC documents, models with
  assumptions. Dozens, not thousands, curated deliberately.
- **A manifest in bulk** — one CSV/JSONL of path, filename, date, size, tag
  guess. Searchable index of what exists, zero records created.

The 63-file ingestion should be run first as the scale test it was scoped to
be. If 63 `reference` records already feel noisy in the Admin table, that is the
answer for the other several thousand.

---

## 10. Images in notes on sector pages

Confirmed the capture path already works: Ctrl+V writes the PNG into the note
folder, adds it to `attachments`, inserts `![](chart.png)` at the cursor.

**Known bug, not yet fixed.** `![](chart.png)` is relative to the note folder,
but `reports.html` renders from `/research/`, so the browser resolves it to
`/research/chart.png` and every image renders broken — silently, as a broken
icon. Images need path rewriting at render using the note's `_path`, which
`walkNotes()` already populates. Also needs `URL.createObjectURL()` on the file
blob, with revocation on view change to avoid leaking.

**Recommended treatment:** thumbnails in the derived section (strip of charts
with note subject, click to expand), full width in the curated section. Plus a
possible `pin` boolean, curation-class, so a note can promote a chart to the
sector page without rewriting the Theme record. Same "decide now" argument as
`action`.

**Why this beats the old page:** the CoWoS charts in `SiteAssets` have no
contributor, date or rationale attached, which is exactly why they are now at
migration risk. A chart attached to a note arrives with contributor, date,
`why`, tags and `action`, for free from the schema.

---

## 11. Bugs found and fixed

**Acronym substring suppression in `matchTags()`** — longest-match-wins compared
raw substrings, so `"Retail"` containing the letters `ai` silently dropped the
`Artificial Intelligence` hit. Confirmed live against the real taxonomy before
fixing. Replaced with boundary-checked `termContains()`, which still lets
`Gold Miners` suppress `Gold` and `Consumer Discretionary` suppress `Consumer`.

*Retroactive consequence:* every tag matched by a short acronym was exposed —
`AI`, `EV`, `US`, `EM`, `PE`, `RV`, `HY`, `VP`, `BR`, `CL`, `CN`, `HC`, `FX`.
**Existing notes have under-tagged frontmatter.** A re-tag pass should be
bundled with the §8.1 backfill while those files are being rewritten anyway.

**Warning banner wiped on save** — `clearForm(true)` cleared the banner
unconditionally, so a save that succeeded *with* warnings erased them before
they could be read, in the one case where the warning is the entire point. Now
cleared only on explicit Clear. Found by a test, not by inspection.

**`normKey` stripped digits** — `buytarget2: x` normalised onto `buytarget` and
silently overwrote a real `BUY TARGET: 42`. Digits are now significant.

**Email header block ate prose** — the original rule consumed every key-looking
line, so a mail opening `Note: saw this today` lost its first sentence. Now an
unknown key *before* any known key means there is no header block at all; an
unknown key *after* a real one is a typo, consumed and reported.

**`buildFM()` dropped unknown keys** — any field not in `FM_ORDER` vanished on a
read-modify-write. Unknown keys are now written after the known ones.

---

## 12. State at end of session

**Done:**

- `rc-core.js` patched (not rewritten) — nine sites touched, 187 assertions
- `entry.html` — three modes, decision block, conditional rows, paste box,
  `validateRecord()` in the save path, 70 assertions headless
- `research-capture-spec-v1.4-delta.md` — 17 sections

**Immediate blocker:** `reports.html` third bucket for `Note` records. Nothing
ships to the team before this.

**Then, roughly in order:**

1. `reports.html` — `Note` bucket, `action` filter, `why` column, Open Whys queue
2. `admin.html` — `action` / `why` / `origin` / `strategy` columns, `origin`
   filter as the approval surface, `Note` in the type filter
3. Image path rewriting in `rc-core.js` (§10) — blocks charts on any page
4. Backfill script for pre-v1.4 records, bundled with the re-tag pass
5. SharePoint page + image extractor — **has a hard deadline at Egnyte cutover**
6. Run the 63-file ingestion as the scale test, then decide on the wider library
7. `/note` SKILL.md
8. Email reader on Task Scheduler
9. One screen end to end, then `screens.html`
10. Arcana position-diff log — needs no schema change

**Undecided:**

- Whether `pin` goes into the note schema now (§10)
- Whether a revised Theme framing supersedes as a new record or edits in place
  (leaning supersede — gives history of how the view evolved)
- Whether unanswered position-diff `why` entries expire or accumulate
  (leaning accumulate)

---

# Session: 2026-09-08 — v1.6

**Participants:** Evan Jones (DUMAC) with Claude
**Files changed:** `rc-core.js`, `entry.html`, `admin.html`, `reports.html`
**Test state at end of session:** 34 assertions passing against the new
rc-core surface (type rules, bias, ticker parser). `test-rc-core.js` and
`test-entry.js` have **not** been updated and will fail against v1.6 — see §20.

---

## 13. Where the session started

`entry.html` had grown into one long form showing every field to every entry
type. The complaint was crowding, but the real cost was a different one:
someone starts typing, realises halfway down that this is a theme note and not
a company note, and the switch feels expensive. That fear is what stops records
being written at all.

Two decisions came out of it:

1. **Fields are per-type, not global.** A `TYPE_RULES` table in `rc-core.js` is
   now the single source of truth for what each record type requires, read by
   `validateRecord()` and mirrored by `entry.html`'s visibility toggles.
2. **Date and Contributor move to the end of the form.** They are automatic;
   they were occupying the top of the screen for no reason.

---

## 14. Four entry types

`record_type` gains a fourth value: `Trade`.

| | Quick Note | Theme Note | Company Note | Trading Log |
|---|---|---|---|---|
| Ticker | — | opt (chips) | **req, first field** | **req** |
| Theme | — | **req** | — | — |
| Company name | — | = theme | optional, resolves from ticker | resolves |
| Subject | **req** | **req** | **req** | **req**, explicit |
| Strategy | opt | — | opt | **req** |
| Action | — | — | opt | **req** |
| Why | — | — | opt | **req** |
| Note body | opt | opt | opt | **req** |
| Targets | — | — | opt | — |
| Bias | opt | opt | opt | — |
| Review date | opt | opt | opt | — |
| Tags / Attachments | opt | opt | opt | opt |
| Date / Contributor | auto, footer | auto, footer | auto, footer | auto, footer |

**`Trade` is its own record type, not a filtered view of `Company`.** The
alternative was tempting — a position record is already definable as
`record_type: Company` with `action ∈ initiate|add|trim|exit`, which is exactly
how §9 and §15 of the v1.4 delta describe it. It was rejected because the
trading log gets read and analysed as its own thing, frequently, and a view
that exists only as a filter is one someone will forget to apply.

The cost was stated and accepted: **a fourth bucket in `reports.html` and
`admin.html`.** A record type that matches no selector saves correctly and is
invisible in Reports — precisely what happened to `Note` between v1.4 and now.
Both buckets landed in the same change as the type, which closes the §12
blocker at the same time.

**`Trade` requires a body.** It is the only type that does. `validateRecord()`
gained an optional third argument for it: a caller that only has frontmatter is
not forced to invent one, but `entry.html` passes the textarea and a trading
log entry cannot be saved empty. A trade with no reasoning attached is the
exact hole this project exists to close.

---

## 15. `conviction` → `bias`

`conviction: High | Med | Low` is **removed**. Replaced by
`bias: + | = | -`.

High/Med/Low was a confidence scale, and confidence scales get filled in
optimistically or not at all. `+ / = / -` is a direction, which is a thing a
report can group on and a thing a person will actually pick. Blank stays a
legitimate answer everywhere — clicking the selected value clears it, so
"no view" needs no fourth button.

Not a rename: `conviction` came out of `FM_ORDER` and `bias` went in.

**Records written before v1.6 keep their `conviction` on disk.** Nothing reads
it, nothing writes it, and it is no longer exported. `buildFM()`'s unknown-key
passthrough preserves it through a read-modify-write, so it survives as
archaeology. It was deliberately **not** mapped onto `bias`: High and `+` are
answers to different questions, and guessing would put a value nobody chose
into an immutable field.

`bias` values need quoting in YAML — a bare `-` is a block-sequence indicator.
`yamlStr()` already quotes anything not starting `[A-Za-z0-9]`, so `+`, `=` and
`-` all serialise as `bias: "-"` with no parser change. Confirmed by test.

---

## 16. `entity` becomes optional on Company

Previously an error. Now: required on `Theme` only, where it is the page key.

The company NAME is derivable from the ticker, so requiring it made everyone
retype something the app already knew. Three fill paths were considered:

| Path | Verdict |
|---|---|
| (a) Resolve at write time from a stored ticker map | **Built.** Instant, offline, no network in the save path |
| (b) Fill blanks later in an Admin pass | **Built.** One button over records with a ticker and no entity |
| (c) Call FMP at write time | Rejected — puts a network call in the save path and breaks offline entry |

A blank entity is legal on disk. Filling one later is treated the same way as
filling a blank `why`: completing a blank is not revising a judgement, so it
does not violate immutability.

---

## 17. The ticker → company map

Bulk upload in Admin, new **Tickers** tab. 1,000+ rows in one paste or one CSV.

**Stored in `_tickers.json`, beside `_config.json` — not inside it.** Three
reasons: a thousand-row map would dwarf everything else in `_config.json`,
which is hand-inspectable today; `saveConfig()` bumps a version and appends to
`_config_history.jsonl` on every write, and a bulk upload has no business in
the config change log; and a bad paste is recovered by deleting one file rather
than by rebuilding the taxonomy.

`parseTickerCSV()` takes comma, tab or semicolon separated text — a paste
straight out of Excel is a TSV — with or without a header, in either column
order.

**Column order is decided once for the whole file, by scoring both columns
across every row, not row by row.** Per-row detection looks smarter and is
worse: on `Widget Industries Holdings,Thing` it would happily conclude "Thing"
is the ticker, because in isolation it could be. Scoring the file measures the
odd row against the column its neighbours established, and skips it instead of
inverting it.

**The upload is approved as a diff, not as a number.** Before anything is
written: how many are new, how many change a name already stored, how many are
unchanged, every duplicate inside the file, and every rejected row with its
line number and the reason. Merge is the default; replace is explicit and shows
the deletion count before Apply, not after. A silent 1,000-row overwrite in a
shared folder is unrecoverable.

The map is a convenience, not a source of truth. A ticker absent from it still
saves fine.

---

## 18. What each file gained

**`rc-core.js`**

- `RECORD_TYPES` gains `Trade`; `BIAS_VALUES`; `TYPE_RULES` + `typeRules()`
- `validateRecord(rec, cfg, body)` rewritten to read `TYPE_RULES` — `action`,
  `why`, `strategy`, `entity`, `ticker` and the body are all now required per
  type rather than globally. `action` and `why` were previously required on
  every record, which forced a quick note about Brazil to carry a disposition.
- `FM_ORDER`: `conviction` → `bias`
- `RC.tickers`, `loadTickers()`, `saveTickers()`, `companyFor()`
- `splitDelimited()`, `parseTickerCSV()`, `diffTickers()`
- `EMAIL_KEYS`: `CONVICTION` → `BIAS`
- **`notesLocation()` added.** It was called by `admin.html` and
  `reports.html` and defined nowhere — a live `ReferenceError` in both pages'
  empty-corpus path. Found by an id/reference sweep, not by use.

**`entry.html`** — rebuilt. Four-type selector with a per-type accent colour
carried into every card rule and the Save button label; "switching keeps what
you typed" stated on screen, because it was already true and nobody knew;
Date/Contributor footer strip; bias button group; Topic input removed from
Quick Note (`entity` still defaults to the subject on disk); ticker-first
Company block with live name resolution; "Paste a note written elsewhere"
renamed **Import a drafted note** and moved to the end, with text saying
outright that it takes text and not files.

**`admin.html`** — Tickers tab (upload, paste, diff preview, table, resolve
pass); Actions and Strategies list editors in Config; `Note` and `Trade` in the
type filter and bulk setter; `action` and `origin` filters and columns, with
`origin ≠ app` as the approval surface from delta §6.

**`reports.html`** — four buckets; **Trading Log** tab with strategy / action /
ticker / contributor / date filters and group-by; **Notes** tab for quick
notes; trading log section on the company page; bias grid replacing the
conviction grid; `Note` and `Trade` in the Review Queue type filter;
`_export_trades.csv` as a third export.

---

## 19. On removing values from a closed list

The Actions and Strategies editors add freely and remove only what nothing on
disk uses. A value still present in a record but absent from the list reads
back as an orphan no filter can reach, so a value in use shows "in use" with no
button. The reverse case — a value found in records but missing from the list,
which is what a hand-edited `_config.json` produces — shows a red pill and an
"Add to list" button.

---

## 20. State at end of session

**Done:**

- `rc-core.js` — type rules, bias, ticker map, `notesLocation()`
- `entry.html` — four types, per-type fields, bias, footer strip
- `admin.html` — Tickers tab, Actions/Strategies editors, Note/Trade buckets
- `reports.html` — four buckets, Trading Log, Notes, bias, trades export
- The §12 immediate blocker (`Note` invisible in Reports) is **closed**

**Immediate:**

1. **`test-rc-core.js` and `test-entry.js` are stale.** They assert `action`
   and `why` are required on every record and that `conviction` is High/Med/Low
   — all three now false. Rewrite against `TYPE_RULES` before trusting either.
2. Load the real ticker list and run the resolve pass.
3. Backfill script for pre-v1.4 records, bundled with the re-tag pass.

**Then, roughly in order:**

4. Image path rewriting in `rc-core.js` (§10) — still blocks charts on any page
5. SharePoint page + image extractor — **hard deadline at Egnyte cutover**
6. Run the 63-file ingestion as the scale test
7. `/note` SKILL.md — must call `buildFM()` and `validateRecord()` with a body
8. Email reader on Task Scheduler
9. One screen end to end, then `screens.html`
10. Arcana position-diff log — writes `record_type: Trade`, `origin:
    position-diff`, blank `why`; still needs no schema change

**Undecided, carried forward:**

- Whether `pin` goes into the note schema now (§10)
- Whether a revised Theme framing supersedes or edits in place (leaning
  supersede)
- Whether unanswered position-diff `why` entries expire or accumulate (leaning
  accumulate)
- Whether to strip `conviction` lines off pre-v1.6 records. Leaning no: it
  would bump the revision on every old record for a cosmetic gain, and nothing
  reads the field.
