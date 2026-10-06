import { Suspense } from "react";

import { ExploreClient } from "@/components/explore/ExploreClient";
import { ListingGridSkeleton } from "@/components/ListingGrid";
import { Container } from "@/components/ui/Container";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <Container size="wide" className="py-8">
          <ListingGridSkeleton count={24} />
        </Container>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
