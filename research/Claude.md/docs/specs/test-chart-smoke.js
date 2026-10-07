/* Browser smoke test for the v1.6 §18 price chart.
   Run:  npm install   (once — puppeteer-core only, no browser download)
         node test-chart-smoke.js
   Drives the installed Chrome (Edge as fallback, or CHROME_PATH) headless
   against fixtures/chart-smoke.html, which loads the real rc-core.js and
   rc-chart.js with a saved FMP response. Checks: the chart renders, a step
   tooltip shows that record's `why`, clicking a marker opens the reader, and
   Export PNG writes a PNG. A screenshot lands in fixtures/out/. */

const fs = require("fs"), path = require("path");
const puppeteer = require("puppeteer-core");

/* Chrome first: on the DUMAC build, headless Edge starts and exits at once
   with no output (policy, presumably), so it is only the fallback. */
const BROWSER = process.env.CHROME_PATH || [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
].find(p => fs.existsSync(p));

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("FAIL: " + m)); };

(async () => {
  if(!BROWSER){ console.log("No Edge/Chrome found — set CHROME_PATH."); process.exit(1); }
  const out = path.join(__dirname, "fixtures", "out");
  fs.mkdirSync(out, { recursive:true });
  for(const f of fs.readdirSync(out)) if(f.endsWith(".png")) fs.unlinkSync(path.join(out,f));
  const fmp = JSON.parse(fs.readFileSync(
    path.join(__dirname, "fixtures", "fmp-nvda-non-split-2024-03-08.json"), "utf8"));

  const browser = await puppeteer.launch({ executablePath:BROWSER, headless:true,
    args:["--allow-file-access-from-files"] });
  try{
    const page = await browser.newPage();
    await page.setViewport({ width:1280, height:900 });
    const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.evaluateOnNewDocument(d => { window.__FMP = d; }, fmp);
    const cdp = await page.createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior:"allow", downloadPath:out });

    await page.goto("file:///" + path.join(__dirname, "fixtures", "chart-smoke.html").replace(/\\/g,"/"));
    await page.waitForSelector("#chart.show #ch_plot svg");
    await page.waitForFunction(() => RCChart.state() && !RCChart.state().loading);

    /* 1. it renders */
    const shape = await page.evaluate(() => {
      const s = RCChart.state();
      return { range:s.range, series:s.drawn.series.length, steps:s.drawn.steps.length,
               markers:s.drawn.markers.map(m=>m.note_id+":"+m.dir+":"+m.date),
               paths:document.querySelectorAll("#ch_plot svg path").length,
               stepHits:document.querySelectorAll('#ch_plot [data-k="step"]').length,
               who:[...s.who], status:document.getElementById("ch_status").textContent };
    });
    ok(shape.series > 100, "price series drawn, got " + shape.series);
    ok(shape.range.from === "2024-02-19" && shape.range.to === "2024-08-30",
       "default range = 30d before first target -> today, got " + JSON.stringify(shape.range));
    ok(JSON.stringify(shape.who) === '["Evan Jones"]', "default contributor is the viewer");
    ok(shape.steps === 5, "viewer's 5 target steps (3 buy, 2 sell), got " + shape.steps);
    ok(shape.stepHits === shape.steps, "one hit target per step");
    ok(shape.markers.join() === "x1:up:2024-03-22,x2:up:2024-06-07,x3:down:2024-07-17",
       "markers + Saturday add snapped to Friday, got " + shape.markers.join());
    ok(/not split-adjusted/.test(shape.status), "status says unadjusted: " + shape.status);

    /* 2. hovering a step shows its why */
    const hit = await page.$('#ch_plot [data-k="step"][data-i="0"]');
    const why0 = await page.evaluate(() => RCChart.state().drawn.steps[0].why);
    const box = await hit.boundingBox();
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    const tipText = await page.$eval("#ch_tip", e => e.style.display + "|" + e.textContent);
    ok(tipText.startsWith("block|") && tipText.indexOf(why0) >= 0,
       "step tooltip shows why '" + why0 + "', got " + tipText);
    await page.screenshot({ path:path.join(out, "chart-hover-step.png") });

    /* 3. clicking a marker opens the reader on that record */
    const mk = await page.$('#ch_plot [data-k="mark"][data-i="1"]');
    const mb = await mk.boundingBox();
    await page.mouse.move(mb.x + mb.width/2, mb.y + mb.height/2);
    const mtip = await page.$eval("#ch_tip", e => e.textContent);
    ok(/Traded Jun 8, 2024/.test(mtip) && /plotted at Jun 7, 2024/.test(mtip),
       "marker tooltip shows true trade date and snap, got " + mtip);
    await page.mouse.click(mb.x + mb.width/2, mb.y + mb.height/2);
    const opened = await page.evaluate(() => ({ id:window.__opened,
      show:document.getElementById("reader").classList.contains("show"),
      title:document.getElementById("rd_title").textContent }));
    ok(opened.id === "x2" && opened.show && opened.title === "Trade x2",
       "marker click opens reader on x2, got " + JSON.stringify(opened));
    /* Escape closes the reader first, the chart stays */
    await page.keyboard.press("Escape");
    await page.evaluate(() => document.getElementById("rd_close").click());
    ok(await page.$eval("#chart", e => e.classList.contains("show")), "chart still open under the reader");

    /* 4. contributor and strategy chips */
    await page.click('#ch_who [data-who="Ana Anderson"]');
    ok(await page.evaluate(() => RCChart.state().drawn.steps.length) === 6, "adding Ana adds her sell step");
    await page.click('#ch_strat [data-strat="Direct US"]');
    ok(await page.evaluate(() => RCChart.state().drawn.markers.map(m=>m.note_id).join()) === "x2",
       "strategy chip filters markers to Direct Global Ideas");
    ok(await page.evaluate(() => RCChart.state().drawn.steps.length) === 6, "strategy chip leaves targets alone");

    /* 5. presets */
    await page.click('#ch_presets [data-preset="6M"]');
    await page.waitForFunction(() => !RCChart.state().loading);
    ok(await page.evaluate(() => RCChart.state().range.from) === "2024-02-29", "6M preset range");
    await page.screenshot({ path:path.join(out, "chart-6m-two-contributors.png") });

    /* 6. PNG export */
    await page.click("#ch_png");
    let png = null;
    for(let i=0;i<40 && !png;i++){
      await new Promise(r=>setTimeout(r,150));
      png = fs.readdirSync(out).find(f => /^NVDA_chart_.*\.png$/.test(f));
    }
    ok(!!png, "Export PNG downloaded a file");
    if(png){
      const b = fs.readFileSync(path.join(out, png));
      ok(b.slice(1,4).toString() === "PNG" && b.length > 10000, "export is a real PNG, " + b.length + " bytes");
      /* headless Chrome removes its downloads on close, so keep a copy */
      fs.writeFileSync(path.join(out, "chart-export.png"), b);
    }
    /* 7. a name with no targets: price only, one-year window */
    await page.evaluate(() => { RCChart.close(); RCChart.open({ ticker:"NVDA", name:"NVIDIA Corp",
      records:[], cfg:{ strategies:["Direct US"], fmp_api_key:"TEST" }, viewer:"Evan Jones",
      onOpenRecord:()=>{}, today:"2024-08-30" }); });
    await page.waitForFunction(() => RCChart.state() && !RCChart.state().loading);
    const bare = await page.evaluate(() => { const s=RCChart.state();
      return { range:s.range, series:s.drawn.series.length, steps:s.drawn.steps.length,
               markers:s.drawn.markers.length,
               who:document.getElementById("ch_who").textContent }; });
    ok(bare.series > 100 && bare.steps === 0 && bare.markers === 0,
       "no targets: price line only, got " + JSON.stringify(bare));
    ok(bare.range.from === "2023-08-30", "no targets: one-year default range");
    ok(/No price targets entered/.test(bare.who), "no targets: says so in the chip row");
    await page.screenshot({ path:path.join(out, "chart-no-targets.png") });

    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); }

  console.log("\n" + pass + " passed, " + fail + " failed  (screenshots in fixtures/out/)");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL: " + e.stack); process.exit(1); });
