'use client'

import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  const [files, setFiles] = useState([]); 
  const [metadata, setMetadata] = useState(null);
  const [selectedFile, setSelectedFile] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/list-files")
      .then(response => setFiles(response.data))
      .catch(error => console.error("Error fetching files:", error));
  }, []);

  const fetchMetadata = (filename) => {
    setSelectedFile(filename);
    axios.get(`http://localhost:8000/get-metadata/${filename}`)
      .then(response => setMetadata(response.data))
      .catch(error => console.error("Error fetching metadata:", error));
  };

  return (
    <div className="container mt-5">
      <h2>MetaQuery - S3 Metadata Viewer</h2>
      <ul className="list-group mt-3">
        {files.map((file, index) => (
          <li
            key={index}
            className="list-group-item d-flex justify-content-between align-items-center"
            onClick={() => fetchMetadata(file.Key)}
            style={{ cursor: "pointer" }}
          >
            {file.Key}
          </li>
        ))}
      </ul>

      {metadata && (
        <div className="mt-4">
          <h4>Metadata for {selectedFile}</h4>
          <pre>{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
