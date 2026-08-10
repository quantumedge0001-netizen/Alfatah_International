// lib/integrations/meta/leads.ts
//
// Adapter boundary: this file is the ONLY place that should know about
// Meta's webhook payload shape. It normalizes into CanonicalLeadInput
// (defined in lib/services/lead.service.ts) — the shared shape every
// lead source must produce. Nothing downstream of lead.service.ts should
// ever know this data came from Meta specifically.

import type { CanonicalLeadInput } from "@/lib/services/lead.service";

// Shape of the field_data array returned by the Graph API leadgen endpoint.
interface MetaLeadField {
  name: string;
  values: string[];
}

interface MetaLeadGraphResponse {
  id: string;
  field_data: MetaLeadField[];
  created_time?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
}

/**
 * Fetches the full lead data from Meta's Graph API using the leadgen_id
 * we receive in the webhook notification (Meta's webhook payload itself
 * only contains a reference id, not the form answers).
 *
 * Requires META_PAGE_ACCESS_TOKEN in env — never expose this to the client.
 */
export async function fetchMetaLead(leadgenId: string): Promise<MetaLeadGraphResponse> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  }

  const url = `https://graph.facebook.com/v21.0/${leadgenId}?fields=field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta Graph API error (${res.status}): ${body}`);
  }

  return (await res.json()) as MetaLeadGraphResponse;
}

// Common field-name variants Meta forms use for each canonical field.
// Extend these lists as new form question phrasings show up.
const NAME_FIELDS = ["full_name", "name"];
const PHONE_FIELDS = ["phone_number", "phone"];
const EMAIL_FIELDS = ["email"];

function extractField(fieldData: MetaLeadField[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    const match = fieldData.find(
      (f) => f.name.toLowerCase() === candidate.toLowerCase()
    );
    if (match?.values?.[0]) return match.values[0];
  }
  return null;
}

/**
 * Normalizes a raw Meta Graph API lead response into CanonicalLeadInput —
 * the shape lead.service.ts's processCanonicalLead() expects. Any
 * field_data entries that don't map to name/phone/email are folded into
 * `requirement` as a readable summary, so nothing from the form is lost.
 */
export function normalizeMetaLead(raw: MetaLeadGraphResponse): CanonicalLeadInput {
  const fieldData = raw.field_data ?? [];

  const name = extractField(fieldData, NAME_FIELDS);
  const phone = extractField(fieldData, PHONE_FIELDS);
  const email = extractField(fieldData, EMAIL_FIELDS);

  const knownKeys = new Set(
    [...NAME_FIELDS, ...PHONE_FIELDS, ...EMAIL_FIELDS].map((k) => k.toLowerCase())
  );
  const extraAnswers = fieldData
    .filter((f) => !knownKeys.has(f.name.toLowerCase()))
    .map((f) => `${f.name}: ${f.values?.[0] ?? ""}`)
    .join("; ");

  return {
    source: "meta",
    external_id: raw.id,
    name,
    phone,
    email,
    requirement: extraAnswers || null,
    raw_payload: raw as unknown as Record<string, unknown>,
  };
}