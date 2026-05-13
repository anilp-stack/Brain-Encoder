import { useState, useRef, useCallback } from "react";

// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  bg:"#08080d",s1:"#0e0e18",s2:"#161624",s3:"#1e1e30",
  border:"#2a2a42",text:"#eaeaf4",dim:"#7a7a9e",muted:"#50506e",
  gold:"#d4a853",cyan:"#00c8ff",blue:"#3a7bd5",green:"#2ecc71",
  red:"#e74c3c",amber:"#f1c40f",orange:"#e67e22",purple:"#9b59b6",
  pink:"#e91e8a",teal:"#1abc9c",lime:"#a3e635",rose:"#f43f5e"
};
const hex=(v)=>v>=80?C.green:v>=60?C.amber:v>=40?C.orange:C.red;
const grade=(v)=>v>=90?"A+":v>=85?"A":v>=80?"A-":v>=75?"B+":v>=70?"B":v>=65?"B-":v>=60?"C+":v>=55?"C":v>=50?"C-":v>=40?"D":"F";

// ============================================================
// SHARED COMPONENTS
// ============================================================
function Card({children,style,...p}){return <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,padding:28,...style}} {...p}>{children}</div>}
function CardTitle({dot,children}){return <div style={{fontSize:16,fontWeight:700,marginBottom:20,display:"flex",alignItems:"center",gap:10}}>{dot&&<span style={{width:12,height:12,borderRadius:3,background:dot,display:"inline-block"}}/>}{children}</div>}

function ScoreCard({label,value,note,pct}){
  const c=hex(value);
  return(
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,padding:"22px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:c}}/>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:C.dim,textTransform:"uppercase",marginBottom:8,fontFamily:"'JetBrains Mono',monospace"}}>{label}</div>
      <div style={{fontSize:40,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:c,lineHeight:1}}>{value}</div>
      <div style={{fontSize:12,color:C.dim,marginTop:8,lineHeight:1.4}}>{note}</div>
      <div style={{height:5,borderRadius:3,background:C.s3,marginTop:14,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:3,background:c,width:`${pct||value}%`,transition:"width 1.5s"}}/>
      </div>
    </div>
  );
}

function BarMetric({label,value,color,maxW}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
      <div style={{width:maxW||140,fontSize:13,fontWeight:600,color:C.dim,textTransform:"capitalize",flexShrink:0}}>{label}</div>
      <div style={{flex:1,height:10,borderRadius:5,background:C.s3,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:5,background:color||hex(value),opacity:.75,width:`${value}%`,transition:"width 1s"}}/>
      </div>
      <div style={{width:44,fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:color||hex(value),textAlign:"right"}}>{value}</div>
    </div>
  );
}

function makePath(arr,x1,x2,yT,yB){
  const s=(x2-x1)/(arr.length-1);
  return arr.map((v,i)=>`${i===0?"M":"L"}${x1+i*s},${yB-((v/100)*(yB-yT))}`).join(" ");
}
function makeArea(arr,x1,x2,yT,yB){return makePath(arr,x1,x2,yT,yB)+` L${x2},${yB} L${x1},${yB} Z`}

// ============================================================
// FRAME EXTRACTION
// ============================================================
function extractFrames(file){
  if(file.type.startsWith("image/")){
    return new Promise(r=>{const rd=new FileReader();rd.onload=e=>r({frames:[e.target.result.split(",")[1]],duration:0,width:0,height:0,isImage:true});rd.readAsDataURL(file)});
  }
  return new Promise((resolve,reject)=>{
    const v=document.createElement("video");v.preload="auto";v.muted=true;v.src=URL.createObjectURL(file);
    v.onloadedmetadata=()=>{
      const dur=v.duration,canvas=document.createElement("canvas");
      canvas.width=640;canvas.height=360;const ctx=canvas.getContext("2d");
      const n=Math.min(8,Math.max(4,Math.ceil(dur/3)));
      const times=Array.from({length:n},(_,i)=>(dur/n)*i+0.3);
      const frames=[];let idx=0;
      const next=()=>{if(idx>=times.length){URL.revokeObjectURL(v.src);resolve({frames,duration:dur,width:v.videoWidth,height:v.videoHeight,isImage:false});return}v.currentTime=Math.min(times[idx],dur-0.1)};
      v.onseeked=()=>{ctx.drawImage(v,0,0,canvas.width,canvas.height);frames.push(canvas.toDataURL("image/jpeg",0.55).split(",")[1]);idx++;next()};
      v.onerror=()=>reject(new Error("Cannot read video"));next();
    };
  });
}

// ============================================================
// MAIN APP
// ============================================================
export default function App(){
  const [stage,setStage]=useState("landing"); // landing | form | analyzing | results
  const [form,setForm]=useState({brand:"",client:"",campaign:"",agency:"",type:"video",industry:"FMCG / CPG",audience:"",market:"India",notes:"",password:""});
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [progress,setProgress]=useState(0);
  const [progressMsg,setProgressMsg]=useState("");
  const [results,setResults]=useState(null);
  const [error,setError]=useState(null);
  const [tab,setTab]=useState("summary");
  const fileRef=useRef(null);

  const handleFile=(e)=>{const f=e.target.files[0];if(!f)return;setFile(f);if(f.type.startsWith("image/")){const r=new FileReader();r.onload=ev=>setPreview(ev.target.result);r.readAsDataURL(f)}else if(f.type.startsWith("video/"))setPreview(URL.createObjectURL(f))};
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const handleAnalyze=useCallback(async()=>{
    if(!file||!form.brand)return;
    setStage("analyzing");setProgress(0);setError(null);
    const msgs=["Reading creative file...","Extracting visual signals from frames...","Mapping predicted neural activation zones...","Scoring hook strength, hold rate, memory encoding...","Analyzing emotional architecture & valence curves...","Running platform-specific performance predictions...","Auditing regulatory compliance & privacy signals...","Building scene-level intelligence breakdown...","Generating strategic insights & CMO playbook...","Assembling final Brain Encoder report..."];
    try{
      setProgressMsg(msgs[0]);setProgress(5);
      const frameData=await extractFrames(file);
      for(let i=1;i<msgs.length;i++){setProgressMsg(msgs[i]);setProgress(10+Math.round((i/msgs.length)*80));await new Promise(r=>setTimeout(r,700))}
      // Call backend
      const resp=await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json",...(form.password?{Authorization:`Bearer ${form.password}`}:{})},
        body:JSON.stringify({frames:frameData.frames,metadata:{...form,...frameData}})
      });
      const data=await resp.json();
      if(!resp.ok||!data.success)throw new Error(data.error||"Analysis failed");
      setProgress(100);setProgressMsg("Report ready.");
      await new Promise(r=>setTimeout(r,400));
      setResults(data.analysis);setStage("results");setTab("summary");
    }catch(e){setError(e.message);setStage("form")}
  },[file,form]);

  // ============================================================
  // LANDING PAGE
  // ============================================================
  if(stage==="landing"){
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,textAlign:"center"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 50% 20%, rgba(0,200,255,0.06) 0%, transparent 60%)",pointerEvents:"none"}}/>
        <div style={{fontSize:13,fontWeight:700,letterSpacing:5,color:C.gold,textTransform:"uppercase",marginBottom:20,position:"relative"}}>ADVantage Insights</div>
        <h1 style={{fontSize:56,fontWeight:200,lineHeight:1.1,maxWidth:750,marginBottom:16,position:"relative"}}>
          Brain <span style={{fontWeight:800,background:`linear-gradient(135deg,${C.cyan},${C.blue})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Encoder</span> Platform
        </h1>
        <p style={{fontSize:18,color:C.dim,maxWidth:580,lineHeight:1.7,marginBottom:44,position:"relative"}}>
          Upload any video ad, display creative, or social content. Get a full neural creative analysis — 17 performance metrics, attention curves, emotional mapping, scene intelligence, platform scoring, and strategic recommendations.
        </p>
        <button onClick={()=>setStage("form")} style={{background:`linear-gradient(135deg,${C.cyan},${C.blue})`,color:"white",border:"none",padding:"18px 56px",borderRadius:12,fontSize:17,fontWeight:700,cursor:"pointer",letterSpacing:.5,position:"relative",boxShadow:"0 4px 24px rgba(0,200,255,0.3)"}}>
          Start Analysis →
        </button>
        <div style={{marginTop:56,display:"flex",gap:28,color:C.dim,fontSize:13,flexWrap:"wrap",justifyContent:"center",position:"relative"}}>
          {["🧠 17 Neural Metrics","📊 Attention & Emotion Curves","🎯 15 Platform Scores","🔬 Scene Intelligence","🛡️ Privacy & Compliance","📋 CMO Playbook"].map(t=>
            <span key={t} style={{padding:"8px 16px",background:C.s2,borderRadius:8,border:`1px solid ${C.border}`}}>{t}</span>
          )}
        </div>
        <div style={{position:"relative",marginTop:72,display:"flex",gap:48,color:C.muted,fontSize:12}}>
          <span>Beyond Higgsfield</span><span>·</span><span>No 15s Limit</span><span>·</span><span>Full Explainability</span><span>·</span><span>Platform-Specific</span>
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
                  <div style={{fontSize:13,color:C.dim,marginTop:6}}>MP4, MOV, AVI, WEBM, JPG, PNG — No duration limit</div>
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
    const attn=r.attention_curve||Array(20).fill(50);
    const emot=r.emotion_curve||Array(20).fill(40);
    const emotTypes=r.emotion_types_curve||{};
    const br=r.brain_regions||{};
    const cl=r.cognitive_channel_load||r.channel_load||{};
    const ps=r.platform_scores||{};
    const sc=r.scenes||[];
    const ins=r.insights||[];
    const cmo=r.cmo_actions||[];
    const snd=r.sound_analysis||{};
    const priv=r.privacy_and_data_audit||r.privacy||{};
    const comp=r.competitive_context||{};
    const s1s2=r.system1_vs_system2||60;

    const allTabs=[
      {id:"summary",label:"Executive Summary",icon:"📊"},
      {id:"neural",label:"Neural Map",icon:"🧠"},
      {id:"attention",label:"Attention Economics",icon:"👁"},
      {id:"emotion",label:"Emotional Architecture",icon:"❤️"},
      {id:"scenes",label:"Scene Intelligence",icon:"🎬"},
      {id:"platforms",label:"Platform Scores",icon:"📱"},
      {id:"sound",label:"Sound & Sensory",icon:"🔊"},
      {id:"privacy",label:"Privacy & Compliance",icon:"🛡️"},
      {id:"strategy",label:"Strategic Insights",icon:"💡"},
      {id:"cmo",label:"CMO Playbook",icon:"📋"}
    ];

    return(
      <div style={{minHeight:"100vh",background:C.bg}}>
        {/* HEADER */}
        <div style={{background:C.s1,padding:"32px 48px 24px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:4,color:C.gold,textTransform:"uppercase"}}>ADVantage Insights</span>
            <span style={{padding:"3px 12px",borderRadius:4,background:"rgba(0,200,255,0.1)",color:C.cyan,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>BRAIN ENCODER</span>
            {r.overall_grade&&<span style={{marginLeft:8,padding:"4px 14px",borderRadius:6,background:hex(r.overall_grade==="A+"||r.overall_grade==="A"?90:r.overall_grade?.startsWith("B")?70:50),color:C.bg,fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"}}>GRADE: {r.overall_grade}</span>}
          </div>
          <h1 style={{fontSize:32,fontWeight:200,lineHeight:1.2,marginBottom:6}}>
            {form.brand} — <span style={{fontWeight:700}}>{form.campaign||"Creative Analysis"}</span>
          </h1>
          {r.headline_verdict&&<p style={{fontSize:15,color:C.gold,fontWeight:500,marginBottom:8,maxWidth:800,lineHeight:1.5}}>"{r.headline_verdict}"</p>}
          <p style={{fontSize:13,color:C.dim,maxWidth:900,lineHeight:1.6}}>{r.creative_summary||""}</p>
          <div style={{marginTop:10,fontSize:12,color:C.muted,fontFamily:"'JetBrains Mono',monospace"}}>
            {form.client&&`Client: ${form.client} · `}{form.agency&&`Agency: ${form.agency} · `}Type: {form.type} · {form.industry} · {form.market} · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
          </div>
        </div>

        {/* TABS */}
        <div style={{background:C.s1,borderBottom:`1px solid ${C.border}`,padding:"0 48px",display:"flex",gap:0,position:"sticky",top:0,zIndex:100,overflowX:"auto"}}>
          {allTabs.map(t=>
            <div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"14px 18px",fontSize:13,fontWeight:600,color:tab===t.id?C.cyan:C.dim,borderBottom:`3px solid ${tab===t.id?C.cyan:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>{t.icon}</span>{t.label}
            </div>
          )}
          <div style={{marginLeft:"auto",padding:"12px 0"}}>
            <button onClick={()=>{setStage("form");setResults(null);setFile(null);setPreview(null)}} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.dim,fontSize:12,fontWeight:600,cursor:"pointer"}}>+ New</button>
          </div>
        </div>

        <div style={{padding:"36px 48px",maxWidth:1440,margin:"0 auto"}}>

          {/* ===== EXECUTIVE SUMMARY ===== */}
          {tab==="summary"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:36}}>
              {[
                ["Viral Potential",r.viral_potential],["Hook Strength",r.hook_strength],["Hold Rate",r.hold_rate],
                ["Emotional Peak",r.emotional_peak],["Brand Recall",r.brand_recall],["Memory Encoding",r.memory_encoding],
                ["Sound-Off Survival",r.sound_off_survival],["Share Intent",r.share_intent],["Creative Efficiency",r.creative_efficiency]
              ].map(([l,v])=>v!==undefined&&<ScoreCard key={l} label={l} value={v} note={r.score_notes?.[l.toLowerCase().replace(/ /g,"_")]||""} pct={v}/>)}
            </div>

            {/* ATTENTION + EMOTION CURVE */}
            <Card style={{marginBottom:24}}>
              <CardTitle dot={C.cyan}>Predicted Attention & Emotion Curves</CardTitle>
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

            {/* SECONDARY METRICS ROW */}
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

            {/* COMPETITIVE BENCHMARK */}
            {comp.benchmark_note&&<Card>
              <CardTitle dot={C.gold}>Competitive Benchmark</CardTitle>
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <span style={{fontSize:14,fontWeight:700,color:comp.position==="category_leader"?C.green:comp.position==="above_average"?C.cyan:comp.position==="average"?C.amber:C.red,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace"}}>{(comp.position||"").replace(/_/g," ")}</span>
                <span style={{fontSize:14,color:C.dim}}>{comp.benchmark_note}</span>
              </div>
            </Card>}
          </>)}

          {/* ===== NEURAL MAP ===== */}
          {tab==="neural"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
              <Card>
                <CardTitle dot={C.purple}>Brain Region Activation</CardTitle>
                {Object.entries(br).map(([k,v])=><BarMetric key={k} label={k.replace(/_/g," ")} value={v}/>)}
              </Card>
              <Card>
                <CardTitle dot={C.teal}>Cognitive Channel Load</CardTitle>
                {Object.entries(cl).map(([k,v])=><BarMetric key={k} label={k.replace(/_/g," ")} value={v} color={C.purple}/>)}
              </Card>
            </div>
            {/* System 1 vs System 2 gauge */}
            <Card>
              <CardTitle dot={C.orange}>System 1 vs System 2 Processing Balance</CardTitle>
              <div style={{display:"flex",alignItems:"center",gap:20}}>
                <span style={{fontSize:13,fontWeight:700,color:C.cyan}}>SYSTEM 2<br/><span style={{fontWeight:400,fontSize:11,color:C.dim}}>Rational</span></span>
                <div style={{flex:1,height:16,borderRadius:8,background:C.s3,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${s1s2}%`,borderRadius:8,background:`linear-gradient(90deg,${C.blue},${C.orange})`}}/>
                  <div style={{position:"absolute",left:`${s1s2}%`,top:-4,width:3,height:24,background:C.text,borderRadius:2,transform:"translateX(-50%)"}}/>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:C.orange}}>SYSTEM 1<br/><span style={{fontWeight:400,fontSize:11,color:C.dim}}>Emotional</span></span>
              </div>
              <div style={{textAlign:"center",marginTop:12,fontSize:13,color:C.dim}}>Score: {s1s2}/100 — {s1s2>=65&&s1s2<=75?"Optimal zone (65-75)":s1s2>75?"Over-indexing on emotion — add rational proof points":"Over-indexing on rational — add emotional triggers"}</div>
            </Card>
          </>)}

          {/* ===== ATTENTION ECONOMICS ===== */}
          {tab==="attention"&&(<>
            <Card style={{marginBottom:24}}>
              <CardTitle dot={C.amber}>Second-by-Second Attention Heatmap</CardTitle>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${attn.length},1fr)`,gap:4}}>
                {attn.map((v,i)=>
                  <div key={i} title={`${i}s — ${v}%`} style={{height:56,borderRadius:6,cursor:"pointer",background:hex(v),opacity:Math.max(.3,v/100),transition:"transform .15s"}} onMouseEnter={e=>e.target.style.transform="scaleY(1.3)"} onMouseLeave={e=>e.target.style.transform="scaleY(1)"}/>
                )}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:C.dim,fontFamily:"'JetBrains Mono',monospace"}}>
                <span>0s</span><span>{Math.round(attn.length*.25)}s</span><span>{Math.round(attn.length*.5)}s</span><span>{Math.round(attn.length*.75)}s</span><span>{attn.length}s</span>
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <CardTitle dot={C.green}>Attention Stats</CardTitle>
                <div style={{fontSize:14,color:C.dim,lineHeight:1.8}}>
                  <p>Peak Attention: <b style={{color:C.green}}>{Math.max(...attn)}%</b> at ~{attn.indexOf(Math.max(...attn))}s</p>
                  <p>Lowest Point: <b style={{color:C.red}}>{Math.min(...attn)}%</b> at ~{attn.indexOf(Math.min(...attn))}s</p>
                  <p>Average Attention: <b style={{color:C.cyan}}>{Math.round(attn.reduce((a,b)=>a+b,0)/attn.length)}%</b></p>
                  <p>Drop Zones: <b style={{color:C.amber}}>{attn.filter((v,i)=>i>0&&v<attn[i-1]-10).length}</b> significant drops detected</p>
                </div>
              </Card>
              <Card>
                <CardTitle dot={C.red}>Predicted View-Through Rate</CardTitle>
                {[25,50,75,100].map(pct=>{
                  const idx=Math.round((pct/100)*(attn.length-1));
                  const v=attn[idx]||0;
                  return <div key={pct} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    <span style={{width:60,fontSize:13,color:C.dim,fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span>
                    <div style={{flex:1,height:8,borderRadius:4,background:C.s3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:hex(v),width:`${v}%`}}/></div>
                    <span style={{width:40,fontSize:13,fontWeight:700,color:hex(v),fontFamily:"'JetBrains Mono',monospace"}}>{v}%</span>
                  </div>
                })}
              </Card>
            </div>
          </>)}

          {/* ===== EMOTIONAL ARCHITECTURE ===== */}
          {tab==="emotion"&&(<>
            <Card style={{marginBottom:24}}>
              <CardTitle dot={C.pink}>Emotion Types Over Time</CardTitle>
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
                    </g>
                  })}
                </g>
              </svg>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <CardTitle dot={C.rose}>Dominant Emotion by Section</CardTitle>
                {Object.entries(emotTypes).map(([k,arr])=>{
                  if(!arr)return null;
                  const avg=Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
                  return <BarMetric key={k} label={k} value={avg} color={C.pink}/>;
                })}
              </Card>
              <Card>
                <CardTitle dot={C.orange}>Emotional Peak Analysis</CardTitle>
                <p style={{fontSize:14,color:C.dim,lineHeight:1.8}}>
                  Emotional Peak Score: <b style={{color:C.blue}}>{r.emotional_peak}/100</b><br/>
                  The emotional arc {r.emotional_peak>=70?"has strong peaks that correlate with shareability":"needs stronger emotional triggers to drive organic sharing"}.<br/>
                  Share Intent Score: <b style={{color:C.purple}}>{r.share_intent}/100</b>
                </p>
              </Card>
            </div>
          </>)}

          {/* ===== SCENE INTELLIGENCE ===== */}
          {tab==="scenes"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              {sc.map((s,i)=>
                <Card key={i} style={{position:"relative",overflow:"hidden"}}>
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
          )}

          {/* ===== PLATFORM SCORES ===== */}
          {tab==="platforms"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16}}>
              {Object.entries(ps).map(([k,v])=>
                <Card key={k} style={{textAlign:"center",padding:24}}>
                  <div style={{fontSize:38,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(v),lineHeight:1}}>{v}</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:10,textTransform:"capitalize",lineHeight:1.3}}>{k.replace(/_/g," ")}</div>
                  <div style={{marginTop:10,fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:hex(v)}}>{grade(v)}</div>
                </Card>
              )}
            </div>
          )}

          {/* ===== SOUND & SENSORY ===== */}
          {tab==="sound"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <CardTitle dot={C.purple}>Sound Analysis Metrics</CardTitle>
                {[["Sound Dependency",snd.sound_dependency],["Music Effectiveness",snd.music_effectiveness],["Voiceover Clarity",snd.voiceover_clarity],["Sound-Off Text Quality",snd.sound_off_text_quality],["ASMR Trigger",snd.asmr_trigger],["Sonic Branding",snd.sonic_branding]].filter(([,v])=>v!==undefined).map(([l,v])=>
                  <BarMetric key={l} label={l} value={v} maxW={180}/>
                )}
              </Card>
              <Card>
                <CardTitle dot={C.orange}>Sound Strategy Assessment</CardTitle>
                <p style={{fontSize:15,color:C.dim,lineHeight:1.8}}>{snd.sound_note||"Sound analysis data not available for this creative type."}</p>
                <div style={{marginTop:16,padding:16,borderRadius:10,background:C.s3}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:6}}>Sound-Off Survival Score</div>
                  <div style={{fontSize:36,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:hex(r.sound_off_survival||0)}}>{r.sound_off_survival||"N/A"}</div>
                </div>
              </Card>
            </div>
          )}

          {/* ===== PRIVACY & COMPLIANCE ===== */}
          {tab==="privacy"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card>
                <CardTitle dot={C.amber}>Privacy & Data Audit</CardTitle>
                <div style={{fontSize:14,color:C.dim,lineHeight:2}}>
                  {[["Data Collection Present",priv.data_collection_present],["Consent Mechanism Visible",priv.consent_mechanism_visible],["QR Code Present",priv.qr_code_present],["URL / CTA Present",priv.url_cta_present],["Hashtag Present",priv.hashtag_present],["Regulatory Disclaimers Visible",priv.regulatory_disclaimers_visible]].map(([l,v])=>
                    <div key={l} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,paddingBottom:4}}>
                      <span>{l}</span>
                      <span style={{fontWeight:700,color:v?C.green:C.red}}>{v===true?"✓ Yes":v===false?"✗ No":"—"}</span>
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <CardTitle dot={C.red}>Compliance Risk</CardTitle>
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
          )}

          {/* ===== STRATEGIC INSIGHTS ===== */}
          {tab==="strategy"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {ins.map((n,i)=>{
                const vc=n.vtype==="risk"?{bg:"rgba(231,76,60,0.1)",bd:C.red,c:"#ff7b7b"}:n.vtype==="win"?{bg:"rgba(46,204,113,0.1)",bd:C.green,c:"#6dffaa"}:n.vtype==="tip"?{bg:"rgba(0,200,255,0.1)",bd:C.cyan,c:C.cyan}:{bg:"rgba(241,196,0,0.1)",bd:C.amber,c:C.amber};
                return(
                  <Card key={i}>
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
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.07)`,borderRadius:12,padding:24}}>
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
        </div>

        {/* FOOTER */}
        <div style={{padding:"24px 48px",borderTop:`1px solid ${C.border}`,textAlign:"center",fontSize:11,color:C.muted,fontFamily:"'JetBrains Mono',monospace",marginTop:32}}>
          ADVantage Insights · Brain Encoder Platform · AI-Powered Creative Intelligence · {new Date().getFullYear()}
        </div>
      </div>
    );
  }
  return null;
}
