/* Regression suite for rc-core.js v1.4.
   Run:  node test-rc-core.js
   Covers the v1.4 additions AND the pre-existing behaviour they must not
   disturb — field order, blank-vs-zero, quoting round-trip, tag suppression. */

const C = require("./rc-core.js");
let pass = 0, fail = 0;
function t(n, cond){ cond ? pass++ : (fail++, console.log("FAIL: " + n)); }
function eq(n, a, b){
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if(!ok) console.log("FAIL: " + n + "\n  got: " + JSON.stringify(a) + "\n  exp: " + JSON.stringify(b));
  ok ? pass++ : fail++;
}

/* matchTags reads RC.cfg.taxonomy — point it at the seed. */
C.RC.cfg = JSON.parse(JSON.stringify(C.SEED));
const cfg = C.RC.cfg;

/* ================= pre-existing behaviour must not regress ============== */

eq("initials first+last", C.initials("Evan Jones"), "ej");
eq("initials 3-part uses last", C.initials("Mary Ann Smith"), "ms");
eq("initials single name", C.initials("Cher"), "ch");
eq("initials empty", C.initials(""), "xx");

eq("slug", C.slug("Nike Q2 channel check!"), "nike-q2-channel-check");

eq("blank -> empty", C.yamlStr(""), "");
eq("null -> empty", C.yamlStr(null), "");
eq("zero survives", C.yamlStr(0), "0");
eq("negative round-trip", C.unq(C.yamlStr(-5)), "-5");
eq("ISO timestamp stays bare", C.yamlStr("2026-09-07T14:02:11.903Z"),
   "2026-09-07T14:02:11.903Z");
eq("underscore stays bare", C.yamlStr("2026-09-07_ej_wolfspeed"),
   "2026-09-07_ej_wolfspeed");
eq("colon-space quoted round-trip",
   C.unq(C.yamlStr('Margins: "peak" or mid-cycle? #debate')),
   'Margins: "peak" or mid-cycle? #debate');

/* ================= the acronym suppression bug ========================== */

const tags = (s, b) => C.matchTags(s, b || "").map(h => h.tag);

t("AI survives alongside Retail (was the bug)",
  tags("Retail AI adoption").indexOf("Artificial Intelligence") >= 0);
t("Retail still fires", tags("Retail AI adoption").indexOf("Retail") >= 0);
t("Gold Miners still suppresses Gold",
  tags("Gold Miners screen cheap").indexOf("Gold") < 0 &&
  tags("Gold Miners screen cheap").indexOf("Gold Miners") >= 0);
t("Consumer Discretionary still suppresses Consumer",
  tags("Consumer Discretionary review").indexOf("Consumer") < 0);
t("EV survives alongside Defense",
  tags("EV and Defense demand").indexOf("Electric Vehicles") >= 0);

/* ambiguous mode: subject only */
t("Power not fired from body", tags("Nike channel check", "strong pricing power") .indexOf("Power") < 0);
t("Power fires from subject", tags("Power sector review").indexOf("Power") >= 0);
t("Value not fired from body", tags("Nike", "decent value versus history").indexOf("Value") < 0);
/* strict mode: case sensitive */
t("lowercase 'us' does not fire United States",
  tags("the business must adjust").indexOf("United States") < 0);
t("uppercase US fires", tags("US equities").indexOf("United States") >= 0);
/* subject priority */
t("subject hit sorts first", C.matchTags("Semis rolling over", "retail data soft")[0].src === "subject");

/* ================= v1.4: action ========================================= */

const base = { date:"2026-09-07", subject:"S", entity:"E", origin:"app", why:"w" };
const V = o => C.validateRecord(Object.assign({}, base, o), cfg);

t("missing action errors", !C.validateRecord(base, cfg).ok);
t("bad action errors", !V({action:"buy"}).ok);
t("pass ok", V({action:"pass"}).ok);
t("observation ok", V({action:"observation"}).ok);
t("reference ok", V({action:"reference"}).ok);
t("position action w/o ticker warns not blocks",
  V({action:"initiate"}).ok && V({action:"initiate"}).warnings.length > 0);
t("position action w/ ticker: no ticker warning",
  V({action:"initiate", ticker:"WOLF"}).warnings.every(w=>w.indexOf("ticker")<0));

/* ================= v1.4: why ============================================ */

t("why required for observation",
  !C.validateRecord({date:"2026-09-07",subject:"S",entity:"E",origin:"app",action:"observation"}, cfg).ok);
t("why exempt for reference",
  C.validateRecord({date:"2026-09-07",subject:"S",entity:"E",origin:"ingest",action:"reference"}, cfg).ok);
const lw = V({action:"pass", why:"x".repeat(250)});
t("long why warns not errors", lw.ok && lw.warnings.length > 0);

/* ================= v1.4: origin ========================================= */

t("missing origin errors",
  !C.validateRecord({date:"2026-09-07",subject:"S",entity:"E",action:"pass",why:"w"}, cfg).ok);
t("bad origin errors", !V({action:"pass", origin:"magic"}).ok);
t("app ok",           V({action:"pass", origin:"app"}).ok);
t("note-skill ok",    V({action:"pass", origin:"note-skill"}).ok);
t("ingest ok",        V({action:"reference", origin:"ingest"}).ok);
t("position-diff reserved and valid",
  V({action:"trim", origin:"position-diff", ticker:"WOLF",
     strategy:"Direct Global Ideas"}).ok);
eq("origins seeded into config", cfg.origins, C.ORIGINS);
eq("actions seeded into config", cfg.actions, C.ACTIONS);

/* ================= existing vocabularies respected ====================== */

t("record_type Company ok", V({action:"pass", record_type:"Company", ticker:"WOLF"}).ok);
t("record_type Theme ok",   V({action:"pass", record_type:"Theme"}).ok);
t("lowercase record_type errors", !V({action:"pass", record_type:"company"}).ok);
t("Company without ticker errors", !V({action:"pass", record_type:"Company"}).ok);
t("P. prefix ticker ok", V({action:"pass", record_type:"Company", ticker:"P.SECURITIZE"}).ok);

t("review_status Pending ok", V({action:"pass", review_date:"2026-12-01", review_status:"Pending"}).ok);
t("review_status Done ok",    V({action:"pass", review_date:"2026-12-01", review_status:"Done"}).ok);
t("lowercase review_status errors", !V({action:"pass", review_status:"pending"}).ok);
const orphan = V({action:"pass", review_status:"Pending"});
t("review_status without review_date warns, does not block",
  orphan.ok && orphan.warnings.length > 0);

t("conviction Med ok", V({action:"pass", conviction:"Med"}).ok);
t("bad conviction errors", !V({action:"pass", conviction:"Vhigh"}).ok);
t("decimal price target errors", !V({action:"pass", price_target_buy:"62.5"}).ok);
t("whole price target ok", V({action:"pass", price_target_buy:"62"}).ok);
t("zero price target ok", V({action:"pass", price_target_buy:0}).ok);
t("bad ticker errors", !V({action:"pass", ticker:"WAY.TOO.LONG!"}).ok);
t("bad outcome_check_date errors", !V({action:"pass", outcome_check_date:"07/09/2026"}).ok);
const ocw = V({action:"observation", outcome_check_date:"2026-12-01"});
t("outcome_check_date on observation warns", ocw.ok && ocw.warnings.length > 0);
t("outcome_check_date on pass no warn",
  V({action:"pass", outcome_check_date:"2026-12-01"}).warnings.length === 0);
t("tag cap enforced", !V({action:"pass", tags:new Array(9).fill("X")}).ok);

/* ================= buildFM round-trip =================================== */

const rec = {
  note_id:"2026-09-07_ej_margins-peak-or-mid-cycle-debate",
  date:"2026-09-07", created:"2026-09-07T14:02:11.903Z",
  last_updated:"2026-09-07T14:02:11.903Z", contributor:"Evan Jones",
  origin:"note-skill", record_type:"Company", entity:"Wolfspeed Inc",
  ticker:"WOLF", listed:true, tickers:[],
  subject:'Margins: "peak" or mid-cycle? #debate',
  action:"observation",
  why:"capacity adds don't square with the pricing they're modeling",
  source:"SemiAnalysis \u2014 SiC capacity buildout",
  outcome_check_date:null,
  tags:["Semiconductors","United States"], attachments:[],
  price_target_buy:0, price_target_sell:null, conviction:"Med",
  review_date:null, review_status:null, priority:null, revision:1
};
const md = C.buildFM(rec, "Spoke with two accounts.");
const back = C.parseFM(md);

eq("subject round-trip", back.subject, 'Margins: "peak" or mid-cycle? #debate');
eq("why round-trip", back.why, "capacity adds don't square with the pricing they're modeling");
eq("source round-trip", back.source, "SemiAnalysis \u2014 SiC capacity buildout");
eq("action round-trip", back.action, "observation");
eq("origin round-trip", back.origin, "note-skill");
eq("record_type preserved", back.record_type, "Company");
eq("listed preserved", back.listed, "true");
eq("tickers preserved", back.tickers, []);
eq("tags array", back.tags, ["Semiconductors","United States"]);
eq("zero survives as value", back.price_target_buy, "0");
eq("blank parses null", back.price_target_sell, null);
eq("blank outcome_check_date null", back.outcome_check_date, null);
eq("review_date null", back.review_date, null);
eq("priority null", back.priority, null);
eq("body preserved", back._body, "Spoke with two accounts.");
eq("note_id bare, not quoted", back.note_id,
   "2026-09-07_ej_margins-peak-or-mid-cycle-debate");
eq("created bare timestamp", back.created, "2026-09-07T14:02:11.903Z");

/* field order */
const fmBlock = C.buildFM(rec,"x").match(/^---\n([\s\S]*?)\n---/)[1];
const keys = fmBlock.split("\n").map(l => l.slice(0, l.indexOf(":")));
eq("starts note_id/date/created", keys.slice(0,3), ["note_id","date","created"]);
t("origin after contributor", keys.indexOf("origin") === keys.indexOf("contributor") + 1);
t("why immediately after action", keys.indexOf("why") === keys.indexOf("action") + 1);
t("action before tags", keys.indexOf("action") < keys.indexOf("tags"));
t("listed retained", keys.indexOf("listed") >= 0);
t("tickers retained", keys.indexOf("tickers") >= 0);
t("review_date retained", keys.indexOf("review_date") >= 0);
t("priority retained", keys.indexOf("priority") >= 0);
eq("ends on revision", keys[keys.length-1], "revision");

/* unknown key passthrough */
const extra = Object.assign({}, rec, { future_field:"keepme" });
t("unknown key written, not dropped",
  C.buildFM(extra,"x").indexOf("future_field: keepme") >= 0);
t("underscore-prefixed key skipped",
  C.buildFM(Object.assign({}, rec, {_path:["2026","09","x"]}),"x").indexOf("_path") < 0);

/* hand-edited loose array still parses */
eq("loose tag array parses",
   C.parseFM("---\nnote_id: x\ntags: [Nike, Retail]\naction: pass\n---\n\nb").tags,
   ["Nike","Retail"]);

/* a record written before v1.4 still parses and still round-trips */
const legacy = C.parseFM(
  "---\nnote_id: 2026-08-21_ej_old\ndate: 2026-08-21\nrecord_type: Company\n"
+ "ticker: NKE\nsubject: Old note\ntags: [\"Retail\"]\nrevision: 1\n---\n\nbody");
eq("legacy parses", legacy.ticker, "NKE");
eq("legacy action absent -> undefined", legacy.action, undefined);
t("legacy fails validation on action/origin/why",
  !C.validateRecord(Object.assign({entity:"Nike"}, legacy), cfg).ok);




/* ================= v1.5: record_type Note =============================== */
{
const V2 = o => C.validateRecord(Object.assign(
  {date:"2026-09-07", subject:"S", origin:"app", action:"observation", why:"w"}, o), cfg);
t("Note type valid", V2({record_type:"Note"}).ok);
t("Note needs no entity", V2({record_type:"Note"}).ok);
t("Company still needs entity", !V2({record_type:"Company", ticker:"NKE", entity:""}).ok);
t("Theme still needs entity", !V2({record_type:"Theme", entity:""}).ok);
t("bad record_type errors", !V2({record_type:"Quick"}).ok);
const nt = V2({record_type:"Note", entity:"Brazil", ticker:"BRZ"});
t("Note with ticker warns not blocks", nt.ok && nt.warnings.length > 0);
eq("RECORD_TYPES", C.RECORD_TYPES, ["Company","Theme","Note"]);
}

/* ================= v1.5: write-once why ================================= */
t("blank why settable", C.canSetWhy(null) && C.canSetWhy("") && C.canSetWhy("   "));
t("set why frozen", !C.canSetWhy("already reasoned"));

/* ================= v1.5: email origin =================================== */
t("email origin valid", C.validateRecord(
  {date:"2026-09-07",subject:"S",entity:"E",origin:"email",action:"observation",why:"w"}, cfg).ok);
t("ORIGINS has email", C.ORIGINS.indexOf("email") >= 0);

/* ================= v1.5: email header parser ============================ */
{
const e1 = C.parseEmailHeaders(
  "TICKER: WOLF\nACTION: pass\nBUY TARGET: 42\nTAGS: Semiconductors, United States\n"
+ "WHY: capacity ramp isn't funded\n\nSpoke with two accounts.\n\nSecond para.");
eq("ticker parsed", e1.fields.ticker, "WOLF");
eq("action parsed", e1.fields.action, "pass");
eq("buy target alias", e1.fields.price_target_buy, "42");
eq("why parsed", e1.fields.why, "capacity ramp isn't funded");
eq("tags raw", e1.fields.tags, "Semiconductors, United States");
eq("body after blank line", e1.body, "Spoke with two accounts.\n\nSecond para.");
eq("no unknowns", e1.unknown, []);

const e2 = C.parseEmailHeaders("Buy Target: 42\nbuytarget2: x\nPRICE TARGET SELL: 90\n\nbody");
eq("case-insensitive key", e2.fields.price_target_buy, "42");
eq("sell alias", e2.fields.price_target_sell, "90");
eq("unknown key captured", e2.unknown, ["buytarget2"]);

const e3 = C.parseEmailHeaders("Note: saw this today and it looked cheap\n\nmore");
t("prose opening is not eaten as a header", e3.body.indexOf("saw this today") >= 0);
eq("no fields from prose", Object.keys(e3.fields).length, 0);

const e4 = C.parseEmailHeaders("Just a plain note with no headers at all.");
eq("headerless body intact", e4.body, "Just a plain note with no headers at all.");

const e5 = C.parseEmailHeaders("TICKER: WOLF\r\nACTION: pass\r\n\r\nCRLF body");
eq("CRLF handled", e5.body, "CRLF body");
eq("CRLF fields", e5.fields.action, "pass");

const e6 = C.parseEmailHeaders("COMPANY: Wolfspeed Inc\nTHEME: Physical AI\n\nb");
eq("company and theme both map to entity (last wins)", e6.fields.entity, "Physical AI");
}

/* ================= v1.5: tag resolution ================================= */
{
const r1 = C.resolveTagNames(["semiconductors","UNITED STATES","Nonexistent Tag"], cfg);
eq("canonical casing restored", r1.tags, ["Semiconductors","United States"]);
eq("invented tag reported not created", r1.missing, ["Nonexistent Tag"]);
const r2 = C.resolveTagNames(["Gold","gold"], cfg);
eq("dedupes", r2.tags, ["Gold"]);
eq("empty input safe", C.resolveTagNames(null, cfg).tags, []);
}

/* ================= v1.5: screen linkage on a note ======================= */
{
const N = o => C.validateRecord(Object.assign(
  {date:"2026-09-07",subject:"S",entity:"E",origin:"screen",action:"pass",why:"w"}, o), cfg);
t("screen origin valid", N({}).ok);
t("screen_id + version ok", N({screen_id:"quality-no-debt", screen_version:3}).ok);
t("screen_id without version ERRORS", !N({screen_id:"quality-no-debt"}).ok);
t("version without screen_id errors", !N({screen_version:3}).ok);
t("non-numeric version errors", !N({screen_id:"q", screen_version:"three"}).ok);
t("uppercase screen_id errors", !N({screen_id:"Quality-No-Debt", screen_version:1}).ok);
t("run_id without screen_id errors", !N({run_id:"q_v1_2026-09-05"}).ok);
t("matching run_id ok",
  N({screen_id:"quality-no-debt",screen_version:3,run_id:"quality-no-debt_v3_2026-09-05"}).ok);
const mm = N({screen_id:"quality-no-debt",screen_version:3,run_id:"other-screen_v3_2026-09-05"});
t("mismatched run_id warns not blocks", mm.ok && mm.warnings.length>0);
t("plain note needs none of it",
  C.validateRecord({date:"2026-09-07",subject:"S",entity:"E",origin:"app",
                    action:"observation",why:"w"}, cfg).ok);
}

/* ================= v1.5: run_id helpers ================================= */
eq("runId built", C.runId("quality-no-debt",3,"2026-09-05"), "quality-no-debt_v3_2026-09-05");
eq("screenPath", C.screenPath("quality-no-debt",3), "SCREENS/quality-no-debt/v3.md");
eq("parseRunId round-trip", C.parseRunId("quality-no-debt_v3_2026-09-05"),
   {screen_id:"quality-no-debt", version:3, date:"2026-09-05"});
eq("parseRunId rejects junk", C.parseRunId("quality-no-debt-2026-09-05"), null);
eq("parseRunId rejects bad date", C.parseRunId("q_v1_09-05-2026"), null);

/* ================= v1.5: screen definition ============================== */
{
const base = { screen_id:"quality-no-debt", version:1, name:"Quality, no leverage",
  owner:"Brandon Gall", status:"draft", universe:"Russell 1000", source:"FMP",
  criteria:"revenue_growth_ttm > 5; price > sma_200; total_debt = 0",
  runner:"screens/quality-no-debt.py", created:"2026-09-07" };
const S = o => C.validateScreen(Object.assign({}, base, o));

t("v1 valid", S({}).ok);
t("no owner errors", !S({owner:""}).ok);
t("no criteria errors", !S({criteria:""}).ok);
t("no name errors", !S({name:""}).ok);
t("bad status errors", !S({status:"active"}).ok);
t("all statuses valid", C.SCREEN_STATUSES.every(st => S({status:st}).ok));
t("uppercase screen_id errors", !S({screen_id:"Quality"}).ok);
t("v1 supersedes errors", !S({supersedes:0}).ok);
t("v3 supersedes 2 ok", S({version:3, supersedes:2}).ok);
t("v3 supersedes 3 errors", !S({version:3, supersedes:3}).ok);
t("v3 supersedes 4 errors", !S({version:3, supersedes:4}).ok);
const orphan = S({version:2});
t("v2 with no supersedes warns not blocks", orphan.ok && orphan.warnings.length>0);
t("missing universe warns", S({universe:""}).ok && S({universe:""}).warnings.length>0);
t("missing runner warns", S({runner:""}).ok && S({runner:""}).warnings.length>0);
t("bad created date errors", !S({created:"09/07/2026"}).ok);

const md = C.buildScreen(Object.assign({}, base, {version:3, supersedes:2,
  tags:["Quality","Factors"], last_run:"2026-09-05"}),
  "v2 was catching banks where zero debt is a data artifact.");
const back = C.parseFM(md);
eq("screen round-trip id", back.screen_id, "quality-no-debt");
eq("screen version", back.version, "3");
eq("supersedes", back.supersedes, "2");
eq("criteria survives semicolons", back.criteria, base.criteria);
eq("screen tags array", back.tags, ["Quality","Factors"]);
eq("screen body", back._body, "v2 was catching banks where zero debt is a data artifact.");
const skeys = md.match(/^---\n([\s\S]*?)\n---/)[1].split("\n").map(l=>l.slice(0,l.indexOf(":")));
eq("screen order starts screen_id/version", skeys.slice(0,2), ["screen_id","version"]);
}

/* ================= v1.5: run sidecar ==================================== */
{
const base = { run_id:"quality-no-debt_v3_2026-09-05", screen_id:"quality-no-debt",
  screen_version:3, run_date:"2026-09-05", data_as_of:"2026-09-04",
  universe:"Russell 1000", source:"FMP",
  criteria:"revenue_growth_ttm > 8; price > sma_200; total_debt = 0",
  rows:340, runner:"screens/quality-no-debt.py", runtime_seconds:41, origin:"screen" };
const R = o => C.validateRun(Object.assign({}, base, o));

t("sidecar valid", R({}).ok);
t("bad run_id errors", !R({run_id:"quality-no-debt-2026-09-05"}).ok);
t("run_id/screen_id mismatch errors", !R({screen_id:"other"}).ok);
t("run_id/version mismatch errors", !R({screen_version:2}).ok);
t("missing criteria errors", !R({criteria:""}).ok);
t("non-numeric rows errors", !R({rows:"lots"}).ok);
const z = R({rows:0});
t("zero rows warns not blocks", z.ok && z.warnings.length>0);
const nd = R({data_as_of:""});
t("missing data_as_of warns", nd.ok && nd.warnings.length>0);
t("one hit is fine", R({rows:1}).ok);
t("500 hits is fine", R({rows:500}).ok);

const sc = C.parseFM(C.buildRunSidecar(base, "Mostly Japanese small caps."));
eq("sidecar rows", sc.rows, "340");
eq("sidecar criteria copied", sc.criteria, base.criteria);
eq("sidecar origin", sc.origin, "screen");
eq("sidecar body", sc._body, "Mostly Japanese small caps.");
}

/* ================= v1.5: strategy ======================================= */
{
const P = o => C.validateRecord(Object.assign(
  {date:"2026-09-07",subject:"S",entity:"E",ticker:"WOLF",origin:"position-diff",
   action:"trim",why:"w"}, o), cfg);
t("position-diff without strategy ERRORS", !P({}).ok);
t("position-diff with strategy ok", P({strategy:"Direct Global Ideas"}).ok);
t("off-vocabulary strategy errors", !P({strategy:"DirectUS"}).ok);
eq("strategies seeded", cfg.strategies, ["Direct Global Ideas","Direct US"]);

const A = o => C.validateRecord(Object.assign(
  {date:"2026-09-07",subject:"S",entity:"E",ticker:"WOLF",origin:"app",why:"w"}, o), cfg);
const w = A({action:"initiate"});
t("app position action w/o strategy warns not blocks", w.ok && w.warnings.length>0);
t("app observation w/o strategy is silent on strategy",
  A({action:"observation"}).warnings.every(x=>x.indexOf("strategy")<0));
t("app position action with strategy no strategy warning",
  A({action:"initiate",strategy:"Direct US"}).warnings.every(x=>x.indexOf("strategy")<0));

/* the collision this field exists to prevent */
const a=C.positionNoteId("2026-09-07","Wolfspeed","Evan Jones","Direct Global Ideas");
const b=C.positionNoteId("2026-09-07","Wolfspeed","Evan Jones","Direct US");
t("same name, same day, two strategies -> two ids", a!==b);
eq("id shape", a, "2026-09-07_ej_wolfspeed_direct-global-ideas");
eq("no strategy falls back to the plain id",
   C.positionNoteId("2026-09-07","Wolfspeed","Evan Jones",null),
   "2026-09-07_ej_wolfspeed");

/* round-trip */
const rt=C.parseFM(C.buildFM({strategy:"Direct Global Ideas",action:"trim",
  why:"sizing, not thesis",ticker:"WOLF"},"b"));
eq("strategy round-trip", rt.strategy, "Direct Global Ideas");
const keys=C.buildFM({strategy:"x",action:"y"},"b").match(/^---\n([\s\S]*?)\n---/)[1]
  .split("\n").map(l=>l.slice(0,l.indexOf(":")));
t("strategy immediately before action", keys.indexOf("strategy")===keys.indexOf("action")-1);

/* email header */
eq("STRATEGY email key",
   C.parseEmailHeaders("STRATEGY: Direct US\nACTION: trim\n\nb").fields.strategy,
   "Direct US");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
