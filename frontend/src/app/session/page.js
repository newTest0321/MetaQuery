'use client';

import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  const [bucketName, setBucketName] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [contents, setContents] = useState([]);
  const [error, setError] = useState("");

  const handleListFiles = async () => {
    try {
      let response;

      if (bucketName) {
        // Call API to list files from an S3 bucket
        response = await axios.get(`http://localhost:8000/list-bucket?bucket_name=${bucketName}`);
      } else if (publicUrl) {
        // Call API to list files from a public S3 URL
        response = await axios.get(`http://localhost:8000/list-public-bucket?public_url=${publicUrl}`);
      } else {
        setError("Please enter either an S3 bucket name or a public URL.");
        return;
      }

      setContents(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files. Please check the input and try again.");
      setContents([]);
    }
  };

  return (
    <div className="container mt-5">
      <h2>MetaQuery - S3 Bucket Viewer</h2>

      {/* Input for S3 Bucket Name */}
      <div className="mb-3">
        <label className="form-label">Enter S3 Bucket Name</label>
        <input
          type="text"
          className="form-control"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          placeholder="e.g., meta-query-init"
        />
      </div>

      {/* Input for Public S3 URL */}
      <div className="mb-3">
        <label className="form-label">Enter Public S3 URL</label>
        <input
          type="text"
          className="form-control"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          placeholder="e.g., https://s3.eu-north-1.amazonaws.com/meta-query-init"
        />
      </div>

      {/* Submit button */}
      <button className="btn btn-primary" onClick={handleListFiles}>List Files</button>

      {/* Error Message */}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {/* Display File List */}
      {contents.length > 0 && (
        <div className="mt-4">
          <h4>Files & Folders</h4>
          <ul className="list-group">
            {contents.map((file, index) => (
              <li key={index} className="list-group-item">
                {file.Key}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
