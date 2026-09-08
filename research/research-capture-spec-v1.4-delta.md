# Research Capture — Schema Delta v1.3 → v1.4

**Owner:** Evan Jones (DUMAC) · **Date:** 2026-09-07
**Applies to:** `rc-core.js` · `entry.html` · `reports.html` · `admin.html`
**Supersedes:** the first draft of this delta, which was written against the v1
single-file HTML and got four things wrong. Corrections noted in §11.

Slots into `research-capture-spec.md` v1.3. Does not restate it.

**Do this before the SharePoint ingestion.** Backfilling `action` onto ~63
already-written records is a script. Adding it after a multi-user rollout is a
negotiation.

---

## 1. What changes

Three new frontmatter fields, two optional ones, one bug fix, one new
validation function. Nothing existing is removed or renamed.

| Field | Type | Required | Class |
|---|---|---|---|
| `action` | enum | yes | record (immutable) |
| `why` | text, one line | yes unless `action: reference` | record (immutable) |
| `origin` | enum | yes, set by the writer | record (immutable) |
| `source` | text | no | record (immutable) |
| `outcome_check_date` | date | no | curation (mutable) |

v1.3 captures *what we think about a name*. It has no field for *what we did
about it*, and no queryable one-line rationale — the reasoning lives in the note
body, which can't be filtered, grouped, or counted.

---

## 2. `action`

```
initiate | add | trim | exit | pass | observation | reference
```

- `initiate | add | trim | exit` — a position changed. Ground truth.
- `pass` — looked and declined. The dataset nobody keeps, and the one where
  house philosophy actually shows up.
- `observation` — a reaction with no decision attached. Reading a sellside note,
  a channel check, a "this doesn't square with what they guided." Default for
  `/note` from a Claude chat.
- `reference` — an artifact filed for retrieval, not a view. The ingested
  10-Ks, decks and models. Distinguishes "we kept this" from "we thought this,"
  which matters the first time a pattern query returns 63 hits that are really
  a filing cabinet.

Seeded into `_config.json` as `actions`, so Admin can extend the list without a
code change. Adding an enum *value* later is cheap — old records stay valid.
Adding a *field* is what breaks retroactive queryability, which is why
`reference` is in from the start even though only the ingestion writes it.

**Validation:** required; must be in the configured list. `initiate | add |
trim | exit` with no ticker produces a warning, not an error — private names
exist and already use the `P.` prefix convention.

---

## 3. `why`

One line. Not a summary of the note — the reason, compressed.

```yaml
why: "power contracts shorter than the AI-infra multiple implies"
```

- Required unless `action: reference`.
- Soft cap 200 characters, warning only. Someone will have a legitimate 210.
- Written through the existing `yamlStr()`. Colons, `#` and quotes are already
  handled by the current quoting rule — no parser change.

The note body stays exactly what it is. `why` is its queryable projection.

---

## 4. `origin`

```
app | note-skill | ingest | position-diff
```

Which door the record came through. Set by the writer, never by the user, never
editable.

| Value | Written by |
|---|---|
| `app` | `entry.html` |
| `note-skill` | `/note` in Claude, writing to the local NOTES tree |
| `ingest` | the SharePoint ingestion pipeline |
| `position-diff` | reserved — the Arcana log (§9) |

This is the field that makes multiple capture paths safe. Without it you can't
tell a hand-typed record from an LLM-drafted one, which means you can't audit
extraction quality, can't filter it out of a report, and can't roll back a bad
run without reading every file.

Seeded into `_config.json` as `origins`. `loadConfig()` backfills both new keys
from SEED, so an existing `_config.json` needs no edit on upgrade.

---

## 5. `source` and `outcome_check_date`

| Field | Applies to | Notes |
|---|---|---|
| `source` | `observation` | What was being read. `"SemiAnalysis — SiC capacity buildout"`. Free text, not a URL requirement. |
| `outcome_check_date` | `initiate \| exit \| pass` | When to revisit. Blank = never scheduled. |

Both parse as null when blank, per the existing blank-is-meaningful rule.

**`outcome_check_date` is not `review_date`.** `review_date` is a catalyst — a
rulemaking deadline, an expected disclosure — and drives the Review Queue.
`outcome_check_date` asks "was this call right?" and drives a future scorecard
report. Nothing reads it yet. Defining it now costs nothing and avoids a second
migration.

---

## 6. The approval surface is Admin, not the Review Queue

**This is the correction that matters most.**

`reports.html` filters the Review Queue on `n.review_date && ...`. A record with
no review date never appears there, whatever its `review_status` says. So
`review_status` is **not** an approval flag — it is a Pending/Done toggle
attached to a scheduled catalyst, and overloading it would corrupt a working
feature.

Claude- and pipeline-written records get approved in the **Admin records table**
instead, which already has the right shape — it filters on `record_type` with an
`unclassified` option and does bulk `setFMLine` rewrites. Add an `origin` filter
alongside it:

- `origin = note-skill` → everything `/note` wrote, awaiting a read-through
- `origin = ingest` → the ~63-file batch
- `origin ≠ app` → both

`validateRecord()` deliberately does not treat `review_status` as approval, and
warns if `review_status` is set with no `review_date` — that combination is
invisible in the queue and is almost always a mistake.

---

## 7. Frontmatter after v1.4

Field order in `FM_ORDER`: `origin` follows `contributor` (it is provenance);
the decision block `action / why / source / outcome_check_date` follows
`subject` and precedes `tags`. `listed`, `tickers`, `review_date` and
`priority` stay exactly where they were.

```yaml
---
note_id: 2026-09-07_ej_wolfspeed-sic-capacity
date: 2026-09-07
created: 2026-09-07T14:02:11.903Z
last_updated: 2026-09-07T14:02:11.903Z
contributor: Evan Jones
origin: note-skill
record_type: Company
entity: Wolfspeed Inc
ticker: WOLF
listed: true
tickers: []
subject: Wolfspeed SiC capacity buildout
action: observation
why: "capacity adds don't square with the pricing they're modeling"
source: "SemiAnalysis — SiC capacity buildout"
outcome_check_date:
tags: ["Semiconductors", "United States", "Power"]
attachments: []
price_target_buy:
price_target_sell:
conviction:
review_date:
review_status:
priority:
revision: 1
---
```

`buildFM()` now also writes any key the caller supplies that `FM_ORDER` doesn't
know about, after the known keys, so a field added in a later version can't
vanish on a read-modify-write.

---

## 8. Migration

### 8.1 Records written before v1.4

Missing keys parse as null under the existing parser. Nothing breaks; they just
won't answer an `action` query.

Backfill order:

1. Anything with a populated `price_target_buy` or `price_target_sell` →
   candidate for `initiate`. Review by hand; there won't be many.
2. Everything else with a note body → `action: observation`, `why` seeded from
   the first sentence of the body.
3. `origin: app` on all of them.
4. Leave `review_date` and `review_status` **untouched** — the Review Queue is
   a working feature and the backfill has no business in it.

Seeded `why` values are a starting point, not an answer. Fixing 20 one-liners in
the Admin table is fifteen minutes; leaving them null makes the field useless
for its first three months.

### 8.2 The SharePoint ingestion (~63 files)

- `origin: ingest`
- `action: reference` for everything. These are filed artifacts. Do **not**
  guess a disposition from a filename.
- `why:` blank — permitted, because `reference` exempts it.
- `review_date` / `review_status` blank. The batch surfaces in the **Admin
  table** filtered on `origin = ingest`, not in the Review Queue.

If a file turns out to carry a real view, the correct move is a new record with
the right `action`, not an edit. Immutability holds.

### 8.3 Config

No `_config.json` edit needed. `loadConfig()` backfills `actions` and `origins`
from SEED the first time a page loads after the upgrade, and `saveConfig()`
persists them on the next Admin write.

---

## 9. Forward compatibility: the Arcana position-diff log

Recorded so the schema doesn't move again when this gets built.

A position diff produces a record with `ticker`, `date`, `action` (derived
mechanically from the direction of the change), `origin: position-diff`, and an
empty `why`. The "why request" is then a filter, not a mechanism:
`origin = position-diff AND why is blank` in the Admin table. Filing a why
proactively is the same record typed forward instead of backward.

**No new fields required.** `action` covers the disposition, `origin` marks the
source, and blank-`why` is already a meaningful, detectable value. The only
additions when you build it are the `position-diff` enum value — reserved above
— and whatever the diff snapshot itself needs, which lives outside `NOTES/`.

Open question for later: whether an unanswered `why` should expire or
accumulate. Accumulating is probably right.

---

## 10. Implementation status

**`rc-core.js` — done, 123 assertions passing under Node.** Sites touched:

1. `ACTIONS` / `ORIGINS` constants and the `actions` / `origins` seed keys
2. `loadConfig()` backfill list extended by two keys
3. `matchTags()` longest-match-wins — `includes()` replaced with the
   boundary-checked `termContains()` (§15)
4. `FM_ORDER` extended by five fields, none removed; `buildFM()` split out
   `fmLine()` and gained unknown-key passthrough
5. `validateRecord()` added
6. `RECORD_TYPES` with `Note`; `entity` relaxed for `Note`; ticker-on-`Note`
   warning (§11)
7. `email` added to `ORIGINS`; `parseEmailHeaders()`, `normKey()` and
   `resolveTagNames()` added (§12)
8. `canSetWhy()` added for the write-once rule (§13.1)
9. Node shim appended so `/note` and the email reader can `require()` the same
   file

`RC`, `initials`, `slug`, `yamlStr`, `unq`, `parseFM`, folder plumbing,
`walkNotes`, `rewriteNote`, `setFMLine` and `bumpRevision` are untouched.

**Still to do:**

- `entry.html` — third mode button for Note (§11); action dropdown above
  Subject (it's the first decision, not the last); `why` directly under it;
  `source` shown only when `action: observation`; `origin: app` on every save;
  call `validateRecord()` before writing; paste-note box (textarea →
  `parseFM()` → show matched tags → save) as the no-connector fallback
- `reports.html` — **third bucket for `Note` (§11) — same commit as the third
  type**; filter by `action`; group by `action` × `tag`; `why` as a column;
  Open Whys queue (§13)
- `admin.html` — `action` / `why` / `origin` columns; `origin` filter (§6);
  `Note` in the record_type filter and bulk setter
- email reader: Task Scheduler script (§12.3)
- backfill script (§8.1)
- ingestion writes `origin: ingest` / `action: reference` (§8.2)
- `/note` SKILL.md
- Arcana position-diff log (§9) — later, no schema change

---

## 11. `record_type: Note` — the quick note

```
record_type: Company | Theme | Note
```

A thought about Brazil is neither a company nor a theme. Forcing it into
`Theme` would corrupt the theme vocabulary: `themes` in `_config.json` is a
closed, Admin-curated list, and `admin.html` builds a theme page per value
(`record_type === "Theme" && entity === th`). A `QUICK NOTE` theme would
generate a page whose entity is meaningless and which accumulates everything
unrelated to everything else.

A `Note` record has no ticker, no theme, and no price targets. `entity` is free
text and defaults to the subject when blank, so it is never empty on disk but
the caller need not supply it. Tags do the retrieval work — which is exactly the
Brazil case.

**The filter gap this opens.** `reports.html` currently reads:

```js
const companies = ns => ns.filter(n => n.record_type==="Company" || (n.record_type==null && n.ticker));
const themes    = ns => ns.filter(n => n.record_type==="Theme"   || (n.record_type==null && !n.ticker));
```

A `Note` has `record_type: "Note"` and no ticker, so it falls through **both**
filters and becomes invisible in Reports. The third bucket has to land in the
same commit as the third type, or quick notes disappear for a week before
anyone notices. Same in `admin.html`, which already renders an `unclassified`
pill and needs `Note` added to its type filter.

Validation: `entity` is required for `Company` and `Theme` only. A `Note`
carrying a ticker produces a warning — it probably wanted to be a company
record so it would show on the company page.

---

## 12. Email capture

`origin: email`. A dedicated mailbox; a scheduled reader writes into the local
OneDrive-synced NOTES tree, exactly where the app writes. Same path, same
`buildFM()`, no new failure mode.

Attachments arrive for free, which makes email the only non-app path that can
carry a PDF. That is the main argument for building it.

### 12.1 Header block syntax

Optional `KEY: value` lines at the top of the body, terminated by the first
blank line. Everything after that is the note.

```
TICKER: WOLF
ACTION: pass
BUY TARGET: 42
TAGS: Semiconductors, United States
WHY: capacity ramp isn't funded

Spoke with two accounts this morning...
```

**Bare `KEY: value`, not `**KEY**` or `(KEY)`.** Outlook sends HTML by default
and the reader works from the plain-text conversion. Asterisks either survive
as literal characters, get stripped, or arrive as tags depending on the client
and whether autocorrect touched them. Parentheses collide with note prose. A
bare key line survives every conversion intact and still reads naturally in a
sent email.

Keys are case- and space-insensitive: `Buy Target`, `BUY TARGET` and
`buytarget` are the same key. Digits are significant, so a typo like
`buytarget2` does not silently overwrite a real value.

| Key (and aliases) | Field |
|---|---|
| `TICKER` | `ticker` |
| `COMPANY` / `ENTITY` / `THEME` | `entity` |
| `TYPE` | `record_type` |
| `ACTION` | `action` |
| `WHY` | `why` |
| `SOURCE` | `source` |
| `SUBJECT` | `subject` (overrides the mail subject) |
| `DATE` | `date` |
| `TAGS` | comma-separated, resolved against the taxonomy |
| `BUY TARGET` / `PRICE TARGET BUY` | `price_target_buy` |
| `SELL TARGET` / `PRICE TARGET SELL` | `price_target_sell` |
| `CONVICTION` | `conviction` |
| `REVIEW DATE` | `review_date` |
| `OUTCOME CHECK` | `outcome_check_date` |

Defaults when a key is absent: mail subject → `subject`, sender → `contributor`
(matched against `cfg.contributors`), sent date → `date`, `record_type: Note`,
`action: observation`, `origin: email`. Tags still run through `matchTags()` on
subject and body, so a headerless email is a valid quick note.

### 12.2 Two behaviours worth knowing

**An unknown key before any known key means there is no header block.** A mail
opening `Note: saw this today and it looked cheap` is prose, and is treated
entirely as body. An unknown key *after* a real one is treated as a typo inside
a header block: consumed, and reported, so one bad line doesn't dump the rest
of the block into the note.

**Invented tags are dropped, never created.** `TAGS:` is resolved
case-insensitively against the taxonomy; anything that doesn't match is
discarded and logged. The closed vocabulary is the point — if the sender could
mint tags by typing them, the guarantee is gone. Misses go to
`_email_log.jsonl` at the NOTES root, the same pattern `_config_history.jsonl`
already uses, and the record surfaces in Admin under `origin = email` anyway.

### 12.3 The hard part is auth, not parsing

Something has to run on a schedule and Power Automate is out. Two options:

- **Task Scheduler + a local script.** Python or PowerShell against the shared
  mailbox, writing into `C:\Users\ej4\DUMAC\Direct Team Library\...\NOTES\`.
  Same trade already made with OneDrive sync over Graph writes. Downside: only
  runs when the machine is on, and it is one person's machine doing team work.
- **Azure Function or a small container.** Runs regardless, but needs IT and
  app-only Graph consent — already in flight for email reporting, so it may
  ride along.

Start with Task Scheduler. Budget the effort on the token flow (MSAL
device-code once, cached refresh token), not on the writer — which should just
call `buildFM()` under the Node shim, same as `/note`.

---

## 13. The why-response is a queue, not a form

Different interaction from a quick note. Don't merge them.

- **Quick Note → `entry.html`, third mode.** Same folder grant, same config
  load, same tag matcher, same save path. A separate page would duplicate
  `boot()`, config loading and tag rendering for nothing.
- **Why-response → an inline field in a list**, alongside the Review Queue in
  `reports.html`. Call it Open Whys. Filter:
  `origin = position-diff AND why is blank`. One row per position change, one
  text input, save on blur via `setFMLine` — the mechanism `review_date`
  already uses. Ten of these get answered in two minutes; nobody is composing.

Proactively filing a why with no position change behind it is just a normal
record from `entry.html` with the appropriate `action`. No separate path.

### 13.1 `why` is write-once

This collides with immutability and the resolution should be explicit rather
than an unwritten exception.

`why` is a record field, so it is immutable — but the position-diff pipeline
writes it **blank** and a human fills it in later. Completing a blank field is
not revising a judgement. So:

> `why` is settable while blank and frozen once set.

Enforced by `canSetWhy(prior)` in `rc-core.js`, called before any edit that
touches the field — the Open Whys queue and the Admin bulk editor both. This
keeps "a changed view is a new record" intact while letting the queue work.

---

## 14. Corrections to the first draft of this delta

| Claimed | Actual |
|---|---|
| `review_status: pending` surfaces records for approval | Review Queue filters on `review_date`; status alone surfaces nothing. Approval moves to the Admin table on `origin` (§6) |
| `review_status` values are `pending / approved / rejected` | `Pending` / `Done`, capitalized |
| `record_type` is `company` / `theme` | `Company` / `Theme`, capitalized — `reports.html` filters on the exact strings |
| Schema is ~20 fields | Also `listed`, `tickers`, `review_date`, `priority`, all now preserved in `FM_ORDER` |

---

## 15. Bug fixed in passing

`matchTags()` longest-match-wins compared raw substrings:

```js
o.term.toLowerCase().includes(h.term.toLowerCase())
```

`"Retail"` contains the letters `ai`, so `"Retail AI adoption"` returned
`Retail` only — the `Artificial Intelligence` hit was silently dropped.
Confirmed against the live taxonomy before the fix.

Replaced with boundary-checked containment, which still lets `Gold Miners`
suppress `Gold` and `Consumer Discretionary` suppress `Consumer`. All three
cases are in the regression suite, along with `EV` alongside `Defense`.

Any tag whose match term is a short acronym was exposed to this: `AI`, `EV`,
`US`, `EM`, `PE`, `RV`, `HY`, `VP`, `BR`, `CL`, `CN`, `HC`, `FX`. **Records
written before this fix have under-tagged frontmatter** and a re-tag pass over
the corpus is worth running with the backfill in §8.1.
