import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { SidebarProvider } from "@/context/SidebarContext";

export const metadata: Metadata = {
  title: "ERP Multi Merchant",
  description: "ERP Multi Merchant Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}