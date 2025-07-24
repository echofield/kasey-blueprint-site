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

      Your task is to generate a personalized system map. Format the output as clean HTML using only <h2>, <h3>, <p>, and <strong> tags. Do not use Markdown.

      **System Map Structure:**
      1.  **Main Title (h2):** ${userAnswers.name}’s $10K/Month Solo CEO System Map
      2.  **Where You Stand Now (h3):** A one-paragraph, low-key assessment. Frame it like this, adapted to their situation: "Based on your answers, you’re in what I call the Builder’s Threshold — you’ve moved beyond the guessing game, but your systems still rely too much on willpower. That’s not a flaw, it’s a signal: you’re ready to step into structure that supports your genius instead of draining it."
      3.  **The 3-System Model (h3):** Break down their business into 3 essential systems they need: Client Attraction, Offer Structure, and Delivery Engine. Provide a short paragraph for each.
      4.  **The Next Move (h3):** Give them 1 clear, strategic next step.
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
