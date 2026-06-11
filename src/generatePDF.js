export async function generateBrainEncoderPDF(results, form) {
  const { jsPDF } = await import("jspdf");
  const r = results || {};
  const meta = form || {};
  const W = 210;
  const H = 297;
  const TOTAL_PAGES = 6;

  const COLORS = {
    bg: [7, 7, 15],
    s1: [15, 15, 30],
    s2: [20, 20, 40],
    s3: [24, 24, 46],
    border: [34, 34, 58],
    text: [238, 238, 255],
    dim: [128, 128, 176],
    muted: [68, 68, 106],
    gold: [245, 158, 11],
    goldSoft: [232, 201, 122],
    green: [16, 185, 129],
    red: [239, 68, 68],
    amber: [245, 158, 11],
    orange: [249, 115, 22],
    cyan: [0, 212, 184],
    purple: [155, 127, 234],
    rose: [244, 63, 94],
    sky: [56, 189, 248],
    white: [255, 255, 255],
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const safeNum = (v, fallback = 0) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return Number.isFinite(n) ? Math.round(n) : fallback;
  };
  const safeScore = (v, fallback = 0) => Math.max(0, Math.min(100, safeNum(v, fallback)));
  const safeStr = (v, fallback = "") => {
    if (v == null) return fallback;
    const s = String(v).trim();
    return s || fallback;
  };
  const safeArr = (v, fallback = []) => (Array.isArray(v) ? v : fallback);
  const safeObj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const color = (c) => doc.setTextColor(...c);
  const fill = (c) => doc.setFillColor(...c);
  const stroke = (c) => doc.setDrawColor(...c);
  const brand = safeStr(meta.brand, "Creative Analysis");
  const creativeFormat = safeStr(r.creative_format || meta.creative_format || meta.type, "video");
  const impactLabel = creativeFormat === "static_image"
    ? "attention / recall lift"
    : creativeFormat === "audio"
      ? "recall / response lift"
      : creativeFormat === "text"
        ? "clarity / conversion lift"
        : "completion rate";
  const fileDate = new Date().toISOString().slice(0, 10);
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  doc.setProperties({
    title: `AdCritIQ Report - ${brand}`,
    author: "AdCritIQ",
    creator: "AdCritIQ Platform",
    subject: "Neural Creative Intelligence Report",
  });

  function scoreColor(score) {
    const v = safeScore(score);
    if (v >= 75) return COLORS.green;
    if (v >= 60) return COLORS.amber;
    if (v >= 40) return COLORS.orange;
    return COLORS.red;
  }

  function scoreLabel(score) {
    const v = safeScore(score);
    if (v >= 75) return "STRONG";
    if (v >= 60) return "AVERAGE";
    if (v >= 40) return "WEAK";
    return "RISK";
  }

  function gradeColor(grade) {
    const g = safeStr(grade, "B").toUpperCase();
    if (g.startsWith("A")) return COLORS.green;
    if (g.startsWith("B")) return COLORS.gold;
    if (g.startsWith("C")) return COLORS.amber;
    return COLORS.red;
  }

  function gradeScore(grade) {
    const g = safeStr(grade, "B").toUpperCase();
    if (g.startsWith("A+")) return 95;
    if (g.startsWith("A")) return 88;
    if (g.startsWith("B+")) return 78;
    if (g.startsWith("B")) return 68;
    if (g.startsWith("C")) return 52;
    return 35;
  }

  function setFont(size, style = "normal") {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  }

  function drawPageBackground() {
    fill(COLORS.bg);
    doc.rect(0, 0, W, H, "F");
    fill([10, 10, 22]);
    doc.circle(170, 48, 42, "F");
    fill(COLORS.bg);
    doc.circle(170, 48, 31, "F");
    fill([10, 12, 24]);
    doc.circle(34, 242, 54, "F");
    fill(COLORS.bg);
    doc.circle(34, 242, 40, "F");
  }

  function drawHeader(title, pageNum) {
    fill(COLORS.gold);
    doc.rect(0, 0, W, 2, "F");
    fill(COLORS.s1);
    doc.rect(0, 287, W, 10, "F");
    stroke(COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(15, 15, 195, 15);
    doc.line(0, 287, W, 287);

    setFont(7.5, "bold");
    color(COLORS.gold);
    doc.text("ADCRITIQ™", 15, 9);
    setFont(9, "normal");
    color(COLORS.dim);
    doc.text(title.toUpperCase(), 15, 13);

    setFont(7, "normal");
    color(COLORS.muted);
    doc.text("AdCritIQ™  |  Neural Creative Intelligence  |  Confidential", 15, 293);
    doc.text(`${pageNum} / ${TOTAL_PAGES}`, 195, 293, { align: "right" });
  }

  function drawSectionTitle(label, y, x = 15) {
    fill(COLORS.gold);
    doc.roundedRect(x, y, 2, 6, 1, 1, "F");
    setFont(8, "bold");
    color(COLORS.dim);
    doc.text(label.toUpperCase(), x + 5, y + 4.5);
    return y + 11;
  }

  function drawCard(x, y, w, h, bg = COLORS.s1, border = COLORS.border) {
    fill(bg);
    stroke(border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 3, 3, "FD");
  }

  function drawPill(text, x, y, fg = COLORS.gold, bg = COLORS.s2, pad = 3) {
    const label = safeStr(text, "N/A").toUpperCase();
    setFont(5.8, "bold");
    const pillW = doc.getTextWidth(label) + pad * 2;
    fill(bg);
    stroke(fg);
    doc.setLineWidth(0.18);
    doc.roundedRect(x, y, pillW, 5.5, 2, 2, "FD");
    color(fg);
    doc.text(label, x + pillW / 2, y + 3.8, { align: "center" });
    return pillW;
  }

  function wrapText(text, x, y, maxW, lineH = 4.2, maxLines = 4) {
    const lines = doc.splitTextToSize(safeStr(text), maxW).slice(0, maxLines);
    doc.text(lines, x, y);
    return y + lines.length * lineH;
  }

  function drawMetricBar(label, value, y, x, width, c) {
    const safeVal = safeScore(value);
    const col = c || scoreColor(safeVal);
    setFont(7, "normal");
    color(COLORS.dim);
    doc.text(safeStr(label).toUpperCase(), x, y);
    const barY = y + 2;
    const barW = width - 16;
    fill(COLORS.s2);
    doc.roundedRect(x, barY, barW, 3.2, 1.5, 1.5, "F");
    fill(col);
    doc.roundedRect(x, barY, Math.max(1, (safeVal / 100) * barW), 3.2, 1.5, 1.5, "F");
    setFont(8, "bold");
    color(col);
    doc.text(String(safeVal), x + width, y + 3.4, { align: "right" });
    return y + 9;
  }

  function drawScoreCard(label, value, x, y, cardW, cardH) {
    const safeVal = safeScore(value);
    const col = scoreColor(safeVal);
    drawCard(x, y, cardW, cardH, COLORS.s1);
    fill(col);
    doc.roundedRect(x, y, cardW, 1.8, 1, 1, "F");
    setFont(17, "bold");
    color(col);
    doc.text(String(safeVal), x + cardW / 2, y + 12, { align: "center" });
    setFont(5.4, "bold");
    color(COLORS.dim);
    doc.text(safeStr(label).toUpperCase(), x + cardW / 2, y + 17, { align: "center" });
    setFont(5.2, "bold");
    color(col);
    doc.text(scoreLabel(safeVal), x + cardW / 2, y + 21, { align: "center" });
  }

  function drawGradeBadge(grade, x, y, r, withLabel = true) {
    const safeGrade = safeStr(grade, "B");
    const col = gradeColor(safeGrade);
    const pct = safeScore(r.overall_score, gradeScore(safeGrade));
    stroke(COLORS.border);
    doc.setLineWidth(3);
    doc.circle(x, y, r, "S");
    stroke(col);
    doc.setLineWidth(2.2);
    const start = -90;
    const end = start + (pct / 100) * 360;
    for (let a = start; a <= end; a += 6) {
      const a1 = (Math.PI / 180) * a;
      const a2 = (Math.PI / 180) * Math.min(a + 5, end);
      doc.line(x + Math.cos(a1) * r, y + Math.sin(a1) * r, x + Math.cos(a2) * r, y + Math.sin(a2) * r);
    }
    setFont(safeGrade.length > 1 ? 17 : 21, "bold");
    color(col);
    doc.text(safeGrade, x, y + 4, { align: "center" });
    if (withLabel) {
      setFont(5, "bold");
      color(COLORS.dim);
      doc.text("GRADE", x, y + 10, { align: "center" });
    }
  }

  function page(title, pageNum, fn) {
    if (pageNum > 1) doc.addPage();
    try {
      drawPageBackground();
      if (pageNum > 1) drawHeader(title, pageNum);
      fn();
    } catch (err) {
      console.error(`PDF page ${pageNum} failed`, err);
      drawPageBackground();
      if (pageNum > 1) drawHeader(title, pageNum);
      setFont(10, "bold");
      color(COLORS.red);
      doc.text("This report section could not be rendered.", 15, 40);
    }
  }

  function formatTime(seconds) {
    const n = Math.max(0, safeNum(seconds));
    const m = Math.floor(n / 60);
    const s = String(n % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  const metrics = [
    ["Viral Potential", r.viral_potential],
    ["Hook Strength", r.hook_strength],
    ["Hold Rate", r.hold_rate],
    ["Emotional Peak", r.emotional_peak],
    ["Brand Recall", r.brand_recall],
    ["Memory Encoding", r.memory_encoding],
    ["Sound-Off Survival", r.sound_off_survival],
    ["Share Intent", r.share_intent],
    ["Creative Efficiency", r.creative_efficiency],
    ["Ad Fatigue Risk", r.ad_fatigue_risk],
    ["Cultural Resonance", r.cultural_resonance],
    ["Celebrity/Talent", r.celebrity_talent_index],
    ["Brand Safety", r.brand_safety],
    ["Regulatory Compliance", r.regulatory_compliance],
    ["1P Data Opp.", r.first_party_data_opportunity],
    ["Carbon Signal", r.carbon_signal],
    ["System 1 vs System 2", r.system1_vs_system2],
  ];

  const platformLabels = [
    ["youtube_preroll_6s", "YouTube 6s Bumper"],
    ["youtube_instream", "YouTube In-Stream"],
    ["instagram_reels", "Instagram Reels"],
    ["instagram_stories", "Instagram Stories"],
    ["instagram_feed", "Instagram Feed"],
    ["meta_feed", "Meta Feed"],
    ["tiktok", "TikTok"],
    ["linkedin_feed", "LinkedIn Feed"],
    ["twitter_x", "Twitter/X"],
    ["tv_broadcast", "TV Broadcast"],
    ["ctv_ott", "CTV/OTT"],
    ["youtube_preroll_15s", "YouTube 15s Pre-Roll"],
    ["meta_stories", "Meta Stories"],
    ["dooh", "DOOH"],
    ["programmatic_display", "Programmatic Display"],
  ];

  function platformValue(scores, key, label) {
    if (scores[key] != null) return scores[key];
    const norm = (s) => safeStr(s).toLowerCase().replace(/[^a-z0-9]/g, "");
    const wanted = norm(key + label);
    const found = Object.entries(scores).find(([k]) => wanted.includes(norm(k)) || norm(k).includes(norm(label.split(" ")[0])));
    return found ? found[1] : 0;
  }

  page("Cover", 1, () => {
    fill(COLORS.gold);
    doc.rect(0, 0, W, 5, "F");
    setFont(8, "bold");
    color(COLORS.gold);
    doc.text("NEURAL CREATIVE INTELLIGENCE", 18, 34);
    setFont(36, "bold");
    color(COLORS.text);
    doc.text("AdCritIQ™", 18, 51);
    setFont(14, "normal");
    color(COLORS.dim);
    doc.text("Creative Intelligence Report", 18, 61);
    stroke(COLORS.gold);
    doc.setLineWidth(0.6);
    doc.line(18, 70, 112, 70);

    drawGradeBadge(r.overall_grade, 168, 52, 18);

    const metaRows = [
      ["Brand", brand],
      ["Client", meta.client],
      ["Campaign", meta.campaign],
      ["Industry", meta.industry],
      ["Country", meta.country || meta.market],
      ["Creative Type", meta.type],
      ["Report Date", reportDate],
    ];
    drawCard(18, 86, 174, 54, COLORS.s1, COLORS.border);
    metaRows.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 28 + col * 82;
      const y = 99 + row * 11;
      setFont(6.5, "bold");
      color(COLORS.muted);
      doc.text(k.toUpperCase(), x, y);
      setFont(8.5, "normal");
      color(COLORS.text);
      doc.text(safeStr(v, "—"), x, y + 5);
    });

    if (r.headline_verdict) {
      setFont(10, "italic");
      color(COLORS.goldSoft);
      const lines = doc.splitTextToSize(`"${safeStr(r.headline_verdict)}"`, 160).slice(0, 2);
      doc.text(lines, 105, 160, { align: "center" });
    }

    drawCard(22, 185, 166, 34, COLORS.s1, COLORS.gold);
    setFont(7, "bold");
    color(COLORS.gold);
    doc.text("REPORT SCOPE", 31, 197);
    setFont(8, "normal");
    color(COLORS.dim);
    doc.text("17 neural metrics  |  15 platform environments  |  Scene intelligence  |  Strategic action plan", 31, 207);

    setFont(9, "bold");
    color(COLORS.gold);
    doc.text("Powered by AdCritIQ™", W / 2, 263, { align: "center" });
    setFont(7, "normal");
    color(COLORS.muted);
    doc.text("Confidential directional intelligence. Not a neuroscience lab measurement.", W / 2, 271, { align: "center" });
  });

  page("Executive Summary", 2, () => {
    let y = drawSectionTitle("17 Neural Metrics", 24);
    const primary = metrics.slice(0, 9);
    const cardW = 54;
    const cardH = 24;
    primary.forEach(([label, value], i) => {
      const x = 15 + (i % 3) * 58;
      const yy = y + Math.floor(i / 3) * 29;
      drawScoreCard(label, value, x, yy, cardW, cardH);
    });
    y += 94;

    y = drawSectionTitle("Secondary Metrics", y);
    const secondary = metrics.slice(9);
    secondary.forEach(([label, value], i) => {
      const x = 18 + (i % 2) * 88;
      const yy = y + Math.floor(i / 2) * 12;
      const v = safeScore(value);
      setFont(7, "normal");
      color(COLORS.dim);
      doc.text(label.toUpperCase(), x, yy);
      setFont(10, "bold");
      color(scoreColor(v));
      doc.text(String(v), x + 72, yy, { align: "right" });
    });
    y += 54;

    drawCard(15, y, 180, 44, COLORS.s1);
    setFont(8, "bold");
    color(COLORS.gold);
    doc.text("EXECUTIVE VERDICT", 22, y + 11);
    setFont(8.5, "italic");
    color(COLORS.dim);
    wrapText(r.headline_verdict || r.creative_summary || "No executive verdict available.", 22, y + 22, 166, 5, 3);
    if (r.grade_note) {
      setFont(7, "normal");
      color(COLORS.muted);
      wrapText(r.grade_note, 22, y + 36, 166, 4, 2);
    }
  });

  page("Platform Scores — 15 Media Environments", 3, () => {
    let y = drawSectionTitle("Platform Performance", 24);
    const scores = safeObj(r.platform_scores);
    const values = platformLabels.map(([key, label]) => [label, safeScore(platformValue(scores, key, label))]);
    const left = values.slice(0, 8);
    const right = values.slice(8);
    left.forEach(([label, value], i) => drawMetricBar(label, value, y + i * 12, 15, 82));
    right.forEach(([label, value], i) => drawMetricBar(label, value, y + i * 12, 110, 82));
    y += 108;

    const sorted = values.slice().sort((a, b) => b[1] - a[1]);
    const best = sorted[0] || ["N/A", 0];
    const worst = sorted[sorted.length - 1] || ["N/A", 0];
    drawCard(15, y, 85, 25, COLORS.s1, COLORS.green);
    fill(COLORS.green);
    doc.roundedRect(15, y, 85, 2.2, 1, 1, "F");
    setFont(7, "bold");
    color(COLORS.green);
    doc.text("BEST PLATFORM", 22, y + 10);
    setFont(9, "bold");
    color(COLORS.text);
    doc.text(`${best[0]} (${best[1]})`, 22, y + 18);

    drawCard(110, y, 85, 25, COLORS.s1, COLORS.red);
    fill(COLORS.red);
    doc.roundedRect(110, y, 85, 2.2, 1, 1, "F");
    setFont(7, "bold");
    color(COLORS.red);
    doc.text("RE-EDIT PRIORITY", 117, y + 10);
    setFont(9, "bold");
    color(COLORS.text);
    doc.text(`${worst[0]} (${worst[1]})`, 117, y + 18);
  });

  page(creativeFormat === "static_image" ? "Creative Anatomy" : creativeFormat === "text" ? "Copy Intelligence" : creativeFormat === "audio" ? "Audio & Script Intelligence" : "Scene Intelligence", 4, () => {
    let y = drawSectionTitle(creativeFormat === "static_image" ? "Visual Zone Analysis" : creativeFormat === "text" ? "Copy Section Analysis" : creativeFormat === "audio" ? "Audio / Script Moment Analysis" : "Scene-by-Scene Analysis", 24);
    const scenes = safeArr(r.scenes).slice(0, 5);
    if (!scenes.length) {
      setFont(9, "normal");
      color(COLORS.dim);
      doc.text("No scene data available.", 15, y + 8);
      return;
    }
    scenes.forEach((scene, i) => {
      const s = safeObj(scene);
      const att = safeScore(s.attention, 50);
      const emo = safeScore(s.emotion, 50);
      const sc = scoreColor(att);
      const h = 36;
      drawCard(15, y, 180, h, COLORS.s1);
      fill(sc);
      doc.roundedRect(15, y, 2.5, h, 1, 1, "F");
      setFont(7, "bold");
      color(COLORS.gold);
      doc.text(safeStr(s.ts, `Scene ${i + 1}`), 22, y + 8);
      setFont(9, "bold");
      color(COLORS.text);
      doc.text(safeStr(s.name, "Scene"), 22, y + 15);
      drawMetricBar("Attention", att, y + 22, 22, 54, COLORS.cyan);
      drawMetricBar("Emotion", emo, y + 22, 82, 54, COLORS.rose);
      drawPill(s.system_mode || "mixed", 143, y + 18, COLORS.cyan, COLORS.s2);
      if (safeStr(s.risk_flag, "none") !== "none") drawPill(s.risk_flag, 143, y + 25, COLORS.red, COLORS.s2);
      if (s.drop_second != null) {
        setFont(6.8, "bold");
        color(COLORS.red);
        doc.text(`Drop risk: ${formatTime(s.drop_second)}`, 143, y + 34);
      }
      setFont(7, "normal");
      color(COLORS.dim);
      wrapText(s.desc, 22, y + 32, 110, 4, 1);
      y += h + 6;
    });
  });

  page("Strategic Insights & CMO Playbook", 5, () => {
    let y = drawSectionTitle("Strategic Signal Map", 24);
    const insights = safeArr(r.strategic_insights || r.insights);
    const insightStages = [
      ["Brand Strength", COLORS.green],
      ["Growth Barrier", COLORS.red],
      ["Platform Opportunity", COLORS.cyan],
      ["Action Focus", COLORS.gold],
    ];
    const nodeW = 41.5;
    insightStages.forEach(([label, fallback], i) => {
      const item = safeObj(insights[i]);
      if (!insights[i]) return;
      const tone = item.vtype === "risk" ? COLORS.red : item.vtype === "win" ? COLORS.green : item.vtype === "tip" ? COLORS.cyan : fallback;
      const x = 15 + i * 45;
      drawCard(x, y, nodeW, 35, COLORS.s1, tone);
      setFont(6.2, "bold");
      color(tone);
      doc.text(String(i + 1), x + 5, y + 8);
      doc.text(label.toUpperCase(), x + nodeW - 4, y + 8, { align: "right" });
      setFont(7.3, "bold");
      color(COLORS.text);
      wrapText(item.title, x + 5, y + 16, nodeW - 10, 3.5, 2);
      if (item.vtype) drawPill(item.vtype, x + 5, y + 27, tone, COLORS.s2, 2);
      if (i < Math.min(insights.length, 4) - 1) {
        setFont(11, "bold");
        color(COLORS.gold);
        doc.text("→", x + nodeW + 2, y + 20);
      }
    });
    y += 45;

    y = drawSectionTitle("Strategic Insights", y);
    const vtC = { risk: COLORS.red, win: COLORS.green, tip: COLORS.cyan, watch: COLORS.amber };
    insights.slice(0, 3).forEach((itemRaw, i) => {
      const item = safeObj(itemRaw);
      const tone = vtC[safeStr(item.vtype, "watch")] || COLORS.amber;
      drawCard(15, y, 180, 25, COLORS.s1);
      fill(tone);
      doc.roundedRect(15, y, 2.5, 25, 1, 1, "F");
      setFont(8.5, "bold");
      color(COLORS.text);
      doc.text(safeStr(item.title, `Insight ${i + 1}`), 22, y + 9);
      drawPill(item.vtype || item.verdict || "watch", 166, y + 5, tone, COLORS.s2, 2);
      setFont(7, "normal");
      color(COLORS.dim);
      wrapText(item.body, 22, y + 17, 160, 4, 2);
      y += 30;
    });

    y = drawSectionTitle("CMO Action Flow", y + 2);
    const actions = safeArr(r.cmo_actions);
    const actionStages = [
      ["Fix Hook", COLORS.red],
      ["Adapt Platforms", COLORS.cyan],
      ["Amplify Strengths", COLORS.green],
      ["Scale Investment", COLORS.gold],
    ];
    actionStages.forEach(([label, fallback], i) => {
      const action = safeObj(actions[i]);
      if (!actions[i]) return;
      const tone = action.priority === "critical" ? COLORS.red : action.priority === "high" ? COLORS.amber : fallback;
      const x = 15 + i * 45;
      drawCard(x, y, nodeW, 32, COLORS.s1, tone);
      setFont(6.2, "bold");
      color(tone);
      doc.text(safeStr(action.num, String(i + 1)), x + 5, y + 8);
      doc.text(label.toUpperCase(), x + nodeW - 4, y + 8, { align: "right" });
      setFont(7.2, "bold");
      color(COLORS.text);
      wrapText(action.title, x + 5, y + 15, nodeW - 10, 3.4, 2);
      const uplift = action.estimated_uplift_pct != null ? `+${safeNum(action.estimated_uplift_pct)}%` : safeStr(action.impact, "");
      if (uplift) {
        setFont(6.2, "bold");
        color(COLORS.green);
        doc.text(uplift, x + 5, y + 28);
      }
      if (i < Math.min(actions.length, 4) - 1) {
        setFont(11, "bold");
        color(COLORS.gold);
        doc.text("→", x + nodeW + 2, y + 18);
      }
    });
    y += 42;

    y = drawSectionTitle("CMO Playbook — Priority Actions", y);
    actions.slice(0, 3).forEach((actionRaw, i) => {
      const action = safeObj(actionRaw);
      const p = safeStr(action.priority, "medium");
      const tone = p === "critical" ? COLORS.red : p === "high" ? COLORS.amber : p === "low" ? COLORS.dim : COLORS.gold;
      drawCard(15, y, 180, 27, COLORS.s1);
      fill(tone);
      doc.roundedRect(15, y, 2.5, 27, 1, 1, "F");
      setFont(7, "bold");
      color(COLORS.gold);
      doc.text(`ACTION ${safeStr(action.num, String(i + 1))}`, 22, y + 8);
      const pW = drawPill(p, 48, y + 4, tone, COLORS.s2, 2);
      drawPill(`Effort: ${safeStr(action.effort, "medium")}`, 51 + pW, y + 4, COLORS.dim, COLORS.s2, 2);
      setFont(8.5, "bold");
      color(COLORS.text);
      doc.text(safeStr(action.title, `Action ${i + 1}`), 22, y + 16);
      setFont(7, "normal");
      color(COLORS.dim);
      wrapText(action.body, 22, y + 23, 132, 4, 1);
      const uplift = action.estimated_uplift_pct != null ? `Est. +${safeNum(action.estimated_uplift_pct)}% ${impactLabel}` : safeStr(action.impact, "");
      if (uplift) {
        setFont(6.8, "bold");
        color(COLORS.green);
        doc.text(uplift, 162, y + 24, { align: "right" });
      }
      y += 32;
    });
  });

  page("Methodology & Limitations", 6, () => {
    let y = drawSectionTitle("About AdCritIQ™ Scoring", 24);
    setFont(25, "bold");
    color(COLORS.gold);
    doc.text("AdCritIQ™", W / 2, y + 13, { align: "center" });
    setFont(8, "normal");
    color(COLORS.dim);
    doc.text("Predictive creative intelligence for faster, sharper CMO decisions.", W / 2, y + 22, { align: "center" });
    y += 36;

    drawCard(15, y, 84, 65, COLORS.s1, COLORS.green);
    drawCard(111, y, 84, 65, COLORS.s1, COLORS.red);
    setFont(8, "bold");
    color(COLORS.green);
    doc.text("ADCRITIQ™ IS", 24, y + 10);
    color(COLORS.red);
    doc.text("ADCRITIQ™ IS NOT", 120, y + 10);
    const isList = [
      "A predictive pre-screening tool",
      "Directional intelligence for re-edits",
      "A platform suitability guide",
      "A fast alternative to qual research",
    ];
    const notList = [
      "A biometric or neuroscience lab study",
      "A replacement for consumer research",
      "A campaign performance guarantee",
      "A legal compliance certification",
    ];
    setFont(7.2, "normal");
    isList.forEach((txt, i) => {
      color(COLORS.dim);
      doc.text(`• ${txt}`, 24, y + 22 + i * 9);
    });
    notList.forEach((txt, i) => {
      color(COLORS.dim);
      doc.text(`• ${txt}`, 120, y + 22 + i * 9);
    });
    y += 78;

    drawCard(15, y, 180, 50, COLORS.s1, COLORS.amber);
    setFont(8, "bold");
    color(COLORS.amber);
    doc.text("METHODOLOGY NOTE", 24, y + 11);
    setFont(7.5, "normal");
    color(COLORS.dim);
    wrapText(
      "All scores are AI predictions based on visual frame analysis. They represent the most probable cognitive response based on established advertising science patterns, not measured neural activity from EEG, fMRI, or biometric devices. Cultural Resonance scores are calibrated for the selected market context and should be recalibrated for other markets.",
      24,
      y + 22,
      162,
      4.4,
      6
    );

    setFont(9, "bold");
    color(COLORS.gold);
    doc.text(`Generated by AdCritIQ™ | ${reportDate}`, W / 2, 254, { align: "center" });
    setFont(7, "normal");
    color(COLORS.muted);
    doc.text("Confidential. For strategic discussion only.", W / 2, 262, { align: "center" });
  });

  const safeBrand = brand.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`AdCritIQ_${safeBrand}_${fileDate}.pdf`);
}
