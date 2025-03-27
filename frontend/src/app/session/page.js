"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth"; 

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

export default function S3Viewer() {
  const [publicUrl, setPublicUrl] = useState("");
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [currentPath, setCurrentPath] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isMetadataOpened, setIsMetadataOpened] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [savedSessions, setSavedSessions] = useState([]);

  useEffect(() => {
    localStorage.removeItem("savedSession");
    setPublicUrl("");

    // Load saved sessions from local storage
    const storedSessions = JSON.parse(localStorage.getItem("savedSessions")) || [];
    setSavedSessions(storedSessions);
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    const updateViewerHeight = () => {
      if (viewerRef.current) {
        setViewerHeight(`${viewerRef.current.clientHeight - 20}px`);
      }
    };
    updateViewerHeight();
    window.addEventListener("resize", updateViewerHeight);
    return () => window.removeEventListener("resize", updateViewerHeight);
  }, [fileContent]);
  
  const handleListFiles = async (folder = "") => {
    if (!publicUrl) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/s3/list-public-bucket?public_url=${publicUrl}&folder=${folder}`
      );
      setContents(response.data);
      setCurrentPath(folder);
      setFileContent(null);
      setIsMetadataOpened(false);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleFileClick = async (fileKey) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/s3/get-file?public_url=${publicUrl}&file_key=${fileKey}`
      );
      const { content, type } = response.data;
      setFileType(type);

      if (type === "json") {
        setFileContent(JSON.parse(content));
        setIsMetadataOpened(true);
      } else {
        setFileContent(content);
        setIsMetadataOpened(false);
      }
    } catch (error) {
      console.error("Error fetching file:", error);
    }
  };

  const handleSaveSessionClick = () => {
    setShowSavePopup(true);
  };

  const handleSaveSession = () => {
    if (!sessionName.trim()) return;

    const newSession = {
      name: sessionName.trim(),
      publicUrl,
      currentPath,
      createdAt: new Date().toISOString(),
    };

    const updatedSessions = [...savedSessions, newSession];
    localStorage.setItem("savedSessions", JSON.stringify(updatedSessions));

    setSavedSessions(updatedSessions);
    setShowSavePopup(false);
    setSessionName(""); // Reset input field
  };

  const handleResumeSession = (session) => {
    setPublicUrl(session.publicUrl);
    setCurrentPath(session.currentPath);
    handleListFiles(session.currentPath);
  };

  const handleDeleteSession = (index) => {
    const updatedSessions = savedSessions.filter((_, i) => i !== index);
    localStorage.setItem("savedSessions", JSON.stringify(updatedSessions));
    setSavedSessions(updatedSessions);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 h-auto md:h-screen p-6 overflow-y-auto bg-gray-950 border-r border-gray-700">

        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-2xl tracking-wide">
          MetaQuery
        </h1>

        <label className="block text-sm font-medium mt-6 mb-2">Enter Public S3 URL</label>
        <input
          type="text"
          className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg mb-4"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          placeholder="https://example.s3.amazonaws.com/"
        />

        {/* Back Button */}
        {currentPath && (
          <button
            className="w-full p-2 mb-3 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm font-semibold"
            onClick={() => handleListFiles("")}
          >
            ← Back
          </button>
        )}

        {/* List Files Button */}
        <button
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"

          onClick={() => handleListFiles("")}
          disabled={!publicUrl}
        >
          List Files
        </button>

        {/* File List */}
        <div className="mt-6 space-y-4">
          {contents.folders.map((folder, index) => (
            <div
              key={index}
              className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition flex items-center justify-between"
              onClick={() => handleListFiles(folder)}
            >
              <span className="truncate w-full">📁 {folder}</span>
            </div>
          ))}
          {contents.files.map((file, index) => (
            <div
              key={index}
              className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition flex items-center justify-between"
              onClick={() => handleFileClick(file)}
            >
              <span className="truncate w-full">📄 {file}</span>
            </div>
          ))}
        </div>

        {/* Save Session Button */}
        <button
          className="w-full mt-6 p-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          onClick={handleSaveSessionClick}
        >
          Save Session
        </button>

        {/* Saved Sessions Section */}
        <div className="mt-8">
          <p className="text-lg font-semibold text-gray-300 mb-2">Saved Sessions</p>
          {savedSessions.length > 0 ? (
            <ul className="space-y-3">
              {savedSessions.map((session, index) => (
                <li
                  key={index}
                  className="p-3 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition"
                >
                  <span
                    className="truncate w-full cursor-pointer"
                    onClick={() => handleResumeSession(session)}
                  >
                    📌 {session.name}
                  </span>
                  <button
                    className="ml-3 text-gray-400 hover:text-red-500"
                    onClick={() => handleDeleteSession(index)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No saved sessions yet.</p>
          )}
        </div>
      </div>

      {/* File Viewer Panel */}

      <div className="w-full md:w-3/4 h-auto md:h-screen p-6 overflow-y-auto">
        {fileContent ? (
          fileType === "json" ? (
            <ReactJson src={fileContent} theme="monokai" collapsed={2} displayDataTypes={false} />
          ) : (
            <pre className="text-white text-sm whitespace-pre-wrap break-words">{fileContent}</pre>

          )
        ) : (
          <div className="text-gray-400 text-lg">Select a file to view its contents.</div>
        )}
      </div>

      {/* Save Session Popup */}
      {showSavePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <p className="text-white text-lg">Enter a name for your session:</p>
            <input
              type="text"
              className="w-full p-2 mt-3 bg-gray-700 text-white border border-gray-500 rounded-md"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session Name"
            />
            <button className="mt-4 bg-green-500 hover:bg-green-600 text-white p-2 rounded-md" onClick={handleSaveSession}>
              Save
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
