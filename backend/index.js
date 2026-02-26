import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
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
const preferenceClient = new Preference(mpClient);

const upsellByParent = new Map(); 

async function fulfillApprovedUpsell(parentPaymentId) {
  upsellByParent.set(String(parentPaymentId), true);
  console.log("✅ UPSSELL liberado para parent:", parentPaymentId);
}
const PORT = process.env.PORT || 3333;

app.get("/", (req, res) => {
  res.send("Backend FitIQ rodando");
});

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
    body.external_reference = `fitiq:${safeMeta.profile}:${Date.now()}`;

    console.log("[create-payment] amount:", amount);
    console.log("[create-payment] meta:", meta);
    console.log("[create-payment] wantsUpsell:", meta?.upsell, "upsell_price:", meta?.upsell_price);

    const created = await paymentClient.create({ body });
   
    console.log("[create-payment] MP created:", {
      id: created?.id,
      status: created?.status,
      external_reference: created?.external_reference,
      metadata: created?.metadata,
    });
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

    const meta = p?.metadata || {};
    const externalRef = String(p?.external_reference || "");

    //1) Detecta se ESTE payment foi compra com upsell embutido
    const upsellFromThisPayment =
      meta?.upsell === true ||
      String(meta?.upsell).toLowerCase() === "true" ||
      String(meta?.upsell) === "1";

    const parentPaymentId =
      meta?.parent_payment_id ||
      (externalRef.startsWith("upsell:") ? externalRef.replace("upsell:", "") : null);

    // 3) Detecta se o pai já tem upsell liberado (fallback)
    const upsellAlreadyUnlockedForParent =
      parentPaymentId ? upsellByParent.get(String(parentPaymentId)) === true : false;

    // final: upsell é true se foi comprado embutido OU já está liberado no pai
    const upsell = upsellFromThisPayment || upsellAlreadyUnlockedForParent;

    const record = paymentsStore.get(id);

    return res.json({
      id: p.id,
      status: p.status,
      status_detail: p.status_detail,
      upsell,                    
      meta: { upsell: meta?.upsell, parent_payment_id: meta?.parent_payment_id }, // opcional (debug)
      download:
        record && record.status === "approved"
          ? { token: record.downloadToken, profile: record.profile }
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

    if (p?.status !== "approved") return;

    const externalRef = String(p?.external_reference || "");
    const meta = p?.metadata || {};

    const isUpsell =
      externalRef.startsWith("upsell:") ||
      meta?.upsell === true ||
      Boolean(meta?.parent_payment_id);

    if (isUpsell) {
      const parentPaymentId =
        meta?.parent_payment_id || externalRef.replace("upsell:", "");

      if (!parentPaymentId) {
        console.warn("UPSLL approved but missing parentPaymentId", { paymentId });
        return;
      }

      await fulfillApprovedUpsell(parentPaymentId);
      
      return;
    }
    await fulfillApprovedPayment(p);
  } catch (err) {
    console.error("webhook error:", err?.cause || err);
  }
});

// app.post("/webhook", async (req, res) => {
//   res.sendStatus(200);
//   try {
//     const paymentId =
//       req.body?.data?.id ||
//       req.body?.id ||
//       req.query?.["data.id"] ||
//       req.query?.id;

//     if (!paymentId) return;
//     const p = await paymentClient.get({ id: String(paymentId) });
//     console.log("WEBHOOK payment:", paymentId, p?.status);
//     if (p?.status === "approved") {
//       await fulfillApprovedPayment(p);
//     }
//   } catch (err) {
//     console.error("webhook error:", err?.cause || err);
//   }
// });

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

app.post("/upsell/create", async (req, res) => {
  try {
    const { paymentId } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ message: "paymentId é obrigatório" });
    }
    if (upsellByParent.get(paymentId) === true) {
      return res.status(200).json({
        checkoutUrl: null,
        alreadyPurchased: true,
        message: "Upsell já liberado para este pagamento.",
      });
    }

    const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";
    const externalReference = `upsell:${paymentId}`;

    const pref = await preferenceClient.create({
      body: {
        external_reference: externalReference,
        metadata: {
          upsell: true,
          parent_payment_id: paymentId,
        },
        items: [
          {
            id: "kit-21-dias",
            title: "Kit 21 Dias (Guia + Calendário + Planilha)",
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(process.env.VITE_UPSELL_PRICE),
          },
        ],

        // Você pode limitar meios se quiser (ex: pix + cartão)
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12,
        },

        back_urls: {
          success: `${FRONT_URL}/thanks`,
          pending: `${FRONT_URL}/thanks`,
          failure: `${FRONT_URL}/thanks`,
        },
        auto_return: "approved",
      },
    });

    const checkoutUrl = pref?.init_point || pref?.sandbox_init_point;

    if (!checkoutUrl) {
      return res.status(500).json({ message: "Não foi possível gerar checkoutUrl do upsell." });
    }

    return res.status(200).json({ checkoutUrl });
  } catch (err) {
    console.error("UPSSELL CREATE ERROR", err);
    return res.status(500).json({ message: "Erro ao criar upsell." });
  }
});
app.listen(PORT, () => console.log("Listening", PORT));
