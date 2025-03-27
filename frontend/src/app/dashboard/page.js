"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Database, Settings, FileText, Trash2, LogOut, Image, PinIcon, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../../styles/Sidebar.css";

const userEmail = "zendijkstra@fearlessmails.com";
const username = "uahnbu"; // Variable for username as requested

export default function Dashboard() {
  const [savedSessions, setSavedSessions] = useState([]);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem("savedSessions")) || [];
    setSavedSessions(sessions);
  }, []);

  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

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
