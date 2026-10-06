"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function StartMessageButton({
  label,
  modalTitle,
  placeholder,
  onSend,
  variant = "secondary",
}: {
  label: string;
  modalTitle: string;
  placeholder: string;
  /** Sends the message and resolves to the conversation id to navigate to. */
  onSend: (body: string) => Promise<number>;
  variant?: "primary" | "secondary";
}) {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const conversationId = await onSend(body.trim());
      setOpen(false);
      setBody("");
      toast.success("Message sent");
      router.push(`/messages/${conversationId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => requireAuth(() => setOpen(true))}
        className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      >
        <MessageCircle className="mr-2 h-4 w-4" /> {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={modalTitle}
        footer={
          <div className="flex justify-end">
            <button type="button" className="btn-primary" onClick={send} disabled={sending || !body.trim()}>
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        }
      >
        <p className="mb-3 text-sm text-ink-muted">Your conversation stays inside StayFinder.</p>
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder={placeholder}
          className="w-full rounded-xl border border-hairline px-4 py-3 text-sm outline-none focus:border-ink"
        />
      </Modal>
    </>
  );
}
