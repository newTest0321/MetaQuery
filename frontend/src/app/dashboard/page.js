"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility function for conditional class names

export default function Dashboard({ sessions = [] }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(-45deg,#050c18,#0b1725,#101c29,#0d1924)] text-white flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#050c18] shadow-xl transform transition-transform duration-300 z-50",
          {
            "-translate-x-64": !sidebarOpen,
            "translate-x-0": sidebarOpen,
          }
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">MetaQuery</h2>
          <X
            className="cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <nav className="mt-6 space-y-4">
          <a
            href="/docs"
            className="block px-6 py-3 hover:bg-[#101c29] transition-colors duration-200"
          >
            📄 Docs
          </a>
          <a
            href="/settings"
            className="block px-6 py-3 hover:bg-[#101c29] transition-colors duration-200"
          >
            ⚙️ Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-grow">
        {/* Top Bar */}
        <header className="w-full flex items-center justify-between px-8 py-4 bg-[#0b1725] shadow-lg">
          <div className="flex items-center gap-4">
            <Menu
              className="cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            />
            <h1
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
              onClick={() => router.push("/")}
            >
              MetaQuery
            </h1>
          </div>
          <Button
            onClick={() => router.push("/session")}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg shadow-md transition-colors duration-200"
          >
            Start Session
          </Button>
        </header>

        {/* Saved Sessions */}
        <main className="flex-grow p-8">
          <h2 className="text-3xl font-semibold mb-6">Saved Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-lg opacity-70">No saved sessions yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session, index) => (
                <div
                  key={index}
                  className="p-6 bg-white bg-opacity-10 rounded-lg shadow-lg hover:bg-opacity-20 transition cursor-pointer"
                  onClick={() => router.push(`/session/${session.id}`)}
                >
                  <h3 className="text-lg font-semibold">{session.name}</h3>
                  <p className="text-sm opacity-80">{session.date}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
