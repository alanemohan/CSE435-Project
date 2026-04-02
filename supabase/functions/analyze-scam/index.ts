import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messageType, watchlistMatches } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract URLs and phone numbers
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const detectedUrls = message.match(urlRegex) || [];
    const detectedPhones = message.match(phoneRegex) || [];

    // Check detected URLs against real threat intelligence databases
    let threatIntelResults: any[] = [];
    if (detectedUrls.length > 0) {
      const urlChecks = detectedUrls.slice(0, 3).map(async (url: string) => {
        try {
          // Check URLhaus
          const urlhausResp = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `url=${encodeURIComponent(url)}`,
          });
          const urlhausData = await urlhausResp.json();

          return {
            url,
            urlhaus_match: urlhausData.query_status === "ok",
            threat: urlhausData.threat || null,
            tags: urlhausData.tags || [],
          };
        } catch {
          return { url, urlhaus_match: false, error: true };
        }
      });
      threatIntelResults = await Promise.all(urlChecks);
    }

    const maliciousUrls = threatIntelResults.filter((r) => r.urlhaus_match);
    const threatContext = maliciousUrls.length > 0
      ? `\n\nREAL THREAT INTELLIGENCE: The following URLs were found in the URLhaus malware database: ${maliciousUrls.map((u) => `${u.url} (threat: ${u.threat}, tags: ${u.tags?.join(",")})`).join("; ")}. This is confirmed malicious - set risk score to 90+.`
      : threatIntelResults.length > 0
      ? `\n\nThreat intelligence check: URLs were checked against URLhaus database and were NOT found in known malware lists. This doesn't mean they're safe.`
      : "";

    const systemPrompt = `You are a scam detection AI with access to real-time threat intelligence data. Analyze the following ${messageType} message for scam indicators.

Return a JSON object with these fields:
- riskScore: number 0-100 (higher = more dangerous)
- scamType: string (e.g., "UPI Fraud", "Fake Delivery", "KYC Scam", "Lottery Scam", "Job Scam", "Banking Alert Scam", "Phishing", "OTP Fraud", "Loan Scam", "Impersonation", "Unknown")
- redFlags: array of strings listing suspicious elements
- safetyAdvice: array of strings with what NOT to do
- manipulationTactics: array of strings (e.g., "urgency", "fear", "reward bait", "authority impersonation")
- threatIntelMatch: boolean (true if URLs matched known threat databases)
- dataSources: array of strings listing which databases were checked (e.g., "URLhaus", "ThreatFox")

Consider these watchlist keyword matches found: ${watchlistMatches?.join(", ") || "none"}
If watchlist keywords are found, increase risk score by 15-25 points.

Detected URLs: ${detectedUrls.join(", ") || "none"}
Detected phone numbers: ${detectedPhones.length} found
${threatContext}

Be thorough but concise. Return ONLY valid JSON.`;

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
          { role: "user", content: `Analyze this message:\n\n${message}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
        scamType: "Unknown",
        redFlags: ["Could not parse AI response"],
        safetyAdvice: ["Exercise caution"],
        manipulationTactics: [],
      };
    }

    return new Response(
      JSON.stringify({
        ...result,
        detectedUrls,
        detectedPhones,
        threatIntelResults,
        dataSources: ["Lovable AI (Gemini)", "URLhaus (abuse.ch)"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
