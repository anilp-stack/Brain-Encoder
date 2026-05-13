// netlify/functions/analyze.js
// ADVantage Insights Brain Encoder
// Optimized for Netlify free tier (10s timeout)

exports.handler = async function(event, context) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  var ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set." }) };
  }

  var ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
  if (ACCESS_PASSWORD) {
    var authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
    if (authHeader !== "Bearer " + ACCESS_PASSWORD) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: "Invalid access code." }) };
    }
  }

  var body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  var frames = body.frames || [];
  var metadata = body.metadata || {};

  if (!frames.length) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "No frames provided." }) };
  }

  // Limit to 2 frames max for speed
  if (frames.length > 2) {
    frames = [frames[0], frames[frames.length - 1]];
  }

  var imageContent = frames.map(function(f) {
    return { type: "image", source: { type: "base64", media_type: "image/jpeg", data: f } };
  });

  var meta = metadata;
  var prompt = "You analyze ad creatives. Return ONLY valid JSON, no markdown, no backticks.\n\n"
    + "Creative: " + frames.length + " frames, " + (meta.brand||"Unknown") + ", " + (meta.type||"video") + ", " + (meta.industry||"") + ", " + (meta.market||"India") + "\n\n"
    + "Return JSON with these exact keys (all numbers 0-100):\n"
    + '{"viral_potential":N,"hook_strength":N,"hold_rate":N,"emotional_peak":N,"brand_recall":N,'
    + '"memory_encoding":N,"sound_off_survival":N,"creative_efficiency":N,"share_intent":N,'
    + '"ad_fatigue_risk":N,"cultural_resonance":N,"system1_vs_system2":N,'
    + '"first_party_data_opportunity":N,"celebrity_talent_index":N,"brand_safety":N,'
    + '"regulatory_compliance":N,"carbon_signal":N,'
    + '"score_notes":{"viral_potential":"note","hook_strength":"note","hold_rate":"note","emotional_peak":"note","brand_recall":"note","memory_encoding":"note","sound_off_survival":"note","creative_efficiency":"note","share_intent":"note"},'
    + '"attention_curve":[20 ints],"emotion_curve":[20 ints],'
    + '"emotion_types_curve":{"joy":[20],"surprise":[20],"trust":[20],"fear":[20],"desire":[20],"curiosity":[20]},'
    + '"brain_regions":{"visual_cortex":N,"prefrontal_cortex":N,"amygdala":N,"hippocampus":N,"auditory_cortex":N,"mirror_neurons":N,"nucleus_accumbens":N,"anterior_cingulate":N},'
    + '"cognitive_channel_load":{"visual":N,"auditory":N,"motion":N,"text_overlay":N,"brand_elements":N,"human_faces":N,"color_saturation":N},'
    + '"platform_scores":{"youtube_preroll_6s":N,"youtube_preroll_15s":N,"youtube_instream":N,"instagram_reels":N,"instagram_stories":N,"instagram_feed":N,"meta_feed":N,"meta_stories":N,"tiktok":N,"linkedin_feed":N,"twitter_x":N,"tv_broadcast":N,"ctv_ott":N,"dooh":N,"programmatic_display":N},'
    + '"scenes":[{"ts":"0:00-3:00","name":"Name","desc":"Analysis","attention":N,"emotion":N,"system_mode":"system1","cognitive_load":"medium","risk_flag":"none","badges":["B1"]}],'
    + '"insights":[{"num":"01","title":"T","body":"Analysis text","verdict":"Action","vtype":"risk"}],'
    + '"cmo_actions":[{"num":"01","title":"T","body":"Recommendation","priority":"high","impact":"Impact","effort":"medium"}],'
    + '"competitive_context":{"category_avg_viral":N,"category_avg_hook":N,"category_avg_hold":N,"category_avg_recall":N,"position":"average","benchmark_note":"Note"},'
    + '"sound_analysis":{"sound_dependency":N,"music_effectiveness":N,"voiceover_clarity":N,"sound_off_text_quality":N,"asmr_trigger":N,"sonic_branding":N,"sound_note":"Note"},'
    + '"privacy_and_data_audit":{"data_collection_present":false,"consent_mechanism_visible":false,"qr_code_present":false,"url_cta_present":false,"hashtag_present":false,"regulatory_disclaimers_visible":false,"dpdp_compliance_risk":"low","privacy_note":"Note"},'
    + '"creative_summary":"Summary","headline_verdict":"Verdict","overall_grade":"B"}\n\n'
    + "Provide 4-5 scenes, 4-5 insights, 4-5 cmo_actions. Be specific. No Publicis Media mentions.";

  var userMsg = "Analyze this " + (meta.type||"video") + " ad for " + (meta.brand||"brand") + ". " + (meta.notes||"") + " Return ONLY JSON.";

  try {
    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: prompt,
        messages: [{ role: "user", content: imageContent.concat([{ type: "text", text: userMsg }]) }]
      })
    });

    if (!response.ok) {
      var errBody = await response.text();
      return { statusCode: response.status, headers: headers, body: JSON.stringify({ error: "API error " + response.status, details: errBody.substring(0, 300) }) };
    }

    var data = await response.json();
    var text = "";
    if (data.content) {
      for (var j = 0; j < data.content.length; j++) {
        if (data.content[j].text) text += data.content[j].text;
      }
    }

    var clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    var parsed;
    try { parsed = JSON.parse(clean); } catch (e) {
      return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "Invalid JSON from AI", preview: clean.substring(0, 200) }) };
    }

    return { statusCode: 200, headers: headers, body: JSON.stringify({ success: true, analysis: parsed, usage: data.usage }) };

  } catch (err) {
    return { statusCode: 500, headers: headers, body: JSON.stringify({ error: "Error: " + err.message }) };
  }
};
