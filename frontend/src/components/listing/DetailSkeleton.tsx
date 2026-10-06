import { Container } from "@/components/ui/Container";

export function DetailSkeleton() {
  return (
    <Container className="py-6">
      <div className="skeleton mb-2 h-7 w-2/3 rounded" />
      <div className="skeleton mb-4 h-4 w-1/3 rounded" />
      <div className="skeleton h-[480px] w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton h-6 w-1/2 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>
        <div className="skeleton hidden h-80 rounded-2xl lg:block" />
      </div>
    </Container>
  );
}
