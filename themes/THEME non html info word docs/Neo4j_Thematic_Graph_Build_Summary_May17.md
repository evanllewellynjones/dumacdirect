# Neo4j Thematic Investment Graph

**Structure & Build Summary**

> Database: Neo4j Aura (Free instance, Duke University project)
> Last updated: May 17, 2026

---

## 1. Executive Summary

A thematic investment knowledge graph built in Neo4j Aura, designed to map cause-and-effect relationships between macro themes and specific securities. Replaces a flat tear-sheet workflow with a queryable, traversable structure that captures both winners and losers of a given thesis, supports unlimited theme hierarchy depth, and preserves an audit trail of where conviction values originated. Topical grouping (via a separate Topic node label) keeps editorial themes navigable across structural hierarchies. Lifecycle conventions (Pre-IPO, Delisted-Acquired, Claude-proposed) keep the universe honest as companies enter, exit, or get acquired.

### Final state at a glance

<!-- AUTO-REFRESH CANDIDATE: counts below derived from Neo4j; rerun queries in Appendix A to refresh -->

| Element | Count | Notes |
|---|---|---|
| Companies | 9,921 | Global universe in Bloomberg ticker format; includes 1 Pre-IPO node (QNT), 1 Delisted-Acquired node (ANSS), 2 Claude-proposed nodes (CFLT, IQV) |
| Sectors (GICS) | 11 | Standard GICS taxonomy |
| Sub-industries (GICS) | 161 | Standard GICS taxonomy |
| Countries | 43 | MSCI country classifications |
| Themes | 19 | Across 3 hierarchy levels (5 L1, 11 L2, 3 L3) — Capital Allocator Compounders retired May 17, 2026 |
| Topics | 1 | QUANTUM (umbrella for quantum-related themes) |
| EXPOSED_TO edges | 124 | 115 Tailwind, 9 Headwind |
| CHILD_OF edges | 14 | Theme hierarchy connections |
| RELATES_TO edges | 2 | Non-hierarchical theme links |
| TAGGED_AS edges | 2 | Theme to Topic tags (L1 parents only) |
| UNDER_REVIEW edges | 0 | None currently flagged |
| Security (legacy label) | 0 | All 5 orphans migrated May 17, 2026 — label retained in schema but unused |

---

## 2. Build Sequence

The graph was built in eleven distinct phases. Each phase produced a verifiable state before proceeding.

| Phase | Action | Result |
|---|---|---|
| 1 | Connect to Aura via MCP | Schema inspection confirmed pre-existing Security/Theme structure |
| 2 | Import 9,917-row CSV via Aura Import UI | Company, Sector, SubSector, Country nodes created with structural relationships |
| 3 | Match check (Security to Company) | Identified 38 matches, 5 orphans, ticker collisions across exchanges |
| 4 | Migrate theme exposures | 55 EXPOSED_TO edges moved from Security to Company nodes |
| 5 | Delete matched Security nodes | 5 orphans preserved with `migration_status` flag |
| 6 | Standardize property names | Ticker → ticker, Short Name → shortName, etc. (camelCase) |
| 7 | Refactor themes to hierarchy | Added Level 2 and Level 3 sub-themes with CHILD_OF edges |
| 8 | Add headwind (AI Disruption) theme | 9 explicit Headwind edges, inverse RELATES_TO link to SaaS Durability |
| 9 | Add Quantum Computing Beneficiaries tree | 4 themes (1 L1, 3 L2), 17 Tailwind EXPOSED_TO edges, 1 pre-IPO Company node (QNT) |
| 10 | Introduce Topic / TAGGED_AS infrastructure; add PQC Migration tree | QUANTUM Topic node + TAGGED_AS relationship; PQC Migration theme (1 L1 + 2 L2), 9 Tailwind EXPOSED_TO edges, RELATES_TO link to Cybersecurity Tailwind |
| 11 | Orphan resolution and Capital Allocator retirement | Capital Allocator Compounders L1 theme deleted (redundant with SaaS Durability parent). All 5 Security orphans migrated: FI → FISV US Equity and CSU.TO → CSU CN Equity edges retargeted to canonical nodes; CFLT and IQV created as Claude-proposed Company nodes; ANSS converted to Company node with `listing_status = "Delisted-Acquired"` (acquired by SNPS July 17, 2025). Audit-trail conventions established (`framework_alias`, `migrated_from`, `acquired_by`, `delisting_date`). |

---

## 3. Graph Schema

### 3.1 Node Labels

| Label | Purpose | ID Property | Count |
|---|---|---|---|
| Company | One node per security listing (Bloomberg ticker). Includes Pre-IPO, Delisted-Acquired, and Claude-proposed lifecycle variants. | ticker | 9,921 |
| Sector | GICS sector | name | 11 |
| SubSector | GICS sub-industry | name | 161 |
| Country | MSCI country | name | 43 |
| Theme | Macro forces, moats, sub-tiers | name | 19 |
| Topic | Editorial grouping across themes (e.g., QUANTUM); independent of CHILD_OF hierarchy | name | 1 |
| Security (legacy) | Legacy import label — all instances migrated; label retained in schema but unused | ticker | 0 |

### 3.2 Relationship Types

| Type | From → To | Purpose |
|---|---|---|
| IN_SECTOR | Company → Sector | GICS sector classification |
| IN_SUB_INDUSTRY | Company → SubSector | GICS sub-industry classification |
| IN_COUNTRY | Company → Country | MSCI country classification |
| PART_OF | SubSector → Sector | Sub-industry parent sector |
| EXPOSED_TO | Company → Theme | Decided directional exposure |
| CHILD_OF | Theme → Theme | Theme hierarchy (structural) |
| RELATES_TO | Theme → Theme | Non-hierarchical link (overlap, inverse, etc.) |
| TAGGED_AS | Theme → Topic | Editorial grouping; applied to L1 parent themes only |
| UNDER_REVIEW | Company → Theme | Flagged but not yet decided (user-driven only) |

### 3.3 EXPOSED_TO Edge Properties

Every EXPOSED_TO edge represents a decided, directional exposure. Migration provenance properties (`migrated_from`, `note`) document any edge that has been moved or re-anchored — see [Section 5.10](#510-lifecycle-conventions--acquisitions-ticker-remaps-and-universe-gaps).

| Property | Values | Question it answers |
|---|---|---|
| direction | Tailwind or Headwind (Mixed not permitted) | Which way does the theme affect the company? |
| strength | Core, Significant, Peripheral | How important is the theme to this company's thesis? |
| confidence | High, Medium, Low | How sure am I this specific link is real? |
| mechanism | Free text (1–2 sentences) | Why is this company exposed? |
| source | Free text | What document or analysis grounds this edge? |
| last_updated | Date | When was this edge last reviewed? |
| reviewed | true / false | Has the user confirmed this edge? |
| migrated_from *(optional)* | Free text | If the edge was moved from another node, where did it come from? |
| note *(optional)* | Free text | Edge-level annotation (e.g., "live exposure now via SNPS") |

### 3.4 Topic and TAGGED_AS Infrastructure

Topics provide editorial grouping across themes that may be hierarchically unrelated but topically connected. The convention is to tag only Level 1 parent themes — the variable-depth CHILD_OF traversal then reaches all descendants automatically.

*Canonical topical query pattern:*

```cypher
MATCH (:Topic {name: "QUANTUM"})<-[:TAGGED_AS]-(parent:Theme)<-[:CHILD_OF*0..]-(t:Theme)
OPTIONAL MATCH (t)<-[r:EXPOSED_TO]-(c:Company)
RETURN parent.name, t.name, count(DISTINCT c) AS companies
```

Topic node properties: `name` (string, unique — manual constraint pending), `description` (free text), `created_in_session` (date). TAGGED_AS edge property: `tagged_on` (date).

---

## 4. Theme Hierarchy

Themes are organized into three levels using self-referential CHILD_OF relationships. The variable-depth pattern means queries can traverse any depth with one expression.

### 4.1 SaaS Durability Tree

- **Level 1** — SaaS Durability in AI Era (umbrella thesis, 43 direct edges)
  - **Level 2** — Proprietary Data (6 companies, incl. IQV — Claude-proposed)
  - **Level 2** — Regulated Systems of Record (5 companies)
  - **Level 2** — Two-Sided Networks (3 companies)
  - **Level 2** — Physical-World Software (9 companies)
  - **Level 2** — Mission-Critical Infrastructure (19 companies aggregated)
    - **Level 3** — Existential Infrastructure (9 companies, incl. FISV — migrated from FI)
    - **Level 3** — Operational Infrastructure (6 companies, incl. CFLT — Claude-proposed)
    - **Level 3** — Engineering-Critical Infrastructure (5 companies, incl. ANSS — Delisted-Acquired, preserved for audit)
  - **Level 2** — Cybersecurity Tailwind (cross-cutting, 5 companies)

### 4.2 Quantum Computing Beneficiaries Tree

Level 1 macro theme covering the quantum computing value chain, decomposed into three sub-themes that segment the ecosystem by business model and proximity to commercial revenue. Theme conviction is Medium across the parent and all sub-themes — the underlying force is real, but timing to commercial advantage is 5–15 years and modality winners remain unclear. Tagged via TAGGED_AS to the QUANTUM Topic node.

- **Level 1** — Quantum Computing Beneficiaries (parent, 17 companies aggregated)
  - **Level 2** — Hyperscaler and Strategic Programs (7 companies: IBM, GOOGL, MSFT, AMZN, BABA, INTC, HON)
  - **Level 2** — Pure-Play Platforms (5 companies: QNT, IONQ, RGTI, QBTS, QUBT)
  - **Level 2** — Picks and Shovels (5 companies: KEYS, COHR, FORM, MKSI, NVDA)

**Quantinuum (QNT) handling.** QNT US Equity was added as a Company node despite being pre-IPO, on the basis of a filed registration statement (Morgan Stanley joint lead bookrunner, May 2026). It carries `listing_status = "Pre-IPO"` and `migration_status` flagging it as not yet effective, and intentionally has no IN_SECTOR, IN_SUB_INDUSTRY, or IN_COUNTRY edges — GICS classifications will be added once the company appears in a refreshed universe CSV after pricing.

### 4.3 Post-Quantum Cryptography Migration Tree

*Added May 17, 2026.*

Level 1 theme covering the mandated cryptographic transition driven by NIST FIPS 203/204/205 (Aug 2024) and NSA CNSA 2.0 deadlines (2027 / 2030 / 2035). Distinct from Cybersecurity Tailwind because the driver is regulatory-deadline, not threat-volume — spend is non-discretionary regardless of attack frequency. Theme conviction is High (deadline-driven, not speculation-driven). Tagged via TAGGED_AS to the QUANTUM Topic node; linked via RELATES_TO (kind: "overlapping-but-distinct") to Cybersecurity Tailwind.

- **Level 1** — Post-Quantum Cryptography Migration (parent, 9 companies aggregated, High conviction)
  - **Level 2** — PQC - Identity and Encryption Incumbents (5 companies: IBM, NET, CRWD, PANW, FTNT)
  - **Level 2** — PQC - Compliance and Migration Services (4 companies: BAH, LDOS, CACI, ACN)

> Note: PANW, CRWD, NET, FTNT also sit under Cybersecurity Tailwind — the PQC edges are additive (different mechanism) and intentional, not duplicative. RELATES_TO link documents the overlap.

### 4.4 Standalone Themes (no parent)

- **Level 1** — AI Orchestration Layer Incumbents (Medium conviction, 2 companies)
- **Level 1** — AI Disruption of Horizontal SaaS (High conviction, inverse of SaaS Durability via RELATES_TO, 9 companies)

> *Capital Allocator Compounders was retired on May 17, 2026 as redundant with the SaaS Durability parent. ROP and CSU CN Equity now sit under SaaS Durability directly at Significant strength.*

### 4.5 Topical Groupings

Topics are editorial groupings across themes that may be hierarchically unrelated but topically connected. Currently one topic exists.

| Topic | Tagged L1 Themes | Reach (companies) |
|---|---|---|
| QUANTUM | Quantum Computing Beneficiaries; Post-Quantum Cryptography Migration | 26 unique exposures (17 + 9) |

### 4.6 Headwind Names (AI Disruption of Horizontal SaaS)

| Ticker | Strength | Confidence | Rationale (abbreviated) |
|---|---|---|---|
| HUBS | Core | High | Mid-market CRM + marketing automation — thin-moat target |
| ASAN | Core | High | Project management — workflow UI over task DB |
| PD | Core | High | Incident management — DB + workflow exposure |
| FRSH | Core | High | Mid-market CRM/support — direct HUBS analog |
| TWLO | Significant | High | Comms APIs commoditizing as LLMs handle orchestration |
| DBX | Significant | High | File storage/collaboration — thin moat |
| BOX | Significant | Medium | File storage — some enterprise compliance offset |
| ZM | Significant | Medium | Video conferencing — AI Companion partially offsets |
| DOCU | Peripheral | Medium | E-signature — regulated-systems moat partially offsets |

---

## 5. Key Design Decisions

### 5.1 Direction is binary — no "Mixed"

- Permitted values on `EXPOSED_TO.direction`: Tailwind or Headwind only
- Genuinely mixed exposures get UNDER_REVIEW relationship instead, or two separate edges to two separate themes
- Rationale: every analytical query would otherwise need a `WHERE direction <> "Mixed"` filter — noise compounds at scale

### 5.2 UNDER_REVIEW is a separate relationship type

- Never inferred or set by migration — only by deliberate user action
- Invisible by default to EXPOSED_TO queries — under-review items don't pollute analyses
- Two-step lifecycle: delete UNDER_REVIEW edge, create EXPOSED_TO edge once decided

### 5.3 Conviction (theme) vs. Confidence (edge) vs. Strength (edge)

Three independent dimensions that should not be conflated:

- **Conviction** — lives on the Theme node — *"Do I believe the thesis?"*
- **Strength** — lives on the EXPOSED_TO edge — *"How much does this theme matter for this stock?"*
- **Confidence** — lives on the EXPOSED_TO edge — *"Am I sure about this specific link?"*

A company can have high edge confidence on a low-conviction theme (clean expression of a speculative idea), or low confidence on a high-conviction theme (probably exposed but mechanism unclear). The PQC tree is a clean example: theme conviction is High because the deadlines are mandated; edge confidence ranges from High (IBM, NET, BAH, LDOS) to Medium (CRWD, PANW, FTNT, CACI, ACN) based on directness of PQC revenue tie-in.

### 5.4 Audit trail for AI-inferred values

- Theme nodes carry `conviction_source` — values include "User-authored", "User-confirmed", "Claude-inferred"
- Anything propagated by AI is flagged so it can be reviewed and either confirmed or rewritten
- EXPOSED_TO edges carry `reviewed = false` until user confirms; flip to true on review
- Prevents AI opinions from silently becoming data

### 5.5 One canonical listing per company

- Bloomberg ticker format (e.g., "SHOP CN Equity") already enforces single-listing discipline
- Dual-listed names (Shopify Toronto/NYSE) use the canonical listing only — no forking
- Prevents market-cap double-counting and analytical drift

### 5.6 Pre-IPO companies are explicitly flagged, not invented

When a company has filed but not yet priced (e.g., Quantinuum / QNT US Equity), a Company node is created with `listing_status = "Pre-IPO"` and a `migration_status` note. No GICS classification edges are added until the company appears in a refreshed universe CSV.

### 5.7 The graph is a confidence-filtered view, not a census

- Absence of an edge is meaningful: no decided exposure, or not yet analyzed
- Every EXPOSED_TO edge is high-information by design
- Coverage-gap queries (e.g., "Application Software names with no theme exposure") surface what's still to be reviewed

### 5.8 Hierarchy (CHILD_OF) vs. Topical grouping (TAGGED_AS)

These solve different problems and should not be conflated:

- **CHILD_OF** means *"is a structural sub-component of a larger thesis"* (e.g., Existential Infrastructure is a tier of Mission-Critical Infrastructure within the SaaS Durability thesis)
- **TAGGED_AS** means *"is editorially about the same subject area, but the theses are economically independent"* (e.g., PQC Migration and Quantum Computing Beneficiaries both relate to quantum but the drivers and beneficiary lists are distinct)
- Convention: tag only L1 parent themes — the variable-depth CHILD_OF traversal then reaches all descendants automatically
- A theme can be both a child of one theme and tagged to a topic; the two concerns are orthogonal

### 5.9 Multi-theme exposures are intentional, not duplicative

Some companies legitimately belong to multiple themes through different mechanisms. PANW, CRWD, NET, and FTNT carry edges to both Cybersecurity Tailwind (threat-driven) and PQC - Identity and Encryption Incumbents (deadline-driven). The edges are not duplicates — each captures a distinct economic driver with a distinct mechanism. A RELATES_TO link between the parent themes documents the overlap so analysts know to expect it.

### 5.10 Lifecycle conventions — acquisitions, ticker remaps, and universe gaps

Companies enter and exit the universe through three predictable channels: pre-IPO filings, M&A, and identifier drift. Rather than delete history when these happen, the convention is to preserve the node and flag its lifecycle state. This keeps the audit trail intact and makes it possible to answer "what did the framework say before the deal closed?" later.

**Three lifecycle states on Company nodes**

| `listing_status` value | When to use | Required companion properties |
|---|---|---|
| Pre-IPO | Company has filed registration but not yet priced. Thesis already material. | `migration_status` (free text), `exchange`, `source`. No GICS edges until refreshed universe CSV. |
| Delisted-Acquired | Company has been acquired and delisted. Framework exposure preserved for audit trail; live exposure travels through the acquirer. | `acquired_by` (acquirer's Bloomberg ticker), `delisting_date` (date). Edge to original theme preserved with a `note` pointing to the live exposure node. |
| Claude-proposed | Company belongs in the framework but is missing from the imported universe CSV (gap in the universe, not a real-world absence). | `created_by = "Claude-proposed"`, `created_in_session` (date), `source`, `migration_status` note. No GICS edges until refreshed universe CSV. |

**Migration provenance — when an edge moves**

When an EXPOSED_TO edge is retargeted from one Company node to another (e.g., framework wrote "FI" but the canonical listing is "FISV US Equity"), the new edge captures provenance:

- `framework_alias` on the destination Company node — preserves the original framework reference (e.g., "FI", "CSU.TO")
- `migrated_from` on the edge — preserves the source (e.g., "FI (orphan Security)")
- `last_updated` on the edge — set to the migration date so the change is visible in audit queries
- `note` on the edge (optional) — used for acquired companies to point to the live exposure node

**Canonical migration patterns**

*Pattern 1 — Ticker-format remap (canonical Company exists, framework used different identifier):*

```cypher
MATCH (orphan:Security {ticker: $oldTicker})-[oldEdge:EXPOSED_TO]->(t:Theme)
MATCH (canonical:Company {ticker: $canonicalTicker})
MERGE (canonical)-[newEdge:EXPOSED_TO]->(t)
SET newEdge = properties(oldEdge),
    newEdge.migrated_from = $oldTicker + " (orphan)",
    newEdge.last_updated = date(),
    canonical.framework_alias = $oldTicker
DETACH DELETE orphan
```

*Pattern 2 — Universe-gap create (Company doesn't exist in CSV yet):*

```cypher
MERGE (newCo:Company {ticker: $newTicker})
ON CREATE SET newCo.listing_status = "Claude-proposed",
              newCo.created_by = "Claude-proposed",
              newCo.created_in_session = date(),
              newCo.source = $source,
              newCo.framework_alias = $oldTicker
```

*Pattern 3 — Acquired company convention (preserve, don't collapse):*

```cypher
MERGE (newCo:Company {ticker: $acquiredTicker + " US Equity"})
ON CREATE SET newCo.listing_status = "Delisted-Acquired",
              newCo.acquired_by = $acquirerTicker,
              newCo.delisting_date = $delistDate
// Edge preserved with note: "live exposure now via $acquirerTicker"
```

**Rationale.** Collapsing an acquired company's exposure directly into the acquirer loses the framework's pre-acquisition view. Preserving the node with Delisted-Acquired lifecycle status means the question "what did we think about Ansys before SNPS bought it?" can still be answered.

**Anti-patterns specific to lifecycle**

- Deleting an acquired company's node and migrating its edge to the acquirer — loses history and conflates two distinct economic units
- Creating a Claude-proposed Company node and immediately adding GICS edges — invents classifications without source data; wait for the refreshed universe CSV
- Leaving an orphan Security node in place "for later review" — orphans accumulate. Resolve at first opportunity using one of the three patterns above

### 5.11 Periodic re-import discipline

The universe CSV is re-imported periodically (target: weekly) to refresh `marketCap`, `priceChange30D`, and any other CSV-sourced fields. Re-imports preserve all hand-authored work *if and only if* the import follows the rules below. The risks are concrete: a wipe-and-replace import destroys every EXPOSED_TO edge; a careless `SET c = row` overwrites every lifecycle property (`listing_status`, `framework_alias`, `acquired_by`, `delisting_date`).

**Two rules that prevent both failure modes**

1. **MERGE, never CREATE.** MERGE matches existing Company nodes by `ticker`; CREATE makes new ones. Always MERGE on the ID property when re-importing — this preserves node identity, which means all edges to Sectors, SubSectors, Countries, and Themes survive intact.
2. **Property-by-property SET, never `SET c = row`.** The `SET c = row` shorthand wipes all node properties not present in the row. Use explicit `SET c.field = row.field` for each CSV-sourced field. This protects lifecycle properties that the CSV doesn't carry.

**Canonical weekly re-import pattern**

```cypher
LOAD CSV WITH HEADERS FROM 'file:///universe_YYYY_MM_DD.csv' AS row
MERGE (c:Company {ticker: row.ticker})
SET c.shortName = row.shortName,
    c.marketCap = toFloat(row.marketCap),
    c.priceChange30D = toFloat(row.priceChange30D),
    c.lastImported = date()
// Do NOT use SET c = row — that overwrites lifecycle properties
// Do NOT touch listing_status, framework_alias, acquired_by, delisting_date, created_by, source
```

**`lastImported` is required**

Every MERGE sets `c.lastImported = date()`. This timestamp:

- Powers stale-node detection (query A.12) — finds companies that dropped out of the universe
- Lets you confirm the import ran end-to-end (a quick count of `WHERE lastImported = date()` should match the CSV row count)
- Distinguishes intentional lifecycle nodes (Pre-IPO, Delisted-Acquired, Claude-proposed) from accidental stragglers

**Three post-import review steps**

1. **Lifecycle graduation review (query A.11).** Pre-IPO and Claude-proposed nodes are temporary states. When QNT prices, or when CFLT/IQV appear in the refreshed CSV, the re-import will update their node properties — but the `listing_status` flag remains stale. Clear the flag manually after confirming the company has graduated. GICS edges (`IN_SECTOR`, `IN_SUB_INDUSTRY`, `IN_COUNTRY`) should be added at this point if they weren't present.
2. **Stale-node detection (query A.12).** Companies missing from the latest CSV will not be touched by the MERGE. They could be delisted (build a Delisted-Acquired node manually), acquired (same), ticker-changed (manual remap using migration provenance), or just a transient CSV bug. Review anything more than 14 days stale.
3. **Edge count sanity check.** Run the EXPOSED_TO count from query A.10 immediately before and after the import. They should match exactly. If they don't, something touched edges — investigate before doing anything else.

**Companies that change ticker**

Ticker changes (e.g., "FB US Equity" → "META US Equity") break MERGE — the new ticker creates a new node with no edges; the old node persists with edges but stale properties. Handle as a manual migration using the [Pattern 1 ticker-format remap](#510-lifecycle-conventions--acquisitions-ticker-remaps-and-universe-gaps) from Section 5.10, setting `framework_alias` to the old ticker on the new node. Detect via stale-node review (query A.12).

**Anti-patterns specific to re-import**

- Wiping all Company nodes before re-import — destroys every authored edge
- Using `SET c = row` shorthand — silently overwrites lifecycle properties with NULL
- Adding GICS edges to Pre-IPO or Claude-proposed nodes during re-import — graduate the lifecycle state explicitly first
- Skipping the `lastImported` timestamp — makes stale-node detection impossible
- Running the re-import without a pre/post EXPOSED_TO count check — silent edge loss is the worst failure mode and the easiest to catch

---

## Appendix A — Cypher Query Patterns

### A.1 Variable-depth theme traversal

Find all companies exposed to any sub-theme under a parent theme:

```cypher
MATCH (root:Theme {name: "Post-Quantum Cryptography Migration"})<-[:CHILD_OF*0..]-(t:Theme)<-[r:EXPOSED_TO]-(c:Company)
RETURN DISTINCT c.ticker, c.shortName
```

### A.2 Topical traversal (across L1 parents in a topic)

```cypher
MATCH (:Topic {name: "QUANTUM"})<-[:TAGGED_AS]-(parent:Theme)<-[:CHILD_OF*0..]-(t:Theme)<-[r:EXPOSED_TO]-(c:Company)
RETURN DISTINCT parent.name, c.ticker, c.shortName
```

### A.3 Cross-dimensional slicing

Theme exposure by GICS sector:

```cypher
MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
MATCH (c)-[:IN_SECTOR]->(s:Sector)
RETURN t.name AS theme, s.name AS sector, count(c) AS companies
ORDER BY theme, companies DESC
```

### A.4 Tailwind/Headwind balance per theme

```cypher
MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
RETURN t.name AS theme,
       sum(CASE r.direction WHEN "Tailwind" THEN 1 ELSE 0 END) AS tailwinds,
       sum(CASE r.direction WHEN "Headwind" THEN 1 ELSE 0 END) AS headwinds
ORDER BY theme
```

### A.5 Confidence audit — unreviewed edges by theme

```cypher
MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
WHERE r.reviewed = false
RETURN t.name AS theme, count(r) AS unreviewed_edges
ORDER BY unreviewed_edges DESC
```

### A.6 Companies with multiple theme exposures (overlap detection)

```cypher
MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
WITH c, count(DISTINCT t) AS theme_count, collect(t.name) AS themes
WHERE theme_count > 1
RETURN c.ticker, c.shortName, theme_count, themes
ORDER BY theme_count DESC
```

### A.7 Lifecycle inventory — Pre-IPO, Delisted-Acquired, Claude-proposed

```cypher
MATCH (c:Company)
WHERE c.listing_status IS NOT NULL
RETURN c.ticker, c.shortName, c.listing_status, c.acquired_by, c.delisting_date, c.framework_alias
ORDER BY c.listing_status
```

### A.8 Migration provenance — edges that have been moved

```cypher
MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
WHERE r.migrated_from IS NOT NULL
RETURN c.ticker, c.framework_alias, t.name, r.migrated_from, r.last_updated
ORDER BY r.last_updated DESC
```

### A.9 Coverage gap analysis

Application Software names not yet classified or under review:

```cypher
MATCH (c:Company)-[:IN_SUB_INDUSTRY]->(ss:SubSector {name: "Application Software"})
MATCH (c)-[:IN_COUNTRY]->(:Country {name: "UNITED STATES"})
WHERE c.marketCap > 5000000000
  AND NOT EXISTS { MATCH (c)-[:EXPOSED_TO]->(:Theme) }
  AND NOT EXISTS { MATCH (c)-[:UNDER_REVIEW]->(:Theme) }
RETURN c.ticker, c.shortName, round(c.marketCap/1000000000, 1) AS bn
ORDER BY c.marketCap DESC
```

### A.10 Refresh "Final state at a glance" counts

Single query that produces the values for Section 1's headline table. Run when counts drift:

```cypher
MATCH (c:Company) WITH count(c) AS companies
MATCH (s:Sector) WITH companies, count(s) AS sectors
MATCH (ss:SubSector) WITH companies, sectors, count(ss) AS subSectors
MATCH (co:Country) WITH companies, sectors, subSectors, count(co) AS countries
MATCH (t:Theme) WITH companies, sectors, subSectors, countries, count(t) AS themes
MATCH (tp:Topic) WITH companies, sectors, subSectors, countries, themes, count(tp) AS topics
MATCH ()-[e:EXPOSED_TO]->() WITH companies, sectors, subSectors, countries, themes, topics,
  count(e) AS exposedTo,
  sum(CASE e.direction WHEN "Tailwind" THEN 1 ELSE 0 END) AS tailwinds,
  sum(CASE e.direction WHEN "Headwind" THEN 1 ELSE 0 END) AS headwinds
MATCH ()-[c2:CHILD_OF]->() WITH companies, sectors, subSectors, countries, themes, topics, exposedTo, tailwinds, headwinds, count(c2) AS childOf
MATCH ()-[r:RELATES_TO]->() WITH companies, sectors, subSectors, countries, themes, topics, exposedTo, tailwinds, headwinds, childOf, count(r) AS relatesTo
MATCH ()-[ta:TAGGED_AS]->() WITH companies, sectors, subSectors, countries, themes, topics, exposedTo, tailwinds, headwinds, childOf, relatesTo, count(ta) AS taggedAs
RETURN companies, sectors, subSectors, countries, themes, topics, exposedTo, tailwinds, headwinds, childOf, relatesTo, taggedAs
```

### A.11 Post-import lifecycle graduation review

Run after every weekly re-import. Surfaces Pre-IPO and Claude-proposed nodes that were touched by this week's import — meaning the company is now in the canonical universe and the temporary lifecycle flag may need to be cleared.

```cypher
MATCH (c:Company)
WHERE c.listing_status IN ["Pre-IPO", "Claude-proposed"]
  AND c.lastImported = date()
RETURN c.ticker, c.shortName, c.listing_status, c.framework_alias, c.source
ORDER BY c.listing_status, c.ticker
```

For each row returned:
- Confirm the company has graduated (Pre-IPO → priced and listed; Claude-proposed → now in universe CSV)
- Remove the `listing_status` property and add GICS edges (`IN_SECTOR`, `IN_SUB_INDUSTRY`, `IN_COUNTRY`)
- Keep `framework_alias` and `created_by` for audit trail

### A.12 Stale-node detection (companies missing from latest import)

Run after every weekly re-import. Surfaces Company nodes that did not appear in the latest CSV — could indicate delisting, acquisition, ticker change, or transient CSV bug. Excludes intentional lifecycle nodes (Pre-IPO, Delisted-Acquired, Claude-proposed) which are expected to be absent from the CSV.

```cypher
MATCH (c:Company)
WHERE (c.lastImported IS NULL OR c.lastImported < date() - duration({days: 14}))
  AND c.listing_status IS NULL
RETURN c.ticker, c.shortName, c.lastImported, c.marketCap
ORDER BY c.lastImported ASC, c.marketCap DESC
```

For each row, decide:
- **Acquired or delisted** → apply Pattern 3 from Section 5.10 (convert to Delisted-Acquired)
- **Ticker changed** → apply Pattern 1 from Section 5.10 (ticker remap with `framework_alias`)
- **Transient CSV bug** → no action; recheck next week
- **Truly out of universe** → review whether to keep the node (if it has authored edges) or delete

---

## Appendix B — Constraints and Indexes

### B.1 Uniqueness constraints

- `Company.ticker`
- `Sector.name`
- `SubSector.name`
- `Country.name`
- `Theme.name`
- `Topic.name` *(pending — must be added manually in AuraDB Workspace; MCP write tool does not support DDL)*
- `Security.ticker` *(legacy; label retained for schema continuity, no instances)*

### B.2 Additional indexes

- `Company.marketCap` (range index for fast top-N queries)

### B.3 Theme node properties

| Property | Type | Notes |
|---|---|---|
| name | string | ID property, unique |
| level | integer | 1 macro / 2 sub-theme / 3 sub-sub-theme |
| thesis | string | 1–3 sentence statement |
| status | string | Active / Paused / Closed |
| conviction | string | High / Medium-High / Medium / Low |
| time_horizon | string | 1–3, 3–5, 5+, or 10+ years |
| conviction_source | string | User-authored, User-confirmed, Claude-inferred |
| created_in_session | date | When the theme node was created |
| watchlist | string *(optional)* | Free text for pending/private companies not yet in universe |

### B.4 Company node properties (extended)

| Property | Type | Notes |
|---|---|---|
| ticker | string | ID property, Bloomberg format |
| shortName | string | Display name |
| marketCap | number | USD; indexed for top-N queries; refreshed via weekly re-import (see Section 5.11) |
| priceChange30D | number *(optional)* | Trailing 30-day price change as a percentage (e.g., `5.2` for +5.2%); refreshed via weekly re-import |
| lastImported | date *(optional)* | Date of the most recent CSV refresh that touched this node; used by stale-node detection (query A.12) |
| exchange | string *(optional)* | Set explicitly for pre-IPO records |
| listing_status | string *(optional)* | Pre-IPO / Delisted-Acquired / Claude-proposed; absent for normal listings |
| migration_status | string *(optional)* | Free text for lifecycle context and edge cases |
| framework_alias | string *(optional)* | Original framework reference if different from canonical ticker (e.g., "FI" for FISV US Equity) |
| acquired_by | string *(optional)* | Acquirer's Bloomberg ticker; required when `listing_status = "Delisted-Acquired"` |
| delisting_date | date *(optional)* | Required when `listing_status = "Delisted-Acquired"` |
| created_in_session | date *(optional)* | When Claude-proposed nodes were created |
| created_by | string *(optional)* | "Claude-proposed" for audit |
| source | string *(optional)* | Originating document for non-CSV records |

### B.5 Topic node and TAGGED_AS edge properties

| Property | Type | Notes |
|---|---|---|
| Topic.name | string | ID property, conventionally uppercase (e.g., QUANTUM) |
| Topic.description | string | Free-text definition of the editorial grouping |
| Topic.created_in_session | date | When the topic node was created |
| TAGGED_AS.tagged_on | date | When the theme was tagged to the topic |

### B.6 RELATES_TO edge properties

| Property | Type | Notes |
|---|---|---|
| kind | string | Type of relationship (e.g., "inverse", "overlapping-but-distinct") |
| note | string | Free-text explanation of the relationship |
| created_in_session | date | When the relationship was created |

### B.7 EXPOSED_TO migration provenance properties

Optional properties added to EXPOSED_TO edges when they are moved, retargeted, or otherwise re-anchored. See [Section 5.10](#510-lifecycle-conventions--acquisitions-ticker-remaps-and-universe-gaps) for the lifecycle conventions that drive their use.

| Property | Type | Notes |
|---|---|---|
| migrated_from | string *(optional)* | Source node identifier the edge was moved from (e.g., "FI (orphan Security)") |
| note | string *(optional)* | Edge-level annotation (e.g., "Exposure preserved for audit trail; live exposure now via SNPS US Equity") |

---

## Appendix C — Discipline Principles & Anti-Patterns

### C.1 Core disciplines

- The graph is a confidence-filtered view, not a complete census — absence of an edge is meaningful
- Every EXPOSED_TO edge is high-information — no placeholder edges
- Claude-inferred values are flagged via `conviction_source` on themes and `reviewed=false` on edges
- One canonical listing per company (no forking on dual-listings)
- Mechanism is required for meaningful edges — without it, the edge is a hunch, not a thesis
- UNDER_REVIEW is only set by deliberate user action — never inferred
- Pre-IPO companies are explicitly flagged via `listing_status` and have no synthetic GICS classifications until they appear in a refreshed universe CSV
- Acquired companies are preserved with `listing_status = "Delisted-Acquired"` and `acquired_by` / `delisting_date` fields — never deleted or silently collapsed into the acquirer
- Migrated edges preserve provenance via `migrated_from` on the edge and `framework_alias` on the destination node
- Periodic CSV re-imports use MERGE (never CREATE) and explicit property SET (never `SET c = row`) to preserve node identity, edges, and lifecycle properties — see Section 5.11
- Tag only L1 parent themes with TAGGED_AS; rely on CHILD_OF traversal to reach descendants

### C.2 Anti-patterns to avoid

- Creating a "Mixed" direction edge for two-sided exposure — use UNDER_REVIEW or two separate theme edges
- Adding theme exposure based on sector classification alone — sectors are already captured via IN_SECTOR; theme exposure is a separate analytical layer
- Modifying property names without dropping/recreating constraints first
- Treating confidence and conviction as synonyms — they live on different objects and answer different questions
- Letting AI-inferred values become data without an audit-trail flag
- Creating Company nodes for pre-IPO names without `listing_status` flagging — invents fake tickers and breaks universe discipline
- Adding IN_SECTOR / IN_SUB_INDUSTRY / IN_COUNTRY edges for pre-IPO or Claude-proposed companies before they appear in the refreshed universe CSV
- Deleting an acquired company's node and collapsing its edge into the acquirer — loses pre-deal framework history
- Leaving orphan Security or unflagged universe-gap nodes "for later review" — orphans accumulate; resolve at first opportunity
- Tagging every theme in a topic with TAGGED_AS — redundant with CHILD_OF; tag L1 parents only
- Using CHILD_OF where TAGGED_AS is the right fit — forces a hierarchical relationship between economically independent theses
- Re-importing the universe CSV using CREATE instead of MERGE — destroys every authored EXPOSED_TO edge
- Re-importing the universe CSV using `SET c = row` shorthand — silently overwrites lifecycle properties (`listing_status`, `framework_alias`, `acquired_by`, `delisting_date`) with NULL
- Running a CSV re-import without a pre/post EXPOSED_TO edge count check — silent edge loss is the worst failure mode and the easiest to catch

### C.3 Open questions / future considerations

- **Time-versioning:** edits currently overwrite silently — if conviction shifts, history is lost. Lifecycle conventions partially address this for company-level events (acquisitions, delistings) but not for theme-level conviction changes. Consider `valid_from`/`valid_to` or snapshots
- **Effects as nodes:** shared mechanisms (e.g., "compliance moat") are currently duplicated as `mechanism` text on each edge — lifting Effect to its own node would normalize
- **Company vs. Listing:** Company is really Listing — if multiple listings of one underlying business become important, this needs a split
- **Numeric strength scoring:** categorical Core/Significant/Peripheral is easier to reason about, numeric (0–100) is easier to sort and portfolio-weight — both can coexist when needed
- **Quantum modality competition:** current tree groups all pure-plays under one sub-theme; if a clear modality winner emerges, a third hierarchy level by modality may become useful
- **PQC pure-plays sub-theme:** if SandboxAQ, PQShield, or QuSecure IPO, a third PQC sub-theme will be warranted
- **Headwind PQC theme:** if a CRQC milestone arrives ahead of schedule, a Quantum Disruption of Encryption headwind theme will need to be built
- **Merger handling:** current convention preserves the acquired company's node but only points to the acquirer via `acquired_by` string property. If complex multi-step M&A becomes common, a dedicated ACQUIRED_BY relationship between Company nodes may be cleaner

---

## Appendix D — Lifecycle Catalog and Migration Mapping

### D.1 Pre-IPO Company nodes

Companies added in advance of pricing because the thesis is already material. `listing_status = "Pre-IPO"`. No GICS edges until refreshed universe CSV.

| Ticker | Company | Exchange | Status | Source |
|---|---|---|---|---|
| QNT US Equity | Quantinuum Inc. | Nasdaq | Registration filed, not yet effective | Morgan Stanley offering memo, May 2026 |

### D.2 Delisted-Acquired Company nodes

Acquired companies preserved as Company nodes with their original framework edges intact. Live exposure travels through the acquirer; this node exists for audit trail.

| Ticker | Company | Acquired by | Delisting date | Live exposure travels through |
|---|---|---|---|---|
| ANSS US Equity | Ansys *(delisted)* | SNPS US Equity | 2025-07-17 | SNPS US Equity (Engineering-Critical Infrastructure) |

### D.3 Claude-proposed Company nodes

Companies that belong in the framework but were absent from the imported universe CSV. Created with framework intent and provenance; will be reconciled when the universe CSV is refreshed.

| Ticker | Company | Framework alias | Created | Theme |
|---|---|---|---|---|
| CFLT US Equity | Confluent Inc. | CFLT (legacy orphan) | 2026-05-17 | SaaS Durability — Operational Infrastructure |
| IQV US Equity | IQVIA Holdings | IQV (legacy orphan) | 2026-05-17 | SaaS Durability — Proprietary Data |

### D.4 Ticker-format remap history

Edges retargeted from one identifier to another. `framework_alias` on the destination Company node preserves the original framework reference.

| Framework alias | Canonical ticker | Migration date | Reason |
|---|---|---|---|
| FI | FISV US Equity | 2026-05-17 | Fiserv adopted "FI" ticker symbol in 2024 but Bloomberg still uses FISV — canonical listing already in universe |
| CSU.TO | CSU CN Equity | 2026-05-17 | Yahoo/Toronto-style identifier; canonical Bloomberg listing already in universe |

### D.5 Original Security → Company migration mapping

Ticker collisions resolved during the initial Security → Company migration (Phase 4, May 15, 2026):

| Old Ticker | Resolved To | Collision Avoided |
|---|---|---|
| ADP | ADP US Equity (Automatic Data) | ADP FP Equity (French listing) |
| DE | DE US Equity (Deere & Co) | DE CN Equity (Decisive Dividend) |
| IOT | IOT US Equity (Samsara) | IOT IM Equity (Seco SpA, Italy) |
| NET | NET US Equity (Cloudflare) | NET LN Equity (Netcall, UK) |
| PCOR | PCOR US Equity (Procore) | PCOR PM Equity (Petron, Philippines) |
| SHOP | SHOP CN Equity (Shopify, canonical) | SHOP IN Equity (Shoppers Stop) |
| TTAN | TTAN US Equity (ServiceTitan) | TTAN IN Equity (Titan, India) |
