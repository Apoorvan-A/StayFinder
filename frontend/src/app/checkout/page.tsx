import { Suspense } from "react";

import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Container } from "@/components/ui/Container";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <div className="skeleton h-96 w-full rounded-2xl" />
        </Container>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
