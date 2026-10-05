# Understanding AI — Companion Guide

**How to use this material.**
Version 2.0 · 30 Aug 2026 · matches deck version v3.0

---

## 1. What you have

| File | What it's for |
|---|---|
| `index.html` | **Start here.** The chapter list, and the way into everything else |
| `understanding-ai-ch1-reader.html` … and one per chapter | The material itself, one idea per slide |
| `understanding-ai-outline.md` | The same content as plain text. **This is the file you upload to an AI assistant** — markdown parses cleanly and it carries the briefing block |
| `understanding-ai-companion.md` | This file |

**Keep them in one folder.** The links between chapters are relative; move one file on its own
and it stops finding the others. Move the folder instead.

Nothing calls the internet. The slides, diagrams and sources are all inside the files, so they
work offline and behind a firewall — and they go stale on their own. Anything dated, check
before you rely on it.

> **This replaces the PowerPoint workflow.** Earlier versions of this guide described a
> `Understanding_AI.pptx` handout read alongside an assistant. The readers replace it. The old
> `.pptx` files still exist but are superseded in content.

---

## 2. How to read it

Open `index.html` and pick a chapter.

- **Arrow keys move.** Left and right, or space forward. `Home` and `End` jump to the ends.
- **The dots at the bottom** are every slide in the chapter. They fill in as you go, and you can
  click any of them. Square dots are the reference pages at the end — glossary, companies.
- **"Go deeper"** sits under every slide. Open it when a slide raises a question; skip it
  entirely on a fast pass. It roughly doubles the reading time of a chapter, which is the
  difference between the twenty-minute and the forty-minute version.
- **The sources line** at the foot of each slide tells you how much to trust it. Read it. Some
  slides rest on primary sources and some rest on trade press, and they say which.

**Slides are numbered `chapter.slide`** — 3.2 is the second slide of Chapter 3. Cross-references
use that form throughout, so "see 2.6" means go to Chapter 2, slide 6.

---

## 3. The chapters

| Ch | Subject | Slides | Time |
|---|---|---|---|
| 1 | How AI got here, and where it stands | 11 | ~24 min |
| 2 | Inside the model: how it actually works | 10 | ~24 min |
| 3 | The hardware and the supply chain | 12 | ~32 min |
| 4 | Building reliably with an unreliable model | 11 | ~28 min |
| 5 | Customizing a model | 13 | ~32 min |
| 6 | Where the model runs: deployment choices | — | *in development* |
| 7 | What it costs, and what drives the cost | 10 | ~25 min |
| 8 | Mapping AI capex | 10 | ~28 min |

**Times assume you open "Go deeper" occasionally, not always.**

The early chapters build on each other — 2 assumes 1, 3 assumes 2, 4 assumes 2. After that they
stand alone. **Chapters are added as the subject moves**, so this list grows and the numbering is
for convenience rather than sequence. No chapter is the last one.

Each chapter ends with reference pages: a **glossary** of the terms it owns, in order of first
appearance, with the terms it carries forward from earlier chapters; and a **companies page**
mapping who does what. Both are descriptive. Neither is a view on any security.

---

## 4. Asking questions

**The readers hold the material but not a model.** There is no AI inside these files. For
anything beyond what a slide says, you need an assistant.

**On any slide, use the "Ask about this slide" box.** Type your question, press *Copy question
for Claude*, and paste it into a chat. What gets copied is tagged with the slide ID and title,
so the answer lands against the right place in your notes.

**At the end of a chapter, press "Copy my questions."** You get a markdown block with every
question you asked in that session, formatted with `**A:**` and `**Tag:**` left blank for the
assistant to fill in. Save it as `understanding-ai-QA-ch3-[your initials].md`.

The tags matter:

| Tag | Means |
|---|---|
| `[personal]` | You needed something the material already covers. Yours to keep |
| `[gap]` | The material genuinely doesn't answer it |
| `[correction]` | You found something wrong, stale, or contradicted by a search |

**Send back only `[gap]` and `[correction]` entries.** Those improve the material. A gap two
people hit independently gets its own slide — that's a defect in the deck, not in you. Several
slides in the current version exist only because a reader asked.

**The questions are session-only.** Close the tab and they're gone, so copy them before you
leave a chapter.

---

## 5. Working with an assistant

Upload `understanding-ai-outline.md` — not the HTML, not the PowerPoint. It carries the full
text of every slide plus a briefing block at the top that tells the assistant how to behave:
cite slide numbers, say plainly when it goes beyond the document, search for anything dated,
and keep a question log.

**Claude.** Create a Project, add the `.md` to project knowledge. Every chat in that Project
then has the whole thing available without re-uploading.

**Other assistants.** Create a project or workspace and upload the `.md`. If it doesn't seem to
be following the briefing, paste the block from the top of the file in manually.

**On firm data:** use the sanctioned deployment. Don't paste internal material into a personal
account. Discussing the material itself is public-domain technical content and low-risk — but
the moment you apply it to portfolio or firm specifics, it belongs in the approved tool.

---

## 6. Working modes

Tell it which you want. It won't guess well.

| Mode | Ask for | Good for |
|---|---|---|
| **Tutor** | Walk me through, one slide at a time, stop and check | A dense chapter, first pass |
| **Quiz** | Test me, don't give answers until I try | Retention after reading |
| **Translate** | Explain this at three levels | Deciding how to brief someone else |
| **Apply** | What does this mean for [our situation] | Making it useful rather than interesting |
| **Challenge** | Argue the other side | Slides where the material takes a position |
| **Refresh** | Search and tell me what changed | Anything dated — most of 3, 7 and 8 |
| **Extend** | Draft a new slide in this format | Contributing back (§9) |

---

## 7. Prompt pack

Copy-paste. Replace bracketed parts.

**Getting through a chapter**

```
Walk me through Chapter [3] one slide at a time. After each slide, give me the
two-sentence version, then ask me one question to check I followed it. Wait for
my answer before moving on.
```

```
I've read Chapter [3]. Ask me 5 questions on it, hardest last. Don't give me the
answers until I've attempted each one.
```

```
Explain slide [3.4] three ways: to a summer analyst, to a portfolio manager, and
to someone who already covers semis.
```

**Making it stick**

```
Give me the five things from Chapter [2] I'd be embarrassed not to know in six
months, and drop everything else.
```

```
I'm confusing [training] and [inference]. Take it slower, use a different analogy
from the one in the material, and check my understanding as you go.
```

**Making it useful here**

```
Chapter 3 describes the HBM and CoWoS bottleneck, and Chapter 8 maps the wider
capex chain. Lay out how that constraint propagates — who is gated by whom, and
which links move together. Cite slides. Don't give me a recommendation.
```

```
We're considering [describe a workflow]. Using the ladder on slide 5.1, work out
whether that's a prompting, retrieval, tool-use or fine-tuning problem, and say
what you'd need to know to be sure.
```

```
Using slide 7.6, estimate which of my habits are actually expensive. I mostly
[describe how you use it].
```

**Pressure-testing it**

```
Which claims in this document are most likely to be stale as of today? Search for
each and tell me what moved. Rank by how much the change matters to the argument
the slide is making.
```

```
I disagree with slide [5.12]. Build the strongest case against it, then tell me
honestly which side you find more convincing and why.
```

```
Where does this document oversimplify in a way that could mislead someone making
a decision? Be specific about which slide.
```

---

## 8. Try this — live demonstrations

Several chapters describe behaviour you can trigger in the chat window you're already sitting
in. Fastest way to make the abstract concrete. One or two per chapter, at the end of the reading.

**Chapter 1 — the pace of change**

> Slide 1.1 is a timeline ending in 2026. What would you add or revise as of today, and what on
> it now looks less important than it did?

> Slide 1.5 lists the frontier models as of August 2026. Search — how much of that table is
> still right?

**Chapter 2 — tokens, cutoffs and prediction**

> Tokenize the sentence "The quick brown fox jumps." Show me the tokens and their IDs, then
> explain why the token count isn't the word count. *(Slide 2.4)*

> What is your training cutoff? Name three things you'd expect to be wrong or missing about the
> AI industry specifically. *(Slide 2.9)*

> Complete this: "The capital of France is". Before you answer, give me your five most likely
> next tokens with rough probabilities. *(Slide 2.5)*

**Chapter 3 — sizing the hardware**

> Using the VRAM math on slide 3.1, work out whether a 70B model at 4-bit with a 32K context
> fits on a single 48 GB card. Show every step, then tell me what the math ignores.

> What GPU are you running on right now? *(It doesn't know. That's the lesson — the model is
> separate from the silicon.)*

**Chapter 4 — the reliability problem, live**

> Here's a deliberately ambiguous request: "Pull the numbers for the top accounts last quarter."
> Answer it. — Then: how many valid interpretations did you choose between, and why didn't you
> ask me? *(Slides 4.4 and 4.7)*

> Without using any tool, multiply 8,472,916 × 3,847. Then do it again with a tool. Compare.
> *(Slide 4.1 — interpretative against deterministic)*

> State your interpretation before answering this: "summarise the recent performance." *(Slide
> 4.9 — the habit that costs one sentence)*

**Chapter 5 — customization, applied to you**

> Take a recurring task I do: [describe it]. Draft three example training pairs that would teach
> a model to do it my way. Then tell me whether fine-tuning is actually the right answer, using
> the test on slide 5.2.

> I have [describe a document set]. Using slide 5.3, tell me what would have to happen to those
> documents before retrieval over them would work well.

**Chapter 7 — the meter you can't see**

> Roughly how long is this conversation now in tokens, and what would it have cost on the API at
> the prices on slide 7.2? What would I lose by starting a fresh chat?

**Chapter 8 — the map**

> Using slide 8.1, trace what happens downstream if [pick a constraint from 8.8] tightens. Which
> links move together and which are unaffected?

---

## 9. Contributing back

The material is maintained as a single `.md` so it doesn't fork. To add or correct something,
send a block in this format and it gets merged into the master:

````
## Slide [chapter.slide or "new"] — [Title]
**Graphic idea:** [what would explain this — boxes and arrows, not decoration]

**Bullets:**
- [point]
- [point]

**Sources / caveats:** [source, publication date, as-of date; flag anything
secondary or projected]
````

Prompt to generate one:

```
Draft a new slide for this document on [topic], in the document's exact format.
Follow its house style: plain language, exact numbers, one idea per slide, sources
with dates, no marketing tone. Flag anything you're uncertain about. Output as a
markdown block I can paste.
```

Send the block, not a rewritten file. For corrections to existing slides: quote the current
text, give the replacement, cite the source.

---

## 10. Cautions

- **It will answer past the edge of the document.** The citation rule in the briefing block is
  your guardrail — if a claim has no slide number and no search result behind it, treat it as
  the model's own recall and verify it.

- **The dated material is the risky material.** Chapter 3 (supply chain), Chapter 7 (pricing)
  and Chapter 8 (capex) move fastest. **Every price and limit in Chapter 7 is point-in-time** —
  the list prices were read from Anthropic's own documentation on 30 August 2026, and the usage
  limits come from independent trackers because they aren't published at all. Use Refresh mode
  before relying on any figure externally.

- **Chapter 8 has one source, and it is sell-side.** Every other chapter triangulates. That one
  rests on a single research note whose allocations are that firm's own estimates. No rating or
  price target from it appears in the material, and none should be inferred.

- **Sourcing quality varies deliberately, and each slide says which it is.** Chapter 4's
  research claims are checked against primary papers. Several of Chapter 3's rest on trade press
  reproduced across outlets. That difference is stated on the slides rather than hidden.

- **Long chats get expensive and drift.** Start a fresh chat per chapter. Chapter 7 explains why.

- **You are the reviewer.** The material's own argument — slides 4.4 and 4.9 — is that these
  systems relocate error rather than remove it. That applies to using this material with an AI
  as much as to anything else in it.
