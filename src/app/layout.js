import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200","300","400","500","600","700","800"],
});

export const metadata = {
  title: "Travel Admin Panel",
  description: "Travel Agency Management System - Admin Panel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={`${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
