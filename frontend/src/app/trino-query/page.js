"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TrinoQueryExecutor() {
  const [query, setQuery] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [optimizedQuery, setOptimizedQuery] = useState(null);
  const [queryResults, setQueryResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const handleQueryOptimization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trino/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          metadata
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize query");
      }

      setOptimizedQuery(data.optimizedQuery);
      setPerformanceMetrics(data.performanceMetrics);
    } catch (error) {
      console.error("Query optimization error:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryExecution = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trino/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: optimizedQuery || query
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to execute query");
      }

      setQueryResults(data.results);
      setPerformanceMetrics(data.performanceMetrics);
    } catch (error) {
      console.error("Query execution error:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
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
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-white">
                MetaQuery - Trino Query Executor
              </Link>
            </div>
          </div>

          {/* Query Editor */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h2 className="text-lg font-semibold mb-4">SQL Query</h2>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-64 bg-black/50 text-white p-4 rounded-lg font-mono"
                  placeholder="Enter your SQL query..."
                />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleQueryOptimization}
                    disabled={!query || isLoading}
                    className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Optimize Query
                  </button>
                  <button
                    onClick={handleQueryExecution}
                    disabled={!query || isLoading}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Execute Query
                  </button>
                </div>
              </div>

              {optimizedQuery && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h2 className="text-lg font-semibold mb-4">Optimized Query</h2>
                  <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto">
                    {optimizedQuery}
                  </pre>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {performanceMetrics && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm text-gray-400">Execution Time</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${Math.min(
                                (performanceMetrics.executionTime / performanceMetrics.baselineTime) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                        <span>{performanceMetrics.executionTime}ms</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">CPU Usage</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${performanceMetrics.cpuUsage}%` }}
                          />
                        </div>
                        <span>{performanceMetrics.cpuUsage}%</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-400">Memory Usage</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${performanceMetrics.memoryUsage}%` }}
                          />
                        </div>
                        <span>{performanceMetrics.memoryUsage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {queryResults && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h2 className="text-lg font-semibold mb-4">Query Results</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          {Object.keys(queryResults[0] || {}).map((key) => (
                            <th key={key} className="text-left p-2 border-b border-white/10">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((value, j) => (
                              <td key={j} className="p-2 border-b border-white/10">
                                {JSON.stringify(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 