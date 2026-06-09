exports.handler = async function(event, context) {
  // 1. Handle preflight browser checks (CORS safety)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { systemPrompt, messages } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // 2. Extra safety check if your key is missing in Netlify settings
    if (!apiKey) {
      console.error("ERROR: ANTHROPIC_API_KEY environment variable is missing!");
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "API key configuration missing on Netlify dashboard." })
      };
    }

    // 3. Request to Anthropic using modern global fetch
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022", // Updated to a stable standard identifier
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    // 4. Return response back to your HTML frontend
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Allows your HTML file to receive the text safely
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("SYSTEM ERROR:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to connect to Claude", details: error.message })
    };
  }
};
