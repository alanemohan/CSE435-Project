import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGUAGES: Record<string, string> = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, targetLanguage, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage] || "Hindi";

    const systemPrompt = `You are a translator specializing in translating safety and scam awareness content into ${languageName}.

Translate the following ${contentType || "content"} into ${languageName}. 
- Keep the translation natural and easy to understand for common people
- Maintain the urgency and importance of safety warnings
- Use simple, everyday language
- Preserve bullet points and formatting
- If there are technical terms, explain them simply

Return ONLY the translated text, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("Translation failed");
    }

    const aiResponse = await response.json();
    const translatedContent = aiResponse.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        translatedContent,
        language: languageName,
        languageCode: targetLanguage
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
