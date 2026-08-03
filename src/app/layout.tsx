import type { Metadata, Viewport } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE = "NCERT Library for IAS";
const DESCRIPTION =
  "A premium, centralized library of NCERT books for UPSC & IAS aspirants. Read online, highlight, bookmark, take notes, search inside books and resume reading — built for serious preparation.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ncert-library-for-ias.app"),
  title: {
    default: `${SITE} — Read NCERT Books Online for UPSC`,
    template: `%s · ${SITE}`,
  },
  description: DESCRIPTION,
  keywords: [
    "NCERT books", "UPSC preparation", "IAS books", "NCERT library",
    "read NCERT online", "UPSC NCERT", "civil services", "history geography polity",
    "old NCERT", "new NCERT", "free NCERT PDF",
  ],
  authors: [{ name: "NCERT Library for IAS" }],
  creator: "NCERT Library for IAS",
  applicationName: SITE,
  category: "education",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://ncert-library-for-ias.app",
    siteName: SITE,
    title: `${SITE} — Read NCERT Books Online for UPSC`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1712" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE,
  description: DESCRIPTION,
  url: "https://ncert-library-for-ias.app",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
  },
  knowsAbout: [
    "NCERT books", "UPSC preparation", "IAS examination",
    "History", "Geography", "Polity", "Economics", "Science",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${sans.variable} ${serif.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
