/* ==========================================================================
   rc-core.js  —  shared runtime for DUMAC Research Capture
   Loaded by entry.html, reports.html and admin.html.

   Holds: folder handle plumbing, _config.json load/save, frontmatter
   read/write, the tag matcher, and the note walker.

   Nothing in here needs editing day to day. The taxonomy, themes and
   contributor list live in _config.json inside the NOTES parent folder and
   are edited from the Admin page. SEED below is only used to create that
   file the very first time.
   ========================================================================== */

/* ---------- small helpers ------------------------------------------------ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const RC = {
  dir: null,          // FileSystemDirectoryHandle for the parent folder
  pending: null,      // handle awaiting a permission re-grant
  cfg: null,          // parsed _config.json
  notes: null         // cache of walkNotes()
};

/* Initials for note_id.  "Evan Jones" -> "ej",  "Ana Anderson" -> "aa" */
function initials(name){
  const p = String(name||"").trim().split(/\s+/).filter(Boolean);
  if(!p.length) return "xx";
  const s = (p[0][0] + (p.length>1 ? p[p.length-1][0] : p[0][1]||"")).toLowerCase();
  return s.replace(/[^a-z]/g,"") || "xx";
}

function slug(s){
  return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-")
         .replace(/^-+|-+$/g,"").slice(0,60) || "note";
}

/* Values containing ": " or "#" or unusual punctuation get JSON-quoted so
   the flat parser can round-trip them without a YAML library. */
function yamlStr(v){
  if(v===null||v===undefined||v==="") return "";
  const s=String(v);
  // ": " (colon-space) is the delimiter, so a bare colon inside an ISO
  // timestamp is safe — parseFM splits on the FIRST colon only.
  return /^[A-Za-z0-9][A-Za-z0-9 .,&()\/'+:_-]*$/.test(s) && !/: |#/.test(s)
    ? s : JSON.stringify(s);
}
function unq(s){
  s=String(s).trim();
  if(s.length>1 && s.startsWith('"') && s.endsWith('"')){
    try{ return JSON.parse(s); }catch(e){ return s.slice(1,-1); }
  }
  return s;
}

/* ---------- IndexedDB: the folder handle -------------------------------- */
const idb = {
  db(){ return new Promise((res,rej)=>{
    const r = indexedDB.open("research-capture",1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async get(k){ const d=await this.db(); return new Promise((res,rej)=>{
    const q=d.transaction("kv").objectStore("kv").get(k);
    q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); },
  async set(k,v){ const d=await this.db(); return new Promise((res,rej)=>{
    const t=d.transaction("kv","readwrite"); t.objectStore("kv").put(v,k);
    t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); }); }
};

/* ---------- folder plumbing --------------------------------------------- */
async function pickFolder(){
  if(!window.showDirectoryPicker){
    alert("This browser cannot write files.\n\nUse Chrome or Edge, and make sure "
        + "the page is served over https:// (or opened as a file://).");
    return false;
  }
  try{
    const h=await window.showDirectoryPicker({mode:"readwrite"});
    RC.dir=h; RC.pending=null; await idb.set("dir",h);
    RC.notes=null; showFolder(); return true;
  }catch(e){ return false; }
}
async function restoreFolder(){
  try{
    const h=await idb.get("dir");
    if(!h){ showFolder(); return; }
    if(await h.queryPermission({mode:"readwrite"})==="granted") RC.dir=h;
    else RC.pending=h;
  }catch(e){}
  showFolder();
}
function showFolder(){
  const b=$("#folder"); if(!b) return;
  if(RC.dir){ b.className="badge on"; b.textContent=RC.dir.name; b.onclick=null; }
  else if(RC.pending){
    b.className="badge off"; b.textContent="click to reconnect";
    b.onclick=async()=>{
      if(await RC.pending.requestPermission({mode:"readwrite"})==="granted"){
        RC.dir=RC.pending; RC.pending=null; RC.notes=null;
        showFolder(); document.dispatchEvent(new Event("rc-folder"));
      }};
  }else{
    b.className="badge off"; b.textContent="choose folder";
    b.onclick=async()=>{ if(await pickFolder()) document.dispatchEvent(new Event("rc-folder")); };
  }
}
async function subdir(root,parts){
  let d=root;
  for(const p of parts) d=await d.getDirectoryHandle(p,{create:true});
  return d;
}
async function dirExists(dir,name){
  try{ await dir.getDirectoryHandle(name); return true; }catch(e){ return false; }
}
async function writeFile(dir,name,data){
  const fh=await dir.getFileHandle(name,{create:true});
  const w=await fh.createWritable(); await w.write(data); await w.close();
}
async function readTextFile(dir,name){
  const fh=await dir.getFileHandle(name);
  return (await fh.getFile()).text();
}

/* ==========================================================================
   SEED CONFIG
   Written to _config.json only if that file does not already exist.
   After first run, edit from the Admin page — not here.
   ========================================================================== */
const SEED = {
  config_version: 1,
  config_updated: null,
  config_updated_by: null,
  maxTags: 8,
  contributors: ["Evan Jones","Ana Anderson","Brandon Gall","William Hockett","Ian Jennings"],
  themes: ["Asset Tokenization","Crypto Asset Beneficiaries","Physical AI",
           "PQC Migration","Cybersecurity Tailwind","Energy Transition"],
  taxonomy: {
  "AQR":{"AQR":"s"},
  "ASEAN":{"ASEAN":"n"},
  "Aerospace & Defense":{"Aerospace & Defense":"n","Aero":"n","Defense":"a","Aerospace":"n","A&D":"s"},
  "Africa":{"Africa":"n"},
  "Analysts":{"Analysts":"a"},
  "Artificial Intelligence":{"Artificial Intelligence":"n","AI":"s","ArtificialIntelligence":"n"},
  "Asset Allocation":{"Asset Allocation":"n","AA":"s","AssetAllocation":"n"},
  "BioTech":{"BioTech":"n"},
  "Bitcoin":{"Bitcoin":"n","BTC":"s"},
  "Blockchain":{"Blockchain":"n"},
  "Books":{"Books":"a"},
  "Brazil":{"Brazil":"n","BR":"s"},
  "Bridgewater":{"Bridgewater":"n"},
  "Bubbles & Manias":{"Bubbles & Manias":"n","Bubbles":"n","Manias":"n"},
  "Cannabis":{"Cannabis":"n"},
  "Carbon":{"Carbon":"n"},
  "Carbon Allowances":{"Carbon Allowances":"n","CarbonAllowances":"n","CCA":"s"},
  "Casinos & Gaming":{"Casinos & Gaming":"n","Casinos":"n","Gaming":"n"},
  "Chile":{"Chile":"n","CL":"s"},
  "China":{"China":"n","CN":"s"},
  "Climate Change":{"Climate Change":"n","Climate":"n","ClimateChange":"n"},
  "Colombia":{"Colombia":"n"},
  "Commodities":{"Commodities":"n"},
  "Commodity Futures":{"Commodity Futures":"n","CmdtyFutures":"n","CommodityFutures":"n"},
  "Communication Services":{"Communication Services":"n","CommServices":"n","CommunicationServices":"n"},
  "Company Research":{"Company Research":"n","Research":"a","CompanyResearch":"n"},
  "Conference":{"Conference":"a"},
  "Consumer":{"Consumer":"n"},
  "Consumer Discretionary":{"Consumer Discretionary":"n","ConsDisc":"n","ConsumerDiscretionary":"n","Discretionary":"n"},
  "Consumer Staples":{"Consumer Staples":"n","Staples":"n","ConsumerStaples":"n"},
  "Copper":{"Copper":"n"},
  "Corporate Profits":{"Corporate Profits":"n","CorpProfits":"n","CorporateProfits":"n","Profits":"a"},
  "Crashes":{"Crashes":"a"},
  "Crypto":{"Crypto":"n"},
  "Cryptography":{"Cryptography":"n"},
  "Currencies":{"Currencies":"n","FX":"s"},
  "Cybersecurity":{"Cybersecurity":"n","Cyber":"n"},
  "Daily Reports":{"Daily Reports":"n","DailyReports":"n","DirectDaily":"n"},
  "Data Centers":{"Data Centers":"n"},
  "De-Globalization":{"De-Globalization":"n","Deglobalization":"n"},
  "Defense RV":{"Defense RV":"n","DefenseRV":"n"},
  "Deflation":{"Deflation":"n"},
  "Demographics":{"Demographics":"n"},
  "Direct Process":{"Direct Process":"n","Process":"a"},
  "Drones":{"Drones":"n"},
  "E-Commerce":{"E-Commerce":"n","Ecommerce":"n","Ecomm":"n"},
  "ESG":{"ESG":"s"},
  "Edge Computing":{"Edge Computing":"n"},
  "Egypt":{"Egypt":"n"},
  "Electric Vehicles":{"Electric Vehicles":"n","EV":"s","EVs":"n"},
  "Emerging Markets":{"Emerging Markets":"n","EM":"s","EmergingMkts":"n"},
  "Endowments":{"Endowments":"n","Peers":"a"},
  "Energy":{"Energy":"n"},
  "Energy Equities":{"Energy Equities":"n","EnergyEquities":"n"},
  "Environments":{"Environments":"n","Macro":"a"},
  "Equity Valuation":{"Equity Valuation":"n","EquityValuation":"n","Valuations":"a","Valuation":"a"},
  "Ethereum":{"Ethereum":"n","ETH":"s"},
  "Europe":{"Europe":"n","EU":"s"},
  "Europe RV":{"Europe RV":"n","EuropeRV":"n"},
  "Factors":{"Factors":"n"},
  "Financial Conditions":{"Financial Conditions":"n","FinancialConditions":"n","FCI":"s"},
  "Financials":{"Financials":"n","Banks":"n"},
  "Fintech":{"Fintech":"n","Payments":"n"},
  "Frontier":{"Frontier":"a","FrontierMkts":"a"},
  "Fundamental RV":{"Fundamental RV":"n","FundaRV":"n","FundamentalRV":"n"},
  "Fundamentals":{"Fundamentals":"a"},
  "GLP-1s":{"GLP-1s":"n","GLP1":"n","GLP1s":"n","Weightloss":"n","Obesity":"n"},
  "GMO":{"GMO":"s"},
  "Global Ideas":{"Global Ideas":"n","GlobalIdeas":"n","DirectGlobalIdeas":"n"},
  "Gold":{"Gold":"n"},
  "Gold Miners":{"Gold Miners":"n","GoldMiners":"n"},
  "Greece":{"Greece":"n"},
  "Growth":{"Growth":"a"},
  "Hardware":{"Hardware":"n"},
  "Health Care":{"Health Care":"n","Healthcare":"n","HC":"s"},
  "High Yield Credit":{"High Yield Credit":"n","HY":"s","HYCredit":"n","HighYield":"n"},
  "Highly Levered":{"Highly Levered":"n","HighLeverage":"n","HighlyLevered":"n"},
  "Housing":{"Housing":"n","Renovation":"n"},
  "Ideas":{"Ideas":"a","Idea":"a"},
  "India":{"India":"n"},
  "Indicators":{"Indicators":"n"},
  "Industrial Metals":{"Industrial Metals":"n","IndustrialMetals":"n"},
  "Industrials":{"Industrials":"n"},
  "Inflation":{"Inflation":"n","CPI":"s"},
  "Investment Approval":{"Investment Approval":"n","Approval":"n"},
  "Japan":{"Japan":"n"},
  "Korea":{"Korea":"n","SouthKorea":"n"},
  "L1":{"L1":"s"},
  "L2":{"L2":"s"},
  "LatAm":{"LatAm":"n","LatinAmerica":"n"},
  "Lodging":{"Lodging":"n","Hotels":"n","Resorts":"n","Cruises":"n"},
  "Macro Actions":{"Macro Actions":"n","MacroActions":"n"},
  "Manager Termination Exposures":{"Manager Termination Exposures":"n","Termination":"a","Terminations":"a","Termination Exposures":"a","MgrTermination":"a"},
  "Managers":{"Managers":"n"},
  "Market Bottoms":{"Market Bottoms":"n","MktBottoms":"n","MarketBottoms":"n","Bottoms":"a"},
  "Materials":{"Materials":"a"},
  "Metals & Mining":{"Metals & Mining":"n","Metals":"n","Mining":"n","Miners":"n"},
  "Metaverse":{"Metaverse":"n"},
  "Mexico":{"Mexico":"n","MEX":"s","MX":"s"},
  "Momentum":{"Momentum":"a","MOMO":"n"},
  "National Security":{"National Security":"n"},
  "Natural Resources":{"Natural Resources":"n","NR":"s","NatResources":"n","NaturalResources":"n"},
  "Office":{"Office":"a"},
  "Oil & Gas":{"Oil & Gas":"n","Oil":"n","Gas":"n"},
  "Performance Factsheet":{"Performance Factsheet":"n","Factsheet":"n","Factsheets":"n"},
  "Peru":{"Peru":"n"},
  "Pharma":{"Pharma":"n"},
  "Power":{"Power":"a","Electrification":"n","Electrify":"n"},
  "Precious Metals":{"Precious Metals":"n"},
  "Private Credit":{"Private Credit":"n","PrivateCredit":"n"},
  "Private Equity":{"Private Equity":"n","PrivateEquity":"n","PE":"s","Buyout":"n","Privates":"n","Private":"n"},
  "Quality":{"Quality":"a"},
  "Quality RV":{"Quality RV":"n","QualityRV":"n"},
  "Quantum":{"Quantum":"n"},
  "Quantum Computing":{"Quantum Computing":"n","QuantumComputing":"n"},
  "REITs":{"REITs":"n"},
  "RV":{"RV":"s","EquityRV":"n"},
  "Real Estate":{"Real Estate":"n","RE":"s","RealEstate":"n"},
  "Recession":{"Recession":"n"},
  "Restaurants":{"Restaurants":"n","FoodandBev":"n"},
  "Retail":{"Retail":"n"},
  "Robotics":{"Robotics":"n"},
  "Robotics Automation":{"Robotics Automation":"n","Robots":"n","Automation":"n"},
  "SMR":{"SMR":"s"},
  "SaaS":{"SaaS":"n"},
  "Saudi Arabia":{"Saudi Arabia":"n","Saudi":"n","SaudiArabia":"n","Saudis":"n"},
  "Sectors":{"Sectors":"a"},
  "Sell-Side":{"Sell-Side":"n","SellSide":"n"},
  "Semiconductors":{"Semiconductors":"n","Semis":"n"},
  "Short Platform":{"Short Platform":"n","Shorts":"a","ShortPlatform":"n"},
  "Software":{"Software":"n"},
  "South Africa":{"South Africa":"n","SouthAfrica":"n","ZA":"s"},
  "Space":{"Space":"a"},
  "Swaps Financing":{"Swaps Financing":"n","Financing":"a","FinancingCosts":"a"},
  "TCI":{"TCI":"s"},
  "Taiwan":{"Taiwan":"n"},
  "Technicals":{"Technicals":"n"},
  "Technology":{"Technology":"n","Tech":"n","InfoTech":"n"},
  "Themes":{"Themes":"a"},
  "Tokens":{"Tokens":"a","Tokenization":"n","Tokenized":"n","Tokenisation":"n","RWA":"s","Real World Assets":"n","RealWorldAssets":"n"},
  "Transportation":{"Transportation":"n","Trucking":"n","Freight":"n","Rails":"n","Transport":"n"},
  "Turkey":{"Turkey":"n"},
  "United States":{"United States":"n","US":"s","USA":"s"},
  "Uranium":{"Uranium":"n"},
  "Utilities":{"Utilities":"n"},
  "VC Tech Hedge":{"VC Tech Hedge":"n","VCHedge":"n","VCTechHedge":"n"},
  "VMQ RV":{"VMQ RV":"n","VMQRV":"n"},
  "Value":{"Value":"a"},
  "Value RV":{"Value RV":"n","ValueRV":"n"},
  "Variant Perception":{"Variant Perception":"n","VP":"s","VariantPerception":"n"},
  "Venture":{"Venture":"n","VC":"s"},
  "Vietnam":{"Vietnam":"n"},
  "Water":{"Water":"a","PFAS":"n"}
  }
};

/* ---------- config load / save ------------------------------------------ */
async function loadConfig(){
  if(!RC.dir) return null;
  try{
    RC.cfg = JSON.parse(await readTextFile(RC.dir,"_config.json"));
  }catch(e){
    RC.cfg = JSON.parse(JSON.stringify(SEED));
    RC.cfg.config_updated = new Date().toISOString();
    try{ await saveConfig(RC.cfg, "(seeded)"); }catch(e2){}
  }
  // tolerate a hand-edited file that is missing keys
  for(const k of ["contributors","themes","taxonomy","maxTags"])
    if(RC.cfg[k]===undefined) RC.cfg[k]=SEED[k];
  return RC.cfg;
}
async function saveConfig(cfg, who){
  cfg.config_version = (cfg.config_version||0)+1;
  cfg.config_updated = new Date().toISOString();
  cfg.config_updated_by = who || "unknown";
  await writeFile(RC.dir,"_config.json",JSON.stringify(cfg,null,2));
  RC.cfg = cfg;
}
async function appendHistory(entry){
  let prior="";
  try{ prior=await readTextFile(RC.dir,"_config_history.jsonl"); }catch(e){}
  await writeFile(RC.dir,"_config_history.jsonl",
                  prior + JSON.stringify(entry) + "\n");
}

/* ---------- tag matching ------------------------------------------------- */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function hasTerm(term,mode,text){
  if(!text) return false;
  const re = new RegExp("(?<![A-Za-z0-9])"+esc(term)+"(?![A-Za-z0-9])",
                        mode==="s" ? "" : "i");
  return re.test(text);
}
function matchTags(subject,body){
  const tax = (RC.cfg&&RC.cfg.taxonomy) || SEED.taxonomy;
  const hits=[];
  for(const tag in tax){
    const terms=tax[tag];
    let best=null;
    for(const term in terms){
      const mode=terms[term];
      if(hasTerm(term,mode,subject)){ best={term,src:"subject"}; break; }
      if(mode!=="a" && hasTerm(term,mode,body)){ if(!best) best={term,src:"body"}; }
    }
    if(best) hits.push({tag,term:best.term,src:best.src});
  }
  const keep = hits.filter(h => !hits.some(o =>
    o!==h && o.term.length>h.term.length &&
    o.term.toLowerCase().includes(h.term.toLowerCase())));
  keep.sort((a,b)=> a.src!==b.src ? (a.src==="subject"?-1:1)
                                  : b.term.length-a.term.length);
  return keep;
}

/* ---------- frontmatter -------------------------------------------------- */
function parseFM(text){
  const m=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if(!m) return null;
  const o={};
  for(const line of m[1].split(/\r?\n/)){
    const i=line.indexOf(":"); if(i<0) continue;
    const k=line.slice(0,i).trim(); const v=line.slice(i+1).trim();
    if(v.startsWith("[")&&v.endsWith("]")){
      try{ o[k]=JSON.parse(v); }
      catch(e){ const inner=v.slice(1,-1).trim();
                o[k]=inner?inner.split(",").map(unq):[]; }
    } else if(v==="") o[k]=null;
    else o[k]=unq(v);
  }
  o._body=text.slice(m[0].length).trim();
  return o;
}

/* Field order is fixed so hand-inspection of note.md is predictable. */
const FM_ORDER = ["note_id","date","created","last_updated","contributor",
  "record_type","entity","ticker","listed","tickers","subject","tags",
  "attachments","price_target_buy","price_target_sell","conviction",
  "review_date","review_status","priority","revision"];

function buildFM(rec, body){
  const out=["---"];
  for(const k of FM_ORDER){
    const v=rec[k];
    if(Array.isArray(v))
      out.push(k+": ["+v.map(x=>JSON.stringify(String(x))).join(", ")+"]");
    else if(v===true||v===false) out.push(k+": "+v);
    else out.push(k+": "+(v===null||v===undefined?"":yamlStr(v)));
  }
  out.push("---");
  return out.join("\n")+"\n\n"+String(body||"").trim()+"\n";
}

/* ---------- reading the corpus ------------------------------------------ */
/* Flat shared tree:  NOTES/YYYY/MM/<note_id>/note.md
   note_id carries contributor initials so two people cannot collide. */
async function notesRoot(create){
  return RC.dir.getDirectoryHandle("NOTES",{create:!!create});
}
async function walkNotes(force){
  if(RC.notes && !force) return RC.notes;
  const out=[];
  let root;
  try{ root=await notesRoot(false); }catch(e){ RC.notes=[]; return RC.notes; }
  for await (const [yn,yh] of root.entries()){
    if(yh.kind!=="directory"||!/^\d{4}$/.test(yn)) continue;
    for await (const [mn,mh] of yh.entries()){
      if(mh.kind!=="directory"||!/^\d{2}$/.test(mn)) continue;
      for await (const [nn,nh] of mh.entries()){
        if(nh.kind!=="directory") continue;
        try{
          const fm=parseFM(await readTextFile(nh,"note.md"));
          if(fm){ fm._path=[yn,mn,nn]; out.push(fm); }
        }catch(e){}
      }
    }
  }
  out.sort((a,b)=>String(b.note_id).localeCompare(String(a.note_id)));
  RC.notes=out;
  return out;
}
/* Rewrite one note's raw text, preserving everything not touched. */
async function rewriteNote(n, mutate){
  const root=await notesRoot(false);
  const dir=await subdir(root,[n._path[0],n._path[1]]);
  const nd=await dir.getDirectoryHandle(n._path[2]);
  let text=await readTextFile(nd,"note.md");
  text=mutate(text);
  await writeFile(nd,"note.md",text);
}
/* Replace a single frontmatter line by key, leaving body and other keys alone. */
function setFMLine(text,key,rendered){
  const re=new RegExp("^"+esc(key)+":.*$","m");
  const head=text.match(/^---\r?\n[\s\S]*?\r?\n---/);
  if(!head) return text;
  let block=head[0];
  block = re.test(block) ? block.replace(re, key+": "+rendered)
                         : block.replace(/\r?\n---$/, "\n"+key+": "+rendered+"\n---");
  return block + text.slice(head[0].length);
}
function bumpRevision(text){
  const m=text.match(/^revision:\s*(\d+)\s*$/m);
  const next=m?parseInt(m[1],10)+1:1;
  return setFMLine(text,"revision",String(next));
}

/* ---------- shared UI bits ---------------------------------------------- */
function fmtDate(d){ return d? String(d).slice(0,10) : ""; }
function ageDays(d){
  if(!d) return null;
  const t=Date.parse(String(d).slice(0,10)+"T00:00:00Z");
  if(isNaN(t)) return null;
  return Math.floor((Date.now()-t)/86400000);
}
function ageLabel(d){
  const n=ageDays(d); if(n===null) return "";
  if(n<1) return "today";
  if(n<31) return n+"d";
  if(n<365) return Math.round(n/30)+" mo";
  return (n/365).toFixed(1)+" yr";
}
function el(tag,cls,txt){
  const e=document.createElement(tag);
  if(cls) e.className=cls;
  if(txt!==undefined) e.textContent=txt;
  return e;
}
function esc_html(s){
  return String(s==null?"":s).replace(/[&<>"']/g,
    c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
