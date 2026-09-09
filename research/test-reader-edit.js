/* Round-trips the reader edit strip's write path against the real rc-core
   functions: setFMLine + last_updated + bumpRevision, then parseFM back. */
global.document={querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({})};
global.window=undefined;
const fs=require('fs');
let src=fs.readFileSync('rc-core.js','utf8');
const ctx={module:{exports:{}},console,Date,JSON,RegExp,Math,parseInt,String,Object,Array,document:global.document};
const vm=require('vm'); vm.createContext(ctx);
vm.runInContext(src.replace(/\bconst idb = \{[\s\S]*?\n\};/, 'const idb={};'),ctx);
const {parseFM,buildFM,setFMLine,bumpRevision,yamlStr,canSetWhy,resolveTagNames,SEED}=ctx;

let pass=0,fail=0;
const ok=(c,m)=>{ c?pass++:(fail++,console.log("FAIL: "+m)); };

const rec={note_id:"2026-09-09_ej_test",date:"2026-09-09",created:"x",last_updated:"x",
  contributor:"Evan Jones",origin:"app",record_type:"Company",entity:"Wolfspeed",
  ticker:"WOLF",listed:true,tickers:[],subject:"SiC capacity",strategy:null,
  action:"observation",why:null,source:null,outcome_check_date:null,
  tags:["Semiconductors"],attachments:[],price_target_buy:null,price_target_sell:null,
  bias:null,review_date:null,review_status:null,priority:null,revision:1};
let text=buildFM(rec,"Body text: with a colon.");

// mirror rdRender / rdRenderList / rdSave exactly
const rdRender=v=>(v===null||v===undefined||v==="")?"":yamlStr(v);
const rdRenderList=a=>"["+a.map(x=>JSON.stringify(String(x))).join(", ")+"]";
function save(text,pairs){
  for(const [k,v] of pairs) text=setFMLine(text,k,v);
  text=setFMLine(text,"last_updated",rdRender(new Date().toISOString()));
  return bumpRevision(text);
}

// 1. review date + status
text=save(text,[["review_date",rdRender("2026-12-01")],["review_status",rdRender("Pending")]]);
let p=parseFM(text);
ok(p.review_date==="2026-12-01","review_date "+p.review_date);
ok(p.review_status==="Pending","review_status");
ok(p.revision==="2","revision bumped, got "+p.revision);
ok(p._body==="Body text: with a colon.","body intact: "+p._body);

// 2. clearing the date unschedules
let t2=save(text,[["review_date",rdRender("")],["review_status",rdRender("")]]);
p=parseFM(t2);
ok(p.review_date===null&&p.review_status===null,"cleared to null");

// 3. tags multi-select round trip, incl. a comma-bearing tag
text=save(text,[["tags",rdRenderList(["Semiconductors","United States","Oil, Gas"])]]);
p=parseFM(text);
ok(Array.isArray(p.tags)&&p.tags.length===3,"tags parse as array of 3, got "+JSON.stringify(p.tags));
ok(p.tags[2]==="Oil, Gas","comma inside a tag survives: "+p.tags[2]);

// 4. why write-once
ok(canSetWhy(p.why),"why blank is settable");
text=save(text,[["why",rdRender("capacity adds don't square with pricing")]]);
p=parseFM(text);
ok(p.why==="capacity adds don't square with pricing","why written: "+p.why);
ok(!canSetWhy(p.why),"why now frozen");

// 5. a key absent from the file gets appended, not dropped
const thin="---\nnote_id: x\ndate: 2026-01-01\nrevision: 1\n---\n\nbody\n";
p=parseFM(save(thin,[["priority",rdRender("High")]]));
ok(p.priority==="High","priority appended to a thin record");
ok(p.note_id==="x"&&p._body==="body","thin record otherwise intact");

// 6. quoting: a why containing ": " must survive
p=parseFM(save(text,[["outcome_check_date",rdRender("2027-03-01")]]));
ok(p.outcome_check_date==="2027-03-01","outcome_check_date");
const q=parseFM(save(thin,[["priority",rdRender("Watch: Q1")]]));
ok(q.priority==="Watch: Q1","colon-space value quoted and recovered: "+q.priority);

// 7. invented tags are still droppable through the taxonomy resolver
const r=resolveTagNames(["Semiconductors","Not A Real Tag"],SEED);
ok(r.missing.length===1,"resolveTagNames still drops invented tags");

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
