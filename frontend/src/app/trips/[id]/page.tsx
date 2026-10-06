import { notFound } from "next/navigation";

import { AuthGate } from "@/components/auth/AuthGate";
import { ReservationDetailClient } from "@/components/trips/ReservationDetailClient";

export default function ReservationPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return (
    <AuthGate title="Sign in to view this reservation" subtitle="Reservations are private to the guest and host.">
      <ReservationDetailClient id={id} />
    </AuthGate>
  );
}
