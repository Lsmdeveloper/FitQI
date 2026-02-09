import React, { useEffect, useMemo, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";

function PaymentBrickInner({ initialization, customization, onSubmit, onError }) {
  const [instance, setInstance] = useState(0);
  const signature = useMemo(() => {
    return JSON.stringify({
      initialization,
      customization,
    });
  }, [initialization, customization]);

  useEffect(() => {
    setInstance((v) => v + 1);
  }, [signature]);

  return (
    <Payment
      key={instance}
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onReady={() => {}}
      onError={(err) => {
        console.error("Payment Brick error:", err);
        onError?.(err);
      }}
    />
  );
}

export default React.memo(PaymentBrickInner);
