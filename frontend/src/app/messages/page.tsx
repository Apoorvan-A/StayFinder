import { AuthGate } from "@/components/auth/AuthGate";
import { MessagesClient } from "@/components/messaging/MessagesClient";

export default function MessagesPage() {
  return (
    <AuthGate title="Sign in to see your messages" subtitle="Your conversations with hosts and guests live here.">
      <MessagesClient />
    </AuthGate>
  );
}
