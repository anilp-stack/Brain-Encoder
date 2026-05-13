export default async (request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (request.method === "OPTIONS") {
    return new Response("", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: corsHeaders });
  }

  var apiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), { status: 500, headers: corsHeaders });
  }

  try {
    var body = await request.json();
    var frames = body.frames || [];
    var meta = body.metadata || {};

    if (frames.length === 0) {
      return new Response(JSON.stringify({ error: "No frames" }), { status: 400, headers: corsHeaders });
    }

    // Use max 2 frames
    if (frames.length > 2) {
      frames = [frames[0], frames[frames.length - 1]];
    }

    var images = [];
    for (var i = 0; i < frames.length; i++) {
      images.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: frames[i] }
      });
    }

    var brand = meta.brand || "Unknown";
    var sysMsg = "You are the ADVantage Insights Brain Encoder. Analyze ad creative frames and return ONLY valid JSON. No markdown. No backticks. No explanation before or after the JSON. Just the raw JSON object.\n\n"
      + "Brand: " + brand + " | Type: " + (meta.type || "video") + " | Industry: " + (meta.industry || "N/A") + " | Market: " + (meta.market || "India") + "\n\n"
      + 'Return exactly this JSON structure (all numbers 0-100):\n'
      + '{"viral_potential":0,"hook_strength":0,"hold_rate":0,"emotional_peak":0,"brand_recall":0,"memory_encoding":0,"sound_off_survival":0,"creative_efficiency":0,"share_intent":0,"ad_fatigue_risk":0,"cultural_resonance":0,"system1_vs_system2":0,"first_party_data_opportunity":0,"celebrity_talent_index":0,"brand_safety":0,"regulatory_compliance":0,"carbon_signal":0,'
      + '"score_notes":{"viral_potential":"","hook_strength":"","hold_rate":"","emotional_peak":"","brand_recall":"","memory_encoding":"","sound_off_survival":"","creative_efficiency":"","share_intent":""},'
      + '"attention_curve":[70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70],'
      + '"emotion_curve":[50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50],'
      + '"emotion_types_curve":{"joy":[20 numbers],"surprise":[20 numbers],"trust":[20 numbers],"fear":[20 numbers],"desire":[20 numbers],"curiosity":[20 numbers]},'
      + '"brain_regions":{"visual_cortex":0,"prefrontal_cortex":0,"amygdala":0,"hippocampus":0,"auditory_cortex":0,"mirror_neurons":0,"nucleus_accumbens":0,"anterior_cingulate":0},'
      + '"cognitive_channel_load":{"visual":0,"auditory":0,"motion":0,"text_overlay":0,"brand_elements":0,"human_faces":0,"color_saturation":0},'
      + '"platform_scores":{"youtube_preroll_6s":0,"youtube_preroll_15s":0,"youtube_instream":0,"instagram_reels":0,"instagram_stories":0,"instagram_feed":0,"meta_feed":0,"meta_stories":0,"tiktok":0,"linkedin_feed":0,"twitter_x":0,"tv_broadcast":0,"ctv_ott":0,"dooh":0,"programmatic_display":0},'
      + '"scenes":[{"ts":"0:00-3:00","name":"","desc":"","attention":0,"emotion":0,"system_mode":"system1","cognitive_load":"medium","risk_flag":"none","badges":["",""]}],'
      + '"insights":[{"num":"01","title":"","body":"","verdict":"","vtype":"risk"}],'
      + '"cmo_actions":[{"num":"01","title":"","body":"","priority":"high","impact":"","effort":"medium"}],'
      + '"competitive_context":{"category_avg_viral":50,"category_avg_hook":50,"category_avg_hold":50,"category_avg_recall":50,"position":"average","benchmark_note":""},'
      + '"sound_analysis":{"sound_dependency":0,"music_effectiveness":0,"voiceover_clarity":0,"sound_off_text_quality":0,"asmr_trigger":0,"sonic_branding":0,"sound_note":""},'
      + '"privacy_and_data_audit":{"data_collection_present":false,"consent_mechanism_visible":false,"qr_code_present":false,"url_cta_present":false,"hashtag_present":false,"regulatory_disclaimers_visible":false,"dpdp_compliance_risk":"low","privacy_note":""},'
      + '"creative_summary":"","headline_verdict":"","overall_grade":"B"}\n\n'
      + "Fill all values with real analysis. Provide 5 scenes, 5 insights, 5 cmo_actions. Be specific. No Publicis Media.";

    var userMsg = "Analyze this ad for " + brand + ". Return ONLY JSON.";

    var apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        system: sysMsg,
        messages: [{ role: "user", content: images.concat([{ type: "text", text: userMsg }]) }]
      })
    });

    if (!apiResponse.ok) {
      var errText = await apiResponse.text();
      return new Response(JSON.stringify({ error: "Claude API error: " + apiResponse.status, details: errText.substring(0, 300) }), { status: 502, headers: corsHeaders });
    }

    var data = await apiResponse.json();
    var resultText = "";
    if (data.content) {
      for (var j = 0; j < data.content.length; j++) {
        if (data.content[j].text) resultText += data.content[j].text;
      }
    }

    var cleaned = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    var parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: "AI returned invalid JSON", preview: cleaned.substring(0, 150) }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, analysis: parsed }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Function error: " + err.message }), { status: 500, headers: corsHeaders });
  }
};
