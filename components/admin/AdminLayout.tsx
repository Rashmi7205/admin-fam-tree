"use client";

import type React from "react";
import Sidebar from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <main className="flex-1 overflow-auto overflow-x-hidden">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
