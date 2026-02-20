import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import PaymentBrick from "./PaymentBrick";
import { Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  defaultMethod = "pix",
}) {
  const [pix, setPix] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  const [doc, setDoc] = useState("");
  const [docError, setDocError] = useState("");
  const docDigitsRef = useRef("");
  const [method, setMethod] = useState(defaultMethod);

  const navigate = useNavigate();

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pix.qr_code);
    } catch {
      const el = document.createElement("textarea");
      el.value = pix.qr_code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const initialization = useMemo(
    () => ({
      amount: Number(amount),
      payer: { email: email || "" },
    }),
    [amount, email],
  );

  useEffect(() => {
    if (!open) return;
    if (!paymentId) return;

    let alive = true;
    let timeoutId = null;
    const startedAt = Date.now();

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/payment-status/${paymentId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!alive) return;
        if (data?.status === "approved") {
          navigate("/thanks", { replace: true });
          return;
        }
        if (Date.now() - startedAt > 10 * 60 * 1000) return;

        timeoutId = setTimeout(checkStatus, 3000);
      } catch (err) {
        if (!alive) return;
        timeoutId = setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();

    return () => {
      alive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [open, paymentId, navigate]);

  const customization = useMemo(() => {
  const paymentMethods =
    method === "pix"
      ? { bankTransfer: "all" }
      : { creditCard: "all" };

  return {
    paymentMethods,
    style: {
      variables: {
        formHorizontalPadding: "0px",
        formVerticalPadding: "0px",
      },
    },
  };
}, [method]);

  const digits = useMemo(() => onlyDigits(doc), [doc]);
  const showDoc = method === "pix";
  const docOk = !showDoc || digits.length === 11 || digits.length === 14;
  const blockBrick = showDoc && !docOk;
  const [showPixCode, setShowPixCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleClose = useCallback(() => {
    setPix(null);
    setPaymentId(null);
    setDoc("");
    setDocError("");
    docDigitsRef.current = "";
    setMethod(defaultMethod);
    onClose?.();
  }, [defaultMethod, onClose]);

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

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/create-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            payerEmail: email,
            selectedPaymentMethod,
            formData: nextFormData,
            meta,
          }),
        },
      );

      const data = await res.json();
      if (data?.id) {
        localStorage.setItem("fitiq_payment_id", String(data.id));
      }
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Falha ao processar pagamento",
        );
      }
      if (data.status === "approved") {
        navigate("/thanks", { replace: true });
        return data;
      }
      if (data?.pix?.qr_code_base64) {
        setPaymentId(data.id);
        setPix(data.pix);
      }
      return data;
    },
    [amount, email, meta, method, navigate],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/60"
      />
      {/* Wrapper central */}
        <div className="relative z-10 flex min-h-[100dvh] items-start justify-center">
        {/* Card com scroll interno */}
        <div
          className="w-full max-w-md rounded-2xl bg-white"
          onClick={(e) => e.stopPropagation()}
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="sticky top-0 z-20 bg-white px-4 pb-3 border-b">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Finalizar pagamento</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 rounded-lg border"
              >
                Fechar
              </button>
            </div>
            {!pix?.qr_code_base64 && (
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
              </div>
            )}
          </div>
          <div className="px-4 pb-4">
            {pix?.qr_code_base64 ? (
              <div className="pt-4">
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
                {!!pix.qr_code && (
                  <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Pix copia e cola</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowPixCode((v) => !v)}
                        className="text-xs underline text-gray-600"
                      >
                        {showPixCode ? "Ocultar" : "Ver código"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`
                        flex items-center gap-2
                        rounded-lg px-3 py-1.5
                        text-sm font-medium
                        transition
                        ${
                          copied
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        }
                      `}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                  {!showPixCode && (
                    <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-xs break-all text-gray-700">
                      {pix.qr_code.slice(0, 40)}…{pix.qr_code.slice(-40)}
                  </div>
                )}
                  {showPixCode && (
                    <textarea
                      readOnly
                      value={pix.qr_code}
                      className="mt-2 w-full rounded-xl border p-3 text-xs"
                      rows={4}
                    />
                  )}
                </div>
              )}
                <p className="mt-3 text-xs text-gray-500">
                  ID do pagamento: {paymentId}
                </p>
              </div>
            ) : (
              <>
                {showDoc && (
                  <div className="">
                    <label className="text-sm font-medium">
                      CPF/CNPJ (obrigatório para Pix)
                    </label>

                    <input
                      value={doc}
                      onChange={(e) => {
                        const masked = maskCpfCnpj(e.target.value);
                        setDoc(masked);
                        docDigitsRef.current = onlyDigits(masked);
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
                <div className={`${blockBrick ? "opacity-40 pointer-events-none" : ""} pt-4`}>
                  <PaymentBrick
                    key={`${method}-${Number(amount)}-${email}`}
                    initialization={initialization}
                    customization={customization}
                    onSubmit={async (payload) => {
                      const result = await onSubmit(payload);
                      return result;
                    }}
                    onError={(err) => console.error("[brick] error", err)}
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
      </div>
    </div>
  );

}
