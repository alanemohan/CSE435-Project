import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, description, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert on Indian government grievance redressal systems and complaint filing procedures.

Given the following complaint details:
- Category: ${category}
- Location: ${location || "India (general)"}
- Issue Description: ${description}

Provide the most accurate authority information. Return a JSON object with:
- primaryAuthority: {
    name: string (exact department name),
    portal: string (official website URL),
    portalName: string (website name),
    description: string (what they handle)
  }
- alternativeAuthorities: array of up to 2 alternative authorities with same structure
- filingSteps: array of 3-5 steps to file complaint
- documentsRequired: array of required documents
- expectedTimeline: string (typical response time)
- escalationPath: string (where to escalate if no response)
- helplineNumbers: array of relevant helpline numbers

Focus on OFFICIAL Indian government portals. Be specific and accurate.
Return ONLY valid JSON.`;

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
          { role: "user", content: `Find the appropriate authority for this issue: ${description}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("Authority lookup failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      // Fallback defaults
      result = {
        primaryAuthority: {
          name: "Consumer Forum",
          portal: "https://consumerhelpline.gov.in",
          portalName: "National Consumer Helpline",
          description: "Handle consumer grievances"
        },
        alternativeAuthorities: [],
        filingSteps: ["Visit the portal", "Register your complaint", "Provide details", "Submit and track"],
        documentsRequired: ["Identity proof", "Incident details"],
        expectedTimeline: "7-15 working days",
        escalationPath: "District Consumer Forum",
        helplineNumbers: ["1800-11-4000"]
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Authority Finder Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
