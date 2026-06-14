import { useEffect, useRef, useState } from "react";

const SUGGESTED_QUESTIONS = [
  "Why is purchase intent at risk?",
  "What should I fix before media spend?",
  "What is creative-led vs media-dependent risk?",
  "How does this compare with my saved brand history?",
  "Which platform outcome is strongest?",
];

const INITIAL_MESSAGE = {
  role: "neuriq",
  content: "I've analysed this creative in full. Ask me anything — scores, platform fit, what to fix first, or how this compares to category benchmarks.",
};

export default function NeurIQTab({ results, C, privateContext = null, contextLoading = false }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dots, setDots] = useState(".");
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setDots(".");
      return undefined;
    }
    const sequence = [".", "..", "..."];
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % sequence.length;
      setDots(sequence[i]);
    }, 300);
    return () => clearInterval(timer);
  }, [loading]);

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message || loading) return;

    const userMessage = { role: "user", content: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/neuroiq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.slice(-10),
          analysisContext: JSON.stringify(results),
          privateContext,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.reply) throw new Error(data.error || "NeurIQ failed");
      setMessages((prev) => [...prev, { role: "neuriq", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "neuriq", content: "NeurIQ™ encountered an issue. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const chipStyle = {
    padding: "8px 16px",
    background: C.s2,
    border: `1px solid ${C.border2}`,
    borderRadius: 100,
    fontSize: 12,
    color: C.text,
    opacity: loading ? 0.6 : 0.8,
    cursor: loading ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
    outline: "none",
    fontFamily: "'DM Sans',sans-serif",
  };

  const labelBase = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "'DM Mono',monospace",
  };

  const hasRepositoryContext = (privateContext?.repository_summary || []).length > 0;
  const hasCalibrationContext = (privateContext?.calibration_summary?.count || 0) > 0;
  const contextLabel = contextLoading
    ? "Loading private context"
    : hasCalibrationContext
      ? "Current report + calibration memory"
      : hasRepositoryContext
        ? "Current report + private repository"
        : "Current report only";
  const contextColor = hasCalibrationContext ? C.green : hasRepositoryContext ? C.gold : C.dim;

  return (
    <div style={{ background: C.s1, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ padding: "32px 40px 20px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 4, color: C.gold, textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>
          Powered by NeurIQ™
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", fontFamily: "'Playfair Display',serif" }}>NeurIQ™</h2>
          <div style={{
            fontSize: 10,
            color: contextColor,
            background: `${contextColor}12`,
            border: `1px solid ${contextColor}44`,
            borderRadius: 999,
            padding: "5px 10px",
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 800,
          }}>
            {contextLabel}
          </div>
        </div>
        <div style={{ fontSize: 14, color: C.dim }}>Ask your AI creative intelligence</div>
      </div>

      <div style={{ padding: "0 40px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            disabled={loading}
            onClick={() => sendMessage(question)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.background = `${C.gold}14`;
              e.currentTarget.style.color = C.text;
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border2;
              e.currentTarget.style.background = C.s2;
              e.currentTarget.style.color = C.text;
              e.currentTarget.style.opacity = loading ? "0.6" : "0.8";
            }}
            style={chipStyle}
          >
            {question}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: C.border, margin: "0 40px" }} />

      <div ref={messagesRef} style={{ padding: "20px 40px", minHeight: 300, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div key={`${message.role}-${index}`} style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: isUser ? "75%" : "80%", animation: "fadeUp 0.25s ease both" }}>
              <div style={{ ...labelBase, color: isUser ? C.dim : C.gold, textAlign: isUser ? "right" : "left" }}>
                {isUser ? "You" : "NeurIQ™"}
              </div>
              <div
                style={{
                  background: isUser
                    ? C.s3
                    : `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), ${C.s2}`,
                  border: isUser ? `1px solid ${C.border2}` : `1px solid ${C.border}`,
                  borderTop: isUser ? undefined : "1px solid rgba(255,255,255,0.08)",
                  borderLeft: isUser ? undefined : `2px solid ${C.gold}`,
                  borderRadius: isUser ? "10px 0 10px 10px" : "0 10px 10px 10px",
                  padding: "12px 16px",
                  fontSize: 14,
                  color: isUser ? C.dim : C.text,
                  lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                  boxShadow: isUser ? "none" : "0 8px 32px rgba(0,0,0,0.35)",
                  backdropFilter: isUser ? undefined : "blur(12px)",
                  WebkitBackdropFilter: isUser ? undefined : "blur(12px)",
                }}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
            <div style={{ ...labelBase, color: C.gold }}>NeurIQ™</div>
            <div style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), ${C.s2}`, border:`1px solid ${C.border}`, borderLeft: `2px solid ${C.gold}`, borderTop:"1px solid rgba(255,255,255,0.08)", borderRadius: "0 10px 10px 10px", padding: "14px 18px", fontSize: 14, color: C.text, lineHeight: 1.75, boxShadow:"0 8px 32px rgba(0,0,0,0.35)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.gold,
                      animation: `pulse 1s ease-in-out ${i * 0.18}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.border, margin: "0 40px" }} />

      <div style={{ padding: "16px 40px 24px", display: "flex", gap: 10 }}>
        <textarea
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask NeurIQ™ anything about this analysis..."
          rows={1}
          style={{
            flex: 1,
            background: C.s2,
            border: `1px solid ${focused ? C.gold : C.border2}`,
            borderRadius: 8,
            padding: "13px 16px",
            color: C.text,
            fontSize: 14,
            outline: "none",
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: 46,
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          disabled={loading || !input.trim()}
          onClick={() => sendMessage(input)}
          style={{
            background: C.gold,
            color: C.bg,
            border: "none",
            borderRadius: 8,
            padding: "13px 24px",
            fontWeight: 700,
            fontSize: 14,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            letterSpacing: 0.5,
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Send →
        </button>
      </div>
    </div>
  );
}
