import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  Cormorant_Garamond,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from "next/font/google";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getServerLocale } from "@/lib/i18n/server-preference";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans",
});
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-noto-serif",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const SITE_TITLE = process.env.NEXT_PUBLIC_APP_TITLE?.trim() || "Balcony Journal";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() || "A tactile family plant-care journal";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("h-full antialiased", "font-sans", notoSans.variable, notoSerif.variable, cormorant.variable)}
    >
      <body className="paper-grain h-full flex flex-col">
        <I18nProvider initialLocale={locale}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
