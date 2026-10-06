import { Container } from "@/components/ui/Container";

export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="max-w-[760px] py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {intro && <p className="mt-3 text-ink-muted">{intro}</p>}
      <div className="mt-10 space-y-10">{children}</div>
    </Container>
  );
}

export function InfoSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink">{children}</div>
    </section>
  );
}
