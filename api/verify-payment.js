export const config = { maxDuration: 10 };

import { createHmac, randomBytes } from "crypto";

const PLANS = {
  single: { credits: 1 },
  starter: { credits: 5 },
  growth: { credits: 10 },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      email,
      amount
    } = req.body;

    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Required environment variables not set");
    }
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan" });

    const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed. Contact support@adcritiq.com" });
    }

    const token = randomBytes(12).toString("hex");

    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/credits`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        email: email || "unknown@adcritiq.com",
        token,
        credits_remaining: PLANS[plan].credits,
        plan_type: plan,
        razorpay_order_id,
        razorpay_payment_id,
        amount_paid: amount || 0
      })
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      throw new Error(`Credit record creation failed: ${errText}`);
    }

    return res.status(200).json({
      success: true,
      token,
      credits: PLANS[plan].credits,
      plan
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
