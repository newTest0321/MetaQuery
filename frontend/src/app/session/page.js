"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from 'next/link';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";
import next from "next";

export default function S3Viewer() {
    const viewerRef = useRef(null);
    const [viewerHeight, setViewerHeight] = useState("auto");

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
    const [panelWidth, setPanelWidth] = useState(100); // Start at 100% for main content
    const [isDragging, setIsDragging] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);
    const [showSavedSessions, setShowSavedSessions] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [folderContents, setFolderContents] = useState({});
    const [isPanelExpanded, setIsPanelExpanded] = useState(false); // New state for panel expansion

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


    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
        }
    }, []);

    const router = useRouter();

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
        if (!content || typeof content !== 'object') return [];

        switch (filterType) {
            case 'schema':
                try {
                    // First try to find schemas array
                    let schemas = content.schemas;
                    if (schemas && Array.isArray(schemas)) {
                        // Get fields from the first schema
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

                    // If no direct schemas array, try to find schema-like data
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
                    // First try direct snapshots array
                    let snapshots = content.snapshots;
                    if (!snapshots) {
                        // Try to find snapshot data
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
        if (activeFilter === filterType) {
            setActiveFilter(null);
            setFilteredData(null);
        } else {
            setActiveFilter(filterType);

            // Extract metadata from the current file content
            if (fileContent && fileType === 'json') {
                const extractedData = extractMetadata(fileContent, filterType);
                if (extractedData.length > 0) {
                    setFilteredData(extractedData);
                } else {
                    // If no data found for this filter type
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
                    className={`flex items-center px-2 py-1.5 hover:bg-gray-700/50 rounded-md cursor-pointer transition-colors group
            ${level > 0 ? 'ml-4' : ''}`}
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
                                className={`w-5 h-5 mr-2 flex-shrink-0 ${isFolder
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

    return (
        <div className="h-screen flex flex-col md:flex-row bg-gray-900 text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-1/4 h-full p-6 overflow-y-auto bg-gray-950 border-r border-gray-700">
                {/* MetaQuery Title with Animation */}
                <div className="mb-12"> {/* Increased bottom margin for better spacing */}
                    <Link href='/dashboard'> <h1 className="text-4xl font-extrabold metaquery-title"> {/* Increased font size */}
                        MetaQuery
                    </h1></Link>
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
                    className={`w-full p-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-blue-500/20 hover:border-blue-400/30 ${!publicUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:from-blue-500 hover:via-purple-500 hover:to-pink-500'}`}
                    onClick={() => handleListFiles("")}
                    disabled={!publicUrl}
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
                        onClick={() => {
                            if (pathHistory.length > 0) {
                                const newHistory = [...pathHistory];
                                const currentPath = newHistory.pop();
                                setPathHistory(newHistory);

                                // Add current path to forward history
                                setForwardHistory(prev => [...prev, currentPath]);

                                // Navigate to the previous path
                                const newPath = newHistory.length > 0 ? newHistory[newHistory.length - 1].path : "";
                                handleListFiles(newPath);
                            }
                        }}
                        disabled={pathHistory.length === 0}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>

                    {/* Forward Button */}
                    <button
                        className="flex-1 p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                            if (forwardHistory.length > 0) {
                                const newForwardHistory = [...forwardHistory];
                                const nextPath = newForwardHistory.pop();
                                setForwardHistory(newForwardHistory);

                                // Add current path back to path history
                                setPathHistory(prev => [...prev, nextPath]);

                                // Navigate to the next path
                                handleListFiles(nextPath.path);
                            }
                        }}
                        disabled={forwardHistory.length === 0}
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
                                                    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6" stroke="currentColor" strokeWidth="2" />
                                                    <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="2" />
                                                    <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

            {/* File Viewer Panel */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Filter Buttons */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleFilterClick('schema')}
                            className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 cursor-pointer ${!publicUrl ? 'opacity-50 cursor-not-allowed' : ''} ${activeFilter === 'schema'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            disabled={!publicUrl}
                        >
                            Schema
                        </button>
                        <button
                            onClick={() => handleFilterClick('partition')}
                            className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 cursor-pointer ${!publicUrl ? 'opacity-50 cursor-not-allowed' : ''} ${activeFilter === 'partition'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            disabled={!publicUrl}
                        >
                            Partition
                        </button>
                        <button
                            onClick={() => handleFilterClick('snapshot')}
                            className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 cursor-pointer ${!publicUrl ? 'opacity-50 cursor-not-allowed' : ''} ${activeFilter === 'snapshot'
                                ? 'bg-pink-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                            disabled={!publicUrl}
                        >
                            Snapshot
                        </button>
                    </div>

                    {/* Save Session Button moved to top right */}
                    <Popover open={showSavePopup} onOpenChange={setShowSavePopup}>
                        <PopoverTrigger asChild>
                            <Button
                                className="px-4 cursor-pointer py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-blue-500/20 hover:border-blue-400/30"
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

                {/* Breadcrumb Navigation */}
                <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700 overflow-x-auto custom-scrollbar-thin">
                    <button
                        onClick={() => handleListFiles("")}
                        className="text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-gray-700 transition-colors flex items-center"
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
                                className={`px-2 py-1 rounded-md transition-colors flex items-center ${index === pathHistory.length - 1
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
                            className="absolute top-0 right-0 z-10 p-2 rounded-l-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all transform hover:scale-105 shadow-lg border-t border-l border-b border-gray-700"
                            title={isPanelExpanded ? "Collapse Panel" : "Expand Panel"}
                        >
                            {isPanelExpanded ? "⟶" : "⟵"}
                        </button>

                        <div className="flex-1 h-[calc(100vh-8rem)] overflow-hidden bg-gray-900">
                            {fileContent ? (
                                fileType === "json" ? (
                                    <div className="h-full rounded-lg bg-gray-800/80 p-4 overflow-auto custom-scrollbar">
                                        <CustomJsonView data={fileContent} />
                                    </div>
                                ) : (
                                    <pre className="h-full overflow-auto text-white text-base whitespace-pre-wrap break-words font-mono bg-gray-800/80 p-4 rounded-lg custom-scrollbar">
                                        {fileContent}
                                    </pre>
                                )
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center transform transition-all duration-300 hover:scale-105">
                                        <div className="bg-gray-800/80 rounded-xl p-8 shadow-2xl border border-gray-700">
                                            <svg className="w-24 h-24 mx-auto mb-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-xl text-gray-300 font-medium">Select a file to view its contents</p>
                                            <p className="mt-2 text-gray-500 text-sm">Choose a file from the sidebar to get started</p>
                                        </div>
                                    </div>
                                </div>
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
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${activeFilter === 'schema' ? 'bg-blue-500' :
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
                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${activeFilter === 'schema' ? 'bg-blue-500' :
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
        </div>
    );
}
