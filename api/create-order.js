export const config = { maxDuration: 10 };

const PLANS = {
  single: { credits: 1, amount: 29900, label: "Single Analysis" },
  starter: { credits: 5, amount: 99900, label: "Starter Pack (5 analyses)" },
  growth: { credits: 10, amount: 179900, label: "Growth Pack (10 analyses)" },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error("Razorpay keys not configured");

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: PLANS[plan].amount,
        currency: "INR",
        receipt: `adcritiq_${plan}_${Date.now()}`,
        notes: { plan, credits: String(PLANS[plan].credits) }
      })
    });

    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(order.error?.description || "Razorpay order creation failed");

    return res.status(200).json({
      order_id: order.id,
      amount: PLANS[plan].amount,
      currency: "INR",
      plan,
      credits: PLANS[plan].credits,
      label: PLANS[plan].label
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
