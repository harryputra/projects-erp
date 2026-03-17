"use client";

import React from "react";
import AppSidebar from "@/layout/AppSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <div className="lg:ml-[290px]">
        <main className="p-4 md:p-6 2xl:p-10">{children}</main>
      </div>
    </div>
  );
}