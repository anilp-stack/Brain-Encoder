// netlify/functions/analyze.js
// ADVantage Insights Brain Encoder - Netlify Serverless Function
// CommonJS format - DO NOT use import/export syntax

exports.handler = async function(event, context) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Check API key
  var ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set. Add it in Netlify Site Configuration > Environment Variables." })
    };
  }

  // Optional password
  var ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
  if (ACCESS_PASSWORD) {
    var authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
    if (authHeader !== "Bearer " + ACCESS_PASSWORD) {
      return { statusCode: 401, headers: headers, body: JSON.stringify({ error: "Invalid access code." }) };
    }
  }

  // Parse request body
  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  var frames = body.frames;
  var metadata = body.metadata || {};

  if (!frames || !frames.length) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "No frames provided." }) };
  }

  // Build image content for Claude
  var imageContent = [];
  for (var i = 0; i < frames.length; i++) {
    imageContent.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: frames[i] }
    });
  }

  var isImage = metadata.isImage || false;
  var duration = metadata.duration || 0;
  var durationStr = isImage ? "static" : duration.toFixed(1) + "s";

  var systemPrompt = [
    "You are the ADVantage Insights Brain Encoder. Analyze frames from advertising creatives.",
    "CRITICAL: Return ONLY valid JSON. No markdown fences, no backticks, no preamble text.",
    "",
    "Creative: " + (frames.length) + " frames from a " + (isImage ? "display ad" : "video ad (" + durationStr + ")"),
    "Brand: " + (metadata.brand || "Unknown"),
    "Client: " + (metadata.client || "Unknown"),
    "Campaign: " + (metadata.campaign || "Unknown"),
    "Agency: " + (metadata.agency || "Unknown"),
    "Type: " + (metadata.type || "video"),
    "Industry: " + (metadata.industry || "Not specified"),
    "Audience: " + (metadata.audience || "Not specified"),
    "Market: " + (metadata.market || "India"),
    "",
    "Return this JSON (all INT values 0-100):",
    "{",
    "  \"viral_potential\": INT,",
    "  \"hook_strength\": INT,",
    "  \"hold_rate\": INT,",
    "  \"emotional_peak\": INT,",
    "  \"brand_recall\": INT,",
    "  \"memory_encoding\": INT,",
    "  \"sound_off_survival\": INT,",
    "  \"creative_efficiency\": INT,",
    "  \"share_intent\": INT,",
    "  \"ad_fatigue_risk\": INT,",
    "  \"cultural_resonance\": INT,",
    "  \"system1_vs_system2\": INT,",
    "  \"first_party_data_opportunity\": INT,",
    "  \"celebrity_talent_index\": INT,",
    "  \"brand_safety\": INT,",
    "  \"regulatory_compliance\": INT,",
    "  \"carbon_signal\": INT,",
    "  \"score_notes\": { \"viral_potential\": \"note\", \"hook_strength\": \"note\", \"hold_rate\": \"note\", \"emotional_peak\": \"note\", \"brand_recall\": \"note\", \"memory_encoding\": \"note\", \"sound_off_survival\": \"note\", \"creative_efficiency\": \"note\", \"share_intent\": \"note\" },",
    "  \"attention_curve\": [20 integers],",
    "  \"emotion_curve\": [20 integers],",
    "  \"emotion_types_curve\": { \"joy\": [20 ints], \"surprise\": [20 ints], \"trust\": [20 ints], \"fear\": [20 ints], \"desire\": [20 ints], \"curiosity\": [20 ints] },",
    "  \"brain_regions\": { \"visual_cortex\": INT, \"prefrontal_cortex\": INT, \"amygdala\": INT, \"hippocampus\": INT, \"auditory_cortex\": INT, \"mirror_neurons\": INT, \"nucleus_accumbens\": INT, \"anterior_cingulate\": INT },",
    "  \"cognitive_channel_load\": { \"visual\": INT, \"auditory\": INT, \"motion\": INT, \"text_overlay\": INT, \"brand_elements\": INT, \"human_faces\": INT, \"color_saturation\": INT },",
    "  \"platform_scores\": { \"youtube_preroll_6s\": INT, \"youtube_preroll_15s\": INT, \"youtube_instream\": INT, \"instagram_reels\": INT, \"instagram_stories\": INT, \"instagram_feed\": INT, \"meta_feed\": INT, \"meta_stories\": INT, \"tiktok\": INT, \"linkedin_feed\": INT, \"twitter_x\": INT, \"tv_broadcast\": INT, \"ctv_ott\": INT, \"dooh\": INT, \"programmatic_display\": INT },",
    "  \"scenes\": [{ \"ts\": \"0:00-3:00\", \"name\": \"Name\", \"desc\": \"3-4 sentences\", \"attention\": INT, \"emotion\": INT, \"system_mode\": \"system1|system2|mixed\", \"cognitive_load\": \"low|medium|high|overload\", \"risk_flag\": \"none|drop_zone|ad_avoidance|cognitive_overload\", \"badges\": [\"Badge1\", \"Badge2\"] }],",
    "  \"insights\": [{ \"num\": \"01\", \"title\": \"Title\", \"body\": \"4-6 sentence analysis using advertising science (System 1/2, attention economics, memory encoding, Byron Sharp).\", \"verdict\": \"One sentence action\", \"vtype\": \"risk|win|tip|watch\" }],",
    "  \"cmo_actions\": [{ \"num\": \"01\", \"title\": \"Title\", \"body\": \"3-4 sentence recommendation.\", \"priority\": \"critical|high|medium|low\", \"impact\": \"Predicted improvement\", \"effort\": \"easy|medium|hard\" }],",
    "  \"competitive_context\": { \"category_avg_viral\": INT, \"category_avg_hook\": INT, \"category_avg_hold\": INT, \"category_avg_recall\": INT, \"position\": \"above_average|average|below_average|category_leader\", \"benchmark_note\": \"One sentence\" },",
    "  \"sound_analysis\": { \"sound_dependency\": INT, \"music_effectiveness\": INT, \"voiceover_clarity\": INT, \"sound_off_text_quality\": INT, \"asmr_trigger\": INT, \"sonic_branding\": INT, \"sound_note\": \"2-3 sentences\" },",
    "  \"privacy_and_data_audit\": { \"data_collection_present\": BOOL, \"consent_mechanism_visible\": BOOL, \"qr_code_present\": BOOL, \"url_cta_present\": BOOL, \"hashtag_present\": BOOL, \"regulatory_disclaimers_visible\": BOOL, \"dpdp_compliance_risk\": \"low|medium|high\", \"privacy_note\": \"2-3 sentences\" },",
    "  \"creative_summary\": \"4-5 sentence summary\",",
    "  \"headline_verdict\": \"One powerful sentence\",",
    "  \"overall_grade\": \"A+|A|A-|B+|B|B-|C+|C|C-|D|F\"",
    "}",
    "",
    "Provide 5-7 scenes, 5-7 insights, 5-7 cmo_actions. Be specific and critical. Do not mention Publicis Media."
  ].join("\n");

  var userMessage = "Analyze these " + frames.length + " frames from the " + (metadata.type || "video") + " creative for " + (metadata.brand || "this brand") + ". Return ONLY the JSON object.";

  // Add notes if provided
  if (metadata.notes) {
    userMessage += " Context: " + metadata.notes;
  }

  // Build messages array
  var messagesContent = imageContent.slice();
  messagesContent.push({ type: "text", text: userMessage });

  try {
    var response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: messagesContent }]
      })
    });

    if (!response.ok) {
      var errBody = await response.text();
      return {
        statusCode: response.status,
        headers: headers,
        body: JSON.stringify({
          error: "Anthropic API returned status " + response.status,
          details: errBody.substring(0, 500)
        })
      };
    }

    var data = await response.json();

    // Extract text from response
    var textContent = "";
    if (data.content && Array.isArray(data.content)) {
      for (var j = 0; j < data.content.length; j++) {
        if (data.content[j].text) {
          textContent += data.content[j].text;
        }
      }
    }

    // Clean and parse JSON
    var clean = textContent.replace(/```json/g, "").replace(/```/g, "").trim();

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      return {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({
          error: "AI returned invalid JSON. Try again.",
          preview: clean.substring(0, 200)
        })
      };
    }

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        success: true,
        analysis: parsed,
        usage: data.usage
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: "Function error: " + err.message })
    };
  }
};
