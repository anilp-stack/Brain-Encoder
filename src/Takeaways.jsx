const CC={cyan:"#00d4ff",blue:"#3b82f6",purple:"#a855f7",pink:"#ec4899",green:"#2ecc71",amber:"#f59e0b",orange:"#f97316",red:"#ef4444",gold:"#d4a017",teal:"#14b8a6",text:"#e2e8f0",dim:"#94a3b8",s1:"#1a1e2e",s2:"#151928",border:"#2a2f45"};

function Takeaway({icon,title,items,color}){
  var c=color||CC.cyan;
  if(!items||items.length===0)return null;
  return(
    <div style={{background:CC.s1,border:"1px solid "+c+"33",borderRadius:14,padding:28,marginTop:24,borderLeft:"4px solid "+c}}>
      <div style={{fontSize:15,fontWeight:700,color:c,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{icon||"💡"}</span>{title||"Key Takeaway"}
      </div>
      {items.map(function(item,i){return(
        <div key={i} style={{display:"flex",gap:12,marginBottom:i<items.length-1?12:0,alignItems:"flex-start"}}>
          <span style={{color:c,fontWeight:800,fontSize:14,marginTop:2,flexShrink:0}}>{item.type==="do"?"✅":item.type==="fix"?"🔧":item.type==="warn"?"⚠️":item.type==="win"?"🏆":"→"}</span>
          <span style={{fontSize:14,color:CC.dim,lineHeight:1.7}}><b style={{color:CC.text}}>{item.label}</b> {item.text}</span>
        </div>
      )})}
    </div>
  );
}

function getTakeaways(r){
  var t={};
  t.summary=[];
  if((r.viral_potential||0)>=70)t.summary.push({type:"win",label:"Strong viral potential.",text:"Prioritize for social-first distribution."});
  else t.summary.push({type:"fix",label:"Viral potential below 70.",text:"Add a pattern interrupt, emotional spike, or relatable hook."});
  if((r.hold_rate||0)<60)t.summary.push({type:"warn",label:"Hold rate is critical.",text:(100-(r.hold_rate||0))+"% of viewers drop off before the end. Re-edit to compress the weakest section."});
  if((r.sound_off_survival||0)<60)t.summary.push({type:"fix",label:"Sound-off survival is low.",text:"Add bold kinetic text overlays. 80%+ of social consumption is sound-off."});
  if((r.brand_recall||0)>=80)t.summary.push({type:"win",label:"Excellent brand recall.",text:"Distinctive brand assets are well-placed."});
  else t.summary.push({type:"fix",label:"Brand recall needs work.",text:"Increase logo visibility, add product shot earlier, strengthen distinctive brand assets."});
  if((r.memory_encoding||0)<65)t.summary.push({type:"warn",label:"Risk of watched but forgotten.",text:"High attention but low memory encoding. Add an emotional anchor moment."});
  t.neural=[];
  var br=r.brain_regions||{};
  if((br.amygdala||0)<50)t.neural.push({type:"fix",label:"Amygdala activation is low.",text:"Not triggering emotional processing. Add surprise, humor, tension, or vulnerability."});
  else t.neural.push({type:"win",label:"Strong emotional activation.",text:"Amygdala engaged. Prerequisite for memory encoding and sharing."});
  if((br.prefrontal_cortex||0)>70&&(br.amygdala||0)<60)t.neural.push({type:"warn",label:"Over-indexing on rational processing.",text:"Viewer is thinking, not feeling. Lead with emotion."});
  if((br.mirror_neurons||0)>=65)t.neural.push({type:"win",label:"Mirror neurons active.",text:"Viewers empathizing with on-screen characters. Drives share intent."});
  else t.neural.push({type:"fix",label:"Low mirror neuron activation.",text:"Add close-up facial expressions, human interaction, or relatable body language."});
  var s1s2=r.system1_vs_system2||50;
  if(s1s2>=65&&s1s2<=75)t.neural.push({type:"win",label:"System 1/2 balance is optimal.",text:"Leads with emotion, layers in rational messaging."});
  else if(s1s2<65)t.neural.push({type:"fix",label:"Over-indexing on System 2.",text:"Reduce claim density. Lead with feeling, not fact."});
  else t.neural.push({type:"warn",label:"Over-indexing on System 1.",text:"Add one clear product claim or benefit statement."});
  t.attention=[];
  var attn=r.attention_curve||[];
  if(attn.length>0){var peak=Math.max.apply(null,attn);var low=Math.min.apply(null,attn);var peakIdx=attn.indexOf(peak);var lowIdx=attn.indexOf(low);t.attention.push({type:"do",label:"Peak attention at ~"+peakIdx+"s ("+peak+"%).",text:"Use as thumbnail or hero image for static placements."});if(low<50)t.attention.push({type:"warn",label:"Attention drops to "+low+"% at ~"+lowIdx+"s.",text:"Your drop zone. Cut, add visual interrupt, or compress by 50%."});var avg=Math.round(attn.reduce(function(a,b){return a+b},0)/attn.length);t.attention.push({type:avg>=65?"win":"warn",label:"Average attention: "+avg+"%.",text:avg>=65?"Above 60% threshold for effective recall.":"Below 60%. Consider a shorter cut."});}
  else{t.attention.push({type:"do",label:"Review the attention heatmap above.",text:"Green = strong. Yellow/red = needs visual interrupts or faster pacing."});}
  t.emotion=[];
  if((r.emotional_peak||0)>=70)t.emotion.push({type:"win",label:"Strong emotional peak ("+r.emotional_peak+").",text:"Triggers genuine emotion. Strongest predictor of sharing and recall."});
  else t.emotion.push({type:"fix",label:"Emotional peak is moderate ("+r.emotional_peak+").",text:"Add surprise, joy, tension, or vulnerability."});
  if((r.share_intent||0)>=65)t.emotion.push({type:"win",label:"High share intent.",text:"Optimize for easy sharing: hashtags, under 30s, self-explanatory first frame."});
  else t.emotion.push({type:"fix",label:"Share intent below 65.",text:"Add: identity signaling, social currency, emotional contagion, or utility."});
  t.scenes=[];
  t.scenes.push({type:"do",label:"Use scene-level data for re-edits.",text:"Keep scenes above 70. Cut or rework scenes below 50."});
  t.scenes.push({type:"do",label:"Check System mode transitions.",text:"Frequent System 1 to System 2 shifts cause cognitive fatigue."});
  t.scenes.push({type:"do",label:"Prioritize drop zone flags.",text:"Any drop zone scene is where viewers leave. Your #1 re-edit priority."});
  t.platforms=[];
  var ps=r.platform_scores||{};var best="";var bestV=0;var worst="";var worstV=100;
  for(var k in ps){if(ps[k]>bestV){bestV=ps[k];best=k;}if(ps[k]<worstV){worstV=ps[k];worst=k;}}
  if(best)t.platforms.push({type:"win",label:"Best: "+best.replace(/_/g," ")+" ("+bestV+").",text:"Prioritize media spend here."});
  if(worst)t.platforms.push({type:"warn",label:"Weakest: "+worst.replace(/_/g," ")+" ("+worstV+").",text:"Do not run here without a format-specific re-edit."});
  t.sound=[];
  var snd=r.sound_analysis||{};
  if((snd.sound_dependency||0)>70)t.sound.push({type:"warn",label:"High sound dependency.",text:"Relies on audio. On social (80%+ sound-off), will underperform. Create a kinetic text variant."});
  else t.sound.push({type:"win",label:"Low sound dependency.",text:"Works without audio. Ready for sound-off environments."});
  if((r.sound_off_survival||0)<50)t.sound.push({type:"fix",label:"Sound-off survival critical.",text:"Add bold text overlays, high-contrast subtitles, make visual story self-explanatory."});
  t.privacy=[];
  var priv=r.privacy_and_data_audit||{};
  if(!priv.url_cta_present&&!priv.qr_code_present&&!priv.hashtag_present)t.privacy.push({type:"fix",label:"No digital conversion path.",text:"No QR, URL, or hashtag. Interested viewers have zero next step. Add a search CTA."});
  if(priv.dpdp_compliance_risk==="high")t.privacy.push({type:"warn",label:"High DPDP compliance risk.",text:"Data collection without visible consent. Review with legal."});
  else t.privacy.push({type:"win",label:"DPDP compliance: "+(priv.dpdp_compliance_risk||"low")+".",text:"No major regulatory flags."});
  if(!priv.regulatory_disclaimers_visible)t.privacy.push({type:"fix",label:"No disclaimers visible.",text:"If making health/financial/comparative claims, add visible disclaimers."});
  return t;
}

export function TabTakeaway({tab,r}){
  if(!r)return null;
  var t=getTakeaways(r);
  if(tab==="summary")return <Takeaway icon="📋" title="What This Means for You" color={CC.gold} items={t.summary}/>;
  if(tab==="neural")return <Takeaway icon="🧠" title="Neural Map — What to Do" color={CC.purple} items={t.neural}/>;
  if(tab==="attention")return <Takeaway icon="👁" title="Attention Economics — Actions" color={CC.amber} items={t.attention}/>;
  if(tab==="emotion")return <Takeaway icon="❤️" title="Emotional Architecture — Actions" color={CC.pink} items={t.emotion}/>;
  if(tab==="scenes")return <Takeaway icon="🎬" title="Scene Intelligence — How to Use This" color={CC.teal} items={t.scenes}/>;
  if(tab==="platforms")return <Takeaway icon="📱" title="Platform Strategy — Where to Run This" color={CC.blue} items={t.platforms}/>;
  if(tab==="sound")return <Takeaway icon="🔊" title="Sound Strategy — Actions" color={CC.purple} items={t.sound}/>;
  if(tab==="privacy")return <Takeaway icon="🛡️" title="Privacy & Compliance — Actions" color={CC.amber} items={t.privacy}/>;
  return null;
}
