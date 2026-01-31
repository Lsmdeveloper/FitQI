import "dotenv/config";
import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { validateMercadoPagoSignature } from "./mpSignature.js";

const app = express();

const allowedOrigins = new Set([
  "https://fitiq-frontend.onrender.com",
  "http://localhost:5173",
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

app.use( express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log("Listening", PORT));

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preference = new Preference(mpClient);

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
        const { type, data } = req.body;

    if (type === "payment" && data?.id) {
      const paymentId = data.id;
      console.log(" Webhook recebido. paymentId:", paymentId);

    } else {
      console.log("Webhook recebido:", req.body);
    }
  } catch (e) {
    console.error("Erro no webhook:", e);
  }
});

app.post("/create-payment", async (req, res) => {
  try {
    const { quizId, winnerId, metrics, score } = req.body;
    const webhookUrl = (process.env.WEBHOOK_URL || "").trim();
    const response = await preference.create({
      body: {
        items: [
          {
            title: "FitIQ • Plano Personalizado",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 19.9,
          },
        ],
        metadata: {
          quizId,
          winnerId,
          metrics,
          score,
        },
        back_urls: {
            success: successUrl,
            failure: failureUrl,
        },
        // auto_return: "approved",
        notification_url: process.env.WEBHOOK_URL,
      },
    });
    console.log("preferenceId:", response.id);
    console.log("init_point:", response.init_point);
    console.log("sandbox_init_point:", response.sandbox_init_point);
    
    res.json({
      checkoutUrl: response.init_point,
      sandboxUrl: response.sandbox_init_point,
      preferenceId: response.id,
    });
 
  } catch (err) {
    console.error("Erro Mercado Pago:", err);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});
