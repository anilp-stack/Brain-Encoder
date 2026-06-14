export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "No API key" });

  try {
    const { message, history = [], analysisContext = "", privateContext = null } = req.body;
    if (!message) return res.status(400).json({ error: "No message" });

    const methodologyContext = `AdCritIQ methodology: memory encoding and brand recall indicate spontaneous/aided awareness readiness; brand prominence and attention-brand coupling protect mental availability; hook strength, hold rate, and sustained attention indicate VTR/completion readiness; CTA clarity, message clarity, product desire, and trust indicate CTR, consideration, and purchase-intent readiness; platform fit adjusts outcomes by environment, sound-on/off behavior, duration, and format suitability; calibration memory indicates whether prior forecasts over- or under-estimated actual outcomes. Scores are creative-response probabilities, not guaranteed lift. TRIBE v2 is used as published fMRI-informed calibration, not live biometric measurement.`;
    const compactPrivateContext = privateContext ? JSON.stringify(privateContext).slice(0, 3500) : "";

    const systemPrompt = `You are NeurIQ™, the AI intelligence layer of AdCritIQ™.
You have full access to the neural analysis for this ad creative.
Answer the user's questions about this analysis with precision, business insight, and authority.
Always reference specific scores and metric names in your answers.
Frame everything in marketing and CMO terms — never use technical AI jargon.
Be concise: 2-4 sentences per answer unless the question clearly needs more depth.
If asked about improvements, reference the CMO Playbook actions.
If asked about platform fit, reference the platform scores.
If asked about what to fix first, reference the P1 priority CMO actions.
If private repository, calibration, or Brand DNA context is present, use it only as supporting context. Do not imply access to data outside the provided private context.
Do not reveal that you are Claude or that this uses Anthropic API.
You are NeurIQ™. Speak with authority.

METHODOLOGY CONTEXT:
${methodologyContext}

PRIVATE CONTEXT SUMMARY:
${compactPrivateContext || "No private repository context provided."}

FULL ANALYSIS DATA:
${analysisContext}`;

    // Fix: Anthropic Messages API requires the conversation to start with role "user".
    // The initial NeurIQ welcome message (role:"neuriq") maps to "assistant" and causes a 400
    // on the very first user question. Strip any leading assistant messages from history.
    const mappedHistory = (history || [])
      .slice(-10)
      .map(h => ({ role: h.role === "neuriq" ? "assistant" : "user", content: h.content }));
    const firstUserIdx = mappedHistory.findIndex(m => m.role === "user");
    const validHistory = firstUserIdx >= 0 ? mappedHistory.slice(firstUserIdx) : [];
    const messages = [...validHistory, { role: "user", content: message }];

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: systemPrompt,
        messages
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(resp.status).json({ error: `API ${resp.status}: ${t.substring(0, 150)}` });
    }

    const data = await resp.json();
    const reply = (data.content || []).map(c => c.text || "").join("").trim();
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
