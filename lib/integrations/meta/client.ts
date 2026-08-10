import type { MetaLeadDetail } from "./types";

const GRAPH_API_VERSION = "v19.0";

// Meta's webhook only sends a leadgen_id reference (Phase 5, step 6) — the
// actual name/email/phone/answers must be fetched from the Graph API using
// a Page access token with the leads_retrieval permission.
export async function fetchMetaLeadDetail(leadgenId: string): Promise<MetaLeadDetail> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("[meta/client] META_ACCESS_TOKEN is not set.");
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?access_token=${encodeURIComponent(
    accessToken
  )}`;

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const errorBody = await response.text();
    // Never log the access token — it's embedded in `url`, so log the id instead.
    console.error(
      `[meta/client] Graph API error for leadgen_id=${leadgenId}: ${response.status} ${errorBody}`
    );
    throw new Error(`Meta Graph API returned ${response.status} for lead ${leadgenId}`);
  }

  return (await response.json()) as MetaLeadDetail;
}
