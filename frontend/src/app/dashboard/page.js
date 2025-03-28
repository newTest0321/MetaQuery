"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [savedSessions, setSavedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sessions/list');
      setSavedSessions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading sessions:", error);
      setLoading(false);
    }
  };

  const handleResumeSession = (session) => {
    router.push(`/session?resume=${session.filename}`);
  };

  const handleDeleteSession = async (filename, e) => {
    e.stopPropagation(); // Prevent triggering the resume action
    try {
      await axios.delete(`http://localhost:8000/sessions/delete/${filename}`);
      await loadSessions(); // Refresh the list
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <button
              onClick={() => router.push('/session')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium">Storage</h3>
            <p className="text-2xl font-bold text-white mt-2">0.06 / 0.5 GB</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium">Compute</h3>
            <p className="text-2xl font-bold text-white mt-2">0 / 191.9 h</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium">Branch Compute</h3>
            <p className="text-2xl font-bold text-white mt-2">0 / 5 h</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium">Data Transfer</h3>
            <p className="text-2xl font-bold text-white mt-2">0 / 5 GB</p>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Your Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Storage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                      Loading sessions...
                    </td>
                  </tr>
                ) : savedSessions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                      No sessions found. Create a new project to get started.
                    </td>
                  </tr>
                ) : (
                  savedSessions.map((session, index) => (
                    <tr 
                      key={index}
                      className="hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => handleResumeSession(session)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {session.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(session.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        Session Active
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="text-blue-400 hover:text-blue-300 font-medium"
                          onClick={() => handleResumeSession(session)}
                        >
                          Resume
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="text-red-400 hover:text-red-300"
                          onClick={(e) => handleDeleteSession(session.filename, e)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
