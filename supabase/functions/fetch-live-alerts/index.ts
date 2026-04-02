import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fetch real threat data from free public APIs
async function fetchURLhausRecent() {
  try {
    const resp = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "limit=15",
    });
    const data = await resp.json();
    return (data.urls || []).map((t: any) => ({
      source: "URLhaus",
      url: t.url,
      threat: t.threat || "malware",
      tags: t.tags || [],
      date: t.dateadded,
      status: t.url_status,
    }));
  } catch (e) {
    console.error("URLhaus error:", e);
    return [];
  }
}

async function fetchPhishStats() {
  try {
    const resp = await fetch("https://phishstats.info:2096/api/phishing?_sort=-date&_size=15");
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data.map((p: any) => ({
      source: "PhishStats",
      url: p.url,
      title: p.title,
      ip: p.ip,
      score: p.score,
      date: p.date,
      country: p.countrycode,
    }));
  } catch (e) {
    console.error("PhishStats error:", e);
    return [];
  }
}

async function fetchThreatFoxRecent() {
  try {
    const resp = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
    });
    const data = await resp.json();
    return (data.data || []).slice(0, 15).map((i: any) => ({
      source: "ThreatFox",
      ioc: i.ioc,
      type: i.ioc_type,
      threat: i.threat_type,
      malware: i.malware_printable,
      confidence: i.confidence_level,
      date: i.first_seen_utc,
    }));
  } catch (e) {
    console.error("ThreatFox error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const aiGatewayApiKey = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!aiGatewayApiKey) throw new Error("AI_GATEWAY_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch real-world threat data from multiple free APIs in parallel
    const [urlhausData, phishStatsData, threatFoxData] = await Promise.all([
      fetchURLhausRecent(),
      fetchPhishStats(),
      fetchThreatFoxRecent(),
    ]);

    const totalRealThreats = urlhausData.length + phishStatsData.length + threatFoxData.length;
    console.log(`Fetched ${totalRealThreats} real threats from 3 APIs`);

    // Build a summary of real threats for AI context
    const threatSummary = {
      urlhaus_malware: urlhausData.slice(0, 5).map((t: any) => `${t.threat} targeting ${t.url?.substring(0, 50)}`).join("; "),
      phishing_sites: phishStatsData.slice(0, 5).map((p: any) => `${p.title || p.url?.substring(0, 50)} (${p.country || "unknown"})`).join("; "),
      threatfox_iocs: threatFoxData.slice(0, 5).map((i: any) => `${i.malware || i.threat} via ${i.type}`).join("; "),
    };

    const today = new Date().toISOString().split("T")[0];
    const prompt = `You are a cybersecurity threat intelligence analyst. Using the REAL threat data below from live APIs, generate exactly 10 scam/threat alerts for Indian and global users as of ${today}.

REAL-TIME THREAT DATA FROM LIVE APIS:
- URLhaus Malware URLs (${urlhausData.length} found): ${threatSummary.urlhaus_malware}
- PhishStats Phishing Sites (${phishStatsData.length} found): ${threatSummary.phishing_sites}
- ThreatFox IOCs (${threatFoxData.length} found): ${threatSummary.threatfox_iocs}

Based on this REAL data, create 10 alerts that:
1. Reference actual threat patterns from the data above
2. Translate technical threats into user-friendly warnings
3. Include specific details like app names, bank names, URL patterns being exploited
4. Cover Indian-specific scams (UPI, KYC, Aadhaar) alongside global threats

Return ONLY a valid JSON array with exactly 10 objects:
- "title": string (specific, referencing real patterns e.g. "Malware Campaign Targeting Banking Apps via SMS Links")
- "description": string (2-3 sentences with specifics from real data, actionable advice)
- "alert_type": one of "phishing", "job_scam", "loan_scam", "impersonation", "otp_fraud"
- "severity": one of "high", "medium", "low"
- "region": string (e.g. "Pan India", "Global", "South Asia")
- "reported_count": number 100-8000
- "data_sources": array of strings (which APIs this alert is based on, e.g. ["URLhaus", "PhishStats"])

Mix: at least 3 high, 4 medium, 3 low. Mix all alert_types.
Return ONLY the JSON array.`;

    const aiResponse = await fetch(Deno.env.get("AI_GATEWAY_URL")!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiGatewayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API failed [${aiResponse.status}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let alertsJson: any[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      alertsJson = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI-generated alerts");
    }

    if (!Array.isArray(alertsJson) || alertsJson.length === 0) {
      throw new Error("AI returned empty alerts");
    }

    // Clear old and insert fresh
    await supabase.from("community_alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const now = new Date().toISOString();
    const alertsToInsert = alertsJson.map((a: any) => ({
      title: String(a.title || "Unknown Alert"),
      description: String(a.description || "") + (a.data_sources?.length ? ` [Sources: ${a.data_sources.join(", ")}]` : ""),
      alert_type: ["phishing", "job_scam", "loan_scam", "impersonation", "otp_fraud"].includes(a.alert_type) ? a.alert_type : "phishing",
      severity: ["high", "medium", "low"].includes(a.severity) ? a.severity : "medium",
      region: a.region || "Pan India",
      reported_count: typeof a.reported_count === "number" ? a.reported_count : 100,
      is_active: true,
      first_reported_at: now,
      last_reported_at: now,
    }));

    const { error: insertError } = await supabase.from("community_alerts").insert(alertsToInsert);
    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        count: alertsToInsert.length,
        real_data_sources: {
          urlhaus: urlhausData.length,
          phishstats: phishStatsData.length,
          threatfox: threatFoxData.length,
        },
        updated_at: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

