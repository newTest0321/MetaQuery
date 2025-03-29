"use client";

import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { Search, Database, Settings, FileText, Trash2, LogOut, Image, PinIcon, ChevronDown, X, Bell, Mail, MessageSquare } from "lucide-react";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'welcome',
      message: 'Welcome to MetaQuery! 👋',
      time: 'Just now',
      read: false
    },
    {
      id: 2,
      type: 'project',
      message: 'Your last session was saved successfully',
      time: '5m ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      message: 'New features available! Check them out',
      time: '1h ago',
      read: true
    }
  ]);
  const searchInputRef = useRef(null);
  const router = useRouter();
  const [showSupportMenu, setShowSupportMenu] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (searchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchMode]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      addUserNotification('welcome');
      localStorage.setItem('hasSeenWelcome', 'true');
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

  const handleResumeSession = async (session) => {
    try {
    router.push(`/session?resume=${session.filename}`);
      addProjectNotification(session.name, 'resume');
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  };

  const handleDeleteSession = async (filename, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:8000/sessions/delete/${filename}`);
      addProjectNotification(filename, 'delete');
      await loadSessions();
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

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Utility function to add new notifications
  const addNotification = (type, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
    // Show the notifications dropdown when a new notification arrives
    setShowNotifications(true);
  };

  // File related notifications
  const addFileNotification = (fileName, action) => {
    switch (action) {
      case 'download':
        addNotification('file', `${fileName} downloaded successfully`);
        break;
      case 'export':
        addNotification('file', `${fileName} exported successfully`);
        break;
      case 'import':
        addNotification('file', `${fileName} imported successfully`);
        break;
    }
  };

  // User account notifications
  const addUserNotification = (action, username = '') => {
    switch (action) {
      case 'welcome':
        addNotification('welcome', `Welcome to MetaQuery! 👋`);
        break;
      case 'verification':
        addNotification('account', 'Email verification successful');
        break;
      case 'settings':
        addNotification('account', 'Profile settings updated successfully');
        break;
    }
  };

  // Project related notifications
  const addProjectNotification = (projectName, action) => {
    switch (action) {
      case 'create':
        addNotification('project', `New project "${projectName}" created`);
        break;
      case 'delete':
        addNotification('project', `Project "${projectName}" deleted`);
        break;
      case 'update':
        addNotification('project', `Project "${projectName}" settings updated`);
        break;
      case 'connection':
        addNotification('project', `Database connection established for "${projectName}"`);
        break;
      case 'save':
        addNotification('project', `Session "${projectName}" saved successfully`);
        break;
      case 'resume':
        addNotification('project', `Session "${projectName}" resumed`);
        break;
    }
  };

  // Collaboration notifications
  const addCollaborationNotification = (username, action, projectName = '') => {
    switch (action) {
      case 'join':
        addNotification('collaboration', `${username} joined "${projectName}"`);
        break;
      case 'comment':
        addNotification('collaboration', `${username} commented on your query`);
        break;
      case 'share':
        addNotification('collaboration', `Project "${projectName}" shared successfully`);
        break;
    }
  };

  // System notifications
  const addSystemNotification = (action) => {
    switch (action) {
      case 'update':
        addNotification('system', 'New features available! Check them out');
        break;
      case 'maintenance':
        addNotification('system', 'System maintenance scheduled for tonight');
        break;
      case 'storage':
        addNotification('system', 'Storage usage approaching limit (80%)');
        break;
    }
  };

  // Listen for custom events from other parts of the application
  useEffect(() => {
    const handleSessionSave = (event) => {
      const { sessionName } = event.detail;
      addProjectNotification(sessionName, 'save');
    };

    const handleDatabaseConnection = (event) => {
      const { projectName } = event.detail;
      addProjectNotification(projectName, 'connection');
    };

    const handleFileOperation = (event) => {
      const { fileName, action } = event.detail;
      addFileNotification(fileName, action);
    };

    // Add event listeners
    window.addEventListener('sessionSaved', handleSessionSave);
    window.addEventListener('databaseConnected', handleDatabaseConnection);
    window.addEventListener('fileOperation', handleFileOperation);

    // Cleanup
    return () => {
      window.removeEventListener('sessionSaved', handleSessionSave);
      window.removeEventListener('databaseConnected', handleDatabaseConnection);
      window.removeEventListener('fileOperation', handleFileOperation);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Simplified Static Sidebar */}
      <div id="nav-bar" className="fixed left-0 top-0 bottom-0 w-[var(--navbar-width)] bg-[#0A0D1A] border-r border-gray-800 flex flex-col z-50 transition-all duration-300">
        <div id="nav-header" className="w-[var(--navbar-width)] px-6 py-5">
          <Link href="/" className="logo-link">
            <h1 className="bg-gradient-to-r from-[#5C24FF] via-[#FF3BFF] to-[#ECBFBF] text-transparent bg-clip-text text-3xl font-bold tracking-tight">
              MetaQuery
            </h1>
          </Link>
          <hr className="mt-6 border-gray-700" />
        </div>

        <div id="nav-content" className="flex-1">
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

        <div id="nav-footer" className="mt-auto">
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
<main className="flex-1 relative h-screen overflow-hidden ml-[var(--navbar-width)] transition-all duration-300">
  {/* Header Bar */}
  <div className="fixed top-0 right-0 left-[var(--navbar-width)] h-[92px] bg-[#0B1120] border-b border-gray-700 flex items-center px-6 z-10 transition-all duration-300">
    <div className="flex-1 flex items-center justify-end bg-blue-900/[0.2] border border-white/[0.1] rounded-md px-6 h-[64px] min-w-[400px]">
      <div className="flex items-center gap-6">
        <button className="text-sm text-white hover:text-white/80 cursor-pointer">
          Documentation
        </button>
        <div className="relative">
          <button 
            className="text-sm text-white hover:text-white/80 cursor-pointer flex items-center gap-1"
            onClick={() => setShowSupportMenu(!showSupportMenu)}
          >
            Support
            <ChevronDown size={14} className="text-white" />
          </button>
          
          {showSupportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              <a 
                href="mailto:MetaQuery@co.in"
                className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer"
              >
                <Mail size={16} />
                <span>MetaQuery@co.in</span>
              </a>
              <button 
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer border-t border-gray-700"
              >
                <MessageSquare size={16} />
                <span>Chat with us</span>
              </button>
            </div>
          )}
        </div>
        <div className="relative">
          <button 
            className="text-white hover:text-white/80 relative cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-500 text-xs text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications([]);
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-[480px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400 text-center">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-gray-800/50' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(notification.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-white">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
        </div>

  {/* Scrollable Content Area */}
  <div className="absolute inset-0 top-[92px] px-4 sm:px-6 md:px-10 pb-8 overflow-y-auto scrollbar-hide">
    {/* Projects Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 mb-8 gap-4">
      <h1 className="text-2xl font-semibold">Your projects</h1>
      <div className="flex gap-3 w-full sm:w-auto">
        <Link href="/session" passHref className="w-full sm:w-auto">
          <button className="w-full sm:w-auto bg-blue-600 px-4 py-2 rounded-md text-white hover:bg-blue-500">
            New Project
          </button>
        </Link>
      </div>
    </div>

    {/* Account Usage Section */}
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-8 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Account Usage</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Storage</p>
          <p className="text-lg font-semibold">0.06 / 0.5 GB</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Compute</p>
          <p className="text-lg font-semibold">0 / 191.9 h</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Branch Compute</p>
          <p className="text-lg font-semibold">0 / 5 h</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Data Transfer</p>
          <p className="text-lg font-semibold">0 / 5 GB</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Projects</p>
          <p className="text-lg font-semibold">1 / 10</p>
        </div>
  </div>
    </div>

    {/* Projects Table */}
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-gray-900">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created At</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Storage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Resume</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Delete</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                Loading projects...
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
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {session.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatDate(session.timestamp)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  Session Active
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    className="text-blue-400 hover:text-blue-300 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResumeSession(session);
                    }}
                  >
                    Resume
                  </button>
                </td>
                <td className="px-6 py-4 text-sm">
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

<style jsx global>{`
  :root {
    --navbar-width: 280px;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    :root {
      --navbar-width: 0px;
    }
    #nav-bar {
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
    }
    #nav-bar.open {
      transform: translateX(0);
    }
    main {
      margin-left: 0 !important;
    }
    .header-content {
      left: 0 !important;
    }
  }
`}</style>
    </div>
  );
}
