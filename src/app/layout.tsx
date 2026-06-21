import type { Metadata } from "next";
import { Saira, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Atmosphere } from "@/components/shared/atmosphere";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-clash",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Onyx - Search-first intelligence for the Base ecosystem",
  description:
    "Analyze any wallet, token, contract, project, quest or airdrop on Base. Verified data, never guessed.",
  keywords: ["Base", "Web3", "DeFi", "wallet analyzer", "token analyzer", "airdrops"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${saira.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen">
        <Atmosphere />
        <Navbar />
        <main className="relative z-10 pt-[72px]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
