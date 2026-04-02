import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPORT_TEMPLATES = {
  cybercrime: {
    authority: "Cyber Crime Cell",
    format: "FIR Style",
    sections: ["Personal Details", "Incident Details", "Financial Loss", "Evidence", "Declaration"]
  },
  consumer: {
    authority: "Consumer Forum",
    format: "Consumer Complaint",
    sections: ["Complainant Details", "Opposite Party", "Facts of the Case", "Relief Sought", "Declaration"]
  },
  college: {
    authority: "College/University Grievance Cell",
    format: "Academic Grievance",
    sections: ["Student Details", "Institution Details", "Nature of Grievance", "Supporting Documents", "Declaration"]
  },
  company_hr: {
    authority: "Company HR Department",
    format: "Internal Complaint",
    sections: ["Employee Details", "Incident Details", "Impact", "Action Requested", "Declaration"]
  },
  rti: {
    authority: "RTI Authority",
    format: "RTI Application",
    sections: ["Applicant Details", "Public Authority", "Information Sought", "Period", "Declaration"]
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateType, incidentDescription, userDetails, incidentDate, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const template = REPORT_TEMPLATES[templateType as keyof typeof REPORT_TEMPLATES] || REPORT_TEMPLATES.consumer;

    const systemPrompt = `You are an expert in drafting formal complaints and reports for Indian authorities.

Generate a formal ${template.format} report for ${template.authority}.

User Details: ${JSON.stringify(userDetails || { name: "[YOUR NAME]", address: "[YOUR ADDRESS]", contact: "[YOUR CONTACT]" })}
Incident Date: ${incidentDate || "[DATE]"}
Location: ${location || "[LOCATION]"}
Incident Description: ${incidentDescription}

Create a properly formatted report with these sections: ${template.sections.join(", ")}

Return a JSON object with:
- title: string (report title)
- referenceFormat: string (suggested reference number format)
- sections: array of { heading: string, content: string }
- footer: string (closing statement and signature area)
- notes: array of important notes for the complainant

Use formal, legal language appropriate for ${template.authority}.
Include placeholders like [YOUR NAME] where user needs to fill in.
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
          { role: "user", content: `Generate a ${template.format} for this incident.` },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error("Report generation failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      result = {
        title: `${template.format} - ${template.authority}`,
        sections: [{ heading: "Details", content: incidentDescription }],
        footer: "Signature: _____________",
        notes: ["Please fill in all placeholders before submission"]
      };
    }

    result.templateType = templateType;
    result.authority = template.authority;
    result.format = template.format;

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Report Template Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
