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

async function hashCalibrationToken(token) {
  const clean = String(token || "").trim();
  if (!clean) return null;
  const { createHash } = await import("crypto");
  return createHash("sha256").update(clean).digest("hex");
}

async function fetchOutcomeCalibrationMemory(meta, creativeFormat, supabaseUrl, supabaseAnonKey) {
  try {
    const ownerHash = await hashCalibrationToken(meta.token);
    if (!ownerHash) return "";

    const fetchRows = async (filters) => {
      const query = new URLSearchParams();
      query.set("select", "brand,industry,creative_type,platform,calibration_result");
      query.set("owner_token_hash", `eq.${ownerHash}`);
      query.set("limit", "100");
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, `eq.${value}`);
      });
      const resp = await fetch(`${supabaseUrl}/rest/v1/outcome_calibrations?${query.toString()}`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json"
        }
      });
      const rows = await resp.json();
      return resp.ok && Array.isArray(rows) ? rows : [];
    };

    const summarizeRows = (rows, minRows, label) => {
      const byPlatform = rows.reduce((acc, row) => {
        const platform = row.platform || "unknown";
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(row);
        return acc;
      }, {});
      return Object.entries(byPlatform)
        .filter(([, platformRows]) => platformRows.length >= minRows)
        .map(([platform, platformRows]) => {
          const comparable = platformRows
            .map(row => row.calibration_result || {})
            .filter(result => typeof result.weighted_accuracy === "number");
          if (!comparable.length) return null;
          const avgAccuracy = Math.round(comparable.reduce((sum, result) => sum + result.weighted_accuracy, 0) / comparable.length);
          const avgBias = Math.round(comparable.reduce((sum, result) => sum + (result.weighted_bias || 0), 0) / comparable.length);
          const biasLabel = avgBias > 10 ? "historically overestimated" : avgBias < -10 ? "historically underestimated" : "historically well calibrated";
          return `${label} ${platform}: ${platformRows.length} calibrated campaign(s), ${avgAccuracy}% avg forecast accuracy, ${biasLabel} by ${Math.abs(avgBias)} points.`;
        })
        .filter(Boolean);
    };

    const brandRows = await fetchRows({ brand: meta.brand || "" });
    const brandMemory = summarizeRows(brandRows, 3, "Brand-specific calibration");
    if (brandMemory.length) {
      return `\nOUTCOME CALIBRATION MEMORY — PRIVATE TO THIS ACCESS TOKEN:\n${brandMemory.join("\n")}\nUse these actual-vs-predicted learnings to calibrate outcome_forecast and platform_outcome_forecast directionally. Do not mention private campaign data or exact historic results in user-facing text.\n`;
    }

    const categoryRows = await fetchRows({
      industry: meta.industry || "",
      creative_type: creativeFormat || meta.creative_format || meta.type || ""
    });
    const categoryMemory = summarizeRows(categoryRows, 5, "Category-format calibration");
    if (categoryMemory.length) {
      return `\nOUTCOME CALIBRATION MEMORY — PRIVATE CATEGORY LEARNING FOR THIS ACCESS TOKEN:\n${categoryMemory.join("\n")}\nUse these actual-vs-predicted learnings to calibrate outcome_forecast and platform_outcome_forecast directionally. Do not mention private campaign data or exact historic results in user-facing text.\n`;
    }
  } catch {}
  return "";
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
    const { frames = [], metadata: meta = {} } = body;
    const creativeFormat = meta.creative_format || (meta.isImage ? "static_image" : "video");
    const productionStage = meta.production_stage || "final";
    const scriptText = meta.script_text || meta.script || meta.notes || "";
    if (!frames?.length && !["text", "audio"].includes(creativeFormat) && productionStage !== "concept") return res.status(400).json({ error: "No frames" });
    if (["text", "audio"].includes(creativeFormat) && !scriptText.trim()) return res.status(400).json({ error: "No script or transcript supplied" });

    const usedFrames = productionStage === "storyboard" ? frames.slice(0, 12) : (meta.isImage ? frames.slice(0, 1) : frames.slice(0, 2));
    const imageContent = usedFrames.map(f => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f } }));

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const realBenchmarks = (SUPABASE_URL && SUPABASE_ANON_KEY)
      ? await fetchCategoryBenchmarks(meta.industry || "", meta.type || "video", SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    const calibrationMemory = (SUPABASE_URL && SUPABASE_ANON_KEY)
      ? await fetchOutcomeCalibrationMemory(meta, creativeFormat, SUPABASE_URL, SUPABASE_ANON_KEY)
      : "";

    const benchmarkSection = realBenchmarks
      ? `\nREAL BENCHMARK DATA — USE THESE EXACT NUMBERS in competitive_context (from ${realBenchmarks.n} AdCritIQ analyses, same category/format):
viral_potential avg: ${realBenchmarks.viral_potential} | hook_strength avg: ${realBenchmarks.hook_strength} | hold_rate avg: ${realBenchmarks.hold_rate} | emotional_peak avg: ${realBenchmarks.emotional_peak} | brand_recall avg: ${realBenchmarks.brand_recall} | memory_encoding avg: ${realBenchmarks.memory_encoding} | sound_off_survival avg: ${realBenchmarks.sound_off_survival} | share_intent avg: ${realBenchmarks.share_intent} | creative_efficiency avg: ${realBenchmarks.creative_efficiency} | cultural_resonance avg: ${realBenchmarks.cultural_resonance}
In competitive_context, set benchmark_source to "AdCritIQ database (${realBenchmarks.n} analyses)" and use the above exact values as category averages.\n`
      : "";

    const formatInstructions = {
      video: "FORMAT: VIDEO. Evaluate hook strength, pacing, retention, scene sequence, attention curve, sound-off survival, completion-rate improvement, platform fit, and drop-off risks.",
      static_image: "FORMAT: STATIC IMAGE. Evaluate stopping power, visual hierarchy, brand prominence, message clarity, CTA clarity, scan path, clutter risk, attention/recall lift, and static placement fit. Do NOT use completion-rate language.",
      motion_static: "FORMAT: ANIMATED/GIF/MOTION STATIC. Evaluate first-frame strength, loop clarity, motion salience, message persistence, loop fatigue, attention retention, and completion-rate improvement only when motion duration is meaningful.",
      audio: "FORMAT: AUDIO SCRIPT. Evaluate sonic branding, voice clarity, mnemonic strength, emotional tonality, CTA recall, script fluency, recall/response lift, and compliance risk from transcript/script. Do NOT claim raw audio was measured.",
      text: "FORMAT: TEXT/SCRIPT. Evaluate headline strength, proposition clarity, persuasion, memorability, CTA strength, readability, claim risk, clarity/conversion lift, and channel fit. Do NOT invent visual or completion-rate observations."
    }[creativeFormat] || "FORMAT: VIDEO. Evaluate as a video creative.";

    const formatSpecificSchema = creativeFormat === "static_image"
      ? `"format_metrics":{"visual_hierarchy":INT,"stopping_power":INT,"message_clarity":INT,"brand_prominence":INT,"cta_clarity":INT,"scan_path":INT,"clutter_risk":INT}`
      : creativeFormat === "motion_static"
        ? `"format_metrics":{"first_frame_strength":INT,"loop_clarity":INT,"motion_salience":INT,"message_persistence":INT,"loop_fatigue":INT}`
        : creativeFormat === "audio"
          ? `"format_metrics":{"sonic_branding":INT,"voice_clarity":INT,"mnemonic_strength":INT,"emotional_tonality":INT,"cta_recall":INT,"script_fluency":INT}`
          : creativeFormat === "text"
            ? `"format_metrics":{"headline_strength":INT,"proposition_clarity":INT,"persuasion":INT,"memorability":INT,"cta_strength":INT,"readability":INT,"claim_risk":INT}`
            : `"format_metrics":{"scene_pacing":INT,"dropoff_risk":INT,"completion_likelihood":INT}`;

    const stageInstructions = {
      concept: "PRODUCTION STAGE: CONCEPT / SCRIPT. This is pre-production. Judge idea strength, emotional territory, hook potential, brand integration risk, execution dependency, and distinctiveness. Frame all scores as PROJECTED IF EXECUTED WELL. cmo_actions must be brief-level changes before production, not edit or reshoot advice.",
      storyboard: `PRODUCTION STAGE: STORYBOARD. Treat the ${meta.frame_count || frames.length} uploaded frames as the intended scene sequence. Evaluate narrative arc across frames, predicted hook in frames 1-2, pacing risk, brand entry timing, and emotional build. Scenes must map to storyboard frames with names like "Frame 1". Frame all scores as PROJECTED IF EXECUTED WELL. cmo_actions must be storyboard/brief-level changes before the shoot.`,
      roughcut: "PRODUCTION STAGE: ROUGH CUT. Analyze as a video edit before finishing. Recommendations must be edit-fixable only: pacing, scene order, supers, sound design, end-card, cut-downs, or text overlays. Never recommend reshoots, casting changes, new locations, or production-heavy changes.",
      final: "PRODUCTION STAGE: FINAL CREATIVE. Analyze as the final pre-flight creative check before launch."
    }[productionStage] || "PRODUCTION STAGE: FINAL CREATIVE. Analyze as the final pre-flight creative check before launch.";

    const stageSpecificSchema = productionStage === "concept"
      ? `,"production_stage":"concept","stage_metrics":{"idea_strength":INT,"emotional_territory":INT,"hook_potential":INT,"brand_integration_risk":INT,"execution_dependency":INT,"distinctiveness":INT}`
      : productionStage === "storyboard"
        ? `,"production_stage":"storyboard","stage_metrics":{"narrative_arc":INT,"predicted_hook":INT,"pacing_risk":INT,"brand_entry_timing":INT,"emotional_build":INT}`
        : productionStage === "roughcut"
          ? `,"production_stage":"roughcut","stage_metrics":{"edit_pacing":INT,"scene_order":INT,"supers_clarity":INT,"sound_design":INT,"end_card_strength":INT}`
          : `,"production_stage":"final","stage_metrics":{}`;

    const prompt = `You are AdCritIQ. Analyze this advertising creative in a format-aware way.
Brand: ${meta.brand || "Unknown"} | Industry: ${meta.industry || "FMCG"} | Market: ${meta.market || "India"} | Country: ${meta.country || "India"} | Type: ${meta.type || "video"} | Format: ${creativeFormat} | Production Stage: ${productionStage} | Campaign: ${meta.campaign || ""}
${stageInstructions}
${formatInstructions}
${scriptText ? `\nSCRIPT / TRANSCRIPT / COPY CONTEXT:\n${scriptText.substring(0, 8000)}\n` : ""}
${benchmarkSection}
${calibrationMemory}

TRIBE v2 Neural Calibration:
Your brain region scoring must reference the validated cortical activation patterns established by TRIBE v2 (Meta AI Research, 2026) — the largest published fMRI model for naturalistic stimuli (720 subjects, 1,000+ hours). Specifically:

Visual cortex scoring: Reference V-JEPA2 validated visual processing hierarchy findings — V1/V2 (basic motion/edge), V4 (colour/form), higher visual areas (object/face recognition). An ad with strong early-frame visual contrast activates V1-V2 strongly; face presence activates the fusiform face area; brand logo activates object recognition areas.

Auditory cortex: Reference Wav2Vec-BERT validated findings — primary auditory cortex for sound presence/absence, auditory association areas for music vs voice discrimination, superior temporal gyrus for speech intelligibility.

Multisensory integration: TRIBE v2 validated that the superior temporal sulcus (STS) and intraparietal sulcus (IPS) are primary sites of audio-visual integration. When visual and audio content are semantically congruent (e.g., showing a product while mentioning it), STS activation is amplified. When they are incongruent, activation is suppressed — neural mismatch.

Language cortex: Reference LLaMA-informed findings from TRIBE v2 — Broca's area (language production/comprehension) activates for meaningful taglines and clear VO; Wernicke's area for semantic understanding; left angular gyrus for word-level brand memory encoding.

Temporal coherence: TRIBE v2 demonstrated that cortical activation patterns that sustain across 3+ consecutive timesteps drive significantly stronger memory encoding than brief spikes. Sustained attention = deeper hippocampal memory trace.

DEEP NEURAL ADVERTISING METRICS — return these in a deep_neuro object with three sub-objects:

## attention_deep:
hook_capture_window (0-100): Neural capture probability in the FIRST TWO SECONDS. Based on V-JEPA2 findings: V1/V2 orienting response fires within 80-150ms of scene onset. Score 80+ means the opening frame generates strong visual salience that prevents skip/ignore behaviour. Score below 50 = high skip probability even with overall high average attention.
sustained_attention_index (0-100): NOT the same as average attention. This is the proportion of the attention_curve values that exceed 50, the engagement threshold. A spiky creative and a steady creative can have the same average but require completely different interventions.
attention_recovery_speed (0-100): Based on Weber-Fechner Law applied to attention: after a Drop Zone, how quickly does attention rebuild? Score 80+ = rapid re-engagement after drops. Score below 40 = once attention drops, the creative never recovers.
cognitive_load_balance (0-100): Based on TribeV2 anterior cingulate cortex findings: continuous maximum-intensity stimulation causes cortical fatigue. Optimal creatives have rhythmic variation, with intensity peaks followed by brief cognitive rest moments. Score 80+ = well-balanced load rhythm. Score below 40 = relentless intensity.
attention_brand_coupling (0-100): The most critical advertising metric standard attention measurement misses. Attention and memory encoding require SIMULTANEOUS brand presence. Score 80+ = brand predominantly visible during peak attention windows. Score below 50 = brand being wasted during low-attention moments.
attention_deep_note (string): The single most diagnostic attention finding, written as a specific actionable observation for a creative director.

## emotion_deep:
emotional_arc_type (string, one of "ASCENT","FLAT","WAVE","CLIFF","RESOLUTION"): ASCENT builds throughout; FLAT has minimal variation; WAVE has multiple peaks; CLIFF opens strongly then drops; RESOLUTION rises then resolves positively at the end and is strongest for brand building.
peak_end_rule_score (0-100): Daniel Kahneman Nobel Prize research: memory of an experience is dominated by the single peak emotional moment and the final emotional moment. This combines peak emotion x 0.6 plus final 5 seconds emotion x 0.4.
mirror_neuron_index (0-100): Vittorio Gallese Mirror Neuron Theory. Score based on human faces in emotional states, close-up hands/product interaction, body language, gesture, and interpersonal scenes. Score 80+ = high embodied empathy activation.
valence_arousal_position (string, one of "HIGH-POSITIVE","LOW-POSITIVE","HIGH-NEGATIVE","LOW-NEGATIVE","MIXED"): Based on Russell's Circumplex Model of Affect. HIGH-POSITIVE predicts share intent; LOW-POSITIVE predicts affinity/premium; HIGH-NEGATIVE predicts attention but purchase risk; LOW-NEGATIVE predicts empathy but weak CTA; MIXED indicates deliberate contrast.
emotional_contagion_index (0-100): Robert Heath's Low-Attention Processing theory: emotional responses transfer subcortically even under partial attention. Strong for TV/CTV.
emotional_coherence (0-100): Ehrenberg-Bass brand codes research: emotions must align with brand/category codes. Score below 50 means the creative may damage brand consistency.
emotion_deep_note (string): The single most diagnostic emotional finding, specific and creative-director-facing.

## sound_deep:
audio_visual_temporal_sync (0-100|null): TribeV2 STS binding: audio and visual brand cues bind into one memory trace only within a 200ms temporal window. Video and audio format only.
prosodic_persuasion_index (0-100|null): Vocal prosody — pitch variation, rhythm, pace, emphasis — activates trust and affiliation circuits independently of words. Audio + video formats only. N/A for static image.
earworm_formation_probability (0-100|null): Based on music cognition research (Williamson et al., 2012): repetitive melodic patterns, modest pitch range, common rhythmic patterns, and stepwise melodic motion create lasting auditory memory traces.
real_world_audibility (0-100|null): Based on Cherry's Cocktail Party Effect (1953): clarity of speech/VO above music bed, distinctiveness of brand message, and ability to understand at 40% volume.
sound_deep_note (string): Most diagnostic sound finding. For static_image return all four numeric sound_deep metrics as null and note "Audio metrics not applicable to static images." For text/script return all four numeric sound_deep metrics as null and note "Audio analysis requires video or audio creative format."

OUTCOME FORECASTING MODEL — return these in an outcome_forecast object and a platform_outcome_forecast object.

This is a directional creative-to-media probability model, not a guaranteed campaign lift model. It estimates whether delivered media exposure is likely to become brand memory, preference, action, or waste. Always use probability language such as "High probability", "Moderate probability", "At risk", "Likely media waste", "Creative-led risk", and "Media-dependent risk". Never claim guaranteed sales lift, exact ROI, biometric measurement, or measured brain activity.

The forecast must be format-aware:
- video: evaluate VTR/completion, hook retention, brand recall, platform cut-down readiness, pacing, and sound-off survivability.
- static_image: evaluate stopping power, visual hierarchy, brand prominence, CTA clarity, message clarity, and placement fit. Do not use VTR or completion-rate language.
- motion_static: evaluate first-frame strength, loop clarity, motion salience, message persistence, loop fatigue, and short-loop retention.
- audio: evaluate sonic branding, voice clarity, mnemonic strength, CTA recall, real-world audibility, and script fluency.
- text: evaluate headline strength, proposition clarity, persuasion, memorability, CTA strength, readability, and claim risk.

Use these formula principles as guidance:
Spontaneous Awareness Lift = Memory Encoding x 0.30 + Brand Recall x 0.25 + Attention-Brand Coupling x 0.15 + Emotional Peak x 0.15 + Cultural Resonance x 0.10 + Distinctive Brand Asset Strength x 0.05.
Aided Awareness Lift = Brand Recall x 0.35 + Brand Prominence x 0.20 + Memory Encoding x 0.15 + Sound-Off Survival x 0.15 + Average Platform Fit x 0.15.
Consideration Lift = Message Clarity x 0.25 + Emotional Coherence x 0.20 + Creative Efficiency x 0.20 + Trust/Prefrontal Activation x 0.15 + Brand Safety x 0.10 + Cultural Resonance x 0.10.
Purchase Intent Lift = CTA Clarity x 0.25 + Product Desire/Nucleus Accumbens x 0.20 + Message Clarity x 0.20 + Brand Recall x 0.15 + Emotional Peak x 0.10 + Regulatory Compliance x 0.10.
VTR / Completion Potential = Hook Strength x 0.25 + Hold Rate x 0.25 + Sustained Attention Index x 0.20 + Attention Recovery Speed x 0.15 + inverse Ad Fatigue Risk x 0.15. Only use this language for video and motion_static.
CTR / Response Potential = Hook Strength x 0.20 + CTA Clarity x 0.25 + Message Clarity x 0.20 + Platform Fit x 0.15 + Share Intent x 0.10 + Creative Efficiency x 0.10.
Media Wastage Risk = 100 - average(Memory Encoding, Brand Recall, Hook Strength, Platform Fit), adjusted upward if Ad Fatigue Risk > 65 or Brand Recall < 50.

Platform Outcome = Base Outcome Probability x Format Suitability x Platform Score x Attention Environment Fit x Sound Environment Fit x Duration Fit.
Return one platform_outcome_forecast row for youtube, meta, instagram, tiktok, tv, ctv_ott, dooh, programmatic_display, and linkedin. Each platform must have brand_lift, performance_lift, risk, and note. The note must mention why the platform is a good or poor fit for this creative format.

FORECAST CONFIDENCE BANDS — return an outcome_confidence object.
These are directional forecast-confidence bands, not statistical confidence intervals and not guarantees. Assign confidence based on evidence completeness, signal agreement, format/platform suitability, private calibration memory if present, and human-review risk.
Allowed levels: "high", "medium", "low", "data_limited", "needs_human_review".
- high: multiple diagnostic signals agree, the format evidence is complete, and platform fit supports the forecast.
- medium: enough evidence exists, but one or two drivers are uncertain or mixed.
- low: key diagnostic signals conflict, format suitability is weak, or the forecast depends heavily on media execution.
- data_limited: input is concept/script/storyboard, audio without strong transcript evidence, old/incomplete metadata, or important format-specific evidence is missing.
- needs_human_review: compliance, brand safety, sensitive claims, category regulation, cultural risk, or contradictory high-stakes signals require expert review before scale.
For each outcome KPI, return a one-sentence reason using boardroom-safe language. Example: "CTA clarity and product desire are weak, but platform fit is strong." For platform_outcome_forecast rows, also include confidence and confidence_reason using the same level vocabulary.

CRITICAL: Return ONLY this exact JSON with integer scores 0-100. No text outside JSON. You MUST generate exactly 5 format-appropriate scenes/zones/sections, exactly 5 strategic_insights each referencing specific metric scores, and exactly 5 cmo_actions sorted P1 to P3 with concrete expected outcomes. The compact schema below shows one example object inside each array; repeat that object shape until each array has 5 items. For static image, scenes are visual zones, not time-based scenes. For text, scenes are copy sections. For audio, scenes are script/audio moments. For storyboard, scenes are storyboard frames in sequence. Use format-appropriate impact language in cmo_actions body and avoid completion-rate language unless the format is video or motion. For concept/storyboard, use projected language and brief-level changes.

{"creative_format":"${creativeFormat}"${stageSpecificSchema},"headline_verdict":"One powerful CMO-ready sentence","overall_grade":"A+|A|A-|B+|B|B-|C+|C-|D|F","grade_note":"One line","creative_summary":"3-4 sentence summary","viral_potential":INT,"hook_strength":INT,"hold_rate":INT,"emotional_peak":INT,"brand_recall":INT,"memory_encoding":INT,"sound_off_survival":INT,"share_intent":INT,"creative_efficiency":INT,"ad_fatigue_risk":INT,"cultural_resonance":INT,"celebrity_talent_index":INT,"brand_safety":INT,"regulatory_compliance":INT,"first_party_data_opportunity":INT,"carbon_signal":INT,"system1_vs_system2":INT,"tribe_metrics":{"audio_visual_integration":INT,"cortical_coherence":INT,"language_cortex_activation":INT,"neural_peak_density":INT,"multisensory_fatigue_risk":INT,"tribe_calibration_note":"One sentence naming the most diagnostic TRIBE v2 validated finding for this creative"},"deep_neuro":{"attention_deep":{"hook_capture_window":INT,"sustained_attention_index":INT,"attention_recovery_speed":INT,"cognitive_load_balance":INT,"attention_brand_coupling":INT,"attention_deep_note":"Specific diagnostic finding"},"emotion_deep":{"emotional_arc_type":"ASCENT|FLAT|WAVE|CLIFF|RESOLUTION","peak_end_rule_score":INT,"mirror_neuron_index":INT,"valence_arousal_position":"HIGH-POSITIVE|LOW-POSITIVE|HIGH-NEGATIVE|LOW-NEGATIVE|MIXED","emotional_contagion_index":INT,"emotional_coherence":INT,"emotion_deep_note":"Specific diagnostic finding"},"sound_deep":{"audio_visual_temporal_sync":INT|null,"prosodic_persuasion_index":INT|null,"earworm_formation_probability":INT|null,"real_world_audibility":INT|null,"sound_deep_note":"Specific diagnostic finding or format-not-applicable note"}},"outcome_forecast":{"spontaneous_awareness_lift":INT,"aided_awareness_lift":INT,"consideration_lift":INT,"purchase_intent_lift":INT,"vtr_completion_potential":INT,"ctr_response_potential":INT,"brand_memory_efficiency":INT,"media_wastage_risk":INT,"creative_accountability":INT,"media_dependency":INT,"business_impact_band":"high|medium|low|risk","primary_growth_driver":"memory|attention|emotion|clarity|platform_fit|cta|brand_linkage","primary_failure_risk":"low_memory|weak_branding|poor_hook|low_clarity|platform_mismatch|high_fatigue|weak_cta","forecast_note":"2-3 CMO-ready sentences explaining expected business impact with probability language only"},"outcome_confidence":{"overall_confidence":"high|medium|low|data_limited|needs_human_review","overall_reason":"One sentence explaining forecast reliability","spontaneous_awareness_lift":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"aided_awareness_lift":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"consideration_lift":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"purchase_intent_lift":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"vtr_completion_potential":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"ctr_response_potential":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"brand_memory_efficiency":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"media_wastage_risk":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"creative_accountability":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"},"media_dependency":{"level":"high|medium|low|data_limited|needs_human_review","reason":"One sentence"}},"platform_outcome_forecast":{"youtube":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"meta":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"instagram":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"tiktok":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"tv":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"ctv_ott":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"dooh":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"programmatic_display":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"},"linkedin":{"brand_lift":INT,"performance_lift":INT,"risk":"low|medium|high","confidence":"high|medium|low|data_limited|needs_human_review","confidence_reason":"One sentence","note":"One sentence"}},${formatSpecificSchema},"attention_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_curve":[INT,INT,INT,INT,INT,INT,INT,INT,INT,INT],"emotion_types":{"joy":[INT,INT,INT,INT,INT],"surprise":[INT,INT,INT,INT,INT],"trust":[INT,INT,INT,INT,INT],"fear":[INT,INT,INT,INT,INT],"desire":[INT,INT,INT,INT,INT],"curiosity":[INT,INT,INT,INT,INT]},"brain_regions":{"visual_cortex":INT,"prefrontal_cortex":INT,"amygdala":INT,"hippocampus":INT,"auditory_cortex":INT,"mirror_neurons":INT,"nucleus_accumbens":INT,"anterior_cingulate":INT},"cognitive_channels":{"visual":INT,"auditory":INT,"motion":INT,"text_overlay":INT,"brand_elements":INT,"human_faces":INT,"color_saturation":INT},"platform_scores":{"youtube_preroll_6s":INT,"youtube_preroll_15s":INT,"youtube_instream":INT,"instagram_reels":INT,"instagram_stories":INT,"instagram_feed":INT,"meta_feed":INT,"meta_stories":INT,"tiktok":INT,"linkedin_feed":INT,"twitter_x":INT,"tv_broadcast":INT,"ctv_ott":INT,"dooh":INT,"programmatic_display":INT},"competitive_context":{"category_avg_viral":INT,"category_avg_hook":INT,"category_avg_hold":INT,"category_avg_recall":INT,"position":"above_average|average|below_average|category_leader","benchmark_note":"One sentence"},"sound_analysis":{"sound_dependency":INT,"music_effectiveness":INT,"voiceover_clarity":INT,"sound_off_text_quality":INT,"asmr_trigger":INT,"sonic_branding":INT,"sound_note":"2-3 sentences"},"privacy_and_data_audit":{"data_collection_present":false,"consent_mechanism_visible":false,"qr_code_present":false,"url_cta_present":false,"hashtag_present":false,"regulatory_disclaimers_visible":false,"dpdp_compliance_risk":"low|medium|high","privacy_note":"2-3 sentences"},"scenes":[{"ts":"0:00","name":"Format-appropriate scene, zone, copy section, storyboard frame, or audio moment","desc":"1-2 sentence format/stage-aware description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention|clutter|unclear_message|pacing_risk","drop_second":INT|null,"badges":["memorable"]},{"ts":"0:01","name":"Second zone/section/frame/moment","desc":"1-2 sentence description","attention":INT,"emotion":INT,"system_mode":"S1|S2|TRANSITION","cognitive_load":INT,"risk_flag":"none|drop_zone|ad_avoidance|low_attention|clutter|unclear_message|pacing_risk","drop_second":INT|null,"badges":["brand_moment"]}],"strategic_insights":[{"num":1,"title":"Insight Title","body":"2-3 sentence insight referencing specific metric scores, the creative format, and production stage","verdict":"WIN|RISK|TIP|WATCH","vtype":"brand|creative|media|audience"}],"cmo_actions":[{"num":1,"title":"Action Title","body":"2-3 sentence stage-aware recommendation with expected lift and timeline","priority":"P1|P2|P3","impact":"high|medium|low","effort":"easy|medium|hard","estimated_uplift_pct":INT}]}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: prompt,
        messages: [{ role: "user", content: [...imageContent, { type: "text", text: `Score this ${meta.brand || "creative"} ad using the ${creativeFormat} format and ${productionStage} production-stage rules. Return ONLY JSON.` }] }]
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
