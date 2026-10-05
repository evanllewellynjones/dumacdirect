# Chapter 6 — Where the model runs: deployment choices

**DRAFT for approval.** Nothing built. Source slides 21, 22, 23, 24, 25.

**The question this chapter answers:** on-premises or hosted — and why do the best-resourced
firms in the world mostly rent?

10 slides, roughly 26 minutes. Slide 6.9 is **new content** and needs approving as content —
it carries a correction that weakens the chapter's own strongest argument, which is exactly
why it should be on a slide rather than buried in a caveat.

Verified by search 30 Aug 2026. **Five corrections** at the end. Two are argument-affecting.

---

## Slide 1 — S-021a · 6.1 — A model is just a file

**diagram:** Two panels. Left, "On disk" — a file with a size label. Right, "In GPU memory" —
the same file expanded across a rack of accelerators. Between them, the arithmetic that
converts one into the other.

- A trained model is its **weights**: a file of numbers (2.8). Downloading a model means
  downloading that file. "Open weights" means the lab published it — usually on Hugging Face.
- **Size math: file ≈ parameters × bytes per parameter.** At FP16 that is 2 bytes: 7B ≈ 14 GB,
  70B ≈ 140 GB. At 4-bit it is roughly 0.5 bytes: 7B ≈ 4 GB, 70B ≈ 35–40 GB.
- Small models (1–8B) are small files — download *and* run on a laptop. No contradiction.
- **Kimi K3** is the far end: **2.8 trillion parameters**, released with open weights in July
  2026 — a download in the terabytes.
- **Downloading is not running.** The file is public. Loading it needs that much *GPU* memory,
  which for a model of that size means a multi-node cluster. "Open" means access to the file,
  not that it fits your machine.

**depth:** The mixture-of-experts architecture is what makes the largest open models tractable
at all, and it splits the problem in a way worth understanding. A MoE model routes each token
through only a fraction of its parameters — so it *computes* like a much smaller model while
still having to *hold* all of them in memory. GLM-5.2, for instance, is 744 billion parameters
total with roughly 40 billion active per token.

That asymmetry is the whole on-premises problem in miniature. Compute cost scales with the
active parameters; memory cost scales with the total. You can afford to run these models. What
you may not be able to afford is somewhere to put them.

**sources / caveats:** Kimi K3 parameter count and July 2026 open-weights release: Moonshot
announcements via multiple trackers, Jul 2026. GLM-5.2 architecture (744B total / 40B active,
MIT licence, 1M context) via coding-model comparisons, Jul 2026 — secondary. Size arithmetic
is arithmetic.

---

## Slide 2 — S-022a · 6.2 — Right-size it, quantize it, then see what it needs

**diagram:** A hardware ladder — model size against what it takes to serve it — from a single
consumer card up to a multi-node cluster, with the 4-bit column beside the FP16 column so the
saving is visible.

- **"Too big" usually points at the wrong thing.** Disk footprint is trivial. The constraint is
  **GPU memory** — enough to hold the weights *and* the KV cache (2.7, 3.1).
- **Inference is far lighter than training.** You do not need a training supercomputer to serve
  a model. That confusion sinks a lot of internal proposals before they start.
- **Two levers: right-size and quantize.** A well-chosen 8B model that fits on one card beats a
  70B model that does not fit at all.
- **The tiers, 2026:** 7–8B on a single 24 GB card. 13–34B on one 48–80 GB card. 70B on 2–4
  H100s, or one H200, or roughly 35–40 GB at 4-bit on a 48 GB card. Frontier open weights —
  Kimi K3 class — on a multi-node cluster.

**band:** The question is never "can we run a model." It is "which model, at what precision,
and does the answer still do the job."

**depth:** Note where the tiers put you relative to Chapter 5. A 7–8B model on one card is not
a frontier model and will not behave like one — but 5.13's argument was that specialisation
lives in retrieval, tools and evaluations rather than in raw capability. For a narrow, repeated,
well-specified task, the small local model plus a good retrieval layer is a genuinely
competitive architecture, and it is the one that makes on-premises viable at sane cost.

The trap is assuming you need to self-host the *frontier* to self-host anything.

**sources / caveats:** Hardware tiers as of Aug 2026. GPU configurations and prices move fast
(3.12) — treat the tier boundaries as approximate.

---

## Slide 3 — S-022b · 6.3 — Serving it is a system, not a download

**diagram:** The serving stack — model weights, inference engine, internal API endpoint,
applications — with the operational responsibilities listed alongside as a separate column.

- **vLLM** is the default open serving engine: PagedAttention and continuous batching keep GPU
  utilisation at roughly **85–92%** under load, against 30–40% for naive PyTorch serving. Free,
  with an OpenAI-compatible API.
- **Batching is the single biggest cost lever** in serving. The same GPU costs the same per
  hour whether it serves one request or eight; single-stream inference on an H100 at around
  **$0.73 per million tokens** becomes roughly **$0.18** at batch 8.
- **Quantization compounds it.** FP8 on H100 or H200 adds a further 1.5–1.8× throughput.
- Alternatives: **NVIDIA NIM** for support and an SLA, **TensorRT-LLM** for deeper NVIDIA
  optimisation, **SGLang** as a competitive engine (3.5).
- Applications then point at an internal endpoint, which is the part that looks easy.

**band:** The honest variable nobody publishes is utilisation. Peak throughput figures assume
continuous saturation; real systems run at 40–70%. At 50% utilisation your true cost per token
is double the table value.

**depth:** That utilisation point deserves to be the thing you take from this slide, because it
is where on-premises business cases quietly fail. Every published cost-per-token figure is a
peak number. Your GPUs sit idle overnight, at weekends, and between bursts — and unlike a cloud
bill, an owned GPU costs the same whether it is busy or not.

Run the arithmetic with your real duty cycle rather than the vendor's reference benchmark. A
workload at 40% average utilisation has a real cost per million tokens roughly 2.5× the
headline.

**sources / caveats:** vLLM utilisation figures, batching and FP8 throughput gains, and the
40–70% real-utilisation range: packet.ai LLM inference cost analysis (27 Jul 2026) — secondary,
and the underlying figures are benchmark-dependent. **The NVIDIA NIM price of ~$4,500 per GPU
per year that the earlier draft carried is not verified here and has been removed** — see
correction 4.

---

## Slide 4 — S-023a · 6.4 — What it actually costs to own

**diagram:** A three-year total-cost-of-ownership bar for one 8-GPU server, broken into its
components, with the largest segment labelled — and it is not the hardware.

For one 8×H100 server over three years:

- **Hardware: roughly $350,000–450,000.** A complete 8-GPU DGX-class system is around
  **$250,000–400,000** to buy outright.
- **Staff: roughly $225,000–300,000** — half a full-time infrastructure engineer at a
  fully loaded $75,000–100,000 a year.
- **Power:** about 10 kW continuous. At a US commercial average of $0.12/kWh that is roughly
  $10,500 a year; at Pacific Northwest industrial rates nearer $5,250; at European rates above
  $0.20/kWh, closer to $17,900. **Cooling adds 25–40% on top.**
- Total lands in the **$700,000–950,000** range over three years, consistent with the figure
  the deck already carried.

**band:** Staff is the largest line item after hardware, and most teams do not count it at all.
Hardware is the number people compare; the engineer is the number that decides.

**depth:** Two structural points that the headline total obscures.

**One server is not a frontier deployment.** This buys you comfortable capacity for a model up
to roughly 70B. A frontier open-weight model at the Kimi K3 scale needs eight to sixteen such
nodes, which is many millions and a different conversation entirely.

**The break-even depends entirely on utilisation.** The often-quoted rapid payback against
cloud holds only at high sustained load — billions of tokens a month, GPUs genuinely busy. At
modest or spiky usage the GPUs idle and on-premises is *more* expensive than pay-per-token
cloud. On-premises is cheaper only at scale, and "at scale" means duty cycle, not headcount.

And the comparison moved in cloud's favour. **API prices fell roughly 80% between early 2025
and early 2026**, and open-weight model APIs pushed the floor to around **$0.07–0.14 per
million input tokens**. A break-even calculated in 2024 is not valid now.

**sources / caveats:** TCO breakdown, staff-cost dominance and power figures: Spheron on-premise
versus cloud analysis (13 Apr 2026) — secondary, US commercial rates. DGX system pricing:
Runpod H100 guide (Aug 2026) — secondary. API price decline and open-weight floor: packet.ai
(27 Jul 2026) — secondary. All are practitioner estimates; the direction is consistent across
sources, the specific figures are not audited.

---

## Slide 5 — S-023b · 6.5 — Why most organisations still don't

**diagram:** Six objections as a checklist, each with a one-line consequence. Cost is
deliberately absent — it was 6.4, and it is not the deciding factor.

- **Operational burden.** GPU operations, serving tuning, quantization, model upgrades,
  monitoring, security patching, driver and CUDA maintenance, hardware failures. An MLOps
  function most organisations do not have and cannot quickly hire.
- **No elasticity.** A fixed ceiling. You size for peak and waste it, or size for average and
  get throttled. Cloud scales to zero and to peak.
- **Obsolescence.** GPUs depreciate fast, and the next efficient model may need more memory
  than you bought.
- **Facilities.** Tens of kilowatts, power and cooling, rack space, physical security. Many
  offices simply cannot host it; colocation adds cost and complexity.
- **Time to value and breadth.** A cloud API integrates in an afternoon and offers many models
  through one endpoint. On-premises is weeks to months to first token, and every model is a
  separate deployment.
- **Security cuts both ways.** It keeps data in, and it makes you responsible for securing the
  whole stack. A large cloud provider may well have a stronger posture than a small self-run
  cluster.

**depth:** Procurement deserves a note of its own, because the position has changed and the
change runs against what the deck previously said.

Through 2025 the binding constraint was lead time — data-centre GPUs were quoted at 36–52
weeks, and you could not buy a cluster in any useful timeframe. As of April 2026, **previous-
generation hardware is available in weeks**: H100 SXM in roughly 2–6 weeks, H200 in 4–8. What
remains allocated is the *current* generation — B200 largely spoken for on pre-orders, Rubin
constrained (3.3).

So procurement is no longer the barrier to self-hosting a 70B model. It is still the barrier to
self-hosting at the frontier. Those are different claims, and the earlier draft ran them
together.

**sources / caveats:** Lead-time figures: Spheron (13 Apr 2026) — secondary. **This supersedes
the 36–52 week figure carried from Chapter 3's 2025 sources** for previous-generation hardware;
see correction 2.

---

## Slide 6 — S-024a · 6.6 — It is a spectrum, not a binary

**diagram:** A left-to-right spectrum with one axis: *data leaves your boundary* → *data stays
in it*. Four stops, each annotated with what it gives up and what it keeps. A bracket around
the middle two marked "where enterprises actually are."

- **Public API** — data goes to the vendor endpoint, under contractual zero-retention terms.
- **In your own cloud** — Claude via Amazon Bedrock or Google Vertex, GPT via Azure OpenAI. The
  model runs inside your own tenancy and region, with no training on your data.
- **Dedicated or managed** — provisioned capacity, or vendor-run secure infrastructure.
- **On-premises open weights** — self-hosted. The far end.

**band:** By the second or third tier a firm already has data control that satisfies regulators
and model-risk teams — data inside its boundary, contractually untrained-on — **without owning
GPUs or accepting a weaker model.**

**depth:** This is the slide that explains why the on-premises conversation is so often
misframed. The question in the room is usually "can we let this data leave?" — and the answer
is that it does not have to, at any tier above the first.

That combination is exactly why the frontier labs can win the most regulated, most
security-conscious clients. The middle of the spectrum removes the main reason to go to the far
end of it.

One thing to watch as you go right: you gain control and give up breadth. A public API gives
you every model the vendor offers, immediately. In-cloud gives you the ones that vendor has
provisioned in your region. On-premises gives you exactly what you deployed, until you deploy
something else.

**sources / caveats:** Deployment tiers are current as of Aug 2026. Specific service names and
availability by region change — verify before relying on any one route.

---

## Slide 7 — S-025a · 6.7 — What the best-resourced institutions actually did

**diagram:** The JPMorgan deployment as a set of stat callouts, with the architectural choice
drawn beneath: bank-built portal on top, rented models underneath.

- **JPMorgan's LLM Suite** is a bank-built portal that taps models from **OpenAI and
  Anthropic**, refreshed roughly every **eight weeks**.
- **250,000 employees** have access; about **half use it daily**.
- **450+ AI use cases** in production, with a stated plan to reach **1,000**, under a reported
  **$1.8 billion** AI investment programme.
- Claude is in production across the sector — JPMorgan, Goldman Sachs, Citi, AIG, Visa — and
  Anthropic has pushed further into financial services through 2026.

**band:** The richest, best-staffed institutions in the world chose to **build the portal and
rent the models**. They built the part that was theirs and rented the part that was not.

**depth:** The architecture is the lesson, not the vendor choice. JPMorgan built the
integration layer — entitlements, retrieval over internal data, routing between providers by
task, logging, compliance controls — and treated the model itself as a component to be swapped
every eight weeks.

That is the same shape as 4.2 and 5.9, one level up: the durable asset is the system around the
model, and the model is the part you deliberately do not commit to.

Note the routing detail, because it is a practical pattern anyone can copy. A single internal
endpoint fronting multiple providers means teams do not each negotiate a contract, and the bank
can move work between models on cost or accuracy without touching the applications.

**sources / caveats:** The 250,000-employees, eight-week-refresh, half-use-daily and value-gap
details trace to a CNBC interview with chief analytics officer Derek Waldron, reported
Sept–Oct 2025 and widely syndicated — **that is now roughly a year old**. The 450→1,000 use
cases and $1.8bn programme figures come from secondary aggregation (Apr 2026). Anthropic's
financial-services push: Fortune, 5 May 2026. Verify the headline numbers before quoting them
externally.

---

## Slide 8 — S-025b · 6.8 — Why money and talent do not change the answer

**diagram:** Two columns — "What money and talent remove" against "What they do not" — with
the second column drawn as the deciding one.

Spending removes the cost and operations objections from 6.4 and 6.5. It does not remove these:

- **Private deployments already solve data control.** In-cloud or VPC deployment, no-retention
  and no-training contracts, and compliance certifications amount to sovereignty in practice —
  without GPUs and without accepting a weaker model (6.6).
- **Inference infrastructure is not a bank's edge.** Self-hosting is undifferentiated heavy
  lifting. The real bottleneck is integration and adoption — JPMorgan's "**value gap**", the
  work of stitching thousands of applications into something coherent. Scarce engineers belong
  on that.
- **Pace.** The frontier moves every few weeks. Buying as a service means always-current with
  no re-capitalisation; self-hosting freezes you at the model you deployed.
- **Risk transfer.** Banks want SLAs, IP indemnity, safety tuning, attestations and model
  documentation for model-risk governance under SR 11-7. A self-hosted open model means the
  institution owns all model risk with no backstop.

**Honest nuance — they do both.** Banks self-host open models selectively for internal document
search, code on proprietary repositories, and PII-heavy batch work, where "good enough, cheap
and entirely internal" wins. The hardest work routes to frontier providers.

**depth:** Of the four, the one that has genuinely held is **risk transfer**. It is the least
technical and the least discussed, and it is close to decisive in a regulated institution. A
model-risk committee asking "who is accountable if this is wrong" gets a different answer from
a vendor with an indemnity than from an internal team that downloaded a weight file.

The pace argument has also strengthened rather than weakened: at an eight-week refresh cadence,
a self-hosted deployment is a snapshot that ages visibly.

The one that has weakened is the capability gap — which is the next slide, and which the
earlier version of this material got wrong.

**sources / caveats:** SR 11-7 is the US Federal Reserve and OCC supervisory guidance on model
risk management. The "value gap" phrasing is Derek Waldron's, via CNBC (2025). The selective
self-hosting nuance is drawn from enterprise deployment comparisons through 2026 — secondary.

---

## Slide 9 — [ID-TBD] · 6.9 — The gap that was unbuyable is closing

**NEW CONTENT — approve as content. This carries the chapter's most important correction.**

**diagram:** A narrowing-gap timeline. Two lines — closed frontier and best open weights — with
the measured lag between them shrinking across 2025 into 2026, and a note on where the gap
persists.

The earlier version of this material said open weights trail the closed frontier by **6–18
months**, and built the argument on that. The measured gap is now much narrower.

- **Three to five months**, on one widely cited analysis, down from a debated six to nine.
- The **UK AI Security Institute**, publishing its first analysis of the open-weight cyber gap,
  found recent open models performing similarly to closed frontier models released **4 to 7
  months earlier** — narrower than the 6 to 10 months it measured through most of 2025.
- **Kimi K3** ranked third on one composite intelligence index at release, behind only Claude
  Fable 5 and GPT-5.6 — with open weights.
- **Open weights are no longer only a Chinese story.** Thinking Machines shipped Inkling — 975B
  total, 41B active — under Apache 2.0 with weights available at launch.

**Where the gap persists**, and this is the part that matters:

- **Long-horizon agentic work.** The same UK AISI analysis found the gap *larger* on cyber
  ranges requiring capabilities to be chained across a full operation than on narrow tasks.
- **Benchmarks are not the job.** One analyst house notes that its own composite ranks an open
  model above a closed one, and that its people still prefer the closed model for daily work —
  partly productisation, partly that benchmarks are an imperfect proxy and are hill-climbed.

**band:** The capability argument against self-hosting has weakened materially and has not
disappeared. It now rests on long-horizon reliability rather than on raw capability — which is
a narrower claim, and one that will need re-checking every few months.

**depth:** For anyone modelling this sector, the compression is the finding, and its second
derivative is the interesting part: the closing time appears to be roughly halving with each
model generation.

What follows if it continues. The three durable objections on 6.8 — data control, risk transfer,
and infrastructure not being your edge — do not depend on capability at all, so they survive.
But the fourth argument, "you cannot buy frontier quality in open weights," has a visible
expiry date on it. An institution making a five-year infrastructure decision on the strength of
a capability gap is betting on something that has halved twice already.

The counter-argument worth holding: a narrowing benchmark gap and a narrowing *usable* gap are
not the same thing, and the divergence between them — open models scoring well while
practitioners still reach for closed ones — is itself the evidence that raw capability was never
the whole story.

**sources / caveats:** The 3–5 month estimate is Nathan Lambert's, on Interconnects (20 Jul
2026) — an informed analyst estimate, not a measurement. The UK AISI figures (4–7 months, versus
6–10 through 2025) are from a government institute analysis reported via Import AI (21 Jul
2026) — **secondary reporting of a primary source I have not read directly; worth retrieving**.
Kimi K3's index position and the Inkling specifications come from July 2026 trade coverage.
The benchmarks-versus-real-work caveat is SemiAnalysis, Aug 2026. **All of this is one to two
months old and moving fast.**

---

## Slide 10 — S-023c · 6.10 — Who on-premises actually fits

**diagram:** A four-condition checklist, with the honest note that all four have to be true
together.

On-premises fits an organisation that is **all four** of these at once:

- **Regulated and privacy-critical**, in a way that the middle of the spectrum does not already
  satisfy (6.6) — which is a higher bar than most assume.
- **High and predictable sustained volume** — enough duty cycle to beat pay-per-token, which is
  a harder test now that API prices have fallen 80% (6.4).
- **Able to staff it** — the MLOps function of 6.5, permanently, not as a project.
- **Content with a model a few months behind the frontier** — a materially easier condition
  than it was a year ago (6.9).

**band:** A real and growing segment, not a universal direction. The failure mode is an
organisation that meets one of the four conditions and decides it meets all of them.

**depth:** Note how the four conditions have moved against each other. Two got easier: the
capability gap narrowed, and previous-generation hardware became procurable in weeks. Two got
harder: cloud pricing fell sharply, and the staffing requirement did not go away.

The net is that the *case* for on-premises is stronger technically and weaker economically than
it was a year ago — which is why the honest answer to "should we self-host" is still "probably
not, and here is the specific test," rather than either enthusiasm or dismissal.

The version of this that most often makes sense in practice is not the one people argue about:
a small, well-chosen open model, self-hosted for one narrow high-volume internal workload,
alongside frontier API access for everything else. That is the both-and pattern from 6.8, and
it requires believing neither that self-hosting is the future nor that it is a mistake.

**sources / caveats:** Analysis, following from the sourced material on 6.4, 6.5 and 6.9.

---

## Chapter apparatus

**Glossary owned:** open weights · mixture of experts (MoE) · active parameters · serving
engine · vLLM · PagedAttention · continuous batching · utilisation / duty cycle · cost per
million tokens · total cost of ownership · colocation · elasticity · zero-retention ·
tenancy · SR 11-7 · model-risk governance · value gap

**Carried forward:** quantization and VRAM (3.1) · KV cache (2.7) · Kimi K3 and open weights
(1.5) · release cadence (1.5) · GPU supply (3.3, 3.12) · fine-tuning economics (5.10) ·
specialisation up the stack (5.12)

**Organisations:** NVIDIA · Moonshot AI · Z.ai · Thinking Machines · Hugging Face · Amazon
(Bedrock) · Google (Vertex) · Microsoft (Azure OpenAI) · OpenAI · Anthropic · JPMorgan Chase ·
Goldman Sachs · Citi · AIG · Visa · UK AI Security Institute. Sixteen — **separate companies
page**, grouped as model providers / infrastructure / adopters / analysts.

---

## Corrections to built material (§16, §17)

**1. The open-to-closed capability gap — argument-affecting, and it weakens our own argument.**
Old: outline slides 23 and 25 state open weights "typically trail the closed frontier ~6–18
months," and slide 25 calls the capability gap "unbuyable."
New: the measured gap is roughly **3–5 months** on one analyst estimate, and the UK AI Security
Institute measured recent open models matching closed models released **4–7 months earlier**,
narrower than the 6–10 months it measured through 2025.
Why it matters: this is the *first* of the three arguments the deck says decide the question.
It has not vanished — it now rests on long-horizon agentic reliability rather than raw
capability — but stating 6–18 months as current is wrong and overstates the case against
self-hosting. New slide 6.9.

**2. GPU lead times — argument-affecting.**
Old: "GPU lead times are 36–52 weeks in 2026 — you can't buy a cluster next month."
New: as of April 2026, **previous-generation** hardware ships in weeks — H100 SXM in roughly
2–6, H200 in 4–8. The current generation remains allocated (B200 largely pre-sold, Rubin
constrained, 3.3).
Why: the deck's claim came from 2025 sources about current-generation data-centre GPUs and was
carried forward without re-checking. Procurement is no longer a barrier to self-hosting a 70B
model; it remains one at the frontier.

**3. Cost of ownership — refinement, and a better fact.**
The deck's $712K–948K over three years for one 8-GPU server is consistent with current
build-ups. What it omits is the composition: **staff is the second-largest line item at
$225,000–300,000 over three years and is routinely uncounted**, against $350,000–450,000 for
hardware. That is the more useful fact than the total.

**4. NVIDIA NIM pricing — removed pending verification.**
The deck states NIM at "$4,500/GPU/yr." Not verified in this pass; removed from the draft
rather than caveated.

**5. Additions the July 2026 draft did not have.**
API prices fell roughly 80% between early 2025 and early 2026, with open-weight APIs pushing
the floor to $0.07–0.14 per million input tokens — which moves the on-premises break-even
against self-hosting. The 40–70% real-utilisation range, and the point that every published
cost-per-token figure is a peak number. JPMorgan's deployment scale: 250,000 employees, about
half daily, 450+ use cases toward 1,000, a reported $1.8bn programme. And open weights are no
longer a purely Chinese story — Thinking Machines' Inkling shipped under Apache 2.0 at
frontier-adjacent scale.

---

## Open questions for you

1. **6.9 is new content**, and it corrects the chapter's own strongest claim. Approve as
   content.
2. **The UK AISI figures should be retrieved from the primary source** before this goes
   external. I have them via secondary reporting.
3. **The JPMorgan numbers are about a year old** — the CNBC interview is Sept–Oct 2025. They
   are the most-quoted evidence in the chapter and the most likely to have moved.
4. **Separate companies page** for this chapter, sixteen organisations. Confirm the grouping.
5. **One permanent ID needed** for 6.9, plus confirmation that S-021 through S-025 are free.
