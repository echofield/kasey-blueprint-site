export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const userAnswers = request.body;

  const prompt = `
    You are "The Solo CEO Agent," an AI with the voice of Kasey Jones (warm authority, tough love, no fluff, like "Jocko Willink if he cared about your nervous system").
    A potential client named ${userAnswers.name} has just completed your diagnostic. Their data is:
    - Role: ${userAnswers.role}
    - Experience: ${userAnswers.experience}
    - Offer: ${userAnswers.offer}
    - Biggest Bottleneck: ${userAnswers.bottleneck}
    - Current System State: ${userAnswers.system_clarity}
    - Desired Fix: ${userAnswers.magic_wand}

    Your task is to generate a personalized system map. Format the output as clean HTML using only <h2>, <h3>, <p>, and <strong> tags.

    SYSTEM MAP STRUCTURE:
    1. <h2>: ${userAnswers.name}’s $10K/Month Solo CEO System Map
    2. <h3>: Where You Stand Now – give a one-paragraph low-key assessment.
    3. <h3>: The 3-System Model – with short paragraphs for:
       - Client Attraction
       - Offer Structure
       - Delivery Engine
    4. <h3>: The Next Move – one clear strategic step.

    IMPORTANT: Do NOT include any markdown, code blocks, triple backticks, or language annotations. Return ONLY raw HTML. The response MUST begin with <h2> and end with </p>. No explanations, no comments, no formatting — just HTML tags.
  `;

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`API request failed with status ${geminiResponse.status}`);
    }

    const result = await geminiResponse.json();
    const blueprintHtml = result.candidates[0]?.content?.parts[0]?.text || "<h3>Error</h3><p>Could not generate blueprint.</p>";
    
    return response.status(200).json({ blueprintHtml });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return response.status(500).json({ message: "Failed to generate blueprint." });
  }
}
