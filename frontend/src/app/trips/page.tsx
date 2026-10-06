import { AuthGate } from "@/components/auth/AuthGate";
import { TripsClient } from "@/components/trips/TripsClient";

export default function TripsPage() {
  return (
    <AuthGate title="Sign in to see your trips" subtitle="Your bookings live here once you're signed in.">
      <TripsClient />
    </AuthGate>
  );
}
