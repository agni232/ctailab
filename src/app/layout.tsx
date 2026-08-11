import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CTAI Lab",
    template: "%s | CTAI Lab"
  },
  description: "Interactive CBSE Computational Thinking and AI learning for Classes 3-8.",
  openGraph: {
    title: "CTAI Lab",
    description: "Interactive CBSE Computational Thinking and AI learning for Classes 3-8.",
    type: "website",
    images: [
      {
        url: "/learning-lab-hero.png",
        width: 1680,
        height: 941,
        alt: "Students exploring computational thinking and AI together"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CTAI Lab",
    description: "Interactive CBSE Computational Thinking and AI learning for Classes 3-8.",
    images: ["/learning-lab-hero.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#142a43"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
