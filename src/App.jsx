import { useState, useRef, useCallback } from "react";
import { generateBrainEncoderPDF } from "./generatePDF";
import Card from "./components/Card";
import ScoreCard from "./components/ScoreCard";
import BarMetric from "./components/BarMetric";
import CardTitle from "./components/CardTitle";
import Takeaway from "./components/Takeaway";
import Sidebar from "./components/Sidebar";

// ============================================================
// DESIGN TOKENS — Premium Consultancy Edition
// Palette: Deep Onyx · Champagne Gold · Malachite · Slate
// ============================================================
const C = {
  // Surfaces
  bg:"#060810",s1:"#0a0d1e",s2:"#0f1228",s3:"#141730",
  // Borders
  border:"#1c2040",border2:"#252850",
  // Text
  text:"#f0f0f8",dim:"#8890b0",muted:"#454870",
  // Brand accents
  gold:"#c9a84c",goldL:"#e8c97a",goldD:"#8a6f2e",
  // Signal colours
  cyan:"#00d4b8",blue:"#4f8ef7",green:"#22d472",
  red:"#f05a6a",amber:"#f5a623",orange:"#e8793a",
  purple:"#9b7fea",pink:"#e84393",teal:"#00b8a9",
  rose:"#f43f5e",lime:"#84cc16",sky:"#38bdf8",
  // Sidebar
  sideW: 220,
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
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap";
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
  {id:"repository", label:"Repository",        icon:"🗄️"},
  {id:"methodology",label:"Methodology",      icon:Icon.glossary},
];

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
function extractFrames(file){
  if(file.type.startsWith("image/")){
    return new Promise(r=>{
      const rd=new FileReader();
      rd.onload=e=>r({frames:[e.target.result.split(",")[1]],duration:0,duration_seconds:0,video_duration:0,width:0,height:0,isImage:true});
      rd.readAsDataURL(file);
    });
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
  const [form,setForm]=useState({brand:"",client:"",campaign:"",agency:"",type:"video",industry:"FMCG / CPG",audience:"",market:"India",notes:"",password:""});
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
  const fileRef=useRef(null);

  const handleFile=(e)=>{
    const f=e.target.files[0];if(!f)return;
    setFile(f);
    if(f.type.startsWith("image/")){
      const r=new FileReader();
      r.onload=ev=>setPreview(ev.target.result);
      r.readAsDataURL(f);
    }else if(f.type.startsWith("video/")){
      setPreview(URL.createObjectURL(f));
    }
  };
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleAnalyze=useCallback(async()=>{
    if(!file||!form.brand)return;
    setStage("analyzing");setProgress(0);setError(null);

    try{
      setProgressMsg("Reading creative file...");setProgress(5);
      const frameData=await extractFrames(file);
      // FIX 1: duration_seconds and video_duration are now in frameData
      const payload={ frames:frameData.frames, metadata:{...form,...frameData} };

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
        if(!fastResp.ok||!fd.success){throw new Error(fd.error||"Metrics analysis failed");}
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
        scenes: richData?.scenes||[],
        strategic_insights: richData?.strategic_insights||[],
        cmo_actions: richData?.cmo_actions||[],
      };

      setProgress(100);setProgressMsg("Report ready.");
      await new Promise(r=>setTimeout(r,400));
      setResults(combined);setStage("results");setTab("summary");

    }catch(e){setError(e.message);setStage("form");}
  },[file,form]);

  const cleanResultForSave=(source)=>{
    const clean={};
    Object.entries(source||{}).forEach(([k,v])=>{ if(!k.startsWith("__")) clean[k]=v; });
    return clean;
  };

  const saveCurrentAnalysis=async()=>{
    if(!results)return;
    const fullResult=cleanResultForSave(results);
    setResults(p=>({...p,__saveStatus:"saving",__saveError:""}));
    try{
      const resp=await fetch("/.netlify/functions/save-analysis",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          brand:form.brand,
          client:form.client,
          campaign:form.campaign,
          agency:form.agency,
          industry:form.industry,
          market:form.market,
          creative_type:form.type,
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

  const loadRepository=async(filters={})=>{
    setRepoLoading(true);
    try{
      const params=new URLSearchParams();
      if(filters.brand)params.set("brand",filters.brand);
      if(filters.grade)params.set("grade",filters.grade);
      const resp=await fetch(`/.netlify/functions/get-analyses?${params.toString()}`);
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
      const resp=await fetch(`/.netlify/functions/delete-analysis?id=${encodeURIComponent(id)}`,{method:"DELETE"});
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

  // ============================================================
  // LANDING PAGE
  // ============================================================
  if(stage==="landing"){
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center",fontFamily:"'DM Sans',sans-serif",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",background:"radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,212,184,0.04) 0%, transparent 70%)",pointerEvents:"none"}}/>
        <div style={{marginBottom:40,position:"relative"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:5,color:C.gold,textTransform:"uppercase",marginBottom:10,fontFamily:"'DM Mono',monospace"}}>
            ADVantage Insights<sup style={{fontSize:7,color:C.gold,verticalAlign:"super",marginLeft:1}}>TM</sup>
          </div>
          <div style={{width:40,height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 auto"}}/>
        </div>
        <h1 style={{fontSize:clamp(42,6,72),fontWeight:800,lineHeight:1.0,maxWidth:700,marginBottom:12,position:"relative",fontFamily:"'Playfair Display',serif",letterSpacing:-1,color:C.text}}>
          Brain Encoder<sup style={{fontSize:16,color:C.gold,verticalAlign:"super",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>TM</sup>
        </h1>
        <div style={{fontSize:16,fontWeight:600,color:C.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:28,fontFamily:"'DM Mono',monospace"}}>
          Neural Creative Intelligence Platform
        </div>
        <p style={{fontSize:17,color:C.dim,maxWidth:560,lineHeight:1.8,marginBottom:48,position:"relative",fontWeight:400}}>
          Upload any video ad, display creative, or social content. Receive a complete neural performance report — 17 metrics, 15 platform scores, scene intelligence, and a CMO action playbook.
        </p>
        <button onClick={()=>setStage("form")}
          style={{background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:C.bg,border:"none",padding:"18px 56px",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",letterSpacing:0.5,position:"relative",boxShadow:`0 8px 32px ${C.gold}40`,fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s",marginBottom:56}}>
          Start Analysis →
        </button>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginBottom:48,maxWidth:680}}>
          {["17 Neural Metrics","15 Platform Scores","Attention Heatmap","Scene Intelligence","Privacy & DPDP","CMO Playbook","No Duration Limit","System 1 / System 2"].map(t=>(
            <span key={t} style={{padding:"7px 14px",background:C.s2,borderRadius:100,border:`1px solid ${C.border2}`,fontSize:11,fontWeight:600,color:C.dim,letterSpacing:0.3,fontFamily:"'DM Sans',sans-serif"}}>{t}</span>
          ))}
        </div>
        <div style={{display:"flex",gap:40,color:C.muted,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,textTransform:"uppercase"}}>
          <span>Full Explainability</span><span style={{color:C.border}}>·</span>
          <span>Platform-Specific</span><span style={{color:C.border}}>·</span>
          <span>No Duration Cap</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // UPLOAD FORM
  // ============================================================
  if(stage==="form"){
    const inp={width:"100%",padding:"14px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.s2,color:C.text,fontSize:15,outline:"none",fontFamily:"inherit"};
    const lbl={fontSize:11,fontWeight:700,letterSpacing:2,color:C.dim,textTransform:"uppercase",marginBottom:6,display:"block",fontFamily:"'JetBrains Mono',monospace"};
    const selStyle={...inp,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a7a9e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center"};
    return(
      <div style={{minHeight:"100vh",background:C.bg}}>
        <div style={{padding:"20px 40px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:4,color:C.gold,textTransform:"uppercase",cursor:"pointer"}} onClick={()=>setStage("landing")}>ADVantage Insights</span>
          <span style={{fontSize:12,color:C.dim}}>·</span>
          <span style={{fontSize:12,color:C.cyan,fontWeight:600}}>Brain Encoder</span>
        </div>
        <div style={{maxWidth:760,margin:"40px auto",padding:"0 24px"}}>
          <h2 style={{fontSize:34,fontWeight:200,marginBottom:6}}>Upload <span style={{fontWeight:700}}>Creative</span></h2>
          <p style={{color:C.dim,fontSize:15,marginBottom:32}}>Fill in the brief and upload your creative for analysis.</p>
          {error&&<div style={{padding:"14px 18px",borderRadius:10,background:"rgba(231,76,60,0.12)",color:C.red,fontSize:14,marginBottom:20,border:`1px solid ${C.red}`}}>{error}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
            <div><label style={lbl}>Brand Name *</label><input placeholder="e.g. Dabur, Nestlé, Coca-Cola" style={inp} value={form.brand} onChange={e=>u("brand",e.target.value)}/></div>
            <div><label style={lbl}>Client / Advertiser</label><input placeholder="e.g. Dabur India Ltd" style={inp} value={form.client} onChange={e=>u("client",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
            <div><label style={lbl}>Campaign Name</label><input placeholder="e.g. Immunity Winter 2026" style={inp} value={form.campaign} onChange={e=>u("campaign",e.target.value)}/></div>
            <div><label style={lbl}>Agency / Team</label><input placeholder="e.g. Ogilvy, DDB, Wunderman" style={inp} value={form.agency} onChange={e=>u("agency",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18,marginBottom:18}}>
            <div><label style={lbl}>Industry Vertical</label>
              <select style={selStyle} value={form.industry} onChange={e=>u("industry",e.target.value)}>
                {["FMCG / CPG","Pharma / Healthcare","Auto / Mobility","BFSI / Fintech","Technology","E-commerce","Retail / QSR","Telecom","Media / Entertainment","Real Estate","Education","Government / PSU","Other"].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Target Market</label>
              <select style={selStyle} value={form.market} onChange={e=>u("market",e.target.value)}>
                {["India","India — Tier 1","India — Tier 2/3","USA","UK","UAE / MENA","Southeast Asia","Global","Other"].map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Target Audience</label><input placeholder="e.g. Males 35-55, SEC A/B" style={inp} value={form.audience} onChange={e=>u("audience",e.target.value)}/></div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>Creative Type</label>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["video","Video Ad"],["display","Display / Banner"],["social","Social Post"],["ctv","CTV / OTT"],["bumper","6s Bumper"],["preroll","Pre-Roll"]].map(([k,v])=>
                <button key={k} onClick={()=>u("type",k)} style={{padding:"10px 20px",borderRadius:8,border:`1px solid ${form.type===k?C.cyan:C.border}`,background:form.type===k?"rgba(0,200,255,0.08)":C.s2,color:form.type===k?C.cyan:C.dim,fontSize:13,fontWeight:600,cursor:"pointer"}}>{v}</button>
              )}
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>Additional Notes / Brief</label>
            <textarea placeholder="Any context for the analysis: objectives, KPIs, competitive context, specific questions..." style={{...inp,height:80,resize:"vertical"}} value={form.notes} onChange={e=>u("notes",e.target.value)}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lbl}>Upload Creative *</label>
            <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${file?C.cyan:C.border}`,borderRadius:14,padding:file?20:44,textAlign:"center",cursor:"pointer",background:file?"rgba(0,200,255,0.03)":C.s1,transition:"all .2s"}}>
              {file?(
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  {preview&&file.type.startsWith("image/")&&<img src={preview} style={{width:140,height:80,objectFit:"cover",borderRadius:8}} alt=""/>}
                  {preview&&file.type.startsWith("video/")&&<video src={preview} style={{width:140,height:80,objectFit:"cover",borderRadius:8}}/>}
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:15,fontWeight:600,color:C.text}}>{file.name}</div>
                    <div style={{fontSize:13,color:C.dim}}>{(file.size/1024/1024).toFixed(1)} MB · {file.type}</div>
                    <div style={{fontSize:12,color:C.cyan,marginTop:4}}>Click to change file</div>
                  </div>
                </div>
              ):(
                <>
                  <div style={{fontSize:40,marginBottom:8}}>📁</div>
                  <div style={{fontSize:16,fontWeight:600,color:C.text}}>Drop file here or click to browse</div>
                  <div style={{fontSize:13,color:C.dim,marginTop:6}}>MP4, MOV, AVI, WEBM, JPG, PNG</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="video/*,image/*" onChange={handleFile} style={{display:"none"}}/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={lbl}>Access Code (if required)</label>
            <input type="password" placeholder="Leave blank if open access" style={{...inp,maxWidth:300}} value={form.password} onChange={e=>u("password",e.target.value)}/>
          </div>
          <button onClick={handleAnalyze} disabled={!file||!form.brand} style={{width:"100%",padding:18,borderRadius:12,border:"none",background:(!file||!form.brand)?C.s3:`linear-gradient(135deg,${C.cyan},${C.blue})`,color:(!file||!form.brand)?C.dim:"white",fontSize:17,fontWeight:700,cursor:(!file||!form.brand)?"not-allowed":"pointer",boxShadow:(!file||!form.brand)?"none":"0 4px 20px rgba(0,200,255,0.25)"}}>
            🧠 Run Brain Encoder Analysis
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // ANALYZING SCREEN
  // ============================================================
  if(stage==="analyzing"){
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
        <div style={{width:80,height:80,borderRadius:"50%",border:`3px solid ${C.s3}`,borderTopColor:C.cyan,animation:"spin 1s linear infinite",marginBottom:32}}/>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12}}>ADVantage Insights</div>
        <h2 style={{fontSize:28,fontWeight:200,marginBottom:28}}>Encoding <span style={{fontWeight:700,color:C.cyan}}>Brain Activity</span></h2>
        <div style={{width:440,maxWidth:"90%",height:8,borderRadius:4,background:C.s3,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.cyan},${C.blue})`,width:`${progress}%`,transition:"width 0.5s"}}/>
        </div>
        <div style={{fontSize:14,color:C.dim,animation:"pulse 2s infinite"}}>{progressMsg}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:8,fontFamily:"'JetBrains Mono',monospace"}}>{progress}%</div>
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

    // FIX 1: dynamic heatmap label spacing — max 12 labels regardless of duration
    const heatmapLabelCount = Math.min(attn.length, 12);
    const heatmapLabelStep  = Math.ceil(attn.length / heatmapLabelCount);
    const heatmapLabels = Array.from(
      { length: Math.floor(attn.length / heatmapLabelStep) + 1 },
      (_, i) => Math.min(i * heatmapLabelStep, attn.length)
    );

    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'DM Sans',sans-serif"}}>

        {/* ── LEFT SIDEBAR ── */}
        <Sidebar
          C={C}
          NAV_TABS={NAV_TABS}
          tab={tab}
          setTab={setDashboardTab}
          grade={r.overall_grade}
          brand={form.brand}
          onNew={()=>{setStage("form");setResults(null);setFile(null);setPreview(null);}}
          downloading={downloading}
          onDownload={async()=>{
            setDownloading(true);
            try{ await generateBrainEncoderPDF(r, form); }
            catch(e){ alert("PDF generation failed: "+e.message); }
            finally{ setDownloading(false); }
          }}
        />

        {/* ── MAIN CONTENT ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowY:"auto"}}>

          {/* Top header bar */}
          <div style={{background:C.s1,borderBottom:`1px solid ${C.border}`,padding:"20px 36px",position:"sticky",top:0,zIndex:40}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontFamily:"'DM Mono',monospace"}}>
                  {form.industry||""}{form.market?` · ${form.market}`:""}{form.type?` · ${form.type}`:""} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                </div>
                <h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:0,letterSpacing:-0.5,fontFamily:"'Playfair Display',serif",lineHeight:1.2}}>
                  {form.brand}{form.campaign?<span style={{fontWeight:400,color:C.dim}}> — {form.campaign}</span>:""}
                </h1>
                {r.headline_verdict&&<div style={{fontSize:13,color:C.gold,marginTop:6,fontStyle:"italic",opacity:0.9}}>"{r.headline_verdict}"</div>}
              </div>

              {/* FIX 2: Grade badge with hover tooltip */}
              {r.overall_grade&&(()=>{
                const gc=r.overall_grade==="A+"||r.overall_grade==="A"||r.overall_grade==="A-"?C.green:r.overall_grade?.startsWith("B")?C.amber:r.overall_grade?.startsWith("C")?C.gold:C.red;
                return(
                  <div style={{flexShrink:0,position:"relative"}}
                    onMouseEnter={()=>setGradeTooltipVisible(true)}
                    onMouseLeave={()=>setGradeTooltipVisible(false)}
                  >
                    <div style={{background:`${gc}18`,border:`1px solid ${gc}44`,borderRadius:12,padding:"10px 20px",textAlign:"center",cursor:"help"}}>
                      <div style={{fontSize:9,color:gc,letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:3}}>Grade</div>
                      <div style={{fontSize:24,fontWeight:900,color:gc,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{r.overall_grade}</div>
                      <div style={{fontSize:8,color:C.muted,marginTop:4,letterSpacing:0.5}}>hover for scale</div>
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
	                    <button onClick={saveCurrentAnalysis} disabled={r.__saveStatus==="saving"}
	                      style={{width:"100%",marginTop:10,padding:"9px 12px",borderRadius:10,border:`1px solid ${C.gold}44`,background:r.__saveStatus==="saved"?`${C.green}18`:r.__saveStatus==="error"?`${C.red}18`:`${C.gold}14`,color:r.__saveStatus==="saved"?C.green:r.__saveStatus==="error"?C.red:C.gold,fontSize:11,fontWeight:800,cursor:r.__saveStatus==="saving"?"wait":"pointer",fontFamily:"'DM Sans',sans-serif"}}>
	                      {r.__saveStatus==="saving"?"Saving...":r.__saveStatus==="saved"?"Saved ✓":"Save to Repository"}
	                    </button>
	                    {r.__saveError&&<div style={{fontSize:10,color:C.red,marginTop:6,maxWidth:140,lineHeight:1.4}}>{r.__saveError}</div>}
	                  </div>
	                );
	              })()}
            </div>
          </div>

          {/* Tab content */}
          <div style={{padding:"32px 36px",maxWidth:1300,width:"100%",boxSizing:"border-box"}}>

          {/* ===== EXECUTIVE SUMMARY ===== */}
          {tab==="summary"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:36}}>
              {[
                ["Viral Potential",r.viral_potential],["Hook Strength",r.hook_strength],["Hold Rate",r.hold_rate],
                ["Emotional Peak",r.emotional_peak],["Brand Recall",r.brand_recall],["Memory Encoding",r.memory_encoding],
                ["Sound-Off Survival",r.sound_off_survival],["Share Intent",r.share_intent],["Creative Efficiency",r.creative_efficiency]
              ].map(([l,v])=>v!==undefined&&<ScoreCard C={C} hex={hex} key={l} label={l} value={v} note={r.score_notes?.[l.toLowerCase().replace(/ /g,"_")]||""} pct={v}/>)}
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

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
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
            <Card C={C} style={{marginBottom:24}}>
              <CardTitle C={C} label={C.amber}>Second-by-Second Attention Heatmap</CardTitle>

              {/* FIX 1: Dynamic heatmap grid — renders full video duration */}
              <div style={{
                display:"grid",
                gridTemplateColumns:`repeat(${attn.length},1fr)`,
                gap:attn.length>30?2:4
              }}>
                {attn.map((v,i)=>
                  <div key={i} title={`${i}s — ${v}%`}
                    style={{
                      height:56,
                      borderRadius:attn.length>40?3:6,
                      cursor:"pointer",
                      background:hex(v),
                      opacity:Math.max(.3,v/100),
                      transition:"transform .15s"
                    }}
                    onMouseEnter={e=>e.target.style.transform="scaleY(1.3)"}
                    onMouseLeave={e=>e.target.style.transform="scaleY(1)"}
                  />
                )}
              </div>

              {/* FIX 1: Dynamic timeline labels — smart spacing up to 12 labels */}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:C.dim,fontFamily:"'JetBrains Mono',monospace"}}>
                {heatmapLabels.map(s=>(
                  <span key={s}>{s}s</span>
                ))}
              </div>

              {/* FIX 1: Duration badge */}
              <div style={{textAlign:"right",marginTop:6}}>
                <span style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:2,textTransform:"uppercase",opacity:0.7,fontFamily:"'DM Mono',monospace"}}>
                  Full {attn.length}s analysed
                </span>
              </div>
            </Card>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              {sc.map((s,i)=>
                <Card C={C} key={i} style={{position:"relative",overflow:"hidden"}}>
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
                  </div>
                </Card>
              )}
            </div>
            <Takeaway C={C} icon="🎬" title="Scene Intelligence — How to Use This" color={C.teal} items={tw.scenes}/>
          </>)}

          {/* ===== PLATFORM SCORES ===== */}
          {tab==="platforms"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16}}>
              {Object.entries(ps).map(([k,v])=>
                <Card C={C} key={k} style={{textAlign:"center",padding:24}}>
                  <div style={{fontSize:38,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(v),lineHeight:1}}>{v}</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:10,textTransform:"capitalize",lineHeight:1.3}}>{k.replace(/_/g," ")}</div>
                  <div style={{marginTop:10,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:hex(v)}}>{grade(v)}</div>
                </Card>
              )}
            </div>
            <Takeaway C={C} icon="📱" title="Platform Strategy — Where to Run This" color={C.blue} items={tw.platforms}/>
          </>)}

          {/* ===== SOUND & SENSORY ===== */}
          {tab==="sound"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {ins.map((n,i)=>{
                const vc=n.vtype==="risk"?{bg:"rgba(231,76,60,0.1)",bd:C.red,c:"#ff7b7b"}:n.vtype==="win"?{bg:"rgba(46,204,113,0.1)",bd:C.green,c:"#6dffaa"}:n.vtype==="tip"?{bg:"rgba(0,200,255,0.1)",bd:C.cyan,c:C.cyan}:{bg:"rgba(241,196,0,0.1)",bd:C.amber,c:C.amber};
                return(
                  <Card C={C} key={i}>
                    <div style={{fontSize:13,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.gold,marginBottom:6}}>{n.num}</div>
                    <h3 style={{fontSize:18,fontWeight:700,marginBottom:12,lineHeight:1.35}}>{n.title}</h3>
                    <p style={{fontSize:14,color:C.dim,lineHeight:1.75}}>{n.body}</p>
                    {n.verdict&&<div style={{marginTop:14,padding:"12px 16px",borderRadius:8,background:vc.bg,borderLeft:`4px solid ${vc.bd}`,fontSize:13,fontWeight:600,color:vc.c,lineHeight:1.6}}>{n.verdict}</div>}
                  </Card>
                );
              })}
            </div>
          )}

          {/* ===== CMO PLAYBOOK ===== */}
          {tab==="cmo"&&(
            <div style={{background:C.s1,borderRadius:16,padding:40,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:8}}>For the Marketing Head</div>
              <h2 style={{fontSize:32,fontWeight:200,marginBottom:8}}>The <span style={{fontWeight:700,color:C.gold}}>CMO Playbook</span></h2>
              <p style={{fontSize:14,color:C.dim,marginBottom:32}}>Prioritized actions mapped to metric gaps. Sorted by impact-to-effort ratio.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {cmo.map((a,i)=>
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:12,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:C.gold}}>ACTION {a.num||String(i+1).padStart(2,"0")}</span>
                      {a.priority&&<span style={{padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:a.priority==="critical"?"rgba(231,76,60,0.2)":a.priority==="high"?"rgba(241,196,0,0.15)":"rgba(0,200,255,0.1)",color:a.priority==="critical"?C.red:a.priority==="high"?C.amber:C.cyan}}>{a.priority}</span>}
                      {a.effort&&<span style={{padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:700,background:C.s3,color:C.dim}}>Effort: {a.effort}</span>}
                    </div>
                    <h4 style={{fontSize:17,fontWeight:700,marginBottom:8,lineHeight:1.3}}>{a.title}</h4>
                    <p style={{fontSize:14,color:C.dim,lineHeight:1.7}}>{a.body}</p>
                    {a.impact&&<div style={{marginTop:10,fontSize:12,color:C.green,fontWeight:600}}>📈 {a.impact}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== REPOSITORY ===== */}
          {tab==="repository"&&(<>
            <Card C={C} style={{marginBottom:20}}>
              <CardTitle C={C} label={C.gold}>Saved Analysis Repository</CardTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 160px auto",gap:12,alignItems:"end"}}>
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
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
                {savedAnalyses.map(a=>{
                  const gr=a.overall_grade||a.full_result?.overall_grade||"—";
                  const gc=gr==="A+"||gr==="A"||gr==="A-"?C.green:String(gr).startsWith("B")?C.amber:String(gr).startsWith("C")?C.gold:C.red;
                  return(
                    <Card C={C} key={a.id} style={{padding:22}}>
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
                  <CardTitle C={C} label={C.cyan}>What Brain Encoder Does</CardTitle>
                  <p style={{fontSize:15,color:C.dim,lineHeight:1.9,marginBottom:24}}>Brain Encoder is a predictive neural creative intelligence platform. It does not measure actual brain activity — it <b style={{color:C.text}}>predicts</b> how the human brain is likely to respond to an advertising creative based on visual signals, advertising science, and platform-specific norms.</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
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
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
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
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
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
                    ].map(({name,good,color,def,drives,low})=>(
                      <div key={name} style={{background:C.s2,borderRadius:12,padding:20,borderLeft:`3px solid ${color}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <span style={{fontSize:14,fontWeight:700,color:C.text}}>{name}</span>
                          <span style={{fontSize:11,fontWeight:700,color:color,fontFamily:"'DM Mono',monospace",padding:"2px 10px",background:`${color}15`,borderRadius:6}}>Good: {good}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                          <div><div style={{fontSize:10,fontWeight:700,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Definition</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{def}</p></div>
                          <div><div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>What drives it high</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{drives}</p></div>
                          <div><div style={{fontSize:10,fontWeight:700,color:C.red,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Low score means</div><p style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{low}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>)}

              {/* ── NEURAL SCIENCE ── */}
              {methTab==="neural"&&(<>
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.purple}>Brain Region Activation — What Each Region Means</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>Brain Encoder predicts activation levels across 8 brain regions based on visual stimuli present in the creative. These predictions are derived from established neuromarketing research mapping visual advertising stimuli to neural activation patterns.</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
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
                  <div style={{display:"grid",gap:10}}>
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
                    ].map(({platform,color,score,weights})=>(
                      <div key={platform} style={{background:C.s2,borderRadius:10,padding:18,borderLeft:`3px solid ${color}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.text}}>{platform}</span>
                          <span style={{fontSize:11,color:color,fontWeight:600}}>{score}</span>
                        </div>
                        <p style={{fontSize:12,color:C.dim,lineHeight:1.6}}>{weights}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>)}

              {/* ── SCIENCE ── */}
              {methTab==="science"&&(<>
                <Card C={C} style={{marginBottom:20}}>
                  <CardTitle C={C} label={C.purple}>Scientific Research Foundations</CardTitle>
                  <p style={{fontSize:14,color:C.dim,lineHeight:1.8,marginBottom:20}}>Brain Encoder's scoring methodology is grounded in published advertising effectiveness research and cognitive neuroscience. Below are the key frameworks and how each is operationalised in the platform.</p>
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
                  <CardTitle C={C} label={C.red}>What Brain Encoder Is — and Is Not</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                    <div style={{background:"rgba(34,212,114,0.06)",border:`1px solid ${C.green}33`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:12}}>Brain Encoder IS</div>
                      {["A predictive pre-screening tool for creative effectiveness","A directional intelligence system to prioritise re-edits","A platform suitability guide for media planning","A structured framework for creative briefing and feedback","A consistent benchmark across multiple creatives","A fast, scalable alternative to qualitative research for go/no-go decisions"].map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:C.dim}}>
                          <span style={{color:C.green,flexShrink:0}}>✓</span>{s}
                        </div>
                      ))}
                    </div>
                    <div style={{background:"rgba(240,90,106,0.06)",border:`1px solid ${C.red}33`,borderRadius:12,padding:20}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:12}}>Brain Encoder IS NOT</div>
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
                      ["🖼️",C.cyan,"Frame Sampling Limitation","Brain Encoder analyses 1–3 extracted frames per creative. For videos with rapid scene changes (cut every 1–2 seconds), frame sampling may miss important transitions. For maximum accuracy, upload key scenes as separate image files."],
                      ["🔇",C.purple,"Audio is Inferred","This version analyses visual frames only. Audio characteristics (music tempo, voiceover tone, sonic branding) are inferred from visual context cues, not measured directly from the audio track."],
                      ["🌍",C.teal,"Cultural Calibration is India-First","Scoring is calibrated for the Indian market by default. Cultural Resonance, Regulatory Compliance, and certain emotion scores may require recalibration for international markets. Always contextualise scores with local market knowledge."],
                      ["📊",C.orange,"No In-Market Performance Guarantee","Brain Encoder cannot account for media weight, audience targeting precision, competitive share of voice, seasonality, brand equity, or algorithmic distribution. Real-world performance may differ significantly from predicted scores."],
                      ["⚖️",C.red,"Not Legal Clearance","Regulatory and DPDP compliance scores are indicative signals only. Do not use Brain Encoder scores as a substitute for legal review of advertising claims, disclaimers, or data collection mechanisms."],
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
                  <CardTitle C={C} label={C.gold}>How to Use Brain Encoder Responsibly</CardTitle>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    {[
                      [C.cyan,"Use it for GO/NO-GO","Run Brain Encoder before any creative goes to production or media. A C+ or below should trigger a mandatory re-edit conversation with the creative team."],
                      [C.amber,"Use it for RE-EDIT BRIEFING","The Scene Intelligence and CMO Playbook tabs give the creative team specific, actionable re-edit instructions. Use them as a creative brief, not just a score."],
                      [C.green,"Use it for PLATFORM PLANNING","Platform scores tell you where to concentrate media spend and where to create platform-specific cuts. A TV-first creative should never run on TikTok without re-editing."],
                      [C.purple,"Combine with Human Judgement","Brain Encoder surfaces patterns and signals. The creative director, brand manager, and media planner must interpret these signals in the context of the campaign strategy."],
                      [C.pink,"Track Across Campaigns","The most powerful use of Brain Encoder is longitudinal — tracking how your brand's creative scores improve over time as teams learn what works."],
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
          <div style={{padding:"20px 36px",borderTop:`1px solid ${C.border}`,textAlign:"center",fontSize:10,color:C.muted,fontFamily:"'DM Mono',monospace",letterSpacing:1,marginTop:"auto"}}>
            ADVantage Insights™ · Brain Encoder Platform™ · Neural Creative Intelligence · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Helper: responsive font clamp
function clamp(base, vw, max){ return `clamp(${base}px, ${vw}vw, ${max}px)`; }
