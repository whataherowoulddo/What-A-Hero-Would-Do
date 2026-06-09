exports.handler = async function(event, context) {
  // 1. Handle browser pre-checks gracefully
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

    // 2. Alert you via Netlify logs if your key is missing in your settings
    if (!apiKey) {
      console.error("CRITICAL CONFIG ERROR: Your ANTHROPIC_API_KEY is missing from Netlify settings!");
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "API Key missing in Netlify dashboard environment variables." })
      };
    }

    // 3. Requesting Claude using a clean, active, upgraded model string
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6", // Upgraded to the standard active model structure
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    // 4. Return the outcome to your HTML page
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("LOGGED REJECTION:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to connect to Claude", details: error.message })
    };
  }
};
