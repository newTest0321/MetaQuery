"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function S3Viewer() {
  const [publicUrl, setPublicUrl] = useState("");
  const [contents, setContents] = useState({ folders: [], files: [] });
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [forwardHistory, setForwardHistory] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isMetadataOpened, setIsMetadataOpened] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [savedSessions, setSavedSessions] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSelectedPanel, setShowSelectedPanel] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [expandedLines, setExpandedLines] = useState(new Set());
  const [panelWidth, setPanelWidth] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [folderContents, setFolderContents] = useState({});
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [showCards, setShowCards] = useState(true);
  const [isJsonViewerEnabled, setIsJsonViewerEnabled] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([{
    type: 'initial',
    showCards: true,
    isJsonViewerEnabled: false,
    currentPath: '',
    fileContent: null,
    fileType: null,
    activeFilter: null
  }]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  
  // Add new state variables for version comparison
  const [isVersionComparisonEnabled, setIsVersionComparisonEnabled] = useState(false);
  const [versionFiles, setVersionFiles] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [versionError, setVersionError] = useState(null);
  const [expandedVersionFiles, setExpandedVersionFiles] = useState(new Set());

  // Add new state for box heights
  const [boxHeights, setBoxHeights] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentBoxId, setCurrentBoxId] = useState(null);

  // Add new state for line heights
  const [lineHeights, setLineHeights] = useState({});
  const [resizingLine, setResizingLine] = useState(null);

  // Add version comparison functions
  const handleVersionComparisonClick = () => {
    const newState = {
      type: 'version_comparison',
      showCards: false,
      isJsonViewerEnabled: false,
      isVersionComparisonEnabled: true,
      currentPath,
      fileContent,
      fileType,
      activeFilter
    };
    addToHistory(newState);
    setShowCards(false);
    setIsJsonViewerEnabled(false);
    setIsVersionComparisonEnabled(true);
  };

  const toggleVersionFile = (fileId) => {
    setExpandedVersionFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const removeVersionFile = (idToRemove) => {
    setVersionError(null);
    setVersionFiles(prev => prev.filter(f => f.id !== idToRemove));
    if (comparing) {
      setComparing(false);
      setDiffResult(null);
    }
  };

  const compareVersionFiles = () => {
    setVersionError(null);
    if (versionFiles.length < 2) {
      setVersionError("Please upload at least two files to compare");
      return;
    }

    // Sort files by timestamp to compare latest two
    const sortedFiles = [...versionFiles].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const file1 = sortedFiles[0];
    const file2 = sortedFiles[1];

    if (!file1.content || !file2.content) {
      setVersionError("Still loading file contents...");
      return;
    }

    // Generate diff
    const diff = generateSideBySideDiff(file2.content, file1.content);
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
        // Line was added
        diff.push({
          type: 'added',
          lineNumber: i + 1,
          oldLine: [],
          newLine: [{ text: newLine, type: 'added' }]
        });
      } else if (!newLine) {
        // Line was removed
        diff.push({
          type: 'removed',
          lineNumber: i + 1,
          oldLine: [{ text: oldLine, type: 'removed' }],
          newLine: []
        });
      } else {
        // Line was modified - find specific changes
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
    const oldResult = [];
    const newResult = [];

    // Helper function to tokenize the text while preserving special characters and whitespace
    const tokenize = (text) => {
      return text.match(/\s+|\w+|[^\s\w]+/g) || [];
    };

    const oldTokens = tokenize(oldText);
    const newTokens = tokenize(newText);

    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldTokens.length || newIndex < newTokens.length) {
      if (oldIndex >= oldTokens.length) {
        // All remaining tokens in new are additions
        newResult.push({ text: newTokens[newIndex], type: 'added' });
        newIndex++;
        continue;
      }
      
      if (newIndex >= newTokens.length) {
        // All remaining tokens in old are removals
        oldResult.push({ text: oldTokens[oldIndex], type: 'removed' });
        oldIndex++;
        continue;
      }

      const oldToken = oldTokens[oldIndex];
      const newToken = newTokens[newIndex];

      if (oldToken === newToken) {
        // Tokens match - unchanged
        oldResult.push({ text: oldToken, type: 'unchanged' });
        newResult.push({ text: newToken, type: 'unchanged' });
        oldIndex++;
        newIndex++;
      } else {
        // Try to find the next matching token
        const oldNextMatch = newTokens.indexOf(oldToken, newIndex);
        const newNextMatch = oldTokens.indexOf(newToken, oldIndex);

        if (oldNextMatch === -1 && newNextMatch === -1) {
          // No matches found - treat as replacement
          oldResult.push({ text: oldToken, type: 'removed' });
          newResult.push({ text: newToken, type: 'added' });
          oldIndex++;
          newIndex++;
        } else if (oldNextMatch === -1 || (newNextMatch !== -1 && newNextMatch < oldNextMatch)) {
          // New token appears later in old - this is an addition
          newResult.push({ text: newToken, type: 'added' });
          newIndex++;
        } else {
          // Old token appears later in new - this is a removal
          oldResult.push({ text: oldToken, type: 'removed' });
          oldIndex++;
        }
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

  useEffect(() => {
    localStorage.removeItem("savedSession");
    setPublicUrl("");

    // Load saved sessions from backend
    const loadSessions = async () => {
      try {
        const response = await axios.get('http://localhost:8000/sessions/list');
        setSavedSessions(response.data);

        // Check if we need to resume a session
        const urlParams = new URLSearchParams(window.location.search);
        const resumeSession = urlParams.get('resume');
        if (resumeSession) {
          const sessionToResume = response.data.find(s => s.filename === resumeSession);
          if (sessionToResume) {
            handleResumeSession(sessionToResume);
          }
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      }
    };
    
    loadSessions();
  }, []);

  const handleListFiles = async (folder = "") => {
    if (!publicUrl) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/s3/list-public-bucket?public_url=${publicUrl}&folder=${folder}`
      );
      setContents(response.data);
      setCurrentPath(folder);
      
      // Update path history and clear forward history when navigating to a new path
      const pathSegments = folder.split('/').filter(Boolean);
      const newPathHistory = pathSegments.map((segment, index) => ({
        name: segment,
        path: pathSegments.slice(0, index + 1).join('/')
      }));
      setPathHistory(newPathHistory);
      setForwardHistory([]); // Clear forward history when navigating to a new path
      
      setFileContent(null);
      setIsMetadataOpened(false);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleFileClick = async (fileKey) => {
    try {
      // Check if file is a Parquet file
      if (fileKey.endsWith('.parquet')) {
        console.log('Handling Parquet file:', fileKey);
        const metadataResponse = await axios.get(
          `http://localhost:8000/s3/get-metadata?public_url=${publicUrl}&file_key=${fileKey}`
        );
        
        console.log('Received Parquet metadata:', metadataResponse.data);
        
        const newState = {
          type: 'file_view',
          showCards: false,
          isJsonViewerEnabled: true,
          currentPath: fileKey,
          fileContent: metadataResponse.data,
          fileType: 'json',
          activeFilter: null
        };
        
        addToHistory(newState);
        setShowCards(false);
        setIsJsonViewerEnabled(true);
        setFileType('json');
        setFileContent(metadataResponse.data);
        setIsMetadataOpened(true);
        return;
      }

      // For non-Parquet files, check if JSON viewer is enabled
      if (!isJsonViewerEnabled) {
        return;
      }

      // Handle other file types
      const response = await axios.get(
        `http://localhost:8000/s3/get-file?public_url=${publicUrl}&file_key=${fileKey}`
      );
      const { content, type } = response.data;
      
      const newState = {
        type: 'file_view',
        showCards: false,
        isJsonViewerEnabled: true,
        currentPath: fileKey,
        fileContent: type === 'json' ? JSON.parse(content) : content,
        fileType: type,
        activeFilter: null
      };
      
      addToHistory(newState);
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

  const handleSaveSession = async () => {
    if (!sessionName.trim()) return;

    try {
      // Create a comprehensive session state
      const sessionData = {
      name: sessionName.trim(),
        timestamp: new Date().toISOString(),
        // Basic navigation data
      publicUrl,
      currentPath,
        
        // File and content state
        currentFile: contents.files.find(f => f === currentPath) || null,
        fileContent: fileContent || null,
        fileType: fileType || null,
        isMetadataOpened: Boolean(isMetadataOpened),
        
        // UI State
        activeFilter: activeFilter || null,
        filteredData: filteredData || null,
        selectedItems: selectedItems || [],
        showSelectedPanel: Boolean(showSelectedPanel),
        isCodeExpanded: Boolean(isCodeExpanded),
        expandedLines: Array.from(expandedLines || []),
        
        // Extracted metadata
        metadata: {
          schema: fileContent && fileType === 'json' ? extractMetadata(fileContent, 'schema') : [],
          partition: fileContent && fileType === 'json' ? extractMetadata(fileContent, 'partition') : [],
          snapshot: fileContent && fileType === 'json' ? extractMetadata(fileContent, 'snapshot') : []
        }
      };

      // Save session to backend
      const response = await axios.post('http://localhost:8000/sessions/save', sessionData);
      
      // Refresh sessions list
      const sessionsResponse = await axios.get('http://localhost:8000/sessions/list');
      setSavedSessions(sessionsResponse.data);
      
      // Show success message
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      
      // Clear input and close popup
      setSessionName('');
    setShowSavePopup(false);
    } catch (error) {
      console.error("Error saving session:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleCancelSave = () => {
    setSessionName('');
    setShowSavePopup(false);
  };

  const handleResumeSession = async (session) => {
    try {
      // Load full session data from backend
      const response = await axios.get(`http://localhost:8000/sessions/load/${session.filename}`);
      const sessionData = response.data;
      
      // Restore basic navigation
      setPublicUrl(sessionData.publicUrl || '');
      setCurrentPath(sessionData.currentPath || '');
      
      // Restore file content and state
      if (sessionData.fileContent) {
        setFileContent(sessionData.fileContent);
        setFileType(sessionData.fileType || null);
        setIsMetadataOpened(Boolean(sessionData.isMetadataOpened));
      }
      
      // Restore UI state
      setActiveFilter(sessionData.activeFilter || null);
      setFilteredData(sessionData.filteredData || null);
      setSelectedItems(sessionData.selectedItems || []);
      setShowSelectedPanel(Boolean(sessionData.showSelectedPanel));
      setIsCodeExpanded(Boolean(sessionData.isCodeExpanded));
      setExpandedLines(new Set(sessionData.expandedLines || []));
      
      // Fetch the folder contents first
      await handleListFiles(sessionData.currentPath || '');
      
      // If there was a file open, fetch it again to ensure fresh content
      if (sessionData.currentFile) {
        await handleFileClick(sessionData.currentFile);
      }
    } catch (error) {
      console.error("Error resuming session:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteSession = async (index) => {
    try {
      const session = savedSessions[index];
      await axios.delete(`http://localhost:8000/sessions/delete/${session.filename}`);
      
      // Refresh sessions list
      const response = await axios.get('http://localhost:8000/sessions/list');
      setSavedSessions(response.data);
    } catch (error) {
      console.error("Error deleting session:", error);
      // You might want to show an error message to the user here
    }
  };

  const findInObject = (obj, key, alternateKeys = []) => {
    if (!obj || typeof obj !== 'object') return null;

    // Define common variations for each type
    const schemaPatterns = ['schema', 'columns', 'fields', 'structure', 'table_schema', 'metadata', 'data'];
    const partitionPatterns = ['partition', 'partitioning', 'splits', 'shards', 'divisions', 'chunks'];
    const snapshotPatterns = ['snapshot', 'versions', 'backups', 'commits', 'history', 'state'];

    // Get the appropriate patterns based on the key
    let patterns = [];
    if (key === 'schema') patterns = schemaPatterns;
    else if (key === 'partition' || key === 'partitioning') patterns = partitionPatterns;
    else if (key === 'snapshot' || key === 'snapshots') patterns = snapshotPatterns;

    // Function to extract all matching data
    const extractMatchingData = (obj, patterns) => {
      let results = [];
      
      // If the object is an array, process each item
      if (Array.isArray(obj)) {
        return obj.flatMap(item => extractMatchingData(item, patterns));
      }

      // Check if current object matches any pattern
      const matchesPattern = Object.keys(obj).some(k => 
        patterns.some(pattern => 
          k.toLowerCase().includes(pattern.toLowerCase()) ||
          k.toLowerCase().includes(pattern.toLowerCase() + 's')
        )
      );

      if (matchesPattern) {
        // If it's a schema/partition/snapshot object, add it to results
        results.push(obj);
      }

      // Recursively search in nested objects
      if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(value => {
          if (typeof value === 'object' && value !== null) {
            results = results.concat(extractMatchingData(value, patterns));
          }
        });
      }

      return results;
    };

    return extractMatchingData(obj, patterns);
  };

  const extractMetadata = (content, filterType) => {
    console.log('Extracting metadata:', { filterType, content });
    
    if (!content || typeof content !== 'object') {
      console.log('Invalid content:', content);
      return [];
    }

    switch (filterType) {
      case 'schema':
        try {
          // Handle Parquet schema
          if (content.schema && Array.isArray(content.schema)) {
            console.log('Processing Parquet schema');
            return content.schema.map(field => ({
              id: field.name || 'N/A',
              name: field.name || 'unnamed',
              type: field.type || 'unknown',
              nullable: field.nullable !== undefined ? String(field.nullable) : 'N/A',
              metadata: JSON.stringify({
                ...field.metadata,
                statistics: field.statistics || {}
              })
            }));
          }

          // Handle other schema formats
          let schemas = content.schemas;
          if (schemas && Array.isArray(schemas)) {
            let fields = schemas[0]?.fields;
            if (Array.isArray(fields)) {
              return fields.map(field => ({
                id: field.id || 'N/A',
                name: field.name || 'unnamed',
                type: field.type || 'unknown',
                nullable: field.nullable !== undefined ? String(field.nullable) : 'N/A',
                metadata: field.metadata ? JSON.stringify(field.metadata) : 'none'
              }));
            }
          }

          const schemaData = findInObject(content, 'schema');
          return schemaData.flatMap(schema => {
            let fields = [];
            
            if (Array.isArray(schema)) {
              fields = schema;
            } else if (schema.fields) {
              fields = Array.isArray(schema.fields) ? schema.fields : [schema.fields];
            } else if (schema.columns) {
              fields = Array.isArray(schema.columns) ? schema.columns : [schema.columns];
            } else {
              fields = [schema];
            }

            return fields.map(field => ({
              id: field.id || 'N/A',
              name: field.name || field.field || 'unnamed',
              type: field.type || 'unknown',
              nullable: field.nullable !== undefined ? String(field.nullable) : 'N/A',
              metadata: field.metadata ? JSON.stringify(field.metadata) : 'none'
            }));
          });
        } catch (error) {
          console.error('Error extracting schema:', error);
          return [];
        }

      case 'snapshot':
        try {
          // Handle Parquet snapshots (row groups)
          if (content.snapshots && Array.isArray(content.snapshots)) {
            return content.snapshots.map(snap => ({
              'snapshot-id': snap['snapshot-id'] || 'unknown',
              'timestamp-ms': snap['timestamp-ms'] || 'N/A',
              'manifest-list': snap['manifest-list'] || 'N/A',
              size: snap.size || 'N/A',
              'num-rows': snap['num-rows'] || 'N/A',
              compression: snap.compression || 'N/A'
            }));
          }

          // Handle other snapshot formats
          let snapshots = content.snapshots;
          if (!snapshots) {
            snapshots = findInObject(content, 'snapshot');
          }

          if (!Array.isArray(snapshots)) {
            snapshots = [snapshots].filter(Boolean);
          }

          return snapshots.map(snap => ({
            'snapshot-id': snap.snapshot_id || snap['snapshot-id'] || snap.id || 'unknown',
            'timestamp-ms': snap['timestamp-ms'] ? new Date(parseInt(snap['timestamp-ms'])).toLocaleString() : 
                      snap.timestamp || 'N/A',
            'manifest-list': snap['manifest-list'] || snap.manifest || 'N/A',
            size: snap.size || snap['file-size'] || 'N/A',
            status: snap.status || 'N/A'
          }));
        } catch (error) {
          console.error('Error extracting snapshots:', error);
          return [];
        }

      case 'partition':
        try {
          // Handle Parquet partitions
          if (content.partitions && Array.isArray(content.partitions)) {
            return content.partitions.map(p => ({
              field: p.field || 'unnamed',
              transform: p.transform || 'none',
              source: p.source || 'default',
              granularity: p.granularity || 'N/A'
            }));
          }

          // Handle other partition formats
          let partitioning = content.partitioning || findInObject(content, 'partition');
          
          if (!Array.isArray(partitioning)) {
            partitioning = [partitioning].filter(Boolean);
          }
          
          return partitioning.map(p => ({
            field: p.name || p.field || p.column || p.key || p.id || 'unnamed',
            transform: p.transform || p.type || p.format || 'none',
            source: p.source || p.source_id || p.origin || 'default',
            granularity: p.granularity || p.interval || p.size || 'N/A'
          }));
        } catch (error) {
          console.error('Error extracting partitions:', error);
          return [];
        }

      default:
        return [];
    }
  };

  const handleFilterClick = (filterType) => {
    const newState = {
      type: 'filter',
      showCards: false,
      isJsonViewerEnabled: true,
      currentPath,
      fileContent,
      fileType,
      activeFilter: activeFilter === filterType ? null : filterType
    };
    
    addToHistory(newState);
    
    if (activeFilter === filterType) {
      setActiveFilter(null);
      setFilteredData(null);
    } else {
      setActiveFilter(filterType);
      if (fileContent && fileType === 'json') {
        const extractedData = extractMetadata(fileContent, filterType);
        if (extractedData.length > 0) {
          setFilteredData(extractedData);
        } else {
          setFilteredData([{
            message: `No ${filterType} metadata found in the current file`
          }]);
        }
      } else {
        setFilteredData([{
          message: 'Please open a JSON metadata file first'
        }]);
      }
    }
  };

  // Add highlight function to highlight JSON sections based on filter
  const highlightSection = (filterType) => {
    if (!fileContent || !activeFilter) return;
    
    // Add custom styling for highlighted sections
    const style = document.createElement('style');
    style.innerHTML = `
      .highlight-schema { 
        background-color: rgba(59, 130, 246, 0.1);
        transition: background-color 0.3s ease;
      }
      .highlight-partition { 
        background-color: rgba(139, 92, 246, 0.1);
        transition: background-color 0.3s ease;
      }
      .highlight-snapshot { 
        background-color: rgba(236, 72, 153, 0.1);
        transition: background-color 0.3s ease;
      }
      
      /* Hover effects */
      .schema-section:hover {
        background-color: rgba(59, 130, 246, 0.2) !important;
        cursor: pointer;
      }
      .partition-section:hover {
        background-color: rgba(139, 92, 246, 0.2) !important;
        cursor: pointer;
      }
      .snapshot-section:hover {
        background-color: rgba(236, 72, 153, 0.2) !important;
        cursor: pointer;
      }

      /* JSON styling */
      .react-json-view {
        padding: 1rem;
        border-radius: 0.5rem;
      }
      .react-json-view .variable-row {
        transition: background-color 0.2s ease;
      }
      .react-json-view .variable-row:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    `;
    document.head.appendChild(style);

    // Remove previous highlights and classes
    document.querySelectorAll('.json-highlighted, .schema-section, .partition-section, .snapshot-section').forEach(el => {
      el.classList.remove(
        'highlight-schema', 
        'highlight-partition', 
        'highlight-snapshot',
        'schema-section',
        'partition-section',
        'snapshot-section'
      );
    });

    // Add new highlights and hover classes
    const elements = document.querySelectorAll('.react-json-view');
    elements.forEach(el => {
      const nodes = el.querySelectorAll('.object-key');
      nodes.forEach(node => {
        const content = node.closest('.object-content');
        if (!content) return;

        // Check for each type of metadata
        if (node.textContent.includes('schema')) {
          content.classList.add('schema-section');
          if (filterType === 'schema') {
            content.classList.add('highlight-schema', 'json-highlighted');
          }
        }
        if (node.textContent.includes('partition')) {
          content.classList.add('partition-section');
          if (filterType === 'partition') {
            content.classList.add('highlight-partition', 'json-highlighted');
          }
        }
        if (node.textContent.includes('snapshot')) {
          content.classList.add('snapshot-section');
          if (filterType === 'snapshot') {
            content.classList.add('highlight-snapshot', 'json-highlighted');
          }
        }
      });
    });
  };

  // Call highlightSection on component mount and when file content changes
  useEffect(() => {
    if (fileContent && fileType === 'json') {
      highlightSection(activeFilter);
    }
  }, [fileContent, fileType, activeFilter]);

  const handleItemSelect = (path, value) => {
    const newItem = { path, value };
    const exists = selectedItems.some(item => item.path === path);
    
    if (exists) {
      setSelectedItems(selectedItems.filter(item => item.path !== path));
    } else {
      setSelectedItems([...selectedItems, newItem]);
    }

    if (!showSelectedPanel) {
      setShowSelectedPanel(true);
    }
  };

  const CustomJsonView = ({ data }) => {
    const isMetadataType = (path, type) => {
      const patterns = {
        schema: ['schema', 'columns', 'fields', 'structure', 'table_schema', 'metadata'],
        partition: ['partition', 'partitioning', 'splits', 'shards', 'divisions'],
        snapshot: ['snapshot', 'versions', 'backups', 'commits', 'history']
      };
      
      return patterns[type].some(pattern => 
        path.toLowerCase().includes(pattern.toLowerCase()) ||
        path.toLowerCase().includes(pattern.toLowerCase() + 's')
      );
    };

    const renderJsonValue = (value, path = '') => {
      if (typeof value === 'object' && value !== null) {
  return (
          <div className="ml-4">
            {Object.entries(value).map(([key, val]) => {
              const currentPath = path ? `${path}.${key}` : key;
              const hasNestedObject = typeof val === 'object' && val !== null;
              const isExpanded = expandedLines.has(currentPath);
              
              // Use the new isMetadataType function
              const isSchema = isMetadataType(currentPath, 'schema');
              const isPartition = isMetadataType(currentPath, 'partition');
              const isSnapshot = isMetadataType(currentPath, 'snapshot');
              
              const getBackgroundColor = () => {
                if (isSchema) return 'bg-blue-500/5';
                if (isPartition) return 'bg-purple-500/5';
                if (isSnapshot) return 'bg-pink-500/5';
                return '';
              };

              const getHoverColor = () => {
                if (isSchema) return 'hover:bg-blue-500/20';
                if (isPartition) return 'hover:bg-purple-500/20';
                if (isSnapshot) return 'hover:bg-pink-500/20';
                return 'hover:bg-gray-600/30';
              };
              
              return (
                <div 
                  key={currentPath} 
                  className={`flex items-start group rounded-md px-3 py-1.5 transition-all duration-200 text-sm
                    ${getBackgroundColor()}
                    ${getHoverColor()}
                    border border-transparent
                    hover:border-opacity-50 hover:shadow-lg`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 flex-1">
                        {hasNestedObject && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedLines);
                              if (isExpanded) {
                                newExpanded.delete(currentPath);
                              } else {
                                newExpanded.add(currentPath);
                              }
                              setExpandedLines(newExpanded);
                            }}
                            className={`text-base hover:text-white transition-colors w-6 text-center flex-shrink-0
                              ${isSchema ? 'text-blue-400' :
                                isPartition ? 'text-purple-400' :
                                isSnapshot ? 'text-pink-400' :
                                'text-gray-400'}`}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                        <div className="flex items-center min-w-0 flex-1">
                          <span className={`font-medium truncate text-sm
                            ${isSchema ? 'text-blue-400' :
                              isPartition ? 'text-purple-400' :
                              isSnapshot ? 'text-pink-400' :
                              'text-blue-400'}`}
                          >
                            {key}
                          </span>
                          <span className="text-gray-400 mx-2">: </span>
                          {!hasNestedObject && (
                            <span className={`truncate text-sm ${typeof val === 'string' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {JSON.stringify(val)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-6">
                        <input
                          type="checkbox"
                          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          checked={selectedItems.some(item => item.path === currentPath)}
                          onChange={() => handleItemSelect(currentPath, val)}
                        />
                      </div>
                    </div>
                    {hasNestedObject && isExpanded && renderJsonValue(val, currentPath)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      return (
        <span className={`text-sm ${typeof value === 'string' ? 'text-green-400' : 'text-yellow-400'}`}>
          {JSON.stringify(value)}
        </span>
      );
    };

    return (
      <div className="font-mono text-sm text-white">
        {renderJsonValue(data)}
      </div>
    );
  };

  // Add resize handlers
  const handleDragStart = () => {
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    // Disable text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    
    // Get container width
    const container = document.querySelector('.content-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    // Calculate percentage based on mouse position
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit the resize range (20% - 80%)
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setPanelWidth(clampedWidth);
  };

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Function to handle opening the table modal
  const handleOpenTableModal = () => {
    setShowTableModal(true);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Function to handle closing the table modal
  const handleCloseTableModal = () => {
    setShowTableModal(false);
    // Restore background scrolling
    document.body.style.overflow = 'auto';
  };

  // Add copy function
  const handleCopyClick = (value) => {
    const textToCopy = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    navigator.clipboard.writeText(textToCopy).then(() => {
      // You could add a toast notification here if you want
      console.log('Copied to clipboard');
    });
  };

  // Add this function to handle folder expansion
  const handleFolderExpand = async (folder) => {
    if (expandedFolders.has(folder)) {
      const newExpanded = new Set(expandedFolders);
      newExpanded.delete(folder);
      setExpandedFolders(newExpanded);
    } else {
      try {
        const response = await axios.get(
          `http://localhost:8000/s3/list-public-bucket?public_url=${publicUrl}&folder=${folder}`
        );
        setFolderContents(prev => ({
          ...prev,
          [folder]: response.data
        }));
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(folder);
        setExpandedFolders(newExpanded);

        // Update path history and clear forward history when expanding a folder
        const pathSegments = folder.split('/').filter(Boolean);
        const newPathHistory = pathSegments.map((segment, index) => ({
          name: segment,
          path: pathSegments.slice(0, index + 1).join('/')
        }));
        setPathHistory(newPathHistory);
        setForwardHistory([]); // Clear forward history when expanding a folder
        setCurrentPath(folder);
      } catch (error) {
        console.error("Error fetching folder contents:", error);
      }
    }
  };

  // Replace the File List section with this new component
  const FileTreeItem = ({ item, level = 0, isFolder }) => {
    const isExpanded = expandedFolders.has(item);
    const folderContent = folderContents[item] || { folders: [], files: [] };
    const itemName = item.split('/').pop();
    const itemCount = isFolder ? folderContent.folders.length + folderContent.files.length : 0;

    const handleDragStart = (e) => {
      if (!isFolder) {
        e.dataTransfer.setData('text/plain', item);
        e.dataTransfer.effectAllowed = 'copy';
      }
    };

    const handleClick = () => {
      if (isFolder) {
        handleFolderExpand(item);
        // Update path history when clicking a folder
        const pathSegments = item.split('/').filter(Boolean);
        const newPathHistory = pathSegments.map((segment, index) => ({
          name: segment,
          path: pathSegments.slice(0, index + 1).join('/')
        }));
        setPathHistory(newPathHistory);
        setCurrentPath(item);
      } else {
        handleFileClick(item);
      }
    };

    return (
      <div className="select-none">
        <div
          draggable={!isFolder}
          onDragStart={handleDragStart}
          className={`flex items-center px-2 py-1.5 hover:bg-gray-700/50 rounded-md cursor-pointer transition-colors group
            ${level > 0 ? 'ml-4' : ''} ${!isFolder ? 'hover:border hover:border-purple-500/50' : ''}`}
          onClick={handleClick}
        >
          <div className="flex items-center flex-1 min-w-0 gap-1">
            {isFolder && (
              <svg
                className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 flex-shrink-0
                  ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <div className="flex items-center min-w-0 flex-1">
              <svg
                className={`w-5 h-5 mr-2 flex-shrink-0 ${
                  isFolder 
                    ? 'text-blue-400'
                    : item.endsWith('.json') 
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isFolder ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                )}
              </svg>
              <div className="flex items-center min-w-0 flex-1">
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-gray-300 text-sm font-medium group-hover:text-white">
                      {itemName}
                    </span>
                    {isFolder && itemCount > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded flex-shrink-0">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 truncate">
                    {item}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isFolder && isExpanded && (
          <div className="border-l border-gray-600 ml-4 mt-1 space-y-0.5">
            {folderContent.folders.map((subFolder) => (
              <FileTreeItem
                key={subFolder}
                item={subFolder}
                level={level + 1}
                isFolder={true}
              />
            ))}
            {folderContent.files.map((file) => (
              <FileTreeItem
                key={file}
                item={file}
                level={level + 1}
                isFolder={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleViewJsonClick = () => {
    const newState = {
      type: 'view_json',
      showCards: false,
      isJsonViewerEnabled: true,
      currentPath,
      fileContent,
      fileType,
      activeFilter
    };
    addToHistory(newState);
    setShowCards(false);
    setIsJsonViewerEnabled(true);
  };

  // Function to add new state to history
  const addToHistory = (newState) => {
    const nextIndex = currentHistoryIndex + 1;
    const newHistory = navigationHistory.slice(0, nextIndex);
    newHistory.push({
      ...newState,
      timestamp: Date.now()
    });
    setNavigationHistory(newHistory);
    setCurrentHistoryIndex(nextIndex);
  };

  const handleBack = () => {
    if (currentHistoryIndex > 0) {
      const prevIndex = currentHistoryIndex - 1;
      const prevState = navigationHistory[prevIndex];
      
      setCurrentHistoryIndex(prevIndex);
      setShowCards(prevState.showCards);
      setIsJsonViewerEnabled(prevState.isJsonViewerEnabled);
      setFileContent(prevState.fileContent);
      setFileType(prevState.fileType);
      setActiveFilter(prevState.activeFilter);
      
      if (prevState.currentPath !== currentPath) {
        handleListFiles(prevState.currentPath);
      }
    }
  };

  const handleForward = () => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      const nextIndex = currentHistoryIndex + 1;
      const nextState = navigationHistory[nextIndex];
      
      setCurrentHistoryIndex(nextIndex);
      setShowCards(nextState.showCards);
      setIsJsonViewerEnabled(nextState.isJsonViewerEnabled);
      setFileContent(nextState.fileContent);
      setFileType(nextState.fileType);
      setActiveFilter(nextState.activeFilter);
      
      if (nextState.currentPath !== currentPath) {
        handleListFiles(nextState.currentPath);
      }
    }
  };

  // Add function to handle Excel export
  const handleExcelExport = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    // Create CSV content
    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeFilter || 'data'}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add function to handle saving notes
  const handleSaveNote = () => {
    if (!currentNote.trim()) return;
    
    const newNote = {
      id: Date.now(),
      content: currentNote,
      timestamp: new Date().toISOString(),
      filter: activeFilter || 'general'
    };
    
    setNotes([...notes, newNote]);
    setCurrentNote('');
  };

  // Add file upload handlers
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        let content = reader.result;
        // Try to parse and format JSON or Avro if it's a JSON or Avro file
        if (file.name.endsWith('.json')) {
          try {
            const jsonObj = JSON.parse(content);
            content = JSON.stringify(jsonObj, null, 2);
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        } else if (file.name.endsWith('.avro')) {
          // For Avro files, we'll let the backend handle the parsing
          content = "Loading Avro file...";
        }
        const newFile = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          content: content,
          timestamp: new Date().toISOString(),
          type: file.name.endsWith('.avro') ? 'avro' : file.name.endsWith('.json') ? 'json' : 'text'
        };
        setVersionFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Handle files dragged from the file system
    if (event.dataTransfer.files.length > 0) {
      Array.from(event.dataTransfer.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          let content = reader.result;
          // Try to parse and format JSON or Avro if it's a JSON or Avro file
          if (file.name.endsWith('.json')) {
            try {
              const jsonObj = JSON.parse(content);
              content = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          } else if (file.name.endsWith('.avro')) {
            // For Avro files, we'll let the backend handle the parsing
            content = "Loading Avro file...";
          }
          const newFile = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content: content,
            timestamp: new Date().toISOString(),
            type: file.name.endsWith('.avro') ? 'avro' : file.name.endsWith('.json') ? 'json' : 'text'
          };
          setVersionFiles(prev => [...prev, newFile]);
        };
        reader.readAsText(file);
      });
    }
    // Handle files dragged from the sidebar
    else {
      const fileKey = event.dataTransfer.getData('text/plain');
      if (fileKey) {
        try {
          const response = await axios.get(
            `http://localhost:8000/s3/get-file?public_url=${publicUrl}&file_key=${fileKey}`
          );
          const { content, type } = response.data;
          let formattedContent = content;
          // Format JSON content if it's a JSON file
          if (type === 'json') {
            try {
              const jsonObj = JSON.parse(content);
              formattedContent = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
          const newFile = {
            id: Math.random().toString(36).substring(7),
            name: fileKey.split('/').pop(),
            content: formattedContent,
            timestamp: new Date().toISOString(),
            type: type
          };
          setVersionFiles(prev => [...prev, newFile]);
        } catch (error) {
          console.error("Error fetching dragged file:", error);
          setVersionError("Error loading the dragged file. Please try again.");
        }
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Add useEffect for version comparison
  useEffect(() => {
    if (isVersionComparisonEnabled) {
      // Reset version comparison state when enabled
      setVersionFiles([]);
      setComparing(false);
      setDiffResult(null);
      setVersionError(null);
      setExpandedVersionFiles(new Set());
    }
  }, [isVersionComparisonEnabled]);

  // Add resize handlers
  const handleResizeStart = (e, boxId) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setCurrentBoxId(boxId);
    document.body.style.userSelect = 'none';
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setCurrentBoxId(null);
    document.body.style.userSelect = 'auto';
  };

  const handleResize = (e) => {
    if (!isResizing || !currentBoxId) return;
    
    const deltaY = e.clientY - startY;
    setBoxHeights(prev => ({
      ...prev,
      [currentBoxId]: Math.max(100, (prev[currentBoxId] || 200) + deltaY)
    }));
    setStartY(e.clientY);
  };

  // Add useEffect for resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Update the root navigation handler
  const handleRootClick = () => {
    handleListFiles("");
    setShowCards(true);
    setIsJsonViewerEnabled(false);
    setIsVersionComparisonEnabled(false);
    setFileContent(null);
    setActiveFilter(null);
    setVersionFiles([]);
    setComparing(false);
    setDiffResult(null);
  };

  // Add function to toggle line expansion
  const toggleLineExpansion = (lineId) => {
    setExpandedLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 h-full flex flex-col bg-gray-950 border-r border-gray-700">
        <div className="flex-1 p-6 overflow-y-auto">
          {/* MetaQuery Title with Animation */}
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold metaquery-title">
          MetaQuery
        </h1>
          </div>

          <label className="block text-sm font-medium mb-2">Enter Public S3 URL</label>
        <input
          type="text"
          className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded-lg mb-4"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          placeholder="https://example.s3.amazonaws.com/"
        />

          {/* List Files Button */}
          <button
            className="w-full p-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-blue-500/20 hover:border-blue-400/30 cursor-pointer"
            onClick={() => handleListFiles("")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            List Files
          </button>

          {/* Navigation Buttons */}
          <div className="flex gap-2 mt-2">
            {/* Back Button */}
        <button
              className="flex-1 p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleBack}
              disabled={currentHistoryIndex === 0}
        >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
        </button>

            {/* Forward Button */}
            <button
              className="flex-1 p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleForward}
              disabled={currentHistoryIndex === navigationHistory.length - 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Forward
            </button>
            </div>

          {/* File List */}
          <div className="mt-4 space-y-0.5">
            {contents.folders.map((folder) => (
              <FileTreeItem
                key={folder}
                item={folder}
                isFolder={true}
              />
            ))}
            {contents.files.map((file) => (
              <FileTreeItem
                key={file}
                item={file}
                isFolder={false}
              />
          ))}
        </div>

          {/* Saved Sessions Section */}
          <div className="mt-6">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2 group"
              onClick={() => setShowSavedSessions(!showSavedSessions)}
            >
              <p className="text-lg font-semibold text-gray-400">Saved Sessions</p>
              <button className="text-gray-500 group-hover:text-gray-300 transition-colors">
                <svg 
                  className={`w-5 h-5 transform transition-transform duration-200 ${showSavedSessions ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
        </button>
            </div>

            {showSavedSessions && (
              <div className="space-y-3 animate-slideDown">
          {savedSessions.length > 0 ? (
            <ul className="space-y-3">
              {savedSessions.map((session, index) => (
                <li
                  key={index}
                    className="p-3 bg-gray-800 rounded-lg flex items-center justify-between hover:bg-gray-700 transition group"
                >
                  <span
                      className="truncate w-full cursor-pointer text-gray-400 group-hover:text-gray-300 flex items-center gap-2"
                    onClick={() => handleResumeSession(session)}
                  >
                      <svg 
                        className="w-5 h-5 text-purple-500/80 group-hover:text-purple-400" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      {session.name}
                  </span>
                  <button
                      className="ml-3 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteSession(index)}
                  >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
                  <p className="text-gray-500 text-sm">No saved sessions yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Email Section */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
              {userEmail[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* File Viewer Panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header with Tools and Actions */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-950">
          {/* Tools Section - Always show both dropdowns */}
          <div className="flex items-center gap-3">
            {/* First Dropdown - Metadata Tools */}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-gray-700 hover:border-blue-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 2 2 2 2h12c2 0 2-2 2-2V9c0-2-2-2-2-2h-6l-2-2H6C4 5 4 7 4 7z" />
                  </svg>
                  Metadata Tools
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700">
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterClick('schema')}
                    className={`w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${
                      activeFilter === 'schema' ? 'bg-blue-500/20' : ''
                    }`}
                  >
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 2 2 2 2h12c2 0 2-2 2-2V9c0-2-2-2-2-2h-6l-2-2H6C4 5 4 7 4 7z" />
                    </svg>
                    Schema
                  </button>
                  <button
                    onClick={() => handleFilterClick('partition')}
                    className={`w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${
                      activeFilter === 'partition' ? 'bg-purple-500/20' : ''
                    }`}
                  >
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" />
                    </svg>
                    Partition
                  </button>
                  <button
                    onClick={() => handleFilterClick('snapshot')}
                    className={`w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 ${
                      activeFilter === 'snapshot' ? 'bg-pink-500/20' : ''
                    }`}
                  >
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z M9 13l3 3m0 0l3-3m-3 3V8" />
                    </svg>
                    Snapshot
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Second Dropdown - Additional Tools */}
            <Popover>
              <PopoverTrigger asChild>
                <Button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-gray-700 hover:border-green-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tools
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700">
                <div className="space-y-2">
                  <button
                    onClick={handleExcelExport}
                    disabled={!filteredData || filteredData.length === 0}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notes
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Header Actions Section */}
          <div className="flex items-center gap-4">
            {/* Dashboard Button */}
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-gray-700 hover:border-gray-600 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Button>

            {/* Save Session Button */}
            <Popover open={showSavePopup} onOpenChange={setShowSavePopup}>
              <PopoverTrigger asChild>
                <Button
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-blue-500/20 hover:border-blue-400/30 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Session
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 bg-gray-800 border-gray-700" 
                sideOffset={8}
                alignOffset={-20}
                align="end"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-white">Save Session</h4>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionName" className="text-gray-300">
                      Session Name
                    </Label>
                    <Input
                      id="sessionName"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter a name for your session"
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white"
                      onClick={handleCancelSave}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                      onClick={handleSaveSession}
                      disabled={!sessionName.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Breadcrumb Navigation with matched color */}
        <div className="flex items-center px-4 py-2 bg-gray-950 border-b border-gray-700 overflow-x-auto custom-scrollbar-thin">
          <button
            onClick={handleRootClick}
            className="text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-gray-700 transition-colors flex items-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Root
          </button>
          
          {pathHistory.map((segment, index) => (
            <div key={segment.path} className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => handleListFiles(segment.path)}
                className={`px-2 py-1 rounded-md transition-colors flex items-center ${
                  index === pathHistory.length - 1
                    ? 'text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {segment.name}
              </button>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 content-container relative">
          {/* Code/Data View */}
          <div 
            style={{ width: `${isPanelExpanded ? panelWidth : 100}%` }}
            className="transition-all duration-300 overflow-hidden flex flex-col relative"
          >
            {/* Move the expand button to the right edge */}
            <button
              onClick={() => {
                setIsPanelExpanded(!isPanelExpanded);
                // Reset panel width when expanding
                if (!isPanelExpanded) {
                  setPanelWidth(66);
                }
              }}
              className="absolute top-4 right-0 z-10 p-2 rounded-l-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all transform hover:scale-105 shadow-lg"
              title={isPanelExpanded ? "Collapse Panel" : "Expand Panel"}
            >
              {isPanelExpanded ? "⟶" : "⟵"}
            </button>

            <div className="flex-1 h-[calc(100vh-8rem)] overflow-hidden bg-gray-900">
          {fileContent && isJsonViewerEnabled ? (
            fileType === "json" ? (
              <div className="h-full rounded-lg bg-gray-800/80 p-4 overflow-auto custom-scrollbar">
                <CustomJsonView data={fileContent} />
              </div>
            ) : (
              <pre className="h-full overflow-auto text-white text-base whitespace-pre-wrap break-words font-mono bg-gray-800/80 p-4 rounded-lg custom-scrollbar">
                {fileContent}
              </pre>
            )
          ) : isVersionComparisonEnabled ? (
            <div className="h-full flex flex-col bg-gray-800/80 p-6 overflow-hidden">
              {/* Version Comparison Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-200">Version Comparison</h2>
                  <p className="text-gray-400 mt-1">Compare different versions of your files</p>
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

              {/* File List with proper scrolling */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* File Upload Component */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-purple-500', 'bg-purple-500/10');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-purple-500', 'bg-purple-500/10');
                    }}
                    className="mb-6 p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="version-file-upload"
                    />
                    <label
                      htmlFor="version-file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <svg className="w-12 h-12 text-purple-500/80 mb-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-300 text-center">
                        Drag and drop files here or click to select files
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Drag files from sidebar or upload from your computer
                      </p>
                    </label>
                  </div>

                  {/* Version Files List */}
                  <div className="space-y-4">
                    {versionFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className={`bg-gray-700/50 rounded-xl border border-gray-600 hover:bg-gray-700/70 transition-all group ${
                          expandedVersionFiles.has(file.id) ? 'bg-purple-500/10 border-purple-500/30' : ''
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
                            <button
                              onClick={() => toggleVersionFile(file.id)}
                              className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-500/10"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedVersionFiles.has(file.id) ? "M6 18L18 6M6 6l12 12" : "M19 9l-7 7-7-7"} />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeVersionFile(file.id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {expandedVersionFiles.has(file.id) && file.content && (
                          <div className="px-4 pb-4">
                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto custom-scrollbar">
                              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                                {file.content}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Error Message */}
                  {versionError && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400">{versionError}</p>
                    </div>
                  )}

                  {/* Diff Result with proper scrolling */}
                  {comparing && diffResult && (
                    <div className="mt-6 bg-gray-700/50 rounded-xl p-6 border border-gray-600">
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
                        <div className="bg-gray-900 rounded-lg overflow-auto custom-scrollbar">
                          <div className="p-4">
                            <div className="space-y-1">
                              {diffResult.diff.map((change, index) => {
                                const isExpanded = expandedLines.has(`old-${index}`);
                                const lineContent = change.oldLine.map((part, i) => (
                                  <span
                                    key={i}
                                    className={`${
                                      part.type === 'removed'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    {part.text}
                                  </span>
                                ));

                                return (
                                  <div
                                    key={`old-${index}`}
                                    className="relative group"
                                  >
                                    <div
                                      onClick={() => toggleLineExpansion(`old-${index}`)}
                                      className={`flex rounded-lg px-3 py-1.5 items-center transition-all duration-200 cursor-pointer hover:bg-gray-800 ${
                                        change.type === 'removed' ? 'bg-red-500/5' : 
                                        change.type === 'added' ? 'bg-green-500/5' : 
                                        'bg-transparent'
                                      }`}
                                      style={{
                                        minHeight: '1.5rem',
                                        height: lineHeights[`old-${index}`] || 'auto',
                                      }}
                                    >
                                      <span className="w-8 text-gray-500 select-none mr-4 flex-shrink-0">
                                        {change.lineNumber}
                                      </span>
                                      <span className={`flex flex-wrap flex-1 min-w-0 ${
                                        isExpanded ? 'whitespace-pre-wrap break-all' : 'truncate'
                                      }`}>
                                        {isExpanded ? lineContent : (
                                          <>
                                            {lineContent}
                                            {!isExpanded && change.oldLine.join('').length > 50 && (
                                              <span className="text-gray-500 ml-1">...</span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                      {change.oldLine.join('').length > 50 && (
                                        <span className="ml-2 text-gray-500 text-xs">
                                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                        </span>
                                      )}
                                    </div>
                                    {isExpanded && (
                                      <div
                                        className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize opacity-0 group-hover:opacity-100 bg-gray-700 hover:bg-purple-500/50 transition-all"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setResizingLine(`old-${index}`);
                                          const startY = e.clientY;
                                          const startHeight = lineHeights[`old-${index}`] || 24;

                                          const handleMouseMove = (e) => {
                                            const deltaY = e.clientY - startY;
                                            const newHeight = Math.max(24, startHeight + deltaY);
                                            setLineHeights(prev => ({
                                              ...prev,
                                              [`old-${index}`]: newHeight,
                                              [`new-${index}`]: newHeight
                                            }));
                                          };

                                          const handleMouseUp = () => {
                                            setResizingLine(null);
                                            window.removeEventListener('mousemove', handleMouseMove);
                                            window.removeEventListener('mouseup', handleMouseUp);
                                          };

                                          window.addEventListener('mousemove', handleMouseMove);
                                          window.addEventListener('mouseup', handleMouseUp);
                                        }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-900 rounded-lg overflow-auto custom-scrollbar">
                          <div className="p-4">
                            <div className="space-y-1">
                              {diffResult.diff.map((change, index) => {
                                const isExpanded = expandedLines.has(`new-${index}`);
                                const lineContent = change.newLine.map((part, i) => (
                                  <span
                                    key={i}
                                    className={`${
                                      part.type === 'added'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'text-gray-300'
                                    }`}
                                  >
                                    {part.text}
                                  </span>
                                ));

                                return (
                                  <div
                                    key={`new-${index}`}
                                    className="relative group"
                                  >
                                    <div
                                      onClick={() => toggleLineExpansion(`new-${index}`)}
                                      className={`flex rounded-lg px-3 py-1.5 items-center transition-all duration-200 cursor-pointer hover:bg-gray-800 ${
                                        change.type === 'added' ? 'bg-green-500/5' : 
                                        change.type === 'removed' ? 'bg-red-500/5' : 
                                        'bg-transparent'
                                      }`}
                                      style={{
                                        minHeight: '1.5rem',
                                        height: lineHeights[`new-${index}`] || 'auto',
                                      }}
                                    >
                                      <span className="w-8 text-gray-500 select-none mr-4 flex-shrink-0">
                                        {change.lineNumber}
                                      </span>
                                      <span className={`flex flex-wrap flex-1 min-w-0 ${
                                        isExpanded ? 'whitespace-pre-wrap break-all' : 'truncate'
                                      }`}>
                                        {isExpanded ? lineContent : (
                                          <>
                                            {lineContent}
                                            {!isExpanded && change.newLine.join('').length > 50 && (
                                              <span className="text-gray-500 ml-1">...</span>
                                            )}
                                          </>
                                        )}
                                      </span>
                                      {change.newLine.join('').length > 50 && (
                                        <span className="ml-2 text-gray-500 text-xs">
                                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                        </span>
                                      )}
                                    </div>
                                    {isExpanded && (
                                      <div
                                        className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize opacity-0 group-hover:opacity-100 bg-gray-700 hover:bg-purple-500/50 transition-all"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setResizingLine(`new-${index}`);
                                          const startY = e.clientY;
                                          const startHeight = lineHeights[`new-${index}`] || 24;

                                          const handleMouseMove = (e) => {
                                            const deltaY = e.clientY - startY;
                                            const newHeight = Math.max(24, startHeight + deltaY);
                                            setLineHeights(prev => ({
                                              ...prev,
                                              [`new-${index}`]: newHeight,
                                              [`old-${index}`]: newHeight
                                            }));
                                          };

                                          const handleMouseUp = () => {
                                            setResizingLine(null);
                                            window.removeEventListener('mousemove', handleMouseMove);
                                            window.removeEventListener('mouseup', handleMouseUp);
                                          };

                                          window.addEventListener('mousemove', handleMouseMove);
                                          window.addEventListener('mouseup', handleMouseUp);
                                        }}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compare Button - Fixed at bottom */}
              {versionFiles.length >= 2 && !comparing && (
                <div className="mt-6">
                  <button
                    onClick={compareVersionFiles}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Compare Files
                  </button>
                </div>
              )}
            </div>
          ) : (
            showCards ? (
              <div className="h-full flex items-center justify-center p-8">
                <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                  {/* View JSON File Card */}
                  <div 
                    onClick={handleViewJsonClick}
                    className="group relative bg-gray-800/80 rounded-xl p-6 shadow-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-center mb-6">
                        <svg className="w-16 h-16 text-purple-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-center text-white mb-3">View JSON File</h3>
                      <p className="text-gray-400 text-center text-sm">Select a JSON file from the sidebar to view and analyze its contents</p>
                    </div>
                  </div>

                  {/* Version Comparison Card */}
                  <div
                    onClick={handleVersionComparisonClick}
                    className="group relative bg-gray-800/80 rounded-xl p-6 shadow-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative">
                      <div className="flex items-center justify-center mb-6">
                        <svg className="w-16 h-16 text-purple-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-center text-white mb-3">Version Comparison</h3>
                      <p className="text-gray-400 text-center text-sm">Compare different versions of your files to track changes</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          )}
            </div>
      </div>

          {/* Resizable Divider - Only show when panel is expanded */}
          {isPanelExpanded && (activeFilter || showSelectedPanel) && (
            <div
              className="w-1 bg-gray-700 hover:bg-purple-500 cursor-col-resize transition-colors relative group"
              onMouseDown={handleDragStart}
            >
              <div className="absolute inset-0 w-4 -left-2 group-hover:bg-purple-500/20"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-1 h-8 bg-purple-500/50 rounded"></div>
                  <div className="text-purple-500 text-xs">⋮</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Panel - Only show when expanded */}
          {isPanelExpanded && activeFilter && (
            <div 
              style={{ width: `${100 - panelWidth}%` }}
              className="border-l border-gray-700 overflow-hidden flex flex-col bg-gray-850"
            >
              <div className="p-6 flex-shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-semibold mb-4 capitalize flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    activeFilter === 'schema' ? 'bg-blue-500' :
                    activeFilter === 'partition' ? 'bg-purple-500' :
                    'bg-pink-500'
                  }`}></span>
                  {activeFilter} Metadata
                </h3>
                {/* Add View Full Table button */}
                {filteredData && !filteredData[0]?.message && (
                  <button
                    onClick={handleOpenTableModal}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-all transform hover:scale-110 hover:shadow-lg"
                    title="View Full Table"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
            </button>
                )}
          </div>
              <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl h-full">
                  {filteredData[0]?.message ? (
                    <div className="p-4 text-gray-300 text-sm">{filteredData[0].message}</div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-700 sticky top-0">
                            {Object.keys(filteredData[0] || {}).map((header) => (
                              <th key={header} className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                                {header.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((row, index) => (
                            <tr key={index} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                              {Object.entries(row).map(([key, value], i) => (
                                <td key={i} className="px-4 py-3 text-sm text-gray-300 whitespace-normal break-words">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
        </div>
      )}
                </div>
              </div>
            </div>
          )}

          {/* Selected Items Panel - Only show when expanded */}
          {isPanelExpanded && showSelectedPanel && !activeFilter && selectedItems.length > 0 && (
            <div 
              style={{ width: `${100 - panelWidth}%` }}
              className="border-l border-gray-700 overflow-hidden flex flex-col bg-gray-850"
            >
              <div className="p-6 flex-shrink-0 flex justify-between items-center">
                <h3 className="text-xl font-semibold capitalize flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
                  Selected Items
                </h3>
                <button
                  onClick={() => setShowSelectedPanel(false)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                  <div className="divide-y divide-gray-700">
                    {selectedItems.map((item, index) => {
                      // Format the path for better readability
                      const pathParts = item.path.split('.');
                      const formattedPath = pathParts.map((part, i) => (
                        <span key={i} className="text-gray-400">
                          {i > 0 && <span className="mx-1 text-gray-500">→</span>}
                          <span className="text-gray-300">{part}</span>
                        </span>
                      ));

                      return (
                        <div key={index} className="p-4 hover:bg-gray-750 group">
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0 flex-1">
                              {/* Path display with horizontal scroll if needed */}
                              <div className="overflow-x-auto pb-2 custom-scrollbar-thin">
                                <div className="flex items-center text-sm font-medium whitespace-nowrap">
                                  {formattedPath}
                                </div>
                              </div>
                              
                              {/* Preview of value (truncated) */}
                              <div className="mt-2 text-sm text-gray-400 font-mono overflow-hidden">
                                <div className="bg-gray-900/50 p-3 rounded-lg line-clamp-3">
                                  {typeof item.value === 'object' 
                                    ? JSON.stringify(item.value, null, 2)
                                    : String(item.value)
                                  }
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              {/* View Full button */}
                              <button
                                onClick={() => {
                                  setSelectedItemForModal(item);
                                  setShowItemModal(true);
                                }}
                                className="text-gray-400 hover:text-purple-500 opacity-0 group-hover:opacity-100 p-1"
                                title="View Full Content"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </button>

                              {/* Copy button */}
                              <button
                                onClick={() => handleCopyClick(item.value)}
                                className="text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 p-1"
                                title="Copy to Clipboard"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleItemSelect(item.path, item.value)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"
                                title="Remove Item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
    </div>
  );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Success Message */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-3 animate-fade-in-out z-50">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Session saved successfully!</span>
    </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-[1200px] max-h-[90vh] flex flex-col border border-gray-600 relative animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
              <h3 className="text-xl font-semibold capitalize flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  activeFilter === 'schema' ? 'bg-blue-500' :
                  activeFilter === 'partition' ? 'bg-purple-500' :
                  'bg-pink-500'
                }`}></span>
                {activeFilter} Metadata Table
              </h3>
              <button
                onClick={handleCloseTableModal}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 sticky top-0">
                      {Object.keys(filteredData[0] || {}).map((header) => (
                        <th key={header} className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                          {header.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        {Object.entries(row).map(([key, value], i) => (
                          <td key={i} className="px-6 py-4 text-sm text-gray-300 whitespace-normal break-words">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Item Modal */}
      {showItemModal && selectedItemForModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-[1200px] max-h-[90vh] flex flex-col border border-gray-600 relative animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
                Selected Item Details
              </h3>
              <div className="flex items-center gap-4">
                {/* Copy button */}
                <button
                  onClick={() => handleCopyClick(selectedItemForModal.value)}
                  className="text-gray-400 hover:text-green-500 transition-colors p-2 hover:bg-gray-700 rounded-lg"
                  title="Copy to Clipboard"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
                {/* Close button */}
                <button
                  onClick={() => setShowItemModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Path */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Path</h4>
                <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto custom-scrollbar-thin">
                  <div className="flex items-center text-sm whitespace-nowrap">
                    {selectedItemForModal.path.split('.').map((part, i, arr) => (
                      <span key={i}>
                        <span className="text-gray-300">{part}</span>
                        {i < arr.length - 1 && <span className="mx-1 text-gray-500">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Value</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto custom-scrollbar-thin">
                  <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                    {typeof selectedItemForModal.value === 'object'
                      ? JSON.stringify(selectedItemForModal.value, null, 2)
                      : String(selectedItemForModal.value)
                    }
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add animation for modal */}
      <style jsx>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.2s ease-out forwards;
        }
      `}</style>

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
      `}</style>

      {/* Update the animation for smoother transition */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-20px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Add styles for dragging state */}
      <style jsx global>{`
        .content-container {
          ${isDragging ? `
            cursor: col-resize !important;
            * {
              cursor: col-resize !important;
              user-select: none !important;
            }
          ` : ''}
        }
      `}</style>

      {/* Add styles for thin scrollbar */}
      <style jsx global>{`
        .custom-scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 2px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
        .custom-scrollbar-thin::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }
      `}</style>

      {/* Add the animation styles */}
      <style jsx global>{`
        /* Base styles for MetaQuery title */
        .metaquery-title {
          background: linear-gradient(
            to right,
            #3b82f6,
            #8b5cf6,
            #ec4899
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: inline-block;
          position: relative;
          letter-spacing: -1px;
        }

        /* Animation Option 1: Gradient Wave */
        @keyframes gradientWave {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Animation Option 2: Glow Pulse */
        @keyframes glowPulse {
          0% {
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.5),
                         0 0 20px rgba(139, 92, 246, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.8),
                         0 0 30px rgba(139, 92, 246, 0.5);
          }
          100% {
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.5),
                         0 0 20px rgba(139, 92, 246, 0.3);
          }
        }

        /* Animation Option 3: Letter Float */
        @keyframes letterFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        /* Animation Option 4: Shimmer */
        @keyframes shimmer {
          0% {
            background-position: -100% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        /* You can uncomment one of these to apply the animation */
        .metaquery-title {
          /* Option 1: Gradient Wave */
          background-size: 200% auto;
          animation: gradientWave 8s linear infinite;

          /* Option 2: Glow Pulse */
          /* animation: glowPulse 3s ease-in-out infinite; */

          /* Option 3: Letter Float */
          /* animation: letterFloat 3s ease-in-out infinite; */

          /* Option 4: Shimmer */
          /* background: linear-gradient(
            90deg,
            #3b82f6 0%,
            #8b5cf6 25%,
            #ec4899 50%,
            #8b5cf6 75%,
            #3b82f6 100%
          );
          background-size: 200% auto;
          animation: shimmer 6s linear infinite; */
        }
      `}</style>

      {/* Add Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-8 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col border border-gray-600 relative animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-xl z-10">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2 bg-yellow-500"></span>
                Notes
              </h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Notes Input */}
              <div className="mb-6">
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Type your note here..."
                  className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-300 placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500 resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={!currentNote.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Note
            </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-400">
                        {new Date(note.timestamp).toLocaleString()}
                      </span>
                      <span className="text-sm px-2 py-1 bg-gray-800 rounded-full text-yellow-500">
                        {note.filter}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No notes yet. Start by adding one above!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add styles for resize cursor */}
      <style jsx global>{`
        .cursor-row-resize {
          cursor: row-resize;
        }
        ${isResizing ? `
          body * {
            cursor: row-resize !important;
            user-select: none !important;
          }
        ` : ''}
      `}</style>

      {/* Add styles for resizing state */}
      <style jsx global>{`
        ${resizingLine ? `
          body * {
            cursor: row-resize !important;
            user-select: none !important;
          }
        ` : ''}
        
        .break-all {
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}