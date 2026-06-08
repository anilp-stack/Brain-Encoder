export const config = { maxDuration: 300 };

async function fetchCategoryBenchmarks(industry, creativeType, supabaseUrl, supabaseAnonKey) {
  try {
    const query = new URLSearchParams({
      select: "viral_potential,hook_strength,hold_rate,emotional_peak,brand_recall,memory_encoding,sound_off_survival,share_intent,creative_efficiency,cultural_resonance",
      industry: `eq.${industry}`,
      creative_type: `eq.${creativeType}`,
      limit: "500"
    });
    const resp = await fetch(`${supabaseUrl}/rest/v1/analyses?${query.toString()}`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }
    });
    const rows = await resp.json();
    if (!resp.ok || !Array.isArray(rows) || rows.length < 10) return null;
    const avg = (f) => {
      const vals = rows.map(r => r[f]).filter(v => v !== null && !isNaN(v));
      return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
    };
    return {
      n: rows.length,
      viral_potential: avg("viral_potential"), hook_strength: avg("hook_strength"),
      hold_rate: avg("hold_rate"), emotional_peak: avg("emotional_peak"),
      brand_recall: avg("brand_recall"), memory_encoding: avg("memory_encoding"),
      sound_off_survival: avg("sound_off_survival"), share_intent: avg("share_intent"),
      creative_efficiency: avg("creative_efficiency"), cultural_resonance: avg("cultural_resonance")
    };
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "No API key" });

  try {
    const body = req.body || {};
    const { frames, metadata: meta = {} } = body;
    if (!frames?.length) return res.status(400).json({ error: "No frames" });

    const usedFrames = (meta.isImage ? frames.slice(0, 1) : frames.slice(0, 2));
    const imageContent = usedFrames.map(f => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f } }));

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const realBenchmarks = (SUPABASE_URL && SUPABASE_ANON_KEY)
      ? await fetchCategoryBenchmarks(meta.industry || "", meta.type || "video", SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;

    const benchmarkSection = realBenchmarks
      ? `\nREAL BENCHMARK DATA — USE THESE EXACT NUMBERS in competitive_context (from ${realBenchmarks.n} AdCritIQ analyses, same category/format):
viral_potential avg: ${realBenchmarks.viral_potential} | hook_strength avg: ${realBenchmarks.hook_strength} | hold_rate avg: ${realBenchmarks.hold_rate} | emotional_peak avg: ${realBenchmarks.emotional_peak} | brand_recall avg: ${realBenchmarks.brand_recall} | memory_encoding avg: ${realBenchmarks.memory_encoding} | sound_off_survival avg: ${realBenchmarks.sound_off_survival} | share_intent avg: ${realBenchmarks.share_intent} | creative_efficiency avg: ${realBenchmarks.creative_efficiency} | cultural_resonance avg: ${realBenchmarks.cultural_resonance}
In competitive_context, set benchmark_source to "AdCritIQ database (${realBenchmarks.n} analyses)" and use the above exact values as category averages.\n`
      : "";

    const prompt = `You are ADVantage Insights AdCritIQ. Analyze these ad frames.
Brand: ${meta.brand || "Unknown"} | Industry: ${meta.industry || "FMCG"} | Market: ${meta.market || "India"} | Country: ${meta.country || "India"} | Type: ${meta.type || "video"} | Campaign: ${meta.campaign || ""}
${benchmarkSection}

CRITICAL: Return ONLY this exact JSON with integer scores 0-100. No text outside JSON. You MUST generate: 5 scenes covering the full ad chronologically with specific visual descriptions, 5 strategic_insights each referencing specific metric scores, and 5 cmo_actions sorted P1 to P3 with concrete expected outcomes.

{"headline_verdict":"One powerful CMO-ready sentence","overall_grade":"A+|A|A-|B+|B|B-|C+|C|C-|D|F","grade_note":"One line","creative_summary":"3-4 sentence summary","viral_potential":INT,"hook_strength":INT,"hold_rate":INT,"emotional_peak":INT,"brand_recall":INT,"memory_encoding":INT,"sound_off_survival":INT,"share_intent":INT,"creative_efficiency":INT,"ad_fatigue_risk":INT,"cultural_resonance":INT,"celebrity_talent_index":INT,"brand_safety":INT,"regulatory_compliance":INT,"first_party_data_opportunity":INT,"carbon_signal":INT,"system1_vs_system2":INT,"attention_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_types":{"joy":[INT,INT,INT,INT,INT],"surprise":[INT,INT,INT,INT,INT],"trust":[INT,INT,INT,INT,INT],"fear":[INT,INT,INT,INT,INT],"desire":[INT,INT,INT,INT,INT],"curiosity":[INT,INT,INT,INT,INT]},"brain_regions":{"visual_cortex":INT,"prefrontal_cortex":INT,"amygdala":INT,"hippocampus":INT,"auditory_cortex":INT,"mirror_neurons":INT,"nucleus_accumbens":INT,"anterior_cingulate":INT},"cognitive_channels":{"visual":INT,"auditory":INT,"motion":INT,"text_overlay":INT,"brand_elements":INT,"human_faces":INT,"color_saturation":INT},"platform_scores":{"youtube_preroll_6s":INT,"youtube_preroll_15s":INT,"youtube_instream":INT,"instagram_reels":INT,"instagram_stories":INT,"instagram_feed":INT,"meta_feed":INT,"meta_stories":INT,"tiktok":INT,"linkedin_feed":INT,"twitter_x":INT,"tv_broadcast":INT,"ctv_ott":INT,"dooh":INT,"programmatic_display":INT},"competitive_context":{"category_avg_viral":INT,"category_avg_hook":INT,"category_avg_hold":INT,"category_avg_recall":INT,"position":"above_average|average|below_average|category_leader","benchmark_note":"One sentence"},"sound_analysis":{"sound_dependency":INT,"music_effectiveness":INT,"voiceover_clarity":INT,"sound_off_text_quality":INT,"asmr_trigger":INT,"sonic_branding":INT,"sound_note":"2-3 sentences"},"privacy_and_data_audit":{"data_collection_present":false,"consent_mechanism_visible":false,"qr_code_present":false,"url_cta_present":false,"hashtag_present":false,"regulatory_disclaimers_visible":false,"dpdp_compliance_risk":"low|medium|high","privacy_note":"2-3 sentences"},"scenes":[{"ts":"0:00-0:05","name":"Scene Name","desc":"1-2 sentence description of what happens visually and why it matters neurologically","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention","drop_second":INT|null,"badges":["memorable"]},{"ts":"0:05-0:10","name":"Scene Name 2","desc":"1-2 sentence description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention","drop_second":INT|null,"badges":["brand_moment"]},{"ts":"0:10-0:20","name":"Scene Name 3","desc":"1-2 sentence description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention","drop_second":INT|null,"badges":["peak_emotion"]},{"ts":"0:20-0:28","name":"Scene Name 4","desc":"1-2 sentence description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention","drop_second":INT|null,"badges":["cta_moment"]},{"ts":"0:28-0:35","name":"Scene Name 5","desc":"1-2 sentence description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention","drop_second":INT|null,"badges":["brand_recall"]}],"strategic_insights":[{"num":1,"title":"Insight Title","body":"2-3 sentence insight referencing specific metric scores and what they mean for the brand","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"},{"num":2,"title":"Insight Title 2","body":"2-3 sentence insight with actionable context","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"},{"num":3,"title":"Insight Title 3","body":"2-3 sentence insight","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"},{"num":4,"title":"Insight Title 4","body":"2-3 sentence insight","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"},{"num":5,"title":"Insight Title 5","body":"2-3 sentence insight","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"}],"cmo_actions":[{"num":1,"title":"Action Title","body":"2-3 sentence specific recommendation with expected metric improvement and timeline","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT},{"num":2,"title":"Action Title 2","body":"2-3 sentence recommendation","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT},{"num":3,"title":"Action Title 3","body":"2-3 sentence recommendation","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT},{"num":4,"title":"Action Title 4","body":"2-3 sentence recommendation","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT},{"num":5,"title":"Action Title 5","body":"2-3 sentence recommendation","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT}]}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: prompt,
        messages: [{ role: "user", content: [...imageContent, { type: "text", text: `Score this ${meta.brand || "creative"} ad. Return ONLY JSON.` }] }]
      })
    });
    if (!resp.ok) {
      const t = await resp.text();
      return res.status(resp.status).json({ error: `API ${resp.status}: ${t.substring(0, 150)}` });
    }
    const data = await resp.json();
    const text = (data.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(text); } catch { return res.status(500).json({ error: "JSON parse failed", raw: text.substring(0, 200) }); }
    return res.status(200).json({ success: true, analysis: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
