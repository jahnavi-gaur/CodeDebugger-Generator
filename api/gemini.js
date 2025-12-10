export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { promptType, prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // 🔐 Secure key from Vercel Environment
  const apiKey = process.env.GEMINI_API_KEY;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  // Build system instruction based on type
  let systemInstruction = "";

  if (promptType === "generate") {
    systemInstruction = `You are a specialized code generation engine. ... (same text you already wrote)`;
  }
  else if (promptType === "explain") {
    systemInstruction = `Explain this code clearly:\n${prompt}`;
  }
  else if (promptType === "examples") {
    systemInstruction = `Give 5 useful coding tips for: ${prompt}`;
  }
  else if (promptType === "run") {
    systemInstruction = `Run this code and give only output: ${prompt}`;
  }
  else if (promptType === "debug") {
    systemInstruction = `Debug this code:\n${prompt}`;
  }

  const body = {
    contents: [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "user", parts: [{ text: prompt }] }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No valid response received.";

    return res.status(200).json({ response: result });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
