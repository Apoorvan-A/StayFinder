import { AuthGate } from "@/components/auth/AuthGate";
import { HostNav } from "@/components/host/HostNav";
import { Container } from "@/components/ui/Container";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate requireHost>
      <Container className="py-8">
        <HostNav />
        <div className="mt-8">{children}</div>
      </Container>
    </AuthGate>
  );
}
