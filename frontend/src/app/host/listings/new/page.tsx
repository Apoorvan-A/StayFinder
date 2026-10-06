import { ListingForm } from "@/components/host/ListingForm";

export default function NewListingPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Create a new listing</h1>
      <ListingForm mode="create" />
    </div>
  );
}
