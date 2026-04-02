import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple hash function for anonymization
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Extract pattern features without storing actual content
function extractPatternFeatures(text: string): { hash: string; features: string[] } {
  const lowered = text.toLowerCase();
  
  // Extract structural features only
  const features: string[] = [];
  
  // Check for common scam patterns
  if (/urgent|immediately|within \d+ hours?/i.test(lowered)) features.push("urgency");
  if (/kyc|verify|update.*account/i.test(lowered)) features.push("kyc_request");
  if (/lottery|won|winner|prize/i.test(lowered)) features.push("lottery");
  if (/block|suspend|deactivate/i.test(lowered)) features.push("account_threat");
  if (/click.*link|tap.*here/i.test(lowered)) features.push("link_bait");
  if (/otp|code|password/i.test(lowered)) features.push("credential_request");
  if (/rs\.?|inr|lakh|crore/i.test(lowered)) features.push("money_mention");
  if (/bank|upi|paytm|phonepe|gpay/i.test(lowered)) features.push("payment_mention");
  if (/job|offer|salary|work from home/i.test(lowered)) features.push("job_scam");
  if (/courier|delivery|package/i.test(lowered)) features.push("delivery_scam");
  if (/refund|cashback|reward/i.test(lowered)) features.push("refund_bait");
  
  // Create hash from normalized features
  const featureString = features.sort().join("|");
  const lengthBucket = Math.floor(text.length / 100) * 100;
  const hashInput = `${featureString}|${lengthBucket}`;
  
  return {
    hash: simpleHash(hashInput),
    features
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageText, scamType, riskScore } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Only submit high-risk patterns
    if (riskScore < 50) {
      return new Response(
        JSON.stringify({ submitted: false, reason: "Risk score too low for pattern submission" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { hash, features } = extractPatternFeatures(messageText);
    
    if (features.length === 0) {
      return new Response(
        JSON.stringify({ submitted: false, reason: "No identifiable pattern features" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if pattern exists
    const { data: existing } = await supabase
      .from("scam_patterns")
      .select("id, similarity_count")
      .eq("pattern_hash", hash)
      .single();

    if (existing) {
      // Increment count
      await supabase
        .from("scam_patterns")
        .update({ 
          similarity_count: existing.similarity_count + 1,
          last_seen_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({ 
          submitted: true, 
          isNew: false, 
          similarityCount: existing.similarity_count + 1,
          patternFeatures: features
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Insert new pattern
      await supabase
        .from("scam_patterns")
        .insert({
          pattern_hash: hash,
          pattern_type: scamType || features[0] || "unknown",
          risk_category: riskScore >= 70 ? "high" : "medium",
          similarity_count: 1
        });

      return new Response(
        JSON.stringify({ 
          submitted: true, 
          isNew: true, 
          similarityCount: 1,
          patternFeatures: features
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Pattern Submission Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

