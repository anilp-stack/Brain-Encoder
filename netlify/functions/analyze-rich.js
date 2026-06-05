// netlify/functions/analyze-rich.js
// ADVantage Insights Brain Encoder - Rich strategic content

export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set." }) };

  try {
    const body = JSON.parse(event.body);
    const { frames, metadata } = body;
    if (!frames || !frames.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "No frames provided." }) };

    const meta = metadata || {};
    const isImage = meta.isImage || false;
    const duration = meta.duration_seconds || meta.video_duration || meta.duration || 30;
    const usedFrames = frames.slice(0, 1);

    const imageContent = usedFrames.map(f => ({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: f }
    }));

    const systemPrompt = `You are ADVantage Insights Brain Encoder - senior advertising strategist.

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble.

Analyzing ${usedFrames.length} frame from a ${isImage ? "static display/image ad" : `video ad (${duration.toFixed(1)}s)`}.
Brand: ${meta.brand || "Unknown"} | Client: ${meta.client || "Unknown"} | Campaign: ${meta.campaign || "Unknown"} | Agency: ${meta.agency || "Unknown"} | Type: ${meta.type || "video"} | Industry: ${meta.industry || "Not specified"} | Audience: ${meta.audience || "Not specified"} | Market: ${meta.market || "India"}

Return ONLY scenes, strategic_insights, and cmo_actions as a JSON object. No other fields.

Return this exact JSON structure:

{
  "scenes": [
    {
      "ts": "0:00-0:06",
      "name": "Scene Name",
      "desc": "2 sentence neural analysis",
      "attention": 0,
      "emotion": 0,
      "system_mode": "system1|system2|mixed",
      "cognitive_load": "low|medium|high|overload",
      "risk_flag": "none|drop_zone|ad_avoidance|cognitive_overload|pacing_issue",
      "badges": ["badge1", "badge2"]
    }
  ],
  "strategic_insights": [
    {
      "num": "01",
      "title": "Insight Title",
      "body": "2-3 sentences with advertising science context",
      "verdict": "Actionable verdict",
      "vtype": "risk|win|tip|watch"
    }
  ],
  "cmo_actions": [
    {
      "num": "01",
      "title": "Action Title",
      "body": "2 sentences with predicted outcome",
      "priority": "critical|high|medium|low",
      "impact": "Predicted metric improvement",
      "effort": "easy|medium|hard"
    }
  ]
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    let response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          system: systemPrompt,
          messages: [{
            role: "user",
            content: [...imageContent, {
              type: "text",
              text: `Generate rich strategic content for ${meta.brand || "this brand"}. ${meta.notes ? "Context: " + meta.notes : ""} Return ONLY the JSON.`
            }]
          }]
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: `Anthropic API error: ${response.status}`, details: errText }) };
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return { statusCode: 500, headers, body: JSON.stringify({ error: "JSON parse failed", raw: clean.substring(0, 400) }) }; }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, richData: parsed }) };

  } catch (err) {
    const isTimeout = err.name === "AbortError";
    return {
      statusCode: isTimeout ? 504 : 500,
      headers,
      body: JSON.stringify({ error: isTimeout ? "Analysis timed out. Try a shorter video or fewer frames." : err.message })
    };
  }
}
