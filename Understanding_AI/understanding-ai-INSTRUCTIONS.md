# Understanding AI — Project Instruction Note

**Version:** 4.0 · 30 Aug 2026
**Changes from 3.0:** reader Q\&A log specified (§13, Option A — external markdown file, no writes into the PPTX); immutable slide IDs introduced (§15); deck version stamping added (§3); chapter ceiling raised to 30 minutes and Chapter 2 backlog absorbed (§11); content inventory in §11 explicitly marked **provisional pending incoming material**.

**Stability notice.** Sections 1–10 and 12–19 are **process** and are stable. Section 11 is a **content inventory** and will be rewritten when new source material arrives. Slide counts, chapter counts, and chapter membership are expected to change; the process governing them is not.

**Applies to:** every slide built or rebuilt from this point, and every edit of the outline.

\---

## 0\. How to use this note

Standing brief for the project. Any session reads this first, then `understanding-ai-outline.md` (content source of truth). Style conflicts → this note wins. Content conflicts → the outline wins.

\---

## 1\. Purpose and audience

* **Deliverable:** a **desk-reference handout**, read alone at \~50 cm. Not a presentation.
* **Audience:** investment-firm professionals. Numerate, fluent in financial and industrial concepts, no ML background.
* Consequences:

  * Every slide is **self-sufficient**. Nothing depends on narration.
  * Text density may exceed a projected deck's.
  * No animations or transitions. Speaker notes carry nothing essential.
  * Must print legibly in black and white.
* The deck is designed to be **worked through with an AI assistant at the reader's own pace** — ten seconds on a slide they know, four questions on one they don't. That imposes three requirements: the `.md` must be clean and self-describing; each chapter closes with structured reference pages an assistant can key off (§12); and every slide carries a permanent identifier a reader's notes can point at (§13, §15).

\---

## 2\. Deliverables and file conventions

**Output formats: `.pptx` and `.md` only.**

|File|Role|Distributed?|
|-|-|-|
|`Understanding\_AI.pptx`|The handout|Yes|
|`understanding-ai-outline.md`|Content source of truth + AI-BRIEFING header|Yes — this is the file readers upload to their assistant|
|`understanding-ai-companion.md`|Reader-facing guide to studying it with an AI|Yes|
|`understanding-ai-QA-template.md`|Empty Q\&A log the reader fills (§13)|Yes|
|`understanding-ai-INSTRUCTIONS.md`|This note|**No — maintainer only**|

* **PPTX naming:** `Topic\_In\_Pascal\_Case.pptx`. Per-chapter builds `Understanding\_AI\_Ch3\_Hardware.pptx`; consolidated file `Understanding\_AI.pptx`.
* Every build delivers the `.pptx` **and** the updated `.md`.
* Windows / Microsoft 365. Must open in desktop PowerPoint with no missing fonts and no repair prompt.

\---

## 3\. Versioning

Reader notes and questions have to survive reissues of the deck, so every artifact carries a version.

* **Deck version** `v\[major].\[minor]` — major on structural change (chapters added, renumbered), minor on content correction. Stamped in three places: the title slide, the `.md` header, and the PPTX file properties.
* **Dated** alongside the version: `v2.1 · 14 Sep 2026`.
* The Q\&A log records the deck version it was written against (§13). A reader on v1.3 with a v2.0 deck in hand knows their log predates it.
* **Slide IDs never change across versions** (§15). That is what makes a v1.3 note still resolve against a v2.0 deck.

\---

## 4\. Source of truth and workflow

1. **Draft in Markdown.** 2. **User approves wording.** 3. **Build to PPTX in chapter-sized batches.** 4. **Update the outline in the same turn** — status, filename, slide index, revision-log entry, version bump.

Rules:

* Never build unapproved text. Never let deck and outline drift.
* **Never summarize content away to save space.** Too full → split the slide. Detail and worked examples are the point.
* Cut content is retained in the outline under a marked **"held in reserve — not on the built slide"** block with the reason.
* The **AI-BRIEFING block** sits at the very top of `understanding-ai-outline.md`, above the title, in a fenced code block. Canonical text lives in §8 of the companion guide. The two must stay identical — edit both or neither.

\---

## 5\. Template and page geometry

Base: `DUMAC\_Direct\_Template.pptx`.

|Property|Value|
|-|-|
|Slide size|13.333 in × 7.5 in (16:9)|
|Theme fonts|Aptos in the theme — **override to Calibri on every run**|
|Title box|left 0.99 in, top 0.81 in · Calibri 14 pt bold · RGB `002060`|
|Footer placeholders|date, footer, slide number at top 6.95 in|
|Usable content band|x 0.99 → 12.34 in · y 1.30 → 6.80 in|
|Source/caveat line|\~y 6.45 in|

* Nothing below y 6.85 in.
* **Footer placeholder carries:** `S-034 · 3.2 · Hardware and supply chain`, 10 pt `595959`. Permanent slide ID first, chapter-relative number second, chapter name third.
* The slide-number placeholder keeps PowerPoint's continuous count.
* Do not rely on theme inheritance for fonts. Set `Calibri` explicitly on every run, including inside shapes and table cells.

\---

## 6\. Typography

**Calibri only. Nothing below 10 pt, nothing above 14 pt.**

|Element|Size|Weight|Color|
|-|-|-|-|
|Slide title|14 pt|Bold|`002060`|
|Chapter-divider title|14 pt|Bold|`002060`|
|Column / panel heading|12 pt|Bold|Black|
|Body bullet (L1)|11 pt|Regular|Black|
|Sub-bullet (L2)|10 pt|Regular|Black|
|Bold lead-in in a bullet|as bullet|Bold|Black|
|Diagram box text|10 pt|Regular (bold for box titles)|Black|
|Arrow / connector labels|10 pt|Italic|Black or `595959`|
|Table header|10 pt|Bold|Black|
|Table body|10 pt|Regular|Black|
|Stat callout number|14 pt|Bold|Black|
|Sources / caveats line|10 pt|Italic|`595959`|
|Footer (ID · number · chapter)|10 pt|Regular|`595959`|

* Line spacing 0.9–1.0; space-after 4–6 pt. Tighten spacing, never the font.
* Left-align everything. No centered body text, no justification, no ALL-CAPS runs, no shadows, no WordArt.

\---

## 7\. Color — fixed semantic palette

Color is permitted **where it encodes meaning**, not decoration. Palette is **pre-decided and closed** so no time is spent choosing.

|Use|Value|
|-|-|
|Titles|`002060` navy|
|Body text|Black|
|Category A / primary path|`156082` blue (theme accent 1)|
|Category B / contrast / secondary path|`E97132` orange (theme accent 2)|
|Neutral fills|`FFFFFF`, `F2F2F2`, `D9D9D9`, `A6A6A6`|
|Muted text, captions, footer|`595959`|

* Max **two** semantic colors per slide, always with a one-line legend naming what each means.
* Every colored distinction must survive greyscale print — pair color with position, label, or fill weight.
* Banned: accent bars and stripes, colored headers, gradients, shadows, 3-D, photos, stock icons, emoji, clip art, logos.

\---

## 8\. Diagram spec

Diagrams **explain**. If one doesn't remove words or make a relationship legible, cut it.

* Native PowerPoint shapes only. No images, no SmartArt, no icons.
* Box: rectangle, white or `F2F2F2` fill, black outline **0.75 pt**, square corners, 10 pt Calibri centered.
* Arrow: straight or elbow connector, black, **0.75–1 pt**, single stealth arrowhead. Label where the relationship isn't self-evident.
* Dashed outline = optional / planned / off the main path, named in the legend.

**Approved patterns** — reuse, don't invent:

1. Left→right flow · 2. Two-column comparison (+ optional through-line band) · 3. Vertical stack (layers) · 4. Series-bottleneck strip · 5. Loop with return arrow · 6. Ladder / ordered rungs · 7. Stacked share bar · 8. Two-point gap timeline · 9. Milestone timeline · 10. Stat-callout row.

\---

## 9\. Slide anatomy and density

1. **Title** — one line, 14 pt bold, states the takeaway or the question answered.
2. **Body** — bullets, diagram, or both (diagram left/top, bullets right/bottom).
3. **Optional band** — full-width through-line / takeaway / what-to-watch strip, `F2F2F2`, one or two sentences.
4. **Sources / caveats** — 10 pt italic grey, where external facts are asserted.

Limits: one idea per slide · max \~9 L1 bullets, \~6 with a diagram · max \~22 words per bullet · two-column slides max \~7 lines per column · ≥0.3 in white space at the bottom.

\---

## 10\. Writing, cross-referencing, definitions

* Lead with the point. Bold a 1–4 word lead-in where it aids scanning; never bold whole sentences.
* Gloss every term of art on first use, in-line.
* **Keep numbers, units, model names, product names and version strings exact.** Never round a technical figure to improve the prose.
* Date anything that can go stale. Distinguish fact / estimate / projection explicitly.
* One analogy per slide maximum. No hype adjectives, no rhetorical questions.
* **First-use rule:** a term is defined on the first slide where it appears; that slide owns it. Thereafter cross-reference by number — "the KV cache (3.1)" — never re-define.
* Maintain a **term → owning slide** register in the outline. It generates the chapter glossaries and the master glossary.
* Cross-references are written during the build pass, after running order is locked.

\---

## 11\. Chapter architecture — **PROVISIONAL, pending incoming material**

**Chapter sizing rules (stable):**

* Target **20–30 minutes** of concentrated reading per chapter. 30 minutes is the ceiling, not a goal.
* A chapter is one sitting. Never split a single argument across a chapter boundary.
* Every chapter ends with a glossary page and a companies page (§12), which cost \~4.5 min of the budget.

**Timing model — apply when adding or moving slides:**

|Slide type|Read time|
|-|-|
|Light (timeline, four boxes, simple flow)|1.5 min|
|Standard (bullets + small diagram)|2.5 min|
|Dense (two-column, 8–9 bullets, diagram + band)|3.5–4 min|
|Chapter divider|0.5 min|
|Glossary page|2 min|
|Companies page|2.5 min|

**Current inventory — will be rewritten when the new material lands:**

|Ch|Title|Content slides (working IDs)|Est.|
|-|-|-|-|
|1|How AI got here, and where it stands|1, 2, 2a, 2b, 3, 4|20 min|
|2|Inside the model: how it actually works|5, neuron zoom, 6, attention, 12, 7, 8|25 min|
|3|The hardware and the supply chain|9, 9a, 10, 11|20 min|
|4|Building reliably with an unreliable model|13, 14, 15, 16|17 min|
|5|Customizing a model|17, 18, 19, 20|17 min|
|6|Where the model runs: deployment choices|21, 22, 23, 24, 25|21 min|
|7|What it costs, and what drives the cost|26, 27, 28, 29|17 min|

The 30-minute ceiling resolves the former Chapter 2 split: both backlog slides — "inside a single neuron" and "from neural network to transformer: attention" — are absorbed into Chapter 2 at \~25 min. Seven chapters.

**Chapter divider page:** chapter number and title at 14 pt bold navy; one 11 pt line stating the question the chapter answers; a 10 pt line giving slide count and estimated time; a 10 pt list of the slide titles. No graphic.

\---

## 12\. Chapter closing pages

### Glossary page (second-to-last in each chapter)

* **Title:** `Chapter \[n] — Glossary`
* **Table, 10 pt:** Term | Definition (one line, ≤20 words) | Slide.
* Ordered by **first appearance, not alphabetically** — doubles as a recap of the chapter's argument.
* **Second block, "Carried forward from earlier chapters":** terms this chapter relies on but does not own, one-line reminder plus owning slide number. Max 6 entries. This is the mechanism satisfying "refer to past slides rather than redefine."
* Generated from the term register (§10), not freehand.
* **Master glossary** at the end of the deck: union of all chapter glossaries, alphabetized, with owning slide numbers. Built last.

### Companies page (last in each chapter)

* **Title:** `Chapter \[n] — Companies and organizations`
* **Table, 10 pt, four columns:** Company / organization · Listing (public + ticker, private, division of listed parent, or non-commercial) · Role in this chapter (one concrete line) · Slide.
* Group rows by layer where the chapter has a natural stack — e.g. silicon → memory → packaging → networking → systems and facilities → data sources. Grouping is a bold 10 pt row label, not a colored band.
* Companies recurring from an earlier chapter appear again with their **new** role plus a back-reference: `(also 3.1)`.
* **Descriptive only.** Standing 10 pt italic footer: *"Descriptive map of the industry structure described in this chapter. Not investment advice and not a view on any security."*
* **Tickers and listing status verified by search at build time — never written from memory.** Foreign listings carry the exchange (e.g. `000660.KS`). Private companies marked private, no implied valuation.
* **Combined page allowed** where a chapter names fewer than about six organizations — merge glossary and companies onto one page.
* **Split page allowed** where a chapter names 20+ — two pages or a two-column 10 pt layout, rather than cutting names.
* **Master company index** at the end: every organization once, alphabetically, with listing status and the chapters it appears in.

\---

## 13\. Reader Q\&A log — the pacing mechanism

**Design decision: notes live in a separate markdown file the reader owns. Nothing is ever written into the PPTX, into PowerPoint speaker notes, or into a SharePoint copy of the deck.**

Rationale: the deck gets reissued as facts decay. Anything stored inside it is destroyed on reissue, or traps the reader on a stale version to keep their annotations. An external file keyed to permanent slide IDs (§15) survives every reissue.

### Reader-side behavior

Specified in the AI-BRIEFING block so the reader's assistant follows it regardless of platform:

1. **Silent by default.** The assistant logs every question the reader asks and the answer it gave, keyed to slide ID. It does not announce this, does not confirm after each question, does not interrupt the reading rhythm.
2. **No questions → nothing happens.** No offer, no prompt, no mention of the log. A reader who clicks through a chapter in four minutes sees no trace of the mechanism.
3. **One offer, at the chapter end,** only if the log is non-empty: *"You asked 3 questions in this chapter — want them as a notes block to save?"* Asked once. If declined, not raised again for that chapter.
4. **Manual override any time:** the reader types `/notes` and gets the block immediately.
5. **Each entry is triaged** by the assistant:

   * `\[personal]` — the reader needed something the deck already covers adequately
   * `\[gap]` — the deck genuinely does not answer it
   * `\[correction]` — the reader found something wrong, stale, or contradicted by a search
6. **Each answer records its provenance:** `document` / `assistant knowledge` / `web search` with URL and date. This keeps document-grounded answers distinguishable from model recall in the reader's own notes.

### Log file format

Reader saves as `understanding-ai-QA-ch\[n]-\[initials].md`. Template shipped as `understanding-ai-QA-template.md`.

```
# Understanding AI — Q\&A Log
\*\*Chapter \[n] — \[title]\*\*
Reader: \[name] · Date: \[date] · Deck version: \[v2.1 · 14 Sep 2026]

---

## S-034 · 3.2 — Where CUDA fits
\*\*Q:\*\* \[question as asked]
\*\*A:\*\* \[answer, condensed]
\*\*Tag:\*\* \[gap]
\*\*Source:\*\* web search — \[url], accessed \[date]

---
```

### Maintainer-side loop

* The reader keeps the file. Nothing comes back automatically — that is the cost of the simplest option and it is accepted.
* The companion asks readers to forward **only `\[gap]` and `\[correction]` entries**, which keeps the merge queue free of "what does VRAM mean."
* Forwarded entries are triaged into: new slide, added bullet on an existing slide, glossary addition, or correction with a revision-log entry.
* **A `\[gap]` recurring across two or more readers is treated as a defect in the deck, not a reader problem**, and gets a slide.
* Merged content follows the normal outline-first workflow: draft in the `.md`, approve, build, version bump.

### Honest limits

* A briefing block is a request to another assistant, not a guarantee. Compliance varies by platform and degrades in long chats. The `/notes` command is the fallback and is documented for readers as the reliable path.
* No aggregation, no dashboard, no visibility into who read what. If that becomes wanted, a SharePoint list (Slide ID · Question · Answer · Added by · Date) is the next step up — deliberately deferred.

\---

## 14\. Reader pacing model

The deck must work at any speed. Design consequences, all already satisfied by §9 but stated so they don't get lost:

* **Self-sufficiency is what makes fast reading possible.** A reader spending ten seconds on a slide gets the whole point from the title plus the takeaway band.
* **Title states the takeaway**, not the topic. "Why HBM Supply Can't Just Scale Up," not "HBM Supply."
* **The optional band is the ten-second version** of a dense slide. Dense slides should have one.
* **Depth lives in the outline `.md`, not on the slide** — held-in-reserve blocks, full source notes, caveats. A reader with four questions gets them answered from the `.md` via their assistant, not from a more crowded slide.

\---

## 15\. Numbering and slide identity

Two identifiers, different jobs:

* **Permanent slide ID** — `S-001`, `S-002`, … Assigned at creation, in creation order, **never changed, never reused, never renumbered**, even if the slide moves chapters or is retired. A retired ID is marked retired in the register and left vacant. This is what makes a reader's Q\&A log resolve against any future version of the deck.
* **Chapter-relative number** — `3.2` = second content slide of Chapter 3. Apparatus pages `3.G` (glossary) and `3.C` (companies); dividers unnumbered. This is the human-readable reference used in cross-references on the slides and in the glossaries. It **does** change when structure changes.

Rules:

* Footer shows both: `S-034 · 3.2 · Hardware and supply chain`.
* PowerPoint's slide-number placeholder keeps the continuous count for printing.
* The outline maintains an **ID register**: permanent ID, current chapter-relative number, title, status. Updated in the same pass as any renumbering.
* On-slide cross-references use the chapter-relative form (`3.2`) — readable. The Q\&A log uses both, ID first.
* One renumbering pass per structural change, never piecemeal. Update every cross-reference, both glossaries, and the register in the same pass.

\---

## 16\. Research and sourcing standards

* **Search for anything time-sensitive** — model versions, prices, market share, capacity, lead times, tickers, personnel. Do not answer from training data on these.
* Prefer primary and dated sources. Aggregator blogs are last resort and flagged as such.
* Every slide asserting external facts carries a **Sources / caveats** line with source and as-of date.
* Flag stale, thin or secondary sourcing in the outline; keep such figures off the built slide unless approved.
* Corrections logged with old value → new value → why. Never silently overwrite.
* Existing figures were gathered Jul–Aug 2026 and need re-verification before external use. The hardware, deployment and pricing material decays fastest.

\---

## 17\. Status legend, revision log, QA

Status markers: `\[BUILT]` (names file + slide index) · `\[DRAFT]` · `\[HELD]` · `\[RETIRED]` (ID kept, content withdrawn).
Revision log: dated entry for every build or material change, with version bump.

**Pre-delivery checklist:**

* \[ ] Every run Calibri; no theme-font fallback, including in shapes and tables
* \[ ] No text below 10 pt or above 14 pt
* \[ ] Palette limited to §7; max two semantic colors per slide; every one legended
* \[ ] Colored distinctions survive greyscale
* \[ ] Nothing below y 6.85 in or outside x 0.99–12.34 in
* \[ ] No overflow, no auto-shrunk boxes, no overlapping shapes
* \[ ] Diagram outlines 0.75 pt black; fills white/grey unless encoding meaning
* \[ ] Every slide readable with no narration, and gettable in ten seconds from title + band
* \[ ] Every external fact has a source and as-of date
* \[ ] Tickers and listing status verified by search, not memory
* \[ ] Companies-page disclaimer present
* \[ ] Footer shows `S-nnn · chapter.slide · chapter name`
* \[ ] Permanent IDs unchanged from prior version; register updated
* \[ ] Cross-references point at correct chapter-relative numbers
* \[ ] Chapter glossary matches the term register
* \[ ] Chapter runs 20–30 min against the §11 timing model
* \[ ] Deck version stamped on title slide, in the `.md` header, and in file properties
* \[ ] Prints legibly in greyscale
* \[ ] Opens in desktop PowerPoint with no repair prompt
* \[ ] Outline updated: status, filename, slide index, revision log, version

\---

## 18\. Legacy conformance backlog

Five decks built under earlier rules. Usable as-is; rebuild before consolidation.

|File|Slides|Non-conformance|
|-|-|-|
|`AI\_Evolution\_Timeline.pptx`|1–2|verify fonts and sizes|
|`AI\_2026\_Developments.pptx`|3–4|stat callouts exceed 14 pt|
|`How\_Neural\_Networks\_Work.pptx`|5|verify sizes|
|`Words\_to\_Answer\_LLM.pptx`|6|verify sizes|
|`AI\_Hardware\_and\_CUDA.pptx`|9, 9a, 10, 11|stat callouts exceed 14 pt; recolor 9a to `156082`/`E97132`; share bar to palette|

All five also need footers with permanent IDs, chapter numbering, and the chapter closing pages. Rebuild is **format-only** — approved wording does not change.

\---

## 19\. Open decisions

1. **Consolidation** — one master `.pptx`, or one file per chapter for distribution?
2. **Master appendices** — include master glossary and master company index, or rely on per-chapter pages?
3. **Companies page depth** — four columns, or a fifth for the specific dependency (e.g. "gated by CoWoS allocation")?
4. **Footer** — `S-034 · 3.2 · chapter name` as specified, or add "Internal"?
5. **Build order** — densest chapter first to exercise every spec at once, or front-to-back?
6. **Fact re-verification** — now, or at consolidation?
7. **Q\&A log distribution** — ship the template as a file, or leave it as a format the assistant emits on request?

*Resolved: chapter ceiling 30 min · Chapter 2 absorbs both backlog slides, seven chapters · reader notes as external `.md` (Option A) · color permitted from a fixed closed palette.*

