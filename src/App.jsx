import { useState, useRef, useCallback, useEffect } from "react";
import { generateBrainEncoderPDF } from "./generatePDF";
import Card from "./components/Card";
import ScoreCard from "./components/ScoreCard";
import BarMetric from "./components/BarMetric";
import CardTitle from "./components/CardTitle";
import Takeaway from "./components/Takeaway";
import Sidebar from "./components/Sidebar";
import NeurIQTab from "./components/NeurIQTab";

// ============================================================
// DESIGN TOKENS — Premium Consultancy Edition
// Palette: Deep Onyx · Champagne Gold · Malachite · Slate
// ============================================================
const DARK_THEME = {
  bg:"#050507",ink:"#09090b",s1:"#101014",s2:"#17171d",s3:"#22222a",
  panel:"#101014",panel2:"#17171d",
  border:"#26262d",border2:"#3a3627",
  text:"#F2F2FF",dim:"#A0A0CC",muted:"#6A6A95",
  gold:"#d8b45a",goldL:"#f0d58a",goldD:"#9b7930",
  cyan:"#2dd4bf",blue:"#60a5fa",green:"#34d399",
  red:"#fb7185",amber:"#fbbf24",orange:"#fb923c",
  purple:"#a78bfa",pink:"#f472b6",teal:"#14b8a6",
  rose:"#fb7185",lime:"#a3e635",sky:"#38bdf8",
  shadow:"rgba(0,0,0,0.52)",
  sideW:240,
};

const LIGHT_THEME = {
  bg:"#F2F2F8",
  ink:"#EDEDF4",
  s1:"#FFFFFF",
  s2:"#EDEDF4",
  s3:"#E4E4EE",
  panel:"#FFFFFF",
  panel2:"#EDEDF4",
  border:"rgba(0,0,0,0.09)",
  border2:"rgba(0,0,0,0.05)",
  text:"#0A0A1A",
  dim:"#3C3C5C",
  muted:"#7878A0",
  gold:"#B07D0A",
  goldL:"#CB9211",
  goldD:"#8E6408",
  cyan:"#0882A8",
  blue:"#1A46CC",
  green:"#047A57",
  red:"#C41F1F",
  amber:"#C47500",
  orange:"#C44B0A",
  purple:"#6829D4",
  pink:"#B81E65",
  teal:"#0A8A80",
  rose:"#C41F1F",
  lime:"#4D7C0F",
  sky:"#0882A8",
  shadow:"rgba(0,0,0,0.12)",
  sideW:240,
};

const grade=(v)=>v>=90?"A+":v>=85?"A":v>=80?"A-":v>=75?"B+":v>=70?"B":v>=65?"B-":v>=60?"C+":v>=55?"C":v>=50?"C-":v>=40?"D":"F";

const COMPETITIVE_METRICS = [
  ["Viral Potential", "viral_potential"],
  ["Hook Strength", "hook_strength"],
  ["Hold Rate", "hold_rate"],
  ["Emotional Peak", "emotional_peak"],
  ["Brand Recall", "brand_recall"],
  ["Memory Encoding", "memory_encoding"],
  ["Sound-Off Survival", "sound_off_survival"],
  ["Share Intent", "share_intent"],
  ["Creative Efficiency", "creative_efficiency"],
];

const DNA_METRICS = [
  ["Viral Potential", "viral_potential"],
  ["Hook Strength", "hook_strength"],
  ["Hold Rate", "hold_rate"],
  ["Emotional Peak", "emotional_peak"],
  ["Brand Recall", "brand_recall"],
  ["Memory Encoding", "memory_encoding"],
  ["Sound-Off Survival", "sound_off_survival"],
  ["Share Intent", "share_intent"],
  ["Creative Efficiency", "creative_efficiency"],
  ["Cultural Resonance", "cultural_resonance"],
];

const computeDnaMatch = (currentResult, dnaData) => {
  if (!currentResult || !dnaData?.ready || !dnaData.metric_means) return null;
  const weighted = DNA_METRICS.map(([label, key]) => {
    const current = currentResult[key];
    const mean = dnaData.metric_means[key];
    if (typeof current !== "number" || typeof mean !== "number") return null;
    const deviation = Math.abs(current - mean);
    const weight = key === "brand_recall" || key === "memory_encoding" ? 1.5 : 1;
    return {
      label,
      key,
      current,
      mean,
      deviation,
      weightedDeviation: deviation * weight,
      direction: current >= mean ? "above" : "below",
    };
  }).filter(Boolean);
  if (!weighted.length) return null;
  const rawScore = weighted.reduce((sum, item) => sum + item.weightedDeviation, 0) / 11;
  const score = Math.max(0, Math.min(100, Math.round(100 - rawScore)));
  const topDeviations = [...weighted]
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 2)
    .map(item => ({
      label: item.label,
      deviation: Math.round(item.deviation),
      direction: item.direction,
    }));
  return { score, topDeviations };
};

const CERT_SCORE_KEYS = [
  ["Brand Recall", "brand_recall"],
  ["Memory Encoding", "memory_encoding"],
  ["Hook Strength", "hook_strength"],
  ["Emotional Peak", "emotional_peak"],
  ["Cultural Resonance", "cultural_resonance"],
];

const certNum = (result, key) => {
  const value = result?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const computeCertificationEligibility = (result) => {
  if (!result) return { eligible: false, weighted_score: 0, failed_criteria: [] };
  const weighted_score =
    (certNum(result, "memory_encoding") || 0) * 0.20 +
    (certNum(result, "brand_recall") || 0) * 0.20 +
    (certNum(result, "hook_strength") || 0) * 0.15 +
    (certNum(result, "hold_rate") || 0) * 0.15 +
    (certNum(result, "emotional_peak") || 0) * 0.10 +
    (certNum(result, "creative_efficiency") || 0) * 0.10 +
    (certNum(result, "cultural_resonance") || 0) * 0.10;
  const checks = [
    ["Overall weighted score", Math.round(weighted_score), 75],
    ["Brand Recall", certNum(result, "brand_recall"), 65],
    ["Memory Encoding", certNum(result, "memory_encoding"), 60],
    ["Hook Strength", certNum(result, "hook_strength"), 65],
    ["Brand Safety", certNum(result, "brand_safety"), 85],
    ["Regulatory Compliance", certNum(result, "regulatory_compliance"), 85],
  ];
  const failed_criteria = checks
    .filter(([, value, min]) => typeof value !== "number" || value < min)
    .map(([label, value, min]) => `${label}: ${typeof value === "number" ? Math.round(value) : "missing"} (minimum ${min})`);
  return {
    eligible: failed_criteria.length === 0,
    weighted_score: Math.round(weighted_score),
    failed_criteria,
  };
};

// ============================================================
// SHARED COMPONENTS — Premium Edition
// ============================================================

// Google Fonts injection
if(typeof document !== "undefined" && !document.getElementById("be-fonts")){
  const l = document.createElement("link");
  l.id = "be-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap";
  document.head.appendChild(l);
}

// SVG Icons — no emojis
const Icon = {
  summary: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  neural:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11l-5 6M12 11l5 6"/></svg>,
  attn:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  emotion: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  scene:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>,
  platform:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  sound:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
  privacy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  strategy:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  cmo:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  outcomes:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/><path d="M4 21h16"/></svg>,
  neuriq:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>,
  glossary:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  new:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  dl:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  tm:      null,
};

// Vertical Sidebar Nav
const NAV_TABS = [
  {id:"summary",  label:"Executive Summary", icon:Icon.summary, category:"Executive Readout", categoryColor:"gold"},
  {id:"outcomes", label:"Outcome Forecast",   icon:Icon.outcomes, category:"Executive Readout", categoryColor:"gold"},
  {id:"neural",   label:"Neural Map",         icon:Icon.neural, category:"Neural Diagnostics", categoryColor:"cyan"},
  {id:"attention",label:"Attention",          icon:Icon.attn, category:"Neural Diagnostics", categoryColor:"cyan"},
  {id:"emotion",  label:"Emotional Arch.",    icon:Icon.emotion, category:"Neural Diagnostics", categoryColor:"cyan"},
  {id:"scenes",   label:"Scene Intelligence", icon:Icon.scene, category:"Neural Diagnostics", categoryColor:"cyan"},
  {id:"platforms",label:"Platform Scores",    icon:Icon.platform, category:"Channel & Platform Fit", categoryColor:"teal"},
  {id:"sound",    label:"Sound & Sensory",    icon:Icon.sound, category:"Channel & Platform Fit", categoryColor:"teal"},
  {id:"privacy",  label:"Privacy & Compliance",icon:Icon.privacy, category:"Risk & Governance", categoryColor:"amber"},
  {id:"strategy", label:"Strategic Insights", icon:Icon.strategy, category:"CMO Decision Layer", categoryColor:"purple"},
  {id:"cmo",      label:"CMO Playbook",       icon:Icon.cmo, category:"CMO Decision Layer", categoryColor:"purple"},
  {id:"neuriq",   label:"NeurIQ™",            icon:Icon.neuriq, category:"CMO Decision Layer", categoryColor:"purple"},
  {id:"repository", label:"Repository",        icon:"🗄️", category:"Workspace & Evidence", categoryColor:"goldD"},
  {id:"methodology",label:"Methodology",      icon:Icon.glossary, category:"Workspace & Evidence", categoryColor:"goldD"},
];

const PLATFORM_META = {
  "TV Broadcast": { abbr: "TV", color: "#10B981" },
  "CTV / OTT": { abbr: "OTT", color: "#22D3EE" },
  "YouTube In-Stream": { abbr: "YT", color: "#FF0033" },
  "YouTube 6s Bumper": { abbr: "YT", color: "#FF0033" },
  "YouTube Shorts": { abbr: "YT", color: "#FF0033" },
  "Instagram Reels": { abbr: "IG", color: "#E1306C" },
  "Instagram Feed": { abbr: "IG", color: "#E1306C" },
  "Instagram Stories": { abbr: "IG", color: "#E1306C" },
  "Facebook Feed": { abbr: "FB", color: "#1877F2" },
  "Meta Feed": { abbr: "META", color: "#1877F2" },
  TikTok: { abbr: "TT", color: "#69C9D0" },
  LinkedIn: { abbr: "IN", color: "#0A66C2" },
  "X / Twitter": { abbr: "X", color: "#E7E9EA" },
  Snapchat: { abbr: "SC", color: "#FFFC00" },
  "Connected TV": { abbr: "CTV", color: "#22D3EE" },
};

function PlatformChip({ name, C = DARK_THEME }) {
  const cleanName = String(name || "").replace(/_/g, " ");
  const lower = cleanName.toLowerCase();
  const found = Object.entries(PLATFORM_META).find(([key]) => {
    const keyLower = key.toLowerCase();
    const firstWord = keyLower.split(/\s|\/|-/)[0];
    return lower.includes(keyLower) || lower.includes(firstWord);
  });
  const meta = found?.[1] || { abbr: cleanName.slice(0, 2).toUpperCase(), color: C.gold };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 34,
        height: 22,
        padding: "0 7px",
        marginRight: 10,
        borderRadius: 6,
        fontSize: 9,
        fontWeight: 800,
        fontFamily: "monospace",
        letterSpacing: "0.08em",
        color: meta.color,
        background: `${meta.color}15`,
        border: `1px solid ${meta.color}40`,
        flexShrink: 0,
      }}
    >
      {meta.abbr}
    </span>
  );
}

function NeuralSignalBrainPanel({ isDarkMode }) {
  const regions = [
    ["01", "Prefrontal Cortex", "Decision · brand trust", "#F5A623", 506],
    ["02", "Amygdala", "Emotion · desire · risk", "#FF6B9D", 544],
    ["03", "Hippocampus", "Memory encoding", "#22D3EE", 582],
    ["04", "Visual Cortex", "Attention · salience", "#10B981", 620],
    ["05", "Auditory Cortex", "Sonic brand binding", "#A78BFA", 658],
    ["06", "Anterior Cingulate", "Attention control", "#FFD580", 696],
    ["07", "Mirror Neurons", "Empathy simulation", "#FB923C", 734],
    ["08", "Nucleus Accumbens", "Reward · brand love", "#EC4899", 772],
  ];
  return (
    <div style={{
      marginBottom:28,
      borderRadius:18,
      overflow:"hidden",
      boxShadow:isDarkMode
        ?"0 0 44px rgba(245,166,35,0.10)"
        :"0 12px 36px rgba(0,0,0,0.22)",
    }}>
      <svg width="100%" viewBox="0 0 680 500" role="img" aria-label="AdCritIQ neural signal map showing eight advertising-relevant brain regions" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>{`
            @keyframes brainPulse{0%,100%{opacity:.72;r:11}50%{opacity:1;r:14}}
            @keyframes haloPulse{0%,100%{opacity:.10}50%{opacity:.28}}
            @keyframes pathFlow{0%{stroke-dashoffset:220}100%{stroke-dashoffset:0}}
            .bn1{animation:brainPulse 2.2s ease-in-out infinite}
            .bn2{animation:brainPulse 2.6s ease-in-out .3s infinite}
            .bn3{animation:brainPulse 2.1s ease-in-out .6s infinite}
            .bn4{animation:brainPulse 2.8s ease-in-out .9s infinite}
            .bn5{animation:brainPulse 2.4s ease-in-out 1.2s infinite}
            .bn6{animation:brainPulse 2.5s ease-in-out .4s infinite}
            .bn7{animation:brainPulse 2.3s ease-in-out .8s infinite}
            .bn8{animation:brainPulse 2.7s ease-in-out 1.1s infinite}
            .bh{animation:haloPulse 2.8s ease-in-out infinite}
            .bf{animation:pathFlow 3.4s linear infinite;stroke-dasharray:10 7}
          `}</style>
          <pattern id="brainPanelGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#C8860A" strokeWidth="0.35" opacity="0.16"/>
          </pattern>
          <linearGradient id="brainPanelWash" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10101E"/>
            <stop offset="100%" stopColor="#06060D"/>
          </linearGradient>
        </defs>
        <rect width="680" height="500" rx="18" fill="url(#brainPanelWash)"/>
        <rect width="680" height="500" rx="18" fill="url(#brainPanelGrid)"/>
        <rect x="1" y="1" width="678" height="498" rx="17" fill="none" stroke="#F5A623" strokeWidth="1" opacity="0.28"/>
        <rect x="0" y="0" width="680" height="42" fill="#0D0D19"/>
        <line x1="0" y1="42" x2="680" y2="42" stroke="#F5A623" strokeWidth="1" opacity="0.22"/>
        <text x="24" y="27" fontFamily="monospace" fontSize="11" fill="#F5A623" opacity=".74" letterSpacing="3">ADCRITIQ™</text>
        <text x="340" y="27" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#F5A623" opacity=".6" letterSpacing="2.4">NEURAL SIGNAL MAP</text>
        <text x="654" y="27" textAnchor="end" fontFamily="monospace" fontSize="10" fill="#4ADE80" opacity=".8" letterSpacing="1">● LIVE</text>

        <g transform="translate(22 54)">
          <path d="M 178 62 C 122 48,70 72,52 125 C 31 186,45 241,72 286 C 98 330,140 350,178 333 C 209 319,214 282,220 252 C 226 220,251 200,250 168 C 249 139,237 114,250 88 C 226 62,200 68,178 62 Z" fill="#F5A623" fillOpacity=".035" stroke="#D69B2D" strokeWidth="2.5" opacity=".86"/>
          <path d="M 314 62 C 370 48,422 72,440 125 C 461 186,447 241,420 286 C 394 330,352 350,314 333 C 283 319,278 282,272 252 C 266 220,241 200,242 168 C 243 139,255 114,242 88 C 266 62,292 68,314 62 Z" fill="#F5A623" fillOpacity=".035" stroke="#D69B2D" strokeWidth="2.5" opacity=".86"/>
          <path d="M 244 164 C 250 151,263 145,270 145 C 277 145,290 151,296 164" fill="none" stroke="#D69B2D" strokeWidth="3" opacity=".58"/>
          {[
            "M 80 145 C 106 128,139 131,156 153",
            "M 70 215 C 103 197,141 204,165 230",
            "M 113 294 C 142 274,179 279,199 304",
            "M 379 145 C 353 128,320 131,303 153",
            "M 388 215 C 355 197,317 204,293 230",
            "M 345 294 C 316 274,279 279,259 304",
          ].map((d,i)=><path key={i} d={d} fill="none" stroke="#D69B2D" strokeWidth="1.2" opacity=".28"/>)}
          {[
            ["M 130 130 C 168 123,209 126,248 145", "#F5A623"],
            ["M 248 145 C 287 126,328 123,366 130", "#FFD580"],
            ["M 128 130 C 130 169,130 196,128 226", "#FF6B9D"],
            ["M 128 226 C 168 238,205 246,231 264", "#22D3EE"],
            ["M 238 281 C 246 317,247 349,247 374", "#10B981"],
            ["M 370 226 C 334 245,303 255,279 272", "#EC4899"],
          ].map(([d,c],i)=><path key={i} d={d} fill="none" stroke={c} strokeWidth="2" opacity=".72" className="bf"/>)}
          {[
            [128,130,"01","#F5A623","bn1"],
            [128,226,"02","#FF6B9D","bn2"],
            [231,264,"03","#22D3EE","bn3"],
            [247,374,"04","#10B981","bn4"],
            [74,220,"05","#A78BFA","bn5"],
            [248,145,"06","#FFD580","bn6"],
            [382,226,"07","#FB923C","bn7"],
            [302,272,"08","#EC4899","bn8"],
          ].map(([cx,cy,num,color,cls])=>(
            <g key={num}>
              <circle cx={cx} cy={cy} r="28" fill={color} className="bh"/>
              <circle cx={cx} cy={cy} r="11" fill={color} className={cls}/>
              <circle cx={cx} cy={cy} r="18" fill="none" stroke={color} strokeWidth="1.3" opacity=".55"/>
              <text x={cx} y={cy+4} textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#05050A" fontWeight="900">{num}</text>
            </g>
          ))}
          <text x="246" y="418" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#F5A623" opacity=".5" letterSpacing="2">PREDICTIVE CORTICAL RESPONSE MODEL</text>
        </g>

        <g transform="translate(462 68)">
          <rect x="0" y="0" width="190" height="382" rx="14" fill="#0E0E19" stroke="#F5A623" strokeWidth="1" opacity=".96"/>
          <text x="16" y="24" fontFamily="monospace" fontSize="10" fill="#F5A623" opacity=".8" letterSpacing="1.8">SIGNAL READOUT</text>
          <text x="16" y="42" fontFamily="monospace" fontSize="8" fill="#9B8FB8" opacity=".9" letterSpacing=".9">8 REGIONS · ADVERTISING RESPONSE</text>
          {regions.map(([num,name,sub,color,y])=>(
            <g key={num} transform={`translate(0 ${y-454})`}>
              <rect x="12" y="0" width="166" height="34" rx="8" fill={color} fillOpacity=".08" stroke={color} strokeWidth=".8" opacity=".92"/>
              <circle cx="28" cy="17" r="8" fill={color}/>
              <text x="28" y="20.5" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#05050A" fontWeight="900">{num}</text>
              <text x="44" y="14" fontFamily="monospace" fontSize="9.5" fill={color} fontWeight="800">{name}</text>
              <text x="44" y="26" fontFamily="monospace" fontSize="8" fill="#D8D1E8" opacity=".72">{sub}</text>
            </g>
          ))}
          <rect x="12" y="348" width="166" height="20" rx="6" fill="#F5A623" fillOpacity=".08" stroke="#F5A623" strokeWidth=".8" opacity=".9"/>
          <text x="95" y="362" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#F5A623" opacity=".85" letterSpacing="1.4">NOT BIOMETRIC · AI PREDICTED</text>
        </g>
      </svg>
    </div>
  );
}

function gradeToVisualScore(g) {
  if (g === "A+") return 95;
  if (g === "A") return 88;
  if (g === "A-") return 82;
  if (g === "B+") return 78;
  if (g === "B") return 72;
  if (g === "B-") return 67;
  if (g === "C+") return 62;
  if (g === "C") return 57;
  if (g === "C-") return 52;
  if (g === "D") return 43;
  if (g === "F") return 30;
  return 65;
}

// ============================================================
// TAKEAWAY DATA GENERATOR
// ============================================================
function getTakeaways(r){
  var t={};

  // SUMMARY
  t.summary=[];
  if((r.viral_potential||0)>=70){
    t.summary.push({type:"win",label:"Strong viral potential.",text:"This creative has organic shareability. Prioritize for social-first distribution."});
  }else{
    t.summary.push({type:"fix",label:"Viral potential is below 70.",text:"Add a pattern interrupt, emotional spike, or relatable hook to increase shareability."});
  }
  if((r.hold_rate||0)<60){
    t.summary.push({type:"warn",label:"Hold rate is critical.",text:"More than "+(100-(r.hold_rate||0))+"% of viewers will drop off. Re-edit to compress the weakest section by 30%."});
  }
  if((r.sound_off_survival||0)<60){
    t.summary.push({type:"fix",label:"Sound-off survival is low.",text:"Add bold kinetic text overlays for Meta/Instagram. 80%+ of social consumption is sound-off."});
  }
  if((r.brand_recall||0)>=80){
    t.summary.push({type:"win",label:"Excellent brand recall.",text:"Distinctive brand assets are well-placed. This creative will be remembered."});
  }else{
    t.summary.push({type:"fix",label:"Brand recall needs work.",text:"Increase logo visibility, add product shot earlier, or strengthen distinctive brand assets."});
  }
  if((r.memory_encoding||0)<65){
    t.summary.push({type:"warn",label:"Risk of 'watched but forgotten'.",text:"High attention but low memory encoding means viewers see it but won't remember it. Add an emotional anchor moment."});
  }

  // NEURAL
  t.neural=[];
  var br=r.brain_regions||{};
  if((br.amygdala||0)<50){
    t.neural.push({type:"fix",label:"Amygdala activation is low.",text:"The creative isn't triggering emotional processing. Add surprise, humor, tension, or human vulnerability."});
  }else{
    t.neural.push({type:"win",label:"Strong emotional activation.",text:"The amygdala is engaged, which is the prerequisite for memory encoding and sharing behavior."});
  }
  if((br.prefrontal_cortex||0)>70&&(br.amygdala||0)<60){
    t.neural.push({type:"warn",label:"Over-indexing on rational processing.",text:"High prefrontal + low amygdala = the viewer is thinking, not feeling. Lead with emotion."});
  }
  if((br.mirror_neurons||0)>=65){
    t.neural.push({type:"win",label:"Mirror neurons active.",text:"Viewers are empathizing with on-screen characters. This drives share intent and emotional contagion."});
  }else{
    t.neural.push({type:"fix",label:"Low mirror neuron activation.",text:"Add close-up facial expressions, human-to-human interaction, or relatable body language to trigger empathy."});
  }
  var s1s2=r.system1_vs_system2||50;
  if(s1s2>=65&&s1s2<=75){
    t.neural.push({type:"win",label:"System 1/2 balance is in the optimal zone (65-75).",text:"The creative leads with emotion and layers in enough rational messaging."});
  }else if(s1s2<65){
    t.neural.push({type:"fix",label:"Over-indexing on System 2 (rational).",text:"Reduce claim density in the first half. Lead with a feeling, not a fact."});
  }else{
    t.neural.push({type:"warn",label:"Over-indexing on System 1 (emotional).",text:"Strong emotion but the rational message may not land. Add one clear product claim."});
  }

  // ATTENTION
  t.attention=[];
  var fmt=r.creative_format||"video";
  var fm=r.format_metrics||{};
  if(fmt==="static_image"){
    var stopping=fm.stopping_power||r.hook_strength||0;
    var hierarchy=fm.visual_hierarchy||r.creative_efficiency||0;
    var brand=fm.brand_prominence||r.brand_recall||0;
    var clarity=fm.message_clarity||r.memory_encoding||0;
    var cta=fm.cta_clarity||r.share_intent||0;
    var clutter=fm.clutter_risk||r.ad_fatigue_risk||0;
    t.attention.push({type:stopping>=70?"win":"fix",label:"Stopping power: "+stopping+"/100.",text:stopping>=70?"The image has strong first-glance pull. Preserve the dominant focal point.":"Strengthen the first-glance focal point with contrast, scale, or a simpler hero element."});
    t.attention.push({type:brand>=70?"win":"fix",label:"Brand prominence: "+brand+"/100.",text:brand>=70?"Brand linkage is visible enough to support recall.":"Increase logo/product prominence or place brand assets closer to the main focal area."});
    if(clarity<65||cta<65)t.attention.push({type:"fix",label:"Message or CTA clarity needs work.",text:"Simplify the headline, reduce competing copy, and make the next action visible within the first scan."});
    if(clutter>55)t.attention.push({type:"warn",label:"Clutter risk: "+clutter+"/100.",text:"Reduce secondary elements so the eye can move from hero visual to brand to message without friction."});
    t.attention.push({type:hierarchy>=70?"win":"warn",label:"Visual hierarchy: "+hierarchy+"/100.",text:hierarchy>=70?"The scan path is structured for fast decoding.":"Rebalance layout hierarchy so the most important message receives the strongest visual weight."});
    return t;
  }
  if(fmt==="text"||fmt==="audio"){
    var headline=fm.headline_strength||fm.voice_clarity||r.hook_strength||0;
    var proposition=fm.proposition_clarity||fm.script_fluency||r.creative_efficiency||0;
    var recall=fm.cta_recall||fm.cta_strength||r.brand_recall||0;
    t.attention.push({type:headline>=70?"win":"fix",label:(fmt==="audio"?"Opening / voice clarity: ":"Headline strength: ")+headline+"/100.",text:headline>=70?"The opening is strong enough to earn initial attention.":"Sharpen the opening line so the audience understands the payoff immediately."});
    t.attention.push({type:proposition>=70?"win":"fix",label:"Proposition clarity: "+proposition+"/100.",text:proposition>=70?"The core promise is easy to process.":"Reduce abstraction and make the value proposition more concrete."});
    t.attention.push({type:recall>=70?"win":"fix",label:"CTA / recall strength: "+recall+"/100.",text:recall>=70?"The response cue is likely to be remembered.":"Make the CTA more specific, repeated, or easier to act on."});
    return t;
  }
  var attn=r.attention_curve||[];
  if(attn.length>0){
    var peak=Math.max.apply(null,attn);
    var low=Math.min.apply(null,attn);
    var peakIdx=attn.indexOf(peak);
    var lowIdx=attn.indexOf(low);
    t.attention.push({type:"do",label:"Peak attention at ~"+peakIdx+"s ("+peak+"%).",text:"This is your strongest moment. Use this frame as the thumbnail for static placements."});
    if(low<50){
      t.attention.push({type:"warn",label:"Attention drops to "+low+"% at ~"+lowIdx+"s.",text:"This is your drop zone. Cut this section, add a visual pattern interrupt, or compress it by 50%."});
    }
    var drops=0;
    for(var i=1;i<attn.length;i++){if(attn[i]<attn[i-1]-10)drops++;}
    if(drops>2){
      t.attention.push({type:"fix",label:drops+" significant attention drops detected.",text:"Multiple drops indicate pacing issues. The creative needs more consistent visual variety."});
    }
    var avg=Math.round(attn.reduce(function(a,b){return a+b;},0)/attn.length);
    t.attention.push({type:avg>=65?"win":"warn",label:"Average attention: "+avg+"%.",text:avg>=65?"Above the 60% threshold for effective ad recall.":"Below the 60% threshold. Consider a shorter cut."});
  }

  // EMOTION
  t.emotion=[];
  if((r.emotional_peak||0)>=70){
    t.emotion.push({type:"win",label:"Strong emotional peak ("+r.emotional_peak+"/100).",text:"This creative triggers genuine emotion, the single strongest predictor of sharing and long-term recall."});
  }else{
    t.emotion.push({type:"fix",label:"Emotional peak is moderate ("+r.emotional_peak+"/100).",text:"Add a moment of surprise, joy, tension, or vulnerability. The viewer needs to FEEL something."});
  }
  if((r.share_intent||0)>=65){
    t.emotion.push({type:"win",label:"High share intent.",text:"Viewers will want to share this. Optimize for easy sharing: hashtags, under 30s, clear first frame."});
  }else{
    t.emotion.push({type:"fix",label:"Share intent is below 65.",text:"Add one sharing trigger: identity signaling, social currency, emotional contagion, or practical utility."});
  }

  // SCENES
  t.scenes=[];
  t.scenes.push({type:"do",label:"Use scene-level data for re-edits.",text:"Keep scenes scoring above 70. Cut or rework scenes below 50."});
  t.scenes.push({type:"do",label:"Check System mode transitions.",text:"Frequent System 1 to System 2 shifts cause cognitive fatigue."});
  t.scenes.push({type:"do",label:"Watch for drop_zone and ad_avoidance flags.",text:"Any scene flagged as a drop zone is where viewers leave. This is your #1 re-edit priority."});

  // PLATFORMS
  t.platforms=[];
  var ps=r.platform_scores||{};
  var best="";var bestV=0;var worst="";var worstV=100;
  for(var k in ps){if(ps[k]>bestV){bestV=ps[k];best=k;}if(ps[k]<worstV){worstV=ps[k];worst=k;}}
  if(best){t.platforms.push({type:"win",label:"Best platform: "+best.replace(/_/g," ")+" ("+bestV+"/100).",text:"Prioritize media spend here. This creative is optimized for this environment."});}
  if(worst){t.platforms.push({type:"warn",label:"Weakest platform: "+worst.replace(/_/g," ")+" ("+worstV+"/100).",text:"Do not run this creative on "+worst.replace(/_/g," ")+" without a format-specific re-edit."});}
  if((ps.instagram_reels||0)<60){t.platforms.push({type:"fix",label:"Low Reels score.",text:"Reels needs vertical-native, high-energy, sound-optional content. Create a separate 15s vertical cut."});}
  if((ps.tv_broadcast||0)>=80&&(ps.instagram_reels||0)<70){t.platforms.push({type:"do",label:"This is a TV-first creative.",text:"For social, create a separate feed-first version with text overlays and faster pacing."});}

  // SOUND
  t.sound=[];
  var snd=r.sound_analysis||{};
  if((snd.sound_dependency||0)>70){
    t.sound.push({type:"warn",label:"High sound dependency ("+snd.sound_dependency+"/100).",text:"This creative relies heavily on audio. On social (80%+ sound-off), it will underperform."});
  }else{
    t.sound.push({type:"win",label:"Low sound dependency.",text:"This creative works well without audio. Ready for sound-off social environments."});
  }
  if((r.sound_off_survival||0)<50){t.sound.push({type:"fix",label:"Sound-off survival is critical ("+r.sound_off_survival+"/100).",text:"Add bold text overlays for the key message, ensure subtitles are high-contrast."});}

  // PRIVACY
  t.privacy=[];
  var priv=r.privacy_and_data_audit||{};
  if(priv.qr_code_present){t.privacy.push({type:"warn",label:"QR code detected.",text:"Ensure the QR landing page has DPDP-compliant consent before collecting personal data."});}
  if(!priv.url_cta_present&&!priv.qr_code_present&&!priv.hashtag_present){t.privacy.push({type:"fix",label:"No digital conversion path.",text:"No QR code, URL, or hashtag. Add a search CTA or 'available on...' badge to the endframe."});}
  if(priv.dpdp_compliance_risk==="high"){
    t.privacy.push({type:"warn",label:"High DPDP compliance risk.",text:"This creative contains data collection elements without visible consent. Review with legal."});
  }else{
    t.privacy.push({type:"win",label:"DPDP compliance risk is "+(priv.dpdp_compliance_risk||"low")+".",text:"No major regulatory flags detected. Standard compliance posture."});
  }
  if(!priv.regulatory_disclaimers_visible){t.privacy.push({type:"fix",label:"No regulatory disclaimers visible.",text:"If this creative makes health, financial, or comparative claims, add visible disclaimers."});}

  return t;
}

// ============================================================
// SVG HELPERS
// ============================================================
function makePath(arr,x1,x2,yT,yB){
  const s=(x2-x1)/(arr.length-1);
  return arr.map((v,i)=>`${i===0?"M":"L"}${x1+i*s},${yB-((v/100)*(yB-yT))}`).join(" ");
}
function makeArea(arr,x1,x2,yT,yB){
  return makePath(arr,x1,x2,yT,yB)+` L${x2},${yB} L${x1},${yB} Z`;
}

// ============================================================
// FRAME EXTRACTION — FIX 1: capture video duration
// ============================================================
const FILE_LIMITS={
  image:10*1024*1024,
  video:100*1024*1024,
  audio:50*1024*1024,
};

function getCreativeFormat(type,file){
  if(type==="static_image"||type==="display")return "static_image";
  if(type==="motion_static"||file?.type==="image/gif")return "motion_static";
  if(type==="audio"||file?.type?.startsWith("audio/"))return "audio";
  if(type==="text")return "text";
  return "video";
}

function formatImpactLabel(format){
  if(format==="static_image")return "attention / recall lift";
  if(format==="audio")return "recall / response lift";
  if(format==="text")return "clarity / conversion lift";
  return "completion rate improvement";
}

function validateCreativeFile(file){
  if(!file)return null;
  const isImage=file.type.startsWith("image/");
  const isVideo=file.type.startsWith("video/");
  const isAudio=file.type.startsWith("audio/");
  if(!isImage&&!isVideo&&!isAudio)return "Unsupported file type. Please upload JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, MP3, WAV, or M4A.";
  if(isImage&&file.size>FILE_LIMITS.image)return "Image creatives can be up to 10 MB. Please compress this image or export a smaller JPG/PNG/WEBP.";
  if(isVideo&&file.size>FILE_LIMITS.video)return "Video creatives can be up to 100 MB. Please upload MP4, MOV, or WEBM under 100 MB.";
  if(isAudio&&file.size>FILE_LIMITS.audio)return "Audio creatives can be up to 50 MB. Please upload MP3, WAV, M4A, or AAC under 50 MB.";
  return null;
}

function compressImageFrame(file){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const maxEdge=1280;
      const scale=Math.min(1,maxEdge/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
      const width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
      const height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
      const canvas=document.createElement("canvas");
      canvas.width=width;
      canvas.height=height;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,width,height);
      URL.revokeObjectURL(url);
      resolve({
        frames:[canvas.toDataURL("image/jpeg",0.75).split(",")[1]],
        duration:0,
        duration_seconds:0,
        video_duration:0,
        width,
        height,
        isImage:true,
        original_size:file.size,
      });
    };
    img.onerror=()=>{
      URL.revokeObjectURL(url);
      reject(new Error("Cannot read image"));
    };
    img.src=url;
  });
}

async function compressStoryboardFrames(files){
  const items=await Promise.all(files.map(file=>compressImageFrame(file)));
  const first=items[0]||{};
  return {
    frames:items.flatMap(item=>item.frames||[]),
    duration:0,
    duration_seconds:0,
    video_duration:0,
    width:first.width||0,
    height:first.height||0,
    isImage:true,
    original_size:files.reduce((sum,file)=>sum+file.size,0),
  };
}

function extractFrames(file){
  if(file.type.startsWith("image/")){
    return compressImageFrame(file);
  }
  return new Promise((resolve,reject)=>{
    const v=document.createElement("video");
    v.preload="auto";v.muted=true;
    v.src=URL.createObjectURL(file);
    v.onloadedmetadata=()=>{
      const dur=v.duration;
      // FIX 1: capture actual duration in seconds (rounded)
      const durSeconds=Math.round(dur);
      const canvas=document.createElement("canvas");
      canvas.width=320;canvas.height=180;
      const ctx=canvas.getContext("2d");
      const n=Math.min(2,Math.max(1,Math.ceil(dur/10)));
      const times=Array.from({length:n},(_,i)=>(dur/n)*i+0.3);
      const frames=[];let idx=0;
      const next=()=>{
        if(idx>=times.length){
          URL.revokeObjectURL(v.src);
          resolve({
            frames,
            duration:dur,
            duration_seconds:durSeconds,   // FIX 1: pass to API
            video_duration:durSeconds,     // FIX 1: belt and suspenders
            width:v.videoWidth,
            height:v.videoHeight,
            isImage:false
          });
          return;
        }
        v.currentTime=Math.min(times[idx],dur-0.1);
      };
      v.onseeked=()=>{
        ctx.drawImage(v,0,0,canvas.width,canvas.height);
        frames.push(canvas.toDataURL("image/jpeg",0.3).split(",")[1]);
        idx++;next();
      };
      v.onerror=()=>reject(new Error("Cannot read video"));
      next();
    };
  });
}

// ============================================================
// MAIN APP
// ============================================================
export default function App(){
  const [stage,setStage]=useState("landing");
  const [form,setForm]=useState({brand:"",client:"",campaign:"",agency:"",type:"video",industry:"FMCG / CPG",audience:"",market:"India",country:"India",notes:"",script:""});
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [progress,setProgress]=useState(0);
  const [progressMsg,setProgressMsg]=useState("");
  const [results,setResults]=useState(null);
  const [error,setError]=useState(null);
  const [tab,setTab]=useState("summary");
  const [downloading,setDownloading]=useState(false);
  const [gradeTooltipVisible,setGradeTooltipVisible]=useState(false);
  const [methTab,setMethTab]=useState("overview");
  const [expandedMethSections,setExpandedMethSections]=useState({});
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adcritiq_token") || "");
  const [showToken, setShowToken] = useState(false);
  const [credits, setCredits] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 && window.innerWidth < 1120 : false);
  const [scrolled, setScrolled] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [fileB, setFileB] = useState(null);
  const [previewB, setPreviewB] = useState(null);
  const [resultsB, setResultsB] = useState(null);
  const [labelA, setLabelA] = useState("Creative A");
  const [labelB, setLabelB] = useState("Creative B");
  const [compareTab, setCompareTab] = useState("overview");
  const [compareType, setCompareType] = useState("versions");
  const [formB, setFormB] = useState({brand:"",client:"",campaign:"",script:""});
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [productionStage, setProductionStage] = useState("final");
  const [storyboardFiles, setStoryboardFiles] = useState([]);
  const [isCompetitorAnalysis, setIsCompetitorAnalysis] = useState(false);
  const [competitorOf, setCompetitorOf] = useState("");
  const [repoMode, setRepoMode] = useState("saved");
  const [repoSearch, setRepoSearch] = useState("");
  const [repoFilterFormat, setRepoFilterFormat] = useState("");
  const [repoFilterGrade, setRepoFilterGrade] = useState("");
  const [repoFilterStage, setRepoFilterStage] = useState("");
  const [expandedRepoBrands, setExpandedRepoBrands] = useState({});
  const [expandedCompetitorBrands, setExpandedCompetitorBrands] = useState({});
  const [competitiveBrand, setCompetitiveBrand] = useState("");
  const [competitiveIntel, setCompetitiveIntel] = useState(null);
  const [competitiveIntelLoading, setCompetitiveIntelLoading] = useState(false);
  const [repoDnaData, setRepoDnaData] = useState(null);
  const [repoDnaLoading, setRepoDnaLoading] = useState(false);
  const [repoDnaBrand, setRepoDnaBrand] = useState("");
  const [dnaMatchData, setDnaMatchData] = useState(null);
  const [calibrationData, setCalibrationData] = useState(null);
  const [calibrationLoading, setCalibrationLoading] = useState(false);
  const [calibrationSaving, setCalibrationSaving] = useState(false);
  const [calibrationSummary, setCalibrationSummary] = useState(null);
  const [calibrationForm, setCalibrationForm] = useState({
    analysis_id:"",
    platform:"youtube",
    campaign_start_date:"",
    campaign_end_date:"",
    actual_vtr:"",
    actual_ctr:"",
    actual_completion_rate:"",
    actual_brand_lift:"",
    actual_aided_awareness_lift:"",
    actual_spontaneous_awareness_lift:"",
    actual_consideration_lift:"",
    actual_purchase_intent_lift:"",
    actual_sales_proxy:"",
    actual_store_visits:"",
    actual_roas:"",
    target_roas:"",
    notes:"",
  });
  const [certData, setCertData] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certVerifyData, setCertVerifyData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("adcritiq_theme") !== "light";
    } catch {
      return true;
    }
  });
  const fileRef=useRef(null);
  const storyboardRef=useRef(null);
  const C=isDarkMode?DARK_THEME:LIGHT_THEME;
  const hex=(v)=>v>=80?C.green:v>=60?C.amber:v>=40?C.orange:C.red;
  const elevationShadow="0 2px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)";
  const headerBg=isDarkMode?"rgba(5,5,7,0.9)":"rgba(255,255,255,0.86)";
  const formHeaderBg=isDarkMode?"rgba(5,5,7,0.82)":"rgba(255,255,255,0.82)";
  const resultsHeaderBg=isDarkMode?"rgba(16,16,20,0.94)":"rgba(255,255,255,0.94)";
  const miniHeaderBg=isDarkMode?"rgba(7,7,15,0.82)":"rgba(255,255,255,0.86)";

  const toggleTheme=()=>{
    setIsDarkMode(prev=>{
      const next=!prev;
      try {
        localStorage.setItem("adcritiq_theme",next?"dark":"light");
      } catch {}
      return next;
    });
  };

  const ThemeToggle=(
    <button
      onClick={toggleTheme}
      title={isDarkMode?"Switch to Light Mode":"Switch to Dark Mode"}
      style={{
        background:"transparent",
        border:`1px solid ${C.border2}`,
        borderRadius:8,
        padding:"6px 10px",
        cursor:"pointer",
        fontSize:14,
        lineHeight:1,
        color:C.dim,
        transition:"all 0.15s ease",
        display:"flex",
        alignItems:"center",
        gap:5,
        whiteSpace:"nowrap",
      }}
      onMouseEnter={e=>{
        e.currentTarget.style.borderColor=C.gold+"66";
        e.currentTarget.style.color=C.text;
      }}
      onMouseLeave={e=>{
        e.currentTarget.style.borderColor=C.border2;
        e.currentTarget.style.color=C.dim;
      }}
    >
      {isDarkMode?"☀️":"🌙"}
      <span style={{fontSize:10,fontFamily:"monospace",letterSpacing:"0.06em",display:isMobile?"none":"inline"}}>
        {isDarkMode?"LIGHT":"DARK"}
      </span>
    </button>
  );

  useEffect(()=>{
    const syncViewport=()=>{
      const w=window.innerWidth;
      setIsMobile(w<768);
      setIsTablet(w>=768&&w<1120);
    };
    syncViewport();
    window.addEventListener("resize",syncViewport);
    return()=>window.removeEventListener("resize",syncViewport);
  },[]);

  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>180);
    window.addEventListener("scroll",onScroll,{passive:true});
    onScroll();
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(()=>{
    document.body.style.background=C.bg;
    document.body.style.color=C.text;
  },[isDarkMode]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const certParam=params.get("cert");
    if(!certParam||!certParam.startsWith("ACI-"))return;
    setCertVerifyData({loading:true,cert_id:certParam});
    (async()=>{
      try{
        const resp=await fetch(`/api/verify-certificate?cert_id=${encodeURIComponent(certParam)}`);
        const data=await resp.json();
        setCertVerifyData(resp.ok&&data.valid?data:{valid:false,cert_id:certParam});
      }catch{
        setCertVerifyData({valid:false,cert_id:certParam});
      }
    })();
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const shareParam=params.get("share");
    if(!shareParam)return;
    window.history.replaceState({},"","/");
    (async()=>{
      try{
        const resp=await fetch(`/api/get-shared-report?token=${encodeURIComponent(shareParam)}`);
        const data=await resp.json();
        if(!resp.ok||!data.found||!data.results)return;
        const combined={
          ...data.results,
          scenes:data.results.scenes||[],
          strategic_insights:data.results.strategic_insights||[],
          cmo_actions:data.results.cmo_actions||[],
        };
        setForm(prev=>({
          ...prev,
          brand:data.metadata?.brand||"",
          client:data.metadata?.client||"",
          campaign:data.metadata?.campaign||"",
          agency:data.metadata?.agency||"",
          industry:data.metadata?.industry||prev.industry||"FMCG / CPG",
          country:data.metadata?.country||prev.country||"India",
          market:data.metadata?.market||prev.market||"India",
          type:data.metadata?.type||combined.creative_format||"video",
        }));
        setResults(combined);
        setProductionStage(combined.production_stage||"final");
        setStoryboardFiles([]);
        setShareToken(shareParam);
        setIsSharedMode(true);
        setIsDemoMode(false);
        setCompareMode(false);
        setResultsB(null);
        setStage("results");
        setTab("summary");
      }catch(err){
        console.error("Shared report load failed:",err);
      }
    })();
  },[]);

  useEffect(()=>{
    const savedId=results?.__savedAnalysisId||results?.id;
    if(!savedId||!token.trim()||stage!=="results"){
      setCalibrationSummary(null);
      return;
    }
    let cancelled=false;
    (async()=>{
      try{
        const params=new URLSearchParams();
        params.set("token",token.trim());
        params.set("analysis_id",savedId);
        const resp=await fetch(`/api/get-outcome-calibrations?${params.toString()}`);
        const data=await resp.json();
        if(!cancelled&&resp.ok&&data.success!==false&&Array.isArray(data.calibrations)&&data.calibrations.length){
          setCalibrationSummary(data);
        }else if(!cancelled){
          setCalibrationSummary(null);
        }
      }catch{
        if(!cancelled)setCalibrationSummary(null);
      }
    })();
    return()=>{cancelled=true;};
  },[results?.__savedAnalysisId,results?.id,token,stage]);

  const handleFile=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const fileError=validateCreativeFile(f);
    if(fileError){setError(fileError);e.target.value="";return;}
    setError(null);
    setFile(f);
    if(f.type.startsWith("image/")){
      const r=new FileReader();
      r.onload=ev=>setPreview(ev.target.result);
      r.readAsDataURL(f);
    }else if(f.type.startsWith("video/")){
      setPreview(URL.createObjectURL(f));
    }else if(f.type.startsWith("audio/")){
      setPreview(f.name);
    }
  };
  const handleFileB=(e)=>{
    const f=e.target.files[0];if(!f)return;
    const fileError=validateCreativeFile(f);
    if(fileError){setError(fileError);e.target.value="";return;}
    setError(null);
    setFileB(f);
    if(f.type.startsWith("image/")){
      const r=new FileReader();
      r.onload=ev=>setPreviewB(ev.target.result);
      r.readAsDataURL(f);
    }else if(f.type.startsWith("video/")){
      setPreviewB(URL.createObjectURL(f));
    }else if(f.type.startsWith("audio/")){
      setPreviewB(f.name);
    }else{
      setPreviewB(f.name);
    }
  };
  const handleStoryboardFiles=(e)=>{
    const selected=Array.from(e.target.files||[]);
    if(!selected.length)return;
    const imageFiles=selected.filter(f=>f.type.startsWith("image/"));
    if(imageFiles.length!==selected.length){
      setError("Storyboard frames must be image files.");
      e.target.value="";
      return;
    }
    const fileError=imageFiles.map(validateCreativeFile).find(Boolean);
    if(fileError){
      setError(fileError);
      e.target.value="";
      return;
    }
    setError(null);
    setStoryboardFiles(prev=>[...prev,...imageFiles].slice(0,12));
    e.target.value="";
  };
  const removeStoryboardFile=(idx)=>{
    setStoryboardFiles(prev=>prev.filter((_,i)=>i!==idx));
  };
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const loadDnaMatchForResult=useCallback(async(currentResult,brand,isCompetitor)=>{
    if(!brand?.trim()||isCompetitor){
      setDnaMatchData(null);
      return;
    }
    try{
      const resp=await fetch(`/api/get-brand-dna?brand=${encodeURIComponent(brand.trim())}`);
      const data=await resp.json();
      if(!resp.ok||data.success===false||!data.ready){
        setDnaMatchData(null);
        return;
      }
      const match=computeDnaMatch(currentResult,data);
      setDnaMatchData(match);
    }catch{
      setDnaMatchData(null);
    }
  },[]);

  const handleAnalyze=useCallback(async()=>{
    const creativeFormat=productionStage==="concept"?"text":getCreativeFormat(form.type,file);
    const missingFields = [];
    if(!form.brand.trim()) missingFields.push("Brand Name");
    if(!form.country) missingFields.push("Country");
    if(!form.industry) missingFields.push("Industry Vertical");
    if(!form.type) missingFields.push("Creative Type");
    if(isCompetitorAnalysis&&!competitorOf.trim()) missingFields.push("This is a competitor of");
    if(productionStage==="concept"&&form.script.trim().length<100) missingFields.push("Concept / Script (minimum 100 characters)");
    if(productionStage==="storyboard"&&storyboardFiles.length<2) missingFields.push("Storyboard Frames (minimum 2)");
    if(productionStage==="roughcut"&&(!file||!file.type.startsWith("video/"))) missingFields.push("Rough Cut Video File");
    if(productionStage==="final"&&creativeFormat!=="text"&&!file) missingFields.push("Creative File");
    if(productionStage==="final"&&creativeFormat==="text"&&!form.script.trim()) missingFields.push("Text / Script");
    if(creativeFormat==="audio"&&!form.script.trim()) missingFields.push("Audio Transcript / Script");
    if((productionStage==="concept"||productionStage==="storyboard")&&compareMode) missingFields.push("Turn off comparison for concept/storyboard analysis");
    if(compareMode && creativeFormat!=="text" && creativeFormat!=="audio" && !fileB) missingFields.push("Creative B File");
    if(compareMode && (creativeFormat==="text"||creativeFormat==="audio") && !formB.script.trim()) missingFields.push("Creative B Text / Transcript");
    if(missingFields.length > 0){
      setError(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }
    if(compareMode && compareType==="brands" && !formB.brand.trim()){
      setError("Please enter Brand B name for comparison.");
      return;
    }
    const fileError=file?validateCreativeFile(file):null;
    if(fileError){setError(fileError);return;}
    const storyboardError=storyboardFiles.map(validateCreativeFile).find(Boolean);
    if(storyboardError){setError(storyboardError);return;}
    if(compareMode&&fileB){
      const fileBError=validateCreativeFile(fileB);
      if(fileBError){setError(`Creative B: ${fileBError}`);return;}
    }
    if (!token.trim()) {
      setError("Please enter your analysis token. Don't have one? Click 'Buy credits' above.");
      return;
    }
    setError(null);

    let creditData;
    try {
      const creditRes = await fetch("/api/check-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() })
      });
      creditData = await creditRes.json();
    } catch {
      setError("Could not verify token. Please check your connection and try again.");
      return;
    }

    if (!creditData.valid) {
      setError(creditData.error || "Invalid token. Please check or purchase credits.");
      setShowPricing(true);
      return;
    }
    if(compareMode && !creditData.bypass && creditData.credits < 2){
      setError(`Comparison mode requires 2 credits. You have ${creditData.credits}. Please purchase more.`);
      setShowPricing(true);
      return;
    }
    setCredits(creditData.credits);
    setStage("analyzing");setProgress(0);setError(null);

    try{
      setProgressMsg("Reading creative file...");setProgress(5);
      const frameData=productionStage==="storyboard"
        ? await compressStoryboardFrames(storyboardFiles)
        : creativeFormat==="text"||creativeFormat==="audio"||productionStage==="concept"
        ? {frames:[],duration:0,duration_seconds:0,video_duration:0,width:0,height:0,isImage:false,original_size:file?.size||0}
        : await extractFrames(file);
      // FIX 1: duration_seconds and video_duration are now in frameData
      const payload={
        frames:frameData.frames,
        metadata:{
          ...form,
          token:token.trim(),
          production_stage:productionStage,
          frame_count:productionStage==="storyboard"?storyboardFiles.length:undefined,
          script_text:(form.script||"").slice(0,8000),
          creative_format:creativeFormat,
          creative_subtype:form.type,
          script:form.script,
          is_competitor:isCompetitorAnalysis,
          competitor_of:isCompetitorAnalysis?competitorOf.trim():null,
          isStatic:creativeFormat==="static_image"||productionStage==="storyboard",
          duration:frameData.duration,
          duration_seconds:frameData.duration_seconds,
          video_duration:frameData.video_duration,
          width:frameData.width,
          height:frameData.height,
          isImage:frameData.isImage,
          original_size:frameData.original_size||file?.size||0,
        }
      };

      setProgressMsg("Extracting visual signals...");setProgress(12);

      const fastPromise=fetch("/api/analyze-fast",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });

      const richPromise=fetch("/api/analyze-rich",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });

      const progressMsgs=[
        [20,"Mapping neural activation zones..."],
        [32,"Scoring 17 performance metrics..."],
        [44,"Running platform-specific predictions..."],
        [56,"Auditing privacy & compliance signals..."],
        [66,"Building scene-level intelligence..."],
        [76,"Generating strategic insights..."],
        [86,"Writing CMO playbook..."],
        [93,"Assembling final report..."],
      ];
      let msgIdx=0;
      const ticker=setInterval(()=>{
        if(msgIdx<progressMsgs.length){
          setProgress(progressMsgs[msgIdx][0]);
          setProgressMsg(progressMsgs[msgIdx][1]);
          msgIdx++;
        }
      },1800);

      let fastData, richData;
      try{
        const fastResp=await fastPromise;
        const fastText=await fastResp.text();
        let fd;
        try{fd=JSON.parse(fastText);}catch(e){throw new Error("Fast analysis failed: "+fastText.substring(0,100));}
        if(!fastResp.ok||!fd.success){
          const rawError=fd.error||"Metrics analysis failed";
          const friendly=String(rawError).includes("FUNCTION_PAYLOAD_TOO_LARGE")||String(rawError).includes("Request Entity Too Large")
            ? "This creative was too large to send for analysis. We compress images automatically; for videos, upload MP4/MOV/WEBM under 100 MB."
            : rawError;
          throw new Error(friendly);
        }
        fastData=fd.analysis;
        setProgressMsg("Metrics computed. Generating insights...");setProgress(72);

        try{
          const richResp=await richPromise;
          const richText=await richResp.text();
          let rd;
          try{rd=JSON.parse(richText);}catch(e){ rd=null; }
          if(richResp.ok&&rd?.success){
            richData=rd.richData;
          }else{
            console.warn("Rich analysis failed, showing metrics only:", rd?.error||"timeout");
          }
        }catch(richErr){
          console.warn("Rich analysis timed out, showing metrics only");
        }
      }finally{
        clearInterval(ticker);
      }

      const combined={
        ...fastData,
        creative_format:creativeFormat,
        creative_subtype:form.type,
        production_stage:productionStage,
        is_competitor:isCompetitorAnalysis,
        competitor_of:isCompetitorAnalysis?competitorOf.trim():null,
        scenes: richData?.scenes||fastData?.scenes||[],
        strategic_insights: richData?.strategic_insights||fastData?.strategic_insights||[],
        cmo_actions: richData?.cmo_actions||fastData?.cmo_actions||[],
      };

      setProgress(100);setProgressMsg("Report ready.");
      await new Promise(r=>setTimeout(r,400));
      setResults(combined);
      setCertData(null);
      setShowCertModal(false);
      loadDnaMatchForResult(combined,form.brand,isCompetitorAnalysis);
      if (token.trim()) {
        fetch("/api/deduct-credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.trim() })
        })
          .then(r => r.json())
          .then(d => { if (d.credits_remaining !== undefined) setCredits(d.credits_remaining); })
          .catch(() => {});
      }
      if(compareMode && (fileB||creativeFormat==="text"||creativeFormat==="audio")){
        setProgress(10);
        setProgressMsg("Creative A complete. Analysing Creative B...");
        const B_TIMEOUT_MS=180000;
        await Promise.race([
          (async()=>{
          const formatB=getCreativeFormat(form.type,fileB);
          const framesB=formatB==="text"||formatB==="audio"
            ? {frames:[],duration:0,duration_seconds:0,video_duration:0,width:0,height:0,isImage:false,original_size:fileB?.size||0}
            : await extractFrames(fileB);
          const payloadB={
            frames:framesB.frames,
            metadata:{
              brand:compareType==="brands"?(formB.brand||labelB):form.brand,
              token:token.trim(),
              client:compareType==="brands"?formB.client:form.client,
              campaign:compareType==="brands"?formB.campaign:form.campaign,
              agency:form.agency,
              type:form.type||"video",
              creative_format:formatB,
              creative_subtype:form.type,
              industry:form.industry,
              country:form.country,
              market:form.market,
              audience:form.audience,
              notes:form.notes,
              script:(formatB==="text"||formatB==="audio")?formB.script:form.script,
              script_text:((formatB==="text"||formatB==="audio")?formB.script:form.script||"").slice(0,8000),
              production_stage:productionStage,
              isStatic:formatB==="static_image",
              duration:framesB.duration,
              duration_seconds:framesB.duration_seconds||framesB.duration||30,
              video_duration:framesB.video_duration||framesB.duration||30,
              width:framesB.width,
              height:framesB.height,
              isImage:framesB.isImage,
              original_size:framesB.original_size||fileB?.size||0
            }
          };
          const respB=await fetch("/api/analyze-fast",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payloadB)
          });
          const dataB=await respB.json();
          if(!respB.ok||dataB?.error){
            const rawError=dataB?.error||"Creative B analysis failed";
            throw new Error(String(rawError).includes("FUNCTION_PAYLOAD_TOO_LARGE")||String(rawError).includes("Request Entity Too Large")
              ? "This creative was too large to send for analysis. We compress images automatically; for videos, upload MP4/MOV/WEBM under 100 MB."
              : rawError);
          }
          if(dataB&&!dataB.error){
            const fastDataB=dataB.analysis||dataB.result||dataB;
            const combinedB={
              ...fastDataB,
              creative_format:formatB,
              creative_subtype:form.type,
              production_stage:productionStage,
              scenes:fastDataB?.scenes||[],
              strategic_insights:fastDataB?.strategic_insights||[],
              cmo_actions:fastDataB?.cmo_actions||[],
            };
            setResultsB(combinedB);
            if(token.trim()){
              fetch("/api/deduct-credit",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({token:token.trim()})
              })
                .then(r=>r.json())
                .then(d=>{if(d.credits_remaining!==undefined)setCredits(d.credits_remaining);})
                .catch(()=>{});
            }
          }
          })(),
          new Promise((_,rej)=>setTimeout(()=>rej(new Error("B_TIMEOUT")),B_TIMEOUT_MS))
        ]).catch(err=>{
          if(err.message==="B_TIMEOUT"){
            setProgressMsg("Creative B took too long. Showing Creative A results.");
          }else{
            console.error("Creative B error:",err.message);
          }
        });
      }
      setStage("results");setTab("summary");

    }catch(e){setError(e.message);setStage("form");}
  },[file,fileB,form,token,compareMode,compareType,formB,labelB,productionStage,storyboardFiles,isCompetitorAnalysis,competitorOf,loadDnaMatchForResult]);

  const cleanResultForSave=(source)=>{
    const clean={};
    Object.entries(source||{}).forEach(([k,v])=>{ if(!k.startsWith("__")) clean[k]=v; });
    return clean;
  };

  const saveCurrentAnalysis=async()=>{
    if(!results)return;
    if(isDemoMode||isSharedMode)return;
    const fullResult=cleanResultForSave(results);
    setResults(p=>({...p,__saveStatus:"saving",__saveError:""}));
    try{
      const resp=await fetch("/api/save-analysis",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          brand:form.brand,
          client:form.client,
          campaign:form.campaign,
          agency:form.agency,
          industry:form.industry,
          market:form.market,
          country:form.country,
          token:token.trim(),
          is_competitor:fullResult.is_competitor===true||isCompetitorAnalysis,
          competitor_of:fullResult.competitor_of||(isCompetitorAnalysis?competitorOf.trim():null),
          creative_type:fullResult.creative_format||getCreativeFormat(form.type,file),
          overall_grade:fullResult.overall_grade,
          headline_verdict:fullResult.headline_verdict,
          viral_potential:fullResult.viral_potential,
          hook_strength:fullResult.hook_strength,
          hold_rate:fullResult.hold_rate,
          emotional_peak:fullResult.emotional_peak,
          brand_recall:fullResult.brand_recall,
          memory_encoding:fullResult.memory_encoding,
          sound_off_survival:fullResult.sound_off_survival,
          share_intent:fullResult.share_intent,
          creative_efficiency:fullResult.creative_efficiency,
          cultural_resonance:fullResult.cultural_resonance,
          full_result:fullResult
        })
      });
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Save failed");
      setResults(p=>({...p,__saveStatus:"saved",__saveError:"",__savedAnalysisId:data.id}));
      if(data.id)setCalibrationForm(prev=>({...prev,analysis_id:data.id}));
      setTimeout(()=>setResults(p=>{
        if(!p||p.__saveStatus!=="saved")return p;
        const next={...p};delete next.__saveStatus;return next;
      }),3000);
    }catch(e){
      setResults(p=>({...p,__saveStatus:"error",__saveError:e.message}));
    }
  };

  const handleLoadDemo=async()=>{
    setDemoLoading(true);
    setError(null);
    try{
      const resp=await fetch("/api/get-analyses?limit=1&order=created_at.desc");
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Could not load sample report.");
      const saved=(data.analyses||[])[0];
      if(!saved||!saved.full_result)throw new Error("No saved sample report is available yet.");
      const fullResult=typeof saved.full_result==="string"?JSON.parse(saved.full_result):saved.full_result;
      const cleanResult=cleanResultForSave(fullResult||{});
      const creativeType=saved.creative_type||cleanResult.creative_subtype||cleanResult.creative_format||"video";
      setForm(p=>({
        ...p,
        brand:saved.brand||p.brand||"Sample Brand",
        client:saved.client||"",
        campaign:saved.campaign||"",
        agency:saved.agency||"",
        industry:saved.industry||p.industry||"FMCG / CPG",
        market:saved.market||p.market||"India",
        country:saved.country||p.country||"India",
        type:creativeType,
        notes:p.notes||"",
        script:p.script||"",
      }));
      setCompareMode(false);
      setFile(null);
      setPreview(null);
      setFileB(null);
      setPreviewB(null);
      setResultsB(null);
      setLabelA("Creative A");
      setLabelB("Creative B");
      setCompareTab("overview");
      setCompareType("versions");
      setFormB({brand:"",client:"",campaign:"",script:""});
      setResults({...cleanResult,creative_format:cleanResult.creative_format||creativeType});
      setDnaMatchData(null);
      setCertData(null);
      setShowCertModal(false);
      setProductionStage(cleanResult.production_stage||"final");
      setStoryboardFiles([]);
      setIsDemoMode(true);
      setIsSharedMode(false);
      setShareToken(null);
      setShareUrl("");
      setShowShareModal(false);
      setShareCopied(false);
      setStage("results");
      setTab("summary");
    }catch(e){
      setError(e.message);
      setStage("form");
    }finally{
      setDemoLoading(false);
    }
  };

  const handleShareReport=async()=>{
    if(shareLoading||!results||isSharedMode||isDemoMode)return;
    setShareLoading(true);
    setShowShareModal(false);
    setShareCopied(false);
    try{
      const resp=await fetch("/api/create-share-token",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          results:cleanResultForSave(results),
          metadata:{
            brand:form.brand,
            client:form.client,
            campaign:form.campaign,
            agency:form.agency,
            industry:form.industry,
            country:form.country,
            market:form.market,
            type:form.type,
          },
        }),
      });
      const data=await resp.json();
      if(!resp.ok||!data.token)throw new Error(data.error||"Token generation failed");
      const url=`${window.location.origin}/?share=${data.token}`;
      setShareToken(data.token);
      setShareUrl(url);
      setShowShareModal(true);
    }catch(err){
      alert("Could not generate share link: "+err.message);
    }finally{
      setShareLoading(false);
    }
  };

  const loadRepository=async(filters={})=>{
    setRepoLoading(true);
    try{
      const params=new URLSearchParams();
      if(filters.brand)params.set("brand",filters.brand);
      if(filters.grade)params.set("grade",filters.grade);
      const resp=await fetch(`/api/get-analyses?${params.toString()}`);
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Failed to load repository");
      setSavedAnalyses(data.analyses||[]);
    }catch(e){
      alert("Repository load failed: "+e.message);
    }finally{
      setRepoLoading(false);
    }
  };

  const loadCompetitiveIntel=async(brandOverride)=>{
    const brand=(brandOverride||competitiveBrand||competitorOf||form.brand||"").trim();
    if(!brand){
      alert("Enter your own brand name to load competitive intelligence.");
      return;
    }
    setCompetitiveBrand(brand);
    setCompetitiveIntelLoading(true);
    try{
      const resp=await fetch(`/api/get-competitive-intel?brand=${encodeURIComponent(brand)}`);
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Failed to load competitive intelligence");
      setCompetitiveIntel(data);
    }catch(e){
      alert("Competitive intelligence load failed: "+e.message);
    }finally{
      setCompetitiveIntelLoading(false);
    }
  };

  const loadBrandDna=async(brandOverride)=>{
    const brand=(brandOverride||repoDnaBrand||form.brand||"").trim();
    if(!brand){
      alert("Enter your brand name to load Brand DNA.");
      return;
    }
    setRepoDnaBrand(brand);
    setRepoDnaLoading(true);
    try{
      const resp=await fetch(`/api/get-brand-dna?brand=${encodeURIComponent(brand)}`);
      const data=await resp.json();
      if(!resp.ok||data.success===false)throw new Error(data.error||"Failed to load Brand DNA");
      setRepoDnaData(data);
    }catch(e){
      alert("Brand DNA load failed: "+e.message);
    }finally{
      setRepoDnaLoading(false);
    }
  };

  const loadOutcomeCalibrations=async(filters={})=>{
    if(!token.trim()){
      setCalibrationData(null);
      return null;
    }
    setCalibrationLoading(true);
    try{
      const params=new URLSearchParams();
      params.set("token",token.trim());
      if(filters.brand)params.set("brand",filters.brand);
      if(filters.analysis_id)params.set("analysis_id",filters.analysis_id);
      if(filters.platform)params.set("platform",filters.platform);
      if(filters.creative_type)params.set("creative_type",filters.creative_type);
      if(filters.industry)params.set("industry",filters.industry);
      const resp=await fetch(`/api/get-outcome-calibrations?${params.toString()}`);
      const data=await resp.json();
      if(!resp.ok||data.success===false)throw new Error(data.error||"Failed to load calibrations");
      setCalibrationData(data);
      return data;
    }catch(e){
      alert("Outcome calibration load failed: "+e.message);
      return null;
    }finally{
      setCalibrationLoading(false);
    }
  };

  const saveOutcomeCalibration=async()=>{
    if(!token.trim()){
      alert("Enter your analysis token above to access your private calibration data.");
      return;
    }
    const analysisId=(calibrationForm.analysis_id||results?.__savedAnalysisId||"").trim();
    if(!analysisId){
      alert("Select or enter a saved analysis ID before saving calibration.");
      return;
    }
    if(!calibrationForm.platform){
      alert("Select a platform before saving calibration.");
      return;
    }
    setCalibrationSaving(true);
    try{
      const resp=await fetch("/api/save-outcome-calibration",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          ...calibrationForm,
          analysis_id:analysisId,
          token:token.trim(),
          brand:form.brand||results?.brand||"",
          campaign:form.campaign||"",
          industry:form.industry||"",
          country:form.country||"",
          market:form.market||"",
          creative_type:results?.creative_format||form.type||"",
        })
      });
      const data=await resp.json();
      if(!resp.ok||data.success===false)throw new Error(data.error||"Failed to save calibration");
      setCalibrationForm(prev=>({...prev,analysis_id:analysisId}));
      await loadOutcomeCalibrations({analysis_id:analysisId});
      alert("Outcome calibration saved.");
    }catch(e){
      alert("Outcome calibration save failed: "+e.message);
    }finally{
      setCalibrationSaving(false);
    }
  };

  const certificateUrl=(certId)=>`https://adcritiq.com/?cert=${encodeURIComponent(certId||"")}`;

  const copyCertificateLink=async(certId)=>{
    if(!certId)return;
    try{
      await navigator.clipboard.writeText(certificateUrl(certId));
      setShareCopied(true);
      setTimeout(()=>setShareCopied(false),1800);
    }catch{
      alert("Could not copy link. Please copy it manually: "+certificateUrl(certId));
    }
  };

  const openLinkedInCertificateShare=(certId)=>{
    if(!certId)return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl(certId))}`,"_blank","noopener,noreferrer");
  };

  const openCertificateFromId=async(certId)=>{
    if(!certId)return;
    setCertLoading(true);
    try{
      const resp=await fetch(`/api/verify-certificate?cert_id=${encodeURIComponent(certId)}`);
      const data=await resp.json();
      if(!resp.ok||!data.valid)throw new Error(data.error||"Certificate not found");
      setCertData({certified:true,...data});
      setShowCertModal(true);
    }catch(e){
      alert("Certificate load failed: "+e.message);
    }finally{
      setCertLoading(false);
    }
  };

  const issueCertificate=async()=>{
    const analysisId=results?.__savedAnalysisId||results?.id;
    if(!analysisId){
      alert("Save this analysis to Repository before issuing a certificate.");
      return;
    }
    setCertLoading(true);
    try{
      const resp=await fetch("/api/issue-certificate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({analysis_id:analysisId})
      });
      const data=await resp.json();
      if(!resp.ok||data.success===false)throw new Error(data.error||"Certificate issue failed");
      setCertData(data);
      if(data.certified){
        setResults(p=>p?({...p,is_certified:true,cert_id:data.cert_id,cert_issued_at:data.cert_issued_at}):p);
        setShowCertModal(true);
      }
    }catch(e){
      alert("Certificate issue failed: "+e.message);
    }finally{
      setCertLoading(false);
    }
  };

  const deleteSavedAnalysis=async(id)=>{
    if(!confirm("Delete this analysis? This cannot be undone."))return;
    try{
      const resp=await fetch(`/api/delete-analysis?id=${encodeURIComponent(id)}`,{method:"DELETE"});
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Delete failed");
      setSavedAnalyses(p=>p.filter(a=>a.id!==id));
    }catch(e){
      alert("Delete failed: "+e.message);
    }
  };

  const setDashboardTab=(next)=>{
    setTab(next);
    if(next==="repository"){
      loadRepository();
      if(!competitiveBrand){
        setCompetitiveBrand(competitorOf||form.brand||"");
      }
      if(!repoDnaBrand){
        setRepoDnaBrand(form.brand||"");
      }
    }
  };

  const toggleMethSection=(key)=>{
    setExpandedMethSections(prev=>({
      ...prev,
      [key]:!prev[key]
    }));
  };

  const resetToForm=()=>{
    setStage("form");
    setResults(null);
    setDnaMatchData(null);
    setCalibrationSummary(null);
    setCertData(null);
    setShowCertModal(false);
    setFile(null);
    setPreview(null);
    setToken("");
    setCredits(null);
    setShowToken(false);
    setCompareMode(false);
    setFileB(null);
    setPreviewB(null);
    setResultsB(null);
    setLabelA("Creative A");
    setLabelB("Creative B");
    setCompareTab("overview");
    setCompareType("versions");
    setFormB({brand:"",client:"",campaign:"",script:""});
    setProductionStage("final");
    setStoryboardFiles([]);
    setExpandedMethSections({});
    setIsDemoMode(false);
    setDemoLoading(false);
    setIsSharedMode(false);
    setShareToken(null);
    setShareUrl("");
    setShowShareModal(false);
    setShareLoading(false);
    setShareCopied(false);
    setIsCompetitorAnalysis(false);
    setCompetitorOf("");
    setRepoMode("saved");
    setCompetitiveBrand("");
    setCompetitiveIntel(null);
    setCompetitiveIntelLoading(false);
    setRepoDnaData(null);
    setRepoDnaLoading(false);
    setRepoDnaBrand("");
    localStorage.removeItem("adcritiq_token");
  };

  const formatCertDate=(date)=>{
    if(!date)return "—";
    return new Date(date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  };
  const renderCertificateCard=(data,options={})=>{
    const scores=data?.key_scores||{};
    const certGrade=data?.grade||data?.overall_grade||"—";
    const gradeColor=certGrade==="A+"||certGrade==="A"?C.green:certGrade==="A-"||certGrade==="B+"?C.gold:C.amber;
    return(
      <div className="adcritiq-cert-print" style={{width:"100%",maxWidth:540,boxSizing:"border-box",padding:isMobile?24:40,background:"#0A0A18",border:`2px solid ${C.gold}`,borderRadius:12,boxShadow:"0 22px 70px rgba(0,0,0,0.45)",color:"#F8F6EA"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:4,fontWeight:900}}>ADCRITIQ™</div>
          <div style={{fontSize:9,color:"#8B88A8",fontFamily:"'DM Mono',monospace",letterSpacing:2,marginTop:5}}>NEURAL CREATIVE INTELLIGENCE</div>
        </div>
        <div style={{height:1,background:C.gold,opacity:0.4,margin:"16px 0"}}/>
        <div style={{textAlign:"center",fontSize:22,color:C.gold,fontWeight:900,letterSpacing:3,marginBottom:10}}>CERTIFIED CREATIVE</div>
        <div style={{fontSize:11,color:"#A8A5C4",textAlign:"center",fontStyle:"italic",lineHeight:1.7,maxWidth:380,margin:"0 auto 22px"}}>
          This creative has been independently verified against 17 neural dimensions and meets AdCritIQ™ certification standards.
        </div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:20,color:"#FFFFFF",fontWeight:900,marginBottom:6}}>{data?.brand||"Certified Brand"}</div>
          <div style={{fontSize:13,color:"#A8A5C4",marginBottom:12}}>{data?.campaign||"Certified Campaign"}</div>
          <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
            {[data?.industry,data?.creative_type].filter(Boolean).map(label=>(
              <span key={label} style={{fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 8px",borderRadius:5,border:`1px solid ${C.gold}44`,background:"rgba(245,166,35,0.08)"}}>{String(label).replace(/_/g," ")}</span>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"150px 1fr",gap:18,alignItems:"center",marginBottom:24}}>
          <div style={{display:"grid",justifyItems:"center",gap:8}}>
            <div style={{width:92,height:92,borderRadius:"50%",border:`3px solid ${gradeColor}`,display:"grid",placeItems:"center",fontSize:34,fontWeight:900,color:gradeColor,boxShadow:`0 0 24px ${gradeColor}55`}}>{certGrade}</div>
            <div style={{fontSize:9,color:"#8B88A8",fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em"}}>NEURAL GRADE</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {CERT_SCORE_KEYS.map(([label,key])=>(
              <div key={key} style={{padding:"10px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:8,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>{label}</div>
                <div style={{fontSize:16,color:"#FFFFFF",fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{scores[key]??"—"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{height:1,background:C.gold,opacity:0.4,margin:"16px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",gap:18,flexWrap:"wrap",marginBottom:18}}>
          <div>
            <div style={{fontSize:8,color:"#8B88A8",fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginBottom:5}}>CERTIFICATE ID</div>
            <div style={{fontSize:12,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{data?.cert_id||"—"}</div>
          </div>
          <div style={{textAlign:isMobile?"left":"right"}}>
            <div style={{fontSize:8,color:"#8B88A8",fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginBottom:5}}>ISSUED</div>
            <div style={{fontSize:12,color:"#FFFFFF",fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{formatCertDate(data?.cert_issued_at)}</div>
          </div>
        </div>
        <div style={{textAlign:"center",fontSize:9,color:C.gold,opacity:0.42,fontFamily:"'DM Mono',monospace",letterSpacing:2,lineHeight:1.6}}>
          VERIFY AT ADCRITIQ.COM · JUST THE SIGNAL BEFORE THE SPEND.
        </div>
        {options.readOnly&&(
          <div style={{marginTop:18,textAlign:"center",fontSize:11,color:"#A8A5C4",lineHeight:1.6}}>
            This certificate is a public authenticity snapshot. Full analysis data remains private.
          </div>
        )}
      </div>
    );
  };

  const pricingModal = showPricing && (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,padding:32,maxWidth:460,width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontSize:20,fontWeight:800,color:C.text}}>Buy Analysis Credits</div>
          <div style={{cursor:"pointer",color:C.dim,fontSize:22,lineHeight:1}} onClick={()=>setShowPricing(false)}>✕</div>
        </div>

        {[
          { plan:"single", label:"Single Analysis", credits:1, price:"₹299", note:"One-off creative check" },
          { plan:"starter", label:"Starter Pack", credits:5, price:"₹999", note:"₹200 per analysis" },
          { plan:"growth", label:"Growth Pack", credits:10, price:"₹1,799", note:"₹180 per analysis — most popular" },
        ].map(p=>(
          <div key={p.plan}
            style={{
              border:`1px solid ${p.plan==="growth"?C.gold:C.border}`,
              borderRadius:12,
              padding:"14px 16px",
              marginBottom:10,
              cursor:"pointer",
              background:p.plan==="growth"?"rgba(245,158,11,0.05)":C.s2
            }}
            onClick={async()=>{
              if(!window.Razorpay){
                alert("Payment system still loading. Please wait a moment and try again.");
                return;
              }
              const email=prompt("Enter your email address to receive your token:");
              if(!email||!email.trim())return;
              try{
                const orderRes=await fetch("/api/create-order",{
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({plan:p.plan})
                });
                const orderData=await orderRes.json();
                if(!orderData.order_id)throw new Error(orderData.error||"Could not create order");

                const rzp=new window.Razorpay({
                  key:import.meta.env.VITE_RAZORPAY_KEY_ID,
                  amount:orderData.amount,
                  currency:"INR",
                  name:"AdCritIQ™",
                  description:p.label,
                  order_id:orderData.order_id,
                  handler:async function(response){
                    try{
                      const verifyRes=await fetch("/api/verify-payment",{
                        method:"POST",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({
                          ...response,
                          plan:p.plan,
                          email:email.trim(),
                          amount:orderData.amount
                        })
                      });
                      const verifyData=await verifyRes.json();
                      if(verifyData.token){
                        setToken(verifyData.token);
                        setCredits(verifyData.credits);
                        localStorage.setItem("adcritiq_token",verifyData.token);
                        setShowPricing(false);
                        alert(`✅ Payment successful!\n\nYour AdCritIQ™ Token:\n${verifyData.token}\n\nCredits: ${verifyData.credits}\n\n⚠️ Save this token — you need it for every analysis.\nIt has been auto-filled in the form.`);
                      }else{
                        alert("Payment received but token generation failed.\nContact support@adcritiq.com with your payment ID: "+response.razorpay_payment_id);
                      }
                    }catch(e){
                      alert("Verification error: "+e.message+"\nContact support@adcritiq.com");
                    }
                  },
                  prefill:{email:email.trim()},
                  theme:{color:"#F59E0B"},
                  modal:{confirm_close:true}
                });
                rzp.open();
              }catch(e){
                alert("Could not initiate payment: "+e.message);
              }
            }}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:C.text,fontSize:15}}>{p.label}</div>
                <div style={{fontSize:12,color:C.dim,marginTop:3}}>{p.note}</div>
              </div>
              <div style={{textAlign:"right",marginLeft:16}}>
                <div style={{fontWeight:800,fontSize:18,color:p.plan==="growth"?C.gold:C.text}}>{p.price}</div>
                <div style={{fontSize:11,color:C.dim}}>{p.credits} credit{p.credits>1?"s":""}</div>
              </div>
            </div>
          </div>
        ))}

        <div style={{fontSize:11,color:C.muted,marginTop:16,textAlign:"center",lineHeight:1.6}}>
          🔒 Secure payment via Razorpay &nbsp;•&nbsp; Credits never expire<br/>
          Token displayed immediately after payment
        </div>
      </div>
    </div>
  );

  const certificateModal = showCertModal && certData?.certified && (
    <div onClick={()=>setShowCertModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.86)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <style>{`@media print{body *{visibility:hidden!important}.adcritiq-cert-print,.adcritiq-cert-print *{visibility:visible!important}.adcritiq-cert-print{position:fixed!important;left:0!important;top:0!important;width:100%!important;max-width:none!important;box-shadow:none!important}}`}</style>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:680,display:"grid",justifyItems:"center",gap:14}}>
        <button onClick={()=>setShowCertModal(false)} style={{justifySelf:"end",background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.dim,padding:"7px 10px",cursor:"pointer"}}>✕</button>
        {renderCertificateCard(certData)}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>window.print()} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${C.gold}55`,background:`${C.gold}18`,color:C.gold,fontWeight:900,cursor:"pointer"}}>↓ Download Certificate</button>
          <button onClick={()=>openLinkedInCertificateShare(certData.cert_id)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${C.blue}55`,background:`${C.blue}18`,color:C.blue,fontWeight:900,cursor:"pointer"}}>Share on LinkedIn</button>
          <button onClick={()=>copyCertificateLink(certData.cert_id)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${C.green}55`,background:`${C.green}18`,color:C.green,fontWeight:900,cursor:"pointer"}}>{shareCopied?"Copied!":"Copy Verification Link"}</button>
          <button onClick={()=>setShowCertModal(false)} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.s2,color:C.dim,fontWeight:900,cursor:"pointer"}}>Close</button>
        </div>
        <div style={{width:"100%",maxWidth:540,padding:14,borderRadius:10,background:C.s1,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Suggested Post Copy</div>
          <div style={{fontSize:12,color:C.dim,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
{`Our ${certData.campaign||"creative"} creative earned AdCritIQ™ Certified Creative status.

Neural Grade: ${certData.grade||"—"}
Brand Recall: ${certData.key_scores?.brand_recall??"—"}/100
Memory Encoding: ${certData.key_scores?.memory_encoding??"—"}/100

Tested before media spend was committed.

Verify at: ${certificateUrl(certData.cert_id)}

#AdCritIQ #NeuralCreativeIntelligence #JustTheSignalBeforeTheSpend`}
          </div>
        </div>
      </div>
    </div>
  );

  const shareModal = showShareModal && shareUrl && (
    <div
      style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.78)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={()=>setShowShareModal(false)}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{background:C.s1,border:`1px solid ${C.border2}`,borderRadius:16,padding:28,width:"100%",maxWidth:480,boxShadow:"0 24px 64px rgba(0,0,0,0.6)",animation:"fadeUp 0.2s ease both"}}
      >
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:20}}>
          <div>
            <div style={{fontWeight:900,color:C.text,fontSize:17,marginBottom:5}}>🔗 Report Link Ready</div>
            <div style={{fontSize:12,color:C.dim,lineHeight:1.5}}>Anyone with this link can view the full report. No login or token needed.</div>
          </div>
          <button
            onClick={()=>setShowShareModal(false)}
            style={{background:"transparent",border:"none",color:C.dim,fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}
          >
            ✕
          </button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1,padding:"10px 12px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,color:C.dim,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {shareUrl}
          </div>
          <button
            onClick={()=>{
              navigator.clipboard.writeText(shareUrl).then(()=>{
                setShareCopied(true);
                setTimeout(()=>setShareCopied(false),2500);
              });
            }}
            style={{padding:"10px 16px",background:shareCopied?"rgba(16,185,129,0.15)":C.gold,border:"none",borderRadius:8,color:shareCopied?"#10B981":C.ink,fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s ease",flexShrink:0}}
          >
            {shareCopied?"✓ Copied!":"Copy"}
          </button>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Check out this AdCritIQ™ neural creative analysis:\n${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"11px 16px",background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.3)",borderRadius:8,color:"#25D366",fontSize:13,fontWeight:800,textDecoration:"none",marginBottom:12,transition:"all 0.15s ease",boxSizing:"border-box"}}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.506 3.93 1.395 5.6L0 24l6.549-1.371A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.652-.502-5.178-1.381l-.371-.22-3.886.814.826-3.795-.241-.389A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          Share on WhatsApp
        </a>

        <div style={{fontSize:10,color:C.muted,textAlign:"center",lineHeight:1.6}}>
          This link is permanent · No login required to view<br/>
          Powered by AdCritIQ™
        </div>
      </div>
    </div>
  );

  const certParamForRender=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("cert"):null;
  if(certParamForRender?.startsWith("ACI-")){
    const loading=!certVerifyData||certVerifyData.loading;
    const verified=certVerifyData?.valid===true;
    return (
      <div style={{minHeight:"100vh",background:"#050507",color:"#F2F2FF",display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?18:40,boxSizing:"border-box",fontFamily:"'Inter','DM Sans',sans-serif"}}>
        <div style={{width:"100%",maxWidth:760,display:"grid",justifyItems:"center",gap:20}}>
          {loading?(
            <>
              <div style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.18em",fontWeight:900}}>ADCRITIQ™ CERTIFICATE VERIFICATION</div>
              <div style={{fontSize:isMobile?26:34,color:"#FFFFFF",fontWeight:900,textAlign:"center"}}>Verifying certificate...</div>
            </>
          ):verified?(
            <>
              <div style={{fontSize:isMobile?26:38,color:C.gold,fontWeight:900,textAlign:"center"}}>✅ Verified Certificate</div>
              <div style={{fontSize:15,color:"#A8A5C4",textAlign:"center",lineHeight:1.7}}>This AdCritIQ™ certificate has been verified as authentic.</div>
              {renderCertificateCard(certVerifyData,{readOnly:true})}
              <button onClick={()=>{window.location.href="/";}} style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:`${C.gold}18`,color:C.gold,fontWeight:900,cursor:"pointer"}}>
                Run Your Own Analysis →
              </button>
            </>
          ):(
            <Card C={C} style={{maxWidth:560,textAlign:"center",padding:isMobile?24:36,borderColor:C.red+"55"}}>
              <div style={{fontSize:isMobile?26:36,color:C.red,fontWeight:900,marginBottom:12}}>❌ Certificate Not Found</div>
              <div style={{fontSize:15,color:C.dim,lineHeight:1.75,marginBottom:20}}>
                This certificate ID ({certParamForRender}) was not found or has been revoked. Contact AdCritIQ™ if you believe this is an error.
              </div>
              <button onClick={()=>{window.location.href="/";}} style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:`${C.gold}18`,color:C.gold,fontWeight:900,cursor:"pointer"}}>
                Go to AdCritIQ.com
              </button>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // LANDING PAGE
  // ============================================================
  if(stage==="landing"){
    return(
      <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg} 0%,${C.ink} 100%)`,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <div aria-hidden="true" style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)",animation:"drift 14s ease-in-out infinite alternate",pointerEvents:"none"}}/>
        <div aria-hidden="true" style={{position:"absolute",bottom:"-30%",left:"-10%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)",animation:"drift 18s ease-in-out infinite alternate-reverse",pointerEvents:"none"}}/>
        <header style={{position:"sticky",top:0,zIndex:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,padding:isMobile?"18px 20px":"22px 48px",borderBottom:`1px solid ${C.border}`,background:headerBg,backdropFilter:"blur(16px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}>
            <img
              src={isDarkMode?"/adcritiq-logo-dark.png":"/adcritiq-logo-light.png"}
              alt="AdCritIQ™"
              style={{
                display:"block",
                width:isMobile?148:188,
                height:"auto",
                maxHeight:isMobile?46:58,
                objectFit:"contain",
                borderRadius:6,
              }}
            />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {ThemeToggle}
            <button onClick={()=>setShowPricing(true)} style={{padding:isMobile?"10px 14px":"11px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:"transparent",color:C.gold,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
              Buy Credits
            </button>
          </div>
        </header>

        <main style={{flex:1,padding:isMobile?"42px 20px 30px":isTablet?"54px 38px 40px":"54px 48px 46px",maxWidth:1480,width:"100%",margin:"0 auto",boxSizing:"border-box",position:"relative",zIndex:1}}>
          <section style={{maxWidth:1180,margin:isMobile?"0 0 28px":"0 auto 34px",textAlign:isMobile?"left":"center"}}>
            <div style={{fontSize:11,fontWeight:900,color:C.gold,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:18}}>Creative-to-Media Outcome Intelligence</div>
            <h1 style={{fontSize:isMobile?38:isTablet?58:78,fontWeight:850,color:C.text,lineHeight:1.02,letterSpacing:-0.5,margin:"0 0 20px",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
              Forecast creative impact<br/>
              <span style={{color:C.gold,position:"relative",display:"inline-block"}}>
                before media spend.
                <span aria-hidden="true" style={{position:"absolute",left:0,right:0,bottom:-6,height:2,borderRadius:999,background:`linear-gradient(90deg,transparent,${C.goldL},${C.gold},transparent)`,backgroundSize:"200% 100%",animation:"shimmer 1.5s ease 0.6s both"}}/>
              </span>
            </h1>
            <p style={{fontSize:isMobile?13:15,color:C.gold,fontWeight:500,fontStyle:"italic",marginBottom:20,marginTop:-8,letterSpacing:"0.02em"}}>
              Just the signal before the spend.
            </p>
            <p style={{fontSize:isMobile?16:18,color:C.dim,lineHeight:1.72,maxWidth:850,margin:isMobile?"0":"0 auto"}}>
              AdCritIQ™ predicts whether your creative will turn media exposure into memory, consideration, action, or waste — using neural diagnostics, platform-fit scoring, and outcome forecasting across concept, storyboard, rough cut, and final assets. Built for CMOs, brand teams, and agencies who need to separate creative risk from media-plan risk before budgets go live.
            </p>
          </section>

          <section style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"minmax(0,1fr) minmax(360px,0.95fr)":"minmax(300px,0.86fr) minmax(460px,1.08fr) minmax(320px,0.9fr)",gap:isMobile?24:isTablet?28:30,alignItems:"center"}}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>
              <button onClick={()=>setStage("form")} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{background:C.gold,color:C.ink,border:"none",padding:"15px 28px",borderRadius:10,fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:isDarkMode?`0 16px 40px ${C.gold}24`:elevationShadow,transition:"transform 0.12s ease"}}>
                Start Outcome Forecast
              </button>
              <button onClick={()=>setShowPricing(true)} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{background:C.s1,color:C.text,border:`1px solid ${C.border}`,padding:"15px 24px",borderRadius:10,fontSize:15,fontWeight:800,cursor:"pointer",transition:"transform 0.12s ease"}}>
                Buy Analysis Credits
              </button>
              <button
                onClick={()=>{setCompareMode(true);setStage("form");}}
                onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.color=C.dim;}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"88";e.currentTarget.style.color=C.text;}}
                style={{background:"transparent",color:C.dim,border:`1px solid ${C.border2}`,padding:"15px 24px",borderRadius:10,fontSize:15,fontWeight:800,cursor:"pointer",transition:"transform 0.12s ease,border-color 0.18s ease,color 0.18s ease"}}
              >
                ⚖️ Compare Creative Outcomes
              </button>
              <button
                onClick={handleLoadDemo}
                disabled={demoLoading}
                onMouseDown={e=>{if(!demoLoading)e.currentTarget.style.transform="scale(0.98)";}}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=C.gold+"55";e.currentTarget.style.color=C.gold;}}
                onMouseEnter={e=>{if(!demoLoading){e.currentTarget.style.borderColor=C.gold+"aa";e.currentTarget.style.color=C.text;}}}
                style={{background:`${C.gold}0f`,color:C.gold,border:`1px solid ${C.gold}55`,padding:"15px 24px",borderRadius:10,fontSize:15,fontWeight:900,cursor:demoLoading?"wait":"pointer",transition:"transform 0.12s ease,border-color 0.18s ease,color 0.18s ease",opacity:demoLoading?0.78:1}}
              >
                {demoLoading?"Loading Sample...":"See Sample Forecast"}
              </button>
              </div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6,margin:"0 0 18px",fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>
                Sample report opens instantly. No upload, token, or credit required.
              </div>
              <div style={{padding:16,borderRadius:16,background:C.s1,border:`1px solid ${C.border}`,boxShadow:isDarkMode?"none":elevationShadow}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,transparent,${C.border2})`}}/>
                  <span style={{fontSize:10,color:C.muted,fontFamily:"monospace",letterSpacing:"0.15em",whiteSpace:"nowrap"}}>TEST AT EVERY STAGE</span>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,${C.border2},transparent)`}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {icon:"💡",stage:"Concept",note:"Before production starts"},
                    {icon:"🎞️",stage:"Storyboard",note:"Before the shoot"},
                    {icon:"🎬",stage:"Rough Cut",note:"Before finishing"},
                    {icon:"✅",stage:"Final Film",note:"Before going live",highlight:true},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:"10px 10px",background:s.highlight?"rgba(245,158,11,0.06)":C.s2,border:`1px solid ${s.highlight?C.gold+"44":C.border}`,borderRadius:10,textAlign:"center"}}>
                      <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                      <div style={{fontSize:11,fontWeight:800,color:s.highlight?C.gold:C.text,marginBottom:2}}>{s.stage}</div>
                      <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",letterSpacing:"0.05em",lineHeight:1.25}}>{s.note}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,padding:"9px 12px",background:"rgba(245,158,11,0.04)",border:`1px solid ${C.gold}22`,borderRadius:10,textAlign:"center",fontSize:11,color:C.dim,fontStyle:"italic"}}>
                  Fix it at storyboard for <span style={{color:C.gold,fontWeight:800}}>₹299</span> — not at reshoot for <span style={{color:C.red,fontWeight:800}}>₹80 lakh.</span>
                </div>
              </div>
            </div>

            <section style={{minWidth:0}}>
              <div style={{fontSize:10,color:C.gold,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",margin:"0 0 10px",textAlign:"center"}}>
                Predictive Cortical Response Model
              </div>
              <NeuralSignalBrainPanel isDarkMode={isDarkMode}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:-12}}>
                {["Memory","Attention","Platform Fit","Outcome Risk"].map((t,i)=>(
                  <div key={t} style={{padding:"8px 7px",borderRadius:10,background:C.s1,border:`1px solid ${C.border}`,fontSize:9,color:[C.cyan,C.green,C.gold,C.red][i],fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.05em",textAlign:"center",textTransform:"uppercase"}}>{t}</div>
                ))}
              </div>
            </section>

            <section style={{display:"grid",gap:12,minWidth:0}}>
              <div style={{padding:"14px 16px",background:`${C.gold}0d`,border:`1px solid ${C.gold}30`,borderRadius:14,color:C.dim,fontSize:13,lineHeight:1.65,fontStyle:"italic"}}>
                <span style={{color:C.gold,fontWeight:900,fontStyle:"normal"}}>Why this matters: </span>
                Media buys exposure. Creative decides whether exposure becomes memory, preference, action, or waste.
              </div>
              <section style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,padding:isMobile?20:22,boxShadow:isDarkMode?`0 24px 80px ${C.shadow}`:elevationShadow}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,borderBottom:`1px solid ${C.border}`,paddingBottom:16,marginBottom:18}}>
                  <div>
                    <div style={{fontSize:11,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:1.4,textTransform:"uppercase"}}>Live Output</div>
                    <div style={{fontSize:8,fontFamily:"monospace",color:C.gold,letterSpacing:"0.15em",marginTop:6,marginBottom:4,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{background:"rgba(245,158,11,0.12)",border:`1px solid ${C.gold}44`,padding:"2px 6px",borderRadius:4}}>FINAL FILM</span>
                      <span style={{color:C.muted}}>→ CONCEPT · STORYBOARD · ROUGH CUT</span>
                    </div>
                    <div style={{fontSize:22,fontWeight:900,color:C.text,marginTop:6}}>Outcome Forecast</div>
                  </div>
                  <div style={{width:54,height:54,borderRadius:14,background:`${C.gold}14`,border:`1px solid ${C.gold}44`,display:"grid",placeItems:"center",fontSize:23,fontWeight:900,color:C.gold,fontFamily:"'DM Mono',monospace"}}>A</div>
                </div>
                {[
                  ["SPONTANEOUS AWARENESS",78,C.green],
                  ["AIDED AWARENESS",84,C.green],
                  ["PURCHASE INTENT",58,C.amber],
                  ["MEDIA WASTAGE RISK",32,C.green],
                  ["CREATIVE ACCOUNTABILITY",78,C.cyan],
                ].map(([label,value,color])=>(
                  <div key={label} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.dim,fontWeight:800,marginBottom:7,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:0.8}}>
                      <span>{label}</span><span style={{color}}>{value}</span>
                    </div>
                    <div style={{height:6,borderRadius:999,background:C.s3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:999}}/>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:4,padding:"11px 13px",borderRadius:10,background:`${C.gold}0d`,border:`1px solid ${C.gold}33`,fontSize:12,color:C.dim,lineHeight:1.55}}>
                  <span style={{color:C.gold,fontWeight:900}}>Likely creative-led opportunity:</span> strong memory, weaker conversion readiness.
                </div>
              </section>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr",gap:8}}>
                {[
                  ["Before Production","Test concept, storyboard, rough cut, or final film before costly rework.",C.gold],
                  ["Before Media Spend","Forecast whether exposure is likely to create memory, action, or waste.",C.cyan],
                  ["Before The Blame Game","Separate creative-led risk from media-dependent risk.",C.purple],
                ].map(([title,body,color])=>(
                  <div key={title} style={{padding:13,borderRadius:12,background:`linear-gradient(135deg,${color}12,${C.s1})`,border:`1px solid ${color}33`,boxShadow:isDarkMode?"none":elevationShadow}}>
                    <div style={{fontSize:9,color:color,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>{title}</div>
                    <div style={{fontSize:11,color:C.dim,lineHeight:1.45}}>{body}</div>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:isMobile?"flex-start":"center",marginTop:isMobile?22:24}}>
            {["OUTCOME FORECASTING","MEDIA WASTAGE RISK","CREATIVE ACCOUNTABILITY","PLATFORM OUTCOME MATRIX","TRIBE V2-INFORMED","LAMBDA MEMORABILITY","PREDICTIVE, NOT BIOMETRIC"].map(t=>(
              <span key={t} style={{padding:"8px 11px",background:t.includes("OUTCOME")||t.includes("MEDIA")||t.includes("CREATIVE")||t.includes("PLATFORM")?C.s1:"transparent",borderRadius:8,border:`1px solid ${t.includes("TRIBE")||t.includes("LAMBDA")||t.includes("PREDICTIVE")?C.border2:C.border}`,fontSize:10,fontWeight:800,color:t.includes("OUTCOME")||t.includes("MEDIA")||t.includes("CREATIVE")||t.includes("PLATFORM")?C.dim:C.muted,fontFamily:"'DM Mono',monospace",letterSpacing:0.7,textTransform:"uppercase"}}>{t}</span>
            ))}
          </section>
          <div style={{fontSize:10,color:C.muted,lineHeight:1.65,textAlign:isMobile?"left":"center",marginTop:12}}>
            AdCritIQ™ forecasts creative-response probability. It does not guarantee sales lift, replace media measurement, or claim live biometric testing.
          </div>
        </main>

        <footer style={{padding:isMobile?"20px":"24px 48px",borderTop:`1px solid ${C.border}`,color:C.dim,fontSize:12,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap",fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase",position:"relative",zIndex:1}}>
          <span>AdCritIQ<sup>TM</sup></span>
          <span>JUST THE SIGNAL BEFORE THE SPEND.</span>
          <span>Predictive, not biometric</span>
        </footer>
        {pricingModal}
        {certificateModal}
        {shareModal}
      </div>
    );
  }

  // ============================================================
  // UPLOAD FORM
  // ============================================================
  if(stage==="form"){
    const formGrid2=isMobile?"1fr":"1fr 1fr";
    const formGrid3=isMobile?"1fr":isTablet?"1fr 1fr":"1fr 1fr 1fr";
    const fieldWrap={display:"grid",gap:8};
    const panelStyle={background:`linear-gradient(180deg,${isDarkMode?"rgba(255,255,255,0.035)":"rgba(255,255,255,0.55)"},${isDarkMode?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.22)"}),${C.s1}`,border:`1px solid ${C.border}`,borderTop:`1px solid ${isDarkMode?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.8)"}`,borderRadius:20,boxShadow:isDarkMode?`0 30px 90px ${C.shadow}`:elevationShadow,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"};
    const sectionSurface=(accent=C.gold)=>({
      ...panelStyle,
      padding:isMobile?20:30,
      border:`1px solid ${C.border}`,
      borderLeft:`3px solid ${accent}88`,
      boxShadow:isDarkMode?`0 28px 80px ${C.shadow}, inset 0 1px 0 rgba(255,255,255,0.035)`:elevationShadow,
      position:"relative",
      overflow:"hidden"
    });
    const sectionHead=(num,title,sub)=>(
      <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:24,paddingBottom:18,borderBottom:`1px solid ${C.border}`}}>
        <div style={{width:34,height:34,borderRadius:11,display:"grid",placeItems:"center",background:`${C.gold}18`,border:`1px solid ${C.gold}44`,color:C.gold,fontSize:11,fontWeight:900,fontFamily:"'DM Mono',monospace",flexShrink:0,boxShadow:`0 10px 24px ${C.gold}12`}}>{num}</div>
        <div>
          <div style={{fontSize:13,color:C.gold,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:5}}>{title}</div>
          <div style={{fontSize:13,color:C.dim,lineHeight:1.55}}>{sub}</div>
        </div>
      </div>
    );
    const inp={width:"100%",boxSizing:"border-box",height:56,padding:"0 18px",borderRadius:14,border:`1px solid ${C.border}`,borderTop:`1px solid ${isDarkMode?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.85)"}`,background:`linear-gradient(180deg,${isDarkMode?"rgba(255,255,255,0.035)":"rgba(255,255,255,0.45)"},${isDarkMode?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.12)"}),${C.s2}`,color:C.text,fontSize:15,outline:"none",fontFamily:"inherit",boxShadow:isDarkMode?"inset 0 1px 0 rgba(255,255,255,0.03)":"inset 0 1px 0 rgba(255,255,255,0.7)",transition:"border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease"};
    const lbl={fontSize:10,fontWeight:900,letterSpacing:2.4,color:C.dim,textTransform:"uppercase",marginBottom:0,display:"block",fontFamily:"'DM Mono',monospace"};
    const selStyle={
      ...inp,
      WebkitAppearance:"auto",
      MozAppearance:"auto",
      appearance:"auto",
      backgroundColor:C.s2,
      backgroundImage:"none",
      backgroundRepeat:"no-repeat",
      paddingRight:18,
    };
    return(
      <div style={{minHeight:"100vh",background:`radial-gradient(circle at 18% 0%,${C.gold}12 0%,transparent 30%),radial-gradient(circle at 100% 15%,${C.purple}10 0%,transparent 26%),linear-gradient(180deg,${C.bg},${C.ink})`,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif",position:"relative",overflow:"hidden"}}>
        <div aria-hidden="true" style={{position:"absolute",top:-220,right:-180,width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle, rgba(216,180,90,0.08), transparent 66%)",pointerEvents:"none"}}/>
        <div aria-hidden="true" style={{position:"absolute",bottom:-260,left:-180,width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle, rgba(45,212,191,0.055), transparent 64%)",pointerEvents:"none"}}/>

        <div style={{padding:isMobile?"16px 18px":"18px 42px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"sticky",top:0,zIndex:20,background:formHeaderBg,backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)"}}>
          <div onClick={()=>setStage("landing")} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",minWidth:0}}>
            <img
              src={isDarkMode?"/adcritiq-logo-dark.png":"/adcritiq-logo-light.png"}
              alt="AdCritIQ™"
              style={{
                display:"block",
                width:isMobile?142:176,
                height:"auto",
                maxHeight:isMobile?44:54,
                objectFit:"contain",
                borderRadius:6,
              }}
            />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {ThemeToggle}
            <button onClick={()=>setShowPricing(true)} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{padding:isMobile?"10px 13px":"11px 18px",borderRadius:999,border:`1px solid ${C.gold}55`,background:`${C.gold}12`,color:C.gold,fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",transition:"transform 0.12s ease",fontFamily:"'DM Sans',sans-serif"}}>
              Buy Credits
            </button>
          </div>
        </div>

        <main style={{position:"relative",zIndex:1,maxWidth:1180,margin:"0 auto",padding:isMobile?"28px 18px 56px":"54px 32px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,0.85fr) minmax(320px,0.55fr)",gap:isMobile?24:42,alignItems:"end",marginBottom:30}}>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:9,padding:"6px 11px",borderRadius:999,background:`${C.gold}10`,border:`1px solid ${C.gold}33`,color:C.gold,fontSize:10,fontWeight:900,letterSpacing:1.6,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:18}}>
                Outcome Forecast Intake
              </div>
              <h2 style={{fontSize:isMobile?38:isTablet?54:68,fontWeight:800,margin:"0 0 14px",fontFamily:"'Playfair Display',serif",letterSpacing:0,lineHeight:0.98}}>Creative Intake for Outcome Forecasting</h2>
              <p style={{color:C.dim,fontSize:isMobile?15:17,margin:0,lineHeight:1.75,maxWidth:690}}>Prepare the campaign context, creative asset, and access token so AdCritIQ™ can forecast memory, consideration, action, and media-waste risk before spend.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {["17 neural metrics","15 platform scores","CMO playbook","PDF ready"].map(t=>(
                <div key={t} style={{padding:"11px 12px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,color:C.dim,fontSize:11,fontWeight:800,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:1,textAlign:"center"}}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[
              ["Creative Response Probability",C.gold],
              ["Platform Outcome Matrix",C.cyan],
              ["Media Wastage Risk",C.red],
              ["CMO Decision Lens",C.green],
            ].map(([label,color])=>(
              <div key={label} style={{padding:"12px 13px",borderRadius:14,background:`linear-gradient(135deg,${color}10,${C.s1})`,border:`1px solid ${color}33`,boxShadow:`0 18px 44px ${C.shadow}`}}>
                <div style={{fontSize:10,color:color,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",fontWeight:900,textTransform:"uppercase",lineHeight:1.45}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{padding:isMobile?"11px 13px":"12px 18px",borderRadius:14,background:`linear-gradient(90deg,${C.gold}12,${C.cyan}08,transparent)`,border:`1px solid ${C.border}`,color:C.dim,fontSize:isMobile?12:13,lineHeight:1.55,fontStyle:"italic",marginBottom:30}}>
            <span style={{color:C.gold,fontWeight:900,fontStyle:"normal"}}>Founder lens:</span> Media buys exposure. Creative decides whether exposure becomes memory, action, or waste.
          </div>

          {error&&<div style={{padding:"15px 18px",borderRadius:14,background:"rgba(251,113,133,0.12)",color:C.red,fontSize:14,marginBottom:20,border:`1px solid ${C.red}55`,boxShadow:`0 18px 40px ${C.shadow}`}}>{error}</div>}

          <div style={{display:"grid",gap:isMobile?18:24}}>
            <section style={sectionSurface(C.gold)}>
              {sectionHead("01","Campaign Context","Define the brand, audience and market inputs used to frame the analysis.")}
              <div style={{display:"grid",gridTemplateColumns:formGrid2,gap:18,marginBottom:18}}>
                <div style={fieldWrap}>
                  <label style={lbl}>{isCompetitorAnalysis?"Competitor Brand Name *":"Brand Name *"}</label>
                  <input placeholder={isCompetitorAnalysis?"e.g. Coca-Cola, Pepsi, Samsung":"e.g. Dabur, Nestlé, Coca-Cola"} style={inp} value={form.brand} onChange={e=>u("brand",e.target.value)}/>
                  {isCompetitorAnalysis&&<div style={{fontSize:11,color:C.dim,lineHeight:1.5,marginTop:7}}>Brand field now means the competitor's brand name.</div>}
                </div>
                <div style={fieldWrap}><label style={lbl}>Client / Advertiser</label><input placeholder="e.g. Dabur India Ltd" style={inp} value={form.client} onChange={e=>u("client",e.target.value)}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:formGrid2,gap:18,marginBottom:18}}>
                <div style={fieldWrap}><label style={lbl}>Campaign Name</label><input placeholder="e.g. Immunity Winter 2026" style={inp} value={form.campaign} onChange={e=>u("campaign",e.target.value)}/></div>
                <div style={fieldWrap}><label style={lbl}>Agency / Team</label><input placeholder="e.g. Ogilvy, DDB, Wunderman" style={inp} value={form.agency} onChange={e=>u("agency",e.target.value)}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:formGrid3,gap:18}}>
                <div style={fieldWrap}><label style={lbl}>Industry Vertical</label>
                  <select style={selStyle} value={form.industry} onChange={e=>u("industry",e.target.value)}>
                    {["FMCG / CPG","Pharma / Healthcare","Auto / Mobility","BFSI / Fintech","Technology","E-commerce","Retail / QSR","Telecom","Media / Entertainment","Real Estate","Education","Government / PSU","Other"].map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}><label style={lbl}>Country *</label>
                  <select style={{...selStyle,borderColor:!form.country?C.red:C.border}} value={form.country} onChange={e=>u("country",e.target.value)}>
                    {["India","UAE","Saudi Arabia","Singapore","USA","UK","Australia","Indonesia","Bangladesh","Sri Lanka","Malaysia","Other"].map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}><label style={lbl}>Target Market</label>
                  <select style={selStyle} value={form.market} onChange={e=>u("market",e.target.value)}>
                    {["India","India — Tier 1","India — Tier 2/3","Pan-India","Urban India","Rural India","USA","UK","UAE / MENA","Southeast Asia","Global","Other"].map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={fieldWrap}><label style={lbl}>Target Audience</label><input placeholder="e.g. Males 35-55, SEC A/B" style={inp} value={form.audience} onChange={e=>u("audience",e.target.value)}/></div>
              </div>
            </section>

            <section style={sectionSurface(C.cyan)}>
              {sectionHead("02","Creative Format","Select the primary creative environment and add any strategic context.")}
              <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16,padding:"16px 18px",marginBottom:20,background:`linear-gradient(135deg,${C.cyan}0d,${C.s2})`,border:`1px solid ${C.border}`,borderRadius:16,flexDirection:isMobile?"column":"row"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:900,color:C.text,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    {compareMode ? "⚖️ Comparing 2 Creatives" : "📁 Single Creative Analysis"}
                    <span style={{fontSize:9,fontFamily:"monospace",color:C.amber,background:"rgba(245,158,11,0.1)",border:`1px solid ${C.amber}44`,padding:"1px 6px",borderRadius:4,letterSpacing:"0.08em"}}>
                      ONE-TIME
                    </span>
                  </div>
                  <div style={{fontSize:12,color:C.dim,marginTop:5,lineHeight:1.5}}>
                    Instant side-by-side battle — score two creatives now and declare a winner. One-time comparison.
                  </div>
                </div>
                <div
                  onClick={()=>{
                    if(compareMode){
                      setCompareMode(false);
                      setFileB(null);
                      setPreviewB(null);
                      setResultsB(null);
                      setLabelA("Creative A");
                      setLabelB("Creative B");
                      setCompareType("versions");
                      setFormB({brand:"",client:"",campaign:"",script:""});
                    }else{
                      setCompareMode(true);
                    }
                  }}
                  style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none",alignSelf:isMobile?"flex-end":"center",padding:"8px 10px",borderRadius:999,background:C.s1,border:`1px solid ${C.border}`}}
                >
                  <div style={{fontSize:12,color:C.dim,fontWeight:800}}>
                    {compareMode ? "Switch to Single" : "Compare 2 Creatives"}
                  </div>
                  <div style={{width:44,height:24,borderRadius:999,background:compareMode?C.gold:C.border2,position:"relative",transition:"background 0.2s ease",flexShrink:0}}>
                    <div style={{position:"absolute",top:3,left:compareMode?23:3,width:18,height:18,borderRadius:"50%",background:compareMode?C.ink:C.muted,transition:"left 0.2s ease"}}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,margin:"8px 0",padding:"0 4px"}}>
                <div style={{height:1,flex:1,background:C.border}}/>
                <span style={{fontSize:9,color:C.muted,fontFamily:"monospace",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>
                  OR FOR ONGOING TRACKING
                </span>
                <div style={{height:1,flex:1,background:C.border}}/>
              </div>
              <div style={{display:"grid",gap:12,marginBottom:20,padding:"15px 18px",background:isCompetitorAnalysis?`linear-gradient(135deg,${C.purple}18,${C.s2})`:C.s2,border:`1px solid ${isCompetitorAnalysis?C.purple+"66":C.border}`,borderRadius:16,boxShadow:isCompetitorAnalysis?`0 14px 34px ${C.purple}14`:"none"}}>
                <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:900,color:isCompetitorAnalysis?C.purple:C.text,letterSpacing:0.4,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      🔍 Competitive Intelligence Mode
                      <span style={{fontSize:9,fontFamily:"monospace",color:C.purple,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.4)",padding:"1px 6px",borderRadius:4,letterSpacing:"0.08em"}}>
                        BUILDS DASHBOARD
                      </span>
                    </div>
                    <div style={{fontSize:12,color:C.dim,marginTop:5,lineHeight:1.55}}>
                      Track a competitor's creative over time — each upload adds to your Competitive Dashboard, building trend data across their campaigns.
                    </div>
                  </div>
                  <div
                    onClick={()=>setIsCompetitorAnalysis(v=>!v)}
                    style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none",alignSelf:isMobile?"flex-end":"center",padding:"8px 10px",borderRadius:999,background:C.s1,border:`1px solid ${isCompetitorAnalysis?C.purple+"66":C.border}`}}
                  >
                    <div style={{fontSize:12,color:isCompetitorAnalysis?C.purple:C.dim,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>
                      {isCompetitorAnalysis?"ON":"OFF"}
                    </div>
                    <div style={{width:44,height:24,borderRadius:999,background:isCompetitorAnalysis?C.purple:C.border2,position:"relative",transition:"background 0.2s ease",flexShrink:0}}>
                      <div style={{position:"absolute",top:3,left:isCompetitorAnalysis?23:3,width:18,height:18,borderRadius:"50%",background:isCompetitorAnalysis?C.text:C.muted,transition:"left 0.2s ease"}}/>
                    </div>
                  </div>
                </div>
                {isCompetitorAnalysis&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(260px,0.48fr) 1fr",gap:14,alignItems:"end"}}>
                    <div style={fieldWrap}>
                      <label style={lbl}>This is a competitor of (your brand) *</label>
                      <input placeholder="e.g. Coca-Cola" style={{...inp,borderColor:!competitorOf.trim()?C.purple:C.border}} value={competitorOf} onChange={e=>setCompetitorOf(e.target.value)}/>
                    </div>
                    <div style={{fontSize:12,color:C.dim,lineHeight:1.65,padding:"12px 14px",borderRadius:12,background:`${C.purple}10`,border:`1px solid ${C.purple}33`}}>
                      Download the competitor ad from Meta Ad Library or YouTube and upload it here. The analysis will be tagged to your competitive dashboard.
                    </div>
                  </div>
                )}
              </div>
              {compareMode&&(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:16}}>
                  {[
                    {type:"versions",icon:"📁",title:"Two Versions",sub:"Same brand — two cuts of the same creative"},
                    {type:"brands",icon:"🆚",title:"Brand vs Brand",sub:"Different brands — competitive comparison"},
                  ].map(opt=>(
                    <div
                      key={opt.type}
                      onClick={()=>setCompareType(opt.type)}
                      style={{padding:"15px 16px",border:`1px solid ${compareType===opt.type?C.gold+"88":C.border}`,borderRadius:14,cursor:"pointer",background:compareType===opt.type?`${C.gold}0f`:C.s2,transition:"all 0.15s ease",boxShadow:compareType===opt.type?`0 14px 34px ${C.gold}12`:"none"}}
                    >
                      <div style={{fontSize:22,marginBottom:7}}>{opt.icon}</div>
                      <div style={{fontWeight:900,color:compareType===opt.type?C.gold:C.text,fontSize:13,marginBottom:5}}>{opt.title}</div>
                      <div style={{fontSize:12,color:C.dim,lineHeight:1.5}}>{opt.sub}</div>
                    </div>
                  ))}
                </div>
              )}
              {compareMode&&(
                <div style={{background:`${C.gold}0f`,border:`1px solid ${C.gold}44`,borderRadius:14,padding:"14px 16px",marginBottom:24,display:"flex",alignItems:"center",gap:12,boxShadow:`0 16px 40px ${C.gold}0f`}}>
                  <span style={{fontSize:20,flexShrink:0}}>⚖️</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:900,color:C.gold,fontSize:13,letterSpacing:1,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>A/B Comparison Mode</div>
                    <div style={{fontSize:12,color:C.dim,marginTop:4,lineHeight:1.5}}>
                      {compareType==="brands"
                        ? `Competitive benchmarking: ${form.brand||labelA} vs ${formB.brand||labelB}`
                        : "Upload two creatives. AdCritIQ™ will analyse both and declare a winner per metric, platform, and overall."}
                    </div>
                  </div>
                </div>
              )}
              <div style={{marginBottom:20}}>
                <label style={{...lbl,marginBottom:10}}>Production Stage</label>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
                  {[
                    ["concept","💡","Concept / Script","Test the idea — zero production spend needed"],
                    ["storyboard","🎞️","Storyboard","Test frames before the shoot — fix now, not in reshoots"],
                    ["roughcut","🎬","Rough Cut","Edit-level fixes only — no reshoot advice"],
                    ["final","✅","Final Creative","Pre-flight check before media budget commits"],
                  ].map(([id,icon,title,sub])=>(
                    <button
                      key={id}
                      onClick={()=>{
                        setProductionStage(id);
                        if(id==="concept"||id==="storyboard"){
                          setCompareMode(false);
                          setFileB(null);
                          setPreviewB(null);
                          setResultsB(null);
                        }
                      }}
                      style={{textAlign:"left",padding:"15px 16px",border:`1px solid ${productionStage===id?C.gold+"88":C.border}`,borderRadius:14,cursor:"pointer",background:productionStage===id?`${C.gold}0f`:C.s2,transition:"all 0.15s ease",boxShadow:productionStage===id?`0 14px 34px ${C.gold}12`:"none",color:C.text}}
                    >
                      <div style={{fontSize:22,marginBottom:7}}>{icon}</div>
                      <div style={{fontWeight:900,color:productionStage===id?C.gold:C.text,fontSize:13,marginBottom:5}}>{title}</div>
                      <div style={{fontSize:11,color:C.dim,lineHeight:1.45}}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{...lbl,marginBottom:10}}>Creative Type</label>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":isTablet?"repeat(3,1fr)":"repeat(5,1fr)",gap:10}}>
                  {[["video","Video / Film"],["static_image","Static Image"],["motion_static","Animated / GIF"],["audio","Audio + Script"],["text","Text / Script"]].map(([k,v])=>
                    <button key={k} onClick={()=>u("type",k)} style={{padding:"13px 12px",borderRadius:12,border:`1px solid ${form.type===k?C.gold:C.border}`,background:form.type===k?`linear-gradient(180deg,${C.gold}20,${C.gold}0d)`:C.s2,color:form.type===k?C.gold:C.dim,fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:form.type===k?`0 12px 28px ${C.gold}12`:"none",transition:"all 0.18s ease"}}>{v}</button>
                  )}
                </div>
              </div>
              {(productionStage==="concept"||productionStage==="storyboard"||getCreativeFormat(form.type,file)==="text"||getCreativeFormat(form.type,file)==="audio")&&(
                <div style={{...fieldWrap,marginBottom:18}}>
                  <label style={lbl}>
                    {productionStage==="concept"
                      ?"Concept / Script *"
                      :productionStage==="storyboard"
                        ?"Script / VO (optional)"
                        :getCreativeFormat(form.type,file)==="audio"
                          ?"Audio Transcript / Script *"
                          :"Text / Script *"}
                  </label>
                  <textarea
                    placeholder={productionStage==="concept"
                      ?"Paste the concept, script, story outline, campaign idea, intended scenes, brand role, and CTA. Minimum 100 characters..."
                      :productionStage==="storyboard"
                        ?"Optional: paste script, voiceover, supers, scene notes, or intended audio cues for the storyboard..."
                        :getCreativeFormat(form.type,file)==="audio"
                          ?"Paste the radio/podcast script, voiceover transcript, sonic mnemonic description, and CTA..."
                          :"Paste ad copy, headline/body copy, script, landing page section, email, or SMS text..."}
                    style={{...inp,height:130,padding:"16px 18px",resize:"vertical",lineHeight:1.6}}
                    value={form.script}
                    onChange={e=>u("script",e.target.value)}
                  />
                  <div style={{fontSize:11,color:C.amber,lineHeight:1.5}}>
                    {productionStage==="concept"
                      ?"Concept analysis is projected before production. Scores assume competent execution."
                      :productionStage==="storyboard"
                        ?"Storyboard analysis uses the uploaded frame order as the intended narrative sequence."
                        :getCreativeFormat(form.type,file)==="audio"
                          ?"Audio is analysed from transcript/script context in this version; raw audio transcription is not performed."
                          :"Text/script analysis does not require an uploaded file."}
                  </div>
                </div>
              )}
              <div style={fieldWrap}>
                <label style={lbl}>Additional Notes / Brief</label>
                <textarea placeholder="Any context for the analysis: objectives, KPIs, competitive context, specific questions..." style={{...inp,height:110,padding:"16px 18px",resize:"vertical",lineHeight:1.6}} value={form.notes} onChange={e=>u("notes",e.target.value)}/>
              </div>
            </section>

            <section style={sectionSurface(C.purple)}>
              {sectionHead("03","Upload Creative",productionStage==="concept"?"No file is required for concept testing. Paste the concept or script in the Creative Format section above.":productionStage==="storyboard"?"Upload 2-12 storyboard frames in intended sequence. AdCritIQ will read them as a narrative board.":getCreativeFormat(form.type,file)==="text"?"No file is required for text/script analysis. Paste the copy in the Creative Format section above.":"Upload the creative file that AdCritIQ will decode into neural, platform, and outcome signals.")}
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,marginBottom:18}}>
                {[
                  ["Images","JPG, PNG, WEBP, GIF","Up to 10 MB · compressed before analysis",C.gold],
                  ["Videos","MP4, MOV, WEBM","Up to 100 MB · 1-2 frames sampled",C.cyan],
                  ["Audio / Text","MP3, WAV, M4A, Script","Audio needs transcript · text needs no file",C.purple],
                ].map(([title,types,limit,color])=>(
                  <div key={title} style={{padding:"12px 13px",borderRadius:12,background:`${color}0b`,border:`1px solid ${color}33`}}>
                    <div style={{fontSize:11,color:color,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:1,marginBottom:5}}>{title}</div>
                    <div style={{fontSize:12,color:C.text,fontWeight:800,marginBottom:4}}>{types}</div>
                    <div style={{fontSize:11,color:C.dim,lineHeight:1.4}}>{limit}</div>
                  </div>
                ))}
              </div>
              {compareMode&&(
                <div style={{display:"grid",gridTemplateColumns:formGrid2,gap:14,marginBottom:18}}>
                  <div style={fieldWrap}>
                    <label style={lbl}>Creative A Label</label>
                    <input style={inp} placeholder="e.g. Version A — Emotional" value={labelA} onChange={e=>setLabelA(e.target.value||"Creative A")}/>
                  </div>
                  <div style={fieldWrap}>
                    <label style={lbl}>Creative B Label</label>
                    <input style={inp} placeholder="e.g. Version B — Product Focus" value={labelB} onChange={e=>setLabelB(e.target.value||"Creative B")}/>
                  </div>
                </div>
              )}
              {compareMode&&getCreativeFormat(form.type,file)!=="text"&&<label style={{...lbl,marginBottom:10}}>Creative A — Upload File {getCreativeFormat(form.type,file)==="audio"?"(optional)":"*"}</label>}
              {productionStage==="concept"?(
                <div style={{border:`1.5px dashed ${C.border2}`,borderRadius:18,padding:isMobile?26:38,textAlign:"center",background:`linear-gradient(180deg,rgba(216,180,90,0.035),rgba(255,255,255,0.015))`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px ${C.shadow}`}}>
                  <div style={{fontSize:isMobile?32:42,marginBottom:8,color:C.gold,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Concept Mode</div>
                  <div style={{fontSize:17,fontWeight:900,color:C.text}}>No upload required</div>
                  <div style={{fontSize:13,color:C.dim,marginTop:8}}>AdCritIQ will score the idea as projected if executed well.</div>
                </div>
              ):productionStage==="storyboard"?(
                <div>
                  <div onClick={()=>storyboardRef.current?.click()} style={{border:`1.5px dashed ${storyboardFiles.length?C.gold:C.border2}`,borderRadius:18,padding:isMobile?28:40,textAlign:"center",cursor:"pointer",background:storyboardFiles.length?`${C.gold}08`:`linear-gradient(180deg,rgba(216,180,90,0.055),rgba(255,255,255,0.015))`,transition:"all .2s",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px ${C.shadow}`}}>
                    <div style={{fontSize:isMobile?34:46,marginBottom:8,color:C.gold,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Storyboard</div>
                    <div style={{fontSize:18,fontWeight:900,color:C.text}}>Upload frames in sequence</div>
                    <div style={{fontSize:13,color:C.dim,marginTop:8}}>2-12 images · JPG, PNG, WEBP · compressed before analysis</div>
                    <div style={{fontSize:12,color:storyboardFiles.length>=2?C.green:C.amber,marginTop:10,fontWeight:900}}>{storyboardFiles.length}/12 frames selected</div>
                  </div>
                  <input ref={storyboardRef} type="file" accept="image/*" multiple onChange={handleStoryboardFiles} style={{display:"none"}}/>
                  {storyboardFiles.length>0&&(
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":isTablet?"repeat(3,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:12,marginTop:16}}>
                      {storyboardFiles.map((sf,i)=>(
                        <div key={`${sf.name}-${sf.lastModified}-${i}`} style={{position:"relative",background:C.s2,border:`1px solid ${C.border}`,borderRadius:12,padding:10}}>
                          <button onClick={()=>removeStoryboardFile(i)} style={{position:"absolute",top:6,right:6,width:24,height:24,borderRadius:"50%",border:`1px solid ${C.border}`,background:"rgba(0,0,0,0.72)",color:C.text,cursor:"pointer",fontWeight:900,zIndex:1}}>×</button>
                          <img src={URL.createObjectURL(sf)} alt={`Frame ${i+1}`} style={{width:"100%",aspectRatio:"16/9",objectFit:"cover",borderRadius:8,display:"block",marginBottom:8}}/>
                          <div style={{fontSize:11,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:1}}>FRAME {i+1}</div>
                          <div style={{fontSize:11,color:C.dim,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginTop:3}}>{sf.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ):getCreativeFormat(form.type,file)==="text"?(
                <div style={{border:`1.5px dashed ${C.border2}`,borderRadius:18,padding:isMobile?26:38,textAlign:"center",background:`linear-gradient(180deg,rgba(216,180,90,0.035),rgba(255,255,255,0.015))`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px ${C.shadow}`}}>
                  <div style={{fontSize:isMobile?32:42,marginBottom:8,color:C.gold,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Text Mode</div>
                  <div style={{fontSize:17,fontWeight:900,color:C.text}}>No upload required</div>
                  <div style={{fontSize:13,color:C.dim,marginTop:8}}>Ad copy and scripts are analysed from the text box above.</div>
                </div>
              ):(
              <div onClick={()=>fileRef.current?.click()} style={{border:`1.5px dashed ${file?C.gold:C.border2}`,borderRadius:18,padding:file?20:isMobile?34:52,textAlign:"center",cursor:"pointer",background:file?`${C.gold}08`:`linear-gradient(180deg,rgba(216,180,90,0.055),rgba(255,255,255,0.015))`,transition:"all .2s",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px ${C.shadow}`}}>
                {file?(
                  <div style={{display:"flex",alignItems:"center",gap:16,justifyContent:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row"}}>
                    {preview&&file.type.startsWith("image/")&&<img src={preview} style={{width:160,height:92,objectFit:"cover",borderRadius:12,border:`1px solid ${C.border}`}} alt=""/>}
                    {preview&&file.type.startsWith("video/")&&<video src={preview} style={{width:160,height:92,objectFit:"cover",borderRadius:12,border:`1px solid ${C.border}`}}/>}
                    {preview&&file.type.startsWith("audio/")&&<div style={{width:160,height:92,borderRadius:12,border:`1px solid ${C.border}`,background:C.s2,display:"grid",placeItems:"center",color:C.gold,fontWeight:900}}>AUDIO</div>}
                    <div style={{textAlign:isMobile?"center":"left"}}>
                      <div style={{fontSize:16,fontWeight:800,color:C.text}}>{file.name}</div>
                      <div style={{fontSize:13,color:C.dim,marginTop:4}}>{(file.size/1024/1024).toFixed(1)} MB · {file.type}</div>
                      <div style={{fontSize:12,color:C.gold,marginTop:6,fontWeight:800}}>Click to change file</div>
                    </div>
                  </div>
                ):(
                  <>
                    <div style={{fontSize:isMobile?38:50,marginBottom:8,color:C.gold,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Upload</div>
                    <div style={{fontSize:18,fontWeight:900,color:C.text}}>Drop file here or click to browse</div>
                    <div style={{fontSize:13,color:C.dim,marginTop:8}}>JPG, PNG, WEBP, GIF up to 10 MB · MP4, MOV, WEBM up to 100 MB · MP3, WAV, M4A up to 50 MB</div>
                  </>
                )}
              </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/x-m4a" onChange={handleFile} style={{display:"none"}}/>
              {compareMode&&(
                <div style={{marginTop:18}}>
                  {(getCreativeFormat(form.type,file)==="text"||getCreativeFormat(form.type,file)==="audio")&&(
                    <div style={{...fieldWrap,marginBottom:16}}>
                      <label style={lbl}>{getCreativeFormat(form.type,file)==="audio"?"Creative B — Audio Transcript / Script *":"Creative B — Text / Script *"}</label>
                      <textarea
                        placeholder={getCreativeFormat(form.type,file)==="audio"?"Paste Creative B radio/podcast script or voiceover transcript...":"Paste Creative B ad copy, headline/body copy, or script..."}
                        style={{...inp,height:120,padding:"16px 18px",resize:"vertical",lineHeight:1.6}}
                        value={formB.script}
                        onChange={e=>setFormB(p=>({...p,script:e.target.value}))}
                      />
                    </div>
                  )}
                  {getCreativeFormat(form.type,file)!=="text"&&<label style={{...lbl,marginBottom:10}}>Creative B — Upload File {getCreativeFormat(form.type,file)==="audio"?"(optional)":"*"}</label>}
                  {getCreativeFormat(form.type,file)!=="text"&&(
                  <div onClick={()=>document.getElementById("fileBInput")?.click()} style={{border:`1.5px dashed ${fileB?C.gold:C.border2}`,borderRadius:18,padding:fileB?20:isMobile?30:42,textAlign:"center",cursor:"pointer",background:fileB?`${C.gold}08`:`linear-gradient(180deg,rgba(45,212,191,0.045),rgba(255,255,255,0.015))`,transition:"all .2s",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px ${C.shadow}`}}>
                    {fileB?(
                      <div style={{display:"flex",alignItems:"center",gap:16,justifyContent:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row"}}>
                        {previewB&&fileB.type.startsWith("image/")&&<img src={previewB} style={{width:160,height:92,objectFit:"cover",borderRadius:12,border:`1px solid ${C.border}`}} alt=""/>}
                        {previewB&&fileB.type.startsWith("video/")&&<video src={previewB} style={{width:160,height:92,objectFit:"cover",borderRadius:12,border:`1px solid ${C.border}`}}/>}
                        {previewB&&fileB.type.startsWith("audio/")&&<div style={{width:160,height:92,borderRadius:12,border:`1px solid ${C.border}`,background:C.s2,display:"grid",placeItems:"center",color:C.cyan,fontWeight:900}}>AUDIO B</div>}
                        <div style={{textAlign:isMobile?"center":"left"}}>
                          <div style={{fontSize:16,fontWeight:800,color:C.text}}>{fileB.name}</div>
                          <div style={{fontSize:13,color:C.dim,marginTop:4}}>{(fileB.size/1024/1024).toFixed(1)} MB · {fileB.type}</div>
                          <div style={{fontSize:12,color:C.gold,marginTop:6,fontWeight:800}}>Click to change Creative B</div>
                        </div>
                      </div>
                    ):(
                      <>
                        <div style={{fontSize:isMobile?34:44,marginBottom:8,color:C.cyan,fontFamily:"'Playfair Display',serif",lineHeight:1}}>Creative B</div>
                        <div style={{fontSize:17,fontWeight:900,color:C.text}}>Click to upload second creative</div>
                        <div style={{fontSize:13,color:C.dim,marginTop:8}}>JPG, PNG, WEBP, GIF up to 10 MB · MP4, MOV, WEBM up to 100 MB · MP3, WAV, M4A up to 50 MB</div>
                      </>
                    )}
                  </div>
                  )}
                  <input id="fileBInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/x-m4a" onChange={handleFileB} style={{display:"none"}}/>
                  {compareType==="brands"&&(
                    <div style={{marginTop:18,padding:18,background:C.s2,border:`1px solid ${C.border}`,borderRadius:14}}>
                      <div style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginBottom:14,fontWeight:900,textTransform:"uppercase"}}>
                        Creative B — Brand Details
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:formGrid3,gap:14}}>
                        <div style={fieldWrap}>
                          <label style={lbl}>Brand B *</label>
                          <input style={{...inp,borderColor:!formB.brand.trim()?C.red+"66":C.border}} placeholder="e.g. Coca-Cola" value={formB.brand} onChange={e=>setFormB(p=>({...p,brand:e.target.value}))}/>
                        </div>
                        <div style={fieldWrap}>
                          <label style={lbl}>Client B</label>
                          <input style={inp} placeholder="e.g. TCCC India" value={formB.client} onChange={e=>setFormB(p=>({...p,client:e.target.value}))}/>
                        </div>
                        <div style={fieldWrap}>
                          <label style={lbl}>Campaign B</label>
                          <input style={inp} placeholder="e.g. Real Magic" value={formB.campaign} onChange={e=>setFormB(p=>({...p,campaign:e.target.value}))}/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section style={sectionSurface(C.green)}>
              {sectionHead("04","Access Token","Enter the analysis token tied to your purchased credits.")}
              <label style={lbl}>
                Analysis Token *&nbsp;
                <span style={{fontSize:11,color:C.dim,fontWeight:400}}>
                  — <span style={{color:C.gold,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowPricing(true)}>Buy credits</span>
                </span>
              </label>
              <div style={{display:"flex",gap:10,alignItems:"center",flexDirection:isMobile?"column":"row",marginTop:8,marginBottom:18}}>
                <div style={{
                  display:"flex",
                  alignItems:"center",
                  gap:8,
                  flex:1,
                  width:isMobile?"100%":"auto"
                }}>
                  <input
                    type={showToken?"text":"password"}
                    style={{
                      ...inp,
                      flex:1,
                      fontFamily:"monospace",
                      letterSpacing:showToken?"0.05em":"0.1em",
                      width:"100%"
                    }}
                    placeholder="Paste your token here..."
                    value={token}
                    onChange={e=>{
                      setToken(e.target.value);
                      localStorage.setItem("adcritiq_token",e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    onClick={()=>setShowToken(v=>!v)}
                    title={showToken?"Hide token":"Show token"}
                    style={{
                      background:"transparent",
                      border:`1px solid ${C.border2}`,
                      borderRadius:6,
                      padding:"7px 10px",
                      cursor:"pointer",
                      color:showToken?C.gold:C.dim,
                      fontSize:14,
                      lineHeight:1,
                      flexShrink:0,
                      transition:"all 0.15s ease",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      minWidth:44,
                      minHeight:44
                    }}
                    onMouseEnter={e=>{
                      e.currentTarget.style.borderColor=C.gold+"55";
                      e.currentTarget.style.color=C.gold;
                    }}
                    onMouseLeave={e=>{
                      e.currentTarget.style.borderColor=C.border2;
                      e.currentTarget.style.color=showToken?C.gold:C.dim;
                    }}
                  >
                    {showToken?(
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ):(
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {credits!==null&&(
                  <div style={{padding:"12px 15px",background:`${C.green}12`,border:`1px solid ${C.green}33`,borderRadius:12,fontSize:13,color:C.green,fontWeight:900,whiteSpace:"nowrap",width:isMobile?"100%":"auto",textAlign:"center"}}>
                    {credits===999?"∞ demo":`${credits} credit${credits!==1?"s":""} left`}
                  </div>
                )}
              </div>
              {compareMode&&<div style={{fontSize:12,color:C.amber,marginTop:-8,marginBottom:16,fontWeight:800}}>⚡ Comparison mode uses 2 credits (one per creative)</div>}
              {(()=>{
                const fmt=getCreativeFormat(form.type,file);
                const needsFile=productionStage==="final"&&fmt!=="text"&&fmt!=="audio";
                const needsScript=productionStage==="concept"||fmt==="text"||fmt==="audio";
                const disabled=!form.brand
                  ||(productionStage==="concept"&&form.script.trim().length<100)
                  ||(productionStage==="storyboard"&&storyboardFiles.length<2)
                  ||(productionStage==="roughcut"&&(!file||!file.type.startsWith("video/")))
                  ||(needsFile&&!file)
                  ||(needsScript&&!form.script.trim())
                  ||(compareMode&&productionStage==="final"&&needsFile&&!fileB)
                  ||(compareMode&&productionStage==="final"&&needsScript&&!formB.script.trim());
                return(
                  <button onClick={handleAnalyze} disabled={disabled} onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform="scale(0.98)";}} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{width:"100%",padding:isMobile?17:20,borderRadius:14,border:"none",background:disabled?C.s3:`linear-gradient(135deg,${C.goldL},${C.gold})`,color:disabled?C.dim:C.ink,fontSize:isMobile?16:18,fontWeight:900,cursor:disabled?"not-allowed":"pointer",boxShadow:disabled?"none":`0 18px 46px ${C.gold}28`,transition:"transform 0.12s ease, box-shadow 0.18s ease"}}>
                    Run AdCritIQ Analysis
                  </button>
                );
              })()}
            </section>
          </div>
        </main>
      {pricingModal}
      {certificateModal}
      {shareModal}
    </div>
    );
  }

  // ============================================================
  // ANALYZING SCREEN
  // ============================================================
  if(stage==="analyzing"){
    const analyzingCreativeFormat=productionStage==="concept"?"text":getCreativeFormat(form.type,file);
    const signalStages=[
      ["Ingest",5],
      ["Frame / Script Decode",18],
      ["Neural Metrics",36],
      ["Platform Fit",56],
      ["Outcome Forecast",76],
      ["CMO Playbook",92],
      ["Report Ready",100],
    ];
    const activeSignalStage=signalStages.reduce((last,stage)=>progress>=stage[1]?stage:last,signalStages[0]);
    const computationLabels=[
      "Estimating memory encoding probability",
      "Checking brand linkage during peak attention",
      "Comparing platform-fit signals",
      "Separating creative-led risk from media-dependent risk",
      "Building CMO decision lens",
    ];
    const liveComputation=computationLabels[Math.min(computationLabels.length-1,Math.floor(Math.max(progress,0)/22))];
    const formatContext=productionStage==="concept"
      ?"Projecting concept strength before production spend."
      :productionStage==="storyboard"
        ?"Reading storyboard flow, frame sequence, brand role and narrative clarity."
        :analyzingCreativeFormat==="static_image"
          ?"Reading visual hierarchy, stopping power, message clarity and recall cues."
          :analyzingCreativeFormat==="motion_static"
            ?"Reading first-frame strength, motion salience, loop clarity and fatigue risk."
            :analyzingCreativeFormat==="audio"
              ?"Reading transcript, sonic cues, voice clarity and response potential."
              :analyzingCreativeFormat==="text"
                ?"Reading proposition clarity, persuasion, memorability and CTA strength."
                :"Reading motion, pacing, hook, hold and completion signals.";
    return(
      <div style={{minHeight:"100vh",background:`radial-gradient(circle at 20% 15%,${C.gold}14 0%,transparent 28%),radial-gradient(circle at 85% 18%,${C.cyan}10 0%,transparent 26%),linear-gradient(180deg,${C.bg},${C.ink})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isMobile?20:40,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif",overflow:"hidden",position:"relative"}}>
        <style>{`@keyframes pulse{0%,100%{opacity:.45}50%{opacity:1}}@keyframes signalDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes ringFlow{to{stroke-dashoffset:-120}}@keyframes coreGlow{0%,100%{filter:drop-shadow(0 0 10px rgba(216,180,90,.28))}50%{filter:drop-shadow(0 0 26px rgba(45,212,191,.34))}}`}</style>
        <div aria-hidden="true" style={{position:"absolute",inset:"auto auto -180px -160px",width:420,height:420,borderRadius:"50%",background:`radial-gradient(circle,${C.cyan}10,transparent 66%)`,animation:"signalDrift 7s ease-in-out infinite"}}/>
        <div aria-hidden="true" style={{position:"absolute",top:-220,right:-170,width:480,height:480,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}12,transparent 65%)`,animation:"signalDrift 8s ease-in-out 1s infinite"}}/>
        <div style={{width:"100%",maxWidth:1040,position:"relative",zIndex:1}}>
          <div style={{background:`linear-gradient(145deg,${C.s1},${C.s2})`,border:`1px solid ${C.border}`,borderTop:`1px solid ${isDarkMode?"rgba(255,255,255,0.11)":"rgba(255,255,255,0.9)"}`,borderRadius:isMobile?22:28,padding:isMobile?22:34,boxShadow:isDarkMode?`0 34px 110px ${C.shadow}, 0 0 80px ${C.gold}12`:"0 28px 90px rgba(0,0,0,0.12), 0 10px 28px rgba(0,0,0,0.08)",overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,0.9fr) minmax(280px,0.7fr)",gap:isMobile?24:34,alignItems:"center"}}>
              <div style={{textAlign:isMobile?"center":"left"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:999,background:`${C.gold}12`,border:`1px solid ${C.gold}33`,color:C.gold,fontSize:10,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 14px ${C.green}`,animation:"pulse 1.4s ease-in-out infinite"}}/>
                  AdCritIQ™ Signal Engine
                </div>
                <h2 style={{fontSize:isMobile?34:50,fontWeight:850,margin:"0 0 12px",fontFamily:"'Playfair Display',serif",letterSpacing:0,lineHeight:0.96}}>Forecasting Creative Outcomes</h2>
                <p style={{margin:"0 0 18px",color:C.dim,fontSize:isMobile?14:16,lineHeight:1.7,maxWidth:560}}>Mapping attention, memory, platform fit, and media-waste risk before spend.</p>
                <div style={{padding:"14px 16px",borderRadius:16,background:`linear-gradient(135deg,${C.gold}0f,${C.cyan}09)`,border:`1px solid ${C.border}`,marginBottom:18}}>
                  <div style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.14em",fontWeight:900,textTransform:"uppercase",marginBottom:6}}>Active Readout</div>
                  <div style={{fontSize:15,color:C.text,fontWeight:850,marginBottom:4}}>{progressMsg||activeSignalStage[0]}</div>
                  <div style={{fontSize:12,color:C.dim,lineHeight:1.5}}>{formatContext}</div>
                </div>
                <div style={{width:"100%",height:9,borderRadius:999,background:C.s3,overflow:"hidden",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.16)",marginBottom:12}}>
                  <div style={{height:"100%",borderRadius:999,background:`linear-gradient(90deg,${C.gold},${C.cyan})`,width:`${progress}%`,transition:"width 0.5s ease",boxShadow:`0 0 18px ${C.gold}55`}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:18}}>
                  <div style={{fontSize:12,color:C.dim,fontFamily:"'DM Mono',monospace"}}>{progress}% complete</div>
                  <div style={{fontSize:11,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em",fontWeight:900,textTransform:"uppercase"}}>{activeSignalStage[0]}</div>
                </div>
              </div>

              <div style={{position:"relative",minHeight:isMobile?280:360,display:"grid",placeItems:"center"}}>
                <svg width="100%" viewBox="0 0 420 360" role="img" aria-label="Neural signal processing visualization" style={{maxWidth:420,overflow:"visible"}}>
                  <defs>
                    <radialGradient id="signalCore" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={C.gold}/>
                      <stop offset="58%" stopColor={C.cyan}/>
                      <stop offset="100%" stopColor={C.s2}/>
                    </radialGradient>
                  </defs>
                  <circle cx="210" cy="180" r="118" fill="none" stroke={C.border2} strokeWidth="1"/>
                  <circle cx="210" cy="180" r="86" fill="none" stroke={C.gold} strokeWidth="1.4" opacity="0.26" strokeDasharray="7 10" style={{animation:"ringFlow 6s linear infinite"}}/>
                  <circle cx="210" cy="180" r="48" fill="url(#signalCore)" opacity="0.18"/>
                  <circle cx="210" cy="180" r="30" fill={C.gold} opacity="0.9" style={{animation:"coreGlow 2.4s ease-in-out infinite"}}/>
                  <text x="210" y="176" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="9" fill={isDarkMode?C.ink:C.bg} fontWeight="900">CREATIVE</text>
                  <text x="210" y="190" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="8" fill={isDarkMode?C.ink:C.bg} fontWeight="900">SIGNAL</text>
                  {[
                    ["Attention",210,48,C.green],
                    ["Memory",318,116,C.cyan],
                    ["Emotion",318,244,C.pink],
                    ["Platform Fit",210,312,C.blue],
                    ["Outcome",102,244,C.gold],
                    ["Risk",102,116,C.red],
                  ].map(([label,x,y,color],i)=>(
                    <g key={label}>
                      <line x1="210" y1="180" x2={x} y2={y} stroke={color} strokeWidth="1.2" opacity="0.28" strokeDasharray="6 7" style={{animation:`ringFlow ${3+i*.35}s linear infinite`}}/>
                      <circle cx={x} cy={y} r="22" fill={color} opacity="0.14"/>
                      <circle cx={x} cy={y} r="10" fill={color} opacity="0.88" style={{animation:`pulse ${1.8+i*.18}s ease-in-out infinite`}}/>
                      <text x={x} y={y+(y<180?-28:38)} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="10" fill={color} fontWeight="900" letterSpacing="1">{label.toString().toUpperCase()}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(7,1fr)",gap:8,marginTop:4}}>
              {signalStages.map(([label,threshold],idx)=>{
                const done=progress>=threshold;
                const current=activeSignalStage[0]===label;
                return(
                  <div key={label} style={{padding:"10px 9px",borderRadius:12,background:done?`${C.gold}12`:current?`${C.cyan}12`:C.s2,border:`1px solid ${done?C.gold+"44":current?C.cyan+"44":C.border}`,minHeight:54}}>
                    <div style={{fontSize:9,color:done?C.gold:current?C.cyan:C.dim,fontFamily:"'DM Mono',monospace",fontWeight:900,letterSpacing:"0.08em",marginBottom:5}}>0{idx+1}</div>
                    <div style={{fontSize:10,color:done||current?C.text:C.dim,fontWeight:850,lineHeight:1.25}}>{label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto",gap:14,alignItems:"center",marginTop:18,padding:"14px 16px",borderRadius:16,background:C.s2,border:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontSize:10,color:C.cyan,fontFamily:"'DM Mono',monospace",letterSpacing:"0.14em",fontWeight:900,textTransform:"uppercase",marginBottom:5}}>Live Computation</div>
                <div style={{fontSize:14,color:C.text,fontWeight:800,animation:"pulse 2.1s ease-in-out infinite"}}>{liveComputation}</div>
              </div>
              <div style={{fontSize:11,color:C.dim,lineHeight:1.5,maxWidth:isMobile?"100%":300,textAlign:isMobile?"left":"right"}}>
                This forecast is predictive, not biometric. No media-plan data is required.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RESULTS DASHBOARD
  // ============================================================
  if(stage==="results"&&results){
    const r=results;

    // FIX 1: get actual video duration from result or fall back gracefully
    const videoDuration = r.video_duration_seconds || r.duration_seconds || 20;

    const attn=r.attention_curve||Array(videoDuration).fill(50);
    const emot=r.emotion_curve||Array(videoDuration).fill(40);
    const emotTypes=r.emotion_types||r.emotion_types_curve||{};
    const br=r.brain_regions||{};
    const cl=r.cognitive_channels||r.cognitive_channel_load||r.channel_load||{};
    const ps=r.platform_scores||{};
    const sc=r.scenes||[];
    const ins=r.strategic_insights||r.insights||[];
    const cmo=r.cmo_actions||[];
    const snd=r.sound_analysis||{};
    const priv=r.privacy_and_data_audit||r.privacy||{};
    const comp=r.competitive_context||{};
    const s1s2=r.system1_vs_system2||60;
    const tw=getTakeaways(r);
    const pairGrid=isMobile?"1fr":"1fr 1fr";
    const threeGrid=isMobile?"1fr":isTablet?"1fr 1fr":"1fr 1fr 1fr";
    const scoreGrid=isMobile?"repeat(2,minmax(0,1fr))":"repeat(auto-fit,minmax(180px,1fr))";
    const platformGrid=isMobile?"repeat(2,minmax(0,1fr))":"repeat(auto-fit,minmax(160px,1fr))";
    const repoFilterGrid=isMobile?"1fr":isTablet?"1fr 140px":"1fr 160px auto";
    const barMetricContrastC={...C,muted:C.text};
    const metricScoreValues=[
      r.viral_potential,r.hook_strength,r.hold_rate,r.emotional_peak,
      r.brand_recall,r.memory_encoding,r.sound_off_survival,r.share_intent,
      r.creative_efficiency
    ].filter(v=>typeof v==="number");
    const visualOverallScore=typeof r.overall_score==="number"
      ? r.overall_score
      : metricScoreValues.length
        ? Math.round(metricScoreValues.reduce((a,b)=>a+b,0)/metricScoreValues.length)
        : gradeToVisualScore(r.overall_grade);
    const ringScore=Math.min(100,Math.max(0,visualOverallScore||65));
    const circumference=2*Math.PI*34;
    const ringColor=ringScore>=75?C.green:ringScore>=60?C.gold:ringScore>=40?C.orange:C.red;
    const miniLeft=isMobile?0:isTablet?208:C.sideW;
    const resultFormat=r.creative_format||getCreativeFormat(form.type,file);
    const resultStage=r.production_stage||productionStage||"final";
    const stageLabel={concept:"CONCEPT",storyboard:"STORYBOARD",roughcut:"ROUGH CUT",final:"FINAL"}[resultStage]||String(resultStage).toUpperCase();
    const savedAnalysisId=r.__savedAnalysisId||r.id||null;
    const certEligibility=computeCertificationEligibility(r);
    const canShowCertBlock=!isDemoMode&&!isSharedMode&&savedAnalysisId;
    const impactLabel=formatImpactLabel(resultFormat);
    const formatMetrics=r.format_metrics||{};
    const staticAttentionMetrics=[
      ["Stopping Power",formatMetrics.stopping_power??formatMetrics.first_frame_strength??formatMetrics.headline_strength??formatMetrics.voice_clarity??r.hook_strength,C.gold],
      ["Visual Hierarchy",formatMetrics.visual_hierarchy??formatMetrics.proposition_clarity??formatMetrics.script_fluency??r.creative_efficiency,C.cyan],
      ["Brand Prominence",formatMetrics.brand_prominence??r.brand_recall,C.green],
      ["Message Clarity",formatMetrics.message_clarity??formatMetrics.proposition_clarity??r.memory_encoding,C.purple],
      ["CTA Clarity",formatMetrics.cta_clarity??formatMetrics.cta_strength??formatMetrics.cta_recall??r.share_intent,C.amber],
      ["Clutter Risk",formatMetrics.clutter_risk??formatMetrics.claim_risk??r.ad_fatigue_risk,C.red],
    ].map(([label,value,color])=>[label,typeof value==="number"?value:0,color]);
    const deepAttentionRows=[
      ["Hook Capture Window","Neural capture in first 2s",r?.deep_neuro?.attention_deep?.hook_capture_window],
      ["Sustained Attention Index","Time above 50% threshold",r?.deep_neuro?.attention_deep?.sustained_attention_index],
      ["Attention Recovery Speed","Post-drop re-engagement",r?.deep_neuro?.attention_deep?.attention_recovery_speed],
      ["Cognitive Load Balance","Stimulus variation rhythm",r?.deep_neuro?.attention_deep?.cognitive_load_balance],
      ["Attention-Brand Coupling","Brand presence during peaks",r?.deep_neuro?.attention_deep?.attention_brand_coupling],
    ].filter(([, ,value])=>typeof value==="number");
    const emotionArcType=r?.deep_neuro?.emotion_deep?.emotional_arc_type;
    const valenceArousalPosition=r?.deep_neuro?.emotion_deep?.valence_arousal_position;
    const deepEmotionRows=[
      ["Peak-End Rule Score",r?.deep_neuro?.emotion_deep?.peak_end_rule_score],
      ["Mirror Neuron Index",r?.deep_neuro?.emotion_deep?.mirror_neuron_index],
      ["Emotional Contagion Index",r?.deep_neuro?.emotion_deep?.emotional_contagion_index],
      ["Emotional Coherence",r?.deep_neuro?.emotion_deep?.emotional_coherence],
    ].filter(([,value])=>typeof value==="number");
    const showDeepEmotion=Boolean(emotionArcType||valenceArousalPosition||deepEmotionRows.length||r?.deep_neuro?.emotion_deep?.emotion_deep_note);
    const soundDeepRows=[
      ["Audio-Visual Temporal Sync","STS binding (200ms window)",r?.deep_neuro?.sound_deep?.audio_visual_temporal_sync],
      ["Prosodic Persuasion Index","Voiceover neural effectiveness",r?.deep_neuro?.sound_deep?.prosodic_persuasion_index],
      ["Earworm Formation Probability","Sonic brand memory encoding",r?.deep_neuro?.sound_deep?.earworm_formation_probability],
      ["Real-World Audibility","Message clarity at ambient volume",r?.deep_neuro?.sound_deep?.real_world_audibility],
    ].filter(([, ,value])=>typeof value==="number");
    const showDeepSound=resultFormat!=="static_image"&&resultFormat!=="text"&&soundDeepRows.length>0;
    const outcomeForecast=r.outcome_forecast||null;
    const outcomeConfidence=r.outcome_confidence||{};
    const platformOutcomeForecast=r.platform_outcome_forecast||{};
    const latestCalibration=calibrationSummary?.calibrations?.[0]||null;
    const latestCalibrationResult=latestCalibration?.calibration_result||null;
    const latestCalibrationComparisons=latestCalibrationResult?.comparisons||[];
    const outcomeScoreColor=(v,invert=false)=>{
      if(typeof v!=="number")return C.dim;
      if(invert)return v<=35?C.green:v<=60?C.amber:C.red;
      return v>=75?C.green:v>=60?C.gold:v>=45?C.amber:C.red;
    };
    const outcomeBandLabel=(v,invert=false)=>{
      if(typeof v!=="number")return "Not available";
      if(invert)return v<=35?"Low risk":v<=60?"Moderate risk":"Likely media waste";
      return v>=75?"High probability":v>=60?"Moderate probability":v>=45?"At risk":"Creative-led risk";
    };
    const normalizeConfidenceLevel=(level)=>{
      const key=String(level||"").toLowerCase().replace(/\s+/g,"_").replace(/-/g,"_");
      return ["high","medium","low","data_limited","needs_human_review"].includes(key)?key:null;
    };
    const confidenceMeta=(level)=>{
      const key=normalizeConfidenceLevel(level)||"medium";
      return {
        high:{label:"High confidence",color:C.green},
        medium:{label:"Medium confidence",color:C.gold},
        low:{label:"Low confidence",color:C.amber},
        data_limited:{label:"Data-limited",color:C.dim},
        needs_human_review:{label:"Needs human review",color:C.red},
      }[key];
    };
    const isHumanReviewRisk=()=>(
      (typeof r.brand_safety==="number"&&r.brand_safety<55)||
      (typeof r.regulatory_compliance==="number"&&r.regulatory_compliance<55)||
      r?.privacy_and_data_audit?.dpdp_compliance_risk==="high"
    );
    const hasFormatEvidence=()=>{
      if(resultStage==="concept"||resultStage==="storyboard")return false;
      if(resultFormat==="static_image")return ["stopping_power","visual_hierarchy","brand_prominence","message_clarity"].some(k=>typeof formatMetrics?.[k]==="number");
      if(resultFormat==="motion_static")return ["first_frame_strength","loop_clarity","motion_salience"].some(k=>typeof formatMetrics?.[k]==="number");
      if(resultFormat==="audio")return ["voice_clarity","sonic_branding","cta_recall"].some(k=>typeof formatMetrics?.[k]==="number");
      if(resultFormat==="text")return ["headline_strength","proposition_clarity","cta_strength"].some(k=>typeof formatMetrics?.[k]==="number");
      return Array.isArray(r.attention_curve)&&r.attention_curve.length>=5;
    };
    const fallbackConfidence=(key,label,value,invert=false)=>{
      if(!outcomeForecast)return {level:"data_limited",reason:"Outcome forecast evidence is not available for this saved report."};
      if(isHumanReviewRisk())return {level:"needs_human_review",reason:"Brand safety, compliance, or privacy risk requires expert review before using this forecast to scale."};
      if(!hasFormatEvidence())return {level:"data_limited",reason:"The input has limited format-specific evidence, so treat this forecast as directional."};
      const platformAvg=bestOutcomePlatform?.score||0;
      if(key==="purchase_intent_lift"&&typeof value==="number"&&value<60&&platformAvg>=70){
        return {level:"medium",reason:"CTA and action-readiness signals are weaker, but platform fit is strong enough for controlled testing."};
      }
      if(key==="vtr_completion_potential"&&!isCompletionOutcomeRelevant){
        return {level:"data_limited",reason:"This format does not produce true VTR or completion evidence; the score is a view-through attention proxy."};
      }
      if(typeof value!=="number")return {level:"data_limited",reason:`${label} has insufficient scored evidence in this report.`};
      const strong=invert?value<=35:value>=75;
      const weak=invert?value>=65:value<45;
      if(strong)return {level:"high",reason:"Multiple creative signals support this forecast direction."};
      if(weak)return {level:"low",reason:"The supporting creative signals are weak or mixed, so validate before scaling spend."};
      return {level:"medium",reason:"Enough signals support a directional read, but one or more drivers should be monitored or calibrated."};
    };
    const getOutcomeConfidence=(key,label,value,invert=false)=>{
      const explicit=outcomeConfidence?.[key];
      if(explicit&&normalizeConfidenceLevel(explicit.level)){
        return {level:normalizeConfidenceLevel(explicit.level),reason:explicit.reason||fallbackConfidence(key,label,value,invert).reason};
      }
      return fallbackConfidence(key,label,value,invert);
    };
    const overallOutcomeConfidence=()=>{
      const explicit=normalizeConfidenceLevel(outcomeConfidence?.overall_confidence);
      if(explicit)return {level:explicit,reason:outcomeConfidence.overall_reason||"Forecast confidence reflects signal agreement, format evidence, platform fit, and calibration availability."};
      if(latestCalibrationResult?.confidence&&latestCalibrationResult.confidence!=="none"){
        return {level:normalizeConfidenceLevel(latestCalibrationResult.confidence)||"medium",reason:"Private actual-vs-predicted calibration data is available for this token."};
      }
      if(isHumanReviewRisk())return {level:"needs_human_review",reason:"Compliance, brand safety, or privacy risk means this forecast should be reviewed before scale decisions."};
      if(!hasFormatEvidence())return {level:"data_limited",reason:"This forecast is directional because format-specific evidence is limited or pre-production."};
      return {level:"medium",reason:"The forecast has enough diagnostic support for planning, but should be calibrated with actual campaign outcomes."};
    };
    const ConfidenceChip=({level})=>{
      const meta=confidenceMeta(level);
      return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:999,background:`${meta.color}14`,border:`1px solid ${meta.color}44`,color:meta.color,fontSize:9,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{meta.label}</span>;
    };
    const readableOutcomeKey=(key)=>({
      memory:"Memory Encoding",
      attention:"Attention Capture",
      emotion:"Emotional Peak",
      clarity:"Message Clarity",
      platform_fit:"Platform Fit",
      cta:"CTA Strength",
      brand_linkage:"Brand Linkage",
      low_memory:"Low Memory Encoding",
      weak_branding:"Weak Brand Linkage",
      poor_hook:"Weak Opening Hook",
      low_clarity:"Low Message Clarity",
      platform_mismatch:"Platform Mismatch",
      high_fatigue:"High Fatigue Risk",
      weak_cta:"Weak CTA",
    }[key]||String(key||"Not available").replace(/_/g," "));
    const platformOutcomeRows=[
      ["YouTube","youtube"],
      ["Meta","meta"],
      ["Instagram","instagram"],
      ["TikTok","tiktok"],
      ["TV","tv"],
      ["CTV / OTT","ctv_ott"],
      ["DOOH","dooh"],
      ["Programmatic Display","programmatic_display"],
      ["LinkedIn","linkedin"],
    ].map(([label,key])=>({label,key,data:platformOutcomeForecast?.[key]})).filter(row=>row.data);
    const bestOutcomePlatform=platformOutcomeRows.reduce((best,row)=>{
      const score=((row.data.brand_lift||0)+(row.data.performance_lift||0))/2;
      if(!best||score>best.score)return {...row,score};
      return best;
    },null);
    const forecastConfidence=overallOutcomeConfidence();
    const lowestBrandKpi=[
      ["Spontaneous Awareness",outcomeForecast?.spontaneous_awareness_lift],
      ["Aided Awareness",outcomeForecast?.aided_awareness_lift],
      ["Consideration",outcomeForecast?.consideration_lift],
      ["Purchase Intent",outcomeForecast?.purchase_intent_lift],
      ["Brand Memory",outcomeForecast?.brand_memory_efficiency],
    ].filter(([,v])=>typeof v==="number").sort((a,b)=>a[1]-b[1])[0];
    const highestBrandKpi=[
      ["Spontaneous Awareness",outcomeForecast?.spontaneous_awareness_lift],
      ["Aided Awareness",outcomeForecast?.aided_awareness_lift],
      ["Consideration",outcomeForecast?.consideration_lift],
      ["Purchase Intent",outcomeForecast?.purchase_intent_lift],
      ["Brand Memory",outcomeForecast?.brand_memory_efficiency],
    ].filter(([,v])=>typeof v==="number").sort((a,b)=>b[1]-a[1])[0];
    const isCompletionOutcomeRelevant=resultFormat==="video"||resultFormat==="motion_static";
    const completionOutcomeLabel=isCompletionOutcomeRelevant?"VTR / Completion Potential":"View-Through Attention Fit";
    const accountabilityDecision=outcomeForecast
      ? outcomeForecast.media_wastage_risk>=65
        ? "Protect media spend. Fix creative response before scaling budget."
        : outcomeForecast.creative_accountability>=65
          ? "Creative is the main lever. Improve the identified creative gap before blaming targeting."
          : outcomeForecast.media_dependency>=65
            ? "Creative is viable. Optimize platform mix, targeting, sequencing, and frequency."
            : "Proceed with controlled testing and monitor brand lift plus platform response together."
      : "";
    const diagnosticCard=(label,text,color=C.gold)=>(
      <div style={{marginTop:16,padding:"12px 14px",background:`${color}0d`,borderLeft:`3px solid ${color}`,borderRadius:8,fontSize:12,color:C.dim,lineHeight:1.65,fontStyle:"italic"}}>
        <span style={{color,fontStyle:"normal",fontWeight:900,marginRight:8,fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</span>
        {text}
      </div>
    );
    const tribeMetrics=r.tribe_metrics||{};
    const tribeMetricRows=[
      {key:"audio_visual_integration",label:"Audio-Visual Integration",sub:"STS cortical congruence",invert:false,tooltip:"How aligned are visual and audio signals? Predicts multisensory memory encoding."},
      {key:"cortical_coherence",label:"Cortical Coherence",sub:"Narrative neural consistency",invert:false,tooltip:"Does the ad activate consistent brain regions? Predicts story comprehension."},
      {key:"language_cortex_activation",label:"Language Cortex Activation",sub:"Broca's / Wernicke's engagement",invert:false,tooltip:"Strength of VO and copy neural encoding. Predicts verbal brand recall."},
      {key:"neural_peak_density",label:"Neural Peak Density",sub:"High-activation moments per 30s",invert:false,tooltip:"More peaks = more memorable moments = higher recall probability."},
      {key:"multisensory_fatigue_risk",label:"Multisensory Fatigue Risk",sub:"Cortical adaptation risk - lower is better",invert:true,tooltip:"Risk that the brain tunes out before brand appears. Below 30 is optimal."},
    ].map(metric=>({...metric,value:tribeMetrics?.[metric.key]})).filter(metric=>typeof metric.value==="number");
    const isTimelineAttention=resultFormat==="video"||resultFormat==="motion_static";
    const compareReady=compareMode&&resultsB;
    const compareLabelA=compareType==="brands"?(form.brand||labelA):labelA;
    const compareLabelB=compareType==="brands"?(formB.brand||labelB):labelB;
    const cmpNum=(obj,key)=>typeof obj?.[key]==="number"?obj[key]:0;
    const compareMetricList=[
      ["Viral Potential","viral_potential"],
      ["Hook Strength","hook_strength"],
      ["Hold Rate","hold_rate"],
      ["Emotional Peak","emotional_peak"],
      ["Brand Recall","brand_recall"],
      ["Memory Encoding","memory_encoding"],
      ["Sound-Off Survival","sound_off_survival"],
      ["Share Intent","share_intent"],
      ["Creative Efficiency","creative_efficiency"],
    ];
    const competitiveOwn=competitiveIntel?.own||null;
    const competitiveCompetitors=competitiveIntel?.competitors||[];
    const competitiveGapRows=COMPETITIVE_METRICS.map(([label,key])=>{
      const ownVal=competitiveOwn?.averages?.[key];
      const best=competitiveCompetitors.reduce((winner,competitor)=>{
        const val=competitor?.averages?.[key];
        if(typeof val!=="number")return winner;
        if(!winner||val>winner.value)return {brand:competitor.brand,value:val};
        return winner;
      },null);
      const gap=typeof ownVal==="number"&&best?ownVal-best.value:null;
      return {label,key,ownVal,best,gap};
    });
    const competitiveInsights=competitiveGapRows
      .filter(row=>typeof row.gap==="number"&&row.gap<0&&row.best)
      .sort((a,b)=>a.gap-b.gap)
      .slice(0,3)
      .map(row=>`Trailing ${row.best.brand} on ${row.label} by ${Math.abs(row.gap)} points — prioritize this gap in the next creative iteration.`);
    const dnaTraitCards=[
      ["🎭 Emotional Signature","emotional_signature"],
      ["🧠 Memory Architecture","memory_architecture"],
      ["👁 Attention Pattern","attention_pattern"],
      ["🌏 Cultural Rooting","cultural_rooting"],
    ];
    const dnaMetricColors=[C.gold,C.cyan,C.green,C.pink,C.orange,C.blue,C.purple,C.teal,C.amber,C.lime];
    const dnaConsistencyColor=(v)=>v>=80?C.green:v>=60?C.amber:C.red;
    const repoInputStyle={background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};
    const repoSelectStyle={...repoInputStyle,appearance:"auto",WebkitAppearance:"auto",MozAppearance:"auto"};
    const repoMiniButton={background:"transparent",border:`1px solid ${C.border2}`,borderRadius:5,padding:"4px 10px",fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",cursor:"pointer",letterSpacing:"0.06em"};
    const calibrationRows=calibrationData?.calibrations||[];
    const calibrationAgg=calibrationData?.summary||{};
    const calibrationInput=(key,label,placeholder="",type="number")=>(
      <label style={{display:"grid",gap:6,fontSize:10,fontWeight:900,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'DM Mono',monospace"}}>
        {label}
        <input
          type={type}
          value={calibrationForm[key]}
          onChange={e=>setCalibrationForm(prev=>({...prev,[key]:e.target.value}))}
          placeholder={placeholder}
          style={repoInputStyle}
        />
      </label>
    );
    const isCompetitorEntry=(a)=>a?.is_competitor===true||a?.full_result?.is_competitor===true;
    const analysisFormat=(a)=>a?.creative_type||a?.full_result?.creative_format||a?.full_result?.creative_subtype||"video";
    const analysisStage=(a)=>a?.production_stage||a?.full_result?.production_stage||"final";
    const analysisGrade=(a)=>a?.overall_grade||a?.full_result?.overall_grade||"—";
    const analysisHeadline=(a)=>a?.headline_verdict||a?.full_result?.headline_verdict||"";
    const gradeToNum=(g)=>{
      const map={"A+":100,A:93,"A-":88,"B+":83,B:78,"B-":73,"C+":68,C:63,"C-":58,D:50,F:30};
      return map[g]||0;
    };
    const groupAnalysesByBrand=(items)=>{
      const grouped=items.reduce((acc,a)=>{
        const brand=(a.brand||"Unknown Brand").trim()||"Unknown Brand";
        if(!acc[brand])acc[brand]=[];
        acc[brand].push(a);
        return acc;
      },{});
      Object.keys(grouped).forEach(brand=>{
        grouped[brand].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
      });
      return grouped;
    };
    const filteredRepoAnalyses=(savedAnalyses||[]).filter(a=>{
      if(isCompetitorEntry(a))return false;
      if(repoSearch&&!String(a.brand||"").toLowerCase().includes(repoSearch.toLowerCase()))return false;
      if(repoFilterFormat&&analysisFormat(a)!==repoFilterFormat)return false;
      if(repoFilterGrade&&analysisGrade(a)!==repoFilterGrade)return false;
      if(repoFilterStage&&analysisStage(a)!==repoFilterStage)return false;
      return true;
    });
    const groupedByBrand=groupAnalysesByBrand(filteredRepoAnalyses);
    const competitiveRows=(savedAnalyses||[]).filter(a=>{
      if(!isCompetitorEntry(a))return false;
      const target=String(a.competitor_of||a.full_result?.competitor_of||"").toLowerCase();
      return !competitiveBrand||target===competitiveBrand.toLowerCase();
    });
    const groupedCompetitorAnalyses=groupAnalysesByBrand(competitiveRows);
    const repoLoadAnalysis=(a)=>{
      const isComp=isCompetitorEntry(a);
      setResults({
        ...a.full_result,
        __savedAnalysisId:a.id,
        is_competitor:isComp,
        competitor_of:a.competitor_of||a.full_result?.competitor_of,
        is_certified:a.is_certified===true||a.full_result?.is_certified===true,
        cert_id:a.cert_id||a.full_result?.cert_id,
        cert_issued_at:a.cert_issued_at||a.full_result?.cert_issued_at,
      });
      setCertData(a.is_certified&&a.cert_id?{certified:true,cert_id:a.cert_id,cert_issued_at:a.cert_issued_at,brand:a.brand,campaign:a.campaign,industry:a.industry,creative_type:analysisFormat(a),grade:analysisGrade(a),key_scores:Object.fromEntries(CERT_SCORE_KEYS.map(([,key])=>[key,Math.round(a.full_result?.[key]||0)]))}:null);
      setDnaMatchData(null);
      setCalibrationForm(prev=>({...prev,analysis_id:a.id||prev.analysis_id}));
      setTab("summary");
    };
    const renderAnalysisRows=(items,brand,options={})=>(
      <div style={{border:`1px solid ${options.accent||C.gold}33`,borderTop:"none",borderRadius:"0 0 8px 8px",overflow:"hidden"}}>
        {items.map((a,idx)=>{
          const fmt=analysisFormat(a);
          const stage=analysisStage(a);
          const headline=analysisHeadline(a);
          const isCertified=a.is_certified===true||a.full_result?.is_certified===true;
          const certId=a.cert_id||a.full_result?.cert_id;
          const rowCertEligibility=computeCertificationEligibility(a.full_result);
          return(
            <div key={a.id||idx} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:idx%2===0?C.s1:C.s2,borderTop:idx>0?`1px solid ${C.border}`:"none",flexWrap:isMobile?"wrap":"nowrap"}}>
              <span style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",minWidth:80,flexShrink:0}}>
                {a.created_at?new Date(a.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
              </span>
              <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:C.cyan,background:"rgba(34,211,238,0.08)",border:"1px solid rgba(34,211,238,0.2)",padding:"2px 7px",borderRadius:4,flexShrink:0,textTransform:"uppercase"}}>
                {String(fmt||"video").replace(/_/g," ")}
              </span>
              {stage&&stage!=="final"&&(
                <span style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:C.amber,background:"rgba(245,158,11,0.08)",border:`1px solid ${C.amber}33`,padding:"2px 7px",borderRadius:4,flexShrink:0,textTransform:"uppercase"}}>
                  {stage}
                </span>
              )}
              <span style={{fontSize:12,fontWeight:900,color:C.gold,minWidth:28,flexShrink:0,fontFamily:"'DM Mono',monospace"}}>
                {analysisGrade(a)}
              </span>
              {isCertified&&certId&&(
                <button onClick={()=>openCertificateFromId(certId)} style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:C.ink,background:C.gold,border:`1px solid ${C.gold}`,padding:"3px 7px",borderRadius:999,flexShrink:0,textTransform:"uppercase",fontWeight:900,cursor:"pointer"}}>
                  🏅 Certified
                </button>
              )}
              {!isCertified&&rowCertEligibility.eligible&&(
                <button title="Load this report to issue an AdCritIQ certificate" onClick={()=>repoLoadAnalysis(a)} style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:C.gold,background:`${C.gold}14`,border:`1px solid ${C.gold}55`,padding:"3px 7px",borderRadius:999,flexShrink:0,textTransform:"uppercase",fontWeight:900,cursor:"pointer"}}>
                  🏅 Eligible
                </button>
              )}
              <span style={{fontSize:11,color:C.dim,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:isMobile?"normal":"nowrap",fontStyle:"italic",minWidth:0}}>
                {headline?`"${headline.slice(0,80)}${headline.length>80?"...":""}"`:"—"}
              </span>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>repoLoadAnalysis(a)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.gold}66`,borderRadius:6,color:C.gold,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  Load
                </button>
                <button onClick={()=>deleteSavedAnalysis(a.id)} style={{padding:"5px 12px",background:"transparent",border:`1px solid ${C.red}55`,borderRadius:6,color:C.red,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {items.length===1&&(
          <div style={{padding:"8px 16px",fontSize:10,color:C.muted,fontStyle:"italic",background:C.s2,borderTop:`1px solid ${C.border}`}}>
            Analyse more {brand} creatives to build trend data and unlock Brand DNA profile.
          </div>
        )}
      </div>
    );
    const gradeRank=(g)=>{
      const order=["A+","A","A-","B+","B","B-","C+","C","C-","D","F"];
      const idx=order.indexOf(g||"C");
      return idx<0?order.length:idx;
    };
    const compareWinnerLabel=()=>{
      const a=gradeRank(results?.overall_grade);
      const b=gradeRank(resultsB?.overall_grade);
      if(a<b)return compareLabelA;
      if(b<a)return compareLabelB;
      const avgA=compareMetricList.reduce((sum,[,key])=>sum+cmpNum(results,key),0)/compareMetricList.length;
      const avgB=compareMetricList.reduce((sum,[,key])=>sum+cmpNum(resultsB,key),0)/compareMetricList.length;
      if(avgA>avgB)return compareLabelA;
      if(avgB>avgA)return compareLabelB;
      return "Tied";
    };
    const compareScoreColor=(v)=>v>=75?C.green:v>=60?C.amber:v>=40?C.orange:C.red;
    const comparePlatforms=[
      ["YouTube 6s Bumper","youtube_preroll_6s"],
      ["YouTube In-Stream","youtube_instream"],
      ["Instagram Reels","instagram_reels"],
      ["Instagram Stories","instagram_stories"],
      ["Instagram Feed","instagram_feed"],
      ["Meta Feed","meta_feed"],
      ["TikTok","tiktok"],
      ["LinkedIn Feed","linkedin_feed"],
      ["Twitter/X","twitter_x"],
      ["TV Broadcast","tv_broadcast"],
      ["CTV/OTT","ctv_ott"],
      ["YouTube 15s Pre-Roll","youtube_preroll_15s"],
      ["Meta Stories","meta_stories"],
      ["DOOH","dooh"],
      ["Programmatic Display","programmatic_display"],
    ].map(([name,key])=>{
      const a=cmpNum(results?.platform_scores,key);
      const b=cmpNum(resultsB?.platform_scores,key);
      return {name,key,a,b,diff:Math.abs(a-b),winner:a>b?"A":b>a?"B":"—"};
    }).sort((a,b)=>b.diff-a.diff);
    const domainWinner=(aKeys,bKeys=aKeys)=>{
      const a=aKeys.reduce((sum,key)=>sum+cmpNum(results,key),0)/aKeys.length;
      const b=bKeys.reduce((sum,key)=>sum+cmpNum(resultsB,key),0)/bKeys.length;
      return a>b?compareLabelA:b>a?compareLabelB:"Tied";
    };
    const otherLabel=compareWinnerLabel()===compareLabelA?compareLabelB:compareLabelA;

    // FIX 1: dynamic heatmap label spacing — max 12 labels regardless of duration
    const heatmapLabelCount = Math.min(attn.length, 12);
    const heatmapLabelStep  = Math.ceil(attn.length / heatmapLabelCount);
    const heatmapLabels = Array.from(
      { length: Math.floor(attn.length / heatmapLabelStep) + 1 },
      (_, i) => Math.min(i * heatmapLabelStep, attn.length)
    );

    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'Inter','DM Sans',sans-serif",color:C.text,animation:"fadeIn 0.5s ease both"}}>
        {scrolled&&(
          <div style={{position:"fixed",top:0,left:miniLeft,right:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:isMobile?"10px 16px":"10px 28px",background:miniHeaderBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,animation:"fadeIn 0.2s ease both"}}>
            <span style={{fontWeight:700,color:C.text,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              <span>{form.brand||"AdCritIQ"}</span>
              <span style={{color:C.dim,fontWeight:400,fontSize:11,marginLeft:10,fontFamily:"monospace"}}>
                {form.industry||"Creative"} · {form.country||form.market||"India"}
              </span>
              <span style={{display:isMobile?"none":"block",fontSize:9,color:C.muted,fontStyle:"italic",letterSpacing:"0.04em",marginTop:1}}>
                Just the signal before the spend.
              </span>
            </span>
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              {ThemeToggle}
              <span style={{padding:"3px 12px",borderRadius:8,fontWeight:800,fontFamily:"monospace",color:ringColor,border:`1px solid ${ringColor}55`,background:`${ringColor}12`}}>
                {r.overall_grade||grade(ringScore)}
              </span>
            </div>
          </div>
        )}

        {/* ── LEFT SIDEBAR ── */}
        <Sidebar
          C={C}
          NAV_TABS={NAV_TABS}
          tab={tab}
          setTab={setDashboardTab}
          grade={r.overall_grade}
          brand={form.brand}
          isDarkMode={isDarkMode}
          compareMode={compareMode}
          resultsB={resultsB}
          onNew={resetToForm}
          downloading={downloading}
          onDownload={async()=>{
            setDownloading(true);
            try{ await generateBrainEncoderPDF(r, form); }
            catch(e){ alert("PDF generation failed: "+e.message); }
            finally{ setDownloading(false); }
          }}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {/* ── MAIN CONTENT ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowY:"auto",width:"100%"}}>
          {isDemoMode&&(
            <div style={{margin:isMobile?"14px 14px 0":"18px 36px 0",padding:isMobile?"14px 16px":"16px 20px",borderRadius:14,border:`1px solid ${C.gold}55`,background:`linear-gradient(135deg,${C.gold}16,rgba(255,255,255,0.025))`,boxShadow:`0 18px 48px ${C.gold}10`,display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,color:C.gold,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:5}}>Sample Report</div>
                <div style={{fontSize:13,color:C.dim,lineHeight:1.6}}>
                  You are viewing a saved AdCritIQ™ report. No upload, token, or credit was used.
                </div>
              </div>
              <button onClick={resetToForm} style={{alignSelf:isMobile?"stretch":"center",padding:"10px 15px",borderRadius:10,border:`1px solid ${C.gold}66`,background:C.gold,color:C.ink,fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>
                Analyse Your Creative
              </button>
            </div>
          )}
          {isSharedMode&&(
            <div style={{margin:isMobile?"14px 14px 0":"18px 36px 0",padding:isMobile?"14px 16px":"15px 20px",borderRadius:14,border:"1px solid rgba(16,185,129,0.32)",background:"linear-gradient(90deg,rgba(16,185,129,0.09),rgba(255,255,255,0.025))",boxShadow:"0 18px 48px rgba(16,185,129,0.08)",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
              <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
                <span style={{fontSize:17,flexShrink:0}}>🔗</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:900,color:"#10B981",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Shared Report</div>
                  <div style={{fontSize:12,color:C.dim,lineHeight:1.5}}>Neural creative intelligence report by AdCritIQ™</div>
                </div>
              </div>
              <button
                onClick={()=>{
                  setIsSharedMode(false);
                  setResults(null);
                  setShareToken(null);
                  setShareUrl("");
                  setShowShareModal(false);
                  setShareCopied(false);
                  setStage("landing");
                  setTab("summary");
                }}
                style={{alignSelf:isMobile?"stretch":"center",padding:"9px 16px",border:"none",borderRadius:9,background:"#10B981",color:C.ink,fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}
              >
                Analyse Your Creative →
              </button>
            </div>
          )}
          {compareReady ? (
            <>
              <div style={{background:resultsHeaderBg,borderBottom:`1px solid ${C.border}`,padding:isMobile?"18px":"24px 36px",position:"sticky",top:0,zIndex:40,backdropFilter:"blur(16px)"}}>
                <div style={{fontSize:11,color:C.gold,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",fontWeight:900,marginBottom:8}}>A/B Creative Comparison</div>
                <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16,flexDirection:isMobile?"column":"row"}}>
                  <div>
                    <h1 style={{fontSize:isMobile?24:32,fontWeight:900,margin:0,fontFamily:"'Playfair Display',serif",letterSpacing:0}}>Which creative should you run?</h1>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.6,margin:"8px 0 0"}}>
                      {compareType==="brands" ? `Competitive benchmarking: ${compareLabelA} vs ${compareLabelB}` : `${compareLabelA} vs ${compareLabelB}`} · {form.industry||"Creative"} · {form.country||form.market||"India"}
                    </p>
                  </div>
                  <div style={{padding:"10px 16px",borderRadius:12,background:`${C.gold}12`,border:`1px solid ${C.gold}44`,color:C.gold,fontSize:12,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>
                    Winner: {compareWinnerLabel()}
                  </div>
                </div>
              </div>

              <div style={{display:"flex",gap:8,padding:isMobile?"14px 14px 0":"18px 28px 0",borderBottom:`1px solid ${C.border}`,overflowX:"auto",background:C.bg}}>
                {["overview","metrics","platforms","recommendation"].map(t=>(
                  <button
                    key={t}
                    onClick={()=>setCompareTab(t)}
                    style={{
                      padding:"9px 16px",
                      background:compareTab===t?`${C.gold}18`:"transparent",
                      border:`1px solid ${compareTab===t?C.gold+"66":C.border}`,
                      borderRadius:9,
                      color:compareTab===t?C.gold:C.dim,
                      fontSize:12,
                      fontWeight:compareTab===t?900:700,
                      cursor:"pointer",
                      whiteSpace:"nowrap",
                      textTransform:"capitalize",
                      transition:"all 0.15s ease",
                      fontFamily:"'Inter','DM Sans',sans-serif"
                    }}
                  >
                    {t==="overview"?"📊 Overview":t==="metrics"?"🧠 17 Metrics":t==="platforms"?"📱 Platforms":"🏆 Recommendation"}
                  </button>
                ))}
              </div>

              <div style={{padding:isMobile?"22px 14px":"32px 36px",maxWidth:1300,width:"100%",boxSizing:"border-box",margin:"0 auto"}}>
                {compareTab==="overview"&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18}}>
                    {[{label:compareLabelA,r:results,side:"A"},{label:compareLabelB,r:resultsB,side:"B"}].map(({label,r,side})=>{
                      const isWinner=compareWinnerLabel()===label;
                      return(
                        <div key={side} style={{background:C.s1,border:`1px solid ${isWinner?C.gold+"77":C.border}`,borderRadius:16,padding:isMobile?20:26,boxShadow:isWinner?`0 0 34px ${C.gold}22`:`0 18px 46px ${C.shadow}`,position:"relative"}}>
                          {isWinner&&<div style={{position:"absolute",top:-11,right:18,background:C.gold,color:C.ink,padding:"4px 11px",borderRadius:999,fontSize:10,fontWeight:900,letterSpacing:"0.12em",fontFamily:"'DM Mono',monospace"}}>🏆 WINNER</div>}
                          <div style={{fontSize:11,color:C.dim,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginBottom:12}}>
                            {compareType==="brands"?`🆚 ${label}`:`CREATIVE ${side} — ${label.toUpperCase()}`}
                          </div>
                          <div style={{fontSize:60,fontWeight:900,color:isWinner?C.gold:C.dim,lineHeight:1,marginBottom:10,fontFamily:"'DM Mono',monospace"}}>{r?.overall_grade||"—"}</div>
                          <div style={{fontSize:13,color:C.dim,fontStyle:"italic",lineHeight:1.6,minHeight:42}}>{r?.headline_verdict||""}</div>
                          <div style={{marginTop:18,display:"flex",gap:9,flexWrap:"wrap"}}>
                            {[["Hook",r?.hook_strength],["Recall",r?.brand_recall],["Viral",r?.viral_potential]].map(([name,val])=>(
                              <div key={name} style={{padding:"7px 11px",background:C.s2,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}}>
                                <span style={{color:C.dim}}>{name} </span>
                                <span style={{fontWeight:900,color:typeof val==="number"?compareScoreColor(val):C.muted}}>{typeof val==="number"?val:"—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {compareTab==="metrics"&&(()=>{
                  let aWins=0,bWins=0,ties=0;
                  compareMetricList.forEach(([,key])=>{const a=cmpNum(results,key),b=cmpNum(resultsB,key);if(a>b)aWins++;else if(b>a)bWins++;else ties++;});
                  return(
                    <div style={{display:"grid",gap:12}}>
                      {compareMetricList.map(([name,key])=>{
                        const a=cmpNum(results,key),b=cmpNum(resultsB,key);
                        const aWin=a>b,bWin=b>a;
                        return(
                          <div key={key} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(160px,1fr) 170px minmax(160px,1fr)",gap:14,alignItems:"center",padding:16,borderRadius:14,background:C.s1,border:`1px solid ${C.border}`}}>
                            <div style={{display:"grid",gap:7}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:aWin?C.gold:C.dim,fontWeight:900}}><span>{compareLabelA}</span><span>{a}</span></div>
                              <div style={{height:7,borderRadius:999,background:C.s3,overflow:"hidden",borderBottom:aWin?`2px solid ${C.gold}`:"none"}}><div style={{height:"100%",width:`${a}%`,background:aWin?C.gold:compareScoreColor(a),borderRadius:999}}/></div>
                            </div>
                            <div style={{fontSize:11,color:C.dim,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:1,textAlign:"center"}}>{name}</div>
                            <div style={{display:"grid",gap:7}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:bWin?C.gold:C.dim,fontWeight:900}}><span>{compareLabelB}</span><span>{b}</span></div>
                              <div style={{height:7,borderRadius:999,background:C.s3,overflow:"hidden",borderBottom:bWin?`2px solid ${C.gold}`:"none"}}><div style={{height:"100%",width:`${b}%`,background:bWin?C.gold:compareScoreColor(b),borderRadius:999}}/></div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginTop:12}}>
                        <span style={{padding:"8px 13px",borderRadius:999,background:`${C.gold}14`,border:`1px solid ${C.gold}44`,color:C.gold,fontWeight:900}}>A wins {aWins}</span>
                        <span style={{padding:"8px 13px",borderRadius:999,background:C.s2,border:`1px solid ${C.border}`,color:C.dim,fontWeight:900}}>Tied {ties}</span>
                        <span style={{padding:"8px 13px",borderRadius:999,background:`${C.cyan}14`,border:`1px solid ${C.cyan}44`,color:C.cyan,fontWeight:900}}>B wins {bWins}</span>
                      </div>
                    </div>
                  );
                })()}

                {compareTab==="platforms"&&(
                  <div style={{display:"grid",gap:10}}>
                    {comparePlatforms.map(p=>(
                      <div key={p.key} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.2fr 80px 38px 80px 70px",gap:12,alignItems:"center",padding:"13px 16px",borderRadius:12,background:C.s1,border:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",alignItems:"center",minWidth:0}}><PlatformChip name={p.name} C={C}/><span style={{fontWeight:800,color:C.text,fontSize:13}}>{p.name}</span></div>
                        <div style={{color:p.winner==="A"?C.gold:compareScoreColor(p.a),fontWeight:900,textAlign:isMobile?"left":"right"}}>{compareLabelA}: {p.a}</div>
                        <div style={{color:C.muted,textAlign:"center",fontFamily:"'DM Mono',monospace"}}>vs</div>
                        <div style={{color:p.winner==="B"?C.gold:compareScoreColor(p.b),fontWeight:900}}>{compareLabelB}: {p.b}</div>
                        <div style={{justifySelf:isMobile?"start":"end",padding:"4px 10px",borderRadius:999,background:p.winner==="—"?C.s2:`${C.gold}14`,border:`1px solid ${p.winner==="—"?C.border:C.gold+"44"}`,color:p.winner==="—"?C.dim:C.gold,fontSize:11,fontWeight:900}}>Winner {p.winner}</div>
                      </div>
                    ))}
                  </div>
                )}

                {compareTab==="recommendation"&&(()=>{
                  const overall=compareWinnerLabel();
                  const recs=[
                    ["DEPLOY FOR TV/CTV",domainWinner(["brand_recall","hold_rate"]),"Based on brand recall plus hold-rate strength for longer-viewing environments."],
                    ["DEPLOY FOR SOCIAL",domainWinner(["hook_strength","viral_potential"]),"Based on opening hook and shareability pressure in fast-feed contexts."],
                    ["EMOTIONAL IMPACT",domainWinner(["emotional_peak","share_intent"]),"Based on emotional peak and the likelihood of audience sharing."],
                    ["OVERALL RECOMMENDATION",overall,overall==="Tied"?"Both cuts are close. Use platform-specific scores to decide media allocation.":`${overall} has the stronger overall grade and metric profile.`],
                  ];
                  return(
                    <div style={{display:"grid",gap:18}}>
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:18}}>
                        {recs.map(([title,winner,reason])=>(
                          <div key={title} style={{padding:22,borderRadius:16,background:C.s1,border:`1px solid ${C.gold}33`,boxShadow:`0 18px 44px ${C.shadow}`}}>
                            <div style={{fontSize:11,color:C.gold,fontWeight:900,letterSpacing:1.4,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>{title}</div>
                            <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:999,background:`${C.gold}16`,border:`1px solid ${C.gold}44`,color:C.gold,fontSize:12,fontWeight:900,marginBottom:12}}>Winner: {winner}</div>
                            <p style={{fontSize:14,color:C.dim,lineHeight:1.7,margin:0}}>{reason}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{padding:24,borderRadius:18,background:`linear-gradient(135deg,${C.gold}18,${C.s1})`,border:`1px solid ${C.gold}44`,color:C.text,fontSize:16,fontWeight:800,lineHeight:1.7}}>
                        {overall==="Tied" ? "Run both creatives selectively. Use the Platforms tab to allocate each cut to the environments where it outperforms." : `Run ${overall} as the lead creative. Consider ${otherLabel} for any specific platform where it outperforms in the Platforms tab.`}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{padding:"24px 36px 20px",borderTop:`1px solid ${C.border}`,textAlign:"center",fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginTop:"auto"}}>
                AdCritIQ™ · A/B Creative Comparison · {new Date().getFullYear()}
              </div>
            </>
          ) : (
            <>

          {/* Top header bar */}
          <div style={{background:resultsHeaderBg,borderBottom:`1px solid ${C.border}`,padding:isMobile?"16px 18px":"20px 36px",position:"sticky",top:0,zIndex:40,backdropFilter:"blur(16px)"}}>
            <div style={{display:"flex",alignItems:isMobile?"stretch":"flex-start",justifyContent:"space-between",gap:16,flexDirection:isMobile?"column":"row"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontFamily:"'DM Mono',monospace"}}>
                  {form.industry||""}{form.market?` · ${form.market}`:""}{form.type?` · ${form.type}`:""} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                </div>
                <h1 style={{fontSize:isMobile?20:22,fontWeight:800,color:C.text,margin:0,letterSpacing:0,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>
                  {form.brand}{form.campaign?<span style={{fontWeight:400,color:C.dim}}> — {form.campaign}</span>:""}
                </h1>
                {resultStage!=="final"&&(
                  <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:8,padding:"5px 10px",borderRadius:999,border:`1px solid ${C.gold}55`,background:`${C.gold}12`,color:C.gold,fontSize:10,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>
                    {stageLabel} · projected scores
                  </div>
                )}
                {r.is_competitor&&(
                  <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:8,marginLeft:resultStage!=="final"&&!isMobile?8:0,padding:"5px 10px",borderRadius:999,border:`1px solid ${C.purple}66`,background:`${C.purple}18`,color:C.purple,fontSize:10,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>
                    COMPETITOR INTEL — vs {r.competitor_of||competitorOf||"Your Brand"}
                  </div>
                )}
                {r.headline_verdict&&<div style={{fontSize:13,color:C.dim,marginTop:6,fontStyle:"italic",opacity:1}}>"{r.headline_verdict}"</div>}
              </div>

              {/* FIX 2: Grade badge with hover tooltip */}
              <div style={{display:"flex",alignItems:"flex-start",gap:12,justifyContent:isMobile?"space-between":"flex-end"}}>
              {ThemeToggle}
              {r.overall_grade&&(()=>{
                const gc=r.overall_grade==="A+"||r.overall_grade==="A"||r.overall_grade==="A-"?C.green:r.overall_grade?.startsWith("B")?C.amber:r.overall_grade?.startsWith("C")?C.gold:C.red;
                return(
                  <div style={{flexShrink:0,position:"relative"}}
                    onMouseEnter={()=>setGradeTooltipVisible(true)}
                    onMouseLeave={()=>setGradeTooltipVisible(false)}
                  >
                    <div style={{display:"grid",justifyItems:"center",gap:6,cursor:"help"}}>
                      <div style={{position:"relative",width:88,height:88}}>
                        <svg width="88" height="88" style={{transform:"rotate(-90deg)"}}>
                          <circle cx="44" cy="44" r="34" fill="none" stroke={isDarkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.08)"} strokeWidth="5"/>
                          <circle
                            cx="44"
                            cy="44"
                            r="34"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference}
                            style={{
                              animation:"ringDraw 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards",
                              "--ring-target":circumference*(1-ringScore/100),
                              filter:`drop-shadow(0 0 6px ${ringColor}66)`,
                            }}
                          />
                        </svg>
                        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:26,fontWeight:800,color:ringColor,fontFamily:"monospace",letterSpacing:0,animation:"fadeIn 0.5s ease 1.2s both"}}>{r.overall_grade}</span>
                          <span style={{fontSize:7,color:C.dim,letterSpacing:"0.15em",fontFamily:"monospace"}}>GRADE</span>
                        </div>
                      </div>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:0.5}}>hover for scale</div>
                    </div>

                    {/* Tooltip */}
                    {gradeTooltipVisible&&(
                      <div style={{
                        position:"absolute",top:"calc(100% + 8px)",right:0,
                        width:270,background:"#0d0d1f",
                        border:`1px solid ${C.border2}`,borderRadius:12,
                        padding:"16px 18px",zIndex:200,
                        boxShadow:"0 8px 40px rgba(0,0,0,0.7)",
                      }}>
                        <div style={{fontSize:9,fontWeight:700,letterSpacing:2,color:C.gold,marginBottom:12,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
                          Grade Scale
                        </div>
                        {[
                          {g:"A+", range:"90–100", c:C.green},
                          {g:"A",  range:"85–89",  c:C.green},
                          {g:"A−", range:"80–84",  c:C.cyan},
                          {g:"B+", range:"75–79",  c:C.amber},
                          {g:"B",  range:"70–74",  c:C.amber},
                          {g:"B−", range:"65–69",  c:C.orange},
                          {g:"C+", range:"60–64",  c:C.orange},
                          {g:"C",  range:"55–59",  c:C.red},
                          {g:"D/F",range:"Below 55",c:C.red},
                        ].map(({g,range,c})=>(
                          <div key={g} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                            <span style={{fontWeight:800,fontSize:12,color:c,minWidth:28,fontFamily:"'DM Mono',monospace"}}>{g}</span>
                            <div style={{flex:1,height:3,borderRadius:2,background:c,opacity:0.5}}/>
                            <span style={{fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",minWidth:64,textAlign:"right"}}>{range}</span>
                          </div>
                        ))}
                        <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,fontSize:9,color:C.muted,lineHeight:1.7}}>
                          Composite: Memory 20% · Brand Recall 20% · Hook 15% · Hold Rate 15% · Emotion 10% · Creative Eff. 10% · Culture 10%
                        </div>
                      </div>
	                    )}
	                    <button onClick={saveCurrentAnalysis} disabled={isDemoMode||isSharedMode||r.__saveStatus==="saving"} onMouseDown={e=>{if(!isDemoMode&&!isSharedMode&&r.__saveStatus!=="saving")e.currentTarget.style.transform="scale(0.98)";}} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
	                      style={{width:"100%",marginTop:10,padding:"9px 12px",borderRadius:10,border:`1px solid ${isDemoMode||isSharedMode?C.border:C.gold+"44"}`,background:isDemoMode||isSharedMode?C.s2:r.__saveStatus==="saved"?`${C.green}18`:r.__saveStatus==="error"?`${C.red}18`:`${C.gold}14`,color:isDemoMode||isSharedMode?C.dim:r.__saveStatus==="saved"?C.green:r.__saveStatus==="error"?C.red:C.gold,fontSize:11,fontWeight:800,cursor:isDemoMode||isSharedMode?"not-allowed":r.__saveStatus==="saving"?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"transform 0.12s ease",opacity:isDemoMode||isSharedMode?0.7:1}}>
	                      {isSharedMode?"Shared view":isDemoMode?"Already saved":r.__saveStatus==="saving"?"Saving...":r.__saveStatus==="saved"?"Saved ✓":"Save to Repository"}
	                    </button>
	                    {!isDemoMode&&!isSharedMode&&(
	                      <button
	                        onClick={handleShareReport}
	                        disabled={shareLoading}
	                        onMouseDown={e=>{if(!shareLoading)e.currentTarget.style.transform="scale(0.98)";}}
	                        onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
	                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
	                        style={{width:"100%",marginTop:8,padding:"9px 12px",borderRadius:10,border:`1px solid ${shareLoading?C.border:"rgba(16,185,129,0.35)"}`,background:shareLoading?C.s2:"rgba(16,185,129,0.08)",color:shareLoading?C.muted:"#10B981",fontSize:11,fontWeight:800,cursor:shareLoading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"transform 0.12s ease"}}
	                      >
	                        {shareLoading?"Generating link...":"🔗 Share Report"}
	                      </button>
	                    )}
	                    {r.__saveError&&<div style={{fontSize:10,color:C.red,marginTop:6,maxWidth:140,lineHeight:1.4}}>{r.__saveError}</div>}
	                  </div>
                );
              })()}
              </div>
            </div>
          </div>

          {isMobile&&(
            <div style={{display:"flex",gap:8,overflowX:"auto",padding:"12px 14px",borderBottom:`1px solid ${C.border}`,background:C.ink,position:"sticky",top:92,zIndex:35}}>
              {NAV_TABS.map(n=>(
                <button key={n.id} onClick={()=>setDashboardTab(n.id)}
                  style={{display:"flex",alignItems:"center",gap:7,flex:"0 0 auto",padding:"9px 12px",borderRadius:10,border:`1px solid ${tab===n.id?C.gold:C.border}`,background:tab===n.id?`${C.gold}18`:C.s1,color:tab===n.id?C.gold:C.dim,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"'Inter','DM Sans',sans-serif"}}>
                  <span style={{display:"flex"}}>{n.icon}</span><span>{n.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tab content */}
          <div style={{padding:isMobile?"22px 14px":"32px 36px",maxWidth:1300,width:"100%",boxSizing:"border-box",margin:"0 auto"}}>

          {/* ===== EXECUTIVE SUMMARY ===== */}
          {tab==="summary"&&(<>
            {dnaMatchData&&(
              <Card C={C} style={{marginBottom:isMobile?18:24,padding:isMobile?16:18,background:"rgba(245,166,35,0.04)",border:"1px solid rgba(245,166,35,0.2)",borderLeft:`3px solid ${C.gold}`,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,marginBottom:10}}>
                  <div style={{fontSize:10,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.14em",textTransform:"uppercase"}}>🧬 Brand DNA Match</div>
                  <div style={{fontSize:24,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{dnaMatchData.score}%</div>
                </div>
                <div style={{fontSize:13,color:C.dim,lineHeight:1.65,marginBottom:dnaMatchData.topDeviations?.length?12:0}}>
                  {dnaMatchData.score>=80
                    ? `On-brand. Reinforces the ${form.brand||r.brand||"brand"} signature.`
                    : dnaMatchData.score>=60
                    ? "Acceptable drift. Review the flagged dimensions."
                    : "DNA divergence. This creative may work as advertising but risks eroding brand consistency."}
                </div>
                {dnaMatchData.topDeviations?.length>0&&(
                  <div style={{display:"grid",gap:7}}>
                    {dnaMatchData.topDeviations.map(item=>(
                      <div key={item.label} style={{fontSize:12,color:C.dim,lineHeight:1.5}}>
                        <span style={{color:item.direction==="above"?C.green:C.red,fontWeight:900,marginRight:7}}>
                          {item.direction==="above"?"↑":"↓"}
                        </span>
                        <span style={{color:C.text,fontWeight:800}}>{item.label}:</span>{" "}
                        <span style={{color:item.direction==="above"?C.green:C.red,fontWeight:800}}>
                          {item.direction==="above"?"+":"-"}{item.deviation}
                        </span>{" "}
                        {item.direction==="above"?"far more than brand norm":"far less than brand norm"}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
            {canShowCertBlock&&(
              <Card C={C} style={{marginBottom:isMobile?18:24,padding:isMobile?16:18,background:"rgba(245,166,35,0.05)",border:`1px solid ${C.gold}33`,borderLeft:`3px solid ${C.gold}`,borderRadius:8}}>
                {certData?.certified||r.is_certified?(
                  <div style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
                    <div>
                      <div style={{fontSize:12,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7}}>✅ AdCritIQ™ Certified Creative · {certData?.cert_id||r.cert_id}</div>
                      <div style={{fontSize:13,color:C.dim}}>Issued {formatCertDate(certData?.cert_issued_at||r.cert_issued_at)}</div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>certData?.certified?setShowCertModal(true):openCertificateFromId(r.cert_id)} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${C.gold}55`,background:`${C.gold}16`,color:C.gold,fontWeight:900,cursor:"pointer"}}>View Certificate</button>
                      <button onClick={()=>copyCertificateLink(certData?.cert_id||r.cert_id)} style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${C.green}55`,background:`${C.green}12`,color:C.green,fontWeight:900,cursor:"pointer"}}>{shareCopied?"Copied!":"Copy Verification Link"}</button>
                    </div>
                  </div>
                ):certEligibility.eligible?(
                  <>
                    <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>🏅 This Creative Qualifies For Certification</div>
                      <div style={{fontSize:10,color:C.ink,background:C.gold,borderRadius:999,padding:"5px 9px",fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em"}}>
                        {certEligibility.weighted_score}/100 · ELIGIBLE
                      </div>
                    </div>
                    <div style={{fontSize:13,color:C.dim,lineHeight:1.65,marginBottom:12}}>This creative meets all AdCritIQ™ certification criteria. Issue a verified badge to share with your brand and agency.</div>
                    <button onClick={issueCertificate} disabled={certLoading} style={{width:isMobile?"100%":"auto",padding:"11px 16px",borderRadius:10,border:"none",background:C.gold,color:C.ink,fontWeight:900,cursor:certLoading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      {certLoading?"Issuing Certificate...":"🏅 Issue AdCritIQ™ Certificate"}
                    </button>
                  </>
                ):(
                  <>
                    <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.amber,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>🏅 Certification Status · Not Yet Eligible</div>
                      <div style={{fontSize:10,color:C.amber,background:`${C.amber}16`,border:`1px solid ${C.amber}44`,borderRadius:999,padding:"5px 9px",fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em"}}>
                        {certEligibility.weighted_score}/100
                      </div>
                    </div>
                    <div style={{fontSize:13,color:C.dim,lineHeight:1.65,marginBottom:10}}>
                      This saved analysis has been checked against AdCritIQ™ certification thresholds but does not currently qualify.
                    </div>
                    {certEligibility.failed_criteria?.length>0&&(
                      <div style={{display:"grid",gap:6}}>
                        {certEligibility.failed_criteria.slice(0,4).map(item=>(
                          <div key={item} style={{fontSize:12,color:C.dim,lineHeight:1.5}}>
                            <span style={{color:C.amber,fontWeight:900,marginRight:7}}>•</span>{item}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}
            <div style={{display:"grid",gridTemplateColumns:scoreGrid,gap:isMobile?12:16,marginBottom:isMobile?24:36,animation:"fadeUp 0.4s ease 0.1s both"}}>
              {[
                ["Viral Potential",r.viral_potential,70],["Hook Strength",r.hook_strength,75],["Hold Rate",r.hold_rate,65],
                ["Emotional Peak",r.emotional_peak,70],["Brand Recall",r.brand_recall,80],["Memory Encoding",r.memory_encoding,70],
                ["Sound-Off Survival",r.sound_off_survival,null],["Share Intent",r.share_intent,null],["Creative Efficiency",r.creative_efficiency,null]
              ].map(([l,v,b])=>v!==undefined&&<ScoreCard C={C} hex={hex} key={l} label={l} value={v} note={r.score_notes?.[l.toLowerCase().replace(/ /g,"_")]||""} pct={v} benchmark={b}/>)}
            </div>

            {(resultStage==="concept"||resultStage==="storyboard")&&(
              <Card C={C} style={{marginBottom:isMobile?24:34,borderColor:`${C.gold}55`,background:`linear-gradient(135deg,${C.gold}12,rgba(255,255,255,0.025))`}}>
                <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16,flexDirection:isMobile?"column":"row"}}>
                  <div>
                    <div style={{fontSize:11,color:C.gold,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>💰 Production Risk Intelligence</div>
                    <div style={{fontSize:17,color:C.text,fontWeight:900,lineHeight:1.4,marginBottom:7}}>Issues caught at this stage cost ~Rs 0 to fix.</div>
                    <div style={{fontSize:14,color:C.dim,lineHeight:1.65}}>The same issues found after production typically cost Rs 40L-1.2Cr in reshoots and re-edits.</div>
                  </div>
                  <div style={{padding:"8px 13px",borderRadius:999,border:`1px solid ${C.gold}66`,background:`${C.gold}16`,color:C.gold,fontSize:11,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>
                    Stage: {stageLabel} — projected scores
                  </div>
                </div>
              </Card>
            )}

            <Card C={C} style={{marginBottom:24}}>
              <CardTitle C={C} label={C.cyan}>Predicted Attention & Emotion Curves</CardTitle>
              <svg viewBox="0 0 1000 200" style={{width:"100%",height:200}}>
                <defs>
                  <linearGradient id="af" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity=".2"/><stop offset="100%" stopColor={C.cyan} stopOpacity="0"/></linearGradient>
                  <linearGradient id="ef" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.orange} stopOpacity=".12"/><stop offset="100%" stopColor={C.orange} stopOpacity="0"/></linearGradient>
                </defs>
                <line x1="50" y1="170" x2="970" y2="170" stroke={C.border} strokeWidth="1"/>
                <line x1="50" y1="95" x2="970" y2="95" stroke={C.border} strokeWidth=".5" strokeDasharray="5,4"/>
                <text x="42" y="175" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">0</text>
                <text x="42" y="100" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">50</text>
                <text x="42" y="25" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">100</text>
                <path d={makeArea(attn,50,970,20,170)} fill="url(#af)"/>
                <path d={makePath(attn,50,970,20,170)} fill="none" stroke={C.cyan} strokeWidth="2.5"/>
                <path d={makeArea(emot,50,970,20,170)} fill="url(#ef)"/>
                <path d={makePath(emot,50,970,20,170)} fill="none" stroke={C.orange} strokeWidth="2" strokeDasharray="6,4"/>
                <line x1="730" y1="190" x2="755" y2="190" stroke={C.cyan} strokeWidth="3"/>
                <text x="762" y="194" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono">Attention</text>
                <line x1="860" y1="190" x2="885" y2="190" stroke={C.orange} strokeWidth="2" strokeDasharray="6,4"/>
                <text x="892" y="194" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono">Emotion</text>
              </svg>
            </Card>

            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
              {[
                ["Ad Fatigue Risk",r.ad_fatigue_risk],["Cultural Resonance",r.cultural_resonance],
                ["Celebrity/Talent",r.celebrity_talent_index],["Brand Safety",r.brand_safety],
                ["1P Data Opp.",r.first_party_data_opportunity],["Regulatory",r.regulatory_compliance],["Carbon Signal",r.carbon_signal]
              ].filter(([,v])=>v!==undefined).map(([l,v])=>
                <div key={l} style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(v)}}>{v}</div>
                  <div style={{fontSize:11,color:C.dim,marginTop:4,fontWeight:600}}>{l}</div>
                </div>
              )}
            </div>

            {comp.benchmark_note&&<Card C={C}>
              <CardTitle C={C} label={C.gold}>Competitive Benchmark</CardTitle>
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <span style={{fontSize:14,fontWeight:700,color:comp.position==="category_leader"?C.green:comp.position==="above_average"?C.cyan:comp.position==="average"?C.amber:C.red,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{(comp.position||"").replace(/_/g," ")}</span>
                <span style={{fontSize:14,color:C.dim}}>{comp.benchmark_note}</span>
              </div>
            </Card>}

            <Takeaway C={C} icon="📋" title="What This Means for You" color={C.gold} items={tw.summary}/>
          </>)}

          {/* ===== NEURAL MAP ===== */}
          {tab==="neural"&&(<>
            <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20,marginBottom:24}}>
              <Card C={C}>
                <CardTitle C={C} label={C.purple}>Brain Region Activation</CardTitle>
                {Object.entries(br).map(([k,v])=><BarMetric C={barMetricContrastC} hex={hex} key={k} label={k.replace(/_/g," ")} value={v}/>)}
              </Card>
              <Card C={C}>
                <CardTitle C={C} label={C.teal}>Cognitive Channel Load</CardTitle>
                {Object.entries(cl).map(([k,v])=><BarMetric C={barMetricContrastC} hex={hex} key={k} label={k.replace(/_/g," ")} value={v} color={C.purple}/>)}
              </Card>
            </div>
            <Card C={C}>
              <CardTitle C={C} label={C.orange}>System 1 vs System 2 Processing Balance</CardTitle>
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <span style={{fontSize:13,fontWeight:700,color:C.cyan}}>SYSTEM 2<br/><span style={{fontWeight:400,fontSize:11,color:C.dim}}>Rational</span></span>
                <div style={{flex:1,height:16,borderRadius:8,background:C.s3,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${s1s2}%`,borderRadius:8,background:`linear-gradient(90deg,${C.blue},${C.orange})`}}/>
                  <div style={{position:"absolute",left:`${s1s2}%`,top:-4,width:3,height:24,background:C.text,borderRadius:2,transform:"translateX(-50%)"}}/>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.orange}}>SYSTEM 1<br/><span style={{fontWeight:400,fontSize:11,color:C.dim}}>Emotional</span></span>
              </div>
              <div style={{textAlign:"center",marginTop:12,fontSize:13,color:C.dim}}>Score: {s1s2}/100 — {s1s2>=65&&s1s2<=75?"Optimal zone (65-75)":s1s2>75?"Over-indexing on emotion":"Over-indexing on rational"}</div>
            </Card>
            {tribeMetricRows.length>0&&(
              <Card C={C} style={{marginTop:24}}>
                <div style={{paddingTop:2}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                    <div style={{fontSize:10,color:C.gold,fontFamily:"monospace",letterSpacing:"0.15em"}}>
                      TRIBE V2 CALIBRATED NEURAL MARKERS
                    </div>
                    <div style={{padding:"2px 8px",background:"rgba(245,158,11,0.08)",border:`1px solid ${C.gold}44`,borderRadius:4,fontSize:9,color:C.gold,fontFamily:"monospace"}}>
                      META AI RESEARCH 2026
                    </div>
                    <div style={{fontSize:9,color:C.dim,fontStyle:"italic"}}>
                      720 subjects · 1,000+ hours fMRI
                    </div>
                  </div>

                  {tribeMetricRows.map(metric=>{
                    const displayVal=Math.max(0,Math.min(100,metric.value));
                    const barColor=metric.invert
                      ? (displayVal<30?C.green:displayVal<60?C.amber:C.red)
                      : (displayVal>=70?C.green:displayVal>=50?C.amber:C.red);
                    return(
                      <div key={metric.key} title={metric.tooltip} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:4}}>
                          <div>
                            <span style={{fontSize:12,color:C.text,fontWeight:600}}>{metric.label}</span>
                            <span style={{fontSize:9,color:C.dim,fontFamily:"monospace",marginLeft:8,letterSpacing:"0.06em"}}>{metric.sub}</span>
                          </div>
                          <div style={{fontSize:14,fontWeight:800,color:barColor,minWidth:32,textAlign:"right"}}>
                            {displayVal}
                            {metric.invert&&<span style={{fontSize:8,color:C.muted,marginLeft:3,fontFamily:"monospace"}}>↓</span>}
                          </div>
                        </div>
                        <div style={{height:6,borderRadius:3,background:C.s2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${displayVal}%`,background:barColor,borderRadius:3,transition:"width 0.8s ease",opacity:0.85}}/>
                        </div>
                      </div>
                    );
                  })}

                  {tribeMetrics?.tribe_calibration_note&&(
                    <div style={{marginTop:16,padding:"10px 14px",background:"rgba(245,158,11,0.04)",border:`1px solid ${C.gold}22`,borderRadius:8,fontSize:11,color:C.dim,fontStyle:"italic",lineHeight:1.6}}>
                      <span style={{color:C.gold,fontStyle:"normal",fontWeight:700,marginRight:6,fontFamily:"monospace",fontSize:9,letterSpacing:"0.1em"}}>
                        TRIBE V2 DIAGNOSTIC ·
                      </span>
                      {tribeMetrics.tribe_calibration_note}
                    </div>
                  )}

                  <div style={{marginTop:12,fontSize:9,color:C.dim,lineHeight:1.5}}>
                    Scores calibrated against validated brain activation patterns from TRIBE v2 (d'Ascoli et al., Meta AI Research, 2026) — a foundation model trained on 1,000+ hours of fMRI data across 720 subjects. AdCritIQ™ applies these published neural correlates as a calibration framework — not a live TRIBE v2 model inference.
                  </div>
                </div>
              </Card>
            )}
            <Takeaway C={C} icon="🧠" title="Neural Map — What to Do" color={C.purple} items={tw.neural}/>
          </>)}

          {/* ===== ATTENTION ECONOMICS ===== */}
          {tab==="attention"&&(<>
            {isTimelineAttention?(
              <>
                <Card C={C} style={{marginBottom:24}}>
                  <CardTitle C={C} label={C.amber}>Second-by-Second Attention Heatmap</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${attn.length},1fr)`,gap:attn.length>30?2:4}}>
                    {attn.map((v,i)=>
                      <div key={i} title={`${i}s — ${v}%`} style={{height:56,borderRadius:attn.length>40?3:6,cursor:"pointer",background:hex(v),opacity:Math.max(.3,v/100),transition:"transform .15s"}} onMouseEnter={e=>e.target.style.transform="scaleY(1.3)"} onMouseLeave={e=>e.target.style.transform="scaleY(1)"}/>
                    )}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:C.dim,fontFamily:"'JetBrains Mono',monospace"}}>
                    {heatmapLabels.map(s=><span key={s}>{s}s</span>)}
                  </div>
                  <div style={{textAlign:"right",marginTop:6}}>
                    <span style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:2,textTransform:"uppercase",opacity:0.7,fontFamily:"'DM Mono',monospace"}}>Full {attn.length}s analysed</span>
                  </div>
                </Card>
                <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
                  <Card C={C}>
                    <CardTitle C={C} label={C.green}>Attention Stats</CardTitle>
                    <div style={{fontSize:14,color:C.dim,lineHeight:1.8}}>
                      <p>Peak Attention: <b style={{color:C.green}}>{Math.max(...attn)}%</b> at ~{attn.indexOf(Math.max(...attn))}s</p>
                      <p>Lowest Point: <b style={{color:C.red}}>{Math.min(...attn)}%</b> at ~{attn.indexOf(Math.min(...attn))}s</p>
                      <p>Average Attention: <b style={{color:C.cyan}}>{Math.round(attn.reduce((a,b)=>a+b,0)/attn.length)}%</b></p>
                      <p>Drop Zones: <b style={{color:C.amber}}>{attn.filter((v,i)=>i>0&&v<attn[i-1]-10).length}</b> significant drops detected</p>
                      <p>Duration Analysed: <b style={{color:C.gold}}>{attn.length}s</b></p>
                    </div>
                  </Card>
                  <Card C={C}>
                    <CardTitle C={C} label={C.red}>Predicted View-Through Rate</CardTitle>
                    {[25,50,75,100].map(pct=>{
                      const idx=Math.round((pct/100)*(attn.length-1));
                      const v=attn[idx]||0;
                      return <div key={pct} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <span style={{width:60,fontSize:13,color:C.dim,fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span>
                        <div style={{flex:1,height:8,borderRadius:4,background:C.s3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:hex(v),width:`${v}%`}}/></div>
                        <span style={{width:40,fontSize:13,fontWeight:700,color:hex(v),fontFamily:"'JetBrains Mono',monospace"}}>{v}%</span>
                      </div>;
                    })}
                  </Card>
                </div>
              </>
            ):(
              <>
                <Card C={C} style={{marginBottom:24}}>
                  <CardTitle C={C} label={C.amber}>{resultFormat==="static_image"?"Static Attention Diagnostics":resultFormat==="audio"?"Audio Attention Diagnostics":"Copy Attention Diagnostics"}</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:12,marginBottom:22}}>
                    {[
                      ["First Glance",staticAttentionMetrics[0]?.[1]||0,C.gold],
                      ["Brand Linkage",staticAttentionMetrics[2]?.[1]||0,C.green],
                      ["Message Decode",staticAttentionMetrics[3]?.[1]||0,C.cyan],
                      ["CTA / Memory",staticAttentionMetrics[4]?.[1]||0,C.purple],
                    ].map(([label,value,color],i)=>(
                      <div key={label} style={{position:"relative",padding:16,borderRadius:12,background:`${color}12`,border:`1px solid ${color}44`}}>
                        <div style={{width:26,height:26,borderRadius:999,display:"grid",placeItems:"center",background:`${color}20`,color,fontSize:11,fontWeight:900,fontFamily:"'DM Mono',monospace",marginBottom:10}}>{i+1}</div>
                        <div style={{fontSize:11,color:color,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:1,marginBottom:8}}>{label}</div>
                        <div style={{fontSize:26,color:hex(value),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{value}</div>
                        {!isMobile&&i<3&&<div style={{position:"absolute",right:-16,top:"50%",transform:"translateY(-50%)",color:C.gold,fontSize:18,zIndex:2}}>→</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>
                    {resultFormat==="static_image"
                      ? "Static creatives are judged by how quickly the eye finds the focal point, links it to the brand, decodes the message, and remembers the CTA. No time-series or second-by-second retention is applied."
                      : resultFormat==="audio"
                        ? "Audio attention is judged from the script/transcript: opening pull, proposition clarity, mnemonic strength, and CTA recall. Raw audio listening duration is not inferred."
                        : "Copy attention is judged by headline pull, proposition clarity, persuasion, memorability, and CTA strength. No video timeline is applied."}
                  </div>
                </Card>
                <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
                  <Card C={C}>
                    <CardTitle C={C} label={C.green}>{resultFormat==="static_image"?"Static Attention Metrics":"Attention Metrics"}</CardTitle>
                    {staticAttentionMetrics.map(([label,value,color])=>(
                      <BarMetric C={barMetricContrastC} hex={hex} key={label} label={label} value={value} color={color}/>
                    ))}
                  </Card>
                  <Card C={C}>
                    <CardTitle C={C} label={C.red}>{resultFormat==="static_image"?"Risk Signals":"Attention Risk Signals"}</CardTitle>
                    <div style={{fontSize:14,color:C.dim,lineHeight:1.85}}>
                      <p>Strongest Signal: <b style={{color:C.green}}>{staticAttentionMetrics.slice().sort((a,b)=>b[1]-a[1])[0]?.[0]||"—"}</b></p>
                      <p>Weakest Signal: <b style={{color:C.red}}>{staticAttentionMetrics.slice().sort((a,b)=>a[1]-b[1])[0]?.[0]||"—"}</b></p>
                      <p>Attention Readiness: <b style={{color:C.cyan}}>{Math.round(staticAttentionMetrics.reduce((a,b)=>a+b[1],0)/staticAttentionMetrics.length)}%</b></p>
                      {resultFormat==="static_image"&&<p>Clutter Risk: <b style={{color:hex(100-(staticAttentionMetrics.find(([l])=>l==="Clutter Risk")?.[1]||0))}}>{staticAttentionMetrics.find(([l])=>l==="Clutter Risk")?.[1]||0}/100</b></p>}
                    </div>
                  </Card>
                </div>
              </>
            )}
            <Takeaway C={C} icon="👁" title="Attention Economics — Actions" color={C.amber} items={tw.attention}/>
            {deepAttentionRows.length>0&&(
              <Card C={C} style={{marginTop:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                  <div style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.15em",fontWeight:900}}>
                    DEEP ATTENTION DIAGNOSTICS
                  </div>
                  <div style={{padding:"2px 8px",background:"rgba(245,158,11,0.08)",border:`1px solid ${C.gold}44`,borderRadius:4,fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace"}}>
                    V-JEPA2 · WEBER-FECHNER CALIBRATED
                  </div>
                </div>
                {deepAttentionRows.map(([label,sub,value])=>{
                  const color=label==="Attention-Brand Coupling"
                    ? (value<50?C.red:value>=70?C.green:C.amber)
                    : (value>=70?C.green:value>=50?C.amber:C.red);
                  return(
                    <div key={label} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:5}}>
                        <div>
                          <span style={{fontSize:13,color:C.text,fontWeight:800}}>{label}</span>
                          <span style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",marginLeft:8,letterSpacing:"0.06em"}}>{sub}</span>
                        </div>
                        <span style={{fontSize:15,color,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{value}</span>
                      </div>
                      <div style={{height:7,borderRadius:4,background:C.s2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.max(0,Math.min(100,value))}%`,background:color,borderRadius:4,boxShadow:label==="Attention-Brand Coupling"?`0 0 14px ${color}44`:"none"}}/>
                      </div>
                    </div>
                  );
                })}
                {r?.deep_neuro?.attention_deep?.attention_deep_note&&diagnosticCard("Diagnostic Finding",r.deep_neuro.attention_deep.attention_deep_note,C.gold)}
              </Card>
            )}
          </>)}

          {/* ===== EMOTIONAL ARCHITECTURE ===== */}
          {tab==="emotion"&&(<>
            <Card C={C} style={{marginBottom:24}}>
              <CardTitle C={C} label={C.pink}>Emotion Types Over Time</CardTitle>
              <svg viewBox="0 0 1000 200" style={{width:"100%",height:200}}>
                <line x1="50" y1="170" x2="970" y2="170" stroke={C.border} strokeWidth="1"/>
                {Object.entries(emotTypes).map(([k,arr],idx)=>{
                  if(!arr||!arr.length)return null;
                  const colors=[C.green,C.amber,C.blue,C.red,C.pink,C.purple];
                  const c=colors[idx%colors.length];
                  return <path key={k} d={makePath(arr,50,970,20,170)} fill="none" stroke={c} strokeWidth="1.5" strokeDasharray={idx>2?"4,3":"none"}/>;
                })}
                <g transform="translate(60,188)">
                  {Object.keys(emotTypes).map((k,i)=>{
                    const colors=[C.green,C.amber,C.blue,C.red,C.pink,C.purple];
                    return <g key={k} transform={`translate(${i*130},0)`}>
                      <line x1="0" y1="0" x2="20" y2="0" stroke={colors[i%colors.length]} strokeWidth="2"/>
                      <text x="26" y="4" fill={C.dim} fontSize="11" fontFamily="JetBrains Mono" textTransform="capitalize">{k}</text>
                    </g>;
                  })}
                </g>
              </svg>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
              <Card C={C}>
                <CardTitle C={C} label={C.rose}>Dominant Emotion by Section</CardTitle>
                {Object.entries(emotTypes).map(([k,arr])=>{
                  if(!arr)return null;
                  const avg=Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
                  return <BarMetric C={barMetricContrastC} hex={hex} key={k} label={k} value={avg} color={C.pink}/>;
                })}
              </Card>
              <Card C={C}>
                <CardTitle C={C} label={C.orange}>Emotional Peak Analysis</CardTitle>
                <p style={{fontSize:14,color:C.dim,lineHeight:1.8}}>
                  Emotional Peak Score: <b style={{color:C.blue}}>{r.emotional_peak}/100</b><br/>
                  The emotional arc {r.emotional_peak>=70?"has strong peaks that correlate with shareability":"needs stronger emotional triggers to drive organic sharing"}.<br/>
                  Share Intent Score: <b style={{color:C.purple}}>{r.share_intent}/100</b>
                </p>
              </Card>
            </div>
            <Takeaway C={C} icon="❤️" title="Emotional Architecture — Actions" color={C.pink} items={tw.emotion}/>
            {showDeepEmotion&&(
              <Card C={C} style={{marginTop:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                  <div style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.15em",fontWeight:900}}>
                    DEEP EMOTION DIAGNOSTICS
                  </div>
                  <div style={{padding:"2px 8px",background:"rgba(245,158,11,0.08)",border:`1px solid ${C.gold}44`,borderRadius:4,fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace"}}>
                    KAHNEMAN · GALLESE · HEATH CALIBRATED
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:18}}>
                  <div style={{display:"grid",gap:16}}>
                    {emotionArcType&&(()=>{
                      const arcColors={RESOLUTION:C.green,ASCENT:C.cyan,WAVE:C.amber,FLAT:C.dim,CLIFF:C.red};
                      const arcDesc={
                        RESOLUTION:"Rises and resolves positively, strongest for brand-building memory.",
                        ASCENT:"Builds emotional intensity throughout the creative.",
                        WAVE:"Multiple emotional peaks; engaging in longer formats, riskier in short formats.",
                        FLAT:"Minimal emotional variation; likely more cognitive than affective.",
                        CLIFF:"Strong opening emotion drops and does not recover."
                      };
                      const color=arcColors[emotionArcType]||C.gold;
                      return(
                        <div style={{padding:14,borderRadius:12,background:`${color}12`,border:`1px solid ${color}44`}}>
                          <div style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Emotional Arc Type</div>
                          <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:999,background:`${color}18`,border:`1px solid ${color}55`,color,fontSize:14,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>{emotionArcType}</div>
                          <div style={{fontSize:12,color:C.dim,lineHeight:1.55,marginTop:10}}>{arcDesc[emotionArcType]||"Predicted emotional structure for this creative."}</div>
                        </div>
                      );
                    })()}
                    {valenceArousalPosition&&(
                      <div style={{padding:14,borderRadius:12,background:C.s2,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Valence-Arousal Position</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:6,maxHeight:160}}>
                          {[
                            ["HIGH-POSITIVE","Share intent / viral lift"],
                            ["HIGH-NEGATIVE","Attention with purchase risk"],
                            ["LOW-POSITIVE","Affinity / premium positioning"],
                            ["LOW-NEGATIVE","Empathy, weaker CTA"],
                          ].map(([pos,desc])=>{
                            const active=valenceArousalPosition===pos;
                            return(
                              <div key={pos} style={{padding:"9px 8px",minHeight:52,borderRadius:8,border:`1px solid ${active?C.gold+"77":C.border}`,background:active?`${C.gold}14`:C.s1,color:active?C.gold:C.dim}}>
                                <div style={{fontSize:9,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.05em",marginBottom:4}}>{pos}</div>
                                <div style={{fontSize:9,lineHeight:1.3,color:active?C.text:C.muted}}>{desc}</div>
                              </div>
                            );
                          })}
                        </div>
                        {valenceArousalPosition==="MIXED"&&<div style={{marginTop:8,fontSize:11,color:C.gold,fontStyle:"italic"}}>Mixed emotional contrast detected; useful for narrative tension in longer formats.</div>}
                      </div>
                    )}
                  </div>
                  <div style={{display:"grid",gap:12}}>
                    {deepEmotionRows.map(([label,value])=>(
                      <div key={label}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:5}}>
                          <span style={{fontSize:13,color:C.text,fontWeight:800}}>{label}</span>
                          <span style={{fontSize:15,color:hex(value),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{value}</span>
                        </div>
                        {label==="Peak-End Rule Score"&&<div style={{fontSize:11,color:C.dim,lineHeight:1.45,marginBottom:6}}>Memory is dominated by your emotional peak and final moment. Combined score: {value}/100.</div>}
                        <div style={{height:7,borderRadius:4,background:C.s2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.max(0,Math.min(100,value))}%`,background:hex(value),borderRadius:4}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {r?.deep_neuro?.emotion_deep?.emotion_deep_note&&diagnosticCard("Diagnostic Finding",r.deep_neuro.emotion_deep.emotion_deep_note,C.gold)}
              </Card>
            )}
          </>)}

          {/* ===== SCENE INTELLIGENCE ===== */}
          {tab==="scenes"&&(<>
            <div style={{fontSize:11,color:C.gold,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>
              {resultFormat==="static_image"?"Creative Anatomy":resultFormat==="text"?"Copy Intelligence":resultFormat==="audio"?"Audio & Script Intelligence":resultFormat==="motion_static"?"Motion Loop Intelligence":"Scene Intelligence"}
            </div>
            <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:18}}>
              {sc.map((s,i)=>
                <Card C={C} key={i} delay={Math.min(i*70,500)} style={{position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:`linear-gradient(90deg,${hex(s.attention||50)},${C.cyan})`}}/>
                  <div style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:C.cyan,fontWeight:600,marginBottom:4}}>{s.ts}</div>
                  <div style={{fontSize:17,fontWeight:700,marginBottom:10,lineHeight:1.3}}>{s.name}</div>
                  <p style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:12}}>{s.desc}</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    {(s.badges||[]).map((b,j)=>
                      <span key={j} style={{padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",background:b.includes("⚠")||b.toLowerCase().includes("risk")||b.toLowerCase().includes("drop")?"rgba(231,76,60,0.12)":"rgba(0,200,255,0.1)",color:b.includes("⚠")||b.toLowerCase().includes("risk")||b.toLowerCase().includes("drop")?C.red:C.cyan}}>{b}</span>
                    )}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:C.dim}}>
                    {s.attention!==undefined&&<span>Attention: <b style={{color:hex(s.attention)}}>{s.attention}%</b></span>}
                    {s.emotion!==undefined&&<span>Emotion: <b style={{color:hex(s.emotion)}}>{s.emotion}%</b></span>}
                    {s.system_mode&&<span>Mode: <b style={{color:C.purple}}>{s.system_mode}</b></span>}
                    {s.cognitive_load&&<span>Load: <b style={{color:s.cognitive_load==="overload"?C.red:s.cognitive_load==="high"?C.amber:C.green}}>{s.cognitive_load}</b></span>}
                    {(resultFormat==="video"||resultFormat==="motion_static")&&s.drop_second != null && (
                      <span style={{fontSize:12,color:C.red,fontWeight:700,marginLeft:8}}>
                        ⚠ Drop risk: {Math.floor(s.drop_second/60)}:{String(s.drop_second%60).padStart(2,"0")}
                      </span>
                    )}
                  </div>
                </Card>
              )}
            </div>
            <Takeaway C={C} icon="🎬" title={`${resultFormat==="static_image"?"Creative Anatomy":resultFormat==="text"?"Copy Intelligence":resultFormat==="audio"?"Audio & Script Intelligence":resultFormat==="motion_static"?"Motion Loop Intelligence":"Scene Intelligence"} — How to Use This`} color={C.teal} items={tw.scenes}/>
          </>)}

          {/* ===== PLATFORM SCORES ===== */}
          {tab==="platforms"&&(<>
            <div style={{display:"grid",gridTemplateColumns:platformGrid,gap:isMobile?12:16}}>
              {Object.entries(ps).map(([k,v],i)=>
                <Card C={C} key={k} delay={Math.min(i*70,500)} style={{textAlign:"center",padding:24}}>
                  <div style={{fontSize:38,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(v),lineHeight:1}}>{v}</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:10,textTransform:"capitalize",lineHeight:1.3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <PlatformChip name={k.replace(/_/g," ")} C={C}/>
                    <span>{k.replace(/_/g," ")}</span>
                  </div>
                  <div style={{marginTop:10,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:hex(v)}}>{grade(v)}</div>
                </Card>
              )}
            </div>
            <Takeaway C={C} icon="📱" title="Platform Strategy — Where to Run This" color={C.blue} items={tw.platforms}/>
          </>)}

          {/* ===== SOUND & SENSORY ===== */}
          {tab==="sound"&&(<>
            <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
              <Card C={C}>
                <CardTitle C={C} label={C.purple}>Sound Analysis Metrics</CardTitle>
                {[["Sound Dependency",snd.sound_dependency],["Music Effectiveness",snd.music_effectiveness],["Voiceover Clarity",snd.voiceover_clarity],["Sound-Off Text Quality",snd.sound_off_text_quality],["ASMR Trigger",snd.asmr_trigger],["Sonic Branding",snd.sonic_branding]].filter(([,v])=>v!==undefined).map(([l,v])=>
                  <BarMetric C={barMetricContrastC} hex={hex} key={l} label={l} value={v} maxW={180}/>
                )}
              </Card>
              <Card C={C}>
                <CardTitle C={C} label={C.orange}>Sound Strategy Assessment</CardTitle>
                <p style={{fontSize:15,color:C.dim,lineHeight:1.8}}>{snd.sound_note||"Sound analysis data not available for this creative type."}</p>
                <div style={{marginTop:16,padding:16,borderRadius:10,background:C.s3}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:6}}>Sound-Off Survival Score</div>
                  <div style={{fontSize:36,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(r.sound_off_survival||0)}}>{r.sound_off_survival||"N/A"}</div>
                </div>
              </Card>
            </div>
            <Takeaway C={C} icon="🔊" title="Sound Strategy — Actions" color={C.purple} items={tw.sound}/>
            {showDeepSound&&(
              <Card C={C} style={{marginTop:24}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                  <div style={{fontSize:10,color:C.gold,fontFamily:"'DM Mono',monospace",letterSpacing:"0.15em",fontWeight:900}}>
                    DEEP AUDITORY DIAGNOSTICS
                  </div>
                  <div style={{padding:"2px 8px",background:"rgba(245,158,11,0.08)",border:`1px solid ${C.gold}44`,borderRadius:4,fontSize:9,color:C.gold,fontFamily:"'DM Mono',monospace"}}>
                    TRIBE V2 STS · CHERRY COCKTAIL PARTY CALIBRATED
                  </div>
                </div>
                {soundDeepRows.map(([label,sub,value])=>{
                  const risk=label==="Audio-Visual Temporal Sync"&&value<60;
                  const color=risk?C.red:value>=70?C.green:value>=50?C.amber:C.red;
                  return(
                    <div key={label} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:5}}>
                        <div>
                          <span style={{fontSize:13,color:C.text,fontWeight:800}}>{label}</span>
                          <span style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",marginLeft:8,letterSpacing:"0.06em"}}>{sub}</span>
                          {risk&&<span style={{marginLeft:8,padding:"2px 7px",borderRadius:999,background:`${C.red}16`,border:`1px solid ${C.red}44`,color:C.red,fontSize:9,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>RISK</span>}
                        </div>
                        <span style={{fontSize:15,color,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{value}</span>
                      </div>
                      <div style={{height:7,borderRadius:4,background:C.s2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.max(0,Math.min(100,value))}%`,background:color,borderRadius:4}}/>
                      </div>
                    </div>
                  );
                })}
                {r?.deep_neuro?.sound_deep?.sound_deep_note&&diagnosticCard("Diagnostic Finding",r.deep_neuro.sound_deep.sound_deep_note,C.gold)}
              </Card>
            )}
          </>)}

          {/* ===== PRIVACY & COMPLIANCE ===== */}
          {tab==="privacy"&&(<>
            <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
              <Card C={C}>
                <CardTitle C={C} label={C.amber}>Privacy & Data Audit</CardTitle>
                <div style={{fontSize:14,color:C.dim,lineHeight:2}}>
                  {[["Data Collection Present",priv.data_collection_present],["Consent Mechanism Visible",priv.consent_mechanism_visible],["QR Code Present",priv.qr_code_present],["URL / CTA Present",priv.url_cta_present],["Hashtag Present",priv.hashtag_present],["Regulatory Disclaimers Visible",priv.regulatory_disclaimers_visible]].map(([l,v])=>
                    <div key={l} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,paddingBottom:4}}>
                      <span>{l}</span>
                      <span style={{fontWeight:700,color:v?C.green:C.red}}>{v===true?"✓ Yes":v===false?"✗ No":"—"}</span>
                    </div>
                  )}
                </div>
              </Card>
              <Card C={C}>
                <CardTitle C={C} label={C.red}>Compliance Risk</CardTitle>
                <div style={{marginBottom:16,padding:16,borderRadius:10,background:priv.dpdp_compliance_risk==="high"?"rgba(231,76,60,0.1)":priv.dpdp_compliance_risk==="medium"?"rgba(241,196,0,0.1)":"rgba(46,204,113,0.1)",border:`1px solid ${priv.dpdp_compliance_risk==="high"?C.red:priv.dpdp_compliance_risk==="medium"?C.amber:C.green}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.dim,marginBottom:4}}>DPDP Compliance Risk</div>
                  <div style={{fontSize:22,fontWeight:800,textTransform:"uppercase",color:priv.dpdp_compliance_risk==="high"?C.red:priv.dpdp_compliance_risk==="medium"?C.amber:C.green}}>{priv.dpdp_compliance_risk||"N/A"}</div>
                </div>
                <p style={{fontSize:14,color:C.dim,lineHeight:1.8}}>{priv.privacy_note||"No specific privacy signals detected in this creative."}</p>
                <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{textAlign:"center",padding:14,borderRadius:8,background:C.s3}}>
                    <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Brand Safety</div>
                    <div style={{fontSize:24,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(r.brand_safety||0)}}>{r.brand_safety||"—"}</div>
                  </div>
                  <div style={{textAlign:"center",padding:14,borderRadius:8,background:C.s3}}>
                    <div style={{fontSize:11,color:C.dim,marginBottom:4}}>Regulatory</div>
                    <div style={{fontSize:24,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(r.regulatory_compliance||0)}}>{r.regulatory_compliance||"—"}</div>
                  </div>
                </div>
              </Card>
            </div>
            <Takeaway C={C} icon="🛡️" title="Privacy & Compliance — Actions" color={C.amber} items={tw.privacy}/>
          </>)}

          {/* ===== STRATEGIC INSIGHTS ===== */}
          {tab==="strategy"&&(
            <>
              <Card C={C} style={{marginBottom:24}}>
                <CardTitle C={C} label={C.gold}>Strategic Signal Map</CardTitle>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:isMobile?14:10,alignItems:"stretch"}}>
                  {[
                    ["Brand Strength",C.green],
                    ["Growth Barrier",C.red],
                    ["Platform Opportunity",C.cyan],
                    ["Action Focus",C.gold],
                  ].map(([stageLabel,color],i)=>{
                    const item=ins[i];
                    if(!item)return null;
                    const tone=item.vtype==="risk"?C.red:item.vtype==="win"?C.green:item.vtype==="tip"?C.cyan:color;
                    return(
                      <div key={stageLabel} style={{position:"relative",display:"grid",gridTemplateColumns:"1fr",gap:10}}>
                        <div style={{height:"100%",border:`1px solid ${tone}44`,borderRadius:12,background:`linear-gradient(180deg,${tone}14,rgba(255,255,255,0.02))`,padding:16}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:14}}>
                            <div style={{width:30,height:30,borderRadius:999,display:"grid",placeItems:"center",background:`${tone}1f`,border:`1px solid ${tone}55`,color:tone,fontSize:12,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{i+1}</div>
                            <div style={{fontSize:10,color:tone,fontWeight:800,textTransform:"uppercase",letterSpacing:1.4,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>{stageLabel}</div>
                          </div>
                          <div style={{fontSize:14,fontWeight:800,color:C.text,lineHeight:1.35,marginBottom:10}}>{item.title}</div>
                          <div style={{fontSize:11,color:C.dim,lineHeight:1.55,minHeight:isMobile?"auto":50}}>
                            {item.verdict||item.body}
                          </div>
                          {item.vtype&&<div style={{marginTop:12,display:"inline-flex",padding:"3px 9px",borderRadius:999,background:`${tone}18`,border:`1px solid ${tone}44`,color:tone,fontSize:10,fontWeight:800,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{item.vtype}</div>}
                        </div>
                        {!isMobile&&i<Math.min(ins.length,4)-1&&(
                          <div style={{position:"absolute",right:-18,top:"50%",transform:"translateY(-50%)",zIndex:2,width:28,height:28,borderRadius:999,display:"grid",placeItems:"center",background:C.s1,border:`1px solid ${C.border}`,color:C.gold,fontSize:16}}>→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card C={C} style={{marginBottom:24}}>
                <CardTitle C={C} label={C.cyan}>Outcome Implication</CardTitle>
                {outcomeForecast?(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:12}}>
                    {[
                      ["Most likely helped",highestBrandKpi?.[0]||"Brand Memory",highestBrandKpi?.[1],C.green,false],
                      ["KPI most at risk",lowestBrandKpi?.[0]||"Awareness",lowestBrandKpi?.[1],C.red,false],
                      ["Best platform probability",bestOutcomePlatform?.label||"Platform fit pending",bestOutcomePlatform?.score?Math.round(bestOutcomePlatform.score):null,C.cyan,false],
                      ["Accountability signal",outcomeForecast.creative_accountability>=outcomeForecast.media_dependency?"Creative-led":"Media-dependent",Math.max(outcomeForecast.creative_accountability||0,outcomeForecast.media_dependency||0),C.gold,false],
                    ].map(([label,value,score,color,invert])=>(
                      <div key={label} style={{padding:16,borderRadius:12,background:C.s2,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>{label}</div>
                        <div style={{fontSize:15,color:C.text,fontWeight:900,lineHeight:1.35,minHeight:38}}>{value}</div>
                        {typeof score==="number"&&(
                          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
                            <div style={{flex:1,height:6,borderRadius:999,background:C.s3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${Math.min(100,Math.max(0,score))}%`,background:outcomeScoreColor(score,invert),borderRadius:999}}/>
                            </div>
                            <div style={{fontSize:13,color:outcomeScoreColor(score,invert),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{score}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>Outcome Forecast will appear on fresh analyses generated with the latest model.</div>
                )}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
                {ins.map((n,i)=>{
                  const vc=n.vtype==="risk"?{bg:"rgba(231,76,60,0.1)",bd:C.red,c:"#ff7b7b"}:n.vtype==="win"?{bg:"rgba(46,204,113,0.1)",bd:C.green,c:"#6dffaa"}:n.vtype==="tip"?{bg:"rgba(0,200,255,0.1)",bd:C.cyan,c:C.cyan}:{bg:"rgba(241,196,0,0.1)",bd:C.amber,c:C.amber};
                  return(
                    <Card C={C} key={i} delay={Math.min(i*70,500)}>
                      <div style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.gold,marginBottom:6}}>{n.num}</div>
                      <h3 style={{fontSize:18,fontWeight:700,marginBottom:12,lineHeight:1.35}}>{n.title}</h3>
                      <p style={{fontSize:14,color:C.dim,lineHeight:1.75}}>{n.body}</p>
                      {n.verdict&&<div style={{marginTop:14,padding:"12px 16px",borderRadius:8,background:vc.bg,borderLeft:`4px solid ${vc.bd}`,fontSize:13,fontWeight:600,color:vc.c,lineHeight:1.6}}>{n.verdict}</div>}
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* ===== CMO PLAYBOOK ===== */}
          {tab==="cmo"&&(
            <div style={{background:C.s1,borderRadius:16,padding:isMobile?22:40,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:8}}>For the Marketing Head</div>
              <h2 style={{fontSize:32,fontWeight:200,marginBottom:8}}>The <span style={{fontWeight:700,color:C.gold}}>CMO Playbook</span></h2>
              <p style={{fontSize:14,color:C.dim,marginBottom:32}}>Prioritized actions mapped to metric gaps. Sorted by impact-to-effort ratio.</p>
              <div style={{marginBottom:30,padding:isMobile?16:22,borderRadius:14,border:`1px solid ${C.cyan}30`,background:`linear-gradient(180deg,${C.cyan}0d,rgba(255,255,255,0.02))`}}>
                <div style={{fontSize:10,color:C.cyan,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:14}}>Business Impact Lens</div>
                {outcomeForecast?(
                  <>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:12,marginBottom:16}}>
                      {[
                        ["Primary KPI to protect",lowestBrandKpi?.[0]||"Brand memory",lowestBrandKpi?.[1],C.red],
                        ["Highest upside KPI",highestBrandKpi?.[0]||"Awareness",highestBrandKpi?.[1],C.green],
                        ["Media wastage risk","Likely media waste",outcomeForecast.media_wastage_risk,C.red],
                        ["Recommended CMO decision",outcomeForecast.business_impact_band==="high"?"Scale with platform discipline":outcomeForecast.business_impact_band==="risk"?"Fix before scaling":"Test, optimize, then scale",null,C.gold],
                      ].map(([label,value,score,color])=>(
                        <div key={label} style={{padding:14,borderRadius:12,background:C.s2,border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:9,color:C.muted,fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:7}}>{label}</div>
                          <div style={{fontSize:14,color:C.text,fontWeight:900,lineHeight:1.35}}>{value}</div>
                          {typeof score==="number"&&<div style={{marginTop:7,fontSize:16,color:outcomeScoreColor(score,label==="Media wastage risk"),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{score}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:13,color:C.dim,lineHeight:1.7,borderLeft:`3px solid ${C.gold}`,paddingLeft:12}}>
                      {accountabilityDecision}
                    </div>
                  </>
                ):(
                  <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>Business impact forecasting will appear on fresh analyses generated with the latest model.</div>
                )}
              </div>
              <div style={{marginBottom:30,padding:isMobile?16:22,borderRadius:14,border:`1px solid ${C.gold}30`,background:`linear-gradient(180deg,${C.gold}0d,rgba(255,255,255,0.02))`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:14,flexDirection:isMobile?"column":"row",marginBottom:18}}>
                  <div>
                    <div style={{fontSize:10,color:C.gold,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>CMO Action Flow</div>
                    <div style={{fontSize:18,color:C.text,fontWeight:800}}>From creative gap to media decision</div>
                  </div>
                  <div style={{fontSize:11,color:C.dim,fontFamily:"'DM Mono',monospace",letterSpacing:1,textTransform:"uppercase"}}>{cmo.length} prioritized actions</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,minmax(0,1fr))",gap:isMobile?14:10}}>
                  {[
                    ["Fix Hook",C.red],
                    ["Adapt Platforms",C.cyan],
                    ["Amplify Strengths",C.green],
                    ["Scale Investment",C.gold],
                  ].map(([stageLabel,color],i)=>{
                    const action=cmo[i];
                    if(!action)return null;
                    const priorityColor=action.priority==="critical"?C.red:action.priority==="high"?C.amber:color;
                    return(
                      <div key={stageLabel} style={{position:"relative"}}>
                        <div style={{height:"100%",padding:16,borderRadius:12,border:`1px solid ${priorityColor}44`,background:`${priorityColor}10`}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                            <div style={{width:26,height:26,borderRadius:8,display:"grid",placeItems:"center",background:`${priorityColor}22`,color:priorityColor,fontSize:12,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{action.num||i+1}</div>
                            <div style={{fontSize:10,color:priorityColor,fontWeight:900,textTransform:"uppercase",letterSpacing:1.2,fontFamily:"'DM Mono',monospace"}}>{stageLabel}</div>
                          </div>
                          <div style={{fontSize:14,color:C.text,fontWeight:800,lineHeight:1.35,marginBottom:12}}>{action.title}</div>
                          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {action.priority&&<span style={{padding:"3px 8px",borderRadius:999,background:`${priorityColor}18`,border:`1px solid ${priorityColor}44`,color:priorityColor,fontSize:10,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>{action.priority}</span>}
                            {action.effort&&<span style={{padding:"3px 8px",borderRadius:999,background:C.s3,border:`1px solid ${C.border}`,color:C.dim,fontSize:10,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>{action.effort}</span>}
                            {action.estimated_uplift_pct&&<span style={{padding:"3px 8px",borderRadius:999,background:`${C.green}18`,border:`1px solid ${C.green}44`,color:C.green,fontSize:10,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>+{action.estimated_uplift_pct}%</span>}
                          </div>
                        </div>
                        {!isMobile&&i<Math.min(cmo.length,4)-1&&(
                          <div style={{position:"absolute",right:-18,top:"50%",transform:"translateY(-50%)",zIndex:2,width:28,height:28,borderRadius:999,display:"grid",placeItems:"center",background:C.s1,border:`1px solid ${C.border}`,color:C.gold,fontSize:16}}>→</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:16}}>
                {cmo.map((a,i)=>
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.gold}}>ACTION {a.num||String(i+1).padStart(2,"0")}</span>
                      {a.priority&&<span style={{padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:a.priority==="critical"?"rgba(231,76,60,0.2)":a.priority==="high"?"rgba(241,196,0,0.15)":"rgba(0,200,255,0.1)",color:a.priority==="critical"?C.red:a.priority==="high"?C.amber:C.cyan}}>{a.priority}</span>}
                      {a.effort&&<span style={{padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:C.s3,color:C.dim}}>Effort: {a.effort}</span>}
                    </div>
                    <h4 style={{fontSize:17,fontWeight:700,marginBottom:8,lineHeight:1.3}}>{a.title}</h4>
                    <p style={{fontSize:14,color:C.dim,lineHeight:1.7}}>{a.body}</p>
                    {a.estimated_uplift_pct ? (
                      <div style={{marginTop:10,fontSize:12,color:C.green,fontWeight:700}}>
                        📈 Est. +{a.estimated_uplift_pct}% {impactLabel}
                      </div>
                    ) : a.impact && (
                      <div style={{marginTop:10,fontSize:12,color:C.green,fontWeight:600}}>📈 {a.impact}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== OUTCOME FORECAST ===== */}
          {tab==="outcomes"&&(
            <div style={{display:"grid",gap:20}}>
              <Card C={C} style={{padding:isMobile?22:30}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:18,flexDirection:isMobile?"column":"row",marginBottom:22}}>
                  <div>
                    <div style={{fontSize:10,color:C.gold,fontWeight:900,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Creative-to-Media Outcome Forecast</div>
                    <h2 style={{fontSize:isMobile?26:34,fontWeight:800,margin:"0 0 8px",fontFamily:"'Playfair Display',serif",letterSpacing:0}}>Will exposure become memory, preference, action, or waste?</h2>
                    <p style={{fontSize:14,color:C.dim,lineHeight:1.7,margin:0,maxWidth:760}}>Directional brand and performance probabilities if media delivery is adequate. This model is format-aware and platform-aware; it does not claim guaranteed lift.</p>
                  </div>
                  {outcomeForecast&&(
                    <div style={{padding:"12px 16px",borderRadius:14,background:`${outcomeForecast.business_impact_band==="high"?C.green:outcomeForecast.business_impact_band==="risk"?C.red:C.gold}12`,border:`1px solid ${outcomeForecast.business_impact_band==="high"?C.green:outcomeForecast.business_impact_band==="risk"?C.red:C.gold}55`,minWidth:150,textAlign:"center"}}>
                      <div style={{fontSize:9,color:C.muted,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>Impact band</div>
                      <div style={{fontSize:18,color:outcomeForecast.business_impact_band==="high"?C.green:outcomeForecast.business_impact_band==="risk"?C.red:C.gold,fontWeight:900,textTransform:"uppercase"}}>{outcomeForecast.business_impact_band||"Pending"}</div>
                    </div>
                  )}
                </div>
                {outcomeForecast?(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.25fr 0.75fr",gap:14}}>
                    <div style={{padding:16,borderRadius:14,background:C.s2,border:`1px solid ${C.border}`,fontSize:14,color:C.dim,lineHeight:1.75}}>
                      <span style={{color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",marginRight:8}}>Forecast note</span>
                      {outcomeForecast.forecast_note||"Fresh outcome probabilities are available for this creative."}
                    </div>
                    <div style={{padding:16,borderRadius:14,background:`${confidenceMeta(forecastConfidence.level).color}0f`,border:`1px solid ${confidenceMeta(forecastConfidence.level).color}44`}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:10}}>
                        <div style={{fontSize:10,color:C.dim,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Forecast Confidence</div>
                        <ConfidenceChip level={forecastConfidence.level}/>
                      </div>
                      <div style={{fontSize:12,color:C.dim,lineHeight:1.65}}>{forecastConfidence.reason}</div>
                    </div>
                  </div>
                ):(
                  <div style={{padding:18,borderRadius:14,background:C.s2,border:`1px solid ${C.border}`,fontSize:14,color:C.dim,lineHeight:1.75}}>
                    Outcome Forecast will appear on fresh analyses generated with the latest model. Older saved reports remain compatible and do not break this tab.
                  </div>
                )}
              </Card>

              {latestCalibrationResult&&(
                <Card C={C} style={{padding:isMobile?20:24,borderColor:C.gold+"44",background:`linear-gradient(180deg,${C.gold}0d,${C.s1})`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",gap:14,flexDirection:isMobile?"column":"row",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:10,color:C.gold,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Predicted vs Actual</div>
                      <div style={{fontSize:20,color:C.text,fontWeight:900}}>Outcome Calibration Result</div>
                      <div style={{fontSize:12,color:C.dim,marginTop:5}}>Platform: {String(latestCalibration.platform||"").replace(/_/g," ").toUpperCase()} · Confidence: {latestCalibrationResult.confidence}</div>
                    </div>
                    <div style={{textAlign:isMobile?"left":"right"}}>
                      <div style={{fontSize:36,color:outcomeScoreColor(latestCalibrationResult.weighted_accuracy),fontWeight:900,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{latestCalibrationResult.weighted_accuracy??"—"}</div>
                      <div style={{fontSize:10,color:C.dim,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Accuracy Score</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
                    {latestCalibrationComparisons.slice(0,3).map(row=>(
                      <div key={row.label} style={{padding:12,borderRadius:10,background:C.s2,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:900,marginBottom:8}}>{row.label}</div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.dim,lineHeight:1.8}}>
                          <span>Predicted</span><b style={{color:C.gold}}>{row.predicted}</b>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.dim,lineHeight:1.8}}>
                          <span>Actual norm</span><b style={{color:C.cyan}}>{row.normalized_actual}</b>
                        </div>
                        <div style={{marginTop:8,fontSize:10,color:row.verdict==="overestimated"?C.red:row.verdict==="underestimated"?C.amber:C.green,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{row.verdict}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {outcomeForecast&&(<>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,minmax(0,1fr))",gap:14}}>
                  {[
                    ["spontaneous_awareness_lift","Spontaneous Awareness",outcomeForecast.spontaneous_awareness_lift,"Brand memory retrieval",false],
                    ["aided_awareness_lift","Aided Awareness",outcomeForecast.aided_awareness_lift,"Recognition when prompted",false],
                    ["consideration_lift","Consideration",outcomeForecast.consideration_lift,"Preference movement",false],
                    ["purchase_intent_lift","Purchase Intent",outcomeForecast.purchase_intent_lift,"Action readiness",false],
                    ["brand_memory_efficiency","Brand Memory Efficiency",outcomeForecast.brand_memory_efficiency,"Exposure to memory",false],
                  ].map(([key,label,value,sub,invert])=>{
                    const conf=getOutcomeConfidence(key,label,value,invert);
                    return(
                      <Card C={C} key={label} style={{padding:18}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",minHeight:28}}>{label}</div>
                        <div style={{fontSize:34,color:outcomeScoreColor(value,invert),fontWeight:900,fontFamily:"'DM Mono',monospace",margin:"10px 0 4px"}}>{typeof value==="number"?value:"—"}</div>
                        <div style={{fontSize:12,color:C.dim,lineHeight:1.45}}>{sub}</div>
                        <div style={{marginTop:12,fontSize:10,color:outcomeScoreColor(value,invert),fontWeight:900,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Mono',monospace"}}>{outcomeBandLabel(value,invert)}</div>
                        <div style={{marginTop:12}}><ConfidenceChip level={conf.level}/></div>
                        <div style={{marginTop:8,fontSize:11,color:C.dim,lineHeight:1.5}}>{conf.reason}</div>
                      </Card>
                    );
                  })}
                </div>

                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,minmax(0,1fr))",gap:14}}>
                  {[
                    ["vtr_completion_potential",completionOutcomeLabel,outcomeForecast.vtr_completion_potential,isCompletionOutcomeRelevant?"Hook and hold response":"First-glance retention fit",false],
                    ["ctr_response_potential","CTR / Response Potential",outcomeForecast.ctr_response_potential,"Click or response readiness",false],
                    ["media_wastage_risk","Media Wastage Risk",outcomeForecast.media_wastage_risk,"Exposure unlikely to convert",true],
                    ["creative_accountability","Creative Accountability",outcomeForecast.creative_accountability,"Creative-led outcome risk",false],
                    ["media_dependency","Media Dependency",outcomeForecast.media_dependency,"Needs media optimization",false],
                  ].map(([key,label,value,sub,invert])=>{
                    const conf=getOutcomeConfidence(key,label,value,invert);
                    return(
                      <Card C={C} key={label} style={{padding:18}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:900,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",minHeight:28}}>{label}</div>
                        <div style={{fontSize:34,color:outcomeScoreColor(value,invert),fontWeight:900,fontFamily:"'DM Mono',monospace",margin:"10px 0 4px"}}>{typeof value==="number"?value:"—"}</div>
                        <div style={{fontSize:12,color:C.dim,lineHeight:1.45}}>{sub}</div>
                        <div style={{marginTop:12,fontSize:10,color:outcomeScoreColor(value,invert),fontWeight:900,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Mono',monospace"}}>{outcomeBandLabel(value,invert)}</div>
                        <div style={{marginTop:12}}><ConfidenceChip level={conf.level}/></div>
                        <div style={{marginTop:8,fontSize:11,color:C.dim,lineHeight:1.5}}>{conf.reason}</div>
                      </Card>
                    );
                  })}
                </div>

                <Card C={C} style={{padding:isMobile?20:26}}>
                  <CardTitle C={C} label={C.gold}>Accountability Split</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.3fr 0.7fr",gap:22,alignItems:"center"}}>
                    <div>
                      <div style={{display:"flex",height:18,borderRadius:999,overflow:"hidden",background:C.s3,border:`1px solid ${C.border}`,marginBottom:12}}>
                        <div style={{width:`${Math.min(100,Math.max(0,outcomeForecast.creative_accountability||0))}%`,background:C.gold}}/>
                        <div style={{flex:1,background:C.cyan}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontSize:12,color:C.dim,fontFamily:"'DM Mono',monospace"}}>
                        <span><b style={{color:C.gold}}>{outcomeForecast.creative_accountability||0}%</b> Creative accountability</span>
                        <span><b style={{color:C.cyan}}>{outcomeForecast.media_dependency||0}%</b> Media dependency</span>
                      </div>
                    </div>
                    <div style={{padding:16,borderRadius:12,background:C.s2,border:`1px solid ${C.border}`,fontSize:13,color:C.dim,lineHeight:1.7}}>
                      {accountabilityDecision}
                    </div>
                  </div>
                </Card>

                <Card C={C} style={{padding:isMobile?20:26}}>
                  <CardTitle C={C} label={C.purple}>Outcome Driver Matrix</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                    <div style={{padding:18,borderRadius:14,background:`${C.green}0f`,border:`1px solid ${C.green}33`}}>
                      <div style={{fontSize:10,color:C.green,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Primary growth driver</div>
                      <div style={{fontSize:22,color:C.text,fontWeight:900}}>{readableOutcomeKey(outcomeForecast.primary_growth_driver)}</div>
                    </div>
                    <div style={{padding:18,borderRadius:14,background:`${C.red}0f`,border:`1px solid ${C.red}33`}}>
                      <div style={{fontSize:10,color:C.red,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Primary failure risk</div>
                      <div style={{fontSize:22,color:C.text,fontWeight:900}}>{readableOutcomeKey(outcomeForecast.primary_failure_risk)}</div>
                    </div>
                  </div>
                </Card>

                <Card C={C} style={{padding:isMobile?20:26}}>
                  <CardTitle C={C} label={C.cyan}>Platform Outcome Matrix</CardTitle>
                  {platformOutcomeRows.length?(
                    <div style={{display:"grid",gap:10}}>
                      {platformOutcomeRows.map(row=>{
                        const brand=row.data.brand_lift;
                        const perf=row.data.performance_lift;
                        const riskColor=row.data.risk==="low"?C.green:row.data.risk==="medium"?C.amber:C.red;
                        const platformLevel=normalizeConfidenceLevel(row.data.confidence)||fallbackConfidence(`platform_${row.key}`,row.label,Math.round(((brand||0)+(perf||0))/2)).level;
                        const platformReason=row.data.confidence_reason||fallbackConfidence(`platform_${row.key}`,row.label,Math.round(((brand||0)+(perf||0))/2)).reason;
                        return(
                          <div key={row.key} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"150px 1fr 1fr 90px 145px 1.5fr",gap:12,alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{fontSize:14,color:C.text,fontWeight:900}}>{row.label}</div>
                            <div>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",marginBottom:4}}><span>Brand lift readiness</span><b style={{color:outcomeScoreColor(brand)}}>{brand??"—"}</b></div>
                              <div style={{height:6,borderRadius:999,background:C.s3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,brand||0))}%`,background:outcomeScoreColor(brand),borderRadius:999}}/></div>
                            </div>
                            <div>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",marginBottom:4}}><span>Performance readiness</span><b style={{color:outcomeScoreColor(perf)}}>{perf??"—"}</b></div>
                              <div style={{height:6,borderRadius:999,background:C.s3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,perf||0))}%`,background:outcomeScoreColor(perf),borderRadius:999}}/></div>
                            </div>
                            <div style={{justifySelf:isMobile?"start":"center",padding:"4px 9px",borderRadius:999,background:`${riskColor}16`,border:`1px solid ${riskColor}44`,color:riskColor,fontSize:10,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{row.data.risk||"—"}</div>
                            <div><ConfidenceChip level={platformLevel}/></div>
                            <div style={{fontSize:12,color:C.dim,lineHeight:1.55}}>{row.data.note}{platformReason&&<div style={{marginTop:5,fontSize:11,color:C.muted,lineHeight:1.45}}>Confidence: {platformReason}</div>}</div>
                          </div>
                        );
                      })}
                    </div>
                  ):(
                    <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>Platform-adjusted outcome probabilities will appear on fresh analyses generated with the latest model.</div>
                  )}
                </Card>

                <Card C={C} style={{padding:22,borderColor:C.gold+"44",background:`linear-gradient(180deg,${C.gold}0d,${C.s1})`}}>
                  <div style={{fontSize:18,color:C.text,fontWeight:900,marginBottom:8}}>CMO interpretation</div>
                  <div style={{fontSize:14,color:C.dim,lineHeight:1.75}}>Media buys exposure. Creative determines whether exposure becomes memory, preference, action, or waste. Use this forecast to decide whether to fix creative first, optimize media first, or scale with controlled platform-specific learning.</div>
                </Card>
              </>)}
            </div>
          )}

          {tab==="neuriq"&&results&&<NeurIQTab results={results} C={C}/>}

          {/* ===== REPOSITORY ===== */}
          {tab==="repository"&&(<>
            <Card C={C} style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row",marginBottom:18}}>
                <CardTitle C={C} label={C.gold}>{repoMode==="competitive"?"Competitive Creative Intelligence":repoMode==="dna"?"Brand Creative DNA":repoMode==="calibration"?"Outcome Calibration Engine":"Saved Analysis Repository"}</CardTitle>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    ["saved","Saved Reports"],
                    ["competitive","🔍 Competitive Intel"],
                    ["dna","🧬 Brand DNA"],
                    ["calibration","📈 Outcome Calibration"],
                  ].map(([id,label])=>(
                    <button key={id} onClick={()=>{
                      setRepoMode(id);
                      if(id==="saved")loadRepository();
                      if(id==="competitive"){
                        loadRepository();
                        loadCompetitiveIntel(competitiveBrand||competitorOf||form.brand);
                      }
                      if(id==="dna"){
                        setRepoDnaBrand(repoDnaBrand||form.brand||"");
                      }
                      if(id==="calibration"&&token.trim()){
                        setCalibrationForm(prev=>({...prev,analysis_id:prev.analysis_id||results?.__savedAnalysisId||""}));
                        loadOutcomeCalibrations();
                      }
                    }} style={{padding:"9px 12px",borderRadius:10,border:`1px solid ${repoMode===id?C.gold+"66":C.border}`,background:repoMode===id?`${C.gold}16`:C.s2,color:repoMode===id?C.gold:C.dim,fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {repoMode==="saved"?(
                <div style={{display:"flex",gap:10,flexWrap:"wrap",padding:"12px 16px",background:C.s2,borderRadius:8,border:`1px solid ${C.border}`,marginBottom:16}}>
                  <input style={{...repoInputStyle,flex:2,minWidth:160}} placeholder="Search brand..." value={repoSearch} onChange={e=>setRepoSearch(e.target.value)}/>
                  <select style={{...repoSelectStyle,flex:1,minWidth:120}} value={repoFilterFormat} onChange={e=>setRepoFilterFormat(e.target.value)}>
                    <option value="">All Formats</option>
                    <option value="video">Video</option>
                    <option value="static_image">Static Image</option>
                    <option value="motion_static">Animated / GIF</option>
                    <option value="audio">Audio</option>
                    <option value="text">Text / Script</option>
                  </select>
                  <select style={{...repoSelectStyle,flex:1,minWidth:100}} value={repoFilterGrade} onChange={e=>setRepoFilterGrade(e.target.value)}>
                    <option value="">All Grades</option>
                    {["A+","A","A-","B+","B","B-","C+","C","C-","D","F"].map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                  <select style={{...repoSelectStyle,flex:1,minWidth:120}} value={repoFilterStage} onChange={e=>setRepoFilterStage(e.target.value)}>
                    <option value="">All Stages</option>
                    <option value="concept">Concept</option>
                    <option value="storyboard">Storyboard</option>
                    <option value="roughcut">Rough Cut</option>
                    <option value="final">Final</option>
                  </select>
                  {(repoSearch||repoFilterFormat||repoFilterGrade||repoFilterStage)&&(
                    <button onClick={()=>{
                      setRepoSearch("");
                      setRepoFilterFormat("");
                      setRepoFilterGrade("");
                      setRepoFilterStage("");
                    }} style={{background:"transparent",border:`1px solid ${C.border2}`,borderRadius:6,padding:"6px 12px",color:C.dim,fontSize:11,cursor:"pointer"}}>
                      ✕ Clear
                    </button>
                  )}
                </div>
              ):repoMode==="competitive"?(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(240px,0.45fr) auto",gap:12,alignItems:"end"}}>
                  <label style={{display:"grid",gap:6,fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'DM Mono',monospace"}}>
                    Your Brand
                    <input value={competitiveBrand} onChange={e=>setCompetitiveBrand(e.target.value)}
                      placeholder="e.g. Coca-Cola"
                      style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                  </label>
                  <button onClick={()=>loadCompetitiveIntel(competitiveBrand)}
                    style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.purple}55`,background:`${C.purple}16`,color:C.purple,fontWeight:900,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Load Competitive Dashboard
                  </button>
                </div>
              ):repoMode==="dna"?(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(240px,0.45fr) auto",gap:12,alignItems:"end"}}>
                  <label style={{display:"grid",gap:6,fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'DM Mono',monospace"}}>
                    Your Brand
                    <input value={repoDnaBrand} onChange={e=>setRepoDnaBrand(e.target.value)}
                      placeholder="e.g. Philips"
                      style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                  </label>
                  <button onClick={()=>loadBrandDna(repoDnaBrand)}
                    style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:`${C.gold}16`,color:C.gold,fontWeight:900,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    Load Brand DNA
                  </button>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto",gap:12,alignItems:"end"}}>
                  <div style={{padding:"12px 14px",borderRadius:12,background:`${C.gold}0d`,border:`1px solid ${C.gold}30`,fontSize:12,color:C.dim,lineHeight:1.65}}>
                    <b style={{color:C.gold}}>Private calibration:</b> Campaign actuals are scoped to your analysis token and are not visible to other agencies, brands, or competitors.
                  </div>
                  <button onClick={()=>loadOutcomeCalibrations()}
                    disabled={!token.trim()||calibrationLoading}
                    style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:token.trim()?`${C.gold}16`:C.s2,color:token.trim()?C.gold:C.muted,fontWeight:900,cursor:token.trim()?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
                    {calibrationLoading?"Loading...":"Load Private Calibrations"}
                  </button>
                </div>
              )}
            </Card>
            {repoMode==="calibration"?(
              !token.trim()?(
                <Card C={C} style={{padding:28,textAlign:"center",borderColor:C.gold+"33"}}>
                  <div style={{fontSize:28,marginBottom:10}}>🔐</div>
                  <div style={{fontSize:18,color:C.text,fontWeight:900,marginBottom:8}}>Enter your analysis token above to access your private calibration data.</div>
                  <div style={{fontSize:14,color:C.dim,lineHeight:1.7}}>Outcome actuals are commercially sensitive. AdCritIQ™ only loads calibration rows that match your private token hash.</div>
                </Card>
              ):(
                <div style={{display:"grid",gap:18}}>
                  <Card C={C} style={{padding:24}}>
                    <CardTitle C={C} label={C.gold}>Add Actual Campaign Outcomes</CardTitle>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:12,marginBottom:16}}>
                      {calibrationInput("analysis_id","Saved Analysis ID","Auto-fills after save","text")}
                      <label style={{display:"grid",gap:6,fontSize:10,fontWeight:900,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'DM Mono',monospace"}}>
                        Platform
                        <select value={calibrationForm.platform} onChange={e=>setCalibrationForm(prev=>({...prev,platform:e.target.value}))} style={repoSelectStyle}>
                          {["youtube","meta","instagram","tiktok","tv","ctv_ott","dooh","programmatic_display","linkedin"].map(p=><option key={p} value={p}>{p.replace(/_/g," ").toUpperCase()}</option>)}
                        </select>
                      </label>
                      {calibrationInput("campaign_start_date","Start Date","","date")}
                      {calibrationInput("campaign_end_date","End Date","","date")}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(4,1fr)",gap:12,marginBottom:16}}>
                      {calibrationInput("actual_vtr","VTR %","e.g. 62")}
                      {calibrationInput("actual_ctr","CTR %","e.g. 1.2")}
                      {calibrationInput("actual_completion_rate","Completion %","e.g. 74")}
                      {calibrationInput("actual_brand_lift","Brand Lift pp","e.g. 4.5")}
                      {calibrationInput("actual_aided_awareness_lift","Aided Awareness pp","e.g. 5")}
                      {calibrationInput("actual_spontaneous_awareness_lift","Spont. Awareness pp","e.g. 2.5")}
                      {calibrationInput("actual_consideration_lift","Consideration pp","e.g. 3")}
                      {calibrationInput("actual_purchase_intent_lift","Purchase Intent pp","e.g. 2")}
                      {calibrationInput("actual_sales_proxy","Sales Proxy","optional")}
                      {calibrationInput("actual_store_visits","Store Visits","optional")}
                      {calibrationInput("actual_roas","ROAS","optional")}
                      {calibrationInput("target_roas","Target ROAS","optional")}
                    </div>
                    <label style={{display:"grid",gap:6,fontSize:10,fontWeight:900,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'DM Mono',monospace",marginBottom:16}}>
                      Notes
                      <textarea value={calibrationForm.notes} onChange={e=>setCalibrationForm(prev=>({...prev,notes:e.target.value}))} placeholder="Campaign context, media caveats, test cell details..." style={{...repoInputStyle,minHeight:84,resize:"vertical"}}/>
                    </label>
                    <button onClick={saveOutcomeCalibration} disabled={calibrationSaving} style={{padding:"12px 18px",borderRadius:10,border:"none",background:C.gold,color:C.ink,fontWeight:900,cursor:calibrationSaving?"wait":"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                      {calibrationSaving?"Saving Calibration...":"Save Outcome Calibration"}
                    </button>
                  </Card>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:14}}>
                    {[
                      ["Calibrated Rows",calibrationAgg.total_rows??0,C.gold],
                      ["Avg Accuracy",calibrationAgg.average_accuracy??"—",outcomeScoreColor(calibrationAgg.average_accuracy)],
                      ["Confidence",calibrationAgg.confidence||"none",C.cyan],
                      ["Bias",calibrationAgg.bias_label||"not available",calibrationAgg.average_bias>10?C.red:calibrationAgg.average_bias<-10?C.amber:C.green],
                    ].map(([label,value,color])=>(
                      <Card C={C} key={label} style={{padding:18}}>
                        <div style={{fontSize:10,color:C.muted,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>{label}</div>
                        <div style={{fontSize:24,color,fontWeight:900,textTransform:typeof value==="string"?"uppercase":"none",fontFamily:"'DM Mono',monospace"}}>{value}</div>
                      </Card>
                    ))}
                  </div>
                  <Card C={C} style={{padding:22}}>
                    <CardTitle C={C} label={C.cyan}>KPI Accuracy Breakdown</CardTitle>
                    {calibrationAgg.kpi_accuracy?.length?(
                      <div style={{display:"grid",gap:10}}>
                        {calibrationAgg.kpi_accuracy.map(row=>(
                          <div key={row.label} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 120px 120px",gap:12,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{fontSize:13,color:C.text,fontWeight:900}}>{row.label}</div>
                            <div style={{fontSize:12,color:outcomeScoreColor(row.average_accuracy),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{row.average_accuracy}% accuracy</div>
                            <div style={{fontSize:12,color:C.dim,fontFamily:"'DM Mono',monospace"}}>{row.count} sample{row.count===1?"":"s"}</div>
                          </div>
                        ))}
                      </div>
                    ):(
                      <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>No comparable KPI rows yet. Add at least one actual KPI that maps to an Outcome Forecast score.</div>
                    )}
                  </Card>
                  <Card C={C} style={{padding:22}}>
                    <CardTitle C={C} label={C.gold}>Recent Private Calibrations</CardTitle>
                    {calibrationRows.length?(
                      <div style={{display:"grid",gap:10}}>
                        {calibrationRows.slice(0,10).map(row=>{
                          const result=row.calibration_result||{};
                          return(
                            <div key={row.id} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"140px 1fr 110px 130px",gap:12,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                              <div style={{fontSize:11,color:C.dim,fontFamily:"'DM Mono',monospace"}}>{row.created_at?new Date(row.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}</div>
                              <div>
                                <div style={{fontSize:13,color:C.text,fontWeight:900}}>{row.brand||"Unknown Brand"} · {String(row.platform||"").replace(/_/g," ").toUpperCase()}</div>
                                <div style={{fontSize:11,color:C.dim,marginTop:3}}>{row.campaign||"Campaign actuals"} · {row.creative_type||"format unknown"}</div>
                              </div>
                              <div style={{fontSize:18,color:outcomeScoreColor(result.weighted_accuracy),fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{result.weighted_accuracy??"—"}</div>
                              <div style={{fontSize:10,color:result.verdict==="overestimated"?C.red:result.verdict==="underestimated"?C.amber:C.green,fontWeight:900,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{result.verdict||"not comparable"}</div>
                            </div>
                          );
                        })}
                      </div>
                    ):(
                      <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>No private calibration rows loaded yet. Save actual campaign outcomes to begin building your evidence base.</div>
                    )}
                  </Card>
                  <Card C={C} style={{padding:18,borderColor:C.gold+"33",background:`${C.gold}0d`}}>
                    <div style={{fontSize:13,color:C.text,fontWeight:900,marginBottom:6}}>Engine learning status</div>
                    <div style={{fontSize:12,color:C.dim,lineHeight:1.7}}>Future forecasts use private calibration memory only when enough matching rows exist: 3+ brand/platform rows or 5+ industry/format/platform rows. Until then, the module records evidence without changing predictions.</div>
                  </Card>
                </div>
              )
            ):repoMode==="dna"?(
              repoDnaLoading?(
                <Card C={C} style={{textAlign:"center"}}>
                  <div style={{fontSize:15,color:C.gold,fontWeight:800}}>Loading Brand DNA...</div>
                </Card>
              ):!repoDnaData?(
                <Card C={C} style={{padding:24}}>
                  <div style={{fontSize:18,color:C.text,fontWeight:900,marginBottom:8}}>Load a brand fingerprint</div>
                  <div style={{fontSize:14,color:C.dim,lineHeight:1.7}}>Enter your brand name to profile its creative DNA from saved analyses. A fingerprint unlocks after 5 non-competitor analyses.</div>
                </Card>
              ):repoDnaData.ready===false?(
                <Card C={C} style={{padding:24,borderColor:C.gold+"44"}}>
                  <div style={{fontSize:18,color:C.text,fontWeight:900,marginBottom:8}}>Brand DNA — {repoDnaBrand}</div>
                  <div style={{fontSize:14,color:C.dim,lineHeight:1.7,marginBottom:16}}>
                    Brand DNA unlocks at 5 analyses — <span style={{color:C.gold,fontWeight:900}}>{repoDnaData.count}/5 complete.</span> Analyse {repoDnaData.needed} more {repoDnaBrand} creative{repoDnaData.needed===1?"":"s"} to generate the fingerprint.
                  </div>
                  <div style={{height:6,borderRadius:3,background:C.border,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(100,(repoDnaData.count||0)/5*100)}%`,background:C.gold,borderRadius:3}}/>
                  </div>
                </Card>
              ):(
                <div style={{display:"grid",gap:18}}>
                  <Card C={C} style={{padding:24,borderColor:C.gold+"44",background:`linear-gradient(135deg,${C.gold}0d,${C.s1})`}}>
                    <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:14,flexDirection:isMobile?"column":"row"}}>
                      <div>
                        <div style={{fontSize:28,color:C.text,fontWeight:900,lineHeight:1.1,marginBottom:8}}>{repoDnaBrand}</div>
                        <div style={{fontSize:13,color:C.dim,marginBottom:10}}>{repoDnaData.count} creatives profiled</div>
                        <div style={{fontSize:12,color:C.dim,fontStyle:"italic",lineHeight:1.65}}>This is the {repoDnaBrand} creative fingerprint — the neural signature that defines the brand's advertising identity.</div>
                      </div>
                      <span style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:C.cyan,background:`${C.cyan}12`,border:`1px solid ${C.cyan}33`,padding:"5px 9px",borderRadius:6,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>
                        {String(repoDnaData.dominant_format||"Unknown").replace(/_/g," ")}
                      </span>
                    </div>
                  </Card>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:14}}>
                    {dnaTraitCards.map(([label,key])=>{
                      const score=repoDnaData.traits?.[key]??0;
                      const consistency=repoDnaData.traits?.trait_consistency?.[key]??0;
                      const color=dnaConsistencyColor(consistency);
                      return(
                        <Card C={C} key={key} style={{padding:22}}>
                          <div style={{fontSize:10,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14}}>{label}</div>
                          <div style={{fontSize:44,color:C.text,fontWeight:900,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{score}</div>
                          <div style={{fontSize:10,color:C.dim,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",margin:"9px 0 12px"}}>Signature Strength</div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{height:6,flex:1,borderRadius:3,background:C.s3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${consistency}%`,background:color,borderRadius:3}}/>
                            </div>
                            <span style={{fontSize:10,color:color,fontWeight:900,fontFamily:"'DM Mono',monospace",minWidth:38,textAlign:"right"}}>{consistency}%</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <Card C={C} style={{padding:24}}>
                    <CardTitle C={C} label={C.gold}>Metric-Level Fingerprint</CardTitle>
                    <div style={{display:"grid",gap:16}}>
                      {DNA_METRICS.map(([label,key],idx)=>{
                        const mean=repoDnaData.metric_means?.[key]??0;
                        const std=repoDnaData.metric_stddev?.[key]??0;
                        const color=dnaMetricColors[idx%dnaMetricColors.length];
                        const bandLeft=Math.max(0,mean-std);
                        const bandRight=Math.min(100,mean+std);
                        return(
                          <div key={key}>
                            <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:12,marginBottom:6}}>
                              <span style={{fontSize:12,color:C.text,fontWeight:800}}>{label}</span>
                              <span style={{fontSize:13,color:color,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>
                                {mean}<span style={{fontSize:8,color:C.muted,marginLeft:7}}>±{std}σ</span>
                              </span>
                            </div>
                            <div style={{height:9,borderRadius:999,background:C.s3,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",left:`${bandLeft}%`,width:`${Math.max(0,bandRight-bandLeft)}%`,top:0,bottom:0,background:color,opacity:0.2,borderRadius:999}}/>
                              <div style={{position:"relative",height:"100%",width:`${mean}%`,background:color,borderRadius:999}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )
            ):repoMode==="competitive"?(
              competitiveIntelLoading?(
                <Card C={C} style={{textAlign:"center"}}>
                  <div style={{fontSize:15,color:C.purple,fontWeight:800}}>Loading competitive intelligence...</div>
                </Card>
              ):!competitiveIntel||competitiveCompetitors.length===0?(
                <Card C={C} style={{padding:28}}>
                  <div style={{fontSize:18,color:C.text,fontWeight:900,marginBottom:10}}>No competitor analyses yet</div>
                  <div style={{fontSize:14,color:C.dim,lineHeight:1.7,marginBottom:18}}>Build a competitive dashboard by tagging competitor creative uploads against your own brand.</div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
                    {[
                      ["01","Download a competitor ad","Use Meta Ad Library, YouTube, or any public source to download one ad at a time."],
                      ["02","Enable Competitive Intel Mode on upload","Toggle 'Competitive Intelligence Mode' — NOT 'Compare 2 Creatives'. Enter YOUR brand name in the competitor-of field."],
                      ["03","Analyse, save, and repeat","Each saved analysis adds to this dashboard. After 3+ uploads, trend data appears."],
                    ].map(([num,title,body])=>(
                      <div key={num} style={{padding:16,borderRadius:14,background:C.s2,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:11,color:C.purple,fontWeight:900,fontFamily:"'DM Mono',monospace",marginBottom:8}}>{num}</div>
                        <div style={{fontSize:14,color:C.text,fontWeight:900,marginBottom:6}}>{title}</div>
                        <div style={{fontSize:12,color:C.dim,lineHeight:1.55}}>{body}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ):(
                <div style={{display:"grid",gap:18}}>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
                    {[competitiveOwn,...competitiveCompetitors].filter(Boolean).map((brandCard,idx)=>{
                      const isOwn=idx===0;
                      const score=brandCard?.averages?.grade_score;
                      const color=isOwn?C.gold:C.purple;
                      return(
                        <Card C={C} key={`${brandCard.brand}-${idx}`} style={{padding:20,borderColor:isOwn?C.gold+"66":C.border}}>
                          <div style={{fontSize:10,color:color,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>{isOwn?"Your Brand":"Competitor"}</div>
                          <div style={{fontSize:20,color:C.text,fontWeight:900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{brandCard.brand}</div>
                          <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:12}}>
                            <span style={{fontSize:34,color:score!=null?color:C.dim,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{score??"—"}</span>
                            <span style={{fontSize:11,color:C.dim,fontWeight:800}}>avg score</span>
                          </div>
                          <div style={{fontSize:12,color:C.dim,marginTop:6}}>{brandCard.count} analysis{brandCard.count===1?"":"es"}{brandCard.latest?` · latest ${new Date(brandCard.latest).toLocaleDateString("en-GB")}`:""}</div>
                        </Card>
                      );
                    })}
                  </div>
                  <Card C={C} style={{padding:22}}>
                    <CardTitle C={C} label={C.purple}>Metric Gap Analysis</CardTitle>
                    <div style={{display:"grid",gap:10}}>
                      {competitiveGapRows.map(row=>{
                        const lead=row.gap==null?null:row.gap>=0;
                        const gapColor=row.gap==null?C.dim:lead?C.green:C.red;
                        return(
                          <div key={row.key} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.1fr 0.7fr 0.9fr 0.5fr",gap:10,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                            <div style={{fontSize:13,color:C.text,fontWeight:900}}>{row.label}</div>
                            <div style={{fontSize:12,color:C.dim}}>Own avg: <span style={{color:C.gold,fontWeight:900}}>{row.ownVal??"—"}</span></div>
                            <div style={{fontSize:12,color:C.dim}}>Best competitor: <span style={{color:C.purple,fontWeight:900}}>{row.best?`${row.best.brand} ${row.best.value}`:"—"}</span></div>
                            <div style={{justifySelf:isMobile?"start":"end",padding:"5px 9px",borderRadius:999,background:`${gapColor}15`,border:`1px solid ${gapColor}40`,color:gapColor,fontSize:12,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>
                              {row.gap==null?"—":`${row.gap>=0?"+":""}${row.gap}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                  <Card C={C} style={{padding:22}}>
                    <CardTitle C={C} label={C.red}>Biggest Competitive Gaps</CardTitle>
                    {competitiveInsights.length?(
                      <div style={{display:"grid",gap:10}}>
                        {competitiveInsights.map((line,idx)=>(
                          <div key={line} style={{padding:"12px 14px",borderRadius:12,background:`${C.red}10`,border:`1px solid ${C.red}30`,fontSize:13,color:C.dim,lineHeight:1.6}}>
                            <span style={{color:C.red,fontWeight:900,fontFamily:"'DM Mono',monospace",marginRight:8}}>GAP {idx+1}</span>{line}
                          </div>
                        ))}
                      </div>
                    ):(
                      <div style={{fontSize:14,color:C.green,lineHeight:1.7,fontWeight:800}}>No negative gaps detected against the current competitor set.</div>
                    )}
                  </Card>
                  <Card C={C} style={{padding:22}}>
                    <CardTitle C={C} label={C.purple}>Competitor Creative History</CardTitle>
                    {Object.keys(groupedCompetitorAnalyses).length===0?(
                      <div style={{fontSize:13,color:C.dim,lineHeight:1.7}}>No saved competitor rows are currently loaded for {competitiveBrand||"this brand"}. Refresh the repository or save more competitor analyses to build trend history.</div>
                    ):(
                      <>
                        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8}}>
                          <button onClick={()=>{
                            const allExpanded={};
                            Object.keys(groupedCompetitorAnalyses).forEach(b=>{allExpanded[b]=true;});
                            setExpandedCompetitorBrands(allExpanded);
                          }} style={repoMiniButton}>EXPAND ALL</button>
                          <button onClick={()=>setExpandedCompetitorBrands({})} style={repoMiniButton}>COLLAPSE ALL</button>
                        </div>
                        {Object.entries(groupedCompetitorAnalyses).map(([brand,items])=>{
                          const isExpanded=expandedCompetitorBrands[brand];
                          const avg=Math.round(items.reduce((sum,a)=>sum+(a.hook_strength||a.full_result?.hook_strength||gradeToNum(analysisGrade(a))),0)/Math.max(items.length,1));
                          return(
                            <div key={brand} style={{marginBottom:8}}>
                              <div onClick={()=>setExpandedCompetitorBrands(prev=>({...prev,[brand]:!prev[brand]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:isExpanded?`${C.purple}12`:C.s2,border:`1px solid ${isExpanded?C.purple+"44":C.border}`,borderRadius:isExpanded?"8px 8px 0 0":8,cursor:"pointer",userSelect:"none",transition:"all 0.15s ease"}}>
                                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                                  <span style={{fontSize:14,fontWeight:800,color:C.text}}>🔍 {brand}</span>
                                  <span style={{fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",background:C.s3,padding:"2px 8px",borderRadius:10}}>{items.length} {items.length===1?"analysis":"analyses"}</span>
                                  <span style={{fontSize:11,fontWeight:900,color:C.purple,background:`${C.purple}12`,border:`1px solid ${C.purple}44`,padding:"2px 8px",borderRadius:6}}>Avg neural score: {avg||"—"}</span>
                                </div>
                                <span style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",display:"inline-block",transition:"transform 0.15s ease",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                              </div>
                              {isExpanded&&renderAnalysisRows(items,brand,{accent:C.purple})}
                            </div>
                          );
                        })}
                        <div style={{padding:"10px 14px",borderRadius:10,background:C.s2,border:`1px solid ${C.border}`,fontSize:12,color:C.dim,lineHeight:1.6}}>
                          Your brand avg: <span style={{color:C.gold,fontWeight:900}}>{competitiveOwn?.averages?.grade_score??"—"}</span> · Best competitor avg: <span style={{color:C.purple,fontWeight:900}}>{Math.max(...competitiveCompetitors.map(c=>c?.averages?.grade_score||0))||"—"}</span>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              )
            ):repoLoading?(
              <Card C={C} style={{textAlign:"center"}}>
                <div style={{fontSize:15,color:C.gold,fontWeight:700}}>Loading repository...</div>
              </Card>
            ):Object.keys(groupedByBrand).length===0?(
              <Card C={C} style={{textAlign:"center"}}>
                <div style={{fontSize:18,color:C.text,fontWeight:700,marginBottom:8}}>{savedAnalyses.length===0?"No saved analyses yet":"No analyses match these filters"}</div>
                <div style={{fontSize:14,color:C.dim}}>{savedAnalyses.length===0?"Saved analysis reports will appear here.":"Adjust or clear the filters to see more saved reports."}</div>
              </Card>
            ):(
              <div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginBottom:8}}>
                  <button onClick={()=>{
                    const allExpanded={};
                    Object.keys(groupedByBrand).forEach(b=>{allExpanded[b]=true;});
                    setExpandedRepoBrands(allExpanded);
                  }} style={repoMiniButton}>EXPAND ALL</button>
                  <button onClick={()=>setExpandedRepoBrands({})} style={repoMiniButton}>COLLAPSE ALL</button>
                </div>
                {Object.entries(groupedByBrand).map(([brand,items])=>{
                  const isExpanded=expandedRepoBrands[brand];
                  const latestGrade=analysisGrade(items[0]);
                  return(
                    <div key={brand} style={{marginBottom:8}}>
                      <div onClick={()=>setExpandedRepoBrands(prev=>({...prev,[brand]:!prev[brand]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:isExpanded?"rgba(245,158,11,0.06)":C.s2,border:`1px solid ${isExpanded?C.gold+"44":C.border}`,borderRadius:isExpanded?"8px 8px 0 0":8,cursor:"pointer",userSelect:"none",transition:"all 0.15s ease"}}>
                        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                          <span style={{fontSize:14,fontWeight:800,color:C.text}}>{brand}</span>
                          <span style={{fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",background:C.s3,padding:"2px 8px",borderRadius:10}}>{items.length} {items.length===1?"analysis":"analyses"}</span>
                          <span style={{fontSize:11,fontWeight:900,color:C.gold,background:"rgba(245,158,11,0.1)",border:`1px solid ${C.gold}44`,padding:"2px 8px",borderRadius:6}}>Latest: {latestGrade}</span>
                        </div>
                        <span style={{fontSize:10,color:C.dim,fontFamily:"'DM Mono',monospace",display:"inline-block",transition:"transform 0.15s ease",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                      </div>
                      {isExpanded&&renderAnalysisRows(items,brand,{accent:C.gold})}
                    </div>
                  );
                })}
              </div>
            )}
          </>)}

          {/* ===== METHODOLOGY & GLOSSARY ===== */}
          {tab==="methodology"&&(()=>{
            const METH_TABS=[
              {id:"overview",   label:"How It Works"},
              {id:"grading",    label:"Grade & Scoring"},
              {id:"metrics",    label:"All 17 Metrics"},
              {id:"neural",     label:"Neural Science"},
              {id:"platforms",  label:"Platform Scoring"},
              {id:"science",    label:"Research Basis"},
              {id:"limits",     label:"Limitations"},
            ];
            const MethSection=({sectionKey,title,children})=>{
              const open=!!expandedMethSections[sectionKey];
              return(
                <div style={{marginBottom:8}}>
                  <div
                    onClick={()=>toggleMethSection(sectionKey)}
                    style={{
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"space-between",
                      padding:"12px 16px",
                      cursor:"pointer",
                      borderRadius:open?"8px 8px 0 0":8,
                      background:open?"rgba(245,158,11,0.07)":C.s2,
                      border:`1px solid ${open?C.gold+"44":C.border}`,
                      borderBottom:open?"none":`1px solid ${C.border}`,
                      marginBottom:open?0:8,
                      transition:"all 0.15s ease",
                      userSelect:"none"
                    }}
                  >
                    <span style={{fontSize:12,fontWeight:700,color:open?C.gold:C.text,fontFamily:"monospace",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                      {title}
                    </span>
                    <span style={{fontSize:10,color:open?C.gold:C.dim,fontFamily:"monospace",transition:"transform 0.15s ease",transform:open?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>
                      ▼
                    </span>
                  </div>
                  {open&&(
                    <div style={{padding:16,background:C.s1,border:`1px solid ${C.gold}44`,borderTop:"none",borderRadius:"0 0 8px 8px",marginBottom:8}}>
                      {children}
                    </div>
                  )}
                </div>
              );
            };
            const MethHint=()=>!Object.keys(expandedMethSections).some(k=>k.startsWith(methTab)&&expandedMethSections[k])&&(
              <div style={{padding:16,textAlign:"center",color:C.muted,fontSize:11,fontStyle:"italic",marginTop:8}}>
                Click any section above to expand
              </div>
            );
            return(<>
              {/* Sub-tab nav */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:28}}>
                {METH_TABS.map(mt=>(
                  <button key={mt.id} onClick={()=>setMethTab(mt.id)}
                    style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${methTab===mt.id?C.gold:C.border}`,background:methTab===mt.id?`${C.gold}18`:C.s2,color:methTab===mt.id?C.gold:C.dim,fontSize:12,fontWeight:methTab===mt.id?700:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}>
                    {mt.label}
                  </button>
                ))}
              </div>

              {/* ── OVERVIEW ── */}
              {methTab==="overview"&&(<>
                <MethSection sectionKey="overview_how_it_works" title="What AdCritIQ Does">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.cyan}>What AdCritIQ Does</CardTitle>
                  <p style={{fontSize:15,color:C.dim,lineHeight:1.9,marginBottom:24}}>AdCritIQ is a predictive neural creative intelligence platform. It does not measure actual brain activity — it <b style={{color:C.text}}>predicts</b> how the human brain is likely to respond to an advertising creative based on visual signals, advertising science, and platform-specific norms.</p>
                  <div style={{display:"grid",gridTemplateColumns:threeGrid,gap:16}}>
                    {[
                      [C.cyan,"STAGE 1","Frame Extraction","1–3 key frames are extracted from your creative at optimal intervals. For videos, frames are sampled at the beginning, middle, and near the end to capture the full narrative arc."],
                      [C.purple,"STAGE 2","Neural Analysis","Each frame is analysed by a multimodal AI vision model against 17 advertising science constructs — attention, memory, emotion, brand recall, cognitive load, and more."],
                      [C.green,"STAGE 3","Platform Calibration","Raw scores are calibrated against 15 platform environments, adjusting for sound-on vs sound-off, aspect ratio norms, viewing duration, and algorithmic distribution signals."],
                    ].map(([color,stage,title,desc])=>(
                      <div key={stage} style={{background:C.s2,borderRadius:12,padding:24,borderTop:`4px solid ${color}`}}>
                        <div style={{fontSize:11,fontWeight:700,color:color,fontFamily:"'DM Mono',monospace",marginBottom:6,letterSpacing:2}}>{stage}</div>
                        <div style={{fontSize:16,fontWeight:700,marginBottom:10,color:C.text}}>{title}</div>
                        <p style={{fontSize:13,color:C.dim,lineHeight:1.7}}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="overview_output_map" title="What You Get — Full Output Map">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.amber}>What You Get — Full Output Map</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:threeGrid,gap:12}}>
                    {[
                      [C.cyan,"17 Neural Metrics","Viral Potential, Hook Strength, Hold Rate, Emotional Peak, Brand Recall, Memory Encoding, Sound-Off Survival, Share Intent, Creative Efficiency, Ad Fatigue Risk, Cultural Resonance, Celebrity Index, Brand Safety, Regulatory Compliance, 1P Data Opportunity, Carbon Signal, System 1/2 Balance"],
                      [C.purple,"15 Platform Scores","YouTube 6s, YouTube 15s, YouTube In-Stream, Instagram Reels, Instagram Stories, Instagram Feed, Meta Feed, Meta Stories, TikTok, LinkedIn, Twitter/X, TV Broadcast, CTV/OTT, DOOH, Programmatic Display"],
                      [C.green,"4 Intelligence Layers","Scene-by-scene attention + emotion breakdown · Strategic Insights with verdict tags · CMO Playbook with effort/impact ratings · Privacy & DPDP compliance audit"],
                      [C.amber,"2 Predictive Curves","Second-by-second Attention Curve covering full video duration · Second-by-second Emotion Curve showing emotional journey across the creative"],
                      [C.pink,"8 Brain Regions","Visual Cortex, Prefrontal Cortex, Amygdala, Hippocampus, Auditory Cortex, Mirror Neurons, Nucleus Accumbens, Anterior Cingulate — each scored 0–100"],
                      [C.teal,"7 Cognitive Channels","Visual, Auditory, Motion, Text Overlay, Brand Elements, Human Faces, Color Saturation — showing where cognitive load is distributed"],
                    ].map(([color,title,desc])=>(
                      <div key={title} style={{background:C.s2,borderRadius:10,padding:18,borderLeft:`3px solid ${color}`}}>
                        <div style={{fontSize:13,fontWeight:700,color:color,marginBottom:8}}>{title}</div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.7}}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="grading_outcome_calibration" title="Outcome Calibration Engine">
                <Card C={C}>
                  <CardTitle C={C} label={C.gold}>Outcome Calibration Engine</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.85,marginBottom:18}}>Outcome Calibration compares AdCritIQ™ forecast scores with actual post-campaign outcomes entered by the brand or agency. This creates an evidence loop: the platform can identify whether it predicted correctly, overestimated, or underestimated creative response for a specific brand, category, format, and platform.</p>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12,marginBottom:18}}>
                    {[
                      ["Private by token","Actual campaign KPIs are scoped to the user's analysis token hash. Other agencies or brands cannot load those calibration rows.",C.gold],
                      ["Predictive, not biometric","Calibration validates forecast accuracy against campaign outcomes. It does not claim live brain measurement or guaranteed sales lift.",C.cyan],
                      ["Learning threshold","Future forecasts use calibration memory only after enough private rows exist: 3+ brand/platform or 5+ category-format/platform.",C.green],
                    ].map(([title,body,color])=>(
                      <div key={title} style={{padding:16,borderRadius:12,background:`${color}0f`,border:`1px solid ${color}33`}}>
                        <div style={{fontSize:13,color:color,fontWeight:900,marginBottom:8}}>{title}</div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.65,margin:0}}>{body}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{background:C.s2,borderRadius:12,padding:18,border:`1px solid ${C.border}`,marginBottom:18}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Prediction Accuracy Logic</div>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.75,margin:"0 0 12px"}}>Each actual KPI is normalized to a 0-100 score, then compared with the matching forecast score. Accuracy is calculated as <b style={{color:C.text}}>100 - absolute prediction error</b>. Missing actuals are excluded from both numerator and denominator.</p>
                    <div style={{fontSize:13,color:C.dim,lineHeight:1.8}}>
                      Brand outcome KPIs such as awareness, consideration, and purchase intent carry weight <b style={{color:C.gold}}>1.25</b>. Performance KPIs such as VTR, completion, and CTR carry weight <b style={{color:C.cyan}}>1.0</b>. The denominator is the sum of weights only for KPIs where both predicted and actual values exist.
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                    <div style={{padding:16,borderRadius:12,background:`${C.purple}0f`,border:`1px solid ${C.purple}33`}}>
                      <div style={{fontSize:13,color:C.purple,fontWeight:900,marginBottom:8}}>What feeds back into the engine</div>
                      <p style={{fontSize:12,color:C.dim,lineHeight:1.65,margin:0}}>Aggregated private calibration patterns such as average forecast accuracy and over/under-estimation bias by brand, category, creative format, and platform. These become prompt calibration memory only when row thresholds are met.</p>
                    </div>
                    <div style={{padding:16,borderRadius:12,background:`${C.amber}0f`,border:`1px solid ${C.amber}33`}}>
                      <div style={{fontSize:13,color:C.amber,fontWeight:900,marginBottom:8}}>What is not claimed</div>
                      <p style={{fontSize:12,color:C.dim,lineHeight:1.65,margin:0}}>The engine does not ingest full media plans by default, does not replace campaign measurement, does not promise exact ROI, and does not retrain a hidden model on client data.</p>
                    </div>
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── GRADING ── */}
              {methTab==="grading"&&(<>
                <MethSection sectionKey="grading_overall_grade" title="Overall Grade — Full Calculation">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.gold}>Overall Grade — Full Calculation</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>The Overall Grade is a <b style={{color:C.text}}>weighted composite score</b> derived from 7 of the 17 neural metrics. These 7 were selected because they have the strongest empirical correlation with in-market advertising effectiveness outcomes (brand recall lift, purchase intent, and organic reach) in published advertising effectiveness research.</p>
                  <div style={{background:C.s2,borderRadius:12,padding:24,marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:16,fontFamily:"'DM Mono',monospace"}}>Composite Formula</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.cyan,lineHeight:2.2}}>
                      <div>Composite Score =</div>
                      <div style={{paddingLeft:20,color:C.text}}>
                        <span style={{color:C.gold}}>(Memory Encoding × 0.20)</span> +<br/>
                        <span style={{color:C.gold}}>(Brand Recall × 0.20)</span> +<br/>
                        <span style={{color:C.amber}}>(Hook Strength × 0.15)</span> +<br/>
                        <span style={{color:C.amber}}>(Hold Rate × 0.15)</span> +<br/>
                        <span style={{color:C.cyan}}>(Emotional Peak × 0.10)</span> +<br/>
                        <span style={{color:C.cyan}}>(Creative Efficiency × 0.10)</span> +<br/>
                        <span style={{color:C.cyan}}>(Cultural Resonance × 0.10)</span>
                      </div>
                    </div>
                    <div style={{marginTop:16,padding:"12px 16px",background:C.s3,borderRadius:8,fontSize:12,color:C.dim,lineHeight:1.7}}>
                      <b style={{color:C.text}}>Example:</b> Memory=72, Recall=80, Hook=65, Hold=70, Emotion=60, Efficiency=68, Culture=85<br/>
                      = (72×0.20)+(80×0.20)+(65×0.15)+(70×0.15)+(60×0.10)+(68×0.10)+(85×0.10)<br/>
                      = 14.4 + 16.0 + 9.75 + 10.5 + 6.0 + 6.8 + 8.5 = <b style={{color:C.gold}}>71.95 → Grade: B</b>
                    </div>
                  </div>
                  <div style={{display:"grid",gap:10}}>
                    {[
                      {g:"A+",range:"90–100",c:C.green,  meaning:"Exceptional. Top 5% of creatives. Deploy with full confidence across all platforms. Expect above-category recall lift."},
                      {g:"A", range:"85–89", c:C.green,  meaning:"Excellent. Strong across all neural dimensions. Minor platform-specific tweaks only. Broadcast + digital ready."},
                      {g:"A−",range:"80–84", c:C.cyan,   meaning:"Very Good. Clear strengths with 1–2 gaps in digital suitability. Light re-editing for social advised."},
                      {g:"B+",range:"75–79", c:C.amber,  meaning:"Good. Solid foundation. Performs well on TV/CTV. Social-first re-edit recommended for feed and Reels."},
                      {g:"B", range:"70–74", c:C.amber,  meaning:"Above Average. Works in primary broadcast channels. Significant gaps in short-form digital formats."},
                      {g:"B−",range:"65–69", c:C.orange, meaning:"Adequate. Functional but below category leaders. Platform-specific cuts needed before deployment."},
                      {g:"C+",range:"60–64", c:C.orange, meaning:"Below Average. Fundamental gaps in hook or memory encoding. Major re-edit recommended before any deployment."},
                      {g:"C", range:"55–59", c:C.red,    meaning:"Weak. Structural creative issues detected. Do not deploy without significant revision to pacing and emotional arc."},
                      {g:"D/F",range:"Below 55",c:C.red, meaning:"Failing. Full creative overhaul required. Deployment will reduce brand equity and generate negative ROI on media spend."},
                    ].map(({g,range,c,meaning})=>(
                      <div key={g} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 14px",background:C.s2,borderRadius:10,border:`1px solid ${C.border}`}}>
                        <div style={{minWidth:44,height:44,borderRadius:8,background:`${c}15`,border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:c,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{g}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:13,fontWeight:700,color:C.text}}>{g}</span>
                            <span style={{fontSize:11,color:C.muted,fontFamily:"'DM Mono',monospace"}}>Composite score {range}</span>
                          </div>
                          <div style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{meaning}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="grading_grade_drivers" title="Why These 7 Metrics Drive the Grade">
                <Card C={C}>
                  <CardTitle C={C} label={C.purple}>Why These 7 Metrics Drive the Grade</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:12}}>
                    {[
                      ["Memory Encoding","20%",C.gold,"The single most important predictor of long-term brand building. If the creative is not encoded into long-term memory, all media spend is wasted. Requires simultaneous activation of visual cortex, amygdala, and hippocampus."],
                      ["Brand Recall","20%",C.gold,"Memory encoding without brand linkage is worthless. Brand recall measures whether the memory formed is correctly attributed to the brand. Driven by logo visibility, product presence, and distinctive brand asset frequency."],
                      ["Hook Strength","15%",C.amber,"In digital environments, 70%+ of viewers decide whether to skip within the first 2 seconds. Hook strength predicts stopping power. Without a hook, the rest of the creative is never seen."],
                      ["Hold Rate","15%",C.amber,"Completion rate directly determines media efficiency. A creative with a 40% hold rate wastes 60% of every impression served. Driven by pacing, narrative tension, and scene variety."],
                      ["Emotional Peak","10%",C.cyan,"Damasio's Somatic Marker Hypothesis: emotional experiences create memory tags that drive future brand retrieval. Creatives with no emotional peak are forgotten within 24 hours."],
                      ["Creative Efficiency","10%",C.cyan,"Message density per second. Too dense = cognitive overload, viewer mentally checks out. Too sparse = wasted seconds. Optimal range is 65–80, which correlates with highest message retention."],
                      ["Cultural Resonance","10%",C.cyan,"For Indian market creatives, cultural mirror activation is a significant predictor of trust and brand acceptance. Misaligned creatives face active rejection, not just indifference."],
                    ].map(([metric,weight,c,why])=>(
                      <div key={metric} style={{background:C.s2,borderRadius:10,padding:18}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.text}}>{metric}</span>
                          <span style={{fontSize:13,fontWeight:800,color:c,fontFamily:"'DM Mono',monospace"}}>{weight}</span>
                        </div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.7}}>{why}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="grading_outcome_forecasting" title="Creative-to-Media Outcome Forecasting">
                <Card C={C}>
                  <CardTitle C={C} label={C.cyan}>Creative-to-Media Outcome Forecasting</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.85,marginBottom:18}}>The Outcome Forecast translates creative diagnostics into directional brand and performance probability. It separates media delivery from creative response, so teams can see whether poor results are more likely to be creative-led, media-dependent, or mixed.</p>
                  <div style={{background:C.s2,borderRadius:12,padding:22,marginBottom:18,border:`1px solid ${C.border}`}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Core Equation</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.text,lineHeight:2}}>
                      Expected Campaign Outcome =<br/>
                      <span style={{color:C.gold}}>Media Delivery Quality</span><br/>
                      × <span style={{color:C.cyan}}>Creative Response Probability</span><br/>
                      × <span style={{color:C.purple}}>Platform / Format Fit</span><br/>
                      × <span style={{color:C.green}}>Category / Market Elasticity</span><br/>
                      × <span style={{color:C.amber}}>Brand Baseline Strength</span>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:14,marginBottom:18}}>
                    <div style={{padding:18,borderRadius:12,background:`${C.cyan}0f`,border:`1px solid ${C.cyan}33`}}>
                      <div style={{fontSize:13,color:C.cyan,fontWeight:900,marginBottom:8}}>What AdCritIQ predicts now</div>
                      <p style={{fontSize:13,color:C.dim,lineHeight:1.75}}>Creative Response Probability and Platform / Format Fit: whether the ad is likely to turn delivered impressions into attention, memory, preference, action, or waste.</p>
                    </div>
                    <div style={{padding:18,borderRadius:12,background:`${C.amber}0f`,border:`1px solid ${C.amber}33`}}>
                      <div style={{fontSize:13,color:C.amber,fontWeight:900,marginBottom:8}}>What AdCritIQ does not ingest yet</div>
                      <p style={{fontSize:13,color:C.dim,lineHeight:1.75}}>Actual reach, frequency, targeting quality, CPM/CPC, sales data, brand baseline survey data, competitor media weight, or real campaign delivery logs.</p>
                    </div>
                  </div>
                  <div style={{padding:18,borderRadius:12,background:`${C.gold}0f`,border:`1px solid ${C.gold}33`,marginBottom:18}}>
                    <div style={{fontSize:13,color:C.gold,fontWeight:900,marginBottom:8}}>CMO answer: what do these numbers mean?</div>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.75,margin:0}}>They are not exact percentage lifts. They are 0-100 creative-response probability scores that estimate whether delivered impressions are likely to become memory, preference, action, or waste. A score of 84 means strong readiness relative to the creative signals AdCritIQ can observe; it does not mean an 84% sales or brand-lift guarantee.</p>
                  </div>
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>How to read the scores</div>
                    <div style={{display:"grid",gap:8}}>
                      {[
                        ["85-100","High probability / scale-ready","Creative signal is strong enough to support confident media scaling, subject to normal media hygiene.",C.green],
                        ["70-84","Strong probability / media-ready","Good readiness with minor optimization. Suitable for launch or controlled scale.",C.cyan],
                        ["55-69","Moderate probability / test before scaling","Directional promise, but one or two response drivers need improvement before major spend.",C.amber],
                        ["40-54","At risk / creative fix recommended","Likely under-conversion of impressions into memory or action. Fix creative before scaling.",C.orange],
                        ["0-39","High wastage risk / do not scale","Media exposure is likely to be wasted unless the creative is materially revised.",C.red],
                      ].map(([band,meaning,interpretation,color])=>(
                        <div key={band} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"100px 260px 1fr",gap:12,alignItems:"center",padding:"10px 12px",borderRadius:10,background:C.s2,border:`1px solid ${C.border}`}}>
                          <div style={{fontSize:13,color:color,fontWeight:900,fontFamily:"'DM Mono',monospace"}}>{band}</div>
                          <div style={{fontSize:13,color:C.text,fontWeight:900}}>{meaning}</div>
                          <div style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{interpretation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gap:10,marginBottom:18}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:2}}>How each outcome score is calculated</div>
                    {[
                      ["Spontaneous Awareness","Memory Encoding, Brand Recall, Attention-Brand Coupling, Emotional Peak, Cultural Resonance"],
                      ["Aided Awareness","Brand Recall, Brand Prominence, Memory Encoding, Sound-Off Survival, Average Platform Fit"],
                      ["Consideration Lift","Message Clarity, Emotional Coherence, Creative Efficiency, Trust / Prefrontal Activation, Brand Safety"],
                      ["Purchase Intent + Response","CTA Clarity, Product Desire / Nucleus Accumbens, Message Clarity, Brand Recall, Regulatory Compliance"],
                      ["VTR / Completion or View-Through Fit","For video/motion: Hook Strength, Hold Rate, Sustained Attention Index, Attention Recovery Speed, inverse Ad Fatigue Risk. For static/text: first-glance attention fit and message persistence replace completion language."],
                      ["CTR / Response","Hook Strength, CTA Clarity, Message Clarity, Platform Fit, Share Intent, Creative Efficiency"],
                      ["Media Wastage Risk","Low memory, weak brand linkage, poor hook, platform mismatch, high fatigue, or weak CTA despite paid reach"],
                      ["Creative Accountability vs Media Dependency","Creative accountability rises when core creative response signals are weak. Media dependency rises when creative is viable but platform fit, sequencing, or delivery assumptions matter more."],
                    ].map(([kpi,drivers])=>(
                      <div key={kpi} style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"220px 1fr",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:13,color:C.text,fontWeight:900}}>{kpi}</div>
                        <div style={{fontSize:13,color:C.dim,lineHeight:1.65}}>{drivers}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:18,borderRadius:12,background:C.s2,border:`1px solid ${C.border}`,marginBottom:18}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.gold,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Example interpretation</div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:12}}>
                      {[
                        ["Awareness 78/84","Strong memory readiness","The creative is likely to be remembered and recognised if media delivers enough exposure.",C.green],
                        ["Purchase Intent 58","At-risk conversion readiness","People may understand or remember the ad, but the benefit, CTA, or product desire signal needs strengthening.",C.amber],
                        ["Media Wastage Risk 32","Low risk","The creative is not obviously wasting exposure; the main issue is optimization, not stopping all media.",C.green],
                        ["Creative Accountability 78","Creative is the main lever","Success or failure is more likely to be driven by creative response than by media optimization alone.",C.cyan],
                      ].map(([score,meaning,body,color])=>(
                        <div key={score} style={{padding:14,borderRadius:10,background:`${color}0d`,border:`1px solid ${color}33`}}>
                          <div style={{fontSize:13,color:color,fontWeight:900,marginBottom:6}}>{score}</div>
                          <div style={{fontSize:12,color:C.text,fontWeight:900,marginBottom:6}}>{meaning}</div>
                          <p style={{fontSize:12,color:C.dim,lineHeight:1.6,margin:0}}>{body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12,marginBottom:18}}>
                    {[
                      ["Creative-led failure","Media delivered exposure, but weak hook, memory encoding, brand linkage, or CTA prevents response.",C.red],
                      ["Media-led failure","Creative is viable, but platform mix, audience targeting, frequency, or sequencing needs correction.",C.cyan],
                      ["Mixed failure","Both creative response probability and media delivery assumptions need adjustment before scaling.",C.amber],
                    ].map(([title,body,color])=>(
                      <div key={title} style={{padding:16,borderRadius:12,background:`${color}0f`,border:`1px solid ${color}33`}}>
                        <div style={{fontSize:13,color:color,fontWeight:900,marginBottom:8}}>{title}</div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.65,margin:0}}>{body}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:18,borderRadius:12,background:`${C.cyan}0f`,border:`1px solid ${C.cyan}33`,marginBottom:18}}>
                    <div style={{fontSize:11,fontWeight:900,color:C.cyan,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:12}}>Forecast confidence bands</div>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.75,margin:"0 0 14px"}}>Confidence bands explain how much weight a boardroom should place on a forecast. They are directional reliability labels, not statistical confidence intervals, guaranteed lift, or live biometric certainty.</p>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(5,1fr)",gap:8}}>
                      {[
                        ["High confidence","Multiple signals agree and format evidence is complete.",C.green],
                        ["Medium confidence","Enough evidence exists, but one or two drivers remain uncertain.",C.gold],
                        ["Low confidence","Signals are mixed or the forecast depends heavily on media execution.",C.amber],
                        ["Data-limited","The creative input lacks enough format-specific evidence for a strong read.",C.dim],
                        ["Needs human review","Claims, compliance, brand safety, or cultural risk require expert judgement.",C.red],
                      ].map(([label,body,color])=>(
                        <div key={label} style={{padding:12,borderRadius:10,background:C.s2,border:`1px solid ${color}33`}}>
                          <div style={{fontSize:11,color:color,fontWeight:900,marginBottom:7,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>{label}</div>
                          <div style={{fontSize:11,color:C.dim,lineHeight:1.55}}>{body}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:14,padding:"10px 12px",borderRadius:9,background:C.s2,border:`1px solid ${C.border}`,fontSize:12,color:C.dim,lineHeight:1.65}}>
                      Low confidence does not mean the creative is bad. It means the forecast should not be overinterpreted without human review, campaign calibration, or additional creative evidence.
                    </div>
                  </div>
                  <div style={{padding:"12px 14px",borderRadius:10,background:`${C.gold}0f`,border:`1px solid ${C.gold}33`,fontSize:12,color:C.dim,lineHeight:1.75}}>
                    <b style={{color:C.gold}}>Important:</b> These forecasts are calibrated AI predictions based on published advertising science and neural-response research. They are not measured biometric results, media delivery data, or guaranteed business outcomes.
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── ALL 17 METRICS ── */}
              {methTab==="metrics"&&(<>
                <MethSection sectionKey="metrics_neural_metrics" title="All 17 Neural Metrics — Complete Reference">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.cyan}>All 17 Neural Metrics — Complete Reference</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>Every metric is scored 0–100. Below is the full definition, what drives a high score, what a low score means, and what to do about it.</p>
                  <div style={{marginBottom:18,padding:"12px 14px",borderRadius:10,background:`${C.gold}0f`,border:`1px solid ${C.gold}33`,fontSize:12,color:C.dim,lineHeight:1.7}}>
                    <b style={{color:C.gold}}>Deep diagnostics note:</b> Deep diagnostics (15 additional metrics across Attention, Emotion, and Sound) are available in each respective tab. These metrics are based on published neuroscience research and are returned as AI predictions calibrated against validated neural correlates — not direct neural measurement.
                  </div>
                  <div style={{display:"grid",gap:12}}>
                    {[
                      {name:"Viral Potential",good:"70+",color:C.cyan,def:"Aggregate shareability prediction.",drives:"Strong emotional peak + identity signaling + novelty + pattern interrupt. Creatives people share because they feel 'this is so me' or 'this is surprising'.",low:"Below 50: The creative will not generate organic amplification. Every impression will be paid."},
                      {name:"Hook Strength",good:"75+ (feed)",color:C.amber,def:"First 1–2 second stopping power in the feed.",drives:"Human faces appearing in first frame, motion in first 0.5s, high color contrast, visual surprise, recognisable brand asset.",low:"Below 50: Most viewers will scroll past before the message is delivered. Re-edit the opening frame."},
                      {name:"Hold Rate",good:"65+ (15s creative)",color:C.amber,def:"Predicted percentage of viewers who watch to the end.",drives:"Consistent visual variety, unresolved narrative tension, scene changes every 3–5 seconds, product reveal withheld.",low:"Below 50: Serious pacing issue. Identify the drop zone (see Attention tab) and cut that section."},
                      {name:"Emotional Peak",good:"70+",color:C.pink,def:"Intensity of the strongest emotional activation moment in the creative.",drives:"Human vulnerability, humour, unexpected twist, music climax, child/animal presence, aspirational imagery.",low:"Below 50: The creative is informational but not emotional. Will be seen but not remembered."},
                      {name:"Brand Recall",good:"80+",color:C.gold,def:"Probability that a viewer correctly attributes the ad to your brand 24 hours after exposure.",drives:"Logo shown in first 3s AND last 3s, product as hero, consistent brand colours, distinctive brand asset (jingle, character, tagline).",low:"Below 60: Viewers remember the ad but not who made it. A gift to competitors."},
                      {name:"Memory Encoding",good:"70+",color:C.gold,def:"Long-term memory formation probability. The neurological requirement for advertising to work.",drives:"Simultaneous amygdala + hippocampus activation. Only happens when emotion and attention peak at the same moment.",low:"Below 55: The ad will be processed and forgotten. Increase emotional intensity at the peak attention moment."},
                      {name:"Sound-Off Survival",good:"70+ (social)",color:C.purple,def:"Performance of the creative with audio muted. Critical for Meta, Instagram, LinkedIn, TikTok.",drives:"Kinetic text overlays, clear visual narrative that works without dialogue, strong visual brand presence, subtitles.",low:"Below 50: Do not run on social without adding text overlays. 85% of social video is consumed without sound."},
                      {name:"Share Intent",good:"65+",color:C.cyan,def:"Probability the viewer shares the content. Four triggers: identity signaling, social currency, emotional contagion, practical utility.",drives:"'This is so me' content, something surprising worth telling others, emotional contagion (joy, awe, outrage), genuinely useful information.",low:"Below 40: The creative will not self-distribute. Entirely dependent on paid media."},
                      {name:"Creative Efficiency",good:"65–80",color:C.teal,def:"Message delivery per second. Ratio of information density to cognitive load.",drives:"One clear message per scene, no competing visual stimuli, information revealed progressively.",low:"Below 50: Under-utilised airtime. Above 80: Cognitive overload — viewer mentally disconnects."},
                      {name:"Ad Fatigue Risk",good:"Below 40",color:C.red,def:"How quickly repeated exposure will cause viewer disengagement and negative brand associations.",drives:"High fatigue risk: static imagery, repetitive dialogue, low scene variety. Low fatigue risk: rich visual variety, multiple storylines.",low:"Above 70: This creative will burn out within 3–5 exposures. Plan frequency caps and rotation."},
                      {name:"Cultural Resonance",good:"75+ (India)",color:C.green,def:"Alignment between creative elements and the target market's cultural values, visual language, and social norms.",drives:"Family dynamics, aspirational imagery aligned to local values, language, colour associations, festivals, food.",low:"Below 50: The creative may feel foreign or tone-deaf to the target audience. Localise before deployment."},
                      {name:"Celebrity / Talent Index",good:"Varies",color:C.amber,def:"Contribution of on-screen talent or celebrity presence to brand recall and desire scores.",drives:"Recognition, aspiration, category fit. A celebrity with no relevance to the category can suppress brand recall by creating a 'vampire effect'.",low:"0 = No talent present. High score with low Brand Recall = vampire effect detected."},
                      {name:"Brand Safety",good:"85+",color:C.green,def:"Probability the creative will not trigger brand safety flags on programmatic platforms.",drives:"No controversial imagery, no ambiguous contexts, no competitor comparisons, no sensitive social topics.",low:"Below 70: Risk of creative being blocked by brand safety filters on DV360, Xandr, or Amazon DSP."},
                      {name:"Regulatory Compliance",good:"85+",color:C.green,def:"Compliance signal for ASCI (India), FSSAI (food), and DPDP (data privacy) advertising standards.",drives:"Visible disclaimers for health/financial claims, no misleading comparative claims, correct product labelling.",low:"Below 70: Consult legal before broadcast. Do not rely on this score as legal clearance."},
                      {name:"1P Data Opportunity",good:"Varies",color:C.cyan,def:"Probability the creative contains a mechanism to capture first-party data (QR code, URL, hashtag, promo code).",drives:"QR code, clear URL, hashtag, search-triggered CTA, registration mechanic.",low:"0 = No 1P data capture. In a cookieless world, every creative should have a 1P data mechanic."},
                      {name:"Carbon Signal",good:"Lower = better",color:C.lime,def:"Estimated digital carbon footprint indicator based on creative complexity, file size proxy, and platform distribution.",drives:"High carbon: heavy video, autoplay across many platforms, high-frequency delivery. Low carbon: compressed creative, contextual targeting.",low:"High score = high estimated carbon footprint. Relevant for ESG reporting and Green Media commitments."},
                      {name:"System 1 / System 2",good:"65–75 optimal",color:C.orange,def:"Balance between emotional (System 1) and rational (System 2) processing. Kahneman (2011).",drives:"System 1: emotional imagery, music, faces, storytelling. System 2: claims, prices, comparisons, text-heavy frames.",low:"Below 40: Over-rational — viewer is thinking, not feeling. Above 85: Over-emotional — no rational anchor for purchase decision."},
                    ].map(({name,good,color,def,drives,low})=>{
                      const metricKey=`metrics_${name.toLowerCase().replace(/[^a-z0-9]+/g,"_")}`;
                      const open=!!expandedMethSections[metricKey];
                      return(
                        <div key={name} style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s ease",background:C.s1}}>
                          <div
                            onClick={()=>toggleMethSection(metricKey)}
                            style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",background:open?C.s2:C.s1,borderLeft:`3px solid ${color}`}}
                          >
                            <span style={{fontSize:14,fontWeight:700,color:C.text}}>{name}</span>
                            <div style={{display:"flex",alignItems:"center",gap:12}}>
                              <span style={{fontSize:11,fontWeight:700,color:color,fontFamily:"'DM Mono',monospace",padding:"2px 10px",background:`${color}15`,borderRadius:6,whiteSpace:"nowrap"}}>Good: {good}</span>
                              <span style={{color:C.dim,fontSize:14,transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s ease"}}>▾</span>
                            </div>
                          </div>
                          {open&&(
                            <div style={{padding:"12px 16px 16px",borderTop:`1px solid ${C.border}`,background:C.s1,animation:"fadeUp 0.2s ease both"}}>
                              <div style={{display:"grid",gridTemplateColumns:threeGrid,gap:12}}>
                                <div><div style={{fontSize:10,fontWeight:700,color:C.dim,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Definition</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6,margin:0}}>{def}</p></div>
                                <div><div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>What drives it high</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6,margin:0}}>{drives}</p></div>
                                <div><div style={{fontSize:10,fontWeight:700,color:C.red,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Low score means</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6,margin:0}}>{low}</p></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── NEURAL SCIENCE ── */}
              {methTab==="neural"&&(<>
                <MethSection sectionKey="neural_brain_regions" title="Brain Region Activation — What Each Region Means">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.purple}>Brain Region Activation — What Each Region Means</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>AdCritIQ predicts activation levels across 8 brain regions based on visual stimuli present in the creative. These predictions are derived from established neuromarketing research mapping visual advertising stimuli to neural activation patterns.</p>
                  <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:14}}>
                    {[
                      ["Visual Cortex","Primary visual processing centre.","High activation (70+): Complex visual scenes, high colour saturation, motion, faces. This is the entry point for all visual advertising. Without visual cortex engagement, nothing else fires.","Good range: 60–85. Below 50 = visually flat creative. Above 90 = potential cognitive overload."],
                      ["Prefrontal Cortex","Rational decision-making and claim evaluation.","High activation (70+): Product claims, price callouts, comparative messaging, text-heavy frames, logical arguments. This is System 2 territory.","Optimal: 45–65. Too high relative to amygdala = the viewer is thinking, not feeling. Ideal for B2B; risky for FMCG."],
                      ["Amygdala","Emotional processing and threat/reward detection.","High activation (60+): Fear, joy, surprise, desire, humour, human vulnerability. The amygdala is the gateway to memory encoding — without it, long-term memory formation is severely impaired.","Critical: must be above 50 for effective advertising. Below 40 = the creative will not be remembered."],
                      ["Hippocampus","Long-term memory formation and retrieval.","High activation (65+): Co-activates with amygdala when emotional content is present during peak attention. The amygdala + hippocampus pairing is the neurological mechanism of advertising effectiveness.","Good: 60+. High hippocampus + low amygdala = trying to form memories without emotional tags. Inefficient."],
                      ["Auditory Cortex","Sound and music processing.","High activation: Music-led creatives, strong voiceover, dialogue-heavy scenes, sound branding. Low activation = the brain is processing this as a purely visual creative.","Watch: high auditory + low Sound-Off Survival = dangerous dependency on audio that social platforms strip out."],
                      ["Mirror Neurons","Empathy and social behaviour simulation.","High activation (60+): Close-up human faces showing emotion, physical interaction, people in relatable situations. Mirror neurons fire when we watch others and simulate their experience.","High mirror neurons → high Share Intent. If people empathise, they share. Low = the creative feels cold and corporate."],
                      ["Nucleus Accumbens","Reward anticipation and desire.","High activation: Product reveal moments, aspirational imagery, anticipation-building narratives, status signalling, before/after demonstrations. The brain's 'I want that' centre.","High = strong desire response. Key driver of purchase intent. Low in FMCG = missed commercial opportunity."],
                      ["Anterior Cingulate","Conflict detection and pattern interrupt processing.","High activation: Unexpected visual events, category norm violations, humour punchlines, shocking revelations. Pattern interrupts that cause the brain to stop and pay attention.","Moderate activation (40–60) is optimal. Creates attention spikes. Too high = cognitive dissonance (confusing creative)."],
                    ].map(([region,summary,high,watch])=>(
                      <div key={region} style={{background:C.s2,borderRadius:12,padding:20}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>{region}</div>
                        <div style={{fontSize:12,color:C.purple,fontWeight:600,marginBottom:10}}>{summary}</div>
                        <div style={{marginBottom:8}}><span style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:1.5,textTransform:"uppercase"}}>High activation means: </span><span style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{high}</span></div>
                        <div><span style={{fontSize:10,fontWeight:700,color:C.amber,letterSpacing:1.5,textTransform:"uppercase"}}>Watch for: </span><span style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{watch}</span></div>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="neural_system_1_vs_system_2" title="System 1 vs System 2 — The Balance That Drives Effectiveness">
                <Card C={C}>
                  <CardTitle C={C} label={C.orange}>System 1 vs System 2 — The Balance That Drives Effectiveness</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:20}}>
                    <div style={{background:C.s2,borderRadius:12,padding:24,borderTop:`4px solid ${C.blue}`}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.blue,marginBottom:12}}>System 2 — Rational Processing</div>
                      <p style={{fontSize:13,color:C.dim,lineHeight:1.8}}>Slow, deliberate, effortful thinking. Activates when the creative contains product claims, prices, feature comparisons, or text-heavy information. The viewer is consciously evaluating the message. <br/><br/><b style={{color:C.text}}>Score range: 0–64</b><br/>Good for: B2B, high-consideration purchases, pharmaceutical, financial services.<br/>Risk: In FMCG/CPG, forcing System 2 causes scroll-away. Viewers don't want to think about detergent.</p>
                    </div>
                    <div style={{background:C.s2,borderRadius:12,padding:24,borderTop:`4px solid ${C.orange}`}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.orange,marginBottom:12}}>System 1 — Emotional Processing</div>
                      <p style={{fontSize:13,color:C.dim,lineHeight:1.8}}>Fast, automatic, intuitive. Activates when the creative leads with emotion, music, storytelling, or faces. The viewer feels before they think. Advertising that works through System 1 bypasses ad-avoidance entirely.<br/><br/><b style={{color:C.text}}>Score range: 76–100</b><br/>Good for: FMCG, lifestyle, entertainment, social content.<br/>Risk: Pure System 1 with no rational anchor can build emotion without purchase intent.</p>
                    </div>
                  </div>
                  <div style={{background:`${C.gold}10`,border:`1px solid ${C.gold}33`,borderRadius:12,padding:20,marginTop:16}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:8}}>The Optimal Zone: 65–75</div>
                    <p style={{fontSize:13,color:C.dim,lineHeight:1.8}}>Creatives scoring 65–75 lead with emotion (System 1) to earn attention and build memory, then layer in just enough rational messaging (System 2) to justify the purchase decision. This is the sweet spot identified across Byron Sharp's effectiveness research and the Ehrenberg-Bass Institute's long-term brand building studies.</p>
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── PLATFORM SCORING ── */}
              {methTab==="platforms"&&(<>
                <MethSection sectionKey="platforms_scoring_calculation" title="How Platform Scores Are Calculated">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.blue}>How Platform Scores Are Calculated</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>Each platform score is derived from the base neural metrics adjusted by platform-specific weighting coefficients. These coefficients reflect the attention norms, sound environment, format constraints, and viewer behaviour on each platform.</p>
                  <div style={{background:C.s2,borderRadius:12,padding:24,marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:12,fontFamily:"'DM Mono',monospace"}}>Platform Score Formula</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.text,lineHeight:2}}>
                      Platform Score = Base Neural Score<br/>
                      <span style={{paddingLeft:20,color:C.dim}}>× Format Suitability Multiplier (0.5–1.2)<br/>
                      × Sound Environment Factor (0.7–1.0)<br/>
                      × Duration Fit Score (0.6–1.0)<br/>
                      × Attention Norm Adjustment (±15 points)</span>
                    </div>
                  </div>
                  <div style={{display:"grid",gap:8}}>
                    {[
                      {platform:"TV Broadcast",color:C.green,score:"Highest scores for long-form, emotional, high-production creatives",weights:"Duration: full-length favoured. Sound: always on. Attention: passive/lean-back. Amplifiers: high emotional peak, strong brand recall, cultural resonance."},
                      {platform:"CTV / OTT",color:C.cyan,score:"Similar to TV but with interactive potential",weights:"Duration: 15–60s optimal. Sound: usually on. Attention: semi-active. Amplifiers: same as TV + strong hook (viewer has remote control)."},
                      {platform:"YouTube In-Stream",color:C.red,score:"Hook-critical environment",weights:"Duration: 15–30s sweet spot. Sound: on but skippable at 5s. Attention: declining curve. Critical: Hook Strength weighted 3× vs TV."},
                      {platform:"YouTube 6s Bumper",color:C.red,score:"Hook + brand only",weights:"Only first 2s of hook score + brand recall score count. Hold Rate irrelevant (unskippable). Sound-Off not a factor."},
                      {platform:"Instagram / Meta Feed",color:C.amber,score:"Sound-off dominant environment",weights:"Sound-Off Survival weighted 2.5× vs TV. Hook strength (first frame) weighted 2×. Duration: 15s optimal. Vertical format preferred."},
                      {platform:"Instagram Reels / TikTok",color:C.orange,score:"Most demanding environment",weights:"Hook weighted 3×. Sound-Off 2×. Hold Rate 2×. Duration: 7–15s optimal. Lowest scores for traditional broadcast creatives."},
                      {platform:"LinkedIn",color:C.blue,score:"Professional, rational context",weights:"System 2 score weighted up. Emotional Peak weighted down. Brand Safety weighted 1.5×. B2B creatives outperform here."},
                      {platform:"DOOH",color:C.purple,score:"Zero sound, 3–5 second viewing window",weights:"Only hook strength (first frame) + brand recall count. No audio score. No hold rate. Visual cortex + brand elements only."},
                      {platform:"Programmatic Display",color:C.teal,score:"Banner format — visual brand only",weights:"Brand elements score + visual cortex activation only. Attention curve irrelevant. Brand safety weighted heavily."},
                    ].map(({platform,color,score,weights})=>{
                      const platformKey=`platforms_${platform.toLowerCase().replace(/[^a-z0-9]+/g,"_")}`;
                      const open=!!expandedMethSections[platformKey];
                      return(
                        <div key={platform} style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s ease"}}>
                          <div
                            onClick={()=>toggleMethSection(platformKey)}
                            style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",background:open?C.s2:C.s1,borderLeft:`3px solid ${color||C.gold}`}}
                          >
                            <span style={{fontWeight:700,color:C.text,fontSize:14,display:"flex",alignItems:"center",minWidth:0}}>
                              <PlatformChip name={platform} C={C}/>
                              <span>{platform}</span>
                            </span>
                            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                              <span style={{fontSize:11,color:color||C.gold,fontWeight:600,textAlign:"right",lineHeight:1.4}}>{score}</span>
                              <span style={{color:C.dim,fontSize:14,transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s ease"}}>▾</span>
                            </div>
                          </div>
                          {open&&(
                            <div style={{padding:"12px 16px 16px",borderTop:`1px solid ${C.border}`,background:C.s1,animation:"fadeUp 0.2s ease both"}}>
                              <p style={{fontSize:13,color:C.dim,lineHeight:1.6,margin:0}}>{weights}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── SCIENCE ── */}
              {methTab==="science"&&(<>
                <MethSection sectionKey="science_research_foundations" title="Scientific Research Foundations">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.purple}>Scientific Research Foundations</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>AdCritIQ's scoring methodology is grounded in published advertising effectiveness research and cognitive neuroscience. Below are the key frameworks and how each is operationalised in the platform.</p>
                  <div style={{display:"grid",gap:14}}>
                    {[
                      {title:"Kahneman — Thinking Fast and Slow (2011)",color:C.cyan,application:"System 1 / System 2 score directly implements Kahneman's dual-process theory. Creatives that force System 2 (deliberate thinking) in low-involvement contexts cause avoidance. The optimal zone (65–75) is calibrated against Kahneman's findings on effortful vs effortless processing.",metric:"System 1/2 Balance metric"},
                      {title:"Byron Sharp — How Brands Grow (2010)",color:C.gold,application:"Brand Recall scoring implements Sharp's Distinctive Brand Assets theory. Assets (logo, colour, character, jingle, tagline) must be present and reinforced for mental availability to build. The scoring penalises creatives where brand elements appear only at the end.",metric:"Brand Recall + Memory Encoding"},
                      {title:"Ehrenberg-Bass Institute — Long-Term Brand Building",color:C.gold,application:"The 7-metric composite grade formula weights Memory Encoding and Brand Recall at 20% each — reflecting EBI research that long-term brand building requires both emotional memory formation and correct brand attribution.",metric:"Overall Grade composite"},
                      {title:"Karen Nelson-Field — Attention Economics (2020)",color:C.amber,application:"The Attention Curve and Hold Rate scoring implement Nelson-Field's active vs passive attention distinction. Active attention (viewer chooses to watch) has 4× the brand recall impact of passive attention. The platform penalises creatives that rely on passive attention contexts.",metric:"Attention Curve + Hold Rate"},
                      {title:"Antonio Damasio — Somatic Marker Hypothesis",color:C.pink,application:"Emotional Peak scoring reflects Damasio's finding that emotional experiences create somatic markers — physiological tags in memory that drive future retrieval and decision-making. A creative with no emotional peak forms no somatic marker, and the brand will not surface spontaneously at point of purchase.",metric:"Emotional Peak + Memory Encoding"},
                      {title:"TRIBE v2 — Meta AI Research (2026)",color:C.green,application:"Foundation model of vision, audition and language for in-silico neuroscience. 720 subjects, 1,000+ hours fMRI. Validates cortical activation patterns for naturalistic video/audio/language stimuli. Calibrates AdCritIQ™ multisensory integration and temporal coherence scoring.",metric:"TribeV2 Neural Markers"},
                      {title:"Binet & Field — Long and Short of It",color:C.blue,application:"Brand-building and activation work on different time horizons. The Outcome Forecast separates brand memory effects from immediate response probability so CMOs can distinguish long-term brand lift readiness from short-term performance readiness.",metric:"Outcome Forecast"},
                      {title:"LAMBDA — Long-Term Ad Memorability Research",color:C.teal,application:"Large-scale multimodal ad memorability research covering thousands of ads and hundreds of brands. Supports the AdCritIQ™ principle that creative features such as pacing, emotion, salience, and brand linkage influence long-term memory outcomes.",metric:"Brand Memory Efficiency"},
                      {title:"Robert Heath — Low-Attention Processing (2012)",color:C.purple,application:"Heath's research demonstrates that advertising can build brand associations even without conscious attention — but only if emotional content is present. This informs the Sound-Off Survival score: a creative that loses all message value when muted loses the ability to build associations in low-attention contexts.",metric:"Sound-Off Survival"},
                      {title:"Weber-Fechner Law — Stimulus Adaptation",color:C.orange,application:"Ad Fatigue Risk scoring is based on the Weber-Fechner Law of diminishing stimulus response. Repeated identical stimuli produce logarithmically declining responses. Creatives with low scene variety, static imagery, or repetitive dialogue are predicted to fatigue faster.",metric:"Ad Fatigue Risk"},
                      {title:"Vittorio Gallese — Mirror Neuron Theory",color:C.teal,application:"Mirror Neuron activation scoring reflects Gallese's work on simulation theory. Viewers who see on-screen humans expressing emotion neurologically simulate that emotion. High mirror neuron activation directly correlates with share intent and emotional contagion in advertising.",metric:"Mirror Neurons + Share Intent"},
                      {title:"Russell's Circumplex Model of Affect (1980)",color:C.pink,application:"Two-dimensional valence-arousal model of emotion. Basis for AdCritIQ™ Valence-Arousal Position metric.",metric:"Valence-Arousal Position"},
                      {title:"Weber-Fechner Law (Fechner, 1860)",color:C.orange,application:"Stimulus contrast required for neural re-orientation. Basis for Attention Recovery Speed metric.",metric:"Attention Recovery Speed"},
                      {title:"Cherry's Cocktail Party Effect (1953)",color:C.cyan,application:"Speech intelligibility in competing noise environments. Basis for Real-World Audibility metric.",metric:"Real-World Audibility"},
                      {title:"Williamson et al. Music Cognition (2012)",color:C.gold,application:"Structural properties of involuntary musical imagery (earworms). Basis for Earworm Formation Probability metric.",metric:"Earworm Formation Probability"},
                    ].map(({title,color,application,metric})=>(
                      <div key={title} style={{background:C.s2,borderRadius:12,padding:20,borderLeft:`4px solid ${color}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>{title}</div>
                        <div style={{display:"inline-block",padding:"2px 10px",background:`${color}15`,borderRadius:6,fontSize:10,fontWeight:700,color:color,fontFamily:"'DM Mono',monospace",marginBottom:10,letterSpacing:1}}>Applied to: {metric}</div>
                        <p style={{fontSize:13,color:C.dim,lineHeight:1.7}}>{application}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}

              {/* ── LIMITATIONS ── */}
              {methTab==="limits"&&(<>
                <MethSection sectionKey="limits_what_it_is" title="What AdCritIQ Is — and Is Not">
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.red}>What AdCritIQ Is — and Is Not</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:pairGrid,gap:16,marginBottom:20}}>
                    <div style={{background:"rgba(34,212,114,0.06)",border:`1px solid ${C.green}33`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:12}}>AdCritIQ IS</div>
                      {["A predictive pre-screening tool for creative effectiveness","A directional intelligence system to prioritise re-edits","A platform suitability guide for media planning","A structured framework for creative briefing and feedback","A consistent benchmark across multiple creatives","A fast, scalable alternative to qualitative research for go/no-go decisions"].map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:C.dim}}>
                          <span style={{color:C.green,flexShrink:0}}>✓</span>{s}
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(240,90,106,0.06)",border:`1px solid ${C.red}33`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:12}}>AdCritIQ IS NOT</div>
                      {["A neuroscience lab measurement or biometric study","A replacement for consumer research or in-market testing","A guarantee of campaign performance","A legal compliance check — consult your legal team","A replacement for creative judgement and strategic thinking","A tool that accounts for media weight, targeting, or competitive activity"].map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:C.dim}}>
                          <span style={{color:C.red,flexShrink:0}}>✗</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gap:12}}>
                    {[
                      ["⚠️",C.amber,"Predictive, Not Measured","All scores are AI predictions based on visual frame analysis. They represent the most probable cognitive response based on established advertising science patterns — not measured neural activity from EEG, fMRI, or biometric devices."],
                      ["🖼️",C.cyan,"Frame Sampling Limitation","AdCritIQ analyses 1–3 extracted frames per creative. For videos with rapid scene changes (cut every 1–2 seconds), frame sampling may miss important transitions. For maximum accuracy, upload key scenes as separate image files."],
                      ["🔇",C.purple,"Audio is Inferred","This version analyses visual frames only. Audio characteristics (music tempo, voiceover tone, sonic branding) are inferred from visual context cues, not measured directly from the audio track."],
                      ["🌍",C.teal,"Cultural Calibration is India-First","Scoring is calibrated for the Indian market by default. Cultural Resonance, Regulatory Compliance, and certain emotion scores may require recalibration for international markets. Always contextualise scores with local market knowledge."],
                      ["📊",C.orange,"No In-Market Performance Guarantee","AdCritIQ cannot account for media weight, audience targeting precision, competitive share of voice, seasonality, brand equity, or algorithmic distribution. Real-world performance may differ significantly from predicted scores."],
                      ["⚖️",C.red,"Not Legal Clearance","Regulatory and DPDP compliance scores are indicative signals only. Do not use AdCritIQ scores as a substitute for legal review of advertising claims, disclaimers, or data collection mechanisms."],
                    ].map(([icon,color,title,desc])=>(
                      <div key={title} style={{background:C.s2,borderRadius:10,padding:18,display:"flex",gap:14,alignItems:"flex-start"}}>
                        <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:color,marginBottom:6}}>{title}</div>
                          <p style={{fontSize:13,color:C.dim,lineHeight:1.7}}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethSection sectionKey="limits_responsible_use" title="How to Use AdCritIQ Responsibly">
                <Card C={C}>
                  <CardTitle C={C} label={C.gold}>How to Use AdCritIQ Responsibly</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:threeGrid,gap:14}}>
                    {[
                      [C.cyan,"Use it for GO/NO-GO","Run AdCritIQ before any creative goes to production or media. A C+ or below should trigger a mandatory re-edit conversation with the creative team."],
                      [C.amber,"Use it for RE-EDIT BRIEFING","The Scene Intelligence and CMO Playbook tabs give the creative team specific, actionable re-edit instructions. Use them as a creative brief, not just a score."],
                      [C.green,"Use it for PLATFORM PLANNING","Platform scores tell you where to concentrate media spend and where to create platform-specific cuts. A TV-first creative should never run on TikTok without re-editing."],
                      [C.purple,"Combine with Human Judgement","AdCritIQ surfaces patterns and signals. The creative director, brand manager, and media planner must interpret these signals in the context of the campaign strategy."],
                      [C.pink,"Track Across Campaigns","The most powerful use of AdCritIQ is longitudinal — tracking how your brand's creative scores improve over time as teams learn what works."],
                      [C.gold,"Benchmark Against Category","Use the Competitive Benchmark section to understand where your creative stands relative to category norms, not just against an absolute scale."],
                    ].map(([color,title,desc])=>(
                      <div key={title} style={{background:C.s2,borderRadius:10,padding:18,borderTop:`3px solid ${color}`}}>
                        <div style={{fontSize:12,fontWeight:700,color:color,marginBottom:8,letterSpacing:0.5}}>{title}</div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.7}}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                </MethSection>
                <MethHint/>
              </>)}
            </>);
          })()}

          </div>

          {/* FOOTER */}
          <div style={{padding:"24px 36px 20px",borderTop:`1px solid ${C.border}`,textAlign:"center",fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em",marginTop:"auto"}}>
            AdCritIQ™ · Neural Creative Intelligence · {new Date().getFullYear()}
          </div>
            </>
          )}
        </div>
        {certificateModal}
        {shareModal}
      </div>
    );
  }
  return null;
}

// Helper: responsive font clamp
function clamp(base, vw, max){ return `clamp(${base}px, ${vw}vw, ${max}px)`; }
