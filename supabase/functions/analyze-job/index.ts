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
    const { offerText, companyName, senderEmail, jobTitle, salaryOffered, jobLocation, platform, contactPhone } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert job offer verification AI specializing in the Indian job market. Perform a thorough analysis.

Company: ${companyName || "Not provided"}
Sender email: ${senderEmail || "Not provided"}
Job title: ${jobTitle || "Not provided"}
Salary offered: ${salaryOffered ? "₹" + salaryOffered + "/year" : "Not provided"}
Job location: ${jobLocation || "Not provided"}
Source platform: ${platform || "Not provided"}
Contact phone: ${contactPhone || "Not provided"}

Return a JSON object with:
- riskScore: number 0-100 (higher = more suspicious)
- suspiciousIndicators: array of strings listing red flags found
- verificationSteps: array of strings with actionable steps to verify authenticity
- companyDomainMatch: boolean (if email domain matches expected company domain)
- salaryAnalysis: string (analyze if salary is realistic for the role, location, and Indian market)
- overallAssessment: string (brief overall verdict)
- companyReputation: string (analysis of company legitimacy based on name/details provided)
- jobMarketComparison: string (how this offer compares to typical market conditions)
- communicationRedFlags: array of strings (language/tone issues: urgency, poor grammar, informal WhatsApp/Telegram outreach for senior roles, etc.)
- legitimacyChecklist: array of objects {item: string, status: "pass"|"fail"|"warning"} checking:
  - Professional email domain
  - Detailed job description
  - Realistic salary range
  - No upfront payment required
  - Proper company identification
  - Standard interview process mentioned
  - Official communication channel

Check for: unrealistic salary, registration/internship/training fees, vague job descriptions, pressure tactics, unprofessional language, mismatched domains, WhatsApp/Telegram-only communication for major companies, too-good-to-be-true offers, requests for personal documents before interview.

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
          { role: "user", content: `Analyze this job offer:\n\n${offerText}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      result = {
        riskScore: 50,
        suspiciousIndicators: [],
        verificationSteps: [],
        companyDomainMatch: true,
        salaryAnalysis: "",
        overallAssessment: "Could not analyze",
        companyReputation: "",
        jobMarketComparison: "",
        communicationRedFlags: [],
        legitimacyChecklist: [],
      };
    }

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
