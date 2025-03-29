"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

export default function MetadataOptimizer() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [optimizedMetadata, setOptimizedMetadata] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      addMessage("system", `File uploaded: ${file.name}`);
      readFileContent(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const readFileContent = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);
        addMessage("system", "File content loaded successfully. How would you like to optimize this metadata?");
      } catch (error) {
        addMessage("system", "Error reading file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !uploadedFile) return;

    const userMessage = inputMessage;
    setInputMessage("");
    addMessage("user", userMessage);
    setIsLoading(true);

    try {
      console.log('Reading file content...');
      const fileContent = await readFileAsJSON(uploadedFile);
      console.log('File content loaded:', fileContent);

      console.log('Sending request to API...');
      const response = await fetch("/api/metadata/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: fileContent,
          prompt: userMessage
        }),
      });

      console.log('API Response status:', response.status);
      let data;
      try {
        data = await response.json();
        console.log('API Response data:', data);
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorMessage = data?.error || `API error: ${response.status}`;
        console.error('API Error:', {
          status: response.status,
          error: errorMessage,
          data: data
        });
        throw new Error(errorMessage);
      }

      if (!data || !data.optimizedMetadata) {
        console.error('Invalid API response:', data);
        throw new Error('Invalid response format from API');
      }

      setOptimizedMetadata(data.optimizedMetadata);
      addMessage("ai", formatAIResponse(data));
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      addMessage("system", `Error: ${error.message || 'Failed to process your request. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target.result));
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const formatAIResponse = (data) => {
    let response = "I've analyzed your metadata and made the following optimizations:\n\n";
    
    // Add optimization details
    if (data.recommendations) {
      response += "Recommendations:\n";
      data.recommendations.forEach(rec => {
        response += `• ${rec.description} (Priority: ${rec.priority}, Impact: ${rec.impact})\n`;
      });
    }

    // Add improvements
    if (data.improvements) {
      response += "\nImprovements:\n";
      Object.entries(data.improvements).forEach(([key, value]) => {
        response += `• ${key}: ${value.improvement} improvement\n`;
      });
    }

    response += "\nWould you like to download the optimized metadata file?";
    return response;
  };

  const handleDownload = () => {
    if (!optimizedMetadata) return;

    const blob = new Blob([JSON.stringify(optimizedMetadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_${uploadedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-8 py-12"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="text-2xl font-bold text-white">M</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    MetaQuery
                  </h1>
                  <p className="text-sm text-gray-400">AI Metadata Optimizer</p>
                </div>
              </Link>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-white/5 backdrop-blur-md hover:bg-white/10 rounded-xl transition-all border border-white/10 hover:border-white/20 flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>

          {/* Chat Interface */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === 'user' 
                        ? 'bg-purple-500/20 text-white' 
                        : message.type === 'ai'
                        ? 'bg-white/10 text-white'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-50 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* File Upload Area */}
            {!uploadedFile && (
              <div className="p-4 border-t border-white/10">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/20 hover:border-purple-500/50'
                  }`}
                >
                  <input {...getInputProps()} ref={fileInputRef} />
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-400">
                      Drag and drop your metadata file here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: JSON, TXT, CSV
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            {uploadedFile && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask how to optimize your metadata..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Send
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Download Button */}
            {optimizedMetadata && (
              <div className="p-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Optimized Metadata
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 