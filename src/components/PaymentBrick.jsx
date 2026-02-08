import React from "react";
import { Payment } from "@mercadopago/sdk-react";

function PaymentBrickInner({ initialization, customization, onSubmit }) {
  return (
    <Payment
      initialization={initialization}
      customization={customization}
      onSubmit={onSubmit}
      onReady={() => {}}
      onError={(err) => console.error("Payment Brick error:", err)}
    />
  );
}

export default React.memo(PaymentBrickInner);
