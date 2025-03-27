"use client";

import { useState, useEffect, useRef } from "react";
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
  const [error, setError] = useState("");
  const [fileType, setFileType] = useState(null);
  const viewerRef = useRef(null);
  const [viewerHeight, setViewerHeight] = useState("500px");

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
    try {
      if (!publicUrl) {
        setError("Please enter a public S3 URL.");
        return;
      }
      const response = await axios.get(
        `http://localhost:8000/s3/list-public-bucket?public_url=${publicUrl}&folder=${folder}`
      );
      setContents(response.data);
      setCurrentPath(folder);
      setFileContent(null);
      setError("");
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files. Please check the input and try again.");
      setContents({ folders: [], files: [] });
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
        try {
          setFileContent(JSON.parse(content));
        } catch (jsonError) {
          console.error("Invalid JSON format:", jsonError);
          setError("Error parsing JSON: Invalid format.");
          setFileContent(null);
        }
      } else if (type === "text") {
        setFileContent(content);
      } else {
        setFileContent(null);
      }
    } catch (error) {
      console.error("Error fetching file:", error);
      setError("Failed to load file.");
      setFileContent(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 h-auto md:h-screen p-6 overflow-y-auto bg-gray-950 border-r border-gray-700">
        <Link href="/dashboard">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent text-2xl tracking-wide cursor-pointer">MetaQuery</h1>
        </Link>
        <p className="text-2xl mt-10 font-bold mb-4">S3 Viewer</p>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Enter Public S3 URL</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            placeholder="e.g., https://example.s3.amazonaws.com/"
          />
        </div>
        <button
          className={`w-full p-3 rounded-lg font-semibold text-lg cursor-pointer transform transition-all duration-300 ${publicUrl
              ? "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 hover:scale-105"
              : "bg-gray-700 cursor-not-allowed"
            }`}
          onClick={() => handleListFiles("")}
          disabled={!publicUrl}
        >
          List Files
        </button>

        {/* File List */}
        <div className="mt-6">
          {currentPath && (
            <button
              className="text-sm text-gray-400 mb-3 block cursor-pointer hover:text-gray-200 transition-all duration-300"
              onClick={() => handleListFiles("")}
            >
              ← Back
            </button>
          )}
          <div className="space-y-3">
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
        </div>
      </div>

      {/* File Viewer Panel */}
      <div ref={viewerRef} className="w-full md:w-3/4 h-auto md:h-screen p-6 overflow-y-auto bg-black-800">
        {fileContent ? (
          fileType === "json" ? (
            <ReactJson
              src={fileContent}
              theme="monokai"
              collapsed={2}
              displayDataTypes={false}
              enableClipboard={true}
              style={{ minHeight: viewerHeight, overflowY: "auto", backgroundColor: "transparent" }}
            />
          ) : fileType === "text" ? (
            <pre className="text-white text-sm whitespace-pre-wrap break-words">{fileContent}</pre>
          ) : (
            <a href={`http://localhost:8000/s3/download?public_url=${publicUrl}&file_key=${fileContent}`} className="text-blue-400 underline">
              Download File
            </a>
          )
        ) : (
          <div className="text-gray-400 text-lg">Select a file to view its contents.</div>
        )}
      </div>
    </div>
  );
}
