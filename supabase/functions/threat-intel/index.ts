import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Free threat intelligence APIs (no API key required)
async function checkURLhaus(url: string) {
  try {
    const resp = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `url=${encodeURIComponent(url)}`,
    });
    const data = await resp.json();
    return {
      source: "URLhaus (abuse.ch)",
      found: data.query_status === "ok",
      threat: data.threat || null,
      tags: data.tags || [],
      status: data.url_status || null,
      dateAdded: data.date_added || null,
    };
  } catch (e) {
    console.error("URLhaus error:", e);
    return { source: "URLhaus", found: false, error: true };
  }
}

async function checkThreatFox(query: string) {
  try {
    const resp = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "search_ioc", search_term: query }),
    });
    const data = await resp.json();
    return {
      source: "ThreatFox (abuse.ch)",
      found: data.query_status === "ok" && data.data?.length > 0,
      threats: data.data?.slice(0, 5)?.map((d: any) => ({
        type: d.ioc_type,
        threat: d.threat_type,
        malware: d.malware_printable,
        confidence: d.confidence_level,
      })) || [],
    };
  } catch (e) {
    console.error("ThreatFox error:", e);
    return { source: "ThreatFox", found: false, error: true };
  }
}

async function getRecentURLhausThreats() {
  try {
    const resp = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "limit=25",
    });
    const data = await resp.json();
    return data.urls?.slice(0, 25) || [];
  } catch (e) {
    console.error("URLhaus recent error:", e);
    return [];
  }
}

async function getRecentThreatFoxIOCs() {
  try {
    const resp = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
    });
    const data = await resp.json();
    return data.data?.slice(0, 25) || [];
  } catch (e) {
    console.error("ThreatFox IOCs error:", e);
    return [];
  }
}

async function getPhishStatsRecent() {
  try {
    const resp = await fetch("https://phishstats.info:2096/api/phishing?_sort=-date&_size=20");
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("PhishStats error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "check_url";

    if (action === "check_url") {
      // Check a specific URL against threat databases
      const { url } = body;
      if (!url) {
        return new Response(
          JSON.stringify({ error: "URL is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [urlhaus, threatfox] = await Promise.all([
        checkURLhaus(url),
        checkThreatFox(url),
      ]);

      const isMalicious = urlhaus.found || threatfox.found;

      return new Response(
        JSON.stringify({
          url,
          is_malicious: isMalicious,
          risk_level: isMalicious ? "high" : "unknown",
          sources: [urlhaus, threatfox],
          checked_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "recent_threats") {
      // Fetch recent threats from all sources
      const [urlhausThreats, threatfoxIOCs, phishStats] = await Promise.all([
        getRecentURLhausThreats(),
        getRecentThreatFoxIOCs(),
        getPhishStatsRecent(),
      ]);

      return new Response(
        JSON.stringify({
          urlhaus: {
            source: "URLhaus (abuse.ch)",
            description: "Malware URL database",
            count: urlhausThreats.length,
            threats: urlhausThreats.map((t: any) => ({
              url: t.url,
              status: t.url_status,
              threat: t.threat,
              tags: t.tags,
              date_added: t.dateadded,
              reporter: t.reporter,
            })),
          },
          threatfox: {
            source: "ThreatFox (abuse.ch)",
            description: "IOC sharing platform",
            count: threatfoxIOCs.length,
            iocs: threatfoxIOCs.map((i: any) => ({
              ioc: i.ioc,
              type: i.ioc_type,
              threat_type: i.threat_type,
              malware: i.malware_printable,
              confidence: i.confidence_level,
              first_seen: i.first_seen_utc,
            })),
          },
          phishstats: {
            source: "PhishStats",
            description: "Phishing URL intelligence",
            count: phishStats.length,
            phishing: phishStats.map((p: any) => ({
              url: p.url,
              ip: p.ip,
              title: p.title,
              score: p.score,
              date: p.date,
              country: p.countrycode,
            })),
          },
          fetched_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'check_url' or 'recent_threats'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Threat intel error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
