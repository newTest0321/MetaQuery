"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [publicUrl, setPublicUrl] = useState("");
  const [contents, setContents] = useState([]);
  const [error, setError] = useState("");

  const handleListFiles = async () => {
    try {
      if (!publicUrl) {
        setError("Please enter a public S3 URL.");
        return;
      }

      const response = await axios.get(`http://localhost:8000/s3/list-public-bucket?public_url=${publicUrl}`);
      setContents(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files. Please check the input and try again.");
      setContents([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="w-full max-w-lg bg-gray-950 p-6 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">MetaQuery - S3 Viewer</h2>

        {/* Input Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Enter Public S3 URL</label>
          <input
            type="text"
            className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={publicUrl}
            onChange={(e) => setPublicUrl(e.target.value)}
            placeholder="e.g., https://meta-query-init.s3.eu-north-1.amazonaws.com/"
          />
        </div>

        {/* Submit Button */}
        <button
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 transition rounded-lg text-white font-semibold shadow-md"
          onClick={handleListFiles}
        >
          List Files
        </button>

        {/* Error Message */}
        {error && <div className="mt-4 text-red-400 text-sm text-center">{error}</div>}

        {/* Display File List */}
        {contents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xl font-semibold mb-3">Files & Folders</h4>
            <ul className="space-y-2">
              {contents.map((file, index) => (
                <li key={index} className="bg-gray-800 p-3 rounded-lg shadow-sm">
                  {file.Key}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
