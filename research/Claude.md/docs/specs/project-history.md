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

# Session: 2026-09-20

**Participants:** Evan Jones (DUMAC) with Claude
**Files changed:** `reports.html`, `entry.html`, `rc-core.js`, `admin.html`
**Files created:** `research-capture-spec-v1.5-delta.md`
**Test state at end of session:** `test-rc-core.js` and `test-entry.js` are
**stale** — they predate v1.4 §10 onward and all of v1.5. Every change this
session was verified by headless Chrome smoke tests against real File System
Access trees, not by the committed suite.

---

## 13. Where this session started

Reports existed but was not yet a place you would sit and read. The company
view was a stack of six cards inside a date filter, price targets had no
thesis attached, attachments were invisible, and a 4,400-row ticker upload had
just landed — which broke three things that had been fine at 40 rows.

Nothing in this session changed the shape of a record. `action`, `why`,
`origin`, `strategy` and the immutability rule are exactly as v1.4 left them.

---

## 14. FMP current price — the first network dependency

Recorded in full in the v1.5 delta §2. The decision worth keeping here is
*why it was allowed at all*, in a system whose premise is no dependencies.

Three rules made it acceptable:

1. A blank `fmp_api_key` means **no call is made** — not a failed call.
2. Failure is invisible and non-blocking. Network error, bad key, rate limit
   and unknown ticker all render the same em dash, after the page is already
   on screen.
3. **The price is never written to a record.** It is decoration on a report.
   Writing it would violate "never type a number you can look up" and would
   rot immediately.

The key lives in `_config.json`, not in the HTML, so it is not in git. The
shared NOTES folder is already the trust boundary for every record in the
system; the key does not lower it. No proxy — that means IT, and the exposure
does not justify it.

The Bloomberg → FMP suffix table is in the delta §2.1 rather than in one
person's head. **Open:** whether the app's record key becomes the FMP symbol
(`7203.T`) or stays whatever the team types with `_tickers.json` carrying a
third column. Only US names are affected today, which is why it is not yet
forced.

---

## 15. Price targets: derived, not a fifth record type

Asked whether a price-target note should be its own entry type, so the thesis
reads next to the number and the history of a thesis can be followed.

**No — it is a Company record where `price_target_buy` or `price_target_sell`
is set.** One filter, `targetNotes()`.

The reasoning is the same shape as the `action` argument in §2, run backwards:

- Immutability *already* makes each target its own record. The history is on
  disk and `targetGrid()` has always walked it. A new type would re-label what
  field presence says.
- Every target ever written qualifies instantly. A new type means all prior
  targets are in the wrong bucket forever — the exact "adding a field later"
  failure v1.4 exists to avoid.
- No wrong door. With a separate type, a target typed on a Company note
  silently misses the target report.

**The split that matters is where each is shown**, decided explicitly:

| Surface | Shows | Because |
|---|---|---|
| Company page | latest target per contributor, with its thesis | answers "where do we stand" |
| Price Targets tab | every target, grouped by ticker, with the change vs that contributor's previous | answers "how did we get here" |

A name with five revisions would bury the company page under its own history.
The change column is computed over the **unfiltered** corpus, so a date range
cannot fake a "first" target.

---

## 16. `tickers[]` is curation, not a record field

**The classification decision of this session.**

`tickers[]` is a retrieval index — the same shape and the same job as `tags`,
which has been mutable since v1. It says which names a note *touches*, not
what anyone concluded. Discovering later that a theme also touches a name is
not revising a judgement.

`ticker` singular is different and stays frozen: it is the record's subject,
and changing it makes it a different record.

This was arguably already the intent. The reader's own immutability footer
lists date, subject, ticker, action, strategy, targets, bias, source and body
as frozen — `tickers` is not among them.

**Editing the union needs a rule.** The theme page shows the union across
every record on the theme, so:

- **Adding** → the newest record on the theme only, and the UI names which one
- **Removing** → every record that carries it, after a confirm listing them

Anything else leaves a union that does not match what was just typed. Both
paths run `setFMLine` → `last_updated` → `bumpRevision()`.

**Quick Notes gained `tickers[]`.** v1.4 §11 said a Note has no ticker; that
remains true of `ticker` singular. But it left a quick note about three names
unable to surface on any of their company pages, which was the point of the
company page. `MODE_FIELDS` gained a `tickers` flag and the block now shows for
Theme and Quick Note.

---

## 17. Deleting a record

v1.4 had no delete anywhere and `rc-core.js` had no `removeEntry` call at all.
Soft delete (`status: void`) was proposed and **rejected in favour of a real
delete**, deliberately narrow: one record at a time, never bulk; the `note_id`
typed back to confirm; admin unlock; and the full manifest logged to
`_config_history.jsonl` *before* the folder is touched, so a delete that fails
halfway still says what was there.

The §5 argument against moving folders — no move operation, recursive delete,
partial-failure risk on attachments — is why this is single-record and loud
rather than a checkbox sweep.

**Recovery is OneDrive version history, not the app.** Nothing restores a
record, and the deletion propagates on sync. That needs saying to the team
once before rollout.

---

## 18. Attachments were unreachable

`openReader()` never read the `attachments` field. Files were on disk and
there was **nowhere to click** — the largest gap between what the schema
recorded and what the app could show.

`readAttachment()` in `rc-core.js` returns a `File` from the record's folder;
the reader turns each into a blob URL. Images inline, everything else a chip
that opens in a new tab, and a file listed in frontmatter but missing on disk
gets an amber chip saying so rather than failing silently. Blob URLs are
revoked on close — leaving them alive pins the bytes for the life of the tab.

**Still broken:** `![](chart.png)` inline in a body, which is §10 of this
document and unchanged. The blob-URL plumbing added here is exactly what that
fix needs, so it is now a small job.

---

## 19. What 4,400 tickers broke

Three bugs that were invisible at 40 rows. All three were silent.

**Partial-ticker entity freeze.** `resolveEntity()` ran per keystroke and
bailed on a non-blank name. `LRCX` fires as `L` → `LR` → `LRC` → `LRCX`, and
`L` is Loews Corp's real NYSE ticker — so the name filled on keystroke one and
froze there. Every ticker starting with a letter that is itself a listed
ticker resolved to the wrong company: `LUV`, `LLY`, `LIN`, `LOW`, and the same
for `F`, `T`, `C`, `V`, `X`, `K`, `O`, `D`.

Fixed with an `ENTITY_AUTO` flag separating a name the app filled from one a
human typed. *Retroactive consequence:* **records saved in that window carry
the wrong `entity`.** `ticker` is correct so grouping is unaffected; it is the
displayed name that is wrong.

**Ticker case and whitespace.** Price Targets grouped on the raw string;
Company matched `===`. A record carrying `"LRCX "` or `"lrcx"` therefore
displayed in one view and was unreachable from the other. Every comparison now
goes through `normTk()`. **This patches the reader, not the data** — dirty
values are still on disk.

**Typing was drilling in.** Every keystroke in the ticker box rendered a full
company page, so `"L"` produced "No records for L". Typing now filters the
listing; the detail page opens on an exact match with records behind it, on
Enter, on a datalist pick, or on a click. Debounced at 180ms — `NVDA` was four
`walkNotes()` passes over 4,400 names.

That last fix surfaced a **render race**: Enter on a datalist input fires both
`keydown` and `change`, and two async renders both appended. Fixed with a
generation counter — each render takes a number on entry and only the newest
may write after its `await`. Latent before the jump box existed.

---

## 20. Report layout

Reports now run **full width** with 48px gutters. Entry stays narrow on
purpose: it is sized to sit beside a PDF, and that constraint was never about
reading.

**Company page** — one name, all dates. The date filter applies to the listing
only; once you are on a ticker you want the whole record. Header carries
ticker, name, price, theme chips and a ticker jump box that takes focus on
load, so the loop is keyboard-only: type, Enter, read, type. Targets table is
one row per contributor with the thesis under it. Notes are every non-Trade
record touching the ticker — Company by `ticker`, Theme and Quick Note by
`tickers[]`. Trades stay in their own tab; a position change is a different
kind of fact from a view.

**Empty states distinguish two cases** — "no notes yet" versus "not in the
ticker list" — and offer near misses. At 4,400 names a transposition is the
likeliest reason a page comes up blank, and `LCRX` for `LRCX` was the actual
report that led here.

**Theme page** — header box with name, counts and the editable ticker list,
then **Catalysts and Notes side by side**, stacking under 980px. Stacked, the
notes list sat below the fold on any theme with more than two catalysts.

**Bias leads every note line**, 17px and coloured. It is the first thing you
want off a row and was previously buried mid-line at body size.

---

## 21. Method note

Every change this session was verified in headless Chrome against a real
OPFS tree — actual `removeEntry`, actual `getFile`, actual frontmatter read
back after the write — rather than against mocks. Three bugs were found that
way and would not have been found by reading the diff: the bias CSS
specificity conflict, the double-render race, and the duplicate empty-state
card.

The committed suites were not run, because they are stale. That is now the
top of the queue.

---

## 22. State at end of session

**Immediate:**

1. **Stale test suites.** `test-rc-core.js` and `test-entry.js` predate v1.4
   §10 onward and all of v1.5. Claude Code, first.
2. **One backfill pass, four jobs.** Pre-v1.4 `action`/`why`/`origin`, the
   re-tag pass for acronym suppression, dirty `ticker` values, and wrong
   `entity` values from §19. All four rewrite the same files; doing them
   separately means four passes over the corpus and four revision bumps.

**Then, roughly in order:**

3. Image path rewriting so `![](chart.png)` renders (§10, §18)
4. `admin.html` — `action` / `why` / `origin` / `strategy` columns and the
   `origin` filter as the approval surface. Still not built; it is the
   approval surface the whole multi-path design depends on.
5. SharePoint page + image extractor — **hard deadline at Egnyte cutover**
6. The 63-file ingestion as the scale test it was scoped to be
7. `/note` SKILL.md
8. Email reader on Task Scheduler
9. One screen end to end, then `screens.html`
10. Arcana position-diff log — still needs no schema change

**Undecided:**

- Whether the record key becomes the FMP symbol or `_tickers.json` carries a
  third column mapping to it
- Whether `pin` goes into the note schema (§10)
- Whether a revised Theme framing supersedes as a new record or edits in place
  (still leaning supersede)
- Whether unanswered position-diff `why` entries expire or accumulate
  (still leaning accumulate)
