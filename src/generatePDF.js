export async function generateBrainEncoderPDF(results, form) {
  const { jsPDF } = await import("jspdf");
  const r = results || {};
  const W = 210, H = 297;

  // ── SAFE HELPERS ──────────────────────────────────────────
  // NEVER pass raw values to jsPDF color functions - always use these
  const safeInt = (v, fallback = 0) => {
    const n = parseInt(v);
    return isNaN(n) ? fallback : Math.max(0, Math.min(100, n));
  };
  const safeStr = (v, fallback = "") => (v == null ? fallback : String(v));
  const safeArr = (v, fallback = []) => (Array.isArray(v) ? v : fallback);

  // Color constants — always arrays [R,G,B]
  const BG     = [6,   8,  16];
  const PANEL  = [10,  13,  30];
  const CARD   = [16,  20,  40];
  const BORDER = [30,  35,  65];
  const TEXT   = [240, 240, 248];
  const DIM    = [136, 144, 176];
  const MUTED  = [60,  65,  100];
  const GOLD   = [201, 168,  76];
  const GOLDL  = [232, 201, 122];
  const GREEN  = [34,  212, 114];
  const AMBER  = [245, 166,  35];
  const ORANGE = [232, 121,  58];
  const RED    = [240,  90, 106];
  const CYAN   = [0,   212, 184];
  const PURPLE = [155, 127, 234];
  const ROSE   = [244,  63,  94];
  const SKY    = [56,  189, 248];

  // scoreColor ALWAYS returns a valid [R,G,B] array
  const scoreColor = (v) => {
    const n = safeInt(v);
    if (n >= 80) return GREEN;
    if (n >= 60) return AMBER;
    if (n >= 40) return ORANGE;
    return RED;
  };

  const gradeColor = (g) => {
    const s = safeStr(g);
    if (s.startsWith("A")) return GREEN;
    if (s.startsWith("B")) return AMBER;
    if (s.startsWith("C")) return ORANGE;
    return RED;
  };

  // Safe setFillColor — always destructures a valid array
  const fill  = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const color  = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const fillRaw = (r2, g, b) => doc.setFillColor(r2, g, b);

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  doc.setProperties({
    title: `AdCritIQ — ${safeStr(form?.brand, "Creative")}`,
    author: "ADVantage Insights",
    creator: "AdCritIQ Platform"
  });

  let pageNum = 0;

  // ── PAGE SETUP ────────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    fill(BG); doc.rect(0, 0, W, H, "F");
    drawFooter();
  }

  function drawFooter() {
    fill(PANEL); doc.rect(0, H-12, W, 12, "F");
    stroke(BORDER); doc.setLineWidth(0.3); doc.line(0, H-12, W, H-12);
    doc.setFontSize(7); doc.setFont("helvetica","normal");
    color(DIM); doc.text("ADVantage Insights™  |  AdCritIQ™  |  Confidential", 10, H-5);
    color(GOLD); doc.text(`Page ${pageNum}`, W-10, H-5, {align:"right"});
  }

  function drawHeader(label) {
    fill(PANEL); doc.rect(0, 0, W, 18, "F");
    stroke(GOLD); doc.setLineWidth(0.5); doc.line(0, 18, W, 18);
    doc.setFontSize(7); doc.setFont("helvetica","bold");
    color(GOLD); doc.text("ADVantage Insights™", 10, 7);
    doc.setFont("helvetica","normal"); color(DIM);
    doc.text("AdCritIQ™  |  Neural Creative Intelligence", 10, 13);
    doc.setFont("helvetica","bold"); color(CYAN);
    doc.text(label, W-10, 9, {align:"right"});
  }

  function card(x, y, w, h, bg) {
    fill(bg || CARD); stroke(BORDER);
    doc.setLineWidth(0.3); doc.roundedRect(x, y, w, h, 2, 2, "FD");
  }

  function accent(x, y, w, c) {
    fill(c); doc.roundedRect(x, y, w, 2, 1, 1, "F");
  }

  function wrap(text, x, y, maxW, lineH, maxL) {
    if (!text) return y;
    const words = safeStr(text).split(" ");
    let line = "", lines = [];
    for (const w2 of words) {
      const t = line ? line+" "+w2 : w2;
      if (doc.getTextWidth(t) <= maxW) { line = t; }
      else { if (line) lines.push(line); line = w2; }
    }
    if (line) lines.push(line);
    lines.slice(0, maxL||10).forEach(l => { doc.text(l, x, y); y += (lineH||4.5); });
    return y;
  }

  function scoreBlock(x, y, label, rawVal, w, h) {
    const v = safeInt(rawVal);
    const c = scoreColor(v);
    w = w || 44; h = h || 28;
    card(x, y, w, h, [12,16,35]);
    accent(x, y, w, c);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(DIM);
    doc.text(safeStr(label).toUpperCase(), x+w/2, y+9, {align:"center"});
    doc.setFontSize(18); doc.setFont("helvetica","bold"); color(c);
    doc.text(String(v), x+w/2, y+21, {align:"center"});
    fill(BORDER); doc.roundedRect(x+4, y+23, w-8, 2, 1, 1, "F");
    fill(c); doc.roundedRect(x+4, y+23, Math.max(0,(w-8)*(v/100)), 2, 1, 1, "F");
  }

  function barRow(x, y, label, rawVal, c, lW) {
    const v = safeInt(rawVal);
    const col = c || scoreColor(v);
    lW = lW || 50;
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(safeStr(label), x, y+3.5);
    const bX = x+lW, bW = W-x-lW-20;
    fill(BORDER); doc.roundedRect(bX, y, bW, 5, 2, 2, "F");
    fill(col); doc.roundedRect(bX, y, Math.max(0,bW*(v/100)), 5, 2, 2, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); color(col);
    doc.text(String(v), bX+bW+3, y+4);
  }

  // ── COVER PAGE ────────────────────────────────────────────
  newPage();
  fill(PANEL); doc.rect(0, 0, W, 20, "F");
  stroke(GOLD); doc.setLineWidth(0.6); doc.line(0, 20, W, 20);
  doc.setFontSize(8); doc.setFont("helvetica","bold"); color(GOLD);
  doc.text("ADVANTAGE INSIGHTS™", 10, 8);
  doc.setFont("helvetica","normal"); color(DIM);
  doc.text("Neural Creative Intelligence  |  Confidential", 10, 14);
  color(DIM); doc.text(new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}), W-10, 11, {align:"right"});

  // glow
  fillRaw(8,18,30); doc.circle(W/2, 80, 60, "F");
  fillRaw(6,8,16); doc.circle(W/2, 80, 45, "F");

  doc.setFontSize(8); doc.setFont("helvetica","bold"); color(GOLD);
  doc.text("BRAIN ENCODER™", W/2, 38, {align:"center"});
  stroke(GOLD); doc.setLineWidth(0.4); doc.line(W/2-30, 46, W/2+30, 46);

  const brand = safeStr(form?.brand, "Creative Analysis");
  doc.setFontSize(Math.min(28, 180/Math.max(brand.length,1)+10));
  doc.setFont("helvetica","bold"); color(TEXT);
  doc.text(brand, W/2, 62, {align:"center"});

  if (form?.campaign) {
    doc.setFontSize(12); doc.setFont("helvetica","normal"); color(GOLD);
    doc.text(safeStr(form.campaign), W/2, 72, {align:"center"});
  }

  const gc = gradeColor(r.overall_grade);
  fillRaw(gc[0]*0.15, gc[1]*0.15, gc[2]*0.15);
  doc.roundedRect(W/2-18, 80, 36, 22, 3, 3, "F");
  stroke(gc); doc.setLineWidth(0.6); doc.roundedRect(W/2-18, 80, 36, 22, 3, 3, "D");
  doc.setFontSize(7); doc.setFont("helvetica","bold"); color(gc);
  doc.text("OVERALL GRADE", W/2, 88, {align:"center"});
  doc.setFontSize(20); doc.text(safeStr(r.overall_grade,"—"), W/2, 99, {align:"center"});

  if (r.headline_verdict) {
    doc.setFontSize(9); doc.setFont("helvetica","bolditalic"); color(GOLDL);
    const vLines = doc.splitTextToSize(`"${safeStr(r.headline_verdict)}"`, W-40);
    doc.text(vLines.slice(0,3), W/2, 112, {align:"center"});
  }

  // stat blocks
  const stats=[["17","Neural Metrics"],["15","Platform Scores"],["4+","Scenes Analyzed"],["∞","Duration"]];
  const sw=40, sx0=(W-stats.length*sw-(stats.length-1)*4)/2;
  stats.forEach(([val,lbl],i) => {
    const sx=sx0+i*(sw+4);
    card(sx,128,sw,20,CARD); accent(sx,128,sw,CYAN);
    doc.setFontSize(14); doc.setFont("helvetica","bold"); color(CYAN);
    doc.text(val, sx+sw/2, 141, {align:"center"});
    doc.setFontSize(6); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(lbl, sx+sw/2, 146, {align:"center"});
  });

  // meta row
  stroke(BORDER); doc.setLineWidth(0.3); doc.line(10,158,W-10,158);
  const metas=[["Client",form?.client],["Agency",form?.agency],["Type",form?.type],["Industry",form?.industry],["Market",form?.market]];
  const mW=(W-20)/metas.length;
  metas.forEach(([k,v],i) => {
    const mx=10+i*mW+mW/2;
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(DIM);
    doc.text(k.toUpperCase(), mx, 164, {align:"center"});
    doc.setFont("helvetica","normal"); color(TEXT);
    doc.text(safeStr(v,"—"), mx, 169, {align:"center"});
  });

  if (r.creative_summary) {
    doc.setFontSize(8); doc.setFont("helvetica","normal"); color(DIM);
    const sLines = doc.splitTextToSize(safeStr(r.creative_summary), W-30);
    doc.text(sLines.slice(0,5), W/2, 180, {align:"center"});
  }

  // guardrails box on cover
  const gy=222;
  fillRaw(20,15,10); doc.roundedRect(10,gy,W-20,30,2,2,"F");
  stroke(AMBER); doc.setLineWidth(0.4); doc.roundedRect(10,gy,W-20,30,2,2,"D");
  fill(AMBER); doc.roundedRect(10,gy,W-20,3,1,1,"F");
  doc.setFontSize(7.5); doc.setFont("helvetica","bold"); color(AMBER);
  doc.text("! GUARDRAILS & LIMITATIONS", 14, gy+10);
  doc.setFont("helvetica","normal"); doc.setFontSize(6.8); color(DIM);
  const glims=[
    "AI-generated predictive analysis — not neuroscience lab results. Treat as directional intelligence.",
    "Platform scores are estimates. Actual performance depends on targeting, bid strategy, and creative fatigue.",
    "Cultural and regulatory signals are indicative. Consult legal teams before broadcast decisions."
  ];
  let gli=gy+17;
  glims.forEach(l => { doc.text("• "+l, 14, gli); gli+=5; });

  color(GOLD); doc.setFontSize(7); doc.setFont("helvetica","bold");
  doc.text("ADVantage Insights™  |  Anil Pandit  |  2026", W/2, 265, {align:"center"});

  // ── PAGE 2: METRICS ───────────────────────────────────────
  newPage(); drawHeader("EXECUTIVE METRICS");
  let y=26;
  const metrics=[
    ["Viral Potential",r.viral_potential],["Hook Strength",r.hook_strength],
    ["Hold Rate",r.hold_rate],["Emotional Peak",r.emotional_peak],
    ["Brand Recall",r.brand_recall],["Memory Encoding",r.memory_encoding],
    ["Sound-Off",r.sound_off_survival],["Share Intent",r.share_intent],
    ["Creative Eff.",r.creative_efficiency],["Ad Fatigue Risk",r.ad_fatigue_risk],
    ["Cultural Res.",r.cultural_resonance],["Celebrity Idx",r.celebrity_talent_index],
    ["Brand Safety",r.brand_safety],["Regulatory",r.regulatory_compliance],
    ["1P Data Opp.",r.first_party_data_opportunity],["Carbon Signal",r.carbon_signal],
    ["System 1v2",r.system1_vs_system2]
  ];
  const cols=4, bw=(W-20-(cols-1)*4)/cols;
  metrics.forEach(([lbl,val],i) => {
    const col=i%cols, row=Math.floor(i/cols);
    scoreBlock(10+col*(bw+4), y+row*33, lbl, val, bw, 29);
  });
  y+=Math.ceil(metrics.length/cols)*33+6;

  const comp=r.competitive_context||{};
  if (comp.benchmark_note) {
    card(10,y,W-20,18,CARD);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(GOLD);
    doc.text("COMPETITIVE BENCHMARK", 14, y+7);
    doc.setFont("helvetica","normal"); color(DIM);
    doc.text(safeStr(comp.benchmark_note), 14, y+13);
    const pos=safeStr(comp.position,"average");
    const posC=pos.includes("leader")||pos.includes("above") ? GREEN : pos==="average" ? AMBER : RED;
    doc.setFont("helvetica","bold"); color(posC);
    doc.text(pos.replace(/_/g," ").toUpperCase(), W-14, y+10, {align:"right"});
  }

  // ── PAGE 3: ATTENTION & EMOTION ───────────────────────────
  newPage(); drawHeader("ATTENTION & EMOTIONAL ARCHITECTURE");
  y=26;

  const attn=safeArr(r.attention_curve);
  const emot=safeArr(r.emotion_curve);
  card(10,y,W-20,52,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(CYAN);
  doc.text("ATTENTION CURVE", 14, y+8);
  if (attn.length>1) {
    const cX=14, cY=y+18, cW=W-28, cH=28;
    fill(BORDER); doc.rect(cX,cY,cW,cH,"F");
    [25,50,75].forEach(p => {
      const gy2=cY+cH-(p/100)*cH;
      stroke(BORDER); doc.setLineWidth(0.2); doc.line(cX,gy2,cX+cW,gy2);
    });
    const step=cW/(attn.length-1);
    const pts=attn.map((v2,i) => [cX+i*step, cY+cH-(safeInt(v2,50)/100)*cH]);
    stroke(CYAN); doc.setLineWidth(1.2);
    for(let i=1;i<pts.length;i++) doc.line(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]);
    if (emot.length>1) {
      const epts=emot.map((v2,i) => [cX+i*step, cY+cH-(safeInt(v2,50)/100)*cH]);
      stroke(AMBER); doc.setLineWidth(0.8);
      for(let i=1;i<epts.length;i++) doc.line(epts[i-1][0],epts[i-1][1],epts[i][0],epts[i][1]);
    }
  }
  y+=58;

  const peak=attn.length?Math.max(...attn.map(v2=>safeInt(v2))):0;
  const pkI=attn.findIndex(v2=>safeInt(v2)===peak);
  const low=attn.length?Math.min(...attn.map(v2=>safeInt(v2))):0;
  const avg=attn.length?Math.round(attn.reduce((a,b)=>a+safeInt(b),0)/attn.length):0;
  const aStats=[
    ["Peak Attention",`${peak}% at ~${pkI}s`,scoreColor(peak)],
    ["Lowest Point",`${low}%`,scoreColor(low)],
    ["Average",`${avg}%`,scoreColor(avg)]
  ];
  const asw=(W-20-8)/3;
  aStats.forEach(([lbl,val,c],i)=>{
    card(10+i*(asw+4),y,asw,18,CARD);
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); color(DIM);
    doc.text(lbl.toUpperCase(), 10+i*(asw+4)+asw/2, y+7, {align:"center"});
    doc.setFontSize(11); color(c);
    doc.text(safeStr(val), 10+i*(asw+4)+asw/2, y+15, {align:"center"});
  });
  y+=24;

  // Emotion types
  const et=r.emotion_types||{};
  const eC={joy:GREEN,surprise:AMBER,trust:CYAN,fear:RED,desire:ROSE,curiosity:PURPLE};
  card(10,y,W-20,52,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(ROSE);
  doc.text("EMOTION ARCHITECTURE", 14, y+8);
  const domE=Object.entries(et)
    .map(([k,arr])=>({k,sum:safeArr(arr).reduce((a,b)=>a+safeInt(b),0)}))
    .sort((a,b)=>b.sum-a.sum);
  domE.slice(0,6).forEach(({k,sum},i)=>{
    const v2=Math.round(sum/5);
    const ec=eC[k]||DIM;
    const ey=y+18+i*5.5;
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(safeStr(k).charAt(0).toUpperCase()+safeStr(k).slice(1), 14, ey+3.5);
    fill(BORDER); doc.roundedRect(42,ey,W-56,4,1.5,1.5,"F");
    fill(ec); doc.roundedRect(42,ey,Math.max(0,(W-56)*(v2/100)),4,1.5,1.5,"F");
    doc.setFont("helvetica","bold"); color(ec);
    doc.text(String(v2), 42+(W-56)+3, ey+3.5);
  });
  y+=58;

  // ── PAGE 4: NEURAL MAP ────────────────────────────────────
  newPage(); drawHeader("NEURAL MAP");
  y=26;
  const br=r.brain_regions||{};
  const cl=r.cognitive_channels||{};
  const hW=(W-24)/2;

  card(10,y,hW,76,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(PURPLE);
  doc.text("BRAIN REGIONS", 14, y+8);
  Object.entries(br).forEach(([k,v2],i)=>barRow(14,y+18+i*7.5,safeStr(k).replace(/_/g," "),v2,PURPLE,40));

  card(14+hW,y,hW,76,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(CYAN);
  doc.text("COGNITIVE CHANNELS", 18+hW, y+8);
  Object.entries(cl).forEach(([k,v2],i)=>barRow(18+hW,y+18+i*7.5,safeStr(k).replace(/_/g," "),v2,CYAN,36));
  y+=82;

  // System 1 vs 2
  const s12=safeInt(r.system1_vs_system2,50);
  const zone=s12>=65&&s12<=75?"OPTIMAL (65-75)":s12<65?"OVER-INDEXING RATIONAL":"OVER-INDEXING EMOTIONAL";
  const zC=s12>=65&&s12<=75?GREEN:AMBER;
  card(10,y,W-20,24,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(AMBER);
  doc.text("SYSTEM 1 vs SYSTEM 2", 14, y+8);
  fill(BORDER); doc.roundedRect(14,y+14,W-28,5,2,2,"F");
  fillRaw(79,142,247); doc.roundedRect(14,y+14,Math.max(0,(W-28)*(s12/100)),5,2,2,"F");
  fillRaw(240,240,248); doc.rect(14+(W-28)*(s12/100)-0.5,y+12,1.5,9,"F");
  doc.setFontSize(7); doc.setFont("helvetica","bold"); color(zC);
  doc.text(`Score: ${s12}/100 — ${zone}`, W/2, y+25, {align:"center"});
  y+=30;

  // ── PAGE 5: PLATFORM SCORES ───────────────────────────────
  newPage(); drawHeader("PLATFORM SCORES");
  y=26;
  const ps=r.platform_scores||{};
  const platL={
    youtube_preroll_6s:"YouTube 6s",youtube_preroll_15s:"YouTube 15s",youtube_instream:"YouTube Stream",
    instagram_reels:"Insta Reels",instagram_stories:"Insta Stories",instagram_feed:"Insta Feed",
    meta_feed:"Meta Feed",meta_stories:"Meta Stories",tiktok:"TikTok",linkedin_feed:"LinkedIn",
    twitter_x:"Twitter/X",tv_broadcast:"TV",ctv_ott:"CTV/OTT",dooh:"DOOH",programmatic_display:"Programmatic"
  };
  const platE=Object.entries(ps).map(([k,v2])=>[k,safeInt(v2)]).sort((a,b)=>b[1]-a[1]);
  const pc5=5, pw5=(W-20-(pc5-1)*3)/pc5;
  platE.forEach(([k,v2],i)=>{
    const pc=i%pc5, pr=Math.floor(i/pc5);
    const px=10+pc*(pw5+3), py=y+pr*36;
    const c=scoreColor(v2);
    card(px,py,pw5,32,[12,16,35]); accent(px,py,pw5,c);
    doc.setFontSize(14); doc.setFont("helvetica","bold"); color(c);
    doc.text(String(v2), px+pw5/2, py+17, {align:"center"});
    doc.setFontSize(6); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(platL[k]||safeStr(k), px+pw5/2, py+22, {align:"center"});
    const g=v2>=90?"A+":v2>=80?"A":v2>=70?"B+":v2>=60?"B":v2>=50?"C+":"C";
    doc.setFont("helvetica","bold"); color(c);
    doc.text(g, px+pw5/2, py+28, {align:"center"});
  });
  if (platE.length) {
    y+=Math.ceil(platE.length/pc5)*36+8;
    const best=platE[0], worst=platE[platE.length-1];
    const cbw=(W-24)/2;
    card(10,y,cbw,18,CARD); fill(GREEN); doc.roundedRect(10,y,cbw,2.5,1,1,"F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(GREEN);
    doc.text(`BEST: ${platL[best[0]]||best[0]} (${best[1]})`, 14, y+9);
    doc.setFont("helvetica","normal"); color(DIM); doc.text("Prioritise media spend here.", 14, y+15);
    card(14+cbw,y,cbw,18,CARD); fill(RED); doc.roundedRect(14+cbw,y,cbw,2.5,1,1,"F");
    doc.setFont("helvetica","bold"); color(RED);
    doc.text(`WEAKEST: ${platL[worst[0]]||worst[0]} (${worst[1]})`, 18+cbw, y+9);
    doc.setFont("helvetica","normal"); color(DIM);
    doc.text("Re-edit before running on this platform.", 18+cbw, y+15);
  }

  // ── PAGE 6: SCENES ────────────────────────────────────────
  newPage(); drawHeader("SCENE INTELLIGENCE");
  y=26;
  const scenes=safeArr(r.scenes);
  const riskC={none:GREEN,drop_zone:RED,ad_avoidance:AMBER,cognitive_overload:ROSE,pacing_issue:PURPLE};
  scenes.forEach((sc,i)=>{
    const sh=46;
    const scC=scoreColor(safeInt(sc?.attention,50));
    card(10,y,W-20,sh,CARD); accent(10,y,W-20,scC);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(CYAN);
    doc.text(safeStr(sc?.ts,`Scene ${i+1}`), 14, y+9);
    doc.setFontSize(9); color(TEXT); doc.text(safeStr(sc?.name,"Scene"), 14, y+16);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    const dLines=doc.splitTextToSize(safeStr(sc?.desc), W-28);
    doc.text(dLines.slice(0,3), 14, y+23);
    const statY=y+40;
    const statItems=[
      [`Attn: ${safeInt(sc?.attention)}%`, scoreColor(safeInt(sc?.attention))],
      [`Emo: ${safeInt(sc?.emotion)}%`, scoreColor(safeInt(sc?.emotion))],
      [safeStr(sc?.system_mode,"mixed"), CYAN],
      [safeStr(sc?.cognitive_load,"medium"), AMBER],
      [safeStr(sc?.risk_flag,"none"), riskC[safeStr(sc?.risk_flag,"none")]||GREEN]
    ];
    let sx2=14;
    statItems.forEach(([lbl,c])=>{
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); color(c);
      doc.text(lbl, sx2, statY);
      sx2+=doc.getTextWidth(lbl)+8;
    });
    y+=sh+4;
    if(y>H-50){newPage();drawHeader("SCENE INTELLIGENCE (CONT.)");y=26;}
  });

  // ── PAGE 7: SOUND & PRIVACY ───────────────────────────────
  newPage(); drawHeader("SOUND & SENSORY  |  PRIVACY & COMPLIANCE");
  y=26;
  const snd=r.sound_analysis||{};
  card(10,y,W-20,70,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(PURPLE);
  doc.text("SOUND & SENSORY ANALYSIS", 14, y+8);
  const sndF=[
    ["Sound Dependency",snd.sound_dependency,PURPLE],
    ["Music Effectiveness",snd.music_effectiveness,PURPLE],
    ["Voiceover Clarity",snd.voiceover_clarity,CYAN],
    ["Sound-Off Text",snd.sound_off_text_quality,GREEN],
    ["ASMR Trigger",snd.asmr_trigger,ROSE],
    ["Sonic Branding",snd.sonic_branding,AMBER]
  ];
  sndF.forEach(([lbl,val,c],i)=>{
    const ci=i%2, ri=Math.floor(i/2);
    const sx3=ci===0?14:W/2+4;
    barRow(sx3, y+18+ri*9, lbl, val, c, ci===0?50:50);
  });
  if(snd.sound_note){
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); color(DIM);
    const snL=doc.splitTextToSize(safeStr(snd.sound_note),W-28);
    doc.text(snL.slice(0,2),14,y+58);
  }
  const sov=safeInt(r.sound_off_survival);
  doc.setFontSize(18); doc.setFont("helvetica","bold"); color(scoreColor(sov));
  doc.text(String(sov), W-24, y+32);
  doc.setFontSize(6.5); doc.setFont("helvetica","normal"); color(DIM);
  doc.text("Sound-Off Survival", W-24, y+38, {align:"center"});
  y+=76;

  const priv=r.privacy_and_data_audit||{};
  card(10,y,W-20,70,CARD);
  doc.setFontSize(9); doc.setFont("helvetica","bold"); color(AMBER);
  doc.text("PRIVACY & DPDP COMPLIANCE AUDIT", 14, y+8);
  const privC=[
    ["Data Collection Present",priv.data_collection_present],
    ["Consent Mechanism Visible",priv.consent_mechanism_visible],
    ["QR Code Present",priv.qr_code_present],
    ["URL / CTA Present",priv.url_cta_present],
    ["Hashtag Present",priv.hashtag_present],
    ["Regulatory Disclaimers",priv.regulatory_disclaimers_visible]
  ];
  privC.forEach(([lbl,val],i)=>{
    const ci=i%2, ri=Math.floor(i/2);
    const px2=ci===0?14:W/2+4, py3=y+18+ri*9;
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(lbl, px2+8, py3+3.5);
    doc.setFont("helvetica","bold");
    color(val?GREEN:RED);
    doc.text(val?"YES":"NO", px2, py3+3.5);
  });
  const dpdpR=safeStr(priv.dpdp_compliance_risk,"low");
  const dC=dpdpR==="high"?RED:dpdpR==="medium"?AMBER:GREEN;
  fillRaw(dC[0]*0.15, dC[1]*0.15, dC[2]*0.15);
  doc.roundedRect(W-40,y+16,28,14,2,2,"F");
  stroke(dC); doc.setLineWidth(0.4); doc.roundedRect(W-40,y+16,28,14,2,2,"D");
  doc.setFontSize(6.5); doc.setFont("helvetica","bold"); color(dC);
  doc.text("DPDP RISK", W-26, y+22, {align:"center"});
  doc.setFontSize(9); doc.text(dpdpR.toUpperCase(), W-26, y+28, {align:"center"});
  if(priv.privacy_note){
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    const pnL=doc.splitTextToSize(safeStr(priv.privacy_note),W-28);
    doc.text(pnL.slice(0,2),14,y+58);
  }

  // ── PAGE 8: STRATEGIC INSIGHTS ────────────────────────────
  newPage(); drawHeader("STRATEGIC INSIGHTS");
  y=26;
  const ins=safeArr(r.strategic_insights||r.insights);
  const vtC={risk:RED,win:GREEN,tip:CYAN,watch:AMBER};
  ins.forEach((ins2,i)=>{
    const vc=vtC[safeStr(ins2?.vtype,"watch")]||AMBER;
    const ih=44;
    card(10,y,W-20,ih,CARD);
    fill(vc); doc.roundedRect(10,y,2.5,ih,1,1,"F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(DIM);
    doc.text(safeStr(ins2?.num,String(i+1).padStart(2,"0")), 16, y+8);
    doc.setFontSize(9); color(TEXT);
    doc.text(safeStr(ins2?.title,"Insight"), 16, y+15);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    const bLines=doc.splitTextToSize(safeStr(ins2?.body),W-34);
    doc.text(bLines.slice(0,3),16,y+22);
    if(ins2?.verdict){
      doc.setFont("helvetica","bold"); color(vc);
      doc.text(`→ ${safeStr(ins2.verdict)}`, 16, y+39);
    }
    const bpw=doc.getTextWidth(safeStr(ins2?.vtype,"watch").toUpperCase())+6;
    fillRaw(vc[0]*0.2, vc[1]*0.2, vc[2]*0.2);
    doc.roundedRect(W-10-bpw,y+6,bpw,6,1.5,1.5,"F");
    doc.setFontSize(6); color(vc);
    doc.text(safeStr(ins2?.vtype,"watch").toUpperCase(), W-10-bpw/2, y+10.5, {align:"center"});
    y+=ih+4;
    if(y>H-50){newPage();drawHeader("STRATEGIC INSIGHTS (CONT.)");y=26;}
  });

  // ── PAGE 9: CMO PLAYBOOK ──────────────────────────────────
  newPage(); drawHeader("CMO PLAYBOOK");
  y=26;
  doc.setFontSize(7.5); doc.setFont("helvetica","bold"); color(GOLD);
  doc.text("FOR THE MARKETING HEAD", 10, y); y+=6;
  doc.setFontSize(18); doc.setFont("helvetica","bold"); color(TEXT);
  doc.text("The ", 10, y+12);
  color(GOLD); doc.text("CMO Playbook", 10+doc.getTextWidth("The "), y+12);
  y+=18;
  doc.setFontSize(8); doc.setFont("helvetica","normal"); color(DIM);
  doc.text("Prioritised actions sorted by impact-to-effort ratio.", 10, y); y+=10;

  const cmo=safeArr(r.cmo_actions);
  const prioC={critical:RED,high:AMBER,medium:GOLD,low:DIM};
  cmo.forEach((a,i)=>{
    const pc2=prioC[safeStr(a?.priority,"medium")]||GOLD;
    const ah=44;
    card(10,y,W-20,ah,CARD); accent(10,y,W-20,pc2);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); color(GOLD);
    doc.text(`ACTION ${safeStr(a?.num,String(i+1).padStart(2,"0"))}`, 14, y+9);
    const prioTxt=safeStr(a?.priority,"medium").toUpperCase();
    const prioW=doc.getTextWidth(prioTxt)+6;
    fillRaw(pc2[0]*0.2, pc2[1]*0.2, pc2[2]*0.2);
    doc.roundedRect(50,y+5,prioW,6,1.5,1.5,"F");
    doc.setFontSize(6); color(pc2); doc.text(prioTxt, 50+prioW/2, y+9.5, {align:"center"});
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); color(DIM);
    doc.text(`Effort: ${safeStr(a?.effort,"medium")}`, 50+prioW+6, y+9.5);
    doc.setFontSize(9); doc.setFont("helvetica","bold"); color(TEXT);
    doc.text(safeStr(a?.title,"Action"), 14, y+18);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    const aL=doc.splitTextToSize(safeStr(a?.body),W-32);
    doc.text(aL.slice(0,2),14,y+25);
    if(a?.impact){
      doc.setFont("helvetica","bold"); color(GREEN);
      doc.text(`→ ${safeStr(a.impact)}`, 14, y+39);
    }
    y+=ah+4;
    if(y>H-50){newPage();drawHeader("CMO PLAYBOOK (CONT.)");y=26;}
  });

  // ── PAGE 10: METHODOLOGY ──────────────────────────────────
  newPage(); drawHeader("GUARDRAILS & METHODOLOGY");
  y=26;
  const guards=[
    ["AI-Generated Analysis","This report is produced by Claude Sonnet 4 (Anthropic) analyzing visual frames. It is not a neuroscience lab study, eye-tracking session, or biometric measurement. Treat as directional creative intelligence."],
    ["Predictive, Not Measured","All scores represent predicted cognitive responses based on Byron Sharp's brand asset theory, Kahneman's System 1/2 processing, Nelson-Field attention economics, and Heath's low-attention processing. Not empirical measurements."],
    ["Platform Score Limitations","Platform scores estimate suitability based on format and attention norms. Actual performance depends on audience targeting, bid strategy, creative fatigue, and algorithmic distribution — none of which this tool measures."],
    ["Cultural & Regulatory Signals","Cultural resonance and compliance signals are indicative only. Consult your compliance, legal, and market research teams before broadcast or distribution decisions."],
    ["Frame Sampling","Analysis uses 1-2 extracted frames per creative. Rapid scene changes or short-form content may produce lower accuracy. For maximum precision, upload key scenes as separate image files."],
    ["No Performance Guarantee","ADVantage Insights makes no warranty that acting on these recommendations will improve campaign performance. This tool informs creative strategy discussions."]
  ];
  guards.forEach(([title,body])=>{
    card(10,y,W-20,28,[14,18,35]);
    fill(RED); doc.roundedRect(10,y,2.5,28,1,1,"F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); color(AMBER);
    doc.text(title,16,y+8);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
    const gL=doc.splitTextToSize(body,W-30);
    doc.text(gL.slice(0,3),16,y+15);
    y+=32;
  });

  y+=4;
  card(10,y,W-20,28,CARD); fill(GOLD); doc.roundedRect(10,y,W-20,2.5,1,1,"F");
  doc.setFontSize(8); doc.setFont("helvetica","bold"); color(GOLD);
  doc.text("SCIENTIFIC METHODOLOGY", 14, y+10);
  doc.setFontSize(7); doc.setFont("helvetica","normal"); color(DIM);
  const meth="AdCritIQ analyzes advertising creatives through three stages: (1) Frame extraction — visual frames sampled at optimal intervals. (2) Neural activation prediction — frames analyzed using multimodal AI vision against 17 advertising science constructs covering attention, memory, emotion, and behavioral response. (3) Platform calibration — each creative scored against 15 media environments accounting for format, sound-on/off ratios, and viewing duration norms.";
  const mL=doc.splitTextToSize(meth,W-28);
  doc.text(mL.slice(0,4),14,y+18);

  doc.setFontSize(8); doc.setFont("helvetica","bold"); color(GOLD);
  doc.text("ADVantage Insights™  |  AdCritIQ™  |  Anil Pandit  |  2026", W/2, y+36, {align:"center"});

  // ── SAVE ──────────────────────────────────────────────────
  const safeBrand=safeStr(form?.brand,"Creative").replace(/[^a-zA-Z0-9]/g,"_");
  const dateStr=new Date().toISOString().slice(0,10);
  doc.save(`AdCritIQ_${safeBrand}_${dateStr}.pdf`);
}
