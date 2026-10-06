import type { Metadata } from "next";

import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms — StayFinder",
  description: "The terms for using the StayFinder demo application.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      intro="StayFinder is a demonstration project, not a real booking service. Please keep that in mind while using it."
    >
      <InfoSection heading="Demo service">
        <p>
          StayFinder showcases an Airbnb-style booking experience. Listings, hosts, reviews and
          availability are sample data. No reservation made here results in a real stay, and no
          money changes hands.
        </p>
      </InfoSection>

      <InfoSection heading="Accounts">
        <p>
          You may sign in with Google or use a built-in demo account. Demo accounts are shared and
          may be reset at any time. You&apos;re responsible for the content you create while signed
          in and should only post content you have the right to share.
        </p>
      </InfoSection>

      <InfoSection heading="Payments">
        <p>
          Checkout is mocked for demonstration purposes only. Do not enter real card details
          anywhere in the application.
        </p>
      </InfoSection>

      <InfoSection heading="Availability">
        <p>
          Because this is a demo, the service is provided as-is, without warranties, and may be
          changed, interrupted or reset without notice.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
