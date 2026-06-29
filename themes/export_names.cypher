// ============================================================
//  DUMAC Direct — Theme Names Export
//  Source of truth: Neo4j Aura  (Company)-[:EXPOSED_TO]->(Theme)
//  Produces one row per company x theme exposure for Theme_names.xlsx.
//  Last updated: 2026-06-28
//
//  Column mapping (matches Theme_names.xlsx columns A-E):
//    A  TICKER     = full Bloomberg ticker  (c.ticker, e.g. "CFLT US Equity")
//    B  CATEGORY   = top-level bucket (lookup on the L1 root theme)
//    C  THEME      = L1 root theme, graph name
//    D  SUB-THEME  = L2 parent group; blank when the exposure is at L1
//    E  DIRECTION  = TAILWIND / HEADWIND (upper-cased from edge.direction)
//  (Columns F-I — SHORT_NAME, CHG_PCT_MTD/1M/YTD — are added in Excel
//   via Bloomberg after paste; they are not produced by this query.)
//
//  HOW TO USE
//    1. Open Aura Workspace  ->  Query tab.
//    2. Paste and run this query.
//    3. Export the result grid as CSV.
//    4. Feed the CSV to the append step, then commit Theme_names.xlsx.
//
//  Notes
//    - Deeper (L3) exposures roll up to their L2 parent group by design.
//    - CATEGORY is not stored in the graph; it is mapped here from the
//      L1 root theme. The CASE block below covers all 20 current L1 themes
//      and uses the same eight buckets as the [Category]_Names.html pages.
//      Add a WHEN line whenever a new L1 theme is created, or it lands in
//      ELSE 'Uncategorized'.
//    - No status/reviewed filter: Proposed themes (e.g. Space Economy,
//      Voice AI, Cannabis) and Claude-inferred / unreviewed edges ARE included.
//    - Returns scalar column aliases for clean CSV export.
// ============================================================

MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
OPTIONAL MATCH (t)-[:CHILD_OF*0..]->(root:Theme {level: 1})
OPTIONAL MATCH (t)-[:CHILD_OF*0..]->(l2:Theme {level: 2})
WITH c, r, coalesce(root, t) AS rootTheme, l2
RETURN
  c.ticker AS TICKER,
  CASE rootTheme.name
    // --- Productivity ---
    WHEN 'SaaS Durability in AI Era'           THEN 'Productivity'
    WHEN 'AI Disruption of Horizontal SaaS'    THEN 'Productivity'
    WHEN 'Edge AI'                             THEN 'Productivity'
    WHEN 'Voice AI'                            THEN 'Productivity'
    // --- Physical AI ---
    WHEN 'Robotics'                            THEN 'Physical AI'
    // --- Financial ---
    WHEN 'Crypto Asset Beneficiaries'          THEN 'Financial'
    WHEN 'Asset Tokenization'                  THEN 'Financial'
    // --- Energy Transition ---
    WHEN 'AI Power'                            THEN 'Energy Transition'
    WHEN 'AI Hardware'                         THEN 'Energy Transition'
    WHEN 'Data Center Power'                   THEN 'Energy Transition'
    WHEN 'Uranium SMR'                         THEN 'Energy Transition'
    // --- Future ---
    WHEN 'Quantum Computing Beneficiaries'     THEN 'Future'
    WHEN 'Post-Quantum Cryptography Migration' THEN 'Future'
    WHEN 'Space Economy'                       THEN 'Future'
    // --- Defense ---
    WHEN 'National Security'                   THEN 'Defense'
    WHEN 'Drones'                              THEN 'Defense'
    // --- Cyclicals ---
    WHEN 'Housing'                             THEN 'Cyclicals'
    WHEN 'Low Income'                          THEN 'Cyclicals'
    WHEN 'Cannabis'                            THEN 'Cyclicals'
    // --- Life Sciences ---
    WHEN 'HC_BioTech'                          THEN 'Life Sciences'
    ELSE 'Uncategorized'
  END AS CATEGORY,
  rootTheme.name AS THEME,
  coalesce(l2.name, '') AS `SUB-THEME`,
  toUpper(r.direction) AS DIRECTION
ORDER BY CATEGORY, THEME, `SUB-THEME`, TICKER;
