import type { MetaLeadDetail } from "./types";
import type { CanonicalLeadInput } from "@/lib/services/lead.service";

// Meta form field names are configured per-form in Ads Manager and are not
// guaranteed to be stable. We match loosely (case-insensitive substring) so
// minor form-question wording changes don't silently break ingestion.
function findFieldValue(detail: MetaLeadDetail, ...matchers: string[]): string | undefined {
  const field = detail.field_data.find((f) =>
    matchers.some((m) => f.name.toLowerCase().includes(m.toLowerCase()))
  );
  return field?.values?.[0];
}

export function mapMetaLeadToCanonical(detail: MetaLeadDetail): CanonicalLeadInput {
  const name = findFieldValue(detail, "full_name", "name");
  const phone = findFieldValue(detail, "phone");
  const email = findFieldValue(detail, "email");

  // These map to the free-text `requirement` field on the canonical lead.
  // Matches the question columns already seen in "Al Fatah Leads Ad Data"
  // (water capacity / business type / treatment solution).
  const requirementParts = [
    findFieldValue(detail, "water_capacity", "capacity"),
    findFieldValue(detail, "business"),
    findFieldValue(detail, "treatment_solution", "solution"),
  ].filter(Boolean);

  return {
    name: name ?? null,
    phone: phone ?? null,
    email: email ?? null,
    source: "meta",
    external_id: detail.id,
    requirement: requirementParts.length > 0 ? requirementParts.join(" | ") : null,
    raw_payload: detail as unknown as Record<string, unknown>,
  };
}
