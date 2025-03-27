"use client";

import React, { useState, useEffect } from "react";
import { Search, Database, Settings, FileText, Trash2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const userEmail = "zendijkstra@fearlessmails.com";

export default function Dashboard() {
  const [savedSessions, setSavedSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem("savedSessions")) || [];
    setSavedSessions(sessions);
  }, []);

  const handleResumeSession = (sessionName) => {
    router.push(`/s3-viewer?session=${sessionName}`);
  };

  const handleDeleteSession = (sessionName) => {
    const updatedSessions = savedSessions.filter(session => session.name !== sessionName);
    setSavedSessions(updatedSessions);
    localStorage.setItem("savedSessions", JSON.stringify(updatedSessions));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            MetaQuery
          </h1>
        </div>
        <hr className="border-gray-600 mb-4 w-[calc(100vw-2rem)] absolute left-0" />
        <nav className="mt-10">
          <button className="w-full flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-600 hover:bg-gray-700">
            <Search size={16} className="text-gray-400" />
            <span className="text-gray-300 flex-1 text-left">Search</span>
            <span className="text-xs text-gray-400">Ctrl+K</span>
          </button>
          <ul className="space-y-2 mt-4">
            <li className="flex items-center gap-2 text-gray-300 p-2 bg-gray-700 rounded">
              <Database size={16} /> Projects
            </li>
            <li className="flex items-center gap-2 text-gray-400 p-2 hover:bg-gray-700 rounded">
              <FileText size={16} /> Billing
            </li>
            <li className="flex items-center gap-2 text-gray-400 p-2 hover:bg-gray-700 rounded">
              <Settings size={16} /> Settings
            </li>
          </ul>
        </nav>
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="absolute bottom-4 left-4 flex items-center gap-2 bg-red-600 px-4 py-2 rounded text-white hover:bg-red-500">
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <span className="text-sm text-gray-300">{userEmail}</span>
        </div>

        <div className="flex justify-between items-center mt-10">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <Link href="/session" passHref>
            <button className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500">
              New Project
            </button>
          </Link>
        </div>

        {/* Upper Boxes */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {[
            { label: "Storage", value: "0.06 / 0.5 GB" },
            { label: "Compute", value: "0 / 191.9 h" },
            { label: "Branch Compute", value: "0 / 5 h" },
            { label: "Data Transfer", value: "0 / 5 GB" },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-gray-800 rounded border border-gray-700">
              <p className="text-gray-400 text-sm">{item.label}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Session Table */}
        <div className="mt-6 bg-gray-800 p-4 rounded border border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="p-2">Name</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Storage</th>
                <th className="p-2">Resume</th>
                <th className="p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {savedSessions.length > 0 ? (
                savedSessions.map((session, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-2">{session.name}</td>
                    <td className="p-2">{new Date(session.createdAt).toLocaleString()}</td>
                    <td className="p-2">Session Active</td>
                    <td className="p-2 text-blue-400 cursor-pointer hover:underline"
                        onClick={() => handleResumeSession(session.name)}>
                      Resume
                    </td>
                    <td className="p-2 text-red-400 cursor-pointer hover:text-red-500"
                        onClick={() => handleDeleteSession(session.name)}>
                      <Trash2 size={18} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-400">
                    No saved session found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
