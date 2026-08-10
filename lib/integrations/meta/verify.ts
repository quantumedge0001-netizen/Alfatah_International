import crypto from "node:crypto";

// Verifies Meta's X-Hub-Signature-256 header: HMAC-SHA256 of the raw request
// body, keyed with your Meta App Secret. This must run against the RAW body
// string, before any JSON.parse — signatures are computed over exact bytes.
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error("[meta/verify] META_APP_SECRET is not set — refusing to accept webhook.");
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const providedSignature = signatureHeader.replace("sha256=", "");

  // Constant-time comparison to avoid timing attacks. Buffers must be equal
  // length for timingSafeEqual, so mismatched lengths fail closed first.
  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(providedSignature, "hex");

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
}

// Handles Meta's GET verification handshake (hub.mode / hub.verify_token /
// hub.challenge), run once when you register the webhook URL in the
// Meta App dashboard.
export function verifyMetaChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null
): { ok: true; challenge: string } | { ok: false } {
  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("[meta/verify] META_VERIFY_TOKEN is not set — refusing verification.");
    return { ok: false };
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return { ok: true, challenge };
  }

  return { ok: false };
}
