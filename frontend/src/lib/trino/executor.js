import { Client } from 'trino-client';

// Local Trino configuration
const LOCAL_TRINO_CONFIG = {
  server: 'http://localhost:8080',
  catalog: 'hive',
  schema: 'default',
  user: 'trino'
};

// Initialize Trino client with error handling
function initTrinoClient() {
  try {
    return new Client(LOCAL_TRINO_CONFIG);
  } catch (error) {
    console.error('Failed to initialize Trino client:', error);
    throw new Error('Trino client initialization failed: ' + error.message);
  }
}

// Initialize client only when needed
let trinoClient = null;

// Mock function for development/testing
function mockExecuteQuery(query) {
  // Parse the query to determine what kind of data to return
  const queryType = query.toLowerCase();
  
  if (queryType.includes('select')) {
    // Mock SELECT query results
    return [
      { id: 1, table_name: 'sales', format: 'iceberg', size_gb: 120, last_updated: '2024-03-20' },
      { id: 2, table_name: 'customers', format: 'delta', size_gb: 85, last_updated: '2024-03-19' },
      { id: 3, table_name: 'products', format: 'hudi', size_gb: 45, last_updated: '2024-03-18' }
    ];
  } else if (queryType.includes('show tables')) {
    // Mock SHOW TABLES results
    return [
      { Table: 'sales' },
      { Table: 'customers' },
      { Table: 'products' },
      { Table: 'orders' }
    ];
  } else if (queryType.includes('describe')) {
    // Mock DESCRIBE table results
    return [
      { Column: 'id', Type: 'bigint', Extra: 'Partition Key' },
      { Column: 'name', Type: 'varchar', Extra: '' },
      { Column: 'value', Type: 'double', Extra: '' },
      { Column: 'timestamp', Type: 'timestamp', Extra: '' }
    ];
  }

  // Default mock data
  return [
    { result: 'Mock data for query: ' + query }
  ];
}

export async function executeTrinoQuery(query) {
  try {
    // Validate query
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query format');
    }

    // For development/testing, return mock data
    return mockExecuteQuery(query);
  } catch (error) {
    console.error('Error executing Trino query:', error);
    throw new Error('Failed to execute query: ' + error.message);
  }
}

export async function getQueryStats(queryId) {
  // Return mock stats for development
  return {
    state: 'FINISHED',
    queued: false,
    scheduled: true,
    nodes: 3,
    totalSplits: 100,
    queuedSplits: 0,
    runningSplits: 0,
    completedSplits: 100,
    cpuTimeMillis: 1500,
    wallTimeMillis: 2000,
    processedRows: 10000,
    processedBytes: 1024 * 1024 * 50, // 50MB
    peakMemoryBytes: 1024 * 1024 * 100 // 100MB
  };
}

export async function cancelQuery(queryId) {
  return { success: true, message: 'Query cancelled successfully' };
} 