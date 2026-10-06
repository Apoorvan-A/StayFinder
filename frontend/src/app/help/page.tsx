import Link from "next/link";
import type { Metadata } from "next";

import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Help Center — StayFinder",
  description: "Answers to common questions about booking, cancellations, payments and hosting on StayFinder.",
};

export default function HelpPage() {
  return (
    <InfoPage
      title="Help Center"
      intro="Quick answers to the most common questions about using StayFinder."
    >
      <InfoSection heading="Booking a stay">
        <p>
          Search by destination, dates and guests, open any listing, then choose your dates on
          the reservation calendar. Dates that are already booked are blocked automatically. The
          price breakdown — nightly rate, cleaning fee, service fee and taxes — is calculated on
          the server before you confirm.
        </p>
        <p>
          After you reserve and complete the (demo) checkout, you&apos;ll get a confirmation code
          and the booking appears under <Link href="/trips" className="font-medium underline">My trips</Link>.
        </p>
      </InfoSection>

      <InfoSection id="cancellations" heading="Cancellations">
        <p>
          You can cancel an upcoming reservation at any time from{" "}
          <Link href="/trips" className="font-medium underline">My trips</Link> — open the
          Upcoming tab and select <span className="font-medium">Cancel</span>.
        </p>
        <p>
          When you cancel, those nights immediately become available again for other guests, and
          the reservation moves to your Cancelled tab. Past stays can&apos;t be cancelled.
        </p>
      </InfoSection>

      <InfoSection heading="Payments">
        <p>
          StayFinder is a demo application, so checkout is simulated — no real card is charged and
          no real payment details are collected. Every total is computed and stored on the server
          at the time of booking, so your trip keeps its original price even if the host later
          changes it.
        </p>
      </InfoSection>

      <InfoSection heading="Wishlists">
        <p>
          Tap the heart on any listing to save it to your{" "}
          <Link href="/wishlist" className="font-medium underline">wishlist</Link>. Your saved
          stays are tied to your account and stay there until you remove them.
        </p>
      </InfoSection>

      <InfoSection heading="Hosting">
        <p>
          Anyone can host. Open <Link href="/host" className="font-medium underline">Become a host</Link>{" "}
          to enable hosting on your account, then{" "}
          <Link href="/host/listings/new" className="font-medium underline">list your place</Link>{" "}
          with photos, pricing, capacity and amenities. Your host dashboard shows your listings,
          reservations and key metrics.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
