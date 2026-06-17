import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      professor_id,
      professor_name,
      professor_focus,
      professor_style,
      message,
      user_name,
    } = await req.json();

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      // Graceful fallback when no API key is configured
      const fallbacks: Record<string, string> = {
        hope: "Thank you for sharing that with me. Recovery takes real courage, and reaching out is already a meaningful step. Remember: progress doesn't have to be perfect to be real. What's one small thing you can do in the next hour to take care of yourself?",
        insight: "What you're feeling makes sense given what you're going through. Emotions are information — not commands. When you notice a difficult feeling, try naming it specifically: not just 'bad' but 'anxious' or 'ashamed.' That naming creates a pause between feeling and reacting.",
        grace: "Your journey is held with care. Whatever brought you here today, know that growth often begins in exactly these uncertain moments. What would it look like to take one gentle step forward today?",
        bridge: "Family healing is a process, not an event. The fact that you're thinking about communication and connection shows real commitment. What's one conversation you've been avoiding that might benefit from a gentler approach?",
        nurture: "Parenting in recovery is one of the hardest and most important things you can do. You don't have to be perfect — you have to be present and honest. What does your child most need from you today?",
        prosper: "Financial recovery starts with one honest look at where you are — without shame. Every person who has rebuilt their finances started exactly where you are now. What's one thing you can track or adjust this week?",
        freedom: "Long-term recovery is built one day at a time, but planned one year at a time. Your maintenance plan is your most powerful tool. What trigger or pattern are you noticing lately that deserves attention?",
      };

      const reply = fallbacks[professor_id] || `Thank you for reaching out. I'm ${professor_name}, and I'm here to support your recovery journey. Your focus on ${professor_focus} is something we can work through together. What would be most helpful to explore right now?`;

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are ${professor_name}, an AI professor at ClearPath Recovery University.

Your focus area: ${professor_focus}
Your teaching style: ${professor_style}
The student's name: ${user_name || "Student"}

You are warm, trauma-informed, and evidence-based. You never shame or judge. You ask one follow-up question when appropriate. Keep responses concise — 2-4 sentences — unless the student needs more depth. You remember that recovery is personal and non-linear. Never recommend specific medications or replace clinical care. Always encourage professional support when appropriate.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm here with you. Take a breath — your next step can be small.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, reply: "I'm here with you. Your next step can be small — breathe, name one need, and return when ready." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
