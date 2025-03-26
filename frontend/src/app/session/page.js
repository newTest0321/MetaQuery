"use client";

import { useState } from "react";
import axios from "axios";

export default function S3Viewer() {
  const [publicUrl, setPublicUrl] = useState("");
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [currentPath, setCurrentPath] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");

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
      setMetadata(null);
      setError("");
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files. Please check the input and try again.");
      setContents({ folders: [], files: [] });
    }
  };

  const handleFileClick = async (fileKey) => {
    if (!fileKey.endsWith(".json")) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/s3/get-metadata-file?public_url=${publicUrl}&file_key=${fileKey}`
      );
  
      console.log("Raw metadata content:", response.data.content);
  
      // Attempt parsing only if content is a valid JSON string
      try {
        const parsedMetadata = JSON.parse(response.data.content);
        setMetadata(parsedMetadata);
      } catch (jsonError) {
        console.error("Invalid JSON format:", jsonError);
        setError("Error parsing JSON: Invalid format.");
        setMetadata(null);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      setError("Failed to load metadata file.");
      setMetadata(null);
    }
  };
  
  

  return (
    <div className="min-h-screen flex flex-row bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-1/4 h-screen p-4 overflow-y-auto bg-gray-950">
        <h2 className="text-xl font-bold mb-4">S3 Viewer</h2>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Enter Public S3 URL</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            placeholder="e.g., https://example.s3.amazonaws.com/"
          />
        </div>
        <button
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 transition rounded font-semibold"
          onClick={() => handleListFiles("")}
        >
          List Files
        </button>

        {/* File List */}
        <div className="mt-4">
          {currentPath && (
            <button
              className="text-sm text-gray-400 underline mb-2"
              onClick={() => handleListFiles("")}
            >
              ← Back to Root
            </button>
          )}
          {contents.folders.map((folder, index) => (
            <div
              key={index}
              className="p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => handleListFiles(folder)}
            >
              📁 {folder}
            </div>
          ))}
          {contents.files.map((file, index) => (
            <div
              key={index}
              className="p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
              onClick={() => handleFileClick(file)}
            >
              📄 {file}
            </div>
          ))}
        </div>
      </div>

      {/* JSON Viewer Panel */}
      <div className="w-3/4 h-screen p-4 overflow-y-auto bg-gray-800">
        {metadata ? (
          <>
            <h2 className="text-lg font-bold mb-2">Metadata Viewer</h2>
            <div className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-[80vh]">
              <pre className="text-green-400 text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </>
        ) : (
          <div className="text-gray-400">Select a JSON file to view metadata.</div>
        )}
      </div>
    </div>
  );
}