"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiSend, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom styles for markdown content
const markdownStyles = {
  p: 'mb-4 last:mb-0',
  h1: 'text-2xl font-bold mb-4 mt-6',
  h2: 'text-xl font-bold mb-3 mt-5',
  h3: 'text-lg font-bold mb-3 mt-4',
  h4: 'text-base font-bold mb-2 mt-4',
  ul: 'list-disc pl-5 mb-4',
  ol: 'list-decimal pl-5 mb-4',
  li: 'mb-1',
  blockquote: 'border-l-4 border-gray-800/50 pl-4 italic my-4 text-gray-400',
  pre: 'bg-[#1a1f2b] p-4 rounded-lg mb-4 overflow-x-auto border border-gray-800/50',
  code: 'font-mono text-sm',
  'pre code': 'bg-transparent p-0',
  inlineCode: 'bg-[#1a1f2b] px-1.5 py-0.5 font-mono text-sm text-blue-400 border border-gray-800/50 rounded',
  table: 'min-w-full border-collapse mb-4',
  th: 'border border-gray-800 px-4 py-2 bg-black/20 font-bold',
  td: 'border border-gray-800 px-4 py-2',
  a: 'text-blue-400 hover:underline',
  hr: 'my-8 border-t border-gray-800',
  img: 'max-w-full h-auto rounded-lg my-4',
};

export default function AIChat() {
  // Add new state for visualization data
  const [fileTypes, setFileTypes] = useState([]);
  const [sizeData, setSizeData] = useState([]);
  const [sessionData, setSessionData] = useState(null);

  // Keep existing state variables
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Function to process session data
  const processSessionData = (data) => {
    // Process file types for pie chart
    const typeCount = {};
    data.forEach(item => {
      const type = item.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const pieData = Object.entries(typeCount).map(([name, value]) => ({
      name,
      value
    }));
    setFileTypes(pieData);

    // Process size data for bar chart
    const sizeMetrics = data.map(item => ({
      name: item.name || 'Unnamed',
      compressed: item.compressed_size || 0,
      uncompressed: item.uncompressed_size || 0
    }));
    setSizeData(sizeMetrics);
  };

  // Function to fetch session data
  const fetchSessionData = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/session-data');
      const data = await response.json();
      setSessionData(data);
      processSessionData(data);
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchSessionData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleResizeStart = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(chatContainerRef.current.offsetWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const handleResize = (e) => {
    if (!isResizing) return;
    const width = startWidth + (e.clientX - startX);
    if (width > 300 && width < window.innerWidth - 100) {
      chatContainerRef.current.style.width = `${width}px`;
    }
  };

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please try again or refresh the page if the issue persists.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom component for rendering markdown content with proper code highlighting
  const MarkdownContent = ({ content }) => {
    // Function to check if text is likely a variable name or short code reference
    const isSimpleCode = (text) => {
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text) || text.length < 20;
    };

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Keep existing markdown components
          p: ({ children }) => <p className={markdownStyles.p}>{children}</p>,
          h1: ({ children }) => <h1 className={markdownStyles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={markdownStyles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={markdownStyles.h3}>{children}</h3>,
          h4: ({ children }) => <h4 className={markdownStyles.h4}>{children}</h4>,
          ul: ({ children }) => <ul className={markdownStyles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={markdownStyles.ol}>{children}</ol>,
          li: ({ children }) => <li className={markdownStyles.li}>{children}</li>,
          blockquote: ({ children }) => <blockquote className={markdownStyles.blockquote}>{children}</blockquote>,
          pre: ({ children }) => <pre className={markdownStyles.pre}>{children}</pre>,
          code: ({ inline, className, children }) => {
            const codeText = String(children).replace(/\n$/, '');
            
            if (inline) {
              // For inline code, check if it's a simple variable/reference
              if (isSimpleCode(codeText)) {
                return <span className={markdownStyles.inlineCode}>{codeText}</span>;
              }
              // For longer inline code, use standard code formatting
              return <code className={markdownStyles.code}>{codeText}</code>;
            }
            
            // For code blocks, use pre/code combination
            return (
              <pre className={markdownStyles.pre}>
                <code className={className || 'language-text'}>{codeText}</code>
              </pre>
            );
          },
          table: ({ children }) => <table className={markdownStyles.table}>{children}</table>,
          th: ({ children }) => <th className={markdownStyles.th}>{children}</th>,
          td: ({ children }) => <td className={markdownStyles.td}>{children}</td>,
          a: ({ href, children }) => (
            <a href={href} className={markdownStyles.a} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className={markdownStyles.hr} />,
          img: ({ src, alt }) => <img src={src} alt={alt} className={markdownStyles.img} />,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0a0c10] text-white p-6">
      {/* Visualization Section */}
      <div className="w-[calc(100%-1050px)] mr-6">
        <div className="bg-[#0f1218] rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            File Type Distribution
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fileTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fileTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f1218] rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            File Size Comparison
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sizeData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1f2b',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="compressed" name="Compressed Size" fill="#0088FE" />
                <Bar dataKey="uncompressed" name="Uncompressed Size" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chat Section - keep existing chat container code */}
      <div className="ml-auto w-[1000px] min-w-[800px] max-w-[1400px] bg-[#0f1218] rounded-2xl shadow-xl overflow-hidden flex flex-col"
        ref={chatContainerRef}
      >
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center bg-[#0f1218]">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Metadata Analysis
          </h1>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[600px]">
          {/* Chat messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-[#1a1f2b] border border-gray-800'
                }`}
              >
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <MarkdownContent content={message.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1f2b] rounded-lg p-4 border border-gray-800">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-800 p-4 bg-[#0f1218]">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-[#1a1f2b] text-white rounded-lg border border-gray-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50"
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
          onMouseDown={handleResizeStart}
        />
      </div>
    </div>
  );
} 