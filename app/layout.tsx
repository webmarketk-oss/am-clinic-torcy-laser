import type { Metadata } from "next";
import "./globals.css";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const metadata: Metadata = {
  title: "AM Clinic Torcy - Black November, -30 % et pack 99 €/mois",
  description:
    "Black November AM Clinic Torcy, quantité limitée. -30 % sur toutes nos cures. Aisselles + maillot + demi-jambes : 99 €/mois pendant 10 mois.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {META_PIXEL_ID ? (
          <noscript>
            <img
              alt=""
              height={1}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              style={{ display: "none" }}
              width={1}
            />
          </noscript>
        ) : null}
        {children}
      </body>
    </html>
  );
}


