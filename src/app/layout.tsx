import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SugamGov AI - Verified Government Service Assistant",
  description:
    "Official AI-powered assistant for Indian public services. Get instant, verified answers and eligibility guidelines for PM Kisan, Ayushman Bharat, passport applications, and certificates in English, Hindi, and Gujarati.",
  keywords: [
    "SugamGov",
    "PM Kisan Eligibility",
    "Ayushman Bharat Scheme",
    "Government AI Assistant",
    "Indian Public Services AI",
    "Income Certificate Portal",
    "Sarkari Yojana AI",
  ],
  authors: [{ name: "Digital Government Services Team" }],
  openGraph: {
    title: "SugamGov AI - Government Services, Simplified with AI",
    description:
      "Access verified information on public schemes, eligibility criteria, and government services instantly with AI.",
    url: "https://sugamgov.ai",
    siteName: "SugamGov AI",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SugamGov AI - Government Services Assistant",
    description:
      "Get instant, verified answers and eligibility details for public services across India.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GovernmentService",
  "name": "SugamGov AI",
  "provider": {
    "@type": "GovernmentOrganization",
    "name": "Digital Government Services"
  },
  "serviceType": "Public Information & Eligibility Assistant",
  "areaServed": "IN",
  "availableLanguage": ["English", "Hindi", "Gujarati"],
  "description": "AI-powered digital government assistant for verified public service information and scheme eligibility guidelines."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
