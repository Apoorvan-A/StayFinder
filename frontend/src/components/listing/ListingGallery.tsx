"use client";

import { Grip } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { ListingImage } from "@/types";

export function ListingGallery({ images, title }: { images: ListingImage[]; title: string }) {
  const [open, setOpen] = useState(false);
  const shown = images.slice(0, 5);

  return (
    <>
      {/* Mobile: swipeable single column */}
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-[4/3] w-full flex-shrink-0 snap-center">
            <Image src={img.url} alt={img.alt_text || title} fill sizes="100vw" className="object-cover" priority />
          </div>
        ))}
      </div>

      {/* Desktop: hero + grid */}
      <div className="relative hidden overflow-hidden rounded-2xl md:block">
        <div className="grid h-[480px] grid-cols-4 grid-rows-2 gap-2">
          {shown.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "group relative overflow-hidden",
                i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt_text || title}
                fill
                sizes={i === 0 ? "50vw" : "25vw"}
                className="object-cover transition group-hover:brightness-95"
                priority={i === 0}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-ink bg-white px-4 py-2 text-sm font-semibold shadow-soft transition hover:bg-surface"
        >
          <Grip className="h-4 w-4" /> Show all photos
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={title} size="xl">
        <div className="mx-auto max-w-3xl space-y-4">
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-divider">
              <Image src={img.url} alt={`${title} — photo ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
