import { useState, useRef, useCallback, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────
const T = {
  bg:       "#04050d",
  sidebar:  "#07091a",
  panel:    "#0c0f22",
  card:     "#101428",
  card2:    "#141830",
  border:   "#1e2340",
  border2:  "#252a50",
  text:     "#e8eaf6",
  dim:      "#6b7094",
  muted:    "#3a3d5c",
  em:       "#00e5a0",
  emDim:    "#00a870",
  gold:     "#e8c97a",
  goldDim:  "#b89a50",
  rose:     "#f472b6",
  violet:   "#a78bfa",
  sky:      "#38bdf8",
  amber:    "#fbbf24",
  green:    "#4ade80",
  red:      "#f87171",
};

const score2color = v => v >= 80 ? T.green : v >= 60 ? T.amber : v >= 40 ? T.gold : T.red;
const score2grade = v => v>=90?"A+":v>=85?"A":v>=80?"A-":v>=75?"B+":v>=70?"B":v>=65?"B-":v>=60?"C+":v>=55?"C":v>=50?"C-":v>=40?"D":"F";

// Supabase config
const SB_URL  = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function sbSave(payload) {
  if (!SB_URL || !SB_KEY) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SB_KEY,
        "Authorization": `Bearer ${SB_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });
    if (r.ok) return await r.json();
  } catch(e) { console.warn("Supabase save failed:", e); }
  return null;
}

async function sbList(limit = 20) {
  if (!SB_URL || !SB_KEY) return [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/analyses?select=id,brand,campaign,overall_grade,created_at&order=created_at.desc&limit=${limit}`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
    });
    if (r.ok) return await r.json();
  } catch(e) { console.warn("Supabase list failed:", e); }
  return [];
}

async function sbGet(id) {
  if (!SB_URL || !SB_KEY) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/analyses?id=eq.${id}&select=*`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
    });
    if (r.ok) { const d = await r.json(); return d[0] || null; }
  } catch(e) { console.warn("Supabase get failed:", e); }
  return null;
}

// ─── ICONS (inline SVG, no emojis) ────────────────────────────
const Ic = {
  brain:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9.5 2a2.5 2.5 0 0 1 0 5H7a2 2 0 0 0 0 4h.5a2.5 2.5 0 0 1 0 5H5a3 3 0 0 0 0 6h14a3 3 0 0 0 0-6h-2.5a2.5 2.5 0 0 1 0-5H17a2 2 0 0 0 0-4h-.5a2.5 2.5 0 0 1 0-5"/></svg>,
  eye:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  heart:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  film:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>,
  monitor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  volume:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bulb:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>,
  book:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chart:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  upload:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  star:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

// ─── BASE COMPONENTS ──────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, ...style }}>{children}</div>;
}

function SectionTitle({ color = T.em, children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ width: 16, height: 3, borderRadius: 2, background: color, display: "inline-block" }} />
    {children}
  </div>;
}

function ScoreCard({ label, value, note }) {
  const c = score2color(value);
  return (
    <div style={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: c, borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "monospace", color: c, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: T.dim, marginTop: 8, lineHeight: 1.5 }}>{note}</div>
      <div style={{ height: 4, borderRadius: 2, background: T.muted, marginTop: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, background: c, width: `${value}%`, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

function BarRow({ label, value, color, wide }) {
  const c = color || score2color(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <div style={{ width: wide || 150, fontSize: 12, fontWeight: 600, color: T.dim, flexShrink: 0, textTransform: "capitalize" }}>{label.replace(/_/g, " ")}</div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: T.muted, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, background: c, opacity: 0.8, width: `${value}%`, transition: "width 1s ease" }} />
      </div>
      <div style={{ width: 38, fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: c, textAlign: "right" }}>{value}</div>
    </div>
  );
}

function Takeaway({ icon, title, items, color }) {
  const c = color || T.em;
  if (!items || !items.length) return null;
  return (
    <div style={{ background: `${c}0d`, border: `1px solid ${c}33`, borderLeft: `3px solid ${c}`, borderRadius: 14, padding: 24, marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: c, marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex" }}>{icon}</span>{title}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < items.length - 1 ? 12 : 0, alignItems: "flex-start" }}>
          <span style={{ color: c, fontWeight: 800, fontSize: 13, marginTop: 2, flexShrink: 0 }}>
            {item.type === "win" ? "★" : item.type === "fix" ? "→" : item.type === "warn" ? "!" : "●"}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            <b style={{ color: T.text }}>{item.label}</b> {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── TAKEAWAY LOGIC ───────────────────────────────────────────
function buildTakeaways(r) {
  const t = {};
  t.summary = [];
  if ((r.viral_potential||0) >= 70) t.summary.push({ type:"win", label:"Strong viral potential.", text:"Prioritise for social-first distribution." });
  else t.summary.push({ type:"fix", label:"Viral potential below 70.", text:"Add a pattern interrupt, emotional spike, or relatable hook." });
  if ((r.hold_rate||0) < 60) t.summary.push({ type:"warn", label:"Hold rate critical.", text:`${100-(r.hold_rate||0)}% drop off. Re-edit weakest section by 30%.` });
  if ((r.brand_recall||0) < 75) t.summary.push({ type:"fix", label:"Brand recall needs work.", text:"Increase logo visibility, add product shot earlier." });
  else t.summary.push({ type:"win", label:"Excellent brand recall.", text:"Distinctive brand assets well-placed." });
  if ((r.memory_encoding||0) < 65) t.summary.push({ type:"warn", label:"Risk: watched but forgotten.", text:"Add an emotional anchor moment." });

  t.neural = [];
  const br = r.brain_regions || {};
  if ((br.amygdala||0) < 50) t.neural.push({ type:"fix", label:"Amygdala activation low.", text:"Not triggering emotion. Add surprise, humor, or vulnerability." });
  else t.neural.push({ type:"win", label:"Strong emotional activation.", text:"Amygdala engaged — drives memory encoding." });
  if ((br.mirror_neurons||0) < 60) t.neural.push({ type:"fix", label:"Low mirror neuron activation.", text:"Add close-up facial expressions or human-to-human interaction." });
  else t.neural.push({ type:"win", label:"Mirror neurons active.", text:"Viewers empathising — drives share intent." });
  const s12 = r.system1_vs_system2 || 50;
  if (s12 >= 65 && s12 <= 75) t.neural.push({ type:"win", label:"System 1/2 balance optimal.", text:"Leads with emotion, layers rational messaging correctly." });
  else if (s12 < 65) t.neural.push({ type:"fix", label:"Over-indexing System 2.", text:"Reduce rational claims. Lead with feeling first." });
  else t.neural.push({ type:"warn", label:"Over-indexing System 1.", text:"Add one clear product claim to layer rational processing." });

  t.attention = [];
  const at = r.attention_curve || [];
  if (at.length > 0) {
    const pk = Math.max(...at), lo = Math.min(...at), pkI = at.indexOf(pk), loI = at.indexOf(lo);
    const av = Math.round(at.reduce((a,b) => a+b, 0) / at.length);
    t.attention.push({ type:"do", label:`Peak attention at ~${pkI}s (${pk}%).`, text:"Use this frame as thumbnail for static placements." });
    if (lo < 50) t.attention.push({ type:"warn", label:`Drops to ${lo}% at ~${loI}s.`, text:"Drop zone. Cut section or add visual pattern interrupt." });
    t.attention.push({ type: av >= 65 ? "win" : "warn", label:`Average attention: ${av}%.`, text: av >= 65 ? "Above 60% recall threshold." : "Below 60%. Consider a shorter cut." });
  } else {
    t.attention.push({ type:"do", label:"Review heatmap above.", text:"Green = strong. Red = needs interrupts." });
  }

  t.emotion = [];
  if ((r.emotional_peak||0) >= 70) t.emotion.push({ type:"win", label:"Strong emotional peak.", text:"Triggers genuine emotion for long-term recall." });
  else t.emotion.push({ type:"fix", label:"Moderate emotional peak.", text:"Add a moment of surprise, joy, tension, or vulnerability." });
  if ((r.share_intent||0) < 65) t.emotion.push({ type:"fix", label:"Share intent below 65.", text:"Add identity signaling, social currency, or emotional contagion." });
  else t.emotion.push({ type:"win", label:"High share intent.", text:"Optimise: hashtag, under 30s, self-explanatory first frame." });

  t.scenes = [
    { type:"do", label:"Use scene data for re-edits.", text:"Keep scenes above 70. Cut or rework scenes below 50." },
    { type:"do", label:"Check System mode transitions.", text:"Frequent S1-to-S2 shifts cause cognitive fatigue." },
    { type:"do", label:"Watch drop_zone flags.", text:"Any drop zone scene = where viewers leave. #1 re-edit priority." }
  ];

  t.platforms = [];
  const ps = r.platform_scores || {};
  let bestK="", bestV=0, worstK="", worstV=101;
  for (const k in ps) { if (ps[k]>bestV) { bestV=ps[k]; bestK=k; } if (ps[k]<worstV) { worstV=ps[k]; worstK=k; } }
  if (bestK) t.platforms.push({ type:"win", label:`Best platform: ${bestK.replace(/_/g," ")} (${bestV}).`, text:"Prioritise media spend here." });
  if (worstK) t.platforms.push({ type:"warn", label:`Weakest: ${worstK.replace(/_/g," ")} (${worstV}).`, text:"Do not run without a format-specific re-edit." });

  t.sound = [];
  const sn = r.sound_analysis || {};
  if ((sn.sound_dependency||0) > 70) t.sound.push({ type:"warn", label:"High sound dependency.", text:"Social is 80%+ sound-off. Create kinetic text variant." });
  else t.sound.push({ type:"win", label:"Low sound dependency.", text:"Works without audio. Ready for sound-off environments." });

  t.privacy = [];
  const pr = r.privacy_and_data_audit || {};
  if (!pr.url_cta_present && !pr.qr_code_present && !pr.hashtag_present) t.privacy.push({ type:"fix", label:"No digital conversion path.", text:"No QR/URL/hashtag. Add a search CTA or badge." });
  if (pr.dpdp_compliance_risk === "high") t.privacy.push({ type:"warn", label:"High DPDP risk.", text:"Review with legal before programmatic distribution." });
  else t.privacy.push({ type:"win", label:`DPDP risk: ${pr.dpdp_compliance_risk||"low"}.`, text:"No major regulatory flags detected." });

  return t;
}

// ─── CHART HELPERS ────────────────────────────────────────────
function makePath(arr, x1, x2, yTop, yBot) {
  const s = (x2 - x1) / Math.max(arr.length - 1, 1);
  return arr.map((v, i) => `${i === 0 ? "M" : "L"}${x1 + i * s},${yBot - (v / 100) * (yBot - yTop)}`).join(" ");
}
function makeArea(arr, x1, x2, yTop, yBot) {
  return makePath(arr, x1, x2, yTop, yBot) + ` L${x2},${yBot} L${x1},${yBot} Z`;
}

// ─── FRAME EXTRACTOR ─────────────────────────────────────────
function extractFrames(file) {
  if (file.type.startsWith("image/")) {
    return new Promise(r => {
      const rd = new FileReader();
      rd.onload = e => r({ frames: [e.target.result.split(",")[1]], duration: 0, isImage: true });
      rd.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "auto"; v.muted = true;
    v.src = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      const dur = v.duration;
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d");
      // Max 3 frames evenly spaced
      const n = Math.min(3, Math.max(1, Math.ceil(dur / 8)));
      const times = Array.from({ length: n }, (_, i) => (dur / n) * i + 0.5);
      const frames = []; let idx = 0;
      const next = () => {
        if (idx >= times.length) { URL.revokeObjectURL(v.src); resolve({ frames, duration: dur, isImage: false }); return; }
        v.currentTime = Math.min(times[idx], dur - 0.1);
      };
      v.onseeked = () => {
        ctx.drawImage(v, 0, 0, 320, 180);
        frames.push(canvas.toDataURL("image/jpeg", 0.5).split(",")[1]);
        idx++; next();
      };
      v.onerror = () => reject(new Error("Cannot read video"));
      next();
    };
  });
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"summary",   label:"Executive Summary",   icon: Ic.chart   },
  { id:"neural",    label:"Neural Map",           icon: Ic.brain   },
  { id:"attention", label:"Attention Economics",  icon: Ic.eye     },
  { id:"emotion",   label:"Emotional Architecture", icon: Ic.heart },
  { id:"scenes",    label:"Scene Intelligence",   icon: Ic.film    },
  { id:"platforms", label:"Platform Scores",      icon: Ic.monitor },
  { id:"sound",     label:"Sound & Sensory",      icon: Ic.volume  },
  { id:"privacy",   label:"Privacy & Compliance", icon: Ic.shield  },
  { id:"strategy",  label:"Strategic Insights",   icon: Ic.bulb    },
  { id:"cmo",       label:"CMO Playbook",         icon: Ic.star    },
  { id:"glossary",  label:"Methodology",          icon: Ic.book    },
];

function Sidebar({ tab, setTab, grade, brand }) {
  const gc = grade === "A+" || grade === "A" ? T.green : grade?.startsWith("B") ? T.amber : grade?.startsWith("C") ? T.gold : T.red;
  return (
    <div style={{ width: 230, background: T.sidebar, borderRight: `1px solid ${T.border}`, height: "100vh", position: "sticky", top: 0, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: T.gold, textTransform: "uppercase", marginBottom: 4 }}>ADVantage Insights</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>Brain Encoder<span style={{ fontSize: 9, color: T.gold, verticalAlign: "super", marginLeft: 2 }}>TM</span></div>
        {grade && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: gc + "20", border: `1px solid ${gc}40`, borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 800, color: gc, fontFamily: "monospace" }}>
              {grade}
            </div>
            {brand && <div style={{ fontSize: 11, color: T.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{brand}</div>}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV_ITEMS.map(n => {
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", background: active ? `${T.em}15` : "transparent", borderLeft: `3px solid ${active ? T.em : "transparent"}`, borderRight: "none", borderTop: "none", borderBottom: "none", cursor: "pointer", textAlign: "left", color: active ? T.em : T.dim, fontSize: 12, fontWeight: active ? 700 : 500, transition: "all 0.15s" }}>
              <span style={{ display: "flex", opacity: active ? 1 : 0.6 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.muted }}>
        Neural Creative Intelligence · 2026
      </div>
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────
function Landing({ onStart, history, onLoadHistory }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", background: T.bg }}>
      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: 680, marginBottom: 64 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: T.gold, textTransform: "uppercase", marginBottom: 20 }}>ADVantage Insights</div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: T.text, lineHeight: 1.05, letterSpacing: -1.5, margin: "0 0 8px" }}>
          Brain Encoder<sup style={{ fontSize: 16, color: T.gold, verticalAlign: "super" }}>TM</sup>
        </h1>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.em, marginBottom: 20 }}>Platform</div>
        <p style={{ fontSize: 16, color: T.dim, lineHeight: 1.7, marginBottom: 40 }}>
          Upload any video ad, display creative, or social content. Get a full neural creative analysis — 17 metrics, 15 platform scores, scene intelligence, attention economics, and a CMO action playbook.
        </p>

        <button onClick={onStart}
          style={{ background: T.em, color: T.bg, border: "none", borderRadius: 14, padding: "18px 48px", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, letterSpacing: 0.3, boxShadow: `0 0 40px ${T.em}40` }}>
          {Ic.upload} Start Analysis
        </button>
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 64 }}>
        {["17 Neural Metrics", "15 Platform Scores", "Scene Intelligence", "Attention Heatmap", "DPDP Compliance", "CMO Playbook", "No Duration Limit", "System 1 / System 2"].map(f => (
          <span key={f} style={{ background: T.card, border: `1px solid ${T.border2}`, borderRadius: 100, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: T.dim }}>
            {f}
          </span>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ width: "100%", maxWidth: 680 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: T.gold, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            {Ic.history} Recent Analyses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map(h => (
              <button key={h.id} onClick={() => onLoadHistory(h.id)}
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", color: T.text, fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{h.brand || "Unknown Brand"}</span>
                  {h.campaign && <span style={{ color: T.dim, marginLeft: 8 }}>— {h.campaign}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: score2color(h.overall_grade === "A+" ? 95 : h.overall_grade === "A" ? 88 : h.overall_grade?.startsWith("B") ? 75 : 55) }}>
                    {h.overall_grade}
                  </span>
                  <span style={{ fontSize: 11, color: T.muted }}>{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UPLOAD FORM ──────────────────────────────────────────────
function UploadForm({ onAnalyse, onBack }) {
  const [form, setForm] = useState({ brand: "", client: "", campaign: "", agency: "", type: "video", industry: "FMCG / CPG", audience: "", market: "India", notes: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = f => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) { const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f); }
    else setPreview(URL.createObjectURL(f));
  };

  const inp = (label, key, placeholder, full) => (
    <div style={{ flex: full ? "1 1 100%" : "1 1 calc(50% - 8px)" }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
      <input value={form[key]} onChange={e => u(key, e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: T.card2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: T.text, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  const sel = (label, key, opts) => (
    <div style={{ flex: "1 1 calc(50% - 8px)" }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.dim, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>
      <select value={form[key]} onChange={e => u(key, e.target.value)}
        style={{ width: "100%", background: T.card2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: T.text, outline: "none" }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "48px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 780 }}>
        <button onClick={onBack} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 12, color: T.dim, cursor: "pointer", marginBottom: 32 }}>
          ← Back
        </button>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: T.gold, textTransform: "uppercase", marginBottom: 8 }}>ADVantage Insights</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: -0.5 }}>New Analysis</h2>
        <p style={{ fontSize: 14, color: T.dim, marginBottom: 36 }}>Upload your creative and fill in the brief. The more context you provide, the sharper the neural analysis.</p>

        {/* Drop Zone */}
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          style={{ border: `2px dashed ${drag ? T.em : file ? T.em + "80" : T.border2}`, borderRadius: 16, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: drag ? `${T.em}08` : file ? `${T.em}05` : T.card, marginBottom: 28, transition: "all 0.2s" }}>
          <input ref={fileRef} type="file" accept="video/*,image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <div>
              {preview && file.type.startsWith("image/") && <img src={preview} alt="" style={{ maxHeight: 160, borderRadius: 10, marginBottom: 12 }} />}
              <div style={{ fontSize: 14, fontWeight: 700, color: T.em }}>{Ic.check} {file.name}</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "center", color: T.dim, marginBottom: 12 }}>{Ic.upload}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Drop creative here or click to browse</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 6 }}>Supports MP4, MOV, WebM, GIF, JPEG, PNG · No size limit</div>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          {inp("Brand *", "brand", "e.g. Coca-Cola")}
          {inp("Client", "client", "e.g. Hindustan Coca-Cola")}
          {inp("Campaign Name", "campaign", "e.g. FIFA World Cup 2026")}
          {inp("Agency", "agency", "e.g. McCann")}
          {sel("Creative Type", "type", ["video", "display", "social", "OOH"])}
          {sel("Industry", "industry", ["FMCG / CPG", "Automotive", "Finance / BFSI", "Healthcare", "Technology", "E-commerce", "QSR / Food", "Retail / D2C", "Entertainment", "Real Estate", "Travel", "Telecom", "Other"])}
          {inp("Target Audience", "audience", "e.g. Urban 18-35 SEC A/B")}
          {sel("Market", "market", ["India", "India Tier 1", "India Tier 2/3", "Southeast Asia", "Middle East", "Global", "US", "UK"])}
          {inp("Additional Notes", "notes", "Platform, objective, or any context...", true)}
        </div>

        <button onClick={() => { if (!file || !form.brand.trim()) { alert("Please upload a creative and enter the brand name."); return; } onAnalyse(file, form); }}
          style={{ width: "100%", background: T.em, color: T.bg, border: "none", borderRadius: 14, padding: "18px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: `0 0 30px ${T.em}30` }}>
          {Ic.brain} Run Neural Analysis
        </button>
      </div>
    </div>
  );
}

// ─── ANALYZING SCREEN ─────────────────────────────────────────
function Analyzing({ progress, msg }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ marginBottom: 40, position: "relative" }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke={T.border} strokeWidth="6" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={T.em} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: T.em }}>{progress}%</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: T.gold, textTransform: "uppercase", marginBottom: 12 }}>Neural Analysis Running</div>
      <div style={{ fontSize: 15, color: T.dim, textAlign: "center", maxWidth: 400 }}>{msg}</div>
      <div style={{ marginTop: 40, fontSize: 12, color: T.muted, textAlign: "center" }}>
        ADVantage Insights Brain Encoder<sup style={{ fontSize: 8, color: T.gold }}>TM</sup> · Powered by Claude Sonnet 4
      </div>
    </div>
  );
}

// ─── RESULTS LAYOUT ───────────────────────────────────────────
function Results({ data, meta, onNew }) {
  const [tab, setTab] = useState("summary");
  const r = data;
  const tw = buildTakeaways(r);
  const gc = score2color(r.viral_potential || 50);

  const headerInfo = `${meta.brand || ""}${meta.campaign ? " — " + meta.campaign : ""}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* Left Sidebar */}
      <Sidebar tab={tab} setTab={setTab} grade={r.overall_grade} brand={meta.brand} />

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        {/* Top header bar */}
        <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: "18px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 10, color: T.dim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              {meta.industry || ""} · {meta.market || ""} · {meta.type || "video"} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: -0.3 }}>{headerInfo || "Untitled Creative"}</h1>
            {r.headline_verdict && <div style={{ fontSize: 13, color: T.em, marginTop: 4 }}>"{r.headline_verdict}"</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: gc + "20", border: `1px solid ${gc}`, borderRadius: 10, padding: "6px 16px", fontSize: 18, fontWeight: 900, color: gc, fontFamily: "monospace" }}>
              {r.overall_grade}
            </div>
            <button onClick={onNew}
              style={{ background: T.card2, border: `1px solid ${T.border2}`, borderRadius: 10, padding: "10px 18px", fontSize: 12, fontWeight: 700, color: T.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {Ic.plus} New Analysis
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "36px" }}>
          {tab === "summary"   && <TabSummary   r={r} tw={tw} />}
          {tab === "neural"    && <TabNeural    r={r} tw={tw} />}
          {tab === "attention" && <TabAttention r={r} tw={tw} />}
          {tab === "emotion"   && <TabEmotion   r={r} tw={tw} />}
          {tab === "scenes"    && <TabScenes    r={r} tw={tw} />}
          {tab === "platforms" && <TabPlatforms r={r} tw={tw} />}
          {tab === "sound"     && <TabSound     r={r} tw={tw} />}
          {tab === "privacy"   && <TabPrivacy   r={r} tw={tw} />}
          {tab === "strategy"  && <TabStrategy  r={r} />}
          {tab === "cmo"       && <TabCMO       r={r} />}
          {tab === "glossary"  && <TabGlossary  />}
        </div>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────
function TabSummary({ r, tw }) {
  const primaryMetrics = [
    { label: "Viral Potential",   value: r.viral_potential,   note: "Shareability & virality probability" },
    { label: "Hook Strength",     value: r.hook_strength,     note: "First 1–2s stopping power" },
    { label: "Hold Rate",         value: r.hold_rate,         note: "Predicted % watching through" },
    { label: "Emotional Peak",    value: r.emotional_peak,    note: "Strongest emotional activation" },
    { label: "Brand Recall",      value: r.brand_recall,      note: "Post-exposure brand memory" },
    { label: "Memory Encoding",   value: r.memory_encoding,   note: "Long-term memory probability" },
    { label: "Sound-Off Survival",value: r.sound_off_survival,note: "Performance without audio" },
    { label: "Share Intent",      value: r.share_intent,      note: "Organic sharing probability" },
    { label: "Creative Efficiency",value: r.creative_efficiency,note:"Message per second of runtime" },
  ];

  const secondaryMetrics = [
    { label: "Ad Fatigue Risk",    value: r.ad_fatigue_risk },
    { label: "Cultural Resonance", value: r.cultural_resonance },
    { label: "Celebrity Index",    value: r.celebrity_talent_index },
    { label: "Brand Safety",       value: r.brand_safety },
    { label: "1P Data Opportunity",value: r.first_party_data_opportunity },
    { label: "Regulatory",         value: r.regulatory_compliance },
    { label: "Carbon Signal",      value: r.carbon_signal },
  ];

  const at = r.attention_curve || [];
  const em = r.emotion_curve || [];
  const W = 560, yT = 20, yB = 100;

  return (
    <>
      {r.creative_summary && (
        <Card style={{ marginBottom: 28, borderLeft: `3px solid ${T.gold}`, background: `${T.gold}08` }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.gold, textTransform: "uppercase", marginBottom: 10 }}>Creative Overview</div>
          <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.75 }}>{r.creative_summary}</div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {primaryMetrics.map(m => <ScoreCard key={m.label} label={m.label} value={m.value || 0} note={m.note} />)}
      </div>

      {/* Attention & emotion chart */}
      {(at.length > 1 || em.length > 1) && (
        <Card style={{ marginBottom: 28 }}>
          <SectionTitle color={T.em}>Predicted Attention & Emotion Curves</SectionTitle>
          <svg width="100%" viewBox={`0 0 ${W} 120`} style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="atGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.em} stopOpacity="0.25" /><stop offset="100%" stopColor={T.em} stopOpacity="0" /></linearGradient>
              <linearGradient id="emGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.amber} stopOpacity="0.15" /><stop offset="100%" stopColor={T.amber} stopOpacity="0" /></linearGradient>
            </defs>
            {at.length > 1 && <><path d={makeArea(at, 0, W, yT, yB)} fill="url(#atGrad)" /><path d={makePath(at, 0, W, yT, yB)} fill="none" stroke={T.em} strokeWidth="2" strokeLinecap="round" /></>}
            {em.length > 1 && <path d={makePath(em, 0, W, yT, yB)} fill="none" stroke={T.amber} strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />}
          </svg>
          <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 11, color: T.dim }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 2, background: T.em, display: "inline-block" }} /> Attention</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 2, background: T.amber, display: "inline-block", borderTop: "2px dashed " + T.amber, height: 0 }} /> Emotion</span>
          </div>
        </Card>
      )}

      {/* Secondary metrics */}
      <Card style={{ marginBottom: 0 }}>
        <SectionTitle color={T.violet}>Additional Metrics</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {secondaryMetrics.map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: score2color(m.value || 0) }}>{m.value || 0}</div>
              <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Competitive */}
      {r.competitive_context && (
        <Card style={{ marginTop: 28 }}>
          <SectionTitle color={T.gold}>Competitive Benchmark</SectionTitle>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {(r.competitive_context.position || "average").replace(/_/g, " ")}
          </div>
          <div style={{ fontSize: 13, color: T.dim }}>{r.competitive_context.benchmark_note}</div>
        </Card>
      )}

      <Takeaway icon={Ic.chart} title="What This Means for You" items={tw.summary} color={T.gold} />
    </>
  );
}

function TabNeural({ r, tw }) {
  const br = r.brain_regions || {};
  const cc = r.cognitive_channels || {};
  const s12 = r.system1_vs_system2 || 50;
  const zone = s12 >= 65 && s12 <= 75 ? "Optimal zone (65–75)" : s12 < 65 ? "Over-indexing System 2 (Rational)" : "Over-indexing System 1 (Emotional)";
  const zoneColor = s12 >= 65 && s12 <= 75 ? T.green : T.amber;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        <Card>
          <SectionTitle color={T.violet}>Brain Region Activation</SectionTitle>
          {Object.entries(br).map(([k, v]) => <BarRow key={k} label={k.replace(/_/g, " ")} value={v || 0} color={T.violet} wide={170} />)}
        </Card>
        <Card>
          <SectionTitle color={T.sky}>Cognitive Channel Load</SectionTitle>
          {Object.entries(cc).map(([k, v]) => <BarRow key={k} label={k.replace(/_/g, " ")} value={v || 0} color={T.sky} wide={140} />)}
        </Card>
      </div>

      <Card>
        <SectionTitle color={T.gold}>System 1 vs System 2 Processing Balance</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontSize: 11, fontWeight: 700, color: T.dim }}>
          <span style={{ color: T.sky }}>SYSTEM 2 · Rational</span>
          <span style={{ color: T.rose }}>SYSTEM 1 · Emotional</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: `linear-gradient(to right, ${T.sky}, ${T.rose})`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `${s12}%`, width: 4, height: 22, background: T.text, borderRadius: 2, marginLeft: -2 }} />
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: zoneColor, fontWeight: 700 }}>
          Score: {s12}/100 — {zone}
        </div>
      </Card>

      <Takeaway icon={Ic.brain} title="Neural Map — What to Do" items={tw.neural} color={T.violet} />
    </>
  );
}

function TabAttention({ r, tw }) {
  const at = r.attention_curve || Array(10).fill(50);
  const W = 600, yT = 20, yB = 100;
  const peak = Math.max(...at), peakI = at.indexOf(peak);
  const low = Math.min(...at), lowI = at.indexOf(low);
  const avg = Math.round(at.reduce((a, b) => a + b, 0) / at.length);

  const secondBySecond = at.map((v, i) => {
    const intensity = v >= 70 ? T.green : v >= 50 ? T.amber : T.red;
    return (
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ height: 50, borderRadius: 6, background: intensity + "99", width: "100%", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${v}%`, background: intensity }} />
        </div>
        <div style={{ fontSize: 9, color: T.dim }}>{i * 2}s</div>
      </div>
    );
  });

  const vtrs = [{ q: "25%", v: r.view_through_25 || Math.round(at[2] || 35) }, { q: "50%", v: r.view_through_50 || Math.round(at[4] || 20) }, { q: "75%", v: r.view_through_75 || Math.round(at[7] || 15) }, { q: "100%", v: r.view_through_100 || Math.round((at[at.length-1] || 10)) }];

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <SectionTitle color={T.amber}>Second-by-Second Attention Heatmap</SectionTitle>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>{secondBySecond}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle color={T.em}>Attention Stats</SectionTitle>
          {[["Peak Attention", `${peak}% at ~${peakI * 2}s`, T.green], ["Lowest Point", `${low}% at ~${lowI * 2}s`, T.red], ["Average Attention", `${avg}%`, avg >= 65 ? T.green : T.amber]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.dim }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle color={T.rose}>Predicted View-Through Rate</SectionTitle>
          {vtrs.map(({ q, v }) => (
            <div key={q} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.dim }}>
                <span>{q}</span><span style={{ color: score2color(v), fontWeight: 700 }}>{v}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: T.muted, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: score2color(v), width: `${v}%` }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Takeaway icon={Ic.eye} title="Attention Economics — Actions" items={tw.attention} color={T.amber} />
    </>
  );
}

function TabEmotion({ r, tw }) {
  const et = r.emotion_types || {};
  const cols = { joy: T.green, surprise: T.amber, trust: T.sky, fear: T.red, desire: T.rose, curiosity: T.violet };
  const W = 600, yT = 20, yB = 80;
  const dom = Object.entries(et).map(([k, arr]) => ({ k, sum: (arr || []).reduce((a, b) => a + b, 0) })).sort((a, b) => b.sum - a.sum);

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <SectionTitle color={T.rose}>Emotion Types Over Time</SectionTitle>
        <svg width="100%" viewBox={`0 0 ${W} 100`}>
          {Object.entries(et).map(([k, arr]) => arr && arr.length > 1 && (
            <path key={k} d={makePath(arr, 0, W, yT, yB)} fill="none" stroke={cols[k] || T.dim} strokeWidth="1.8" strokeLinecap="round" />
          ))}
        </svg>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          {Object.keys(cols).map(k => (
            <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.dim }}>
              <span style={{ width: 12, height: 3, background: cols[k], borderRadius: 2, display: "inline-block" }} />{k}
            </span>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle color={T.rose}>Dominant Emotion by Section</SectionTitle>
          {dom.map(({ k, sum }) => <BarRow key={k} label={k} value={Math.round(sum / 5)} color={cols[k]} wide={100} />)}
        </Card>
        <Card>
          <SectionTitle color={T.amber}>Emotional Peak Analysis</SectionTitle>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: score2color(r.emotional_peak || 0), marginBottom: 8 }}>{r.emotional_peak || 0}/100</div>
          <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, marginBottom: 16 }}>
            {(r.emotional_peak || 0) >= 70 ? "Strong emotional peak — triggers recall and sharing." : "The emotional arc needs stronger triggers to drive organic sharing."}
          </div>
          <div style={{ fontSize: 12, color: T.dim }}>Share Intent: <span style={{ color: score2color(r.share_intent || 0), fontWeight: 700 }}>{r.share_intent || 0}/100</span></div>
        </Card>
      </div>

      <Takeaway icon={Ic.heart} title="Emotional Architecture — Actions" items={tw.emotion} color={T.rose} />
    </>
  );
}

function TabScenes({ r, tw }) {
  const scenes = r.scenes || [];
  const riskColors = { none: T.green, drop_zone: T.red, ad_avoidance: T.amber, cognitive_overload: T.rose, pacing_issue: T.violet };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {scenes.map((s, i) => (
          <Card key={i} style={{ borderTop: `3px solid ${score2color(s.attention || 50)}` }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: T.em, marginBottom: 6 }}>{s.ts}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 10 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6, marginBottom: 14 }}>{s.desc}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {(s.badges || []).map(b => (
                <span key={b} style={{ background: T.card2, border: `1px solid ${T.border2}`, borderRadius: 100, padding: "3px 10px", fontSize: 10, color: T.dim }}>{b}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span style={{ color: score2color(s.attention || 0) }}>Attn {s.attention}%</span>
              <span style={{ color: score2color(s.emotion || 0) }}>Emo {s.emotion}%</span>
              <span style={{ color: T.sky }}>{s.system_mode}</span>
              <span style={{ color: riskColors[s.risk_flag] || T.dim }}>{s.risk_flag || "no risk"}</span>
            </div>
          </Card>
        ))}
      </div>
      <Takeaway icon={Ic.film} title="Scene Intelligence — How to Use This" items={tw.scenes} color={T.em} />
    </>
  );
}

function TabPlatforms({ r, tw }) {
  const ps = r.platform_scores || {};
  const labels = {
    youtube_preroll_6s: "YouTube 6s", youtube_preroll_15s: "YouTube 15s", youtube_instream: "YouTube In-stream",
    instagram_reels: "Instagram Reels", instagram_stories: "Instagram Stories", instagram_feed: "Instagram Feed",
    meta_feed: "Meta Feed", meta_stories: "Meta Stories", tiktok: "TikTok", linkedin_feed: "LinkedIn",
    twitter_x: "Twitter / X", tv_broadcast: "TV Broadcast", ctv_ott: "CTV / OTT", dooh: "DOOH", programmatic_display: "Programmatic Display"
  };

  const sorted = Object.entries(ps).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {sorted.map(([k, v]) => {
          const c = score2color(v);
          return (
            <div key={k} style={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 12px", textAlign: "center", borderTop: `3px solid ${c}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: T.dim, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{labels[k] || k}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: c, marginTop: 4 }}>{score2grade(v)}</div>
            </div>
          );
        })}
      </div>
      <Takeaway icon={Ic.monitor} title="Platform Strategy — Where to Run This" items={tw.platforms} color={T.sky} />
    </>
  );
}

function TabSound({ r, tw }) {
  const sn = r.sound_analysis || {};
  const soundLabels = { sound_dependency: "Sound Dependency", music_effectiveness: "Music Effectiveness", voiceover_clarity: "Voiceover Clarity", sound_off_text_quality: "Sound-Off Text Quality", asmr_trigger: "ASMR Trigger", sonic_branding: "Sonic Branding" };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle color={T.violet}>Sound Analysis Metrics</SectionTitle>
          {Object.entries(soundLabels).map(([k, l]) => <BarRow key={k} label={l} value={sn[k] || 0} color={T.violet} wide={180} />)}
        </Card>
        <Card>
          <SectionTitle color={T.gold}>Sound Strategy Assessment</SectionTitle>
          <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, marginBottom: 20 }}>{sn.sound_note || "No sound analysis available."}</div>
          <div style={{ background: T.card2, borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.dim, textTransform: "uppercase", marginBottom: 8 }}>Sound-Off Survival</div>
            <div style={{ fontSize: 48, fontWeight: 900, fontFamily: "monospace", color: score2color(r.sound_off_survival || 0) }}>{r.sound_off_survival || 0}</div>
          </div>
        </Card>
      </div>
      <Takeaway icon={Ic.volume} title="Sound Strategy — Actions" items={tw.sound} color={T.violet} />
    </>
  );
}

function TabPrivacy({ r, tw }) {
  const pr = r.privacy_and_data_audit || {};
  const riskColor = pr.dpdp_compliance_risk === "high" ? T.red : pr.dpdp_compliance_risk === "medium" ? T.amber : T.green;
  const checks = [
    ["Data Collection Present", pr.data_collection_present],
    ["Consent Mechanism Visible", pr.consent_mechanism_visible],
    ["QR Code Present", pr.qr_code_present],
    ["URL / CTA Present", pr.url_cta_present],
    ["Hashtag Present", pr.hashtag_present],
    ["Regulatory Disclaimers Visible", pr.regulatory_disclaimers_visible],
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card>
          <SectionTitle color={T.gold}>Privacy & Data Audit</SectionTitle>
          {checks.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.dim }}>{l}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: v ? T.green : T.red }}>
                {v ? Ic.check : Ic.x} {v ? "Yes" : "No"}
              </span>
            </div>
          ))}
        </Card>
        <div>
          <Card style={{ marginBottom: 20 }}>
            <SectionTitle color={T.rose}>Compliance Risk</SectionTitle>
            <div style={{ background: riskColor + "15", border: `1px solid ${riskColor}`, borderRadius: 12, padding: "16px 20px", textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 4 }}>DPDP Compliance Risk</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: riskColor, textTransform: "uppercase" }}>{pr.dpdp_compliance_risk || "LOW"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Brand Safety", r.brand_safety], ["Regulatory", r.regulatory_compliance]].map(([l, v]) => (
                <div key={l} style={{ background: T.card2, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: T.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: score2color(v || 0) }}>{v || 0}</div>
                </div>
              ))}
            </div>
          </Card>
          {pr.privacy_note && (
            <Card>
              <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7 }}>{pr.privacy_note}</div>
            </Card>
          )}
        </div>
      </div>
      <Takeaway icon={Ic.shield} title="Privacy & Compliance — Actions" items={tw.privacy} color={T.gold} />
    </>
  );
}

function TabStrategy({ r }) {
  const vcolor = { win: T.green, risk: T.red, tip: T.sky, watch: T.amber };
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {(r.strategic_insights || []).map(s => (
          <Card key={s.num} style={{ borderTop: `3px solid ${vcolor[s.vtype] || T.em}` }}>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: T.dim, marginBottom: 6 }}>{s.num}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 10 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7, marginBottom: 14 }}>{s.body}</div>
            <div style={{ background: (vcolor[s.vtype] || T.em) + "15", border: `1px solid ${vcolor[s.vtype] || T.em}40`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: vcolor[s.vtype] || T.em, fontWeight: 600 }}>
              {s.verdict}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function TabCMO({ r }) {
  const pColor = { critical: T.red, high: T.amber, medium: T.gold, low: T.dim };
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: T.gold, textTransform: "uppercase", marginBottom: 4 }}>For the Marketing Head</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: T.gold, marginBottom: 6 }}>The CMO Playbook</h2>
        <p style={{ fontSize: 13, color: T.dim }}>Prioritised actions mapped to metric gaps. Sorted by impact-to-effort ratio.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {(r.cmo_actions || []).map(a => (
          <Card key={a.num} style={{ borderLeft: `3px solid ${pColor[a.priority] || T.em}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontFamily: "monospace", color: T.dim }}>ACTION {a.num}</span>
              <span style={{ background: (pColor[a.priority] || T.em) + "20", border: `1px solid ${pColor[a.priority] || T.em}40`, borderRadius: 100, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: pColor[a.priority] || T.em, textTransform: "uppercase" }}>{a.priority}</span>
              <span style={{ fontSize: 10, color: T.dim }}>Effort: {a.effort}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 8 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7, marginBottom: 12 }}>{a.body}</div>
            {a.impact && <div style={{ fontSize: 11, fontWeight: 700, color: T.em }}>→ {a.impact}</div>}
          </Card>
        ))}
      </div>
    </>
  );
}

function TabGlossary() {
  const sections = [
    { title: "Measurement Framework", color: T.gold, items: [
      ["Viral Potential", "Aggregate shareability score combining emotional triggers, novelty, pattern interrupts, and identity signaling. Derived from amygdala activation + mirror neuron engagement + share intent."],
      ["Hook Strength", "First 1–2 second stopping power. Measures visual salience, motion detection, human face presence, and pattern interrupt effectiveness."],
      ["Hold Rate", "Predicted % of viewers watching through the full creative. Computed from scene variety, pacing rhythm, narrative tension, and cognitive load balance."],
      ["Memory Encoding", "Long-term memory formation probability via co-activation of visual cortex, hippocampus, and amygdala. Based on Kahneman dual-process theory."],
      ["System 1 vs System 2", "Kahneman processing balance. System 1 = fast, emotional, intuitive. System 2 = slow, rational, deliberate. Optimal creative zone: 65–75 (emotional-first, rational-layered)."],
      ["Sound-Off Survival", "Performance without audio. Measures text overlay quality, visual narrative self-sufficiency, and subtitle clarity."],
      ["DPDP Compliance Risk", "India Digital Personal Data Protection Act 2023 compliance signals. Detects data collection CTAs, QR codes, and consent mechanism visibility."],
      ["Carbon Signal", "Sustainability messaging detection. Identifies green advertising signals for ESG reporting and green media measurement frameworks."],
    ]},
    { title: "Scientific Basis", color: T.em, items: [
      ["Advertising Science References", "Byron Sharp's Distinctive Brand Assets (brand recall model), Ehrenberg-Bass penetration theory (cultural resonance), attention economics (Karen Nelson-Field), memory encoding models (Robert Heath), System 1/2 processing (Daniel Kahneman)."],
      ["Brain Region Mapping", "8 regions analysed: Visual Cortex (attention), Prefrontal Cortex (rational processing), Amygdala (emotional response), Hippocampus (memory encoding), Auditory Cortex (sound processing), Mirror Neurons (empathy/sharing), Nucleus Accumbens (reward/desire), Anterior Cingulate (engagement/conflict detection)."],
    ]},
  ];

  return (
    <>
      {sections.map(s => (
        <Card key={s.title} style={{ marginBottom: 24 }}>
          <SectionTitle color={s.color}>{s.title}</SectionTitle>
          {s.items.map(([term, def]) => (
            <div key={term} style={{ padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 6 }}>{term}</div>
              <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.7 }}>{def}</div>
            </div>
          ))}
        </Card>
      ))}
      <Card>
        <div style={{ fontSize: 11, color: T.muted, textAlign: "center", lineHeight: 1.8 }}>
          ADVantage Insights Brain Encoder™ · Neural Creative Intelligence · Built by Anil Pandit · 2026<br />
          All scoring models are AI-generated analyses for creative strategy purposes.
        </div>
      </Card>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState("landing");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [results, setResults] = useState(null);
  const [meta, setMeta] = useState({});
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => { sbList().then(setHistory); }, []);

  const loadHistory = useCallback(async id => {
    const rec = await sbGet(id);
    if (rec) {
      setMeta({ brand: rec.brand, campaign: rec.campaign, industry: rec.industry, market: rec.market, type: rec.creative_type });
      setResults(rec.analysis_json);
      setStage("results");
    }
  }, []);

  const runAnalysis = useCallback(async (file, formData) => {
    setMeta(formData);
    setStage("analyzing");
    setError(null);
    setProgress(0);

    const msgs = [
      "Extracting visual frames...",
      "Mapping neural activation patterns...",
      "Computing 17 performance metrics...",
      "Scoring 15 platform environments...",
      "Building CMO action playbook...",
      "Finalising analysis report...",
    ];

    let msgIdx = 0;
    setProgressMsg(msgs[0]);
    const ticker = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + 2, 88);
        const newMsgIdx = Math.floor((next / 88) * msgs.length);
        if (newMsgIdx !== msgIdx && newMsgIdx < msgs.length) { msgIdx = newMsgIdx; setProgressMsg(msgs[msgIdx]); }
        return next;
      });
    }, 500);

    try {
      const { frames, duration, isImage } = await extractFrames(file);
      const payload = { frames, metadata: { ...formData, duration, isImage } };

      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      clearInterval(ticker);
      const data = await resp.json();

      if (!resp.ok || data.error) throw new Error(data.error || `Server error ${resp.status}`);

      setProgress(100);
      setProgressMsg("Analysis complete.");

      const analysis = data.analysis;
      setResults(analysis);
      setStage("results");

      // Save to Supabase
      sbSave({
        brand: formData.brand,
        campaign: formData.campaign,
        industry: formData.industry,
        market: formData.market,
        creative_type: formData.type,
        overall_grade: analysis.overall_grade,
        analysis_json: analysis,
      }).then(saved => { if (saved) sbList().then(setHistory); });

    } catch (err) {
      clearInterval(ticker);
      setError(err.message);
      setStage("error");
    }
  }, []);

  if (stage === "landing") return <Landing onStart={() => setStage("upload")} history={history} onLoadHistory={loadHistory} />;
  if (stage === "upload")   return <UploadForm onAnalyse={runAnalysis} onBack={() => setStage("landing")} />;
  if (stage === "analyzing") return <Analyzing progress={progress} msg={progressMsg} />;
  if (stage === "results")  return <Results data={results} meta={meta} onNew={() => setStage("landing")} />;

  // Error state
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ background: T.card, border: `1px solid ${T.red}40`, borderRadius: 20, padding: 48, maxWidth: 520, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.red, marginBottom: 16 }}>Analysis Failed</div>
        <div style={{ fontSize: 13, color: T.dim, lineHeight: 1.7, marginBottom: 28 }}>{error}</div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 28 }}>
          If you see a timeout error, try uploading a shorter video clip or a single image frame. The platform uses smart frame sampling to minimise analysis time.
        </div>
        <button onClick={() => setStage("upload")} style={{ background: T.em, color: T.bg, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          Try Again
        </button>
      </div>
    </div>
  );
}
