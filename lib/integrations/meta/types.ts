// Shapes for Meta's Lead Ads webhook + Graph API responses.
// Reference: Meta's leadgen webhook sends only a reference (leadgen_id);
// the actual field data must be fetched separately from the Graph API.

export interface MetaWebhookEnvelope {
  object: string; // expected: "page"
  entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  field: string; // expected: "leadgen"
  value: {
    ad_id?: string;
    ad_name?: string;
    adset_id?: string;
    adset_name?: string;
    campaign_id?: string;
    campaign_name?: string;
    form_id?: string;
    leadgen_id: string;
    created_time: number;
    page_id?: string;
    is_organic?: string; // Meta sends this as a string, e.g. "true"/"false"
  };
}

// A single Q&A pair as returned by GET /{leadgen_id} on the Graph API.
export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MetaLeadDetail {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  is_organic?: boolean;
  platform?: string;
  field_data: MetaLeadField[];
}
