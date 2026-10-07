"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

export function GoogleSignInButton({
  clientId,
  onCredential,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const initializedClientIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!ready || !ref.current || !window.google || initializedClientIdRef.current === clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredentialRef.current(response.credential),
    });
    window.google.accounts.id.renderButton(ref.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
    });
    initializedClientIdRef.current = clientId;
  }, [ready, clientId]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={ref} className="flex min-h-[44px] justify-center" />
    </>
  );
}
