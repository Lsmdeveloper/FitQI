import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import PaymentBrick from "./PaymentBrick";

function onlyDigits(v) {
  return (v || "").replace(/\D/g, "");
}

function maskCpfCnpj(value) {
  const d = onlyDigits(value);

  // CPF (11)
  if (d.length <= 11) {
    const p1 = d.slice(0, 3);
    const p2 = d.slice(3, 6);
    const p3 = d.slice(6, 9);
    const p4 = d.slice(9, 11);

    let out = p1;
    if (p2) out += `.${p2}`;
    if (p3) out += `.${p3}`;
    if (p4) out += `-${p4}`;
    return out;
  }

  // CNPJ (14)
  const c1 = d.slice(0, 2);
  const c2 = d.slice(2, 5);
  const c3 = d.slice(5, 8);
  const c4 = d.slice(8, 12);
  const c5 = d.slice(12, 14);

  let out = c1;
  if (c2) out += `.${c2}`;
  if (c3) out += `.${c3}`;
  if (c4) out += `/${c4}`;
  if (c5) out += `-${c5}`;
  return out;
}

export default function CheckoutModal({
  open,
  onClose,
  amount = 19.9,
  email = "",
  meta = {},
  defaultMethod = "pix", // "pix" | "credit_card" | "debit_card"
}) {
  const [pix, setPix] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const [doc, setDoc] = useState("");
  const [docError, setDocError] = useState("");

  // ✅ CPF/CNPJ em REF (não quebra memo do Brick)
  const docDigitsRef = useRef("");

  const [method, setMethod] = useState(defaultMethod);

  const initialization = useMemo(
    () => ({
      amount: Number(amount),
      payer: { email: email || "" }, 
    }),
    [amount, email]
  );
  useEffect(() => {
    // só roda quando existir pagamento Pix ativo
    if (!paymentId || !pix) return;

    let alive = true;
    const startedAt = Date.now();

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/payment-status/${paymentId}`
        );

        const data = await res.json();

        if (!alive) return;

        if (data?.status === "approved") {
          window.location.href = "/thanks";
          return;
        }

        // timeout de segurança: 10 minutos
        if (Date.now() - startedAt > 10 * 60 * 1000) return;

        setTimeout(checkStatus, 3000); // tenta de novo em 3s
      } catch (err) {
        // erro de rede → tenta novamente
        if (alive) setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();

    return () => {
      alive = false;
    };
  }, [paymentId, pix]);

  const customization = useMemo(() => {
    if (method === "pix") return { paymentMethods: { bankTransfer: "all" } };
    if (method === "credit_card") return { paymentMethods: { creditCard: "all" } };
    return { paymentMethods: { debitCard: "all" } };
  }, [method]);

  const digits = useMemo(() => onlyDigits(doc), [doc]);
  const showDoc = method === "pix";
  const docOk = !showDoc || digits.length === 11 || digits.length === 14;

  const handleClose = useCallback(() => {
    setPix(null);
    setPaymentId(null);
    setDoc("");
    setDocError("");
    docDigitsRef.current = "";
    setMethod(defaultMethod);
    onClose?.();
  }, [defaultMethod, onClose]);

  // ✅ onSubmit NÃO depende de `doc` (state)
  const onSubmit = useCallback(
    async ({ selectedPaymentMethod, formData }) => {
      const isPix = method === "pix";
      let nextFormData = formData;

      if (isPix) {
        const d = docDigitsRef.current;

        if (!(d.length === 11 || d.length === 14)) {
          setDocError("Informe CPF (11) ou CNPJ (14) para gerar o Pix.");
          throw new Error("CPF/CNPJ obrigatório para Pix");
        }

        setDocError("");
        nextFormData = {
          ...formData,
          payment_method_id: "pix",
          payer: {
            ...(formData?.payer || {}),
            identification: {
              type: d.length === 11 ? "CPF" : "CNPJ",
              number: d,
            },
          },
        };
      } else {
        setDocError("");
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          payerEmail: email,
          selectedPaymentMethod,
          formData: nextFormData,
          meta,
        }),
      });

      const data = await res.json();
      console.log("CREATE-PAYMENT RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Falha ao processar pagamento");
      }

      if (data.status === "approved") {
        window.location.href = "/thanks";
        return data;
      }

      if (data?.pix?.qr_code_base64) {
        setPaymentId(data.id);
        setPix(data.pix);
      }

      return data;
    },
    [amount, email, meta, method]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Finalizar pagamento</p>
          <button onClick={handleClose} className="px-3 py-1 rounded-lg border">
            Fechar
          </button>
        </div>

        {pix?.qr_code_base64 ? (
          <div className="mt-4">
            <p className="font-semibold">Pague com Pix</p>
            <p className="text-sm text-gray-600 mt-1">
              Escaneie o QR Code no app do seu banco.
            </p>

            <div className="mt-3 grid place-items-center">
              <img
                src={`data:image/png;base64,${pix.qr_code_base64}`}
                alt="QR Code Pix"
                className="w-56 h-56"
              />
            </div>

            {!!pix.ticket_url && (
              <a
                href={pix.ticket_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-center underline text-sm"
              >
                Abrir link do Pix
              </a>
            )}

            <p className="mt-2 text-xs text-gray-500">ID do pagamento: {paymentId}</p>
          </div>
        ) : (
          <>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMethod("pix")}
                className={`flex-1 rounded-xl border py-2 text-sm ${
                  method === "pix" ? "border-blue-600" : ""
                }`}
              >
                Pix
              </button>
              <button
                type="button"
                onClick={() => setMethod("credit_card")}
                className={`flex-1 rounded-xl border py-2 text-sm ${
                  method === "credit_card" ? "border-blue-600" : ""
                }`}
              >
                Crédito
              </button>
              <button
                type="button"
                onClick={() => setMethod("debit_card")}
                className={`flex-1 rounded-xl border py-2 text-sm ${
                  method === "debit_card" ? "border-blue-600" : ""
                }`}
              >
                Débito
              </button>
            </div>

            {showDoc && (
              <div className="mt-3">
                <label className="text-sm font-medium">CPF/CNPJ (obrigatório para Pix)</label>

                <input
                  value={doc}
                  onChange={(e) => {
                    const masked = maskCpfCnpj(e.target.value);
                    setDoc(masked);
                    docDigitsRef.current = onlyDigits(masked); // ✅ atualiza ref sem mexer no Brick

                    if (docError) setDocError("");
                  }}
                  placeholder="000.000.000-00"
                  className={`mt-1 w-full rounded-xl border p-3 ${
                    docError ? "border-red-500" : ""
                  }`}
                  inputMode="numeric"
                  autoComplete="off"
                />

                {docError ? (
                  <p className="mt-1 text-sm text-red-600">{docError}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Usado apenas para gerar o Pix no Mercado Pago.
                  </p>
                )}
              </div>
            )}

            <div className={`min-h-[420px] ${!docOk ? "opacity-40 pointer-events-none" : ""}`}>
              <PaymentBrick
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
              />
            </div>

            {showDoc && !docOk && (
              <p className="mt-2 text-xs text-red-600">
                Preencha CPF/CNPJ para liberar o pagamento via Pix.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
