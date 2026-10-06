import type { Metadata } from "next";

import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy — StayFinder",
  description: "How StayFinder handles your data in this demo application.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy"
      intro="StayFinder is a portfolio demo application. This page explains, in plain terms, what data it handles."
    >
      <InfoSection heading="What we store">
        <p>
          If you sign in with Google, we store your name, email, profile picture and your Google
          account identifier so we can recognise you on return visits. If you use a demo account,
          no personal data of yours is collected at all.
        </p>
        <p>
          We also store the content you create in the app — bookings, wishlists and, for hosts,
          listings — so the experience persists between visits.
        </p>
      </InfoSection>

      <InfoSection heading="Sessions">
        <p>
          Signing in sets a signed, HttpOnly session cookie. It can&apos;t be read by JavaScript
          and is only used to keep you logged in. We don&apos;t use third-party advertising or
          tracking cookies.
        </p>
      </InfoSection>

      <InfoSection heading="No payments">
        <p>
          Checkout is simulated. StayFinder never asks for or stores real card or payment
          information.
        </p>
      </InfoSection>

      <InfoSection heading="Your data">
        <p>
          You can clear your data at any time by removing your wishlist items and cancelling
          bookings, or by signing out. As a demo, data may be reset when the application is
          redeployed.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
