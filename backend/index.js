import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const app = express();

const allowedOrigins = new Set([
  "https://www.quizlm.com.br",
  "https://quizlm.com.br",
  "http://localhost:5173",
]);

const paymentsStore = new Map(); 

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    console.log("CORS blocked origin:", origin);
    return cb(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Importante: para validar assinatura, precisamos do rawBody
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const MP_ACCESS_TOKEN = (process.env.MP_ACCESS_TOKEN || "").trim();
if (!MP_ACCESS_TOKEN) {
  console.error("MP_ACCESS_TOKEN não definido no .env");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EBOOK_MAP = {
  P1: "P1 - Emagrecimento-Rapido-Iniciante.pdf",
  P2: "P2 - Plato-de-Emagrecimento.pdf",
  P3: "P3 - Emagrecimento-Emocional.pdf",
  P4: "P4 - Definicao-Corporal.pdf",
  P5: "P5 - Emagrecer-Mesmo-Sem-Tempo.pdf",
};

function getEbookPathByProfile(profile) {
  const file = EBOOK_MAP[profile] || EBOOK_MAP.P1;
  return path.join(__dirname, "download", file); 
}

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const paymentClient = new Payment(mpClient);
const PORT = process.env.PORT || 3333;

app.get("/", (req, res) => {
  res.send("Backend FitIQ rodando");
});

// ===== Helpers =====

function extractPaymentId(req) {
  return (
    req.body?.data?.id ||
    req.body?.id ||
    req.query?.["data.id"] ||
    req.query?.id ||
    null
  );
}

async function getPaymentById(paymentId) {
  // SDK novo: paymentClient.get({ id })
  const resp = await paymentClient.get({ id: String(paymentId) });
  return resp;
}

function resolveProfileFromPayment(p) {
  const m = p?.metadata || {};
  const metaProfile = m.profile || m.winnerId;
  if (metaProfile) return String(metaProfile).toUpperCase();

  const ext = p?.external_reference;
  if (ext) {
    try {
      const parsed = JSON.parse(ext);
      const extProfile = parsed?.profile || parsed?.winnerId;
      if (extProfile) return String(extProfile).toUpperCase();
    } catch {
    }
  }

  return "P1";
}

async function fulfillApprovedPayment(p) {
  const paymentId = String(p.id);
  const prev = paymentsStore.get(paymentId);

  const profile = prev?.profile || resolveProfileFromPayment(p);
  const email = prev?.email || p.payer?.email || "";
  const downloadToken = crypto.randomBytes(16).toString("hex");

  paymentsStore.set(paymentId, {
    status: "approved",
    email,
    profile,
    downloadToken,
    createdAt: prev?.createdAt || Date.now(),
  });
}

// ===== Routes =====
app.post("/create-payment", async (req, res) => {
  try {
    const { amount, payerEmail, formData, meta } = req.body || {};

    const txAmount = Number(amount ?? 19.9);
    if (!txAmount || Number.isNaN(txAmount)) {
      return res.status(400).json({ error: "amount inválido" });
    }
    if (!payerEmail) {
      return res.status(400).json({ error: "payerEmail é obrigatório" });
    }
    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ error: "formData é obrigatório" });
    }
    const methodId = (formData?.payment_method_id || "").toLowerCase();
    const isPix = methodId === "pix";

    if (isPix) {
      const id = formData?.payer?.identification;
      if (!id?.type || !id?.number) {
        return res.status(400).json({
          error: "Para PIX, informe CPF/CNPJ em payer.identification (type/number).",
        });
      }
    }

    const body = {
      ...formData,
      transaction_amount: txAmount,
      description: "FitIQ • Plano Personalizado",
      payer: {
        ...(formData.payer || {}),
        email: payerEmail,
      },
      metadata: {
        ...(formData.metadata || {}),
        ...(meta || {}),
      },
      external_reference: formData.external_reference || `fitiq_${Date.now()}`,
    };

    body.transaction_amount = txAmount;

    const safeMeta = {
      profile: meta?.profile || meta?.winnerId || formData?.metadata?.profile || formData?.metadata?.winnerId || "P1",
      email: payerEmail,
    };
    body.metadata = {
      ...(formData.metadata || {}),
      ...(meta || {}),
      profile: safeMeta.profile,
    };
    body.external_reference = JSON.stringify({
      profile: safeMeta.profile,
      email: payerEmail,
      ts: Date.now(),
    });

    const created = await paymentClient.create({ body });

    const tx = created?.point_of_interaction?.transaction_data;

    return res.status(200).json({
      id: created?.id,
      status: created?.status,
      status_detail: created?.status_detail,
      payment_method_id: created?.payment_method_id,
      pix: tx
        ? {
            qr_code: tx.qr_code,
            qr_code_base64: tx.qr_code_base64,
            ticket_url: tx.ticket_url,
          }
        : null,
    });
  } catch (err) {
    console.error("Erro Mercado Pago create-payment:", err?.cause || err);

    const mpMsg =
      err?.cause?.[0]?.description ||
      err?.cause?.[0]?.message ||
      err?.message ||
      "Erro ao criar pagamento";

    return res.status(400).json({ error: mpMsg });
  }
});

app.get("/payment-status/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const p = await getPaymentById(id);

    if (p?.status === "approved" && !paymentsStore.has(id)) {
      await fulfillApprovedPayment(p);
    }
    const record = paymentsStore.get(id);
    return res.json({
      id: p.id,
      status: p.status,
      status_detail: p.status_detail,
      download: record && record.status === "approved"
        ? {
            token: record.downloadToken,
            profile: record.profile,
          }
        : null,
    });
  } catch (err) {
    console.error("Erro ao consultar payment-status:", err?.cause || err);
    return res.status(400).json({ error: "Falha ao consultar pagamento" });
  }
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query?.["data.id"] ||
      req.query?.id;

    if (!paymentId) return;
    const p = await paymentClient.get({ id: String(paymentId) });
    console.log("WEBHOOK payment:", paymentId, p?.status);
    if (p?.status === "approved") {
      await fulfillApprovedPayment(p);
    }
  } catch (err) {
    console.error("webhook error:", err?.cause || err);
  }
});

app.get("/download/:paymentId", (req, res) => {
  const paymentId = String(req.params.paymentId);
  const token = String(req.query.token || "");
  const record = paymentsStore.get(paymentId);

  if (!record || record.status !== "approved") {
    return res.status(403).json({ error: "Pagamento não aprovado ou não encontrado." });
  }

  if (!token || token !== record.downloadToken) {
    return res.status(403).json({ error: "Token inválido." });
  }
  const pdfPath = getEbookPathByProfile(record.profile);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: "PDF não encontrado no servidor." });
  }

  return res.download(pdfPath, `FitIQ-${record.profile}.pdf`);
});

app.listen(PORT, () => console.log("Listening", PORT));
