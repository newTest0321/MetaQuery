"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Import languages
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import go from 'highlight.js/lib/languages/go';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import rust from 'highlight.js/lib/languages/rust';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('html', html);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('json', json);

export default function Versioning() {
  const [files, setFiles] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState(new Set());

  const toggleFile = (fileId) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'txt': 'text',
      'csv': 'csv',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash'
    };
    return typeMap[ext] || 'text';
  };

  const formatContent = (content, fileType) => {
    try {
      switch (fileType) {
        case 'json':
          // Parse and format JSON with proper indentation
          const jsonObj = JSON.parse(content);
          return JSON.stringify(jsonObj, null, 2);
        
        case 'csv':
          // Format CSV with proper column alignment
          const lines = content.split('\n');
          const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
          const maxLengths = rows.reduce((acc, row) => {
            row.forEach((cell, i) => {
              acc[i] = Math.max(acc[i] || 0, cell.length);
            });
            return acc;
          }, []);
          
          return rows.map(row => 
            row.map((cell, i) => cell.padEnd(maxLengths[i])).join(', ')
          ).join('\n');

        case 'yaml':
        case 'yml':
          // Basic YAML formatting with proper indentation
          const yamlLines = content.split('\n');
          let indentLevel = 0;
          return yamlLines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-')) {
              return '  '.repeat(indentLevel) + trimmed;
            }
            if (trimmed.endsWith(':')) {
              const formatted = '  '.repeat(indentLevel) + trimmed;
              indentLevel++;
              return formatted;
            }
            if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
              indentLevel--;
            }
            return '  '.repeat(indentLevel) + trimmed;
          }).join('\n');

        case 'xml':
          // Format XML with proper indentation
          let xmlIndent = 0;
          return content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('</')) xmlIndent--;
            const formatted = '  '.repeat(xmlIndent) + trimmed;
            if (!trimmed.startsWith('</') && trimmed.endsWith('>')) xmlIndent++;
            return formatted;
          }).join('\n');

        case 'sql':
          // Format SQL with proper keyword capitalization and indentation
          const keywords = [
            'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE',
            'CREATE', 'TABLE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
            'OUTER', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'VALUES',
            'SET', 'INTO', 'AS', 'ON', 'IS', 'NULL', 'NOT', 'DISTINCT', 'COUNT',
            'SUM', 'AVG', 'MAX', 'MIN', 'UNION', 'ALL', 'EXISTS', 'IN', 'BETWEEN',
            'LIKE', 'ASC', 'DESC'
          ];
          
          let sqlIndent = 0;
          return content.split('\n').map(line => {
            let formatted = line;
            keywords.forEach(keyword => {
              const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
              formatted = formatted.replace(regex, keyword);
            });
            
            if (formatted.trim().toUpperCase().startsWith('SELECT')) {
              sqlIndent = 0;
            }
            if (formatted.trim().toUpperCase().startsWith('FROM')) {
              sqlIndent = 1;
            }
            if (formatted.trim().toUpperCase().startsWith('WHERE')) {
              sqlIndent = 2;
            }
            
            return '  '.repeat(sqlIndent) + formatted;
          }).join('\n');

        case 'html':
          // Format HTML with proper indentation
          let htmlIndent = 0;
          return content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('</')) htmlIndent--;
            const formatted = '  '.repeat(htmlIndent) + trimmed;
            if (!trimmed.startsWith('</') && trimmed.endsWith('>')) htmlIndent++;
            return formatted;
          }).join('\n');

        case 'css':
          // Format CSS with proper indentation and spacing
          let cssIndent = 0;
          return content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.includes('}')) cssIndent--;
            const formatted = '  '.repeat(cssIndent) + trimmed;
            if (trimmed.includes('{')) cssIndent++;
            return formatted;
          }).join('\n');

        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
          // Basic JavaScript/TypeScript formatting
          let jsIndent = 0;
          return content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.includes('}')) jsIndent--;
            const formatted = '  '.repeat(jsIndent) + trimmed;
            if (trimmed.includes('{')) jsIndent++;
            return formatted;
          }).join('\n');

        case 'py':
          // Python formatting with proper indentation
          let pyIndent = 0;
          return content.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('else:') || trimmed.startsWith('elif:') || 
                trimmed.startsWith('except:') || trimmed.startsWith('finally:')) {
              pyIndent--;
            }
            const formatted = '  '.repeat(pyIndent) + trimmed;
            if (trimmed.endsWith(':')) pyIndent++;
            return formatted;
          }).join('\n');

        default:
          return content;
      }
    } catch (error) {
      console.error(`Error formatting ${fileType}:`, error);
      return content;
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    setError(null); // Clear any previous errors
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      content: null,
      name: file.name,
      timestamp: new Date().toISOString(),
      type: getFileType(file.name)
    }));
    setFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(fileObj => {
      const reader = new FileReader();
      reader.onload = () => {
        const formattedContent = formatContent(reader.result, fileObj.type);
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, content: formattedContent } : f
        ));
      };
      reader.onerror = () => {
        setError(`Error reading file ${fileObj.name}`);
      };
      reader.readAsText(fileObj.file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/*': ['.txt', '.json', '.csv', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs', '.html', '.css', '.xml', '.yaml', '.yml', '.sql', '.sh', '.bash'],
      'application/json': ['.json']
    }
  });

  const compareFiles = () => {
    setError(null); // Clear any previous errors
    if (files.length < 2) {
      setError("Please upload at least two files to compare");
      return;
    }

    // Sort files by timestamp to compare latest two
    const sortedFiles = [...files].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const file1 = sortedFiles[0];
    const file2 = sortedFiles[1];

    if (!file1.content || !file2.content) {
      setError("Still loading file contents...");
      return;
    }

    // Generate diff
    const diff = generateSideBySideDiff(file2.content, file1.content); // Newer file first
    setDiffResult({
      diff,
      oldFile: file1.name,
      newFile: file2.name,
      oldContent: file1.content.split('\n'),
      newContent: file2.content.split('\n')
    });
    setComparing(true);
  };

  const generateSideBySideDiff = (newContent, oldContent) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const maxLength = Math.max(oldLines.length, newLines.length);
    const diff = [];

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine === newLine) {
        // Lines are identical
        diff.push({
          type: 'unchanged',
          lineNumber: i + 1,
          oldLine: [{ text: oldLine, type: 'unchanged' }],
          newLine: [{ text: newLine, type: 'unchanged' }]
        });
      } else if (!oldLine) {
        // Line added
        diff.push({
          type: 'added',
          lineNumber: i + 1,
          oldLine: [],
          newLine: [{ text: newLine, type: 'added' }]
        });
      } else if (!newLine) {
        // Line removed
        diff.push({
          type: 'removed',
          lineNumber: i + 1,
          oldLine: [{ text: oldLine, type: 'removed' }],
          newLine: []
        });
      } else {
        // Lines are different - find specific changes while preserving indentation
        const { oldResult, newResult } = findTextDifferences(oldLine, newLine);
        diff.push({
          type: 'modified',
          lineNumber: i + 1,
          oldLine: oldResult,
          newLine: newResult
        });
      }
    }

    return diff;
  };

  const findTextDifferences = (oldText, newText) => {
    // Find leading whitespace
    const oldIndent = oldText.match(/^\s*/)[0];
    const newIndent = newText.match(/^\s*/)[0];
    
    // Remove leading whitespace for comparison
    const oldTrimmed = oldText.trimLeft();
    const newTrimmed = newText.trimLeft();
    
    // Split text into tokens (words, numbers, and special characters)
    const tokenize = (text) => {
      return text.match(/\d+|\w+|[^\w\s]/g) || [];
    };

    const oldTokens = tokenize(oldTrimmed);
    const newTokens = tokenize(newTrimmed);
    
    let oldIndex = 0;
    let newIndex = 0;
    const oldResult = [];
    const newResult = [];
    
    // Add indentation as first token
    if (oldIndent) oldResult.push({ text: oldIndent, type: 'unchanged' });
    if (newIndent) newResult.push({ text: newIndent, type: 'unchanged' });
    
    while (oldIndex < oldTokens.length || newIndex < newTokens.length) {
      const oldToken = oldTokens[oldIndex];
      const newToken = newTokens[newIndex];
      
      if (!oldToken) {
        // Remaining tokens in new text are additions
        newResult.push({ text: newToken, type: 'added' });
        newIndex++;
      } else if (!newToken) {
        // Remaining tokens in old text are deletions
        oldResult.push({ text: oldToken, type: 'removed' });
        oldIndex++;
      } else if (oldToken === newToken) {
        // Tokens are identical
        oldResult.push({ text: oldToken, type: 'unchanged' });
        newResult.push({ text: newToken, type: 'unchanged' });
        oldIndex++;
        newIndex++;
      } else {
        // Tokens are different
        // Check if it's a number change
        if (/^\d+$/.test(oldToken) && /^\d+$/.test(newToken)) {
          oldResult.push({ text: oldToken, type: 'removed' });
          newResult.push({ text: newToken, type: 'added' });
        } else {
          // For non-number changes, try to find the longest common subsequence
          const commonPrefix = findCommonPrefix(oldToken, newToken);
          const commonSuffix = findCommonSuffix(oldToken, newToken);
          
          if (commonPrefix || commonSuffix) {
            // Split the tokens into prefix, middle, and suffix
            const oldMiddle = oldToken.slice(commonPrefix.length, oldToken.length - commonSuffix.length);
            const newMiddle = newToken.slice(commonPrefix.length, newToken.length - commonSuffix.length);
            
            if (commonPrefix) {
              oldResult.push({ text: commonPrefix, type: 'unchanged' });
              newResult.push({ text: commonPrefix, type: 'unchanged' });
            }
            
            if (oldMiddle) oldResult.push({ text: oldMiddle, type: 'removed' });
            if (newMiddle) newResult.push({ text: newMiddle, type: 'added' });
            
            if (commonSuffix) {
              oldResult.push({ text: commonSuffix, type: 'unchanged' });
              newResult.push({ text: commonSuffix, type: 'unchanged' });
            }
          } else {
            // If no common parts found, mark entire token as changed
            oldResult.push({ text: oldToken, type: 'removed' });
            newResult.push({ text: newToken, type: 'added' });
          }
        }
        oldIndex++;
        newIndex++;
      }
    }
    
    return { oldResult, newResult };
  };

  const findCommonPrefix = (str1, str2) => {
    let prefix = '';
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) {
        prefix += str1[i];
      } else {
        break;
      }
    }
    return prefix;
  };

  const findCommonSuffix = (str1, str2) => {
    let suffix = '';
    for (let i = 1; i <= Math.min(str1.length, str2.length); i++) {
      if (str1[str1.length - i] === str2[str2.length - i]) {
        suffix = str1[str1.length - i] + suffix;
      } else {
        break;
      }
    }
    return suffix;
  };

  const removeFile = (idToRemove) => {
    setError(null); // Clear any previous errors
    setFiles(prev => prev.filter(f => f.id !== idToRemove));
    if (comparing) {
      setComparing(false);
      setDiffResult(null);
    }
  };

  useEffect(() => {
    // Highlight all code blocks when files change
    hljs.highlightAll();
  }, [files]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-8 py-12"
        >
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
                  <p className="text-sm text-gray-400">File Versioning</p>
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

          {/* Content Layout */}
          <div className={`relative ${files.length > 0 ? 'grid grid-cols-3 gap-8' : ''}`}>
            {/* File List - Left 2/3 */}
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.2
                }}
                className="col-span-2 space-y-4"
              >
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1],
                      delay: 0.3 + (index * 0.1)
                    }}
                    className={`h-[100px] bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-all group ${
                      expandedFiles.has(file.id) ? 'bg-purple-500/10 border-purple-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-200">{file.name}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(file.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFile(file.id)}
                          className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedFiles.has(file.id) ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"} />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFile(file.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Dropzone - Right 1/3 or Center when no files */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: files.length > 0 ? 'calc(-5.666% + 1rem)' : 0
              }}
              transition={{ 
                duration: 1.5,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.2,
                x: {
                  duration: 1.8,
                  ease: [0.4, 0, 0.2, 1],
                  type: "spring",
                  stiffness: 100,
                  damping: 40
                }
              }}
              className={`${files.length > 0 ? 'col-span-1' : 'mx-auto w-full max-w-[500px]'}`}
            >
              <motion.div
                {...getRootProps()}
                className={`h-[204px] border-2 border-dashed rounded-xl p-8 text-center transition-all backdrop-blur-md flex flex-col items-center justify-center ${
                  isDragActive
                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: isDragActive ? 1.1 : 1,
                      rotate: isDragActive ? 5 : 0
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 100,
                      damping: 20
                    }}
                  >
                    <svg
                      className="w-12 h-12 mb-4 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </motion.div>
                  <motion.p 
                    className="text-lg text-gray-200 font-medium"
                    animate={{ y: isDragActive ? -2 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {isDragActive
                      ? "Drop the files here..."
                      : "Drag & drop files here"}
                  </motion.p>
                  <motion.p 
                    className="text-sm text-gray-400 mt-2"
                    animate={{ opacity: isDragActive ? 0.8 : 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    or click to select files
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* File Content Display Section */}
          <div className="mt-8">
            {files.map((file) => (
              <AnimatePresence key={file.id}>
                {expandedFiles.has(file.id) && file.content && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="mb-8"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-400">{file.name} - {file.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {file.content.split('\n').length} lines
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-lg"></div>
                      <div className="relative overflow-x-auto rounded-lg bg-[#0d1117] backdrop-blur-md border border-white/10">
                        <pre className="p-4 m-0">
                          <code className={`language-${file.type} text-sm leading-relaxed`}>
                            {file.content}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Comparison Button */}
          {files.length >= 2 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={compareFiles}
              transition={{
                duration: 1,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.4
              }}
              className="w-full mt-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Compare Files
            </motion.button>
          )}

          {/* Side-by-Side Diff Viewer */}
          <AnimatePresence>
            {comparing && diffResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-8 bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 shadow-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-200">File Comparison</h2>
                    <p className="text-gray-400 mt-1">View changes between versions</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                      <p className="text-sm text-red-400">Removed</p>
                    </div>
                    <div className="px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-400">Added</p>
                    </div>
                  </div>
                </div>
                <div className="mb-6 flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                    <p className="text-sm text-gray-400">
                      Old Version: {diffResult.oldFile}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    <p className="text-sm text-gray-400">
                      New Version: {diffResult.newFile}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 font-mono text-sm">
                  <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 overflow-x-auto border border-white/10">
                    <div className="space-y-1">
                      {diffResult.diff.map((change, index) => (
                        <motion.div
                          key={`old-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex rounded-lg px-3 py-1.5 min-h-[1.5rem] items-center whitespace-pre ${
                            change.type === 'removed' ? 'bg-red-500/10' : ''
                          }`}
                        >
                          <span className="w-8 text-gray-500 select-none mr-4">
                            {change.lineNumber}
                          </span>
                          <span className="flex flex-wrap">
                            {change.oldLine.map((part, partIndex) => (
                              <span
                                key={partIndex}
                                className={
                                  part.type === 'removed'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'text-gray-300'
                                }
                              >
                                {part.text}
                              </span>
                            ))}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 overflow-x-auto border border-white/10">
                    <div className="space-y-1">
                      {diffResult.diff.map((change, index) => (
                        <motion.div
                          key={`new-${index}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex rounded-lg px-3 py-1.5 min-h-[1.5rem] items-center whitespace-pre ${
                            change.type === 'added' ? 'bg-green-500/10' : ''
                          }`}
                        >
                          <span className="w-8 text-gray-500 select-none mr-4">
                            {change.lineNumber}
                          </span>
                          <span className="flex flex-wrap">
                            {change.newLine.map((part, partIndex) => (
                              <span
                                key={partIndex}
                                className={
                                  part.type === 'added'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'text-gray-300'
                                }
                              >
                                {part.text}
                              </span>
                            ))}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
} 