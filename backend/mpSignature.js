import crypto from "crypto";

export function validateMercadoPagoSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];

  const dataId = req.body?.data?.id;

  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = String(xSignature).split(",").map((p) => p.trim());
  const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
  const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
