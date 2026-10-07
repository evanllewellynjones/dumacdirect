/* ==========================================================================
   rc-chart.js  —  price chart with targets and trades (v1.6 §18)
   Loaded by reports.html after rc-core.js. Hand-rolled inline SVG, no
   dependency (§18.2 decision 9).

   rc-core.js decides WHAT is drawn — buildTargetSteps, tradesToMarkers,
   presetRange, parseFmpHistory are pure and unit-tested there. This file only
   fetches, lays out and draws, so nothing in here needs a Node test.

   One public entry point:
     RCChart.open({ ticker, name, records, cfg, viewer, noPrice, onOpenRecord,
                    today })          // today: tests only, defaults to the clock
   records = every Company and Trade record on the ticker. The chart opens in
   its own modal, which sits under the note reader (z-index 190 vs 200), so
   clicking a step or marker opens the reader on top and closing the reader
   lands back on the chart.

   Colours: buy and sell are a validated pair — the obvious red/green fails
   deuteranope separation (ΔE 3.5), so sell is a lighter red (ΔE 12). Side is
   never colour-alone anyway: every step carries a Buy/Sell label.
   ========================================================================== */
const RCChart = (()=>{

  const DASH = ["5 4","1.5 3.5","9 3 2 3","3 3","12 4","6 2 1.5 2"];
  const H = 380, M = { l:58, r:92, t:14, b:28 };
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const SVGNS = "http://www.w3.org/2000/svg";
  const PRESET_LABEL = { "6M":"6M", "1Y":"1Y", "3Y":"3Y", first:"Since first target" };
  let S = null;          // state of the open chart, null when closed
  let GEN = 0;           // bumps on every fetch, so a slow response for an old
                         // range cannot overwrite a newer one

  /* ---------- small helpers ---------- */
  const today = () => new Date().toISOString().slice(0,10);
  const day = d => Date.parse(String(d).slice(0,10)+"T00:00:00Z")/86400000;
  const fmtN = v => Number(v).toLocaleString(undefined,{maximumFractionDigits:2});
  const fmtD = d => { const p=String(d).split("-"); return MON[+p[1]-1]+" "+(+p[2])+", "+p[0]; };
  function svg(tag, attrs, style){
    const e = document.createElementNS(SVGNS, tag);
    for(const k in (attrs||{})) e.setAttribute(k, attrs[k]);
    for(const k in (style||{})) e.style.setProperty(k, style[k]);
    return e;
  }
  function initialsOf(name){
    const p = String(name||"").trim().split(/\s+/).filter(Boolean);
    return p.length ? (p[0][0]+(p.length>1?p[p.length-1][0]:"")).toUpperCase() : "?";
  }

  /* ---------- styles, injected once so reports.html needs no CSS edit ---------- */
  function injectCss(){
    if(document.getElementById("rcch-style")) return;
    const st = document.createElement("style"); st.id = "rcch-style";
    st.textContent = `
.rcch{--chart-buy:#1a6335;--chart-sell:#e8606a;--chart-price:var(--navy,#1e3a5f);
  --chart-grid:var(--line,#d8dee8);--chart-axis:var(--mut,#39424f);z-index:190}
.rcch .box{max-width:1120px}
.rcch .bd{padding:10px 16px 14px}
.rcch-bar{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:6px}
.rcch-bar .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--navy);
  font-weight:700;margin-right:3px;min-width:86px}
.rcch-chip{font:500 12px "Segoe UI",system-ui,sans-serif;border:1px solid var(--line);
  border-radius:10px;padding:2px 10px;cursor:pointer;background:var(--panel);color:var(--mut)}
.rcch-chip[aria-pressed=true]{background:var(--accent-sub);color:var(--accent);
  border-color:#b9cee6;font-weight:600}
.rcch-preset[aria-pressed=true]{background:var(--navy);color:#fff;border-color:var(--navy)}
.rcch-status{font-size:12px;color:var(--mut);min-height:17px;margin:2px 0 4px}
.rcch-status.warn{color:var(--warn)}
.rcch-plot{position:relative;border:1px solid var(--line);border-radius:4px;background:var(--panel)}
.rcch-plot svg{display:block;width:100%;font-family:"Segoe UI",system-ui,sans-serif}
.rcch-tip{position:absolute;pointer-events:none;background:var(--panel);border:1px solid var(--line);
  border-radius:4px;box-shadow:0 4px 14px rgba(10,37,64,.16);padding:6px 9px;font-size:12px;
  line-height:1.4;max-width:330px;display:none;z-index:2;color:var(--ink)}
.rcch-tip .t{font-weight:600;color:var(--navy-deep)}
.rcch-tip .m{color:var(--mut);font-size:11.5px}
.rcch-tip .w{margin-top:3px}
.rcch-tip .h{color:var(--mut);font-size:11px;margin-top:4px;font-style:italic}
.rcch-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--mut);margin-top:6px}
.rcch-legend span{display:inline-flex;align-items:center;gap:5px}
.rcch-legend i{display:inline-block;width:22px;height:0;border-top:2px solid}
.rcch-legend i.d{border-top-style:dashed}
.rcch details{margin-top:8px}
.rcch details table{margin-top:4px}
.rcch .hit{cursor:pointer}`;
    document.head.appendChild(st);
  }

  /* ---------- the modal shell, built once ---------- */
  function shell(){
    let m = document.getElementById("chart");
    if(m) return m;
    injectCss();
    m = document.createElement("div");
    m.className = "modal rcch"; m.id = "chart";
    m.innerHTML = `
<div class="box">
  <div class="hd">
    <h3 id="ch_title"></h3>
    <button class="btn" id="ch_png" title="Download this chart as a PNG">Export PNG</button>
    <button class="btn" id="ch_close">Close</button>
  </div>
  <div class="bd">
    <div class="rcch-bar" id="ch_presets"><span class="lbl">Range</span></div>
    <div class="rcch-bar" id="ch_who"><span class="lbl">Targets by</span></div>
    <div class="rcch-bar" id="ch_strat"><span class="lbl">Trades in</span></div>
    <div class="rcch-status" id="ch_status"></div>
    <div class="rcch-plot" id="ch_plot"><div class="rcch-tip" id="ch_tip"></div></div>
    <div class="rcch-legend" id="ch_legend"></div>
    <details id="ch_data"><summary>Data behind the chart</summary><div id="ch_table"></div></details>
  </div>
</div>`;
    document.body.appendChild(m);
    m.querySelector("#ch_close").onclick = close;
    m.querySelector("#ch_png").onclick = exportPng;
    m.onclick = e => { if(e.target===m) close(); };
    document.addEventListener("keydown", e => {
      if(e.key!=="Escape" || !S) return;
      const rd = document.getElementById("reader");
      if(rd && rd.classList.contains("show")) return;   // reader closes first
      close();
    });
    let rt=null;
    window.addEventListener("resize", ()=>{ if(!S) return;
      clearTimeout(rt); rt=setTimeout(draw,120); });
    return m;
  }

  /* ---------- open / close ---------- */
  function open(o){
    const m = shell();
    const recs = o.records||[];
    /* Contributor chips: everyone with a target on this name, viewer first.
       Default = the viewer's own lines (§18.2 decision 5a). A viewer with none
       here — or no viewer known — starts with everyone, and the status line
       says so rather than showing an empty chart. */
    const withTargets = [...new Set(buildTargetSteps(recs,[],{}).map(s=>s.contributor))]
      .sort((a,b)=> (a===o.viewer?-1:b===o.viewer?1:a.localeCompare(b)));
    const viewerHas = !!o.viewer && withTargets.indexOf(o.viewer)>=0;
    const strategies = [...new Set([...((o.cfg&&o.cfg.strategies)||[]),
      ...recs.filter(r=>r.record_type==="Trade"&&r.strategy).map(r=>r.strategy)])];
    S = { ticker:o.ticker, name:o.name||"", records:recs, viewer:o.viewer||"",
          noPrice:!!o.noPrice, onOpenRecord:o.onOpenRecord||(()=>{}),
          today:o.today||today(),          // fixed only by the smoke test
          key:(o.cfg&&o.cfg.fmp_api_key)||"",
          contributors:withTargets, who:new Set(viewerHas?[o.viewer]:withTargets),
          viewerNote: withTargets.length && !viewerHas
            ? (o.viewer ? o.viewer+" has no targets on "+o.ticker+" — showing everyone’s."
                        : "Showing everyone’s targets.") : "",
          strategies, strat:new Set(strategies),
          preset:"first", range:null, series:[], priceNote:"", loading:false,
          byId:new Map(recs.map(r=>[r.note_id,r])) };
    m.querySelector("#ch_title").textContent =
      S.ticker + (S.name && S.name!==S.ticker ? "  ·  "+S.name : "") + "  —  price, targets, trades";
    buildControls();
    m.classList.add("show");
    setPreset("first");
  }
  function close(){
    const m = document.getElementById("chart");
    if(m) m.classList.remove("show");
    S = null; GEN++;
  }

  /* ---------- controls ---------- */
  function chip(label, pressed, onclick, cls){
    const b = document.createElement("button");
    b.type = "button"; b.className = "rcch-chip"+(cls?" "+cls:"");
    b.setAttribute("aria-pressed", pressed?"true":"false");
    if(typeof label==="string") b.textContent = label; else b.appendChild(label);
    b.onclick = onclick;
    return b;
  }
  function resetBar(id){
    const bar = document.getElementById(id);
    while(bar.children.length>1) bar.removeChild(bar.lastChild);
    return bar;
  }
  function buildControls(){
    const pb = resetBar("ch_presets");
    for(const p of CHART_PRESETS){
      const b = chip(PRESET_LABEL[p], p===S.preset, ()=>setPreset(p), "rcch-preset");
      b.dataset.preset = p; pb.appendChild(b);
    }
    const wb = resetBar("ch_who");
    if(!S.contributors.length) wb.appendChild(Object.assign(document.createElement("span"),
      {className:"tiny", textContent:"No price targets entered on this name."}));
    S.contributors.forEach((c,i)=>{
      /* the chip shows the contributor's own dash pattern, so the chip row
         doubles as the key once more than one line is on */
      const f = document.createDocumentFragment();
      const sw = svg("svg",{width:"24",height:"6"},{"vertical-align":"middle","margin-right":"5px"});
      sw.appendChild(svg("line",{x1:0,x2:24,y1:3,y2:3},{stroke:"currentColor","stroke-width":"2",
        "stroke-dasharray":DASH[i%DASH.length]}));
      f.appendChild(sw); f.appendChild(document.createTextNode(c));
      const b = chip(f, S.who.has(c), ()=>{
        S.who.has(c) ? S.who.delete(c) : S.who.add(c);
        b.setAttribute("aria-pressed", S.who.has(c)?"true":"false");
        S.viewerNote=""; draw(); });
      b.dataset.who = c; wb.appendChild(b);
    });
    const sb = resetBar("ch_strat");
    S.strategies.forEach(st=>{
      const b = chip(st, S.strat.has(st), ()=>{
        S.strat.has(st) ? S.strat.delete(st) : S.strat.add(st);
        b.setAttribute("aria-pressed", S.strat.has(st)?"true":"false");
        draw(); });
      b.dataset.strat = st; sb.appendChild(b);
    });
  }
  function setPreset(p){
    S.preset = p;
    document.querySelectorAll("#ch_presets .rcch-preset").forEach(b=>
      b.setAttribute("aria-pressed", b.dataset.preset===p?"true":"false"));
    S.range = presetRange(p, S.records, S.viewer, S.today);
    S.series = []; S.loading = true;
    draw();                          // targets and trades now, price when it lands
    loadSeries();
  }

  /* ---------- price ---------- */
  /* Never throws, never blocks: on any failure the targets and trades are
     already drawn and the status line says why there is no price line. */
  async function loadSeries(){
    const g = ++GEN, st = S, r = st.range;
    let series = [], note = "";
    if(st.noPrice) note = "Private or unlisted — no price data.";
    else if(!st.key) note = "Price unavailable — no FMP key in _config.json.";
    else {
      const ck = chartCacheKey(st.ticker, r.from, r.to, st.today);
      try{ const c = JSON.parse(sessionStorage.getItem(ck)||"null"); if(Array.isArray(c)) series = c; }
      catch(e){}
      if(!series.length){
        try{
          const res = await fetch(fmpHistoryUrl(st.ticker, r.from, r.to, st.key));
          if(res.ok) series = parseFmpHistory(await res.json());
          if(series.length){ try{ sessionStorage.setItem(ck, JSON.stringify(series)); }catch(e){} }
        }catch(e){}
        if(!series.length) note = "Price unavailable for "+st.ticker+" — targets and trades drawn without it.";
      }
    }
    if(g!==GEN || S!==st) return;           // range changed or chart closed meanwhile
    st.series = series; st.priceNote = note; st.loading = false;
    draw();
  }

  /* ---------- scales ---------- */
  function niceTicks(lo, hi, n){
    const span = hi-lo || Math.abs(hi) || 1;
    const raw = span/n, mag = Math.pow(10, Math.floor(Math.log10(raw))), e = raw/mag;
    const step = (e>=7.5?10:e>=3.5?5:e>=1.5?2:1)*mag;
    const out = [];
    for(let v=Math.ceil(lo/step)*step; v<=hi+step*1e-6; v+=step) out.push(+v.toFixed(10));
    return out;
  }
  function dateTicks(from, to){
    const span = day(to)-day(from), out = [];
    if(span <= 75){                                  // weekly, on Mondays
      let d = from;
      while(new Date(d+"T00:00:00Z").getUTCDay()!==1) d = isoAddDays(d,1);
      for(; d<=to; d=isoAddDays(d,7)){ const p=d.split("-"); out.push([d, MON[+p[1]-1]+" "+(+p[2])]); }
      return out;
    }
    const months = Math.round(span/30.4), k = Math.max(1, Math.ceil(months/8));
    const steps = [1,2,3,4,6,12,24].find(s=>s>=k) || 24;
    let d = from.slice(0,7)+"-01";
    if(d < from) d = isoAddMonths(d,1);
    for(; d<=to; d=isoAddMonths(d,1)){
      const m = +d.slice(5,7)-1;
      if(m % Math.min(steps,12)) continue;
      if(steps>12 && (+d.slice(0,4)) % (steps/12)) continue;
      out.push([d, steps>=12 ? d.slice(0,4) : MON[m]+" "+d.slice(2,4)]);
    }
    return out;
  }

  /* ---------- draw ---------- */
  function draw(){
    if(!S) return;
    const host = document.getElementById("ch_plot");
    const tip = document.getElementById("ch_tip"); tip.style.display = "none";
    const old = host.querySelector("svg"); if(old) old.remove();

    const r = S.range;
    const who = [...S.who];
    const steps = who.length ? buildTargetSteps(S.records, who, r) : [];
    const allStrat = S.strat.size===S.strategies.length;
    const markers = S.strat.size||!S.strategies.length
      ? tradesToMarkers(S.records, S.series, allStrat?[]:[...S.strat], r) : [];
    const series = S.series.filter(p=>p.date>=r.from && p.date<=r.to);
    S.drawn = { steps, markers, series };

    const status = document.getElementById("ch_status");
    const bits = [];
    if(S.loading) bits.push("Loading price…");
    else if(S.priceNote) bits.push(S.priceNote);
    else if(series.length) bits.push("FMP daily close, not split-adjusted — targets read in the prices of their day.");
    if(S.viewerNote) bits.push(S.viewerNote);
    if(!steps.length && !markers.length && S.contributors.length && !who.length)
      bits.push("No contributor selected.");
    status.textContent = bits.join("  ");
    status.className = "rcch-status"+(S.priceNote&&!S.loading?" warn":"");

    const W = Math.max(360, host.clientWidth||900);
    const pw = W-M.l-M.r, ph = H-M.t-M.b;
    const d0 = day(r.from), d1 = Math.max(day(r.to), d0+1);
    const X = d => M.l + (Math.min(Math.max(day(d),d0),d1)-d0)/(d1-d0)*pw;

    let vals = series.map(p=>p.close).concat(steps.map(s=>s.value))
                     .concat(markers.filter(m=>m.close!==null).map(m=>m.close));
    let lo = vals.length ? Math.min(...vals) : 0, hi = vals.length ? Math.max(...vals) : 1;
    if(lo===hi){ lo -= Math.abs(lo)*0.05||1; hi += Math.abs(hi)*0.05||1; }
    const pad = (hi-lo)*0.08; lo -= pad; hi += pad;
    const yt = niceTicks(lo, hi, 5);
    lo = Math.min(lo, yt[0]); hi = Math.max(hi, yt[yt.length-1]);
    const Y = v => M.t + (1-(v-lo)/(hi-lo))*ph;

    const root = svg("svg", { viewBox:"0 0 "+W+" "+H, width:W, height:H, role:"img",
      "aria-label":S.ticker+" price with targets and trades, "+r.from+" to "+r.to });

    /* grid + axes: recessive */
    const gAx = svg("g");
    for(const v of yt){
      gAx.appendChild(svg("line",{x1:M.l,x2:M.l+pw,y1:Y(v),y2:Y(v)},
        {stroke:"var(--chart-grid)","stroke-width":"1",opacity:"0.7"}));
      const t = svg("text",{x:M.l-7,y:Y(v)+4,"text-anchor":"end"},
        {fill:"var(--chart-axis)","font-size":"11px"});
      t.textContent = fmtN(v); gAx.appendChild(t);
    }
    for(const [d,label] of dateTicks(r.from, r.to)){
      gAx.appendChild(svg("line",{x1:X(d),x2:X(d),y1:M.t+ph,y2:M.t+ph+4},
        {stroke:"var(--chart-axis)","stroke-width":"1"}));
      const t = svg("text",{x:X(d),y:M.t+ph+17,"text-anchor":"middle"},
        {fill:"var(--chart-axis)","font-size":"11px"});
      t.textContent = label; gAx.appendChild(t);
    }
    gAx.appendChild(svg("line",{x1:M.l,x2:M.l+pw,y1:M.t+ph,y2:M.t+ph},
      {stroke:"var(--chart-axis)","stroke-width":"1"}));
    root.appendChild(gAx);

    /* price line */
    if(series.length){
      const dpath = series.map((p,i)=>(i?"L":"M")+X(p.date).toFixed(1)+","+Y(p.close).toFixed(1)).join("");
      root.appendChild(svg("path",{d:dpath},
        {fill:"none",stroke:"var(--chart-price)","stroke-width":"2","stroke-linejoin":"round"}));
    }

    /* crosshair layer sits under the hit targets so a step or marker wins */
    const overlay = svg("rect",{x:M.l,y:M.t,width:pw,height:ph,class:"nx"},
      {fill:"transparent","pointer-events":"all"});
    root.appendChild(overlay);
    const xh = svg("g",{class:"nx"},{display:"none","pointer-events":"none"});
    const xl = svg("line",{y1:M.t,y2:M.t+ph},{stroke:"var(--chart-axis)","stroke-width":"1",
      "stroke-dasharray":"2 3",opacity:"0.8"});
    const xd = svg("circle",{r:4},{fill:"var(--chart-price)",stroke:"var(--panel,#fff)","stroke-width":"2"});
    xh.appendChild(xl); xh.appendChild(xd);

    /* target steps */
    const many = who.length>1;
    const dashOf = c => DASH[Math.max(0,S.contributors.indexOf(c)) % DASH.length];
    const gSt = svg("g"), gHit = svg("g");
    const prevBy = new Map();
    const lastBy = new Map();
    steps.forEach((s,i)=>{
      const col = s.side==="buy" ? "var(--chart-buy)" : "var(--chart-sell)";
      const xa = X(s.from), xb = s.to>=r.to ? X(r.to) : X(isoAddDays(s.to,1)), y = Y(s.value);
      const st = {stroke:col,"stroke-width":"2","stroke-dasharray":dashOf(s.contributor),
                  "stroke-linecap":"butt",fill:"none"};
      const k = s.contributor+"|"+s.side, prev = prevBy.get(k);
      if(prev && isoAddDays(prev.to,1)===s.from)          // riser joins a revision
        gSt.appendChild(svg("line",{x1:xa,x2:xa,y1:Y(prev.value),y2:y},
          Object.assign({},st,{"stroke-width":"1.25",opacity:"0.55"})));
      prevBy.set(k,s); lastBy.set(k,s);
      gSt.appendChild(svg("line",{x1:xa,x2:Math.max(xb,xa+1),y1:y,y2:y},st));
      if(xb-xa > 30){                                     // value at the step start
        const t = svg("text",{x:xa+3,y:y-4},
          {fill:"var(--ink,#12181f)","font-size":"10.5px",opacity:"0.85"});
        t.textContent = (s.side==="buy"?"B ":"S ")+fmtN(s.value);
        gSt.appendChild(t);
      }
      gHit.appendChild(svg("line",{x1:xa,x2:Math.max(xb,xa+1),y1:y,y2:y,class:"hit",
        "data-k":"step","data-i":String(i)},
        {stroke:"transparent","stroke-width":"12","pointer-events":"stroke"}));
    });
    /* direct labels in the right margin for lines still in force at range end */
    const right = [...lastBy.values()].filter(s=>s.to>=r.to)
      .map(s=>({s, y:Y(s.value)})).sort((a,b)=>a.y-b.y);
    for(let i=1;i<right.length;i++) if(right[i].y-right[i-1].y<13) right[i].y=right[i-1].y+13;
    for(const {s,y} of right){
      const t = svg("text",{x:M.l+pw+6,y:y+4},
        {fill:"var(--ink,#12181f)","font-size":"11px","font-weight":"600"});
      t.textContent = (many?initialsOf(s.contributor)+" ":"")+(s.side==="buy"?"Buy ":"Sell ")+fmtN(s.value);
      gSt.appendChild(t);
    }
    root.appendChild(gSt);

    /* trade markers: ▲ under the close, ▼ over it, 2px surface ring */
    const gMk = svg("g");
    markers.forEach((m,i)=>{
      const x = X(m.date);
      const y = m.close===null ? (m.dir==="up" ? M.t+ph-9 : M.t+9)
              : Y(m.close) + (m.dir==="up" ? 11 : -11);
      const s = 6;
      const d = m.dir==="up"
        ? "M"+x+","+(y-s)+"L"+(x+s)+","+(y+s*0.8)+"L"+(x-s)+","+(y+s*0.8)+"Z"
        : "M"+x+","+(y+s)+"L"+(x+s)+","+(y-s*0.8)+"L"+(x-s)+","+(y-s*0.8)+"Z";
      gMk.appendChild(svg("path",{d},
        {fill:m.dir==="up"?"var(--chart-buy)":"var(--chart-sell)",
         stroke:"var(--panel,#fff)","stroke-width":"2","stroke-linejoin":"round"}));
      gHit.appendChild(svg("circle",{cx:x,cy:y,r:11,class:"hit","data-k":"mark","data-i":String(i)},
        {fill:"transparent","pointer-events":"all"}));
    });
    root.appendChild(gMk);
    root.appendChild(xh);
    root.appendChild(gHit);

    if(!series.length && !steps.length && !markers.length){
      const t = svg("text",{x:M.l+pw/2,y:M.t+ph/2,"text-anchor":"middle"},
        {fill:"var(--chart-axis)","font-size":"13px","font-style":"italic"});
      t.textContent = S.loading ? "Loading…" : "Nothing to draw in this range.";
      root.appendChild(t);
    }

    /* ---- hover + click ---- */
    const pt = e => { const b=root.getBoundingClientRect();
      return { x:(e.clientX-b.left)*W/b.width, y:(e.clientY-b.top)*H/b.height,
               px:e.clientX-host.getBoundingClientRect().left,
               py:e.clientY-host.getBoundingClientRect().top }; };
    root.addEventListener("mousemove", e=>{
      const p = pt(e);
      if(p.x<M.l||p.x>M.l+pw||p.y<M.t||p.y>M.t+ph){ hide(); return; }
      let near = null;
      if(series.length){
        const dd = d0 + (p.x-M.l)/pw*(d1-d0);
        near = series.reduce((a,b)=>Math.abs(day(b.date)-dd)<Math.abs(day(a.date)-dd)?b:a);
        xh.style.display = "";
        xl.setAttribute("x1",X(near.date)); xl.setAttribute("x2",X(near.date));
        xd.setAttribute("cx",X(near.date)); xd.setAttribute("cy",Y(near.close));
      }
      const k = e.target.getAttribute && e.target.getAttribute("data-k");
      const i = k ? +e.target.getAttribute("data-i") : -1;
      if(k==="step") showTip(stepTip(steps[i]), p);
      else if(k==="mark") showTip(markTip(markers[i]), p);
      else if(near) showTip([["t",fmtD(near.date)],["m","Close "+fmtN(near.close)]], p);
      else tip.style.display="none";
    });
    root.addEventListener("mouseleave", hide);
    root.addEventListener("click", e=>{
      const k = e.target.getAttribute && e.target.getAttribute("data-k");
      if(!k) return;
      const it = (k==="step"?steps:markers)[+e.target.getAttribute("data-i")];
      const rec = it && S.byId.get(it.note_id);
      if(rec) S.onOpenRecord(rec);
    });
    function hide(){ xh.style.display="none"; tip.style.display="none"; }

    host.appendChild(root);
    legend(steps, markers, series, who);
    table(steps, markers);
  }

  function stepTip(s){
    const why = s.why || s.subject || "";
    return [["t", s.contributor+"  ·  "+(s.side==="buy"?"Buy":"Sell")+" target "+fmtN(s.value)],
            ["m", "Set "+fmtD(s.from)+(s.to>=S.range.to?"  ·  still current":"  ·  until "+fmtD(s.to))],
            ["w", why ? (s.why?"Why: ":"")+why : "(no why on this record)"],
            ["h", "Click to open the note"]];
  }
  function markTip(m){
    const snapped = m.date!==m.tradeDate;
    return [["t", (m.dir==="up"?"▲ ":"▼ ")+m.action+(m.strategy?"  ·  "+m.strategy:"")],
            ["m", "Traded "+fmtD(m.tradeDate)+(m.close===null?"":
              snapped ? "  ·  plotted at "+fmtD(m.date)+" close "+fmtN(m.close)
                      : "  ·  close "+fmtN(m.close))],
            ["w", m.why ? "Why: "+m.why : "(why not filled in yet)"],
            ["h", "Click to open the note"]];
  }
  function showTip(lines, p){
    const tip = document.getElementById("ch_tip");
    tip.innerHTML = "";
    for(const [cls,txt] of lines){ const d=document.createElement("div"); d.className=cls;
      d.textContent=txt; tip.appendChild(d); }
    tip.style.display = "block";
    const host = document.getElementById("ch_plot");
    const w = tip.offsetWidth, h = tip.offsetHeight, hw = host.clientWidth;
    let x = p.px+14, y = p.py+14;
    if(x+w > hw-4) x = p.px-w-14;
    if(y+h > host.clientHeight-4) y = p.py-h-14;
    tip.style.left = Math.max(4,x)+"px"; tip.style.top = Math.max(4,y)+"px";
  }

  function legend(steps, markers, series, who){
    const lg = document.getElementById("ch_legend"); lg.innerHTML = "";
    const add = (html, txt) => { const s=document.createElement("span");
      s.innerHTML = html; s.appendChild(document.createTextNode(txt)); lg.appendChild(s); };
    if(series.length) add('<i style="border-color:var(--chart-price)"></i>', S.ticker+" close");
    if(steps.some(s=>s.side==="buy"))  add('<i class="d" style="border-color:var(--chart-buy)"></i>', "Buy target");
    if(steps.some(s=>s.side==="sell")) add('<i class="d" style="border-color:var(--chart-sell)"></i>', "Sell target");
    if(markers.some(m=>m.dir==="up"))   add('<b style="color:var(--chart-buy)">▲</b>', "initiate / add");
    if(markers.some(m=>m.dir==="down")) add('<b style="color:var(--chart-sell)">▼</b>', "trim / exit");
    if(who.length>1){
      for(const c of who){
        const sv = '<svg width="24" height="4"><line x1="0" x2="24" y1="2" y2="2" stroke="currentColor"'
          +' stroke-width="2" stroke-dasharray="'+DASH[Math.max(0,S.contributors.indexOf(c))%DASH.length]+'"/></svg>';
        add(sv, c);
      }
    }
  }

  /* The table view: the same numbers the chart draws, for anyone who cannot
     or would rather not read them off the lines. */
  function table(steps, markers){
    const box = document.getElementById("ch_table"); box.innerHTML = "";
    const t = document.createElement("table"); t.className = "grid";
    t.innerHTML = "<thead><tr><th>What</th><th>Who / strategy</th><th style='text-align:right'>Value</th>"
      +"<th>From</th><th>To</th><th>Why</th></tr></thead>";
    const tb = document.createElement("tbody");
    const row = cells => { const tr=document.createElement("tr");
      cells.forEach((c,i)=>{ const td=document.createElement("td"); td.textContent=c;
        if(i===2) td.className="num"; tr.appendChild(td); }); tb.appendChild(tr); };
    steps.forEach(s=>row([(s.side==="buy"?"Buy":"Sell")+" target", s.contributor, fmtN(s.value),
      s.from, s.to, s.why||s.subject||""]));
    markers.forEach(m=>row([(m.dir==="up"?"▲ ":"▼ ")+m.action, m.strategy,
      m.close===null?"":fmtN(m.close), m.tradeDate, "", m.why||""]));
    if(!steps.length && !markers.length) row(["Nothing in range","","","","",""]);
    t.appendChild(tb); box.appendChild(t);
  }

  /* ---------- PNG export (§18.2 decision 10) ----------
     SVG -> canvas -> blob. CSS variables do not survive serialisation, so
     every drawn element's computed colours are copied onto the clone first.
     Crosshair and hit targets are left out; a title and legend line are
     added, because a PNG pasted into an email has no surrounding page. */
  function exportPng(){
    const src = document.querySelector("#ch_plot svg");
    if(!src || !S) return;
    const W = +src.getAttribute("width"), head = 40;
    const clone = src.cloneNode(true);
    const a = src.querySelectorAll("*"), b = clone.querySelectorAll("*");
    const props = ["fill","stroke","stroke-width","stroke-dasharray","stroke-linecap",
                   "stroke-linejoin","opacity","font-size","font-weight","font-style"];
    a.forEach((el,i)=>{ const cs=getComputedStyle(el);
      for(const p of props) b[i].style.setProperty(p, cs.getPropertyValue(p)); });
    clone.querySelectorAll(".nx,.hit").forEach(n=>n.remove());
    const cs0 = getComputedStyle(document.getElementById("ch_plot"));
    const out = svg("svg",{xmlns:SVGNS,width:W,height:H+head,viewBox:"0 0 "+W+" "+(H+head)});
    out.appendChild(svg("rect",{x:0,y:0,width:W,height:H+head},{fill:cs0.backgroundColor||"#fff"}));
    const ink = getComputedStyle(document.body).color;
    const t1 = svg("text",{x:M.l,y:17},{fill:ink,"font-size":"14px","font-weight":"700",
      "font-family":"Segoe UI, system-ui, sans-serif"});
    t1.textContent = S.ticker+(S.name&&S.name!==S.ticker?"  ·  "+S.name:"")
      +"   "+S.range.from+" – "+S.range.to;
    const t2 = svg("text",{x:M.l,y:33},{fill:ink,"font-size":"11px",opacity:"0.75",
      "font-family":"Segoe UI, system-ui, sans-serif"});
    t2.textContent = "Close (FMP, unadjusted)  ·  dashed: buy / sell targets ("
      +[...S.who].join(", ")+")  ·  ▲ initiate/add  ▼ trim/exit"
      +(S.strat.size<S.strategies.length?"  ·  "+[...S.strat].join(", "):"");
    out.appendChild(t1); out.appendChild(t2);
    const g = svg("g",{transform:"translate(0,"+head+")"},{"font-family":"Segoe UI, system-ui, sans-serif"});
    while(clone.firstChild) g.appendChild(clone.firstChild);
    out.appendChild(g);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(out)],
      {type:"image/svg+xml;charset=utf-8"}));
    const img = new Image();
    img.onload = ()=>{
      const k = 2, cv = document.createElement("canvas");
      cv.width = W*k; cv.height = (H+head)*k;
      const cx = cv.getContext("2d"); cx.scale(k,k); cx.drawImage(img,0,0);
      URL.revokeObjectURL(url);
      cv.toBlob(bl=>{
        const u = URL.createObjectURL(bl), dl = document.createElement("a");
        dl.href = u; dl.download = S.ticker.replace(/[^A-Za-z0-9.-]/g,"_")
          +"_chart_"+S.range.from+"_"+S.range.to+".png";
        document.body.appendChild(dl); dl.click(); dl.remove();
        setTimeout(()=>URL.revokeObjectURL(u), 2000);
      }, "image/png");
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url);
      const s=document.getElementById("ch_status"); s.textContent="PNG export failed."; };
    img.src = url;
  }

  return { open, close, state:()=>S };
})();
