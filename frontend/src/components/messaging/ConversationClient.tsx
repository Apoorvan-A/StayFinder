"use client";

import { ChevronLeft, SendHorizonal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { ApiError, apiSend, fetcher } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type { ConversationDetail } from "@/types";

export function ConversationClient({ id }: { id: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: conv, error, mutate } = useSWR<ConversationDetail>(
    `/api/conversations/${id}`,
    fetcher,
  );
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  if (error) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Conversation not available</h1>
        <p className="mt-2 text-ink-muted">It doesn&apos;t exist or isn&apos;t yours.</p>
        <Link href="/messages" className="btn-primary mt-6 inline-flex">Back to messages</Link>
      </Container>
    );
  }
  if (!conv) {
    return (
      <Container className="max-w-[720px] py-10">
        <div className="skeleton h-96 w-full rounded-2xl" />
      </Container>
    );
  }

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    try {
      const updated = await apiSend<ConversationDetail>(
        `/api/conversations/${id}/messages`,
        "POST",
        { body: text },
      );
      await mutate(updated, { revalidate: false });
    } catch (err) {
      setBody(text);
      toast.error(err instanceof ApiError ? err.message : "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Container className="max-w-[720px] py-6">
      <div className="mb-4 flex items-center gap-3">
        <button type="button" onClick={() => router.push("/messages")} aria-label="Back to messages" className="hover:underline">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{conv.counterparty.name}</h1>
          <Link href={`/listings/${conv.listing.id}`} className="truncate text-sm text-ink-muted hover:underline">
            {conv.listing.title}
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-divider p-4">
        {conv.messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className="max-w-[78%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm",
                    mine ? "bg-brand text-white" : "bg-surface text-ink",
                  )}
                >
                  {m.body}
                </div>
                <p className={cn("mt-1 text-[11px] text-ink-muted", mine ? "text-right" : "text-left")}>
                  {formatMessageTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="mt-4 flex items-end gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="min-h-[48px] flex-1 resize-none rounded-xl border border-hairline px-4 py-3 text-sm outline-none focus:border-ink"
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary h-12 px-4" aria-label="Send">
          <SendHorizonal className="h-5 w-5" />
        </button>
      </form>
    </Container>
  );
}
