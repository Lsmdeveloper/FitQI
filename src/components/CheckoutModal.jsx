import { Payment } from "@mercadopago/sdk-react";

export default function CheckoutModal({
  open,
  onClose,
  amount = 19.9,
  email = "",
  meta = {}, // aqui você manda quizId, winnerId, metrics, score...
}) {
  if (!open) return null;

  const initialization = {
    amount: Number(amount),
    payer: { email: email || "" },
  };

  const customization = {
    paymentMethods: {
      bankTransfer: "all", // PIX
      creditCard: "all",
      debitCard: "all",
      ticket: "all",
    },
  };

  const onSubmit = async ({ selectedPaymentMethod, formData }) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/create-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        payerEmail: email,
        selectedPaymentMethod,
        formData,
        meta, // vai pro backend salvar em metadata
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || data?.message || "Falha ao processar pagamento");
    }

    // Cartão pode aprovar na hora
    if (data.status === "approved") {
      window.location.href = "/thanks";
    }

    // PIX: aqui você provavelmente vai querer mostrar o QR (data.pix.qr_code_base64)
    return data;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Finalizar pagamento</p>

          <button onClick={onClose} className="px-3 py-1 rounded-lg border">
            Fechar
          </button>
        </div>

        <div className="mt-3">
          <Payment
            initialization={initialization}
            customization={customization}
            onSubmit={onSubmit}
            onError={(err) => console.error("Payment Brick error:", err)}
            onReady={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
