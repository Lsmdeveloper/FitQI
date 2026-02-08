import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Payment } from "mercadopago";
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

const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
const paymentClient = new Payment(mpClient);

const PORT = process.env.PORT || 3333;

app.get("/", (req, res) => {
  res.send("Backend FitIQ rodando");
});

// ===== Helpers =====

function extractPaymentId(req) {
  // MP pode mandar:
  // body: { type: "payment", data: { id: "123" } }
  // query: ?data.id=123&type=payment
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

async function fulfillApprovedPayment(p) {
  console.log("✅ PAGAMENTO APROVADO:", {
    id: p.id,
    email: p.payer?.email,
    external_reference: p.external_reference,
    status: p.status,
  });

  // TODO: aqui você libera o acesso:
  // - salvar no banco
  // - gerar / liberar PDF
  // - enviar email
}

// ===== Routes =====

// 1) Criar pagamento (Brick -> backend)
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

    // Descobre se é Pix
    const methodId = (formData?.payment_method_id || "").toLowerCase();
    const isPix = methodId === "pix";

    // Para Pix, exige CPF/CNPJ (Mercado Pago costuma exigir)
    if (isPix) {
      const id = formData?.payer?.identification;
      if (!id?.type || !id?.number) {
        return res.status(400).json({
          error: "Para PIX, informe CPF/CNPJ em payer.identification (type/number).",
        });
      }
    }

    // Monta body final
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

// 2) Polling pro front checar status
app.get("/payment-status/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const p = await getPaymentById(id);

    return res.json({
      id: p.id,
      status: p.status,
      status_detail: p.status_detail,
    });
  } catch (err) {
    console.error("Erro ao consultar payment-status:", err?.cause || err);
    return res.status(400).json({ error: "Falha ao consultar pagamento" });
  }
});

// 3) Webhook
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const paymentId =
      req.body?.data?.id || req.query?.["data.id"] || req.query?.id;

    if (!paymentId) return;

    // busca detalhes do pagamento na API do MP
    const mpResp = await payment.get({ id: paymentId });
    const p = mpResp?.api_response?.data || mpResp;

    console.log("WEBHOOK payment:", paymentId, p?.status);

    if (p?.status === "approved") {

      db.payments.update(paymentId, { status: "approved" })
      // e pode disparar entrega do ebook
    }
  } catch (err) {
    console.error("webhook error:", err);
  }
});


app.listen(PORT, () => console.log("Listening", PORT));
