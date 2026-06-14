import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ensureArtifactToolWorkspace,
  importArtifactTool,
  createSlideContext,
  saveBlobToFile,
} from "/Users/anipandi/.codex/plugins/cache/openai-primary-runtime/presentations/26.601.10930/skills/presentations/scripts/artifact_tool_utils.mjs";

const WORKSPACE = "/Users/anipandi/Documents/Brain Encoder/outputs/manual-20260613-184718-adcritiq/presentations/adcritiq-decks";
const OUTPUT_DIR = path.join(WORKSPACE, "output");
const PREVIEW_DIR = path.join(WORKSPACE, "preview");
const LAYOUT_DIR = path.join(WORKSPACE, "layout");
const ASSET_DIR = path.join(WORKSPACE, "assets");
const SLIDE_SIZE = { width: 1280, height: 720 };
const LOGO_DARK = "/Users/anipandi/Documents/Brain Encoder/public/adcritiq-logo-dark.png";
const LOGO_LIGHT = "/Users/anipandi/Documents/Brain Encoder/public/adcritiq-logo-light.png";

const C = {
  bg: "#07070D",
  panel: "#11111A",
  panel2: "#171720",
  panel3: "#20202C",
  text: "#F6F2E8",
  dim: "#B6B1CE",
  muted: "#77728F",
  gold: "#D7B762",
  goldD: "#B68414",
  cyan: "#23C7D9",
  teal: "#35BFA7",
  green: "#63D394",
  red: "#F26D82",
  purple: "#A78BFA",
  amber: "#F0A93A",
  ink: "#090912",
  white: "#FFFFFF",
  slate: "#2D2D3A",
};

function line(fill = "transparent", width = 0) {
  return { style: "solid", fill, width };
}

function addBg(slide, ctx, opts = {}) {
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill: C.bg, line: line() });
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill: "linear(135deg, #07070D 0%, #11111A 55%, #050509 100%)", line: line() });
  ctx.addShape(slide, { left: -120, top: -180, width: 520, height: 520, geometry: "ellipse", fill: "#D7B76216", line: line() });
  ctx.addShape(slide, { left: 920, top: 500, width: 500, height: 500, geometry: "ellipse", fill: "#23C7D912", line: line() });
  if (opts.rule !== false) ctx.addShape(slide, { left: 58, top: 640, width: 1164, height: 1, fill: "#D7B76255", line: line() });
}

async function addLogo(slide, ctx, variant = "dark", x = 54, y = 32, w = 172) {
  await ctx.addImage(slide, { path: variant === "light" ? LOGO_LIGHT : LOGO_DARK, left: x, top: y, width: w, height: w * 0.31, fit: "contain", alt: "AdCritIQ logo" });
}

function txt(slide, ctx, text, x, y, w, h, opts = {}) {
  return ctx.addText(slide, {
    text,
    left: x,
    top: y,
    width: w,
    height: h,
    fontSize: opts.size ?? 24,
    color: opts.color ?? C.text,
    bold: opts.bold ?? false,
    typeface: opts.face ?? (opts.serif ? "Georgia" : "Aptos"),
    align: opts.align ?? "left",
    valign: opts.valign ?? "top",
    fill: opts.fill ?? "transparent",
    line: opts.line ?? line(),
    insets: opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

function kicker(slide, ctx, text, x = 70, y = 92, color = C.gold) {
  txt(slide, ctx, text.toUpperCase(), x, y, 760, 22, { size: 13, color, bold: true, face: "Aptos Mono" });
}

function title(slide, ctx, text, x = 70, y = 124, w = 720, size = 50, h = 160) {
  txt(slide, ctx, text, x, y, w, h, { size, color: C.text, bold: true, face: "Aptos Display" });
}

function subtitle(slide, ctx, text, x = 70, y = 264, w = 680, h = 92) {
  txt(slide, ctx, text, x, y, w, h, { size: 21, color: C.dim });
}

function footer(slide, ctx, deck, n) {
  txt(slide, ctx, `${deck}  ·  AdCritIQ™  ·  Just the signal before the spend.`, 58, 660, 850, 20, { size: 10, color: C.muted, face: "Aptos Mono" });
  txt(slide, ctx, `${String(n).padStart(2, "0")}`, 1170, 657, 50, 20, { size: 11, color: C.gold, face: "Aptos Mono", align: "right" });
}

function card(slide, ctx, x, y, w, h, opts = {}) {
  ctx.addShape(slide, {
    left: x, top: y, width: w, height: h,
    fill: opts.fill ?? "#FFFFFF08",
    line: line(opts.stroke ?? "#FFFFFF18", opts.strokeWidth ?? 1),
  });
  if (opts.accent) ctx.addShape(slide, { left: x, top: y, width: 4, height: h, fill: opts.accent, line: line() });
}

function bulletList(slide, ctx, items, x, y, w, h, opts = {}) {
  const lines = items.map((d) => `• ${d}`).join("\n");
  txt(slide, ctx, lines, x, y, w, h, { size: opts.size ?? 18, color: opts.color ?? C.dim, face: "Aptos" });
}

function metricPill(slide, ctx, label, value, x, y, w, color = C.green) {
  card(slide, ctx, x, y, w, 72, { fill: "#FFFFFF09", stroke: "#FFFFFF18" });
  txt(slide, ctx, label.toUpperCase(), x + 16, y + 13, w - 32, 16, { size: 10, color: C.muted, bold: true, face: "Aptos Mono" });
  txt(slide, ctx, value, x + 16, y + 31, w - 32, 30, { size: 26, color, bold: true });
}

function sectionSlide(ctx, presentation, deck, n, label, headline, copy) {
  const slide = presentation.slides.add();
  addBg(slide, ctx, { rule: false });
  kicker(slide, ctx, label, 80, 112, C.gold);
  title(slide, ctx, headline, 80, 170, 940, 52, 150);
  subtitle(slide, ctx, copy, 82, 332, 880, 118);
  ctx.addShape(slide, { left: 82, top: 508, width: 740, height: 4, fill: "linear(90deg, #D7B762 0%, #23C7D9 54%, #A78BFA 100%)", line: line() });
  footer(slide, ctx, deck, n);
  return slide;
}

function claimSlide(ctx, presentation, deck, n, s) {
  const slide = presentation.slides.add();
  addBg(slide, ctx);
  kicker(slide, ctx, s.kicker || deck);
  title(slide, ctx, s.title, 70, 124, s.titleWidth || 690, s.titleSize || 38, 190);
  subtitle(slide, ctx, s.copy, 70, s.copyY || 325, 650, s.copyH || 108);
  if (s.bullets) bulletList(slide, ctx, s.bullets, 82, s.bulletY || 465, 590, 130, { size: 15 });
  if (s.cards) {
    const cols = s.cards.length > 3 ? 2 : 1;
    const cw = cols === 2 ? 235 : 440;
    s.cards.forEach((c, i) => {
      const x = 775 + (i % cols) * (cw + 20);
      const y = 122 + Math.floor(i / cols) * 118;
      card(slide, ctx, x, y, cw, 96, { accent: c.color || C.gold, fill: "#FFFFFF08" });
      txt(slide, ctx, c.label, x + 18, y + 15, cw - 36, 24, { size: 14, color: c.color || C.gold, bold: true, face: "Aptos Mono" });
      txt(slide, ctx, c.text, x + 18, y + 42, cw - 36, 42, { size: 13, color: C.dim });
    });
  }
  if (s.metrics) {
    s.metrics.forEach((m, i) => metricPill(slide, ctx, m.label, m.value, 770 + (i % 2) * 220, 136 + Math.floor(i / 2) * 92, 200, m.color));
  }
  if (s.diagram === "funnel") addFunnel(slide, ctx, 760, 132, 410, 390, s.funnel || []);
  if (s.diagram === "workflow") addWorkflow(slide, ctx, 742, 116, 450, 420);
  if (s.diagram === "platform") addPlatformMap(slide, ctx, 735, 110, 470, 430);
  if (s.table) addTable(slide, ctx, s.table, 722, 128, 480, 390);
  footer(slide, ctx, deck, n);
  return slide;
}

function addFunnel(slide, ctx, x, y, w, h, items) {
  const defaults = ["Creative exposure", "Attention", "Memory", "Preference", "Action or waste"];
  const arr = items.length ? items : defaults;
  arr.forEach((it, i) => {
    const iw = w - i * 42;
    const ix = x + i * 21;
    const iy = y + i * 74;
    card(slide, ctx, ix, iy, iw, 54, { fill: ["#D7B7621F", "#23C7D91A", "#63D3941A", "#A78BFA1A", "#F26D8218"][i] || "#FFFFFF08", stroke: "#FFFFFF18" });
    txt(slide, ctx, it, ix + 18, iy + 15, iw - 36, 20, { size: 15, color: C.text, bold: true });
  });
}

function addWorkflow(slide, ctx, x, y, w, h) {
  const steps = [
    ["01", "Creative Intake", "brand, market, format, production stage"],
    ["02", "Signal Engine", "attention, memory, emotion, compliance"],
    ["03", "Outcome Forecast", "awareness, intent, response, waste risk"],
    ["04", "CMO Decision", "fix, scale, certify, or benchmark"],
  ];
  steps.forEach((s, i) => {
    const yy = y + i * 92;
    card(slide, ctx, x, yy, w, 70, { accent: [C.gold, C.cyan, C.green, C.purple][i], fill: "#FFFFFF08" });
    txt(slide, ctx, s[0], x + 16, yy + 17, 40, 24, { size: 16, color: [C.gold, C.cyan, C.green, C.purple][i], bold: true, face: "Aptos Mono" });
    txt(slide, ctx, s[1], x + 68, yy + 12, w - 88, 22, { size: 16, color: C.text, bold: true });
    txt(slide, ctx, s[2], x + 68, yy + 38, w - 88, 20, { size: 12, color: C.dim });
  });
}

function addPlatformMap(slide, ctx, x, y, w, h) {
  const modules = [
    ["Intake", C.gold], ["Neural Map", C.cyan], ["Attention", C.green], ["Emotion", C.purple],
    ["Platform Scores", C.teal], ["Outcome Forecast", C.amber], ["CMO Playbook", C.gold], ["Repository", C.dim],
    ["Competitive Intel", C.red], ["Brand DNA", C.cyan], ["Certification", C.green], ["NeurIQ Chat", C.purple],
  ];
  modules.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = x + col * (w / 3);
    const by = y + row * 84;
    card(slide, ctx, bx, by, w / 3 - 14, 62, { fill: `${m[1]}18`, stroke: `${m[1]}66` });
    txt(slide, ctx, m[0], bx + 12, by + 20, w / 3 - 38, 20, { size: 12, color: C.text, bold: true });
  });
}

function addTable(slide, ctx, rows, x, y, w, h) {
  const rh = h / rows.length;
  rows.forEach((r, i) => {
    const yy = y + i * rh;
    ctx.addShape(slide, { left: x, top: yy, width: w, height: rh - 2, fill: i === 0 ? "#D7B76222" : "#FFFFFF07", line: line("#FFFFFF18", 1) });
    txt(slide, ctx, r[0], x + 14, yy + 12, w * 0.34, rh - 18, { size: i === 0 ? 12 : 11, color: i === 0 ? C.gold : C.text, bold: true, face: "Aptos Mono" });
    txt(slide, ctx, r[1], x + w * 0.38, yy + 12, w * 0.58, rh - 18, { size: i === 0 ? 12 : 11, color: i === 0 ? C.gold : C.dim });
  });
}

function titleSlide(ctx, presentation, deck, n, s) {
  const slide = presentation.slides.add();
  addBg(slide, ctx, { rule: false });
  return (async () => {
    await addLogo(slide, ctx, "dark", 72, 54, 245);
    kicker(slide, ctx, s.kicker, 78, 178);
    title(slide, ctx, s.title, 78, 220, 850, 54, 150);
    subtitle(slide, ctx, s.copy, 82, 400, 720, 105);
    card(slide, ctx, 880, 158, 280, 330, { fill: "#FFFFFF08", stroke: "#D7B76244", accent: C.gold });
    txt(slide, ctx, s.sideTitle || "Boardroom package", 910, 195, 220, 34, { size: 20, color: C.text, bold: true });
    bulletList(slide, ctx, s.side || ["Investor narrative", "Enterprise product deck", "GTM strategy", "Quick pitch"], 910, 250, 210, 150, { size: 15 });
    txt(slide, ctx, s.date || "June 2026", 910, 430, 180, 20, { size: 12, color: C.gold, face: "Aptos Mono" });
    footer(slide, ctx, deck, n);
    return slide;
  })();
}

const investorSlides = [
  { type: "title", kicker: "Investor deck", title: "Creative accountability before media spend.", copy: "AdCritIQ™ is a creative-to-media outcome intelligence platform that helps enterprises forecast whether exposure is likely to become memory, consideration, action, or waste.", sideTitle: "Investor thesis", side: ["AI makes creative volume explode", "Media is measured; creative is under-instrumented", "AdCritIQ becomes the pre-spend decision layer"] },
  { kicker: "The big market shift", title: "AI is moving advertising from production speed to decision intelligence.", copy: "Generative AI reduces the cost of making assets. That creates a new bottleneck: deciding which assets deserve production, adaptation, media investment, or rejection before spend is committed.", cards: [{ label: "Then", text: "Creative review was subjective and late.", color: C.muted }, { label: "Now", text: "AI enables predictive scoring before launch.", color: C.cyan }, { label: "Next", text: "Outcome forecasting becomes a boardroom control layer.", color: C.gold }] },
  { kicker: "Market opportunity", title: "A trillion-dollar advertising system still lacks a creative risk layer.", copy: "Global ad revenue is around the trillion-dollar level, while the tools around media buying, attribution, and optimization are mature. The missing layer is predictive creative diagnosis before budget scale.", metrics: [{ label: "Global ad revenue", value: "~$1T+", color: C.gold }, { label: "Deck source", value: "GroupM / Axios", color: C.dim }, { label: "SAM", value: "$5–15B*", color: C.cyan }, { label: "SOM", value: "$10–50M ARR*", color: C.green }], bullets: ["*SAM/SOM are founder-model assumptions, not verified revenue claims.", "Opportunity sits across creative analytics, pre-testing, AI marketing tools, and enterprise effectiveness workflows."] },
  { kicker: "Industry gap", title: "Campaign stacks explain what happened. They rarely predict whether the creative will work.", copy: "Brand lift, media dashboards, and attribution are valuable, but they usually arrive after spend. AdCritIQ moves creative diagnosis upstream: concept, storyboard, rough cut, and final creative.", diagram: "funnel", bullets: ["Post-campaign measurement is too late to fix production decisions.", "Media teams absorb blame for creative-led underperformance.", "Agencies lack an objective language for creative readiness."] },
  { kicker: "Pain point", title: "Every weak creative creates three costs: production rework, media waste, and organizational blame.", copy: "Large advertisers need a disciplined way to know whether an asset should be fixed, localized, scaled, benchmarked, or killed. Today that decision is often made through taste, hierarchy, and delayed research.", cards: [{ label: "CMO", text: "Needs confidence before money moves.", color: C.gold }, { label: "Agency", text: "Needs evidence for route decisions.", color: C.purple }, { label: "Media", text: "Needs to separate creative risk from planning risk.", color: C.cyan }, { label: "Insights", text: "Needs a faster pre-campaign learning loop.", color: C.green }] },
  { kicker: "Solution", title: "AdCritIQ forecasts creative response probability before media spend.", copy: "The platform analyses an asset and translates its creative signals into business-facing probabilities: awareness readiness, consideration, purchase intent, response potential, media wastage risk, and creative accountability.", diagram: "workflow" },
  { kicker: "Product system", title: "A complete operating system for creative intelligence.", copy: "AdCritIQ has evolved beyond a diagnostic scorecard into a workflow: intake, format-aware analysis, outcome forecast, strategic recommendations, repository learning, competitive intelligence, Brand DNA, and certification.", diagram: "platform" },
  { kicker: "Intelligence layer", title: "The methodology links creative signals to likely brand and performance outcomes.", copy: "AdCritIQ uses format-aware creative diagnostics, platform scores, published neuroscience and effectiveness frameworks, and a conservative outcome-forecasting layer. It is predictive, not biometric, and does not guarantee sales lift.", table: [["Layer", "Role"], ["Creative response probability", "Attention, emotion, memory, clarity, brand linkage and action readiness."], ["Platform / format fit", "Whether the same asset is suited to YouTube, Meta, TV, CTV, DOOH, display or LinkedIn."], ["Outcome forecast", "Directional probability that exposure becomes memory, preference, action or waste."], ["Human oversight", "CMO and agency teams interpret the recommendation in campaign context."]] },
  { kicker: "Use cases", title: "The product applies across the creative lifecycle, not only final film testing.", copy: "AdCritIQ can be used before production, before finishing, before media scale, and after campaign learning has accumulated.", cards: [{ label: "Pre-production", text: "Concept and storyboard diagnostics before costly work begins.", color: C.gold }, { label: "Pre-flight", text: "Final creative readiness before media budgets go live.", color: C.cyan }, { label: "Competitive", text: "Track category competitors over time.", color: C.purple }, { label: "Learning loop", text: "Build a brand repository and DNA fingerprint.", color: C.green }] },
  { kicker: "Target customers", title: "Enterprise advertisers are the beachhead; agencies become the multiplier.", copy: "The highest-value buyers are FMCG and enterprise brands with high creative volume, large media budgets, global-local adaptation needs, and strong pressure to improve creative accountability.", table: [["Segment", "Why they buy"], ["FMCG CMO / brand teams", "High media spend, high creative volume, high cost of weak brand memory."], ["Creative agencies", "Evidence layer for pitch, route selection and optimization."], ["Media agencies", "Separates creative-led risk from media-led risk."], ["Insights teams", "Adds a predictive pre-campaign layer before research and lift studies."]] },
  { kicker: "Business model", title: "Multiple routes to enterprise ARR.", copy: "The current product includes credit-based analysis behavior. Enterprise packaging can expand into brand, market, agency and global licenses with add-ons for Competitive Intel, Brand DNA and Certified Creative.", cards: [{ label: "Pilot", text: "Paid diagnostic sprint: 20–50 creatives, one brand and competitor set.", color: C.gold }, { label: "Subscription", text: "Market or brand-team SaaS access with repository and reporting.", color: C.green }, { label: "Agency license", text: "Multi-client creative strategy workflow.", color: C.purple }, { label: "Add-ons", text: "Brand DNA, Competitive Intel, Certification and API integrations.", color: C.cyan }] },
  { kicker: "Competitive landscape", title: "AdCritIQ sits between copy testing, media measurement, and AI creative tools.", copy: "The differentiation is not that AdCritIQ replaces existing research. It creates a faster decision layer before production and media scale, then builds a longitudinal repository of creative learning.", table: [["Alternative", "Gap AdCritIQ addresses"], ["Manual creative review", "Subjective, inconsistent and hard to scale globally."], ["Traditional copy testing", "Powerful but slower and often project-based."], ["Brand lift / attribution", "Post-campaign, too late for many creative fixes."], ["AI creative generation", "Creates more assets but does not decide which deserve spend."]] },
  { kicker: "GTM", title: "Win with pilots that expose creative-led risk before media scale.", copy: "The first commercial motion should be focused: one priority brand, one campaign pipeline, a competitor set, and a CMO workshop that converts diagnostics into action.", diagram: "funnel", funnel: ["Target FMCG brand", "Run 20–50 assets", "Build outcome benchmark", "CMO workshop", "Enterprise expansion"] },
  { kicker: "Why we win", title: "The defensibility grows with workflow adoption and brand-specific learning.", copy: "A one-off score can be copied. A repository of brand-specific creative fingerprints, competitive intelligence, platform outcomes and certified assets becomes harder to replace.", cards: [{ label: "Workflow moat", text: "Used from concept to post-campaign learning.", color: C.gold }, { label: "Data moat", text: "Brand DNA and category benchmarks improve over time.", color: C.cyan }, { label: "Language moat", text: "CMO-ready bridge from creative to outcome.", color: C.green }, { label: "Partner moat", text: "Agencies and media teams can embed it into reviews.", color: C.purple }] },
  { kicker: "The ask", title: "Fund validation, enterprise pilots, and the benchmark data loop.", copy: "Funding ask, current traction and exact use of proceeds require founder input. The suggested 12–18 month milestone path is enterprise pilot conversion, category benchmarks, agency partnerships and security/compliance hardening.", cards: [{ label: "Use of funds", text: "Product hardening, validation studies, enterprise pilots, sales and partnerships.", color: C.gold }, { label: "Milestones", text: "10 pilots, 3 paid enterprise contracts, first category benchmark datasets.", color: C.green }, { label: "Investor CTA", text: "Back the creative accountability layer for the AI advertising era.", color: C.cyan }] },
];

const productSlides = [
  { type: "title", kicker: "Product master deck", title: "The creative intelligence system for enterprise advertisers.", copy: "A detailed client-ready presentation for CMOs, brand teams, media teams, insights leaders and agency partners.", sideTitle: "Client promise", side: ["Diagnose creative before spend", "Forecast business-facing outcomes", "Build a learning repository", "Separate creative risk from media risk"] },
  { type: "section", label: "Section A", headline: "Industry context", copy: "Creative quality still decides whether media exposure creates memory, preference, response or waste. AI has made production faster, but decision quality has not kept pace." },
  { kicker: "How decisions work today", title: "Creative review still depends too much on taste, hierarchy and timing.", copy: "Most enterprise creative reviews happen through meetings, subjective debate, agency rationale and fragmented research. The result is slow decisioning and inconsistent standards across brands, markets and formats.", cards: [{ label: "Slow", text: "Feedback cycles arrive after production pressure has already built.", color: C.red }, { label: "Subjective", text: "Teams debate preference rather than measurable creative response.", color: C.amber }, { label: "Fragmented", text: "Learnings do not compound across markets and campaigns.", color: C.purple }] },
  { kicker: "Why creative matters", title: "Media buys exposure. Creative decides what exposure becomes.", copy: "A media plan can deliver reach and frequency. The creative determines whether that delivery becomes attention, memory, brand linkage, consideration, purchase intent, response or waste.", diagram: "funnel" },
  { kicker: "AI role", title: "AdCritIQ uses AI as decision support, not a replacement for creative judgment.", copy: "The product gives marketers and agencies a structured signal. Human teams still decide the brand strategy, creative idea, channel role, legal interpretation and final go/no-go.", cards: [{ label: "Predictive", text: "Estimates creative response probability.", color: C.gold }, { label: "Not biometric", text: "Does not claim live brain measurement.", color: C.cyan }, { label: "Human-led", text: "Designed for better judgment, not automated taste.", color: C.green }] },
  { type: "section", label: "Section B", headline: "The problem statement", copy: "Brand, agency and media teams all experience the same missing layer from different angles: they need a shared way to diagnose creative risk before spend." },
  { kicker: "Brand team pain", title: "Brand teams need confidence before media, not excuses after launch.", copy: "They need to know whether the creative has enough brand presence, message clarity, memory encoding, emotional fit and platform readiness to justify production and media investment.", cards: [{ label: "Risk", text: "Weak brand linkage lowers memory even when attention is high.", color: C.red }, { label: "Cost", text: "Late fixes create reshoots, re-edits and wasted media.", color: C.amber }, { label: "Governance", text: "Global-local adaptations can drift from brand DNA.", color: C.purple }] },
  { kicker: "Agency and media pain", title: "Agencies need proof; media teams need protection from creative-led underperformance.", copy: "AdCritIQ gives both sides a neutral decision language. It shows which issues are creative-led, which are media-dependent and which are format or platform-fit problems.", diagram: "workflow" },
  { type: "section", label: "Section C", headline: "Product introduction", copy: "AdCritIQ is a creative-to-media outcome intelligence platform built to improve decisions before production, launch and media scale." },
  { kicker: "What it is", title: "A pre-spend signal engine for creative effectiveness.", copy: "Users upload a creative or pre-production asset, add campaign context, and receive a structured readout covering neural diagnostics, platform fit, outcome probability, recommendations and repository learning.", diagram: "platform" },
  { kicker: "User journey", title: "From upload to CMO decision in one workflow.", copy: "The product begins with context and asset intake, adapts its analysis to format and production stage, produces executive-grade outputs, and saves results into a repository for future benchmarking.", diagram: "workflow" },
  { type: "section", label: "Section D", headline: "Feature-by-feature walkthrough", copy: "Each module is designed to answer a specific enterprise decision: fix, scale, localize, benchmark, certify or learn." },
  { kicker: "Creative Intake", title: "Capture the business context before analysis starts.", copy: "The intake screen collects brand, market, industry, audience, production stage, creative type, notes, asset and token. This allows the analysis to interpret the creative as a business asset, not a generic file.", cards: [{ label: "Who uses it", text: "Brand managers, agency planners and insights teams.", color: C.gold }, { label: "Why it matters", text: "Context changes the meaning of scores and recommendations.", color: C.cyan }, { label: "Output", text: "A structured payload for format-aware analysis.", color: C.green }] },
  { kicker: "Production stages", title: "Test before the cost curve becomes expensive.", copy: "AdCritIQ supports concept/script, storyboard, rough cut and final creative. The earlier the signal is surfaced, the cheaper the fix.", cards: [{ label: "Concept", text: "Test the idea before production spend.", color: C.gold }, { label: "Storyboard", text: "Check sequence and message before shoot.", color: C.cyan }, { label: "Rough cut", text: "Edit-level fixes before finishing.", color: C.green }, { label: "Final", text: "Pre-flight check before media budget commits.", color: C.purple }] },
  { kicker: "Format-aware analysis", title: "The product does not force every creative into a video metric model.", copy: "Static images, motion assets, video, audio/script and text/script require different diagnostic logic. AdCritIQ adapts labels, attention views and outcome language to the creative format.", table: [["Format", "Primary diagnostic lens"], ["Video", "Hook, hold, pacing, completion, sound, platform cutdowns."], ["Static image", "Stopping power, visual hierarchy, brand prominence, CTA clarity."], ["Motion / GIF", "First frame, loop clarity, motion salience, loop fatigue."], ["Audio / text", "Sonic or language clarity, memorability, persuasion and claim risk."]] },
  { kicker: "Executive Summary", title: "A boardroom readout for creative readiness.", copy: "The summary consolidates the grade, verdict, headline risks, top metrics and confidence signals. For brands with enough saved data, it can also show Brand DNA match.", cards: [{ label: "Business question", text: "Is this asset ready to scale?", color: C.gold }, { label: "Output", text: "Grade, verdict, key signals and decision direction.", color: C.green }, { label: "User", text: "CMO, Brand Director, Agency Lead.", color: C.cyan }] },
  { kicker: "Neural Map", title: "A neuroscience-informed explanation layer.", copy: "The Neural Map organizes predicted creative response around brain-region-inspired markers and TRIBE v2-informed calibration language. It is a communication framework, not a live biometric claim.", cards: [{ label: "Attention", text: "Visual cortex and attention control cues.", color: C.green }, { label: "Emotion", text: "Amygdala, mirror neuron and reward cues.", color: C.red }, { label: "Memory", text: "Hippocampus and brand encoding cues.", color: C.cyan }] },
  { kicker: "Attention Diagnostics", title: "Show whether the asset gets noticed in the way the format requires.", copy: "For video and motion, the view can show timeline-style attention and recovery. For static image, it shifts to visual hierarchy, stopping power, brand prominence, CTA clarity and clutter risk.", cards: [{ label: "Video", text: "Hook capture, hold rate, drop risk and recovery.", color: C.gold }, { label: "Static", text: "First-glance signal and scan path.", color: C.cyan }, { label: "Business value", text: "Predicts whether exposure becomes actual attention.", color: C.green }] },
  { kicker: "Emotional Architecture", title: "Diagnose whether emotion supports the brand job.", copy: "The module evaluates emotional peak, arc type, coherence, contagion and peak-end memory logic. It helps teams distinguish emotional intensity from useful brand emotion.", cards: [{ label: "Arc", text: "Flat, ascent, wave, cliff or resolution.", color: C.purple }, { label: "Fit", text: "Whether emotion matches category and brand codes.", color: C.gold }, { label: "Action", text: "Shows where emotional design should change.", color: C.green }] },
  { kicker: "Platform Scores", title: "The same asset does not deserve the same spend everywhere.", copy: "Platform scoring evaluates whether a creative is suited for YouTube, Meta, Instagram, TikTok, TV, CTV/OTT, DOOH, display and LinkedIn, then supports channel-specific recommendations.", table: [["Platform role", "Creative implication"], ["YouTube / pre-roll", "Hook, retention and sound/signaling matter."], ["Meta / Instagram", "Thumb-stop, visual clarity and sound-off survival matter."], ["TV / CTV", "Narrative, memory and emotional arc matter."], ["DOOH / display", "Instant decode, brand prominence and CTA clarity matter."]] },
  { kicker: "Outcome Forecast", title: "Translate diagnostics into brand and performance probability.", copy: "The Outcome Forecast estimates directional readiness for spontaneous awareness, aided awareness, consideration, purchase intent, response potential, media wastage risk and creative accountability.", metrics: [{ label: "Awareness", value: "78/84", color: C.green }, { label: "Purchase intent", value: "58", color: C.amber }, { label: "Media waste risk", value: "32", color: C.green }, { label: "Accountability", value: "78", color: C.gold }] },
  { kicker: "Strategic Insights + CMO Playbook", title: "Convert analysis into senior decision language.", copy: "The Strategic Insights tab frames what matters. The CMO Playbook turns that into prioritized actions, effort levels and expected business impact language without rewriting the creative team’s full strategy.", cards: [{ label: "Insight", text: "What signal matters most.", color: C.cyan }, { label: "Action", text: "What to fix or scale.", color: C.gold }, { label: "Decision", text: "What a CMO should do next.", color: C.green }] },
  { kicker: "Repository and Competitive Intel", title: "Make creative learning cumulative instead of campaign-by-campaign.", copy: "Saved analyses can be filtered, grouped and loaded. Competitive Intel tracks competitor creative signals over time so teams can see category movement instead of only their own asset performance.", cards: [{ label: "Repository", text: "Organizational memory for creative performance signals.", color: C.gold }, { label: "Competitors", text: "Brand vs competitor score gaps and trends.", color: C.red }, { label: "Learning", text: "A foundation for benchmarks and Brand DNA.", color: C.cyan }] },
  { kicker: "Brand DNA + Certified Creative", title: "Move from one-off scores to brand-specific creative governance.", copy: "Brand DNA builds a fingerprint from multiple saved analyses. Certified Creative creates a shareable badge when an asset meets threshold criteria. Both are designed to make creative quality visible and reusable.", cards: [{ label: "Brand DNA", text: "Measures fit with a brand’s historical creative signature.", color: C.cyan }, { label: "Certification", text: "Signals asset readiness when criteria are met.", color: C.gold }, { label: "Governance", text: "Useful for global-local campaign review.", color: C.green }] },
  { type: "section", label: "Section E", headline: "Methodology, calculations and interpretation", copy: "The product must be used as a predictive decision aid. It creates creative-response probability scores, not guaranteed business outcomes." },
  { kicker: "Calculation logic", title: "Outcome forecasts are directional probability scores, not exact lift percentages.", copy: "The core equation is: Expected Campaign Outcome = Media Delivery Quality × Creative Response Probability × Platform / Format Fit × Category Elasticity × Brand Baseline Strength. AdCritIQ currently predicts the middle two layers.", table: [["Layer", "Interpretation"], ["Creative Response Probability", "Whether the asset can create attention, memory, preference or action."], ["Platform / Format Fit", "Whether the asset suits the channel context."], ["Not ingested yet", "Reach, frequency, targeting, CPM/CPC, sales and brand baseline data."], ["Use", "Decision guidance before media; validate later with in-market results."]] },
  { kicker: "Score bands", title: "How CMOs should read the numbers.", copy: "Scores should be treated as readiness bands. They help decide whether to scale, test, fix or reject; they should not be described as guaranteed sales lift.", table: [["Band", "Boardroom interpretation"], ["85–100", "High probability / scale-ready if media plan is sound."], ["70–84", "Strong probability / media-ready with minor optimization."], ["55–69", "Moderate probability / test before scaling."], ["40–54", "At risk / creative fix recommended."], ["0–39", "High wastage risk / do not scale without revision."]] },
  { kicker: "Research basis", title: "The science supports the logic; the product remains conservative in its claims.", copy: "AdCritIQ references published research such as TRIBE v2, LAMBDA memorability, Ehrenberg-Bass mental availability, Kahneman, Damasio, Nelson-Field and Binet & Field. These frameworks inform scoring language and interpretation.", cards: [{ label: "TRIBE v2", text: "Published multimodal brain-response foundation model; referenced, not run live.", color: C.gold }, { label: "LAMBDA", text: "Multimodal long-term ad memorability research.", color: C.cyan }, { label: "Ehrenberg-Bass", text: "Distinctive assets and mental availability.", color: C.green }, { label: "Kahneman / Damasio", text: "Peak-end, System 1/2 and emotion-linked memory.", color: C.purple }] },
  { type: "section", label: "Section G", headline: "Enterprise use cases", copy: "The strongest use cases sit where creative decisions are expensive, repeated, and politically visible." },
  { kicker: "Use-case portfolio", title: "Ten enterprise workflows AdCritIQ can support.", copy: "The product is most valuable when it becomes part of the regular creative review and learning cadence.", table: [["Use case", "Business value"], ["FMCG pre-testing", "Prioritize assets before media spend."], ["Global localization", "Protect brand DNA across markets."], ["Competitive benchmarking", "Track category creative pressure."], ["Agency strategy support", "Defend routes with evidence."], ["Retail media optimization", "Improve CTA and product salience."], ["Brand governance", "Reduce compliance and consistency risk."]] },
  { kicker: "Pilot model", title: "A practical enterprise pilot can prove value in 4–6 weeks.", copy: "Start with one priority brand or category. Analyse 20–50 assets, include a competitor set, build baseline score bands, and close with a CMO workshop that identifies fixes, scale candidates and learning opportunities.", diagram: "funnel", funnel: ["Select brand", "Upload 20–50 assets", "Benchmark + forecast", "CMO workshop", "Rollout plan"] },
  { kicker: "Commercial model", title: "Package the platform around usage, teams and learning depth.", copy: "The product can start with analysis credits and expand into enterprise subscriptions, agency licenses, market-level access, competitive intelligence modules and Brand DNA / certification add-ons.", cards: [{ label: "Pilot fee", text: "Scoped diagnostic sprint.", color: C.gold }, { label: "Enterprise SaaS", text: "Brand / market / region license.", color: C.green }, { label: "Agency license", text: "Multi-client creative intelligence seat.", color: C.purple }, { label: "Add-ons", text: "Brand DNA, Competitive Intel, certification.", color: C.cyan }] },
  { kicker: "Why AdCritIQ", title: "The client value is not another dashboard; it is a better creative decision.", copy: "AdCritIQ helps enterprises decide earlier, align faster and learn continuously. It gives creative, media and brand teams a shared evidence language before money is committed.", cards: [{ label: "Before production", text: "Fix ideas when fixes are cheap.", color: C.gold }, { label: "Before media", text: "Know if exposure is likely to work.", color: C.cyan }, { label: "Before blame", text: "Separate creative risk from media risk.", color: C.red }, { label: "After learning", text: "Build brand-specific creative intelligence.", color: C.green }] },
];

const gtmSlides = [
  { type: "title", kicker: "GTM strategy", title: "Turn AdCritIQ into the creative accountability layer for enterprise marketing.", copy: "A go-to-market strategy focused on FMCG pilots, agency multiplication and expansion into brand intelligence workflows.", sideTitle: "GTM objective", side: ["Win focused pilots", "Prove decision impact", "Convert to enterprise licenses", "Build benchmark data loops"] },
  { kicker: "Positioning", title: "Category: creative-to-media outcome intelligence.", copy: "AdCritIQ is positioned between pre-testing, creative analytics, media measurement and AI creative tools. The message: forecast creative impact before media spend.", cards: [{ label: "Functional", text: "Predict readiness and risk before spend.", color: C.gold }, { label: "Emotional", text: "Give CMOs confidence in high-stakes decisions.", color: C.cyan }, { label: "Economic", text: "Reduce creative rework and media waste.", color: C.green }] },
  { kicker: "ICP", title: "The beachhead is high-volume FMCG creative teams.", copy: "FMCG brands have recurring campaigns, large media budgets, category competition, local adaptation pressure and senior visibility. They are ideal early adopters.", table: [["ICP", "Trigger"], ["Enterprise FMCG", "Major campaign, launch, adaptation, low brand lift."], ["Creative agency", "Pitch, route selection, client evidence need."], ["Media agency", "Underperforming campaigns and blame separation."], ["Digital-first brand", "High asset volume and fast testing cadence."]] },
  { kicker: "Buyer map", title: "Sell to the CMO problem, expand through the operating teams.", copy: "The economic buyer wants confidence and accountability. The daily users need faster decisions, clearer fixes and reusable learning.", table: [["Stakeholder", "Message"], ["CMO", "Know whether the creative or media plan is the risk."], ["Brand Director", "Fix assets before spend."], ["Media Director", "Protect media optimization from creative-led failure."], ["Agency Partner", "Defend creative recommendations with evidence."]] },
  { kicker: "Pilot offer", title: "Package a focused Creative Outcome Forecast sprint.", copy: "A compelling pilot should be narrow enough to buy quickly and strategic enough to matter. The strongest pilot: one brand, one campaign pipeline, a competitor set and a senior readout.", diagram: "funnel", funnel: ["1 brand", "20–50 creatives", "3 competitors", "Outcome workshop", "Expansion proposal"] },
  { kicker: "Sales motion", title: "Lead with one campaign risk; land with a repeatable operating cadence.", copy: "The first sale should not be a broad platform transformation. Start with a visible campaign decision, prove usefulness, then expand into repository, competitive tracking and Brand DNA.", cards: [{ label: "Land", text: "Campaign diagnostic sprint.", color: C.gold }, { label: "Prove", text: "Decision changes and stakeholder alignment.", color: C.green }, { label: "Expand", text: "Repository, competitors, Brand DNA.", color: C.cyan }, { label: "Standardize", text: "Quarterly creative review cadence.", color: C.purple }] },
  { kicker: "Proof of value", title: "Measure decision impact before claiming business lift.", copy: "The most credible early proof is operational: faster review cycles, clearer creative fixes, fewer subjective escalations, better asset prioritization, and later correlation with VTR, CTR and brand lift.", table: [["Metric", "Why it matters"], ["Decision speed", "Shows workflow value before in-market data."], ["Creative changes made", "Proves the output drives action."], ["Stakeholder alignment", "Reduces subjective debate."], ["Correlation with campaign KPIs", "Builds long-term validation."]] },
  { kicker: "Partnerships", title: "Agencies can multiply distribution if the product improves their client conversations.", copy: "Creative and media agencies can use AdCritIQ as a pitch aid, pre-flight review tool and learning repository. The offer should position them as better advisors, not as being replaced.", cards: [{ label: "Creative agencies", text: "Route testing and strategic defense.", color: C.purple }, { label: "Media agencies", text: "Creative-readiness input before media plans.", color: C.cyan }, { label: "Insights firms", text: "Fast pre-test layer before deeper research.", color: C.green }] },
  { kicker: "Pricing logic", title: "Start with pilots, then convert to platform access.", copy: "Use a simple ladder: paid pilot, brand license, market license, regional/global license. Keep per-analysis credits for self-serve and smaller teams.", table: [["Package", "Recommended role"], ["Paid pilot", "Low-friction proof and boardroom readout."], ["Brand license", "One brand team and agency partners."], ["Market license", "Multiple brands and local adaptation."], ["Global enterprise", "Repository, governance, benchmarks and integrations."]] },
  { kicker: "Growth loop", title: "Every analysis should make the platform more useful.", copy: "The GTM flywheel is not only new users; it is accumulated creative intelligence. Repository data powers Brand DNA, competitive benchmarks, certification thresholds and stronger enterprise renewal value.", diagram: "funnel", funnel: ["More analyses", "More benchmarks", "Better DNA", "More decisions", "Higher renewal value"] },
  { kicker: "12-month roadmap", title: "Sequence from proof to repeatable enterprise motion.", copy: "The first year should prioritize validation, category benchmarks, enterprise trust and agency partnerships over broad feature sprawl.", table: [["Quarter", "Milestone"], ["Q1", "3 lighthouse pilots and product proof deck."], ["Q2", "10 paid pilots and first agency partnership."], ["Q3", "Category benchmarks and enterprise security package."], ["Q4", "3 annual contracts and global rollout playbook."]] },
  { kicker: "Risks", title: "The objections are predictable and manageable.", copy: "Sophisticated buyers will ask about methodology, validation, overclaiming, data privacy and fit with existing research. The answer is conservative positioning and a clear validation roadmap.", cards: [{ label: "Methodology", text: "Document formulas and research basis.", color: C.gold }, { label: "Validation", text: "Correlate forecasts with campaign KPIs over time.", color: C.green }, { label: "Privacy", text: "Enterprise data handling and access controls.", color: C.cyan }, { label: "Scope", text: "Decision support, not guaranteed lift.", color: C.red }] },
  { kicker: "First 10 accounts", title: "Target accounts where creative spend, politics and learning needs are high.", copy: "The first pipeline should focus on global FMCG and agency ecosystems: Unilever, P&G, Nestlé, Mondelez, Coca-Cola, PepsiCo, L’Oréal, Reckitt/Haleon, WPP/Publicis/Omnicom agencies, and retail media teams.", bullets: ["Prioritize known warm relationships and brands with active campaign pipelines.", "Bring a sample forecast and one category-specific competitor example into every pitch.", "Avoid selling a generic AI tool; sell the decision layer."] },
  { kicker: "Commercial narrative", title: "The buyer should feel this is risk control, not software experimentation.", copy: "The strongest close is: use AdCritIQ before the next media commitment and identify whether the creative is ready, fixable, risky or wasteful.", cards: [{ label: "Pilot promise", text: "Clearer go/no-go decisions within weeks.", color: C.gold }, { label: "Enterprise promise", text: "A repeatable creative accountability system.", color: C.green }, { label: "Category promise", text: "Benchmarks and competitor movement over time.", color: C.cyan }] },
  { kicker: "Next step", title: "Run one high-stakes pilot and make the output boardroom-visible.", copy: "Select one upcoming campaign, 20–50 creative assets, and three competitors. Deliver a CMO-ready readout: what to fix, what to scale, where media may be wasted and what learning should enter the brand repository.", diagram: "workflow" },
];

const quickSlides = [
  { type: "title", kicker: "Quick pitch", title: "AdCritIQ forecasts creative impact before media spend.", copy: "A concise pitch for investors, CMOs and strategic partners.", sideTitle: "The line", side: ["Media buys exposure", "Creative decides memory, action or waste", "AdCritIQ gives the signal before spend"] },
  { kicker: "What it is", title: "A creative-to-media outcome intelligence platform.", copy: "AdCritIQ analyses creative assets and predicts whether exposure is likely to become awareness, consideration, purchase intent, response or media waste.", diagram: "workflow" },
  { kicker: "Problem", title: "Creative is judged before launch, but measured after money is spent.", copy: "Campaign teams have deep media dashboards, but creative readiness is often debated subjectively. When results disappoint, media gets blamed before creative risk is understood.", cards: [{ label: "Subjective", text: "Creative reviews depend on opinion.", color: C.red }, { label: "Late", text: "Research often arrives after launch.", color: C.amber }, { label: "Costly", text: "Weak assets waste production and media.", color: C.gold }] },
  { kicker: "Why now", title: "AI makes more creative possible; AdCritIQ decides what deserves spend.", copy: "As creative volume increases across formats and markets, enterprises need a predictive filter that works before production and before media scale.", metrics: [{ label: "Creative formats", value: "5+", color: C.cyan }, { label: "Platforms", value: "9+", color: C.green }, { label: "Lifecycle stages", value: "4", color: C.gold }, { label: "Outputs", value: "CMO-ready", color: C.purple }] },
  { kicker: "Product", title: "Upload. Diagnose. Forecast. Decide.", copy: "The product covers intake, neural diagnostics, attention, emotion, platform scores, outcome forecast, strategic insights, CMO actions, repository, competitive intelligence, Brand DNA and certification.", diagram: "platform" },
  { kicker: "Use cases", title: "High-value workflows for brands and agencies.", copy: "Use AdCritIQ for pre-campaign diagnostics, concept and storyboard testing, platform adaptation, competitive creative benchmarking, agency pitch support, performance learning and brand governance.", table: [["Workflow", "Decision improved"], ["Pre-testing", "Which creative should be fixed or scaled."], ["Competitive Intel", "How competitor creative pressure is moving."], ["Brand DNA", "Whether new work reinforces brand identity."], ["CMO Playbook", "What action should happen next."]] },
  { kicker: "Business value", title: "Separate creative-led risk from media-dependent risk.", copy: "AdCritIQ gives marketers a shared language for whether the problem is attention, memory, message clarity, platform fit, brand linkage, compliance, or media dependency.", cards: [{ label: "Reduce waste", text: "Avoid scaling weak creative.", color: C.green }, { label: "Improve alignment", text: "Move debate from taste to signal.", color: C.cyan }, { label: "Protect brands", text: "Track DNA and governance.", color: C.gold }] },
  { kicker: "Why AdCritIQ wins", title: "Pre-spend, format-aware, platform-aware and outcome-linked.", copy: "Unlike generic AI scoring or post-campaign dashboards, AdCritIQ is designed to sit before budget commitment and create an accumulating creative intelligence repository.", cards: [{ label: "Before media", text: "Decision signal before spend.", color: C.gold }, { label: "Across formats", text: "Video, static, motion, audio and text.", color: C.cyan }, { label: "Over time", text: "Repository, DNA and benchmarks.", color: C.green }] },
  { kicker: "Pilot proposal", title: "Start with one brand and one campaign pipeline.", copy: "Run a 4–6 week pilot across 20–50 assets and three competitors. Deliver an executive readout showing what to fix, scale, benchmark or reject before media money moves.", diagram: "funnel", funnel: ["Select brand", "Analyse assets", "Benchmark", "CMO readout", "Enterprise rollout"] },
];

const methodologySlides = [
  { type: "title", kicker: "Methodology + evidence", title: "How AdCritIQ translates creative signals into boardroom decisions.", copy: "A methodology explainer for CMOs, insights teams, procurement, partners and investors.", sideTitle: "Positioning guardrail", side: ["Predictive, not biometric", "Directional, not guaranteed", "Decision support, not creative replacement"] },
  { kicker: "Core equation", title: "Campaign outcomes are not caused by media alone.", copy: "The product’s operating frame: Expected Campaign Outcome = Media Delivery Quality × Creative Response Probability × Platform / Format Fit × Category Elasticity × Brand Baseline Strength.", table: [["Component", "AdCritIQ status"], ["Creative Response Probability", "Predicted now."], ["Platform / Format Fit", "Predicted now."], ["Media Delivery Quality", "Not ingested yet."], ["Category / Brand baseline", "Future calibration layer."]] },
  { kicker: "Score interpretation", title: "Scores are readiness bands, not promised lifts.", copy: "A score of 84 means strong creative-response readiness relative to observed creative signals. It does not mean an 84% sales lift or guaranteed brand lift.", table: [["Band", "Meaning"], ["85–100", "High probability / scale-ready."], ["70–84", "Strong probability / minor optimization."], ["55–69", "Moderate / test before scaling."], ["40–54", "At risk / fix recommended."], ["0–39", "High wastage risk."]] },
  { kicker: "Outcome drivers", title: "Each business KPI is mapped to different creative signals.", copy: "The same creative strengths do not drive every outcome. Awareness depends on memory and brand linkage. Purchase intent requires clarity, persuasion, CTA and compliance. VTR depends on format and attention dynamics.", table: [["Outcome", "Primary creative drivers"], ["Spontaneous / aided awareness", "Memory encoding, brand recall, brand prominence, attention-brand coupling."], ["Consideration", "Message clarity, emotional coherence, trust, creative efficiency."], ["Purchase intent / response", "CTA clarity, proposition clarity, product desire, compliance."], ["VTR / completion", "Hook strength, hold rate, sustained attention and recovery."]] },
  { kicker: "Format awareness", title: "The scoring changes when the creative format changes.", copy: "Video, static, motion, audio and text assets do different jobs in different environments. AdCritIQ adapts diagnostic language and avoids applying video-only concepts to static or text assets.", table: [["Format", "Relevant signals"], ["Video", "Hook, hold, pacing, sound, completion readiness."], ["Static image", "Stopping power, hierarchy, brand prominence, CTA clarity."], ["Motion / GIF", "First frame, loop clarity, motion salience, fatigue."], ["Audio / text", "Sonic memory, voice clarity, proposition, readability, claim risk."]] },
  { kicker: "Platform awareness", title: "Platform fit changes the probability of outcome.", copy: "A strong TV asset may underperform in TikTok if the hook, crop, pace or sound-off behavior are wrong. Platform outcome forecasts are not a media plan; they are creative suitability signals by platform context.", cards: [{ label: "YouTube", text: "Hook, hold and audio-visual memory.", color: C.gold }, { label: "Meta / Instagram", text: "Thumb-stop, visual clarity and sound-off survival.", color: C.cyan }, { label: "TV / CTV", text: "Narrative, emotion and memory.", color: C.green }, { label: "DOOH / Display", text: "Instant decode and brand prominence.", color: C.purple }] },
  { kicker: "Neural calibration", title: "TRIBE v2 informs the language of multimodal response, not a live model claim.", copy: "TRIBE v2 is a published foundation model for vision, audition and language in in-silico neuroscience. AdCritIQ references published findings as calibration language; it does not claim to run live TRIBE v2 inference unless product implementation changes.", cards: [{ label: "Vision", text: "Visual hierarchy, salience and object recognition cues.", color: C.green }, { label: "Audio", text: "Speech, music and multisensory binding cues.", color: C.purple }, { label: "Language", text: "Tagline, copy and semantic memory cues.", color: C.cyan }] },
  { kicker: "Memorability basis", title: "LAMBDA supports the idea that long-term ad memory can be modeled from multimodal features.", copy: "The LAMBDA research referenced in the strategy package covers long-term ad memorability using multimodal ad features across 2,205 ads and 276 brands. It is a supporting research precedent, not proprietary validation of AdCritIQ.", cards: [{ label: "What it supports", text: "Creative features can be linked to memorability outcomes.", color: C.gold }, { label: "What it does not prove", text: "It does not validate every AdCritIQ score automatically.", color: C.red }] },
  { kicker: "Brand DNA", title: "Consistency matters because brands need repeatable memory structures.", copy: "Brand DNA compares new creative against a brand’s historical creative fingerprint. The principle is that distinctive assets, emotional signatures and memory structures should reinforce brand identity over time.", table: [["Trait", "Meaning"], ["Emotional Signature", "How consistently the brand uses emotional response."], ["Memory Architecture", "Brand recall and memory encoding pattern."], ["Attention Pattern", "Hook and hold behavior across assets."], ["Cultural Rooting", "Relevance to market and cultural context."]] },
  { kicker: "Certification", title: "Certification should be treated as a readiness signal, not a guarantee.", copy: "Certified Creative can become useful for agencies and brands if the threshold is transparent and conservative. It should mean the asset meets AdCritIQ’s criteria for creative readiness, not guaranteed sales performance.", cards: [{ label: "Useful for", text: "Agency handoff, client approval, governance and portfolio review.", color: C.green }, { label: "Requires", text: "Published criteria, audit trail and verification link.", color: C.gold }, { label: "Avoid", text: "Claims of guaranteed lift or biometric proof.", color: C.red }] },
  { kicker: "Validation roadmap", title: "The strongest proof will come from correlation with real campaign outcomes.", copy: "AdCritIQ should build a validation dataset over time: predicted scores versus VTR, CTR, completion, brand lift, consideration lift, purchase intent and sales proxy where clients provide data.", diagram: "funnel", funnel: ["Predict", "Launch", "Collect KPIs", "Compare", "Calibrate"] },
  { kicker: "Founder inputs needed", title: "What must be verified before using this externally.", copy: "The decks are boardroom-ready as a narrative package, but final external use requires founder validation of pricing, formulas, pilots, customers, certification thresholds, security posture and any claimed outcomes.", cards: [{ label: "Data", text: "Usage, pilots, campaign correlations.", color: C.cyan }, { label: "Commercials", text: "Pricing, margin, ARR goals.", color: C.gold }, { label: "Governance", text: "Privacy, security, claim language.", color: C.green }, { label: "Proof", text: "Case studies and testimonials.", color: C.purple }] },
];

const decks = [
  { name: "AdCritIQ Investor Deck", slug: "adcritiq-investor-deck", slides: investorSlides },
  { name: "AdCritIQ Product Master Deck", slug: "adcritiq-product-master-deck", slides: productSlides },
  { name: "AdCritIQ GTM Strategy Deck", slug: "adcritiq-gtm-strategy-deck", slides: gtmSlides },
  { name: "AdCritIQ Quick Pitch Deck", slug: "adcritiq-quick-pitch-deck", slides: quickSlides },
  { name: "AdCritIQ Methodology Evidence Deck", slug: "adcritiq-methodology-evidence-deck", slides: methodologySlides },
];

async function renderDeck(artifact, deck) {
  const { Presentation, PresentationFile } = artifact;
  const presentation = Presentation.create({ slideSize: SLIDE_SIZE });
  const ctx = createSlideContext(artifact, {
    slideSize: SLIDE_SIZE,
    slideNumber: 1,
    outputDir: OUTPUT_DIR,
    assetDir: ASSET_DIR,
    workspaceDir: WORKSPACE,
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    monoFont: "Aptos Mono",
  });

  for (let i = 0; i < deck.slides.length; i += 1) {
    const s = deck.slides[i];
    const n = i + 1;
    if (s.type === "title") {
      await titleSlide(ctx, presentation, deck.name, n, s);
    } else if (s.type === "section") {
      sectionSlide(ctx, presentation, deck.name, n, s.label, s.headline, s.copy);
    } else {
      claimSlide(ctx, presentation, deck.name, n, s);
    }
  }

  const outPath = path.join(OUTPUT_DIR, `${deck.slug}.pptx`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outPath);

  const deckPreviewDir = path.join(PREVIEW_DIR, deck.slug);
  const deckLayoutDir = path.join(LAYOUT_DIR, deck.slug);
  await fs.mkdir(deckPreviewDir, { recursive: true });
  await fs.mkdir(deckLayoutDir, { recursive: true });
  const previewPaths = [];
  for (let i = 0; i < presentation.slides.count; i += 1) {
    const slide = presentation.slides.getItem(i);
    const png = await presentation.export({ slide, format: "png", scale: 0.55 });
    const previewPath = path.join(deckPreviewDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(png, previewPath);
    previewPaths.push(previewPath);
    try {
      const layout = await presentation.export({ slide, format: "layout" });
      await fs.writeFile(path.join(deckLayoutDir, `slide-${String(i + 1).padStart(2, "0")}.json`), await layout.text(), "utf8");
    } catch {}
  }

  const contactSheet = path.join(deckPreviewDir, `${deck.slug}-contact-sheet.png`);
  const result = spawnSync(
    "/Users/anipandi/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
    [
      "/Users/anipandi/.codex/plugins/cache/openai-primary-runtime/presentations/26.601.10930/skills/presentations/scripts/make_contact_sheet.py",
      "--output",
      contactSheet,
      ...previewPaths,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`Contact sheet failed for ${deck.name}: ${result.stderr || result.stdout}`);
  }

  return { name: deck.name, outPath, slideCount: presentation.slides.count, contactSheet };
}

await fs.mkdir(WORKSPACE, { recursive: true });
await fs.mkdir(ASSET_DIR, { recursive: true });
await ensureArtifactToolWorkspace(WORKSPACE);
const artifact = await importArtifactTool(WORKSPACE);
const manifest = [];
for (const deck of decks) {
  console.log(`Building ${deck.name}...`);
  manifest.push(await renderDeck(artifact, deck));
}
await fs.writeFile(path.join(OUTPUT_DIR, "adcritiq-deck-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
