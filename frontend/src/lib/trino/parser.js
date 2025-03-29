export function parseTrinoQuery(query) {
  try {
    // Normalize query
    const normalizedQuery = normalizeQuery(query);
    
    // Extract query components
    const components = {
      type: extractQueryType(normalizedQuery),
      tables: extractTables(normalizedQuery),
      columns: extractColumns(normalizedQuery),
      filters: extractFilters(normalizedQuery),
      joins: extractJoins(normalizedQuery),
      groupBy: extractGroupBy(normalizedQuery),
      orderBy: extractOrderBy(normalizedQuery),
      limit: extractLimit(normalizedQuery)
    };

    return components;
  } catch (error) {
    console.error('Error parsing query:', error);
    throw new Error('Failed to parse query: ' + error.message);
  }
}

function normalizeQuery(query) {
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function extractQueryType(query) {
  if (query.startsWith('select')) return 'SELECT';
  if (query.startsWith('insert')) return 'INSERT';
  if (query.startsWith('update')) return 'UPDATE';
  if (query.startsWith('delete')) return 'DELETE';
  return 'UNKNOWN';
}

function extractTables(query) {
  const tables = [];
  const fromMatch = query.match(/from\s+([^\s;]+)/);
  if (fromMatch) {
    tables.push(fromMatch[1]);
  }
  
  // Extract joined tables
  const joinMatches = query.match(/join\s+([^\s]+)/g);
  if (joinMatches) {
    joinMatches.forEach(match => {
      tables.push(match.split(/\s+/)[1]);
    });
  }
  
  return tables;
}

function extractColumns(query) {
  const selectMatch = query.match(/select\s+(.*?)\s+from/);
  if (!selectMatch) return [];
  
  return selectMatch[1]
    .split(',')
    .map(col => col.trim())
    .filter(col => col !== '*');
}

function extractFilters(query) {
  const filters = [];
  const whereMatch = query.match(/where\s+(.*?)(?:\s+(?:group by|order by|limit|$))/);
  
  if (whereMatch) {
    const conditions = whereMatch[1].split(/\s+and\s+|\s+or\s+/);
    filters.push(...conditions.map(condition => condition.trim()));
  }
  
  return filters;
}

function extractJoins(query) {
  const joins = [];
  const joinMatches = query.match(/(?:inner|left|right|full)\s+join\s+.*?on\s+.*?(?=(?:\s+(?:where|group by|order by|limit|$)))/g);
  
  if (joinMatches) {
    joinMatches.forEach(match => {
      const [type] = match.match(/^(inner|left|right|full)/);
      const [table] = match.match(/join\s+([^\s]+)/);
      const [condition] = match.match(/on\s+(.*)/);
      
      joins.push({
        type: type.toUpperCase(),
        table: table.split(/\s+/)[1],
        condition: condition.replace(/^on\s+/, '')
      });
    });
  }
  
  return joins;
}

function extractGroupBy(query) {
  const groupByMatch = query.match(/group by\s+(.*?)(?:\s+(?:order by|limit|$))/);
  if (!groupByMatch) return [];
  
  return groupByMatch[1]
    .split(',')
    .map(col => col.trim());
}

function extractOrderBy(query) {
  const orderByMatch = query.match(/order by\s+(.*?)(?:\s+limit|$)/);
  if (!orderByMatch) return [];
  
  return orderByMatch[1]
    .split(',')
    .map(col => {
      const [column, direction] = col.trim().split(/\s+/);
      return {
        column,
        direction: (direction || 'asc').toUpperCase()
      };
    });
}

function extractLimit(query) {
  const limitMatch = query.match(/limit\s+(\d+)/);
  return limitMatch ? parseInt(limitMatch[1]) : null;
} 