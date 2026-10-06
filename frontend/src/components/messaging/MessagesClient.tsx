"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { EmptyState } from "@/components/EmptyState";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import type { ConversationSummary } from "@/types";

export function MessagesClient() {
  const { data, isLoading } = useSWR<ConversationSummary[]>("/api/conversations", fetcher);

  return (
    <Container className="max-w-[760px] py-8">
      <h1 className="mb-6 text-3xl font-semibold">Messages</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          subtitle="When you message a host — or a guest messages you — the conversation shows up here."
          cta={{ href: "/", label: "Explore stays" }}
        />
      ) : (
        <ul className="divide-y divide-divider overflow-hidden rounded-2xl border border-divider">
          {data.map((conv) => (
            <li key={conv.id}>
              <Link href={`/messages/${conv.id}`} className="flex items-center gap-4 p-4 transition hover:bg-surface">
                {conv.counterparty.avatar_url && (
                  <Image
                    src={conv.counterparty.avatar_url}
                    alt={conv.counterparty.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate", conv.unread_count > 0 ? "font-semibold" : "font-medium")}>
                      {conv.counterparty.name}
                    </p>
                    <span className="flex-shrink-0 text-xs text-ink-muted">
                      {formatMessageTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-ink-muted">{conv.listing.title}</p>
                  <p className={cn("truncate text-sm", conv.unread_count > 0 ? "text-ink" : "text-ink-muted")}>
                    {conv.last_message ?? "No messages yet"}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="grid h-5 min-w-5 flex-shrink-0 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                    {conv.unread_count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
