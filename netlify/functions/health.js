exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "ok",
      message: "Brain Encoder functions are live",
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString()
    })
  };
};
