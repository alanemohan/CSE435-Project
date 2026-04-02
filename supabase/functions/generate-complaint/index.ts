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
    const { category, incidentDescription, incidentDate, location, serviceProvider, urgency, amountLost, hasEvidence, evidenceDescription, isProxyReport, proxyRelation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryAuthorities: Record<string, { authority: string; portal: string }> = {
      cybercrime: { authority: "Cyber Crime Cell / National Cyber Crime Reporting Portal", portal: "cybercrime.gov.in" },
      banking: { authority: "Banking Ombudsman / RBI Complaint Portal", portal: "cms.rbi.org.in" },
      telecom: { authority: "Telecom Regulatory Authority of India (TRAI)", portal: "trai.gov.in" },
      electricity: { authority: "State Electricity Regulatory Commission", portal: "State DISCOM website" },
      consumer: { authority: "Consumer Forum / National Consumer Helpline", portal: "consumerhelpline.gov.in" },
      college: { authority: "University Grievance Redressal Cell / UGC", portal: "ugc.ac.in" },
      insurance: { authority: "Insurance Ombudsman / IRDAI", portal: "igms.irda.gov.in" },
      real_estate: { authority: "RERA Authority / Consumer Forum", portal: "rera.gov.in (state-specific)" },
      transport: { authority: "Transport Department / Consumer Forum", portal: "consumerhelpline.gov.in" },
      healthcare: { authority: "State Medical Council / Consumer Forum", portal: "nmc.org.in" },
    };

    const auth = categoryAuthorities[category] || { authority: "Relevant Authority", portal: "Government Portal" };

    const systemPrompt = `You are an expert Indian legal complaint drafting AI. Generate a comprehensive, professional complaint letter.

Category: ${category}
Incident Date: ${incidentDate || "Not specified"}
Location: ${location || "Not specified"}
Service Provider: ${serviceProvider || "Not specified"}
Urgency Level: ${urgency || "medium"}
Amount Lost: ${amountLost ? "₹" + amountLost : "Not specified"}
Evidence Available: ${hasEvidence ? "Yes - " + (evidenceDescription || "Available") : "Not mentioned"}
${isProxyReport ? `Filed on behalf of: ${proxyRelation || "another person"}` : ""}

Return a JSON object with:
- subjectLine: string (formal subject line with reference to relevant act/section if applicable)
- formalComplaint: string (the full formal complaint letter with proper salutation, legal language, body with numbered paragraphs, relief sought, and closing. Include placeholder [YOUR NAME], [YOUR ADDRESS], [YOUR PHONE], [YOUR EMAIL])
- suggestedAuthority: string (primary authority to file with)
- suggestedPortal: string (online portal URL)
- legalReferences: array of strings (relevant Indian laws, acts, sections — e.g., "Information Technology Act, 2000 - Section 66C", "Consumer Protection Act, 2019 - Section 35")
- nextSteps: array of strings (actionable steps the complainant should take, in order)
- estimatedTimeline: string (expected resolution timeline based on category)
- alternativeAuthorities: array of strings (other bodies where complaint can be filed)

The complaint should:
- Use formal, legal language appropriate for Indian courts/authorities
- Reference relevant Indian laws and acts
- Be respectful but firm and legally sound
- Include all relevant details with numbered paragraphs
- Request specific relief/action
- Mention evidence if available
- Include a proper prayer clause
- End with "Yours faithfully" format

Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a formal complaint for:\n\n${incidentDescription}` },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      result = {
        subjectLine: "Formal Complaint",
        formalComplaint: "Could not generate complaint",
        suggestedAuthority: auth.authority,
        suggestedPortal: auth.portal,
        legalReferences: [],
        nextSteps: [],
        estimatedTimeline: "2-4 weeks",
        alternativeAuthorities: [],
      };
    }

    result.suggestedAuthority = result.suggestedAuthority || auth.authority;
    result.suggestedPortal = result.suggestedPortal || auth.portal;
    result.legalReferences = result.legalReferences || [];
    result.nextSteps = result.nextSteps || [];
    result.alternativeAuthorities = result.alternativeAuthorities || [];

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
