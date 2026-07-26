"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function ReCaptchaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  
  if (!recaptchaKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
