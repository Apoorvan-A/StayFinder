import { Suspense } from "react";

import { ExploreClient } from "@/components/explore/ExploreClient";
import { ListingGridSkeleton } from "@/components/ListingGrid";
import { Container } from "@/components/ui/Container";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <ListingGridSkeleton count={18} />
        </Container>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
