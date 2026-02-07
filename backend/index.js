import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment  } from "mercadopago";
import { validateMercadoPagoSignature } from "./mpSignature.js";

const app = express();

const allowedOrigins = new Set([
  "https://www.quizlm.com.br",
  "https://quizlm.com.br",
  "http://localhost:5173",
]);

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

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

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

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const payment = new Payment(mpClient);

const PORT = process.env.PORT || 3333;

const successUrl =
  (process.env.FRONTEND_SUCCESS_URL || "http://localhost:5173/sucesso").trim();
const failureUrl =
  (process.env.FRONTEND_FAILURE_URL || "http://localhost:5173/erro").trim();


app.get("/", (req, res) => {
  res.send("Backend FitIQ rodando");
});

app.post("/webhook", async (req, res) => {
  try {    
    const isValid = validateMercadoPagoSignature(req);
    if (!isValid) {
        return res.sendStatus(401); 
    }
    res.sendStatus(200);
    const { type, data } = req.body || {};
    const paymentId = data?.id;

    if (type === "payment" && paymentId) {
      console.log("✅Webhook recebido. paymentId:", paymentId);

    } else {
      console.log("Webhook recebido:", req.body);
    }
  } catch (e) {
    console.error("Erro no webhook:", e);
  }
});

/**
 * CREATE PAYMENT (Checkout Transparente / Bricks)
 * Esse endpoint é o que o Payment Brick chama no onSubmit.
 *
 * Espera algo assim do frontend:
 * {
 *   "amount": 19.9,
 *   "payerEmail": "x@y.com",
 *   "quizId": "...",
 *   "winnerId": "...",
 *   "metrics": {...},
 *   "score": {...},
 *   "formData": {...} // do Payment Brick
 * }
 */

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

    // Monta o body do payment usando o que vem do Brick
    // e adiciona metadata do FitIQ
    const body = {
      transaction_amount: txAmount,
      description: "FitIQ • Plano Personalizado",
      payer: {
        email: payerEmail,
        ...(formData.payer || {}),
      },

      // IMPORTANTÍSSIMO: o Brick envia os campos de cada método.
      // Ex:
      // - Cartão: token, installments, payment_method_id, issuer_id, payer.identification...
      // - Pix: payment_method_id geralmente "pix" ou ele define o tipo (depende do Brick)
      ...formData,

      metadata: {
        ...(meta || {}),
        ...(formData.metadata || {}),
      },

      // referência sua (para você liberar acesso depois)
      external_reference: formData.external_reference || `fitiq_${Date.now()}`,
    };

    // Segurança: não deixe o front sobrescrever seu amount
    body.transaction_amount = txAmount;

    const mpResp = await payment.create({ body });
    const data = mpResp?.api_response?.data || mpResp;

    // PIX: pega QR se existir
    const tx = data?.point_of_interaction?.transaction_data;

    return res.status(200).json({
      id: data?.id,
      status: data?.status,
      status_detail: data?.status_detail,
      payment_method_id: data?.payment_method_id,
      pix: tx
        ? {
            qr_code: tx.qr_code,
            qr_code_base64: tx.qr_code_base64,
            ticket_url: tx.ticket_url,
          }
        : null,
    });
  } catch (err) {
    console.error("Erro Mercado Pago create-payment:", err);

    const mpMsg =
      err?.cause?.[0]?.description ||
      err?.cause?.[0]?.message ||
      err?.message ||
      "Erro ao criar pagamento";

    return res.status(400).json({ error: mpMsg });
  }
});

app.listen(PORT, () => console.log("Listening", PORT));