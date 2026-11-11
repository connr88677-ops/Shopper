import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitstify — Collect your kind of style",
  description: "Discover pieces, build catalogs, and find your next inspiration.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}