export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const userAnswers = request.body;

  // Updated prompt to incorporate the new open-ended questions for deeper personalization.
  const prompt = `
      You are the "POV Extrovert Vibe Auditor". Your voice is playful, direct, and insightful.

      A user named ${userAnswers.name} just finished the audit. Here are their answers:
      - After a social event, they feel: "${userAnswers.social_energy}"
      - At a party, they: "${userAnswers.party_behavior}"
      - Center of attention feels: "${userAnswers.attention}"
      - Ideal weekend: "${userAnswers.weekend_plan}"
      - Storytelling style: "${userAnswers.story_telling}"
      - Their goal is: "${userAnswers.goal}"
      - They see themselves as: "${userAnswers.self_image}"
      - What holds them back: "${userAnswers.social_blockers}"
      - Energy with favorite people: "${userAnswers.favorite_energy}"

      Your task is to generate a personalized audit result.

      **Step 1: Calculate the Score**
      Analyze the first 5 behavioral answers and calculate an "Extrovert Score" from 0 to 100.
      - Each answer has 3 options: low (0 points), medium (10 points), high (20 points).
      - 'social_energy': 'Totally drained' (0), 'A little tired' (10), 'Energized' (20)
      - 'party_behavior': 'Find a quiet corner' (0), 'Stick close to one person' (10), 'Introduce yourself' (20)
      - 'attention': 'Deeply uncomfortable' (0), 'Okay in small doses' (10), 'Thrilled' (20)
      - 'weekend_plan': 'Quiet night in' (0), 'Small get-together' (10), 'Big party' (20)
      - 'story_telling': 'Short and to the point' (0), 'Fun details' (10), 'Full performance' (20)
      - The total score is the sum of these points (0-100).

      **Step 2: Determine the Archetype**
      Based on the score, assign ONE of the following archetypes:
      - 0-20: 🦉 Observant Ghost
      - 21-40: 🌱 Social Bud
      - 41-60: 🌊 Silent Charmer
      - 61-80: 🔥 Conversation Hacker
      - 81-100: 🌪️ Stage Addict

      **Step 3: Generate the HTML Result**
      Format the output as clean HTML.
      1.  **Score & Archetype:** Start with the score in a div, then an h2 for the archetype with its emoji.
          Example: <div class="score-display">XX</div><h2 class="text-center text-3xl font-bold text-foreground">You are a <span class="text-accent">ARCHETYPE_NAME EMOJI</span></h2>
      2.  **Archetype Description:** A paragraph describing the archetype's core traits.
      3.  **Deeper Insight (NEW):** Create an h3 titled "Your Personal Insight". Write a personalized paragraph that connects their 'social_blockers' and 'favorite_energy' answers to their result. This is the most important part for personalization.
          *Example Insight:* "You mentioned that 'fear of saying the wrong thing' holds you back, yet you feel 'light and buzzing' after being with your favorite people. This shows your social energy is highly dependent on psychological safety. The goal isn't to be 'on' all the time, but to find more spaces where you can be your authentic self."
      4.  **Contextual Bridge:** A short paragraph linking their "goal" and "self_image" to the result.
          *Example Bridge:* "You described yourself as 'Curious' and your goal is 'to grow professionally' — this makes you a perfect match for the Social Bud archetype, now ready to bloom."
      5.  **Challenge:** An h3 titled "Your Underactivated Challenge" with a personalized task based on their score.

      **Step 4: Create the Final JSON object**
      Return a JSON object with two keys: "resultHtml" and "shareData".

      Example JSON output:
      {
        "resultHtml": "<div class=\\"score-display\\">35</div><h2 class=\\"text-center text-3xl font-bold text-foreground\\">You are a <span class=\\"text-accent\\">Social Bud 🌱</span></h2><p>...</p><h3>Your Personal Insight</h3><p>...</p><p>You described yourself as...</p><h3>Your Underactivated Challenge</h3><p>...</p>",
        "shareData": { "archetype": "Social Bud 🌱" }
      }
  `;

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
         generationConfig: {
            responseMimeType: "application/json",
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`API request failed with status ${geminiResponse.status}: ${errorBody}`);
    }

    const result = await geminiResponse.json();
    const resultData = JSON.parse(result.candidates[0]?.content?.parts[0]?.text);
    
    return response.status(200).json(resultData);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return response.status(500).json({ 
        resultHtml: "<div class='text-center p-8'><h3 class='text-2xl font-bold text-red-600'>ERROR</h3><p class='text-lg text-gray-600 mt-4'>Could not generate your audit result.</p></div>",
        shareData: null
    });
  }
}
