import { AuthGate } from "@/components/auth/AuthGate";
import { WishlistClient } from "@/components/wishlist/WishlistClient";

export default function WishlistPage() {
  return (
    <AuthGate title="Sign in to view your wishlist" subtitle="Save your favorite stays and find them here.">
      <WishlistClient />
    </AuthGate>
  );
}
