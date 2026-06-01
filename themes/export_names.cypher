// ============================================================
//  DUMAC Direct — Theme Names Export
//  Source of truth: Neo4j Aura  (Company)-[:EXPOSED_TO]->(Theme)
//  Produces one row per company x theme exposure for Theme_names.xlsx.
//
//  Column mapping (matches Theme_names.xlsx columns A-E):
//    A  TICKER     = full Bloomberg ticker  (c.ticker, e.g. "CFLT US Equity")
//    B  CATEGORY   = top-level bucket (lookup on the L1 root theme)
//    C  THEME      = L1 root theme, graph name
//    D  SUB-THEME  = L2 parent group; blank when the exposure is at L1
//    E  DIRECTION  = TAILWIND / HEADWIND (upper-cased from edge.direction)
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
//      L1 root theme. Add new themes to the CASE block as the graph grows.
//    - Returns scalar column aliases for clean CSV export.
// ============================================================

MATCH (c:Company)-[r:EXPOSED_TO]->(t:Theme)
OPTIONAL MATCH (t)-[:CHILD_OF*0..]->(root:Theme {level: 1})
OPTIONAL MATCH (t)-[:CHILD_OF*0..]->(l2:Theme {level: 2})
WITH c, r, coalesce(root, t) AS rootTheme, l2
RETURN
  c.ticker AS TICKER,
  CASE rootTheme.name
    WHEN 'SaaS Durability in AI Era'           THEN 'Productivity'
    WHEN 'AI Disruption of Horizontal SaaS'    THEN 'Productivity'
    WHEN 'Data Center Power'                   THEN 'Productivity'
    WHEN 'AI Orchestration Layer Incumbents'   THEN 'Productivity'
    WHEN 'AI Voice Agents in CX'               THEN 'Productivity'
    WHEN 'Ambient Voice Computing Interface'   THEN 'Productivity'
    WHEN 'Crypto Asset Beneficiaries'          THEN 'Financial'
    WHEN 'Asset Tokenization'                  THEN 'Financial'
    WHEN 'Quantum Computing Beneficiaries'     THEN 'Future'
    WHEN 'Post-Quantum Cryptography Migration' THEN 'Future'
    ELSE 'Uncategorized'
  END AS CATEGORY,
  rootTheme.name AS THEME,
  coalesce(l2.name, '') AS `SUB-THEME`,
  toUpper(r.direction) AS DIRECTION
ORDER BY CATEGORY, THEME, `SUB-THEME`, TICKER;
