# Understanding AI — Project Instruction Note

**Version 5.6 · 2 Oct 2026**
Maintainer only. Not distributed.

## Changes from 5.5

Deck v5.4. Chapter 2.5 is renumbered **Chapter 2.5** by maintainer decision.

- **§4** — the "chapter numbers are integers" rule is replaced. A companion chapter takes a half-step
  number beside the chapter it extends; its slides take three-part numbers, always cited in full.
- **§11** — Chapter 2.5 sits between 2 and 3.
- **§15** — the renumbering regex must handle three-part numbers before two-part ones.

## Changes from 5.4

Deck v5.3. A Contents panel joins the reader shell, and the maintainer closed five open decisions.

- **§5** — the Contents panel is part of the shell: specified below, generated from `CARDS`.
- **§6** — the photograph exception is **confirmed**, no longer provisional.
- **§11** — chapters over the ceiling are **accepted**. The 30-minute figure is now a target, not a
  limit requiring sign-off.
- **§19** — one new checklist item.
- **§20** — rewritten around the decisions.

## Changes from 5.3

Deck v5.2. Chapter 1 took two progression slides; its numbering turned out to be broken; and the
v5.1 terminology audit turned out to have missed twenty instances.

- **§15** — new rule: chapter-relative numbers are unique within a chapter. Chapter 1 had broken it
  since v3.0. Next free ID `S-087`.
- **§9** — new rule on *how* to audit terminology: search the whole file for the word, then exclude
  permitted compounds. A windowed regex silently skips matches near line breaks, which is how v5.1
  claimed a clean sweep and was wrong.
- **§11** — Chapter 1 is 13 slides, ~30 minutes, and its direction is set: the progression of AI
  over time.
- **§16** — conference slides are now a recurring source, and three of the last four sets contained
  at least one wrong attribution. Stated as a rule.

## Changes from 5.2

The deck went to v5.1: every reader swept, three slides added to Chapter 7. The sweep found defects
the checklist should have caught, so the rules tighten:

- **§3** — the live version-stamp defect is closed. All nine readers agree.
- **§5** — new rule: an end panel must never say a built chapter is unbuilt, and must never carry a
  maintainer tool. Three did both.
- **§15** — suffixed numbers (`7.5b`) are now the standard way to insert a slide without
  renumbering. Next free ID `S-085`.
- **§13** — when reconciling a reader's saved notes, key on the `S-` ID, never the chapter label.
  Five readers mislabelled every question "Chapter 1" until v5.1.
- **§11** — Chapter 7 is now 13 slides, ~33 minutes.
- **§19** — two new checklist items, and the restamp item now names the sweep.

## Changes from 5.1

Chapter 2.5 was built — a companion to Chapter 2, drawn from photographs of a conference talk —
and four rules in 5.1 did not survive contact with it:

- **§6** gains a defined exception for embedded photographs. 5.1 banned them outright, including
  as source material; Chapter 2.5 embeds six at the maintainer's request. The exception has
  conditions, and the decision to keep it is open (§20).
- **§9** adds "system card" to the permitted compounds of *card*.
- **§11** gains Chapter 2.5, a third unaccepted ceiling breach, and a rule for companion chapters.
- **§15** moves the next free ID to `S-082`. Chapter 6 no longer takes `S-069`.
- **§4** gains a numbering rule: a chapter number must never take a form that collides with a
  slide number. "Chapter 2.5" was proposed and declined for exactly that reason.
- **§3** records that the version-stamp defect is narrower but still open, and that a
  terminology sweep belongs in the same pass — Chapter 2 failed it.

## Changes from 5.0

Chapter 9 was built, and three things in it are not covered by 5.0:

- **§5** gains a third apparatus type. Chapter 9 carries a *Check yourself* page — questions on the
  slide, answers in the Go deeper block. 5.0 named only the glossary, the companies page and the
  What's next panel. Either this is admitted as a type or the page comes out; §20 carries the decision.
- **§9** is clarified on the banned term. "Rate card" and "model card" are terms of art and are
  permitted, on the same footing as "graphics card". The ban is on *card* as the name for the unit.
- **§11** gains Chapter 9 and a second accepted-ceiling exception, which is **not yet accepted**.
- **§18** gains a worked example of a correction that changes what a source is evidence *for*, rather
  than what it says. That case did not exist before and the protocol did not cover it cleanly.
- **§20** is rewritten. Chapter 8's drafting item is closed. Six items are added.

**Stability notice.** §1, §3, §10, §12–§17 and §19–§21 are process and are stable. §11 is a content
inventory and changes whenever a chapter is added.

**Applies to:** every slide built or rebuilt from this point.

**Note on the file you may be holding.** A copy of this note dated **4.0 · 30 Aug 2026** is still in
circulation. It predates the HTML readers entirely — it specifies PowerPoint page geometry as the
live deliverable, describes the outline as hand-maintained, and carries an §11 inventory marked
*provisional*. If the note you are reading says 4.0, discard it; this file supersedes it.

---

## 0. How to use this note

Standing brief. Any session reads this first, then `understanding-ai-outline.md` for content.
Style conflicts → this note wins. Content conflicts → the outline wins. Where the outline and a
built reader disagree, the reader wins, because the outline is generated from it.

---

## 1. Purpose and audience

A self-paced reference on AI for investment professionals: numerate, fluent in financial,
industrial and supply-chain concepts, no machine-learning background.

Consequences that drive every other rule:

- Every slide is self-sufficient. Nothing depends on narration or on having read the previous
  slide five minutes ago.
- One idea per slide. If a slide carries two, it is two slides.
- Depth is optional and separated. The reader chooses whether to open it.
- Text density may exceed a projected deck's. This is read at a desk, not from a chair.
- Every external fact is dated and tiered. The audience's professional instinct is to ask where a
  number came from. Answer before they ask.

---

## 2. Deliverables and file conventions

Output formats: HTML readers, and Markdown. PowerPoint is legacy (Appendix A).

| File | Role | Distributed |
|---|---|---|
| `index.html` | Chapter menu and entry point | Yes |
| `understanding-ai-ch[n]-reader.html` | One per chapter | Yes |
| `understanding-ai-outline.md` | Content source of truth, generated. Carries the AI-BRIEFING block | Yes — this is what readers upload to an assistant |
| `understanding-ai-companion.md` | Reader-facing guide | Yes |
| `README.md` | Repository front page; chapter table, known issues, licensing | Yes |
| `understanding-ai-ch[n]-cards-draft.md` | Per-chapter working draft, pre-approval | No |
| `understanding-ai-INSTRUCTIONS.md` | This note | No |
| `understanding-ai-chat-handoff.html` | Session handoff | No |
| `NVDA_Engineer_SAIL_Founder_pod.md` | Interview transcript, source for Ch 3, 6, 7 | No |

Keep the distributed files in one folder. Inter-chapter links are relative.

**Self-contained.** No external fonts, no CDN, no network calls, no browser storage. Must open from
a local file path on Windows in Edge or Chrome and work offline.

`index.html` is rewritten on almost every change. When redistributing, that is the file to replace
first.

---

## 3. Versioning

`v[major].[minor]`, major on structural change, minor on content correction. Dated alongside:
`v4.0 · 2 Oct 2026`. **Adding a chapter is structural**, so a new chapter is always a major bump —
this was ambiguous in 5.0 and is now stated.

Stamped in four places, and they must agree:

1. The `.meta` line in every reader's header
2. The version line on `index.html`
3. The `.md` header of the generated outline
4. The notes-block header the reader's copy button emits — this is the one that matters most,
   because a reader's saved Q&A log has to record the version it was written against

A mismatch here is a real defect: it silently misdates every question a reader saves. Check all four
on any version bump.

**Closed at deck v5.1.** All nine built readers carry `v5.1 · 2 Oct 2026` in places 1 and 4. The
defect was introduced at v3.0 and survived three releases because each release restamped only the
files it touched.

**Restamp and sweep together.** When Chapter 2 was opened for restamping it turned out never to
have received the v3.0 terminology change, and its ask box labelled every question "Chapter 1".
A restamp pass is the cheapest moment to check §9 terminology and `promptFor()` as well, so do
all three whenever a reader is opened.

**A version bump touches every reader, not only the new one.** That is the lesson of the defect
above: it was introduced at v3.0 by updating the index and outline without sweeping the readers, and
it has survived two releases.

---

## 4. Source of truth and workflow

The outline is generated from the readers. It is never hand-edited.

1. **Draft in Markdown** — `understanding-ai-ch[n]-cards-draft.md`. Full slide text, graphic spec,
   sources with tiers, and a corrections section.
2. **Maintainer approves the wording.** Never build unapproved text.
3. **Build the reader.** Clone the most recent reader as a shell, replace the slide data.
4. **Wire it** — previous chapter's end panel, `index.html`, version stamps.
5. **Regenerate the outline** from all readers in the same pass.

Rules:

- Never summarize content away to save space. Too full → split the slide.
- Cut content is retained in the chapter's draft file under a marked **held in reserve** block with
  the reason.
- The AI-BRIEFING block sits at the very top of the generated outline in a fenced code block.
  Canonical text is §9 of the companion guide; the two must stay identical. **The block states the
  chapter count** — check it on every chapter addition. It said "Seven chapters" through two
  releases in which eight were built.
- Approval is per-chapter, and "new content" is called out separately from wording. A slide that
  did not exist before is a content decision, not an editorial one.

**Companion chapters take a half-step number** *(maintainer decision, deck v5.4; replaces the 5.2
rule that chapter numbers are integers)*. A chapter that extends an earlier one is numbered beside
it — Chapter 2.5 sits between 2 and 3. Its slides take **three-part numbers** (2.5.1, 2.5.2 …) and
are **always cited in full**: a bare "(2.5)" means Chapter 2's slide 2.5, and an abbreviated
three-part number is the one way the scheme breaks. The file is named with a hyphen,
`understanding-ai-ch2-5-reader.html`, because a second dot in a filename invites trouble.

**Where steps 1 and 2 are skipped.** Chapter 9 was built directly from research at the maintainer's
request, with no draft file and no recorded wording approval. That is a permitted deviation when the
maintainer asks for it, but it costs the corrections record — so when it happens, the chapter's
corrections go into the outline's revision log in the same pass, with the deviation itself logged
beside them. Do not let a skipped draft become a skipped correction log.

---

## 5. Reader specification

Each chapter is one HTML file containing an array of slide objects and the navigation shell.

Slide object fields:

| Field | Required | Purpose |
|---|---|---|
| `id` | Yes | Permanent slide ID (§15) |
| `num` | Yes | Chapter-relative number |
| `title` | Yes | States the takeaway, not the topic |
| `figure` | No | Inline SVG, an HTML table, or `null` |
| `body` | Yes | The on-slide text |
| `band` | No | Full-width takeaway strip |
| `depth` | No | The Go deeper block |
| `sources` | Where external facts are asserted | Source, date and tier |

**Apparatus slides** carry `apparatus:true` and a short `label`, are excluded from the slide count,
and render with square rather than round navigation dots. The ask box is hidden on them. The outline
generator skips them entirely, so anything that must survive into the source of truth belongs on a
content slide.

Three apparatus types are defined. Every chapter ends with the last two:

- **Check yourself** *(optional, new at v5.1)* — questions in the body, answers in the Go deeper
  block, each answer naming the slide it came from. Sits before the glossary. Use it where a chapter
  carries a counter-intuitive mechanism the reader is likely to half-absorb; skip it where the
  chapter is descriptive. Six to eight questions. Currently used only in Chapter 9, and its retention
  is an open decision (§20).
- **Glossary** (§12) — required.
- **Companies / organisations** (§12) — required, may be combined with the glossary.
- **What's next** — required, and must not read as a conclusion.

Navigation: arrow keys, space, `Home`, `End`; clickable dots showing visited state.

**Contents panel** *(added at deck v5.3)*. A collapsible `<details class="toc">` directly under the
header. Collapsed it reads "Contents — N slides". Open, it lists every slide as chapter-relative
number plus title, in two CSS columns (`column-count:2`, falling back to one under 640 px), then the
apparatus pages by label in muted italics. A click sets the slide, re-renders and closes the panel.
The current slide is highlighted and visited slides are ticked, from the same `seen` set the dots use.

The list is **built at load time from `CARDS`**. Never hand-write it into the HTML: a written list
drifts the first time a slide is added, retitled or renumbered, which is exactly the failure the
generated outline exists to prevent. When cloning a reader as a shell, the panel comes with it and
needs no editing. The render hook wraps `render()` rather than editing it, so it survives changes to
the engine.

Question capture (§13): an ask box on every content slide copies a prompt tagged with the slide ID
and title; a copy-all button emits the notes block. Session-only, in memory, no storage.

**When cloning a reader as a shell, check the hardcoded chapter number in `promptFor()`.** Until
v5.1, five of nine shipped readers — Chapters 3, 4, 5, 7 and 8 — labelled every copied question
"Chapter 1", inherited from the shell they were cloned from.

**End panels age.** An end panel written when the next chapter did not exist will say so forever
unless someone changes it. At v5.1, Chapters 3, 4 and 5 still told readers the next chapter was
"not built in this format yet", offered a button that copied a **maintainer drafting prompt** into
the reader's clipboard, and linked nowhere. Two rules follow: an end panel never carries a
maintainer tool, and whenever a chapter is built, every end panel that mentions it is updated in
the same pass — not only the immediately preceding one. Chapters 5 and 8 currently mention
Chapter 6 as in development and must change when it is built.

The end panel must not read as a conclusion. Chapters are added over time. It points to the next
chapter where one exists, lists the chapters inline so it does not depend on the index being
current, and states that the numbering is for convenience rather than sequence.

---

## 6. Typography and colour

Calibri throughout, with a system fallback. Reader body text ~17 px; diagram text 11–14 px.

| Use | Value |
|---|---|
| Titles | `002060` navy |
| Body | `1a1a1a` |
| Category A / primary path | `156082` blue |
| Category B / contrast | `E97132` orange |
| Neutral fills | `FFFFFF`, `F2F2F2`, `D9D9D9`, `A6A6A6` |
| Muted text, captions, sources | `595959` |

Maximum two semantic colours per slide, always with a one-line legend naming what each means. Every
coloured distinction must survive greyscale — pair colour with position, label or fill weight.

Banned: accent bars and stripes, gradients, shadows, 3-D, photos, stock icons, emoji, clip art,
logos.

**Photographs are banned by default, including as source material.** Where a figure arrives as a
photograph — a conference slide, a screenshot of a chart — redraw it in house style and say in the
sources line that it was redrawn and where the numbers came from. Chapter 9's slide 9.13 is the worked
example.

**Exception, added at v5.2 and confirmed by the maintainer at deck v5.3 — embedded photographs, on the maintainer's explicit instruction only.**
Chapter 2.5 embeds six photographs of a presenter's slides (2.5.4, 2.5.6, 2.5.8, 2.5.9, 2.5.11, 2.5.12),
because the original layout carries the finding better than a redraw would. Where the exception is
used, all of the following hold:

- Embed only where the layout is the point. The other slides in the same chapter are redrawn.
- Crop to the content, compress to JPEG at roughly 50–60 KB, and inline as a data URI — the
  self-containment rule in §2 still binds.
- Caption every photograph with its origin and the words "reproduced for internal reference".
- Give every image a descriptive `alt` written as a sentence. The outline generator reads it as the
  graphic spec, exactly as it reads an SVG `aria-label` (§7).
- State in the sources line that the photograph is a deliberate exception to §6.
- Log the exception and its IP status in the outline's revision log, and add it to the distribution
  decision (§20). Photographs of a third party's slides are a licensing question in the same class as
  Chapter 8's source.

The colour and greyscale rules cannot apply to a photograph, and are waived for the image only. The
slide's own text, band and any accompanying diagram stay fully within §6.

---

## 7. Diagram specification

Diagrams explain. If one does not remove words or make a relationship legible, cut it.

- **Inline SVG only.** No images, no external libraries. `viewBox="0 0 680 H"`, height to suit.
- Every SVG carries `role="img"` and a descriptive `aria-label`. This is not only accessibility: the
  outline generator reads the aria-label as the slide's graphic spec, so a missing or lazy label
  degrades the source-of-truth document. Write it as a sentence describing what the diagram shows.
- Boxes: white or `F2F2F2` fill, black outline 0.75 pt, 11–13 px text.
- Arrows: straight or elbow, 1 pt, single stealth head, labelled where the relationship is not
  self-evident.
- Approved patterns — reuse, don't invent: left→right flow · two-column comparison · vertical stack ·
  series-bottleneck strip · loop with return arrow · ladder / ordered rungs · stacked share bar ·
  two-point gap timeline · milestone timeline · stat-callout row · Sankey · two-axis scatter ·
  schematic · paired-bar comparison.
- **Tables** are a legitimate figure where the content is genuinely tabular. Do not draw a diagram of
  a table.
- Check label collisions on thin bands before shipping. Compute geometry rather than hand-placing it
  where the layout is dense.

**Embedded photographs** (§6 exception) carry an `alt` attribute held to the same standard as an
`aria-label`: a full sentence describing what the image shows, because it becomes the outline's
graphic spec.

**Two-point gap timelines must say so.** Where a diagram joins two measured points with a line, the
line is not data. Put that on the figure, not in the sources line — 9.8 reads "the path between them
is not measured and was not linear."

---

## 8. Slide anatomy and density

1. **Title** — states the takeaway or the question answered.
2. **Figure** — diagram or table, where one earns its place.
3. **Body** — the on-slide text. Max ~9 top-level bullets, ~6 with a diagram, ~22 words a bullet.
4. **Band** — optional full-width takeaway. Dense slides should have one; it is the ten-second
   version of the slide.
5. **Go deeper** — the second layer. Where the argument, the caveat and the read-across live.
6. **Sources / caveats** — required wherever an external fact is asserted.

A slide the reader can get in ten seconds from title plus band, and in three minutes from the whole
thing, is correct. A slide that needs the depth block to make sense is not.

**A caveat that changes how the reader should read the figure goes in the body, not in Go deeper.**
A warning that only 22% of readers will open is not a warning. Use the `p.warn` block.

---

## 9. Writing

Lead with the point. Bold a 1–4 word lead-in where it aids scanning; never bold sentences.

Gloss every term of art on the slide where it first appears — not later, not in the depth block.
Three separate defects in Chapter 2 and one in Chapter 3 traced to breaking this.

Keep numbers, units, model names and version strings exact. Never round a technical figure to
improve the prose.

Date anything that can go stale. Distinguish fact / estimate / projection explicitly.

One analogy per slide. No hype adjectives, no rhetorical questions.

**Terminology: the unit is a slide. Never a card** — Chapter 3 is about hardware, where a card is a
physical object, and the collision confused a reader.

*Clarified at v5.1:* the ban is on *card* as the name for the unit. Compound terms of art where
"card" means something else are permitted and should not be rewritten — **graphics card**, **rate
card**, **model card**, **system card**. A regex sweep for the word will hit these; they are not
defects. "Rate card" appears eleven times in Chapter 9 and "system card" six times in Chapter 2.5,
both deliberately.

**How to audit for it.** Search the whole file for the word itself, case-insensitive, then
exclude the permitted compounds — never use a pattern that requires context on both sides of the
match. The v5.1 audit used `.{28}card.{28}`, which cannot match within 28 characters of a line
break; it reported zero and twenty remained, including the ask-box heading on two chapters.

Cross-reference by chapter-relative number in parentheses — "the KV cache (2.7)". Write
cross-references after running order is locked.

---

## 10. No investment advice

Company names map an industry structure. They are not recommendations.

Explaining how a bottleneck propagates is in scope. Telling someone what to buy is not.

Where source material carries ratings, price targets, upside percentages or model portfolios, none of
it is reproduced. Chapter 8 is drawn from a sell-side note built around a 76-stock basket; the value
chain and constraint taxonomy came across, and no rating did.

Companies pages carry the standing disclaimer.

Where the material takes a position, it is flagged on the slide as analysis.

**A ranked list of models is not a recommendation, but it is close enough to need the flag.** Chapter
9's slides 9.5 and 9.6 rank models by measured capability. Both carry an explicit "analysis, not a
published ranking" note on the slide, and neither draws a conclusion about any listed company's
securities. Any future slide ranking vendors does the same.

---

## 11. Chapter architecture — updated whenever a chapter is added

| Ch | Title | Slides | Time | Status |
|---|---|---|---|---|
| 1 | How AI got here, and where it stands | 13 | ~30 min | Ready — direction: progression over time |
| 2 | Inside the model: how it actually works | 10 | ~24 min | Ready |
| 2.5 | Reading the model from the inside — *companion to Ch 2* | 13 | ~34 min | Ready, sizing not accepted |
| 3 | The hardware and the supply chain | 12 | ~32 min | Ready |
| 4 | Building reliably with an unreliable model | 11 | ~28 min | Ready |
| 5 | Customizing a model | 13 | ~32 min | Ready |
| 6 | Where the model runs: deployment choices | 10 | ~26 min | In development |
| 7 | What it costs, and what drives the cost | 13 | ~33 min | Ready, sizing not accepted |
| 8 | Mapping AI capex | 10 | ~28 min | Ready |
| 9 | Measuring competency: what the scores mean and how far they moved | 14 | ~36 min | Ready, sizing not accepted |

**Sizing:** target 20–30 minutes per chapter; a chapter is one sitting; never split a single argument
across a chapter boundary. **Decided at deck v5.3:** chapters over 30 minutes are acceptable. The
figure is a target to aim at when drafting, not a ceiling that needs sign-off. The notes below record
where each overrun splits, should that ever be wanted.

- Chapters 3 and 5 run ~32 minutes, accepted by the maintainer in both cases. Chapter 3 splits
  cleanly into hardware (3.1–3.5) and supply chain (3.6–3.12) if the ceiling is reinstated.
- **Chapter 9 runs ~36 minutes and is not accepted.** It splits cleanly at 9.10 — competency and
  measurement (9.1–9.10, ~26 min), and the cost of the capability gap (9.11–9.14, ~10 min). The
  second half is also a candidate for merging into Chapter 7, which already prices tokens. §20 item 3.

- **Chapter 2.5 runs ~34 minutes and is not accepted.** It splits cleanly at 2.5.6 — what is inside
  and how it is read (2.5.1–2.5.6, ~16 min), and what it is used for (2.5.7–2.5.13, ~18 min). §20 item 3.

**Companion chapters.** A chapter written later that belongs beside an earlier one takes a half-step number (§4) and is
declared a companion. Three places must say so: the earlier chapter's end
panel links to it first, ahead of the next numbered chapter; the index row for the earlier chapter names
it; and the companion's own end panel explains its number. Chapter 2.5 is the companion to Chapter 2.

**Timing model:** light slide 1.5 min · standard 2.5 min · dense 3.5–4 min · glossary 2 min ·
companies 2.5 min · check yourself 3 min. Times assume Go deeper is opened occasionally, not always.

Chapters are added as the subject moves. The set is open-ended, the numbering is for convenience
rather than sequence, and no chapter is the last one. Nothing in the material should imply otherwise.

---

## 12. Chapter closing pages

**Glossary page.** Table: Term | Definition (one line, ≤20 words) | Slide. Ordered by first
appearance, not alphabetically — it doubles as a recap of the argument. Second block, carried forward
from earlier chapters: terms this chapter relies on but does not own, with the owning slide. Max six.

**Companies page.** Table: Organisation | Listing (public with ticker, private, division, or
non-commercial) | Role in this chapter (one concrete line). Grouped by layer where the chapter has a
natural stack. Recurring organisations carry a back-reference — `(also 3.1)`. Descriptive only.
Standing footer: "Descriptive map of the industry structure described in this chapter. Not investment
advice and not a view on any security."

Tickers should be verified at build time. Where they have not been, say so on the page — Chapter 8's
disclaimer does this, and Chapter 9's does the same.

Combined glossary-and-companies page where a chapter names fewer than about six organisations
(Chapters 4, 5, 7, 9, 10). Split or grouped where it names twenty or more (Chapters 3, 8).

**Name an organisation on the companies page where the chapter corrects a misconception about it,**
even if the chapter barely discusses it otherwise. Chapter 9 lists TypeSafe solely because 9.13
corrects a widespread reading of its model as open-weight. The page is where a reader checks, so the
correction has to be findable there.

---

## 13. Reader question capture

Notes live in a markdown file the reader owns. Nothing is written into the readers themselves.

**Rationale:** the material is reissued as facts decay. Anything stored inside it dies on reissue, or
traps the reader on a stale version to keep their annotations. An external file keyed to permanent
slide IDs survives every reissue.

**Implementation:** an ask box on every content slide copies a prompt tagged with slide ID and title.
A copy-all button emits the notes block with `**A:**` and `**Tag:**` blank for an assistant to
complete. Session-only and in memory — the companion guide warns readers to copy before leaving a
chapter.

**Tags:** `[personal]` the material covers it adequately · `[gap]` it does not · `[correction]`
something wrong, stale or contradicted.

**Reconciling saved notes: key on the slide ID, never the chapter label.** Notes saved before deck
v5.1 from Chapters 3, 4, 5, 7 and 8 say "Chapter 1" in the prompt line. The `S-` ID beside it is
correct. This is the case §15's permanent IDs exist for.

**Maintainer loop:** readers forward only `[gap]` and `[correction]`. A gap two readers hit
independently is a defect in the material and gets a slide. Eleven of the current slides exist because
a reader asked, and the whole of Chapter 9 exists because of a maintainer question — this loop is the
single most productive input the project has.

---

## 14. Reader pacing

The material must work at any speed.

- A reader spending ten seconds on a slide gets the whole point from title plus band.
- A reader with four questions gets them from Go deeper, then from an assistant.
- Depth lives in the depth block and the outline, not in a more crowded slide.

---

## 15. Numbering and slide identity

**Permanent slide ID** — `S-001`, `S-002`, … Assigned at creation, in creation order. Never changed,
never reused, never renumbered, even when a slide moves chapters. A retired ID is marked retired and
left vacant. This is what makes a reader's old Q&A log resolve against a new version.

**Chapter-relative number** — `3.2`. Human-readable, used in cross-references, and it does change.

Rules:

- The outline maintains the full ID register. Check it before assigning.
- Known collision: `S-007` and `S-008` were assigned to Chapter 1 slides derived from old outline
  slides 2a and 2b, so outline slides 7 and 8 became `S-032` and `S-033`. Anything above `S-030` was
  assigned after August 2026.
- Suffixed IDs (`S-007a`, `S-005b`) mark slides split out of one original.
- **Chapter-relative numbers are unique within a chapter.** Two slides may share a permanent-ID stem
  (`S-008a`, `S-008b`) but never a displayed number. Chapter 1 broke this from v3.0 to v5.2 — 1.3,
  1.4 and 1.5 each named more than one slide — so a cross-reference to them could not be resolved.
- **Three-part numbers** (`2.5.7`) belong to half-step chapters (§4). Any renumbering regex must
  match three-part numbers **first** — a pattern for `[chapter].[n]` will otherwise read `2.5.7` as
  slide `2.5` followed by `.7`. Exclude currency (`$10.00`) and measurements (`10.4 points`), which
  the v5.4 pass had to.
- **Suffixed chapter-relative numbers** (`1.5b`, `7.6b`) insert a slide without renumbering its
  neighbours. Prefer this to a renumbering pass whenever other chapters cross-reference the slides
  that would move. Chapter 7 took three at v5.1 for that reason. The permanent ID is still the next
  free one in creation order, so a suffixed slide's ID says nothing about its position.
- One renumbering pass per structural change, never piecemeal. Regex the whole file, remap every
  `[chapter].[n]` token at once, then verify cross-references and glossary slide columns.

**State: `S-001`–`S-086` assigned. Next free ID `S-087`.** `S-085`–`S-086` went to Chapter 1's
progression slides (1.4d, 1.4e). Earlier note, for the record: `S-055`–`S-068` went to Chapter 9,
`S-069`–`S-081` to Chapter 2.5, and `S-082`–`S-084` to Chapter 7's suffixed slides, all on
2 Oct 2026. Chapter 6 — a lower-numbered chapter — takes `S-085` onward when built. That is correct
and expected: IDs record creation order, not position.

---

## 16. Research and sourcing

- **Search before drafting** any chapter containing dated material. Do not answer from training data
  on model versions, prices, market share, capacity, lead times, tickers or personnel.
- **Prefer primary.** A vendor's own documentation beats a tracker; an arXiv paper beats a summary of
  it; a company statement beats trade press reporting it.
- **State the tier on the slide.** Every sources line says what kind of source it is: primary,
  secondary, analyst estimate, vendor estimate about its own market, or analysis.
- Aggregator blogs are last resort and flagged as such.
- Where several independent sources agree, say so — it is weak evidence but real.
- **Re-verify before external use.** The hardware, deployment, pricing, capex and benchmark material
  decays fastest.

**Where two sources disagree, prefer the one that ran the measurement over the one that compiled
it.** Chapter 9 hit this directly: an aggregator compiling provider self-reports ranked the models
differently from the party running the evaluations. Both are reported on 9.6; the running party is
the one the slide follows.

**Conference slides are wrong often enough to assume it.** Of four photographed slide sets
received between deck v5.0 and v5.2, three contained a misattribution that changed what the slide
argued: a Llama finding presented within a Claude talk (2.5.9), a closed model read as open (9.13),
and a 2025 result credited to the wrong system (1.4e). Verify attribution before anything else.

**A talk is a pointer to sources, not a source.** Where material arrives as photographs of a
presentation, identify the paper behind every finding and verify against it before drafting. Record
which model and which lab each finding is about — a talk by one lab may present another lab's work on
another lab's model, as Chapter 2.5's adder slide did. Findings with no matchable document stay at a
lower tier, labelled as the presenter's illustration.

**A benchmark scored against another model's output is not scored against ground truth.** Say so
wherever it applies. Agreement with a reference model inherits that model's errors and quietly favours
models in the same family.

---

## 17. Verification standard

Promoted from practice, because it repeatedly caught real errors.

- A precise-looking figure with no findable source is worse than no figure. Prefer vaguer and right.
  Chapter 4's clarification percentages were removed for exactly this reason.
- Remove rather than caveat where a specific, checkable claim cannot be verified — vendor names for a
  service, a price, a lead time. Three such claims were dropped rather than hedged.
- Distinguish "not published" from "not found." Anthropic does not publish message counts; saying so
  is more useful than repeating an estimate as fact.
- Watch for figures that were right about a different thing. The 36–52 week GPU lead time was correct
  for current-generation hardware in 2025 and wrong as a general claim in 2026.
- Check whether a figure supports the argument it is attached to. The open-weight capability gap was
  not merely stale; being stale changed what the chapter could conclude.

**Check that a comparison's instrument did not change between the two points.** Where a measure has
been revised, the revision usually moves the number more than the thing measured did. Chapter 9's 9.7
reports a year-on-year delta only on the one benchmark whose question set, grader and scale were
unchanged, and states explicitly that the headline index cannot be compared across the year.

**Check what a source is evidence *for*, not only whether it is accurate.** See §18.

---

## 18. Correction protocol

Log every correction as **old value → new value → why**. Never silently overwrite.

Classify: **refinement** (the number moved) or **argument-affecting** (what the slide concludes
changes).

An argument-affecting correction that undercuts the material's own claim gets its own slide, not a
footnote. Chapter 6's 6.9 exists because the deck's strongest anti-self-hosting argument weakened and
the honest response was to show the reader the change.

Corrections to built material are listed in the chapter's draft file and carried into the outline's
revision log on regeneration. **Where no draft file exists** (§4), they go straight into the revision
log, with the process deviation logged beside them.

**Third class, added at v5.1 — misattributed evidence.** A source can be accurate in every figure and
still not be evidence for the claim it was offered to support. Chapter 9's 9.13 is the worked case: a
chart was supplied as a comparison of an open model against a closed one, and both models turned out
to be closed. Nothing on the chart was wrong. What was wrong was what it demonstrated.

Handle it as argument-affecting, and prefer repurposing to discarding — the 9.13 figures are a strong
illustration of right-sizing, which is what the slide now argues. Log it as: *offered as evidence for
X · is evidence for Y · why the reading was wrong*. The correction belongs on the slide in the body,
not in Go deeper, because a reader who already holds the misconception is the one who needs it.

---

## 19. Pre-delivery checklist

- [ ] Every slide readable with no narration, and gettable in ten seconds from title plus band
- [ ] One idea per slide
- [ ] Every term of art glossed on the slide where it first appears
- [ ] Palette limited to §6; max two semantic colours; every one legended
- [ ] Coloured distinctions survive greyscale
- [ ] Every SVG has `role="img"` and a descriptive `aria-label` — the outline reads it
- [ ] No label collisions on thin bands; geometry computed, not eyeballed
- [ ] Every external fact has a source, a date and a tier
- [ ] A reading-level caveat is in the body, not in Go deeper
- [ ] No rating, price target or recommendation reproduced from any source
- [ ] Any ranked list of models or vendors flagged as analysis on the slide
- [ ] Companies page disclaimer present; unverified tickers declared
- [ ] Chapter glossary matches the terms the chapter actually owns
- [ ] Cross-references point at correct chapter-relative numbers
- [ ] Permanent IDs unchanged from the prior version; register updated; next free ID recorded
- [ ] "Slide" not "card" anywhere except a graphics card, a rate card or a model card
- [ ] `promptFor()` names the right chapter — cloned shells carry the old number
- [ ] End panel points onward and does not read as a conclusion
- [ ] Previous chapter's end panel updated to link here
- [ ] `index.html` updated: link, status, slide count, time
- [ ] Version stamped in all four places (§3), **in every reader, not only the new one**, including
      the notes-block header — and each reader opened is swept for *card*, `promptFor()` and its
      end panel in the same pass
- [ ] Every end panel links onward to a chapter that exists; none says a built chapter is unbuilt;
      none carries a maintainer tool
- [ ] Every end panel that mentions a chapter just built has been updated, not only the preceding one
- [ ] AI-BRIEFING chapter count updated in both the outline and §9 of the companion guide
- [ ] JavaScript syntax-checked; no browser storage; no network calls
- [ ] Opens from a local file path, offline
- [ ] Outline regenerated from the readers
- [ ] README chapter table and known-issues list updated
- [ ] Contents panel present, opens, and every entry lands on its slide — test one click per reader
- [ ] Chapter number is an integer; a companion is declared in all three places (§11)
- [ ] Any embedded photograph meets every condition of the §6 exception, and is logged

---

## 20. Open decisions

**Decided by the maintainer at deck v5.3:**

| Item | Decision |
|---|---|
| Chapters over the 30-minute ceiling (3, 5, 7, 9, 10) | Accepted. §11 now treats 30 minutes as a target |
| Chapter 6 | On hold — not ready. Takes `S-087` onward whenever it resumes; Chapters 5 and 8 end panels to be updated then |
| Chapter 2.5's embedded photographs | Confirmed. §6 exception stands |
| Distribution and IP — Chapter 8's licensed source, Chapter 2.5's photographs | Accepted as is. No change to the current position |
| The dated frontier table (1.5) in Chapter 1 | Stays |

**Still open:**

1. **Change management** — parked, not dropped. Slides 1.6, 5.11, 6.8 and 8.9 each assert that
   organisational absorption is the binding constraint and none develops it. Source material received
   at deck v5.1 is held. A chapter, or an explicit scoping statement.
2. **Primary-source pass on Chapter 3** before anything from it is quoted externally. Vera Rubin
   figures received at deck v5.1 are held for it and need checking against NVIDIA's documentation.
3. **Two documentation checks in Chapter 7** — the scope of the May 2026 limit doubling, and the
   Enterprise Analytics API specifics.
4. **Chapter 9 draft file** — none exists; generate retroactively for the record, or accept the deviation.
5. **Legacy PowerPoint (Appendix A)** — rebuild, or retire.
6. **Drafting files** — archive or delete the per-chapter `-cards-draft.md` files once built.
7. **Maintainer-only files in the repository** — subfolder separation or exclusion.
8. **Re-verification cadence for Chapter 9** — its scoreboards and prices decay fastest.

*Closed since 5.4:* sizing, Chapter 2.5 photographs, distribution position, the 1.5 frontier table —
by maintainer decision. Chapter 6 moved to on hold.

---

## 21. Appendix A — Legacy PowerPoint specification

Retained for the five decks built before the reader format, and for any future `.pptx` export. **Not
the current deliverable.**

Base template `DUMAC_Direct_Template.pptx`. Slide size 13.333 × 7.5 in. Calibri set explicitly on
every run — never rely on theme inheritance. Title box left 0.99 in, top 0.81 in, 14 pt bold
`002060`. Usable band x 0.99–12.34 in, y 1.30–6.80 in. Source line ~y 6.45 in. Nothing below
y 6.85 in. Footer `S-034 · 3.2 · chapter name`, 10 pt `595959`. Nothing below 10 pt or above 14 pt.
Native shapes only — no SmartArt, no images.

Superseded decks: `AI_Evolution_Timeline.pptx`, `AI_2026_Developments.pptx`,
`How_Neural_Networks_Work.pptx`, `Words_to_Answer_LLM.pptx`, `AI_Hardware_and_CUDA.pptx`. All predate
the current structure, numbering and corrections. Content is superseded by the readers.
