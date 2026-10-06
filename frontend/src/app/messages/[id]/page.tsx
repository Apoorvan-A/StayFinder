import { notFound } from "next/navigation";

import { AuthGate } from "@/components/auth/AuthGate";
import { ConversationClient } from "@/components/messaging/ConversationClient";

export default function ConversationPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return (
    <AuthGate title="Sign in to view this conversation" subtitle="Conversations are private to their participants.">
      <ConversationClient id={id} />
    </AuthGate>
  );
}
