import localFont from "next/font/local";
import "./globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavbarVisibility from "@/components/NavbarVisibility";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "PawGle",
  description: "Platform dedicated to Animal Recognition",
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="50pxX50px" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProtectedRoute />
        <NavbarVisibility/>
        <main>{children}</main>
      </body>
    </html>
  );
}
