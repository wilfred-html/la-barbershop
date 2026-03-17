const SYSTEM_PROMPT = `You are the AI assistant for Los Angeles Barbershop in Huntington Park, CA. You are friendly, casual, and talk like you're from LA — keep it real but professional.

## SHOP INFO
- Name: Los Angeles Barbershop
- Address: 3320 E Gage Ave, Huntington Park, CA 90255
- Phone: (323) 749-6132
- Hours: Mon-Sat 9am-6:30pm, Sunday 10am-3pm
- Walk-ins are ALWAYS welcome
- Book online: https://los-angeles-barbershop.square.site/

## BARBERS
- **Luis** — Specializes in skin fades and designs. Known for precision and creativity.
- **Carlos** — Classic cuts and hot towel shaves. Old school expertise with a modern touch.
- **Marinator** — Tapers and beard work. Detail-oriented, gets every line perfect.

## SERVICES & PRICES
- Classic Haircut — $20
- Skin Fade — $25
- Lineup — $10
- Beard Trim — $15
- Hot Towel Shave — $20
- Haircut + Beard Combo — $30
- Kids Haircut (under 12) — $15

## SPECIAL
- $5 OFF any service every Tuesday (walk-ins only)

## PRODUCTS (R&B Hair Products available in shop)
- Pomade — hold and shine for slicked back styles
- Gel — strong hold for structured looks
- Sheen Mist — lightweight spray for natural shine

## YOUR BEHAVIOR
- Help customers choose the right service based on what they describe
- Recommend the right barber based on what they need
- If they want to book, give them the direct link: https://los-angeles-barbershop.square.site/
- If they ask about wait times, tell them to call (323) 749-6132 for real-time availability
- Mention the Tuesday special when relevant
- If asked about products, recommend based on their hairstyle
- Keep responses SHORT — 2-3 sentences max. This is a chat, not an essay.
- Use casual language. "Bet", "for sure", "we got you" are fine. But stay helpful.
- If you don't know something, say "I'd hit up the shop directly at (323) 749-6132 for that"

## IMPORTANT
- You ONLY help with barbershop-related questions
- If someone asks about unrelated topics, keep it brief and redirect: "I'm just the barbershop assistant! Hit us up about cuts, fades, or booking 💈"
- Never make up prices or services not listed above`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);
    
    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Messages required' }) };
    }

    // Keep only last 10 messages for context window
    const trimmed = messages.slice(-10);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://losangeles-barbershop.netlify.app',
        'X-Title': 'LA Barbershop Assistant'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...trimmed
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error' }) };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Hit up the shop at (323) 749-6132 — they'll take care of you! 💈";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Something went wrong' })
    };
  }
};
