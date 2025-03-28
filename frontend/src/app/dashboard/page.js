"use client";

import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Search, Database, Settings, FileText, Trash2, LogOut, Image, PinIcon, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../styles/Sidebar.css";
import { isAuthenticated } from "@/utils/auth";

const userEmail = "zendijkstra@fearlessmails.com";
const username = "uahnbu";

export default function Dashboard() {
  const [savedSessions, setSavedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
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

  const toggleProfile = () => {
    setProfileExpanded(!profileExpanded);
  };

  const activateSearchMode = () => {
    if (!searchMode) {
      setSearchMode(true);
    }
  };

  const deactivateSearchMode = () => {
    setSearchMode(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      console.log(`Searching for: ${e.target.value}`);
      // Implement your search functionality here
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Simplified Static Sidebar */}
      <div id="nav-bar" className={searchMode ? 'search-mode' : ''}>
        <div id="nav-header">
          <Link href="/" className="logo-link">
            <h1 id="nav-title">MetaQuery</h1>
          </Link>
          <hr />
        </div>

        <div id="nav-content">
          <div
            className={`nav-button search-bar ${searchMode ? 'search-bar-active' : ''}`}
            onClick={activateSearchMode}
          >
            <div className="icon">
              <Search size={20} />
            </div>
            <span>Your Work</span>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search..."
              onKeyDown={handleSearchSubmit}
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="search-cancel"
              onClick={(e) => {
                e.stopPropagation();
                deactivateSearchMode();
              }}
            >
              <X size={16} />
            </div>
          </div>

          <div className="nav-button">
            <div className="icon">
              <Image size={20} />
            </div>
            <span>Assets</span>
          </div>


          <div className="nav-button">
            <div className="icon">
              <Database size={20} />
            </div>
            <span>Projects</span>
          </div>

          <div className="nav-button">
            <div className="icon">
              <FileText size={20} />
            </div>
            <span>Billing</span>
          </div>

          <div className="nav-button">
            <div className="icon">
              <Settings size={20} />
            </div>
            <span>Settings</span>
          </div>
        </div>

        <div id="nav-footer">
          <div className="nav-footer-header" onClick={toggleProfile}>
            <div className="profile-container">
              <div className="user-avatar">
                <img src="https://placehold.co/40x40" alt="User avatar" />
              </div>
              <div className="user-info">
                <div className="username">{username}</div>
                <div className="user-role">{userEmail}</div>
              </div>
            </div>
            <div className={`arrow-icon ${profileExpanded ? 'arrow-down' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className={`profile-dropdown ${profileExpanded ? 'expanded' : ''}`}>
            <div className="user-status">

            </div>

            <button
              onClick={handleLogout}
              className="logout-button">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

{/* Main Content */}
<main className="flex-1 p-6 ml-[calc(var(--navbar-width)+2vw)]">
        <div className="flex justify-between items-center dashboard-main">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>

        <div className="flex justify-between items-center mt-10 project-header">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <Link href="/session" passHref>
            <button className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-500">
              New Project
            </button>
          </Link>
        </div>

    {/* Main Content */ }
  {/* Upper Boxes */ }
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

  {/* Sessions Table */ }
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
      </main >
    </div >
  );
}
