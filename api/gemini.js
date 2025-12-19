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

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  // Build system instruction based on type
  let systemInstruction = "";

  if (promptType === "generate") {
    systemInstruction = `You are a specialized code generation engine. When a user asks for code, you will **ONLY** respond with the code enclosed in a single markdown code block (e.g., '''javascript...'''). Do not include any explanations, introductory text, or comments outside or inside the code block under any circumstances.`;
  }
  else if (promptType === "explain") {
    systemInstruction = `You are an expert programming instructor. Your task is to provide a comprehensive, step-by-step explanation of the provided code.
        Your explanation **MUST** be highly structured and follow these rules:
        1. Use clear Markdown **headings** (##) to separate sections.
        2. Use **bolding** to highlight key functions, variables, or concepts.
        3. Start with a **high-level summary** of what the code does.
        4. Provide a detailed, **line-by-line** or **section-by-section breakdown**.
        5. Conclude with a section on the code's **purpose** or **best use case**.
        6. The explanation must be informative, concise, and use appropriate technical terminology.

        The code to explain is:
        ${prompt}`;
  }
  else if (promptType === "examples") {
    systemInstruction = `
        Generate 5 short, useful prompt suggestions related to:
        "${prompt || "general programming"}"
        Return them as a simple numbered list.`;
  }
  else if (promptType === "run") {
    systemInstruction = 'You are a specialized code compiler.When user ask to run the code, you will compile the given code and provide the output as a response'
  }
  else if (promptType === "debug") {
    systemInstruction = `You are a code debugging assistant.
        Debug the following code and provide:

        1. A list of bugs found
        2. Corrected code
        3. Explanation of fixes

        --- CODE START ---
        ${prompt}
        --- CODE END ---
    `;
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}\n\n${prompt}` }]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    // console.log("Gemini raw response:", JSON.stringify(data, null, 2));
    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No valid response received.";

    return res.status(200).json({ response: result });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
