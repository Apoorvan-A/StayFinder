import { notFound } from "next/navigation";

import { ListingDetailClient } from "@/components/listing/ListingDetailClient";

export default function ListingPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ListingDetailClient id={id} />;
}
