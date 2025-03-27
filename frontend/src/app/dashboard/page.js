import React from "react";
import { Search, Database, Settings, FileText } from "lucide-react";
import Link from "next/link";

const userEmail = "zendijkstra@fearlessmails.com";

const projects = [
  {
    name: "Database-CICD",
    region: "AWS US East 2 (Ohio)",
    createdAt: "Feb 28, 2025 11:10 pm",
    storage: "30.9 MB",
    postgresVersion: 17,
  },
  {
    name: "Database-CICD",
    region: "AWS US East 2 (Ohio)",
    createdAt: "Feb 28, 2025 11:08 pm",
    storage: "30.79 MB",
    postgresVersion: 17,
  },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r border-gray-700">
        {/* Top Section with Neon & User Email in Same Line */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-extrabold font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-2xl tracking-wide">MetaQuery</h1>
        </div>

        {/* Single Horizontal Line from Sidebar to Main Screen */}
        <hr className="border-gray-600 mb-4 w-[calc(100vw-2rem)] absolute left-0" />

        {/* Navigation */}
        <nav className="mt-10">
          {/* Boxed Search Bar with Proper Alignment */}
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
      </aside>



      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header Section with User Email at Top Right */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold"></h1>
          <span className="text-sm text-gray-300">{userEmail}</span>
        </div>

        {/* Search and Your Projects in One Line */}
        <div className="flex justify-between items-center mt-10">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <Link href="/session">
            <button className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500">
              New Project
            </button>
          </Link>
        </div>

        {/* Account Usage */}
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

        {/* Project Table */}
        <div className="mt-6 bg-gray-800 p-4 rounded border border-gray-700">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600 text-gray-400">
                <th className="p-2">Name</th>
                <th className="p-2">Created At</th>
                <th className="p-2">Storage</th>
                <th className="p-2">Active</th>
                <th className="p-2">Continue</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="p-2">{project.name}</td>
                  <td className="p-2">{project.createdAt}</td>
                  <td className="p-2">{project.storage}</td>
                  <td className="p-2">{project.postgresVersion}</td>
                  <td className="p-2 text-blue-400 cursor-pointer hover:underline">Resume</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
