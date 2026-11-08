import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function cleanDomain(input?: string): string {
  if (!input) return "";
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^www\./i, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  return d;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Authenticate caller (Must be a logged-in admin user)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Invalid or expired session token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, action = "enrich", domain, company, personTitles } = body;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing Apollo.io API key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey,
    };

    // Action 1: Test Connection
    if (action === "test") {
      const testRes = await fetch(
        "https://api.apollo.io/api/v1/mixed_people/api_search?per_page=1",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ per_page: 1 }),
        }
      );

      if (!testRes.ok) {
        const errText = await testRes.text();
        return new Response(
          JSON.stringify({
            success: false,
            status: testRes.status,
            error: `Apollo verification failed (${testRes.status}): ${errText}`,
          }),
          { status: testRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Apollo API key is valid and connected!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action 2: Enrich Company Decision-Maker
    const targetDomain = cleanDomain(domain);
    const targetCompany = company?.trim();

    if (!targetDomain && !targetCompany) {
      return new Response(
        JSON.stringify({ error: "Provide either a company domain or company name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const titles = personTitles && Array.isArray(personTitles) && personTitles.length > 0
      ? personTitles
      : [
          "Founder",
          "Co-Founder",
          "Chief Executive Officer",
          "CEO",
          "Chief Technology Officer",
          "CTO",
          "Head of Engineering",
          "VP of Engineering",
          "Director of Engineering",
          "Technical Co-Founder",
          "Product Lead",
          "VP of Product",
        ];

    // 1. Search for people matching decision maker titles
    const searchPayload: Record<string, unknown> = {
      person_titles: titles,
      per_page: 5,
    };

    if (targetDomain) {
      searchPayload.q_organization_domains_list = [targetDomain];
    }
    if (targetCompany) {
      searchPayload.q_organization_name = targetCompany;
    }

    const searchRes = await fetch(
      "https://api.apollo.io/api/v1/mixed_people/api_search",
      {
        method: "POST",
        headers,
        body: JSON.stringify(searchPayload),
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      return new Response(
        JSON.stringify({
          success: false,
          status: searchRes.status,
          error: `Apollo search failed (${searchRes.status}): ${errText}`,
        }),
        { status: searchRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchData = await searchRes.json();
    const people = searchData.people || [];

    if (people.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No decision-makers found on Apollo for "${targetDomain || targetCompany}".`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick best match candidate
    const candidate = people[0];

    // 2. Enrich candidate via people/match to uncover verified work email
    let matchedPerson = candidate;
    try {
      const matchPayload: Record<string, unknown> = {
        id: candidate.id,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        organization_name: candidate.organization?.name || targetCompany,
      };
      if (targetDomain) {
        matchPayload.domain = targetDomain;
      }

      const matchRes = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers,
        body: JSON.stringify(matchPayload),
      });

      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (matchData.person) {
          matchedPerson = matchData.person;
        }
      }
    } catch (matchErr) {
      console.warn("Apollo match lookup warning:", matchErr);
    }

    const contact = {
      id: matchedPerson.id || candidate.id,
      name:
        matchedPerson.name ||
        `${matchedPerson.first_name || ""} ${matchedPerson.last_name || ""}`.trim() ||
        candidate.name,
      first_name: matchedPerson.first_name || candidate.first_name || "",
      last_name: matchedPerson.last_name || candidate.last_name || "",
      job_title: matchedPerson.title || candidate.title || "Decision Maker",
      email: matchedPerson.email || candidate.email || "",
      linkedin_url: matchedPerson.linkedin_url || candidate.linkedin_url || "",
      company:
        matchedPerson.organization?.name ||
        candidate.organization?.name ||
        targetCompany ||
        "",
      domain:
        targetDomain ||
        matchedPerson.organization?.primary_domain ||
        candidate.organization?.primary_domain ||
        "",
      photo_url: matchedPerson.photo_url || candidate.photo_url || "",
      confidence: matchedPerson.email ? "high" : "medium",
    };

    return new Response(
      JSON.stringify({
        success: true,
        contact,
        candidatesFound: people.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
