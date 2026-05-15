// ADVantage Insights Brain Encoder — Premium PDF Report Generator
// Uses jsPDF for client-side PDF generation

export async function generateBrainEncoderPDF(results, form) {
  const { jsPDF } = await import("jspdf");

  const r = results;
  const W = 210, H = 297; // A4 mm

  // ── PALETTE ─────────────────────────────────────────────
  const BG      = [6,   8,  16];
  const PANEL   = [10,  13,  30];
  const CARD    = [16,  20,  40];
  const BORDER  = [30,  35,  65];
  const TEXT    = [240, 240, 248];
  const DIM     = [136, 144, 176];
  const GOLD    = [201, 168,  76];
  const GOLDL   = [232, 201, 122];
  const GREEN   = [ 34, 212, 114];
  const AMBER   = [245, 166,  35];
  const ORANGE  = [232, 121,  58];
  const RED     = [240,  90, 106];
  const CYAN    = [  0, 212, 184];
  const PURPLE  = [155, 127, 234];
  const ROSE    = [244,  63,  94];

  const scoreColor = (v) =>
    v >= 80 ? GREEN : v >= 60 ? AMBER : v >= 40 ? ORANGE : RED;

  const gradeColor = (g) =>
    g && (g.startsWith("A")) ? GREEN :
    g && (g.startsWith("B")) ? AMBER :
    g && (g.startsWith("C")) ? ORANGE : RED;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setProperties({
    title: `Brain Encoder Report — ${form.brand || "Creative Analysis"}`,
    author: "ADVantage Insights",
    subject: "Neural Creative Intelligence Report",
    creator: "ADVantage Insights Brain Encoder Platform"
  });

  let pageNum = 0;
  const totalPages = 10;

  // ── HELPERS ──────────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    // Dark background
    doc.setFillColor(...BG);
    doc.rect(0, 0, W, H, "F");
    drawPageFooter();
  }

  function drawPageFooter() {
    // Footer bar
    doc.setFillColor(...PANEL);
    doc.rect(0, H - 12, W, 12, "F");
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(0, H - 12, W, H - 12);
    doc.setFontSize(7);
    doc.setTextColor(...DIM);
    doc.text("ADVantage Insights™  |  Brain Encoder Platform™  |  Confidential — For Internal Use Only", 10, H - 5);
    doc.setTextColor(...GOLD);
    doc.text(`Page ${pageNum}`, W - 10, H - 5, { align: "right" });
  }

  function drawHeader(rightLabel) {
    doc.setFillColor(...PANEL);
    doc.rect(0, 0, W, 18, "F");
    doc.setDrawColor(...GOLD[0], ...GOLD.slice(1));
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.setLineWidth(0.5);
    doc.line(0, 18, W, 18);
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.text("ADVantage Insights™", 10, 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text("Brain Encoder Platform™  |  Neural Creative Intelligence", 10, 12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN);
    doc.text(rightLabel, W - 10, 9, { align: "right" });
  }

  function sectionPill(x, y, text, bg = GOLD) {
    const tw = doc.getTextWidth(text);
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, tw + 8, 6, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BG);
    doc.text(text, x + 4, y + 4.2);
    return tw + 8;
  }

  function sectionTitle(x, y, text, color = GOLD) {
    doc.setDrawColor(...color);
    doc.setLineWidth(1.5);
    doc.line(x, y, x, y + 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(text.toUpperCase(), x + 4, y + 7);
  }

  function card(x, y, w, h, fillColor = CARD) {
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
  }

  function topAccent(x, y, w, color) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, w, 2, 1, 1, "F");
  }

  function scoreBlock(x, y, label, value, w = 44, h = 28) {
    const c = scoreColor(value);
    card(x, y, w, h, [12, 16, 35]);
    topAccent(x, y, w, c);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DIM);
    doc.text(label.toUpperCase(), x + w / 2, y + 9, { align: "center" });
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c);
    doc.text(String(value), x + w / 2, y + 21, { align: "center" });
    // mini bar
    doc.setFillColor(...BORDER);
    doc.roundedRect(x + 4, y + 23, w - 8, 2, 1, 1, "F");
    doc.setFillColor(...c);
    doc.roundedRect(x + 4, y + 23, (w - 8) * (value / 100), 2, 1, 1, "F");
  }

  function barRow(x, y, label, value, color, labelW = 50) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(label, x, y + 3.5);
    const barX = x + labelW;
    const barW = W - x - labelW - 20;
    doc.setFillColor(...BORDER);
    doc.roundedRect(barX, y, barW, 5, 2, 2, "F");
    doc.setFillColor(...color);
    doc.roundedRect(barX, y, barW * (value / 100), 5, 2, 2, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(String(value), barX + barW + 3, y + 4);
  }

  function wrapText(text, x, y, maxW, lineH = 4.5, maxLines = 10) {
    if (!text) return y;
    const words = String(text).split(" ");
    let line = "", lines = [];
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (doc.getTextWidth(test) <= maxW) { line = test; }
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    lines = lines.slice(0, maxLines);
    for (const l of lines) {
      doc.text(l, x, y);
      y += lineH;
    }
    return y;
  }

  function drawLimitationsBox(x, y, w) {
    const h = 28;
    doc.setFillColor(20, 15, 10);
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    doc.setFillColor(...AMBER);
    doc.roundedRect(x, y, w, 3, 1, 1, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AMBER);
    doc.text("! GUARDRAILS & LIMITATIONS", x + 4, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.setFontSize(6.8);
    const limits = [
      "This report is generated by AI and should be treated as directional intelligence, not definitive measurement.",
      "Scores are predictive models based on cognitive science frameworks — not neuroscience lab results.",
      "Platform scores are estimates; actual performance depends on targeting, creative fatigue, and bid dynamics.",
      "Cultural and regulatory signals are indicative only. Consult legal and compliance teams before broadcast."
    ];
    let ly = y + 14;
    for (const l of limits) {
      doc.text("•", x + 4, ly);
      wrapText(l, x + 8, ly, w - 14, 4, 2);
      ly += 5;
    }
    return y + h + 4;
  }

  // ══════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════
  newPage();

  // Glow effect (simulated with gradient circles)
  doc.setFillColor(8, 18, 30);
  doc.circle(W / 2, 80, 60, "F");
  doc.setFillColor(8, 15, 25);
  doc.circle(W / 2, 80, 45, "F");

  // Top header
  doc.setFillColor(...PANEL);
  doc.rect(0, 0, W, 20, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(0, 20, W, 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("ADVANTAGE INSIGHTS", 10, 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DIM);
  doc.text("Neural Creative Intelligence  |  Confidential", 10, 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DIM);
  doc.text(`${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, W - 10, 11, { align: "right" });

  // Brand label
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("BRAIN ENCODER", W / 2, 38, { align: "center" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DIM);
  doc.text("PLATFORM", W / 2, 43, { align: "center" });

  // Gold rule
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(W / 2 - 30, 46, W / 2 + 30, 46);

  // Main title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  const brand = form.brand || "Creative Analysis";
  doc.text(brand, W / 2, 62, { align: "center" });

  if (form.campaign) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GOLD);
    doc.text(form.campaign, W / 2, 72, { align: "center" });
  }

  // Grade badge
  const gc = gradeColor(r.overall_grade);
  doc.setFillColor(gc[0] * 0.15, gc[1] * 0.15, gc[2] * 0.15);
  doc.setDrawColor(...gc);
  doc.setLineWidth(0.6);
  doc.roundedRect(W / 2 - 18, 80, 36, 22, 3, 3, "FD");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gc);
  doc.text("OVERALL GRADE", W / 2, 88, { align: "center" });
  doc.setFontSize(20);
  doc.text(r.overall_grade || "—", W / 2, 99, { align: "center" });

  // Headline verdict
  if (r.headline_verdict) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(...GOLDL);
    const lines = doc.splitTextToSize(`"${r.headline_verdict}"`, W - 40);
    doc.text(lines, W / 2, 112, { align: "center" });
  }

  // 4 stat blocks
  const stats = [
    ["17", "Neural Metrics"],
    ["15", "Platform Scores"],
    ["11", "Dashboard Tabs"],
    ["∞", "Duration Support"]
  ];
  const sw = 40, sx0 = (W - stats.length * sw - (stats.length - 1) * 4) / 2;
  stats.forEach(([val, lbl], i) => {
    const sx = sx0 + i * (sw + 4);
    card(sx, 128, sw, 20, CARD);
    topAccent(sx, 128, sw, CYAN);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN);
    doc.text(val, sx + sw / 2, 141, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(lbl, sx + sw / 2, 146, { align: "center" });
  });

  // Creative metadata
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(10, 158, W - 10, 158);
  const metaItems = [
    ["Client", form.client || "—"],
    ["Agency", form.agency || "—"],
    ["Type", form.type || "video"],
    ["Industry", form.industry || "—"],
    ["Market", form.market || "India"],
  ];
  doc.setFontSize(7);
  const metaW = (W - 20) / metaItems.length;
  metaItems.forEach(([k, v], i) => {
    const mx = 10 + i * metaW + metaW / 2;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DIM);
    doc.text(k.toUpperCase(), mx, 164, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT);
    doc.text(v, mx, 169, { align: "center" });
  });

  // Summary paragraph
  if (r.creative_summary) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const sumLines = doc.splitTextToSize(r.creative_summary, W - 30);
    doc.text(sumLines.slice(0, 6), W / 2, 180, { align: "center" });
  }

  // Limitations on cover
  drawLimitationsBox(10, 222, W - 20);

  // Bottom brand
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("ADVantage Insights™  |  Anil Pandit  |  2026", W / 2, 262, { align: "center" });

  // ══════════════════════════════════════════════════════════
  // PAGE 2 — EXECUTIVE METRICS
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("EXECUTIVE METRICS");

  let y = 26;
  sectionPill(10, y, "17 NEURAL PERFORMANCE METRICS", GOLD);
  y += 10;

  const metrics = [
    ["Viral Potential",    r.viral_potential],
    ["Hook Strength",      r.hook_strength],
    ["Hold Rate",          r.hold_rate],
    ["Emotional Peak",     r.emotional_peak],
    ["Brand Recall",       r.brand_recall],
    ["Memory Encoding",    r.memory_encoding],
    ["Sound-Off Survival", r.sound_off_survival],
    ["Share Intent",       r.share_intent],
    ["Creative Efficiency",r.creative_efficiency],
    ["Ad Fatigue Risk",    r.ad_fatigue_risk],
    ["Cultural Resonance", r.cultural_resonance],
    ["Celebrity Index",    r.celebrity_talent_index],
    ["Brand Safety",       r.brand_safety],
    ["Regulatory",         r.regulatory_compliance],
    ["1P Data Opp.",       r.first_party_data_opportunity],
    ["Carbon Signal",      r.carbon_signal],
    ["System 1 vs 2",      r.system1_vs_system2],
  ];

  // Grid: 4 cols × 5 rows (last one alone)
  const cols = 4;
  const bw = (W - 20 - (cols - 1) * 4) / cols;
  metrics.forEach(([lbl, val], i) => {
    if (val === undefined) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    scoreBlock(10 + col * (bw + 4), y + row * 33, lbl, val, bw, 29);
  });

  y += Math.ceil(metrics.length / cols) * 33 + 6;

  // Competitive benchmark
  const comp = r.competitive_context || {};
  if (comp.benchmark_note) {
    card(10, y, W - 20, 18, CARD);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text("COMPETITIVE BENCHMARK", 14, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(comp.benchmark_note, 14, y + 13);
    const pos = comp.position || "average";
    const posC = pos === "category_leader" || pos === "above_average" ? GREEN : pos === "average" ? AMBER : RED;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...posC);
    doc.text(pos.replace(/_/g, " ").toUpperCase(), W - 14, y + 10, { align: "right" });
  }

  // ══════════════════════════════════════════════════════════
  // PAGE 3 — ATTENTION & EMOTION
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("ATTENTION & EMOTIONAL ARCHITECTURE");
  y = 26;

  // Attention curve
  card(10, y, W - 20, 52, CARD);
  sectionTitle(14, y + 4, "Attention Curve (Predicted)", CYAN);
  const attn = r.attention_curve || [];
  if (attn.length > 1) {
    const chartX = 14, chartY = y + 18, chartW = W - 28, chartH = 28;
    doc.setFillColor(...BORDER);
    doc.rect(chartX, chartY, chartW, chartH, "F");
    // Grid lines
    [25, 50, 75].forEach(pct => {
      const gy = chartY + chartH - (pct / 100) * chartH;
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.line(chartX, gy, chartX + chartW, gy);
      doc.setFontSize(5.5);
      doc.setTextColor(...DIM);
      doc.text(String(pct), chartX - 3, gy + 1.5, { align: "right" });
    });
    // Attention area
    const step = chartW / (attn.length - 1);
    const pts = attn.map((v, i) => [chartX + i * step, chartY + chartH - (v / 100) * chartH]);
    doc.setFillColor(0, 212, 184, 0.2);
    // Draw path
    doc.setDrawColor(...CYAN);
    doc.setLineWidth(1.2);
    for (let i = 1; i < pts.length; i++) {
      doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    }
    // Emotion curve
    const emot = r.emotion_curve || [];
    if (emot.length > 1) {
      const epts = emot.map((v, i) => [chartX + i * step, chartY + chartH - (v / 100) * chartH]);
      doc.setDrawColor(...AMBER);
      doc.setLineWidth(0.8);
      for (let i = 1; i < epts.length; i++) {
        doc.line(epts[i - 1][0], epts[i - 1][1], epts[i][0], epts[i][1]);
      }
    }
    // Legend
    doc.setFontSize(6);
    doc.setDrawColor(...CYAN); doc.setLineWidth(1);
    doc.line(chartX + chartW - 60, chartY + chartH + 4, chartX + chartW - 48, chartY + chartH + 4);
    doc.setTextColor(...CYAN);
    doc.text("Attention", chartX + chartW - 46, chartY + chartH + 5.5);
    doc.setDrawColor(...AMBER);
    doc.line(chartX + chartW - 25, chartY + chartH + 4, chartX + chartW - 13, chartY + chartH + 4);
    doc.setTextColor(...AMBER);
    doc.text("Emotion", chartX + chartW - 11, chartY + chartH + 5.5);
  }
  y += 58;

  // Attention stats
  const peak = attn.length ? Math.max(...attn) : 0;
  const pkI = attn.indexOf(peak);
  const low = attn.length ? Math.min(...attn) : 0;
  const avg = attn.length ? Math.round(attn.reduce((a, b) => a + b, 0) / attn.length) : 0;

  const aStats = [
    ["Peak Attention", `${peak}% at ~${pkI}s`, scoreColor(peak)],
    ["Lowest Point", `${low}%`, scoreColor(low)],
    ["Average Attention", `${avg}%`, scoreColor(avg)],
  ];
  const asw = (W - 20 - 8) / 3;
  aStats.forEach(([lbl, val, col], i) => {
    card(10 + i * (asw + 4), y, asw, 18, CARD);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DIM);
    doc.text(lbl.toUpperCase(), 10 + i * (asw + 4) + asw / 2, y + 7, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...col);
    doc.text(val, 10 + i * (asw + 4) + asw / 2, y + 15, { align: "center" });
  });
  y += 24;

  // Emotion types
  card(10, y, W - 20, 52, CARD);
  sectionTitle(14, y + 4, "Emotion Architecture", ROSE);
  const emotTypes = r.emotion_types || {};
  const eColors = { joy: GREEN, surprise: AMBER, trust: CYAN, fear: RED, desire: ROSE, curiosity: PURPLE };
  const domEmots = Object.entries(emotTypes)
    .map(([k, arr]) => ({ k, sum: (arr || []).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.sum - a.sum);

  domEmots.slice(0, 6).forEach(({ k, sum }, i) => {
    const ex = 14, ey = y + 18 + i * 5.5;
    const col = eColors[k] || DIM;
    const val = Math.round(sum / 5);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(k.charAt(0).toUpperCase() + k.slice(1), ex, ey + 3.5);
    const bx = ex + 28, bw2 = W - 50;
    doc.setFillColor(...BORDER);
    doc.roundedRect(bx, ey, bw2, 4, 1.5, 1.5, "F");
    doc.setFillColor(...col);
    doc.roundedRect(bx, ey, bw2 * (val / 100), 4, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...col);
    doc.text(String(val), bx + bw2 + 3, ey + 3.5);
  });
  y += 58;

  // ══════════════════════════════════════════════════════════
  // PAGE 4 — NEURAL MAP
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("NEURAL MAP");
  y = 26;

  const br = r.brain_regions || {};
  const cl = r.cognitive_channels || {};

  // Two-col: brain regions + cognitive channels
  const halfW = (W - 24) / 2;

  card(10, y, halfW, 76, CARD);
  sectionTitle(14, y + 4, "Brain Region Activation", PURPLE);
  Object.entries(br).forEach(([k, v], i) => {
    barRow(14, y + 18 + i * 7.5, k.replace(/_/g, " "), v, PURPLE, 40);
  });

  card(14 + halfW, y, halfW, 76, CARD);
  sectionTitle(18 + halfW, y + 4, "Cognitive Channel Load", CYAN);
  Object.entries(cl).forEach(([k, v], i) => {
    barRow(18 + halfW, y + 18 + i * 7.5, k.replace(/_/g, " "), v, CYAN, 36);
  });
  y += 82;

  // System 1 vs 2
  card(10, y, W - 20, 24, CARD);
  sectionTitle(14, y + 4, "System 1 vs System 2 Processing Balance", AMBER);
  const s12 = r.system1_vs_system2 || 50;
  const zone = s12 >= 65 && s12 <= 75 ? "OPTIMAL ZONE (65-75)" : s12 < 65 ? "OVER-INDEXING RATIONAL" : "OVER-INDEXING EMOTIONAL";
  const zoneC = s12 >= 65 && s12 <= 75 ? GREEN : AMBER;
  const trackX = 14, trackW = W - 28, trackY = y + 16;
  doc.setFillColor(...BORDER);
  doc.roundedRect(trackX, trackY, trackW, 5, 2, 2, "F");
  // Gradient-like: blue → orange
  const gradW = trackW * (s12 / 100);
  doc.setFillColor(79, 142, 247);
  doc.roundedRect(trackX, trackY, gradW, 5, 2, 2, "F");
  // Needle
  doc.setFillColor(...TEXT);
  doc.rect(trackX + gradW - 0.5, trackY - 1, 1.5, 7, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...zoneC);
  doc.text(`Score: ${s12}/100 — ${zone}`, W / 2, y + 25, { align: "center" });
  y += 30;

  // ══════════════════════════════════════════════════════════
  // PAGE 5 — PLATFORM SCORES
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("PLATFORM SCORES");
  y = 26;

  sectionPill(10, y, "15 PLATFORM-SPECIFIC SCORES", GOLD);
  y += 10;

  const ps = r.platform_scores || {};
  const platLabels = {
    youtube_preroll_6s: "YouTube 6s", youtube_preroll_15s: "YouTube 15s",
    youtube_instream: "YouTube In-stream", instagram_reels: "Insta Reels",
    instagram_stories: "Insta Stories", instagram_feed: "Insta Feed",
    meta_feed: "Meta Feed", meta_stories: "Meta Stories",
    tiktok: "TikTok", linkedin_feed: "LinkedIn",
    twitter_x: "Twitter / X", tv_broadcast: "TV Broadcast",
    ctv_ott: "CTV / OTT", dooh: "DOOH", programmatic_display: "Programmatic"
  };

  const platEntries = Object.entries(ps).sort((a, b) => b[1] - a[1]);
  const pcols = 5, pw2 = (W - 20 - (pcols - 1) * 3) / pcols;
  platEntries.forEach(([k, v], i) => {
    const pc = i % pcols;
    const pr = Math.floor(i / pcols);
    const px = 10 + pc * (pw2 + 3);
    const py2 = y + pr * 36;
    const c = scoreColor(v);
    card(px, py2, pw2, 32, [12, 16, 35]);
    topAccent(px, py2, pw2, c);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c);
    doc.text(String(v), px + pw2 / 2, py2 + 17, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(platLabels[k] || k, px + pw2 / 2, py2 + 22, { align: "center" });
    // Grade
    const g = v >= 90 ? "A+" : v >= 80 ? "A" : v >= 70 ? "B+" : v >= 60 ? "B" : v >= 50 ? "C+" : v >= 40 ? "C" : "D";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...c);
    doc.text(g, px + pw2 / 2, py2 + 28, { align: "center" });
  });

  y += Math.ceil(platEntries.length / pcols) * 36 + 8;

  // Best/worst callouts
  if (platEntries.length) {
    const best = platEntries[0], worst = platEntries[platEntries.length - 1];
    const cbw = (W - 24) / 2;
    card(10, y, cbw, 18, CARD);
    doc.setFillColor(...GREEN);
    doc.roundedRect(10, y, cbw, 2.5, 1, 1, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text(`BEST: ${platLabels[best[0]] || best[0]} (${best[1]})`, 14, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text("Prioritise media spend here.", 14, y + 15);

    card(14 + cbw, y, cbw, 18, CARD);
    doc.setFillColor(...RED);
    doc.roundedRect(14 + cbw, y, cbw, 2.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...RED);
    doc.text(`WEAKEST: ${platLabels[worst[0]] || worst[0]} (${worst[1]})`, 18 + cbw, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text("Do not run without a format-specific re-edit.", 18 + cbw, y + 15);
  }

  // ══════════════════════════════════════════════════════════
  // PAGE 6 — SCENE INTELLIGENCE
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("SCENE INTELLIGENCE");
  y = 26;

  sectionPill(10, y, "SCENE-BY-SCENE NEURAL BREAKDOWN", CYAN);
  y += 10;

  const scenes = r.scenes || [];
  const riskColors = { none: GREEN, drop_zone: RED, ad_avoidance: AMBER, cognitive_overload: ROSE, pacing_issue: PURPLE };

  scenes.forEach((sc, i) => {
    const sh = 44;
    const scC = scoreColor(sc.attention || 50);
    card(10, y, W - 20, sh, CARD);
    topAccent(10, y, W - 20, scC);
    // Timestamp
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CYAN);
    doc.text(sc.ts || `Scene ${i + 1}`, 14, y + 9);
    // Name
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(sc.name || "Scene", 14, y + 16);
    // Description
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const descLines = doc.splitTextToSize(sc.desc || "", W - 28);
    doc.text(descLines.slice(0, 3), 14, y + 22);
    // Stats row
    const statY = y + 38;
    const statItems = [
      [`Attention: ${sc.attention || 0}%`, scoreColor(sc.attention || 0)],
      [`Emotion: ${sc.emotion || 0}%`, scoreColor(sc.emotion || 0)],
      [sc.system_mode || "mixed", CYAN],
      [sc.cognitive_load || "medium", AMBER],
      [sc.risk_flag || "none", riskColors[sc.risk_flag] || GREEN],
    ];
    let sx2 = 14;
    statItems.forEach(([label, col]) => {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...col);
      doc.text(label, sx2, statY);
      sx2 += doc.getTextWidth(label) + 8;
    });
    y += sh + 4;
    if (y > H - 40) {
      newPage();
      drawHeader("SCENE INTELLIGENCE (CONT.)");
      y = 26;
    }
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 7 — SOUND & PRIVACY
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("SOUND & SENSORY  |  PRIVACY & COMPLIANCE");
  y = 26;

  // Sound
  const snd = r.sound_analysis || {};
  card(10, y, W - 20, 70, CARD);
  sectionTitle(14, y + 4, "Sound & Sensory Analysis", PURPLE);

  const soundFields = [
    ["Sound Dependency",      snd.sound_dependency,      PURPLE],
    ["Music Effectiveness",   snd.music_effectiveness,   PURPLE],
    ["Voiceover Clarity",     snd.voiceover_clarity,     CYAN],
    ["Sound-Off Text Quality",snd.sound_off_text_quality,GREEN],
    ["ASMR Trigger",          snd.asmr_trigger,          ROSE],
    ["Sonic Branding",        snd.sonic_branding,        AMBER],
  ];
  soundFields.forEach(([lbl, val, col], i) => {
    const col2 = i % 2;
    const row2 = Math.floor(i / 2);
    const sx3 = col2 === 0 ? 14 : W / 2 + 4;
    barRow(sx3, y + 18 + row2 * 9, lbl, val || 0, col, col2 === 0 ? 50 : 50);
  });
  if (snd.sound_note) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const snLines = doc.splitTextToSize(snd.sound_note, W - 28);
    doc.text(snLines.slice(0, 2), 14, y + 58);
  }
  // Sound-Off Survival big number
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...scoreColor(r.sound_off_survival || 0));
  doc.text(String(r.sound_off_survival || 0), W - 24, y + 32);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DIM);
  doc.text("Sound-Off Survival", W - 24, y + 38, { align: "center" });
  y += 76;

  // Privacy
  const priv = r.privacy_and_data_audit || {};
  card(10, y, W - 20, 70, CARD);
  sectionTitle(14, y + 4, "Privacy & DPDP Compliance Audit", AMBER);

  const privChecks = [
    ["Data Collection Present",       priv.data_collection_present],
    ["Consent Mechanism Visible",     priv.consent_mechanism_visible],
    ["QR Code Present",               priv.qr_code_present],
    ["URL / CTA Present",             priv.url_cta_present],
    ["Hashtag Present",               priv.hashtag_present],
    ["Regulatory Disclaimers Visible",priv.regulatory_disclaimers_visible],
  ];
  privChecks.forEach(([lbl, val], i) => {
    const ci = i % 2, ri = Math.floor(i / 2);
    const px2 = ci === 0 ? 14 : W / 2 + 4;
    const py3 = y + 18 + ri * 9;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(lbl, px2 + 8, py3 + 3.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(val ? GREEN[0] : RED[0], val ? GREEN[1] : RED[1], val ? GREEN[2] : RED[2]);
    doc.text(val ? "YES" : "NO", px2, py3 + 3.5);
  });

  // DPDP Risk badge
  const dpdpC = priv.dpdp_compliance_risk === "high" ? RED : priv.dpdp_compliance_risk === "medium" ? AMBER : GREEN;
  doc.setFillColor(dpdpC[0] * 0.15, dpdpC[1] * 0.15, dpdpC[2] * 0.15);
  doc.setDrawColor(...dpdpC);
  doc.setLineWidth(0.4);
  doc.roundedRect(W - 40, y + 16, 28, 14, 2, 2, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dpdpC);
  doc.text("DPDP RISK", W - 26, y + 22, { align: "center" });
  doc.setFontSize(9);
  doc.text((priv.dpdp_compliance_risk || "LOW").toUpperCase(), W - 26, y + 28, { align: "center" });

  if (priv.privacy_note) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const pnLines = doc.splitTextToSize(priv.privacy_note, W - 28);
    doc.text(pnLines.slice(0, 2), 14, y + 58);
  }

  // ══════════════════════════════════════════════════════════
  // PAGE 8 — STRATEGIC INSIGHTS
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("STRATEGIC INSIGHTS");
  y = 26;

  sectionPill(10, y, "AI-GENERATED STRATEGIC INSIGHTS", GOLD);
  y += 10;

  const ins = r.strategic_insights || r.insights || [];
  const vtColors = { risk: RED, win: GREEN, tip: CYAN, watch: AMBER };

  ins.forEach((insight, i) => {
    const vc = vtColors[insight.vtype] || AMBER;
    const ih = 42;
    card(10, y, W - 20, ih, CARD);
    doc.setFillColor(...vc);
    doc.roundedRect(10, y, 2.5, ih, 1, 1, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DIM);
    doc.text(insight.num || String(i + 1).padStart(2, "0"), 16, y + 8);
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    doc.text(insight.title || "", 16, y + 15);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const bodyLines = doc.splitTextToSize(insight.body || "", W - 34);
    doc.text(bodyLines.slice(0, 3), 16, y + 22);
    if (insight.verdict) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...vc);
      doc.text(`→ ${insight.verdict}`, 16, y + 38);
    }
    // Verdict type badge
    const bpw = doc.getTextWidth((insight.vtype || "watch").toUpperCase()) + 6;
    doc.setFillColor(vc[0] * 0.2, vc[1] * 0.2, vc[2] * 0.2);
    doc.roundedRect(W - 10 - bpw, y + 6, bpw, 6, 1.5, 1.5, "F");
    doc.setFontSize(6);
    doc.setTextColor(...vc);
    doc.text((insight.vtype || "watch").toUpperCase(), W - 10 - bpw / 2, y + 10.5, { align: "center" });

    y += ih + 4;
    if (y > H - 40) {
      newPage();
      drawHeader("STRATEGIC INSIGHTS (CONT.)");
      y = 26;
    }
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 9 — CMO PLAYBOOK
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("CMO PLAYBOOK");
  y = 26;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("FOR THE MARKETING HEAD", 10, y);
  y += 6;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  doc.text("The ", 10, y + 12);
  doc.setTextColor(...GOLD);
  doc.text("CMO Playbook", 10 + doc.getTextWidth("The "), y + 12);
  y += 18;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DIM);
  doc.text("Prioritised actions mapped to metric gaps. Sorted by impact-to-effort ratio.", 10, y);
  y += 10;

  const cmo = r.cmo_actions || [];
  const prioColors = { critical: RED, high: AMBER, medium: GOLD, low: DIM };

  cmo.forEach((action, i) => {
    const pc = prioColors[action.priority] || GOLD;
    const ah = 44;
    card(10, y, W - 20, ah, CARD);
    topAccent(10, y, W - 20, pc);
    // Action number + badges
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GOLD);
    doc.text(`ACTION ${action.num || String(i + 1).padStart(2, "0")}`, 14, y + 9);
    // Priority badge
    const prioW = doc.getTextWidth((action.priority || "medium").toUpperCase()) + 6;
    doc.setFillColor(pc[0] * 0.2, pc[1] * 0.2, pc[2] * 0.2);
    doc.roundedRect(50, y + 5, prioW, 6, 1.5, 1.5, "F");
    doc.setFontSize(6);
    doc.setTextColor(...pc);
    doc.text((action.priority || "medium").toUpperCase(), 50 + prioW / 2, y + 9.5, { align: "center" });
    // Effort
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    doc.text(`Effort: ${action.effort || "medium"}`, 50 + prioW + 6, y + 9.5);
    // Title
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    doc.text(action.title || "", 14, y + 18);
    // Body
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const aLines = doc.splitTextToSize(action.body || "", W - 32);
    doc.text(aLines.slice(0, 2), 14, y + 25);
    // Impact
    if (action.impact) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GREEN);
      doc.text(`→ ${action.impact}`, 14, y + 39);
    }
    y += ah + 4;
    if (y > H - 40) {
      newPage();
      drawHeader("CMO PLAYBOOK (CONT.)");
      y = 26;
    }
  });

  // ══════════════════════════════════════════════════════════
  // PAGE 10 — GUARDRAILS & METHODOLOGY
  // ══════════════════════════════════════════════════════════
  newPage();
  drawHeader("GUARDRAILS, LIMITATIONS & METHODOLOGY");
  y = 26;

  sectionPill(10, y, "IMPORTANT — READ BEFORE ACTING ON THIS REPORT", RED);
  y += 10;

  const guardrails = [
    ["AI-Generated Analysis", "This report is produced by a large language model (Claude Sonnet 4 by Anthropic) analyzing visual frames from your creative. It is not a neuroscience lab study, eye-tracking session, or biometric measurement. Treat it as directional intelligence."],
    ["Predictive, Not Measured", "All scores represent predicted cognitive responses based on advertising science frameworks — Byron Sharp's Distinctive Brand Assets, Kahneman's System 1/2 theory, Nelson-Field attention economics, Heath's low-attention processing model. They are not empirical measurements."],
    ["Platform Score Limitations", "Platform scores estimate suitability based on format, sound-on/off norms, and attention patterns. Actual campaign performance depends on audience targeting, bid strategy, creative fatigue, competitive pressure, and algorithmic distribution — none of which this tool measures."],
    ["Cultural & Regulatory Signals", "Cultural resonance and regulatory compliance signals are indicative only. Consult your compliance, legal, and market research teams before making broadcast or distribution decisions."],
    ["Frame Sampling", "Analysis is based on 2-3 extracted frames, not the full video stream. Rapid scene changes, transitions, or short-form content (under 6s) may produce lower accuracy. For maximum accuracy, upload key scenes as separate image files."],
    ["No Guarantee of Outcomes", "ADVantage Insights makes no warranty that acting on these recommendations will improve campaign performance. This tool is designed to inform creative strategy discussions, not replace media or creative professionals."],
  ];

  guardrails.forEach(([title, body]) => {
    card(10, y, W - 20, 28, [14, 18, 35]);
    doc.setFillColor(...RED);
    doc.roundedRect(10, y, 2.5, 28, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AMBER);
    doc.text(title, 16, y + 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DIM);
    const bLines = doc.splitTextToSize(body, W - 30);
    doc.text(bLines.slice(0, 3), 16, y + 15);
    y += 32;
  });

  // Methodology summary
  y += 4;
  card(10, y, W - 20, 36, CARD);
  doc.setFillColor(...GOLD);
  doc.roundedRect(10, y, W - 20, 2.5, 1, 1, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("SCIENTIFIC METHODOLOGY", 14, y + 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DIM);
  const methText = "Brain Encoder analyzes advertising creatives through three stages: (1) Frame extraction — visual frames are sampled at optimal intervals. (2) Neural activation prediction — frames are analyzed using multimodal AI vision against 17 advertising science constructs covering attention, memory, emotion, and behavioral response. (3) Platform calibration — each creative is scored against 15 media environments accounting for format, sound-on/off ratios, viewing duration norms, and algorithmic signals.";
  const methLines = doc.splitTextToSize(methText, W - 28);
  doc.text(methLines.slice(0, 4), 14, y + 18);

  // Final brand footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.text("ADVantage Insights™  |  Brain Encoder Platform™  |  Anil Pandit  |  2026", W / 2, y + 44, { align: "center" });

  // ── SAVE ────────────────────────────────────────────────
  const safeBrand = (form.brand || "Creative").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`BrainEncoder_${safeBrand}_${dateStr}.pdf`);
}
