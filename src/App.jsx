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
const C = {
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
const hex=(v)=>v>=80?C.green:v>=60?C.amber:v>=40?C.orange:C.red;
const grade=(v)=>v>=90?"A+":v>=85?"A":v>=80?"A-":v>=75?"B+":v>=70?"B":v>=65?"B-":v>=60?"C+":v>=55?"C":v>=50?"C-":v>=40?"D":"F";

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
  neuriq:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>,
  glossary:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  new:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  dl:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  tm:      null,
};

// Vertical Sidebar Nav
const NAV_TABS = [
  {id:"summary",  label:"Executive Summary", icon:Icon.summary},
  {id:"neural",   label:"Neural Map",         icon:Icon.neural},
  {id:"attention",label:"Attention",          icon:Icon.attn},
  {id:"emotion",  label:"Emotional Arch.",    icon:Icon.emotion},
  {id:"scenes",   label:"Scene Intelligence", icon:Icon.scene},
  {id:"platforms",label:"Platform Scores",    icon:Icon.platform},
  {id:"sound",    label:"Sound & Sensory",    icon:Icon.sound},
  {id:"privacy",  label:"Privacy & Compliance",icon:Icon.privacy},
  {id:"strategy", label:"Strategic Insights", icon:Icon.strategy},
  {id:"cmo",      label:"CMO Playbook",       icon:Icon.cmo},
  {id:"neuriq",   label:"NeurIQ™",            icon:Icon.neuriq},
  {id:"repository", label:"Repository",        icon:"🗄️"},
  {id:"methodology",label:"Methodology",      icon:Icon.glossary},
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

function PlatformChip({ name }) {
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
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("adcritiq_token") || "");
  const [credits, setCredits] = useState(null);
  const [showPricing, setShowPricing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 && window.innerWidth < 1120 : false);
  const [expandedPlatform, setExpandedPlatform] = useState(null);
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
  const fileRef=useRef(null);

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
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleAnalyze=useCallback(async()=>{
    const creativeFormat=getCreativeFormat(form.type,file);
    const missingFields = [];
    if(!form.brand.trim()) missingFields.push("Brand Name");
    if(!form.country) missingFields.push("Country");
    if(!form.industry) missingFields.push("Industry Vertical");
    if(!form.type) missingFields.push("Creative Type");
    if(creativeFormat!=="text"&&!file) missingFields.push("Creative File");
    if(creativeFormat==="text"&&!form.script.trim()) missingFields.push("Text / Script");
    if(creativeFormat==="audio"&&!form.script.trim()) missingFields.push("Audio Transcript / Script");
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
      const frameData=creativeFormat==="text"||creativeFormat==="audio"
        ? {frames:[],duration:0,duration_seconds:0,video_duration:0,width:0,height:0,isImage:false,original_size:file?.size||0}
        : await extractFrames(file);
      // FIX 1: duration_seconds and video_duration are now in frameData
      const payload={
        frames:frameData.frames,
        metadata:{
          ...form,
          creative_format:creativeFormat,
          creative_subtype:form.type,
          script:form.script,
          isStatic:creativeFormat==="static_image",
          duration:frameData.duration,
          duration_seconds:frameData.duration_seconds,
          video_duration:frameData.video_duration,
          width:frameData.width,
          height:frameData.height,
          isImage:frameData.isImage,
          original_size:frameData.original_size||file.size,
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
        scenes: richData?.scenes||fastData?.scenes||[],
        strategic_insights: richData?.strategic_insights||fastData?.strategic_insights||[],
        cmo_actions: richData?.cmo_actions||fastData?.cmo_actions||[],
      };

      setProgress(100);setProgressMsg("Report ready.");
      await new Promise(r=>setTimeout(r,400));
      setResults(combined);
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
              isStatic:formatB==="static_image",
              duration:framesB.duration,
              duration_seconds:framesB.duration_seconds||framesB.duration||30,
              video_duration:framesB.video_duration||framesB.duration||30,
              width:framesB.width,
              height:framesB.height,
              isImage:framesB.isImage,
              original_size:framesB.original_size||fileB.size
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
  },[file,fileB,form,token,compareMode,compareType,formB,labelB]);

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
      setResults(p=>({...p,__saveStatus:"saved",__saveError:""}));
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
    if(next==="repository")loadRepository();
  };

  const resetToForm=()=>{
    setStage("form");
    setResults(null);
    setFile(null);
    setPreview(null);
    setToken("");
    setCredits(null);
    setCompareMode(false);
    setFileB(null);
    setPreviewB(null);
    setResultsB(null);
    setLabelA("Creative A");
    setLabelB("Creative B");
    setCompareTab("overview");
    setCompareType("versions");
    setFormB({brand:"",client:"",campaign:"",script:""});
    setIsDemoMode(false);
    setDemoLoading(false);
    setIsSharedMode(false);
    setShareToken(null);
    setShareUrl("");
    setShowShareModal(false);
    setShareLoading(false);
    setShareCopied(false);
    localStorage.removeItem("adcritiq_token");
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

  // ============================================================
  // LANDING PAGE
  // ============================================================
  if(stage==="landing"){
    return(
      <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg} 0%,${C.ink} 100%)`,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <div aria-hidden="true" style={{position:"absolute",top:"-20%",right:"-10%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)",animation:"drift 14s ease-in-out infinite alternate",pointerEvents:"none"}}/>
        <div aria-hidden="true" style={{position:"absolute",bottom:"-30%",left:"-10%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)",animation:"drift 18s ease-in-out infinite alternate-reverse",pointerEvents:"none"}}/>
        <header style={{position:"sticky",top:0,zIndex:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,padding:isMobile?"18px 20px":"22px 48px",borderBottom:`1px solid ${C.border}`,background:"rgba(5,5,7,0.9)",backdropFilter:"blur(16px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}>
            <div style={{display:"grid",gap:2}}>
              <span style={{fontSize:12,color:C.dim,fontWeight:700}}>AdCritIQ<sup style={{fontSize:7,color:C.gold}}>TM</sup></span>
            </div>
          </div>
          <button onClick={()=>setShowPricing(true)} style={{padding:isMobile?"10px 14px":"11px 18px",borderRadius:10,border:`1px solid ${C.gold}55`,background:"transparent",color:C.gold,fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
            Buy Credits
          </button>
        </header>

        <main style={{flex:1,display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,1.08fr) minmax(340px,0.92fr)",gap:isMobile?36:56,alignItems:"center",padding:isMobile?"44px 20px 28px":"72px 48px 44px",maxWidth:1280,width:"100%",margin:"0 auto",boxSizing:"border-box",position:"relative",zIndex:1}}>
          <section>
            <div style={{fontSize:11,fontWeight:900,color:C.gold,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:18}}>Neural Creative Intelligence</div>
            <h1 style={{fontSize:isMobile?34:isTablet?50:64,fontWeight:800,color:C.text,lineHeight:1.08,letterSpacing:0,margin:"0 0 24px",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
              Know if your creative works<br/>
              <span style={{color:C.gold,position:"relative",display:"inline-block"}}>
                before you go live.
                <span aria-hidden="true" style={{position:"absolute",left:0,right:0,bottom:-6,height:2,borderRadius:999,background:`linear-gradient(90deg,transparent,${C.goldL},${C.gold},transparent)`,backgroundSize:"200% 100%",animation:"shimmer 1.5s ease 0.6s both"}}/>
              </span>
            </h1>
            <p style={{fontSize:isMobile?16:18,color:C.dim,lineHeight:1.75,maxWidth:620,margin:"0 0 32px"}}>
              AdCritIQ™ analyses advertising creatives using multimodal AI trained on neuroscience research — delivering 17 neural metrics, 15 platform scores, and CMO-level strategic recommendations in under 2 minutes. Built for brand teams and agencies worldwide.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:34}}>
              <button onClick={()=>setStage("form")} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{background:C.gold,color:C.ink,border:"none",padding:"15px 28px",borderRadius:10,fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:`0 16px 40px ${C.gold}24`,transition:"transform 0.12s ease"}}>
                Start Analysis
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
                ⚖️ Compare 2 Creatives
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
                {demoLoading?"Loading Sample...":"See a Live Report"}
              </button>
            </div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.6,margin:"-18px 0 28px",fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase"}}>
              Sample report opens instantly. No upload, token, or credit required.
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",maxWidth:720}}>
              {["17 neural metrics","15 platform scores","scene intelligence","CMO playbook","NeurIQ chat","repository"].map(t=>(
                <span key={t} style={{padding:"8px 12px",background:C.s1,borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.dim,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:0.8}}>{t}</span>
              ))}
            </div>
          </section>

          <section style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:16,padding:isMobile?22:28,boxShadow:`0 24px 80px ${C.shadow}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,borderBottom:`1px solid ${C.border}`,paddingBottom:18,marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:C.gold,fontWeight:900,fontFamily:"'DM Mono',monospace",letterSpacing:1.4,textTransform:"uppercase"}}>Live Output</div>
                <div style={{fontSize:22,fontWeight:900,color:C.text,marginTop:6}}>Creative Diagnostic</div>
              </div>
              <div style={{width:58,height:58,borderRadius:14,background:`${C.gold}14`,border:`1px solid ${C.gold}44`,display:"grid",placeItems:"center",fontSize:24,fontWeight:900,color:C.gold,fontFamily:"'DM Mono',monospace"}}>A</div>
            </div>
            {[
              ["ATTENTION HOLD",82,C.green],
              ["MEMORY ENCODING",76,C.gold],
              ["SOUND-OFF SURVIVAL",64,C.amber],
              ["PLATFORM FIT",88,C.cyan],
            ].map(([label,value,color])=>(
              <div key={label} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.dim,fontWeight:800,marginBottom:8,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:0.8}}>
                  <span>{label}</span><span style={{color}}>{value}</span>
                </div>
                <div style={{height:6,borderRadius:999,background:C.s3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:999}}/>
                </div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:24}}>
              {["Re-edit brief","Risk flags","Benchmarking","PDF report"].map(item=>(
                <div key={item} style={{padding:14,borderRadius:10,background:C.s2,border:`1px solid ${C.border}`,fontSize:13,color:C.text,fontWeight:700}}>{item}</div>
              ))}
            </div>
          </section>
        </main>

        <footer style={{padding:isMobile?"20px":"24px 48px",borderTop:`1px solid ${C.border}`,color:C.dim,fontSize:12,display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap",fontFamily:"'DM Mono',monospace",letterSpacing:0.8,textTransform:"uppercase",position:"relative",zIndex:1}}>
          <span>AdCritIQ<sup>TM</sup></span>
          <span>Predictive, not biometric</span>
          <span>Built for creative decisions</span>
        </footer>
        {pricingModal}
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
    const panelStyle={background:`linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01)),${C.s1}`,border:`1px solid ${C.border}`,borderTop:"1px solid rgba(255,255,255,0.09)",borderRadius:20,boxShadow:`0 30px 90px ${C.shadow}`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"};
    const sectionHead=(num,title,sub)=>(
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:18}}>
        <div style={{width:30,height:30,borderRadius:10,display:"grid",placeItems:"center",background:`${C.gold}18`,border:`1px solid ${C.gold}44`,color:C.gold,fontSize:11,fontWeight:900,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{num}</div>
        <div>
          <div style={{fontSize:12,color:C.gold,fontWeight:900,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>{title}</div>
          <div style={{fontSize:13,color:C.dim,lineHeight:1.55}}>{sub}</div>
        </div>
      </div>
    );
    const inp={width:"100%",boxSizing:"border-box",height:56,padding:"0 18px",borderRadius:14,border:`1px solid ${C.border}`,borderTop:"1px solid rgba(255,255,255,0.08)",background:`linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01)),${C.s2}`,color:C.text,fontSize:15,outline:"none",fontFamily:"inherit",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.03)",transition:"border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease"};
    const lbl={fontSize:10,fontWeight:900,letterSpacing:2.4,color:C.dim,textTransform:"uppercase",marginBottom:0,display:"block",fontFamily:"'DM Mono',monospace"};
    const selStyle={...inp,appearance:"none",backgroundImage:`linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01)),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d8b45a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundColor:C.s2,backgroundRepeat:"no-repeat",backgroundPosition:"right 16px center"};
    return(
      <div style={{minHeight:"100vh",background:`radial-gradient(circle at 18% 0%,${C.gold}12 0%,transparent 30%),radial-gradient(circle at 100% 15%,${C.purple}10 0%,transparent 26%),linear-gradient(180deg,${C.bg},${C.ink})`,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif",position:"relative",overflow:"hidden"}}>
        <div aria-hidden="true" style={{position:"absolute",top:-220,right:-180,width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle, rgba(216,180,90,0.08), transparent 66%)",pointerEvents:"none"}}/>
        <div aria-hidden="true" style={{position:"absolute",bottom:-260,left:-180,width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle, rgba(45,212,191,0.055), transparent 64%)",pointerEvents:"none"}}/>

        <div style={{padding:isMobile?"16px 18px":"18px 42px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"sticky",top:0,zIndex:20,background:"rgba(5,5,7,0.82)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)"}}>
          <div onClick={()=>setStage("landing")} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",minWidth:0}}>
            <div style={{display:"grid",gap:2}}>
              <span style={{fontSize:12,color:C.text,fontWeight:800}}>AdCritIQ<sup style={{fontSize:7,color:C.gold}}>TM</sup></span>
            </div>
          </div>
          <button onClick={()=>setShowPricing(true)} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} style={{padding:isMobile?"10px 13px":"11px 18px",borderRadius:999,border:`1px solid ${C.gold}55`,background:`${C.gold}12`,color:C.gold,fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",transition:"transform 0.12s ease",fontFamily:"'DM Sans',sans-serif"}}>
            Buy Credits
          </button>
        </div>

        <main style={{position:"relative",zIndex:1,maxWidth:1180,margin:"0 auto",padding:isMobile?"28px 18px 56px":"54px 32px 80px"}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"minmax(0,0.85fr) minmax(320px,0.55fr)",gap:isMobile?24:42,alignItems:"end",marginBottom:30}}>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:9,padding:"6px 11px",borderRadius:999,background:`${C.gold}10`,border:`1px solid ${C.gold}33`,color:C.gold,fontSize:10,fontWeight:900,letterSpacing:1.6,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:18}}>
                Creative Intelligence Intake
              </div>
              <h2 style={{fontSize:isMobile?42:isTablet?58:72,fontWeight:800,margin:"0 0 14px",fontFamily:"'Playfair Display',serif",letterSpacing:0,lineHeight:0.96}}>Upload Creative</h2>
              <p style={{color:C.dim,fontSize:isMobile?15:17,margin:0,lineHeight:1.75,maxWidth:660}}>Prepare the campaign context, creative file, and analysis token for an AdCritIQ neural creative readout.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {["17 neural metrics","15 platform scores","CMO playbook","PDF ready"].map(t=>(
                <div key={t} style={{padding:"11px 12px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:`1px solid ${C.border}`,color:C.dim,fontSize:11,fontWeight:800,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",letterSpacing:1,textAlign:"center"}}>{t}</div>
              ))}
            </div>
          </div>

          {error&&<div style={{padding:"15px 18px",borderRadius:14,background:"rgba(251,113,133,0.12)",color:C.red,fontSize:14,marginBottom:20,border:`1px solid ${C.red}55`,boxShadow:`0 18px 40px ${C.shadow}`}}>{error}</div>}

          <div style={{...panelStyle,padding:isMobile?18:30}}>
            <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",gap:16,padding:"14px 16px",marginBottom:20,background:C.s2,border:`1px solid ${C.border}`,borderRadius:14,flexDirection:isMobile?"column":"row"}}>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:C.text}}>
                  {compareMode ? "⚖️ Comparing 2 Creatives" : "📁 Single Creative Analysis"}
                </div>
                <div style={{fontSize:12,color:C.dim,marginTop:4,lineHeight:1.5}}>
                  {compareMode
                    ? "Upload two creatives for side-by-side neural comparison"
                    : "Analyse one creative across 17 metrics and 15 platforms"}
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
                style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none",alignSelf:isMobile?"flex-end":"center"}}
              >
                <div style={{fontSize:12,color:C.dim,fontWeight:800}}>
                  {compareMode ? "Switch to Single" : "Compare 2 Creatives"}
                </div>
                <div style={{width:44,height:24,borderRadius:999,background:compareMode?C.gold:C.border2,position:"relative",transition:"background 0.2s ease",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:compareMode?23:3,width:18,height:18,borderRadius:"50%",background:compareMode?C.ink:C.muted,transition:"left 0.2s ease"}}/>
                </div>
              </div>
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
            <section style={{paddingBottom:26,borderBottom:`1px solid ${C.border}`,marginBottom:26}}>
              {sectionHead("01","Campaign Context","Define the brand, audience and market inputs used to frame the analysis.")}
              <div style={{display:"grid",gridTemplateColumns:formGrid2,gap:18,marginBottom:18}}>
                <div style={fieldWrap}><label style={lbl}>Brand Name *</label><input placeholder="e.g. Dabur, Nestlé, Coca-Cola" style={inp} value={form.brand} onChange={e=>u("brand",e.target.value)}/></div>
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

            <section style={{paddingBottom:26,borderBottom:`1px solid ${C.border}`,marginBottom:26}}>
              {sectionHead("02","Creative Format","Select the primary creative environment and add any strategic context.")}
              <div style={{marginBottom:20}}>
                <label style={{...lbl,marginBottom:10}}>Creative Type</label>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":isTablet?"repeat(3,1fr)":"repeat(5,1fr)",gap:10}}>
                  {[["video","Video / Film"],["static_image","Static Image"],["motion_static","Animated / GIF"],["audio","Audio + Script"],["text","Text / Script"]].map(([k,v])=>
                    <button key={k} onClick={()=>u("type",k)} style={{padding:"13px 12px",borderRadius:12,border:`1px solid ${form.type===k?C.gold:C.border}`,background:form.type===k?`linear-gradient(180deg,${C.gold}20,${C.gold}0d)`:C.s2,color:form.type===k?C.gold:C.dim,fontSize:13,fontWeight:800,cursor:"pointer",boxShadow:form.type===k?`0 12px 28px ${C.gold}12`:"none",transition:"all 0.18s ease"}}>{v}</button>
                  )}
                </div>
              </div>
              {(getCreativeFormat(form.type,file)==="text"||getCreativeFormat(form.type,file)==="audio")&&(
                <div style={{...fieldWrap,marginBottom:18}}>
                  <label style={lbl}>{getCreativeFormat(form.type,file)==="audio"?"Audio Transcript / Script *":"Text / Script *"}</label>
                  <textarea
                    placeholder={getCreativeFormat(form.type,file)==="audio"?"Paste the radio/podcast script, voiceover transcript, sonic mnemonic description, and CTA...":"Paste ad copy, headline/body copy, script, landing page section, email, or SMS text..."}
                    style={{...inp,height:130,padding:"16px 18px",resize:"vertical",lineHeight:1.6}}
                    value={form.script}
                    onChange={e=>u("script",e.target.value)}
                  />
                  <div style={{fontSize:11,color:C.amber,lineHeight:1.5}}>
                    {getCreativeFormat(form.type,file)==="audio"?"Audio is analysed from transcript/script context in this version; raw audio transcription is not performed.":"Text/script analysis does not require an uploaded file."}
                  </div>
                </div>
              )}
              <div style={fieldWrap}>
                <label style={lbl}>Additional Notes / Brief</label>
                <textarea placeholder="Any context for the analysis: objectives, KPIs, competitive context, specific questions..." style={{...inp,height:110,padding:"16px 18px",resize:"vertical",lineHeight:1.6}} value={form.notes} onChange={e=>u("notes",e.target.value)}/>
              </div>
            </section>

            <section style={{paddingBottom:26,borderBottom:`1px solid ${C.border}`,marginBottom:26}}>
              {sectionHead("03","Upload Asset",getCreativeFormat(form.type,file)==="text"?"No file is required for text/script analysis. Paste the copy in the Creative Format section above.":"Upload the creative file that AdCritIQ will decode into neural and platform signals.")}
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
              {getCreativeFormat(form.type,file)==="text"?(
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

            <section>
              {sectionHead("04","Access Token","Enter the analysis token tied to your purchased credits.")}
              <label style={lbl}>
                Analysis Token *&nbsp;
                <span style={{fontSize:11,color:C.dim,fontWeight:400}}>
                  — <span style={{color:C.gold,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setShowPricing(true)}>Buy credits</span>
                </span>
              </label>
              <div style={{display:"flex",gap:10,alignItems:"center",flexDirection:isMobile?"column":"row",marginTop:8,marginBottom:18}}>
                <input
                  type="password"
                  style={{...inp,flex:1,fontFamily:"monospace",letterSpacing:1,width:"100%"}}
                  placeholder="Paste your token here..."
                  value={token}
                  onChange={e=>{
                    setToken(e.target.value);
                    localStorage.setItem("adcritiq_token",e.target.value);
                  }}
                />
                {credits!==null&&(
                  <div style={{padding:"12px 15px",background:`${C.green}12`,border:`1px solid ${C.green}33`,borderRadius:12,fontSize:13,color:C.green,fontWeight:900,whiteSpace:"nowrap",width:isMobile?"100%":"auto",textAlign:"center"}}>
                    {credits===999?"∞ demo":`${credits} credit${credits!==1?"s":""} left`}
                  </div>
                )}
              </div>
              {compareMode&&<div style={{fontSize:12,color:C.amber,marginTop:-8,marginBottom:16,fontWeight:800}}>⚡ Comparison mode uses 2 credits (one per creative)</div>}
              {(()=>{
                const fmt=getCreativeFormat(form.type,file);
                const needsFile=fmt!=="text"&&fmt!=="audio";
                const needsScript=fmt==="text"||fmt==="audio";
                const disabled=!form.brand||(needsFile&&!file)||(needsScript&&!form.script.trim())||(compareMode&&needsFile&&!fileB)||(compareMode&&needsScript&&!formB.script.trim());
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
      {shareModal}
    </div>
    );
  }

  // ============================================================
  // ANALYZING SCREEN
  // ============================================================
  if(stage==="analyzing"){
    return(
      <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${C.bg},${C.ink})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isMobile?24:40,color:C.text,fontFamily:"'Inter','DM Sans',sans-serif"}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
        <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:18,padding:isMobile?26:38,width:"100%",maxWidth:520,textAlign:"center",boxShadow:`0 28px 90px ${C.shadow}`}}>
          <div style={{width:78,height:78,borderRadius:"50%",border:`3px solid ${C.s3}`,borderTopColor:C.gold,animation:"spin 1s linear infinite",margin:"0 auto 30px"}}/>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:2,color:C.gold,textTransform:"uppercase",marginBottom:12,fontFamily:"'DM Mono',monospace"}}>AdCritIQ</div>
          <h2 style={{fontSize:isMobile?25:31,fontWeight:800,margin:"0 0 26px",fontFamily:"'Playfair Display',serif",letterSpacing:0}}>Encoding Creative Signals</h2>
          <div style={{width:"100%",height:8,borderRadius:999,background:C.s3,marginBottom:16,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:999,background:C.gold,width:`${progress}%`,transition:"width 0.5s"}}/>
          </div>
          <div style={{fontSize:14,color:C.dim,animation:"pulse 2s infinite",minHeight:22}}>{progressMsg}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:8,fontFamily:"'DM Mono',monospace"}}>{progress}%</div>
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
          <div style={{position:"fixed",top:0,left:miniLeft,right:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:isMobile?"10px 16px":"10px 28px",background:"rgba(7,7,15,0.82)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,animation:"fadeIn 0.2s ease both"}}>
            <span style={{fontWeight:700,color:C.text,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {form.brand||"AdCritIQ"}
              <span style={{color:C.dim,fontWeight:400,fontSize:11,marginLeft:10,fontFamily:"monospace"}}>
                {form.industry||"Creative"} · {form.country||form.market||"India"}
              </span>
            </span>
            <span style={{padding:"3px 12px",borderRadius:8,fontWeight:800,fontFamily:"monospace",color:ringColor,border:`1px solid ${ringColor}55`,background:`${ringColor}12`,flexShrink:0}}>
              {r.overall_grade||grade(ringScore)}
            </span>
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
              <div style={{background:"rgba(16,16,20,0.94)",borderBottom:`1px solid ${C.border}`,padding:isMobile?"18px":"24px 36px",position:"sticky",top:0,zIndex:40,backdropFilter:"blur(16px)"}}>
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
                        <div style={{display:"flex",alignItems:"center",minWidth:0}}><PlatformChip name={p.name}/><span style={{fontWeight:800,color:C.text,fontSize:13}}>{p.name}</span></div>
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
          <div style={{background:"rgba(16,16,20,0.94)",borderBottom:`1px solid ${C.border}`,padding:isMobile?"16px 18px":"20px 36px",position:"sticky",top:0,zIndex:40,backdropFilter:"blur(16px)"}}>
            <div style={{display:"flex",alignItems:isMobile?"stretch":"flex-start",justifyContent:"space-between",gap:16,flexDirection:isMobile?"column":"row"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:11,color:C.dim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontFamily:"'DM Mono',monospace"}}>
                  {form.industry||""}{form.market?` · ${form.market}`:""}{form.type?` · ${form.type}`:""} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                </div>
                <h1 style={{fontSize:isMobile?20:22,fontWeight:800,color:C.text,margin:0,letterSpacing:0,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>
                  {form.brand}{form.campaign?<span style={{fontWeight:400,color:C.dim}}> — {form.campaign}</span>:""}
                </h1>
                {r.headline_verdict&&<div style={{fontSize:13,color:"rgba(242,242,255,0.80)",marginTop:6,fontStyle:"italic",opacity:1}}>"{r.headline_verdict}"</div>}
              </div>

              {/* FIX 2: Grade badge with hover tooltip */}
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
                          <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
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
            <div style={{display:"grid",gridTemplateColumns:scoreGrid,gap:isMobile?12:16,marginBottom:isMobile?24:36,animation:"fadeUp 0.4s ease 0.1s both"}}>
              {[
                ["Viral Potential",r.viral_potential,70],["Hook Strength",r.hook_strength,75],["Hold Rate",r.hold_rate,65],
                ["Emotional Peak",r.emotional_peak,70],["Brand Recall",r.brand_recall,80],["Memory Encoding",r.memory_encoding,70],
                ["Sound-Off Survival",r.sound_off_survival,null],["Share Intent",r.share_intent,null],["Creative Efficiency",r.creative_efficiency,null]
              ].map(([l,v,b])=>v!==undefined&&<ScoreCard C={C} hex={hex} key={l} label={l} value={v} note={r.score_notes?.[l.toLowerCase().replace(/ /g,"_")]||""} pct={v} benchmark={b}/>)}
            </div>

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
                {Object.entries(br).map(([k,v])=><BarMetric C={C} hex={hex} key={k} label={k.replace(/_/g," ")} value={v}/>)}
              </Card>
              <Card C={C}>
                <CardTitle C={C} label={C.teal}>Cognitive Channel Load</CardTitle>
                {Object.entries(cl).map(([k,v])=><BarMetric C={C} hex={hex} key={k} label={k.replace(/_/g," ")} value={v} color={C.purple}/>)}
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
                      <BarMetric C={C} hex={hex} key={label} label={label} value={value} color={color}/>
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
                  return <BarMetric C={C} hex={hex} key={k} label={k} value={avg} color={C.pink}/>;
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
                    <PlatformChip name={k.replace(/_/g," ")}/>
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
                  <BarMetric C={C} hex={hex} key={l} label={l} value={v} maxW={180}/>
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

          {tab==="neuriq"&&results&&<NeurIQTab results={results} C={C}/>}

          {/* ===== REPOSITORY ===== */}
          {tab==="repository"&&(<>
            <Card C={C} style={{marginBottom:20}}>
              <CardTitle C={C} label={C.gold}>Saved Analysis Repository</CardTitle>
              <div style={{display:"grid",gridTemplateColumns:repoFilterGrid,gap:12,alignItems:"end"}}>
                <label style={{display:"grid",gap:6,fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'DM Mono',monospace"}}>
                  Brand
                  <input id="repoBrandFilter" onChange={(e)=>loadRepository({brand:e.target.value,grade:document.getElementById("repoGradeFilter")?.value||""})}
                    placeholder="Filter by brand"
                    style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                </label>
                <label style={{display:"grid",gap:6,fontSize:11,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:1.5,fontFamily:"'DM Mono',monospace"}}>
                  Grade
                  <input id="repoGradeFilter" onChange={(e)=>loadRepository({brand:document.getElementById("repoBrandFilter")?.value||"",grade:e.target.value})}
                    placeholder="A+"
                    style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
                </label>
                <button onClick={()=>loadRepository({brand:document.getElementById("repoBrandFilter")?.value||"",grade:document.getElementById("repoGradeFilter")?.value||""})}
                  style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${C.gold}44`,background:`${C.gold}16`,color:C.gold,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  Refresh
                </button>
              </div>
            </Card>
            {repoLoading?(
              <Card C={C} style={{textAlign:"center"}}>
                <div style={{fontSize:15,color:C.gold,fontWeight:700}}>Loading repository...</div>
              </Card>
            ):savedAnalyses.length===0?(
              <Card C={C} style={{textAlign:"center"}}>
                <div style={{fontSize:18,color:C.text,fontWeight:700,marginBottom:8}}>No saved analyses yet</div>
                <div style={{fontSize:14,color:C.dim}}>Saved analysis reports will appear here.</div>
              </Card>
            ):(
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
                {savedAnalyses.map(a=>{
                  const gr=a.overall_grade||a.full_result?.overall_grade||"—";
                  const gc=gr==="A+"||gr==="A"||gr==="A-"?C.green:String(gr).startsWith("B")?C.amber:String(gr).startsWith("C")?C.gold:C.red;
                  return(
                    <Card C={C} key={a.id} delay={Math.min(savedAnalyses.indexOf(a)*70,500)} style={{padding:22}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
                        <div style={{minWidth:0}}>
                          <div style={{fontSize:18,fontWeight:800,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.brand||"Untitled Brand"}</div>
                          <div style={{fontSize:11,color:C.dim,marginTop:4}}>{a.industry||"Unknown industry"} · {a.created_at?new Date(a.created_at).toLocaleDateString("en-GB"):"No date"}</div>
                        </div>
                        <div style={{background:`${gc}18`,border:`1px solid ${gc}44`,borderRadius:8,padding:"5px 10px",fontSize:13,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace"}}>{gr}</div>
                      </div>
                      <p style={{fontSize:13,color:C.dim,lineHeight:1.7,minHeight:44,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{a.headline_verdict||a.full_result?.headline_verdict||"No headline verdict saved."}</p>
                      <div style={{display:"flex",gap:10,marginTop:16}}>
                        <button onClick={()=>{setResults(a.full_result||{});setTab("summary");}}
                          style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1px solid ${C.cyan}44`,background:`${C.cyan}12`,color:C.cyan,fontWeight:800,cursor:"pointer"}}>
                          Load
                        </button>
                        <button onClick={()=>deleteSavedAnalysis(a.id)}
                          style={{flex:1,padding:"10px 12px",borderRadius:10,border:`1px solid ${C.red}44`,background:`${C.red}12`,color:C.red,fontWeight:800,cursor:"pointer"}}>
                          Delete
                        </button>
                      </div>
                    </Card>
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
              </>)}

              {/* ── GRADING ── */}
              {methTab==="grading"&&(<>
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
              </>)}

              {/* ── ALL 17 METRICS ── */}
              {methTab==="metrics"&&(<>
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.cyan}>All 17 Neural Metrics — Complete Reference</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>Every metric is scored 0–100. Below is the full definition, what drives a high score, what a low score means, and what to do about it.</p>
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
                      const open=expandedPlatform===`metric:${name}`;
                      return(
                        <div key={name} style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s ease",background:C.s1}}>
                          <div
                            onClick={()=>setExpandedPlatform(open?null:`metric:${name}`)}
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
              </>)}

              {/* ── NEURAL SCIENCE ── */}
              {methTab==="neural"&&(<>
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
              </>)}

              {/* ── PLATFORM SCORING ── */}
              {methTab==="platforms"&&(<>
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
                      const open=expandedPlatform===`platform:${platform}`;
                      return(
                        <div key={platform} style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",transition:"all 0.2s ease"}}>
                          <div
                            onClick={()=>setExpandedPlatform(open?null:`platform:${platform}`)}
                            style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",background:open?C.s2:C.s1,borderLeft:`3px solid ${color||C.gold}`}}
                          >
                            <span style={{fontWeight:700,color:C.text,fontSize:14,display:"flex",alignItems:"center",minWidth:0}}>
                              <PlatformChip name={platform}/>
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
              </>)}

              {/* ── SCIENCE ── */}
              {methTab==="science"&&(<>
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
                      {title:"Robert Heath — Low-Attention Processing (2012)",color:C.purple,application:"Heath's research demonstrates that advertising can build brand associations even without conscious attention — but only if emotional content is present. This informs the Sound-Off Survival score: a creative that loses all message value when muted loses the ability to build associations in low-attention contexts.",metric:"Sound-Off Survival"},
                      {title:"Weber-Fechner Law — Stimulus Adaptation",color:C.orange,application:"Ad Fatigue Risk scoring is based on the Weber-Fechner Law of diminishing stimulus response. Repeated identical stimuli produce logarithmically declining responses. Creatives with low scene variety, static imagery, or repetitive dialogue are predicted to fatigue faster.",metric:"Ad Fatigue Risk"},
                      {title:"Vittorio Gallese — Mirror Neuron Theory",color:C.teal,application:"Mirror Neuron activation scoring reflects Gallese's work on simulation theory. Viewers who see on-screen humans expressing emotion neurologically simulate that emotion. High mirror neuron activation directly correlates with share intent and emotional contagion in advertising.",metric:"Mirror Neurons + Share Intent"},
                    ].map(({title,color,application,metric})=>(
                      <div key={title} style={{background:C.s2,borderRadius:12,padding:20,borderLeft:`4px solid ${color}`}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>{title}</div>
                        <div style={{display:"inline-block",padding:"2px 10px",background:`${color}15`,borderRadius:6,fontSize:10,fontWeight:700,color:color,fontFamily:"'DM Mono',monospace",marginBottom:10,letterSpacing:1}}>Applied to: {metric}</div>
                        <p style={{fontSize:13,color:C.dim,lineHeight:1.7}}>{application}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>)}

              {/* ── LIMITATIONS ── */}
              {methTab==="limits"&&(<>
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
        {shareModal}
      </div>
    );
  }
  return null;
}

// Helper: responsive font clamp
function clamp(base, vw, max){ return `clamp(${base}px, ${vw}vw, ${max}px)`; }
