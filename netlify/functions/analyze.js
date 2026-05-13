// netlify/functions/analyze.js
// ADVantage Insights Brain Encoder — Backend Analysis Function
// Using CommonJS syntax for Netlify compatibility

const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key not configured. Set ANTHROPIC_API_KEY in Netlify environment variables." })
    };
  }

  const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
  if (ACCESS_PASSWORD) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || authHeader !== "Bearer " + ACCESS_PASSWORD) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid access code." }) };
    }
  }

  try {
    const body = JSON.parse(event.body);
    const frames = body.frames;
    const metadata = body.metadata || {};

    if (!frames || !frames.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No frames provided." }) };
    }

    const imageContent = frames.map(function (f) {
      return {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: f }
      };
    });

    var isImage = metadata.isImage || false;
    var duration = metadata.duration || 0;

    var systemPrompt = "You are the ADVantage Insights Brain Encoder, the most advanced AI-powered creative intelligence system for advertising analysis. You analyze frames from video ads, display ads, and social creatives to produce a comprehensive neural creative analysis.\n\nCRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble, no explanation. Just the raw JSON object.\n\nYou are analyzing " + frames.length + " frames from a " + (isImage ? "static display/image ad" : "video ad (" + duration.toFixed(1) + " seconds)") + ".\nBrand: " + (metadata.brand || "Unknown") + " | Client: " + (metadata.client || "Unknown") + " | Campaign: " + (metadata.campaign || "Unknown") + " | Agency: " + (metadata.agency || "Unknown") + " | Creative Type: " + (metadata.type || "video") + " | Industry: " + (metadata.industry || "Not specified") + " | Target Audience: " + (metadata.audience || "Not specified") + " | Market: " + (metadata.market || "India") + "\n\nReturn this JSON structure (ALL integer values must be 0-100 unless noted):\n{\n\"viral_potential\":INT,\n\"hook_strength\":INT,\n\"hold_rate\":INT,\n\"emotional_peak\":INT,\n\"brand_recall\":INT,\n\"memory_encoding\":INT,\n\"sound_off_survival\":INT,\n\"creative_efficiency\":INT,\n\"share_intent\":INT,\n\"ad_fatigue_risk\":INT,\n\"cultural_resonance\":INT,\n\"system1_vs_system2\":INT,\n\"first_party_data_opportunity\":INT,\n\"celebrity_talent_index\":INT,\n\"brand_safety\":INT,\n\"regulatory_compliance\":INT,\n\"carbon_signal\":INT,\n\"score_notes\":{\"viral_potential\":\"short note\",\"hook_strength\":\"short note\",\"hold_rate\":\"short note\",\"emotional_peak\":\"short note\",\"brand_recall\":\"short note\",\"memory_encoding\":\"short note\",\"sound_off_survival\":\"short note\",\"creative_efficiency\":\"short note\",\"share_intent\":\"short note\"},\n\"attention_curve\":[20 integers 0-100],\n\"emotion_curve\":[20 integers 0-100],\n\"emotion_types_curve\":{\"joy\":[20 ints],\"surprise\":[20 ints],\"trust\":[20 ints],\"fear\":[20 ints],\"desire\":[20 ints],\"curiosity\":[20 ints]},\n\"brain_regions\":{\"visual_cortex\":INT,\"prefrontal_cortex\":INT,\"amygdala\":INT,\"hippocampus\":INT,\"auditory_cortex\":INT,\"mirror_neurons\":INT,\"nucleus_accumbens\":INT,\"anterior_cingulate\":INT},\n\"cognitive_channel_load\":{\"visual\":INT,\"auditory\":INT,\"motion\":INT,\"text_overlay\":INT,\"brand_elements\":INT,\"human_faces\":INT,\"color_saturation\":INT},\n\"platform_scores\":{\"youtube_preroll_6s\":INT,\"youtube_preroll_15s\":INT,\"youtube_instream\":INT,\"instagram_reels\":INT,\"instagram_stories\":INT,\"instagram_feed\":INT,\"meta_feed\":INT,\"meta_stories\":INT,\"tiktok\":INT,\"linkedin_feed\":INT,\"twitter_x\":INT,\"tv_broadcast\":INT,\"ctv_ott\":INT,\"dooh\":INT,\"programmatic_display\":INT},\n\"scenes\":[{\"ts\":\"0:00-2:50\",\"name\":\"Scene Name\",\"desc\":\"3-4 sentence analysis\",\"attention\":INT,\"emotion\":INT,\"system_mode\":\"system1 or system2 or mixed\",\"cognitive_load\":\"low or medium or high or overload\",\"risk_flag\":\"none or drop_zone or ad_avoidance or cognitive_overload or pacing_issue\",\"badges\":[\"Badge1\",\"Badge2\"]}],\n\"insights\":[{\"num\":\"01\",\"title\":\"Insight Title\",\"body\":\"4-6 sentence strategic analysis referencing advertising science like System 1/2, attention economics, memory encoding, Byron Sharp distinctive assets, Kahneman cognitive load theory.\",\"verdict\":\"One sentence actionable verdict\",\"vtype\":\"risk or win or tip or watch\"}],\n\"cmo_actions\":[{\"num\":\"01\",\"title\":\"Action Title\",\"body\":\"3-4 sentence recommendation with predicted metric improvement and measurement method.\",\"priority\":\"critical or high or medium or low\",\"impact\":\"Predicted improvement\",\"effort\":\"easy or medium or hard\"}],\n\"competitive_context\":{\"category_avg_viral\":INT,\"category_avg_hook\":INT,\"category_avg_hold\":INT,\"category_avg_recall\":INT,\"position\":\"above_average or average or below_average or category_leader\",\"benchmark_note\":\"One sentence benchmark\"},\n\"sound_analysis\":{\"sound_dependency\":INT,\"music_effectiveness\":INT,\"voiceover_clarity\":INT,\"sound_off_text_quality\":INT,\"asmr_trigger\":INT,\"sonic_branding\":INT,\"sound_note\":\"2-3 sentences about audio strategy\"},\n\"privacy_and_data_audit\":{\"data_collection_present\":BOOL,\"consent_mechanism_visible\":BOOL,\"qr_code_present\":BOOL,\"url_cta_present\":BOOL,\"hashtag_present\":BOOL,\"regulatory_disclaimers_visible\":BOOL,\"dpdp_compliance_risk\":\"low or medium or high\",\"privacy_note\":\"2-3 sentences about privacy implications\"},\n\"creative_summary\":\"4-5 sentence paragraph summarizing the creative\",\n\"headline_verdict\":\"One powerful sentence a CMO would remember\",\n\"overall_grade\":\"Letter grade A+ through F\"\n}\n\nProvide 5-7 scenes, 5-7 insights, 5-7 cmo_actions. Be specific, analytical, strategic. Scores should be honest and critical. Do not mention Publicis Media anywhere.";

    var userMessage = "Analyze these " + frames.length + " frames from the " + (metadata.type || "video") + " creative for " + (metadata.brand || "this brand") + ". " + (metadata.notes ? "Additional context: " + metadata.notes : "") + " Return ONLY the JSON object.";

    var requestBody = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: imageContent.concat([{ type: "text", text: userMessage }])
      }]
    };

    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      var errText = await response.text();
      return {
        statusCode: response.status,
        headers: headers,
        body: JSON.stringify({ error: "Anthropic API error: " + response.status, details: errText.substring(0, 500) })
      };
    }

    var data = await response.json();
    var textContent = "";
    if (data.content && Array.isArray(data.content)) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].text) {
          textContent += data.content[i].text;
        }
      }
    }

    var clean = textContent.replace(/```json/g, "").replace(/```/g, "").trim();

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      return {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ error: "Failed to parse analysis results. The AI response was not valid JSON.", raw: clean.substring(0, 300) })
      };
    }

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ success: true, analysis: parsed, usage: data.usage })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: "Server error: " + err.message })
    };
  }
};

module.exports = { handler };
