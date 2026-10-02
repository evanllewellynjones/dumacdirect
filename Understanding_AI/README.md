# Understanding AI

A self-paced reference on artificial intelligence written for investment professionals — numerate, fluent in financial, industrial and supply-chain concepts, no machine-learning background assumed.

**Version v5.3 · 2 Oct 2026**

> Descriptive material on industry structure. **Not investment advice and not a view on any security.** Figures were gathered July to October 2026 unless a slide says otherwise.

---

## Start here

Open **`index.html`** in a browser. That is the chapter menu and the entry point.

Everything is self-contained: no external fonts, no CDN, no network calls, no browser storage. The files open from a local path on Windows in Edge or Chrome and work offline and behind a firewall.

Clone or download the whole folder. Inter-chapter links are relative — move one file on its own and the link breaks.

```
git clone <repo-url>
cd <repo>
start index.html          # Windows
```

---

## Chapters

| Ch | Title | Slides | Time | Status |
|----|-------|--------|------|--------|
| 1 | How AI got here, and where it stands | 13 | ~30 min | Ready |
| 2 | Inside the model: how it actually works | 10 | ~24 min | Ready |
| 3 | The hardware and the supply chain | 12 | ~32 min | Ready |
| 4 | Building reliably with an unreliable model | 11 | ~28 min | Ready |
| 5 | Customizing a model | 13 | ~32 min | Ready |
| 6 | Where the model runs: deployment choices | 10 | ~26 min | In development |
| 7 | What it costs, and what drives the cost | 13 | ~33 min | Ready |
| 8 | Mapping AI capex | 10 | ~28 min | Ready |
| 9 | Measuring competency: what the scores mean and how far they moved | 14 | ~36 min | Ready |
| 10 | Reading the model from the inside — *companion to Chapter 2* | 13 | ~34 min | Ready |

Chapters are added as the subject moves. The set is open-ended, the numbering is for convenience rather than sequence, and no chapter is the last one. The early chapters build on each other — read them in order the first time; after that they stand alone as reference. **Chapter 10 is a companion to Chapter 2** and is best read straight after it; it is numbered by when it was written, not where it sits.

Each chapter ends with a glossary page and a companies page. Both are excluded from the slide count. Chapter 9 also carries a **Check yourself** page — eight questions with answers in the Go deeper block.

Chapters 9 and 10 run to ~36 and ~34 minutes, over the 30-minute target. Chapter 10 splits at 10.6.

Chapter 9 runs to ~36 minutes, over the 30-minute target. It splits cleanly at 9.10 into competency (9.1–9.10) and the cost of the capability gap (9.11–9.14), and that split is an open decision.

---

## How to read it

- **Ten seconds per slide** gets you the point from the title plus the takeaway band.
- **Three minutes** gets you the whole slide.
- **Go deeper** blocks carry the argument, the caveats and the read-across. Opening them is optional.
- **Contents:** every chapter has a collapsible two-column list of its slides under the header. Click any title to jump to it; the current slide is highlighted and visited ones are ticked.
- Navigation: arrow keys, space, `Home`, `End`, or click the dots. Square dots are apparatus pages (glossary, companies, check yourself, what's next); round dots are content slides.

### Asking questions

Every content slide has an ask box. It copies a prompt tagged with the slide's permanent ID and title, ready to paste into an AI assistant. A **copy-all** button emits the whole notes block at the end of a chapter.

**Question capture is session-only and held in memory.** Nothing is written to disk or to browser storage. Copy your notes out before you leave a chapter or close the tab.

To give the assistant the full context, upload `understanding-ai-outline.md` alongside your questions. The AI-BRIEFING block at the top of that file tells the assistant how to behave.

Tag your questions so they are useful later:

| Tag | Meaning |
|-----|---------|
| `[personal]` | The material covers it; the gap was mine |
| `[gap]` | The material does not cover it |
| `[correction]` | Something is wrong, stale or contradicted |

Send `[gap]` and `[correction]` items back to the maintainer. A gap two readers hit independently is a defect in the material and gets a slide. Eleven of the current slides exist because a reader asked — this loop is the single most productive input the project has. Chapter 9 exists in its entirety because of it.

---

## Files

| File | Role | Audience |
|------|------|----------|
| `index.html` | Chapter menu and entry point | Readers |
| `understanding-ai-ch[n]-reader.html` | One chapter each | Readers |
| `README.md` | This file | Everyone |
| `understanding-ai-outline.md` | Full content source of truth, generated from the readers. Carries the AI-BRIEFING block | Readers — upload this to an assistant |
| `understanding-ai-companion.md` | Reader-facing guide to using the material | Readers |
| `understanding-ai-INSTRUCTIONS.md` | Maintainer note: style, process, verification and correction protocol | Maintainer only |
| `understanding-ai-ch[n]-cards-draft.md` | Pre-approval working drafts | Maintainer only |
| `understanding-ai-chat-handoff.html` | Session handoff document | Maintainer only |
| `NVDA_Engineer_SAIL_Founder_pod.md` | Interview transcript, source material for Ch 3, 6 and 7 | Maintainer only |

`understanding-ai-outline.md` is **generated** from the built readers and is never hand-edited. Where the outline and a reader disagree, the reader wins.

---

## Sourcing and staleness

Every external fact carries a source, a date and a tier — primary, secondary, analyst estimate, vendor estimate about its own market, or analysis. Where a specific claim could not be verified, it was removed rather than hedged: a precise-looking figure with no findable source is worse than no figure.

**This material decays.** Chapter 9 (benchmarks and model pricing) decays fastest of all — four of the ten models named on slide 9.6 did not exist six months before it was written, and several prices on 9.11 were already weeks old when compiled. Chapters 3 (hardware and supply chain), 6 (deployment) and 7 (pricing) follow. Re-verify anything dated before relying on it externally. Corrections are logged old value → new value → why, and are classified as either a refinement (the number moved) or argument-affecting (what the slide concludes changes).

Permanent slide IDs (`S-001`, `S-002`, …) never change, are never reused, and are never renumbered — including when a slide moves chapters. That is what lets a saved Q&A log from an old version resolve against a new one. Chapter-relative numbers (`3.2`) are human-readable and **do** change between versions.

---

## Contributing

Content changes go through the maintainer workflow in `understanding-ai-INSTRUCTIONS.md`:

1. Draft in Markdown as `understanding-ai-ch[n]-cards-draft.md` — full slide text, graphic spec, sources with tiers, corrections section.
2. Maintainer approves the wording. Never build unapproved text.
3. Build the reader by cloning the most recent reader as a shell and replacing the slide data.
4. Wire it — previous chapter's end panel, `index.html`, version stamps in all four places.
5. Regenerate `understanding-ai-outline.md` from all readers in the same pass.

The pre-delivery checklist is §19 of the instruction note. Run it before any commit that ships a chapter.

---

## Known issues

| # | Issue | Status |
|---|-------|--------|
| 1 | Version stamps disagreed across files; five readers labelled every copied question "Chapter 1"; three chapters ended by saying the next chapter was not built yet, with a maintainer drafting button and no onward link | **Closed at v5.1** — all nine readers restamped, swept and wired. Notes saved before v5.1 from Chapters 3, 4, 5, 7 and 8 carry the wrong chapter label: key on the `S-` slide ID, which is correct |
| 2 | Chapter 6 is listed as in development; its reader does not exist | **On hold** by maintainer decision, v5.3 |
| 3 | The banned term "card" in `index.html` | **Closed** — replaced with "slide" in v4.0 |
| 4 | Maintainer-only files (`understanding-ai-INSTRUCTIONS.md`, `understanding-ai-ch[n]-cards-draft.md`, `understanding-ai-chat-handoff.html`, `NVDA_Engineer_SAIL_Founder_pod.md`) sit alongside distributed files. Subfolder separation or repository exclusion not decided | Open |
| 5 | Chapter 9 was built without the §4 Markdown draft and approval step, at the maintainer's request. No `understanding-ai-ch9-cards-draft.md` exists; its corrections are logged in the outline's revision log instead | Open — generate retroactively or accept the deviation |
| 6 | The *Check yourself* page in Chapter 9 was an apparatus type §5 did not describe | **Closed** — admitted to §5 in instruction note 5.2 |
| 7 | Chapter 9 runs ~36 min, over the §11 ceiling | **Accepted** by maintainer, v5.3 |
| 8 | Chapter 10 runs ~34 min, over the §11 ceiling | **Accepted** by maintainer, v5.3 |
| 9 | Chapter 10 embeds six photographs of a third party's presentation slides — a deliberate exception to the instruction note's no-photographs rule, made at the maintainer's request. It raises the file to ~515 KB and is a distribution question alongside Chapter 8 | **Confirmed** by maintainer, v5.3; distribution position accepted as is |
| 10 | Chapter 7 runs ~33 min after three slides were added at v5.1 | **Accepted** by maintainer, v5.3 |
| 11 | Chapter 1 reused slide numbers (two slides numbered 1.3, three numbered 1.4, two numbered 1.5) | **Closed at v5.2** — suffixed 1.3b, 1.4b, 1.4c, 1.5c; no outside cross-reference affected |
| 12 | v5.1's sweep claimed no reader-facing "card" remained; twenty instances had been missed, including the ask-box heading in Chapters 1 and 2 | **Closed at v5.2** |
| 13 | No way to jump to a specific slide except clicking unlabelled dots | **Closed at v5.3** — two-column Contents panel in every chapter |

---

## Licensing and distribution

**No open-source licence is attached, and this repository should be private.**

Chapter 8 is derived from a sell-side research note licensed to a named individual. The value chain and constraint taxonomy were carried across; no rating, price target, upside percentage or model portfolio was reproduced. Chapter 10 reproduces six photographs of slides from a third party's conference talk. Neither has been cleared for redistribution, and the distribution question is an open decision in the instruction note.

Do not make this repository public, and do not add a permissive licence file, until that is resolved.
