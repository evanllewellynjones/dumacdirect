/* Headless test of entry.html's save path.
   Extracts the page <script>, runs it against a DOM stub and an in-memory
   filesystem, and asserts on the note.md that comes out the other end.
   Catches the class of bug that only appears when the form is wired up:
   wrong record_type, fields not cleared between modes, validation not firing. */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

let pass = 0, fail = 0;
const t = (n, c) => c ? pass++ : (fail++, console.log("FAIL: " + n));
const eq = (n, a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) console.log("FAIL: " + n + "\n  got: " + JSON.stringify(a) + "\n  exp: " + JSON.stringify(b));
  ok ? pass++ : fail++;
};

/* ---------- DOM stub ---------------------------------------------------- */
function makeEl(id){
  return {
    id, value:"", textContent:"", innerHTML:"", checked:false,
    className:"", dataset:{}, style:{}, title:"", options:[],
    classList:{ _s:new Set(),
      toggle(c,on){ on ? this._s.add(c) : this._s.delete(c); },
      add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
      contains(c){return this._s.has(c);} },
    appendChild(c){ this.options.push(c); return c; },
    querySelector(){ return makeEl("x"); },
    addEventListener(){}, focus(){}, closest(){ return null; },
    onclick:null, onchange:null
  };
}
const DOM = {};
const IDS = ["msg","banner","m_company","m_theme","m_note","blk_company","blk_theme",
  "blk_note","blk_pt","modehint","f_date","f_contrib","f_entity","f_ticker","f_listed",
  "tickerhint","f_theme","tkradd","tkrbtn","tkrchips","tkrcount","f_topic","f_subject",
  "f_note","f_action","actionhint","f_why","whycount","row_source","f_source",
  "row_outcome","f_outcome","f_strategy","strathint","f_ptb","f_pts","f_conv","f_review","tagcount","chips",
  "tagsearch","picker","drop","filein","atts","pastebox","btn_paste","pastemsg",
  "btn_save","btn_clear","folder","entlist","tkrlist"];
IDS.forEach(i => DOM["#"+i] = makeEl(i));

/* ---------- in-memory filesystem --------------------------------------- */
const FILES = {};
function dirHandle(prefix){
  return {
    name: prefix.split("/").pop() || "root",
    _p: prefix,
    async getDirectoryHandle(n,o){
      const p = prefix + "/" + n;
      if(!o || !o.create){
        if(!Object.keys(FILES).some(k => k.startsWith(p+"/"))) throw new Error("no dir");
      }
      return dirHandle(p);
    },
    async getFileHandle(n,o){
      const p = prefix + "/" + n;
      if((!o||!o.create) && !(p in FILES)) throw new Error("no file");
      return { async createWritable(){ return {
        async write(d){ FILES[p] = d; }, async close(){} }; },
        async getFile(){ return { text: async()=>FILES[p] }; } };
    },
    async *entries(){}
  };
}

/* ---------- sandbox ----------------------------------------------------- */
const core = fs.readFileSync(path.join(__dirname,"rc-core.js"),"utf8")
               .replace(/if \(typeof module[\s\S]*$/,"");   // drop the node shim
const html = fs.readFileSync(path.join(__dirname,"entry.html"),"utf8");
const pageScript = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1];

const sandbox = {
  console,
  localStorage:{ _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);} },
  indexedDB:{ open(){ const r={}; setTimeout(()=>{ r.result={createObjectStore(){},
    transaction(){ return { objectStore(){ return { get(){const q={};setTimeout(()=>q.onsuccess&&q.onsuccess(),0);return q;},
    put(){} }; }, oncomplete:null }; } }; r.onsuccess&&r.onsuccess(); },0); return r; } },
  document:{
    querySelector(s){ return DOM[s] || makeEl(s); },
    querySelectorAll(){ return []; },
    createElement(tag){ return makeEl(tag); },
    addEventListener(){},
    dispatchEvent(){}
  },
  window:{ addEventListener(){}, showDirectoryPicker:null },
  Option: function(text,value){ const e=makeEl("option"); e.value=value??text; e.textContent=text; return e; },
  Event: function(n){ return {type:n}; },
  setTimeout, alert(){}
};
sandbox.self = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(core, sandbox);
/* strip the auto-boot at the end — we drive it manually */
vm.runInContext(pageScript.replace(/\nboot\(\);\s*$/, "\n"), sandbox);
/* const/let at script top level live in the global lexical scope, not on the
   context object, so they are invisible as sandbox.X. A third script in the
   same context can see them and copy them across. */
vm.runInContext(`
  globalThis.SEED=SEED; globalThis.RC=RC; globalThis.S=S;
  globalThis.parseFM=parseFM; globalThis.save=save; globalThis.setMode=setMode;
  globalThis.clearForm=clearForm; globalThis.onAction=onAction;
  globalThis.loadPasted=loadPasted; globalThis.buildActions=buildActions;
  globalThis.positionNoteId=positionNoteId;
  globalThis.buildRecord=buildRecord;
  globalThis.POSITION_ACTIONS=POSITION_ACTIONS; globalThis.validateRecord=validateRecord;
`, sandbox);

/* seed config + a fake connected folder */
sandbox.RC.cfg = JSON.parse(JSON.stringify(sandbox.SEED));
sandbox.RC.dir = dirHandle("/root");
sandbox.buildActions();
DOM["#f_contrib"].value = "Evan Jones";

const set = (id,v) => { DOM["#"+id].value = v; };
const lastNote = () => {
  const k = Object.keys(FILES).filter(x=>x.endsWith("note.md")).pop();
  return { path:k, fm:sandbox.parseFM(FILES[k]) };
};
const reset = () => { for(const k in FILES) delete FILES[k]; sandbox.clearForm(true); };

/* ================= Quick Note ========================================== */
reset();
sandbox.setMode("Note");
eq("mode set", sandbox.S.mode, "Note");
t("company block hidden", DOM["#blk_company"].classList.contains("hide"));
t("theme block hidden",   DOM["#blk_theme"].classList.contains("hide"));
t("note block shown",    !DOM["#blk_note"].classList.contains("hide"));
t("price targets hidden", DOM["#blk_pt"].classList.contains("hide"));

set("f_date","2026-09-07"); set("f_subject","Brazil rate path");
set("f_action","observation"); set("f_why","curve is pricing cuts the fiscal path can't support");
set("f_note","Watched the COPOM statement.");
sandbox.onAction();

(async () => {
  await sandbox.save();
  let n = lastNote();
  eq("Note saved with record_type Note", n.fm.record_type, "Note");
  eq("entity defaults to subject", n.fm.entity, "Brazil rate path");
  eq("no ticker", n.fm.ticker, null);
  eq("action stored", n.fm.action, "observation");
  eq("why stored", n.fm.why, "curve is pricing cuts the fiscal path can't support");
  eq("origin app", n.fm.origin, "app");
  eq("conviction null on Note", n.fm.conviction, null);
  eq("price targets null on Note", [n.fm.price_target_buy,n.fm.price_target_sell], [null,null]);
  t("Brazil auto-tagged", (n.fm.tags||[]).indexOf("Brazil") >= 0);
  t("path uses initials", n.path.indexOf("2026-09-07_ej_brazil-rate-path") >= 0);
  eq("body written", n.fm._body, "Watched the COPOM statement.");

  /* explicit topic overrides the subject default */
  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","COPOM held again");
  set("f_topic","Brazil"); set("f_action","observation"); set("f_why","w");
  await sandbox.save();
  eq("explicit topic wins", lastNote().fm.entity, "Brazil");

  /* ================= validation blocks =================================== */
  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","No action here"); set("f_why","w");
  set("f_action","");
  await sandbox.save();
  eq("missing action blocks the write", Object.keys(FILES).length, 0);
  t("error surfaced", DOM["#msg"].textContent.indexOf("Action") >= 0);

  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","No why"); set("f_action","pass"); set("f_why","");
  await sandbox.save();
  eq("missing why blocks the write", Object.keys(FILES).length, 0);

  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","Reference"); set("f_action","reference"); set("f_why","");
  await sandbox.save();
  eq("reference needs no why", Object.keys(FILES).filter(k=>k.endsWith("note.md")).length, 1);

  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","No ticker"); set("f_entity","Wolfspeed Inc");
  set("f_ticker",""); set("f_action","pass"); set("f_why","w");
  await sandbox.save();
  eq("Company without ticker blocks", Object.keys(FILES).length, 0);

  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","Decimal target"); set("f_entity","Wolfspeed Inc");
  set("f_ticker","WOLF"); set("f_action","initiate"); set("f_why","w"); set("f_ptb","62.5");
  await sandbox.save();
  eq("decimal price target blocks", Object.keys(FILES).length, 0);

  /* ================= Company happy path ================================= */
  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","Wolfspeed initiate");
  set("f_entity","Wolfspeed Inc"); set("f_ticker","WOLF");
  DOM["#f_listed"].checked = true;
  set("f_action","initiate"); set("f_why","capacity ramp is funded and the market hasn't marked it");
  set("f_ptb","62"); set("f_pts","95"); set("f_conv","Med");
  set("f_outcome","2026-12-01"); sandbox.onAction();
  set("f_note","Semis are rolling over but this one is idiosyncratic.");
  await sandbox.save();
  let c = lastNote();
  eq("Company record_type", c.fm.record_type, "Company");
  eq("ticker stored", c.fm.ticker, "WOLF");
  eq("listed true", c.fm.listed, "true");
  eq("buy target int", c.fm.price_target_buy, "62");
  eq("sell target int", c.fm.price_target_sell, "95");
  eq("conviction", c.fm.conviction, "Med");
  eq("outcome_check_date kept for initiate", c.fm.outcome_check_date, "2026-12-01");
  eq("source null when not observation", c.fm.source, null);
  t("Semiconductors tagged", (c.fm.tags||[]).indexOf("Semiconductors") >= 0);

  /* source only survives on an observation */
  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","Wolfspeed read");
  set("f_entity","Wolfspeed Inc"); set("f_ticker","WOLF");
  set("f_action","observation"); set("f_why","w");
  set("f_source","SemiAnalysis"); set("f_outcome","2026-12-01");
  sandbox.onAction();
  t("source row shown for observation", !DOM["#row_source"].classList.contains("hide"));
  t("outcome row hidden for observation", DOM["#row_outcome"].classList.contains("hide"));
  await sandbox.save();
  let o = lastNote();
  eq("source stored on observation", o.fm.source, "SemiAnalysis");
  eq("outcome dropped for observation", o.fm.outcome_check_date, null);

  /* ================= Theme ============================================== */
  reset(); sandbox.setMode("Theme");
  DOM["#f_theme"].value = "Physical AI";
  set("f_date","2026-09-07"); set("f_subject","Physical AI capex");
  set("f_action","observation"); set("f_why","w");
  sandbox.S.tickers = ["NVDA","P.SECURITIZE"];
  await sandbox.save();
  let th = lastNote();
  eq("Theme record_type", th.fm.record_type, "Theme");
  eq("theme entity", th.fm.entity, "Physical AI");
  eq("tickers list", th.fm.tickers, ["NVDA","P.SECURITIZE"]);
  eq("no single ticker", th.fm.ticker, null);

  /* ================= review_date drives review_status =================== */
  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","Catalyst watch");
  set("f_action","observation"); set("f_why","w"); set("f_review","2026-10-15");
  await sandbox.save();
  let r = lastNote();
  eq("review_date stored", r.fm.review_date, "2026-10-15");
  eq("review_status Pending", r.fm.review_status, "Pending");

  reset(); sandbox.setMode("Note");
  set("f_date","2026-09-07"); set("f_subject","No catalyst");
  set("f_action","observation"); set("f_why","w"); set("f_review","");
  await sandbox.save();
  eq("no review_date -> null status", lastNote().fm.review_status, null);

  /* ================= paste loader ======================================= */
  reset();
  DOM["#pastebox"].value =
    "---\nrecord_type: Note\ndate: 2026-09-07\nsubject: Wolfspeed SiC capacity\n"
  + "action: observation\nwhy: \"capacity adds don't square with the pricing\"\n"
  + "source: SemiAnalysis\ntags: [\"Semiconductors\", \"Invented Tag\"]\n---\n\n"
  + "Body from Claude.";
  sandbox.loadPasted();
  eq("paste sets mode", sandbox.S.mode, "Note");
  eq("paste sets subject", DOM["#f_subject"].value, "Wolfspeed SiC capacity");
  eq("paste sets action", DOM["#f_action"].value, "observation");
  eq("paste sets why", DOM["#f_why"].value, "capacity adds don't square with the pricing");
  eq("paste sets body", DOM["#f_note"].value, "Body from Claude.");
  t("valid tag kept", sandbox.S.manual.has("Semiconductors"));
  t("invented tag dropped", !sandbox.S.manual.has("Invented Tag"));
  t("drop reported", DOM["#pastemsg"].textContent.indexOf("Invented Tag") >= 0);
  eq("nothing written on load", Object.keys(FILES).length, 0);
  await sandbox.save();
  eq("saves after paste", lastNote().fm.subject, "Wolfspeed SiC capacity");

  /* email-style header block through the same box */
  reset();
  DOM["#pastebox"].value =
    "TICKER: WOLF\nCOMPANY: Wolfspeed Inc\nTYPE: Company\nACTION: pass\n"
  + "BUY TARGET: 42\nWHY: capacity ramp isn't funded\n\nSent from my phone.";
  sandbox.loadPasted();
  eq("email header sets mode", sandbox.S.mode, "Company");
  eq("email header ticker", DOM["#f_ticker"].value, "WOLF");
  eq("email header entity", DOM["#f_entity"].value, "Wolfspeed Inc");
  eq("email header buy target", DOM["#f_ptb"].value, "42");
  eq("email header body", DOM["#f_note"].value, "Sent from my phone.");

  /* ================= clearForm ========================================== */
  reset();
  eq("action cleared", DOM["#f_action"].value, "");
  eq("why cleared", DOM["#f_why"].value, "");
  eq("source cleared", DOM["#f_source"].value, "");
  eq("outcome cleared", DOM["#f_outcome"].value, "");
  eq("topic cleared", DOM["#f_topic"].value, "");
  eq("pastebox cleared", DOM["#pastebox"].value, "");

  /* ================= strategy ========================================== */
  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","Wolfspeed trim");
  set("f_entity","Wolfspeed Inc"); set("f_ticker","WOLF");
  set("f_action","trim"); set("f_why","sizing, not thesis");
  set("f_strategy","Direct Global Ideas");
  await sandbox.save();
  eq("strategy stored", lastNote().fm.strategy, "Direct Global Ideas");

  /* off-vocabulary strategy is rejected */
  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","Bad strategy");
  set("f_entity","Wolfspeed Inc"); set("f_ticker","WOLF");
  set("f_action","trim"); set("f_why","w"); set("f_strategy","DirectUS");
  await sandbox.save();
  eq("invented strategy blocks the write", Object.keys(FILES).length, 0);

  /* position action with no strategy warns but saves */
  reset(); sandbox.setMode("Company");
  set("f_date","2026-09-07"); set("f_subject","No strategy");
  set("f_entity","Wolfspeed Inc"); set("f_ticker","WOLF");
  set("f_action","initiate"); set("f_why","w"); set("f_strategy","");
  await sandbox.save();
  eq("no strategy still saves", lastNote().fm.strategy, null);
  t("warning surfaced", DOM["#banner"].textContent.indexOf("strategy") >= 0);

  /* strategy survives clearForm — it is sticky on purpose */
  set("f_strategy","Direct US"); sandbox.clearForm(true);
  eq("strategy sticky across clear", DOM["#f_strategy"].value, "Direct US");

  /* two strategies, same name, same day — distinct ids */
  eq("positionNoteId separates strategies",
     [sandbox.positionNoteId("2026-09-07","Wolfspeed","Evan Jones","Direct Global Ideas"),
      sandbox.positionNoteId("2026-09-07","Wolfspeed","Evan Jones","Direct US")],
     ["2026-09-07_ej_wolfspeed_direct-global-ideas",
      "2026-09-07_ej_wolfspeed_direct-us"]);

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
