import { notFound } from "next/navigation";

import { EditListingClient } from "@/components/host/EditListingClient";

export default function EditListingPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <EditListingClient id={id} />;
}
