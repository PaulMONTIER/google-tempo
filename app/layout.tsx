import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/notifications/NotificationSystem";
import { AuthProvider } from "@/components/providers/session-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tempo - Assistant Calendrier Intelligent",
  description: "Gérez votre emploi du temps de manière conversationnelle avec Tempo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
