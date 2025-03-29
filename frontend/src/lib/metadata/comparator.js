import { analyzeSchemaChanges, predictSchemaEvolution } from '../ai/schemaAnalyzer';
import { analyzePerformance, predictPerformanceTrends } from '../ai/performanceAnalyzer';
import { analyzeDataQuality, detectAnomalies } from '../ai/qualityAnalyzer';

export async function compareMetadata(metadata1, metadata2) {
  try {
    // Basic comparison
    const basicResults = {
      schema: compareSchema(metadata1, metadata2),
      statistics: compareStatistics(metadata1, metadata2),
      performance: comparePerformance(metadata1, metadata2),
      quality: compareDataQuality(metadata1, metadata2)
    };

    // AI-powered analysis
    const aiResults = await performAIAnalysis(metadata1, metadata2);

    return {
      ...basicResults,
      aiInsights: aiResults
    };
  } catch (error) {
    console.error('Metadata comparison error:', error);
    throw new Error(`Failed to compare metadata: ${error.message}`);
  }
}

async function performAIAnalysis(metadata1, metadata2) {
  try {
    // Schema analysis
    const schemaAnalysis = await analyzeSchemaChanges(
      metadata1.schema,
      metadata2.schema
    );

    // Performance analysis
    const performanceAnalysis = await analyzePerformance(
      metadata1.performance,
      metadata2.performance
    );

    // Data quality analysis
    const qualityAnalysis = await analyzeDataQuality(
      metadata1.quality,
      metadata2.quality
    );

    // Anomaly detection
    const anomalies = await detectAnomalies(
      metadata2,
      [metadata1] // Historical data
    );

    return {
      schema: schemaAnalysis,
      performance: performanceAnalysis,
      quality: qualityAnalysis,
      anomalies: anomalies
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      error: 'Failed to perform AI analysis'
    };
  }
}

function compareSchema(metadata1, metadata2) {
  const differences = [];
  
  // Compare schema based on metadata type
  if (metadata1.type === 'delta_log' && metadata2.type === 'delta_log') {
    const schema1 = metadata1.schema;
    const schema2 = metadata2.schema;
    
    // Compare columns
    const columns1 = new Set(schema1.columns.map(c => c.name));
    const columns2 = new Set(schema2.columns.map(c => c.name));
    
    // Added columns
    columns2.forEach(col => {
      if (!columns1.has(col)) {
        differences.push({
          type: 'added',
          description: `Column '${col}' was added`
        });
      }
    });
    
    // Removed columns
    columns1.forEach(col => {
      if (!columns2.has(col)) {
        differences.push({
          type: 'removed',
          description: `Column '${col}' was removed`
        });
      }
    });
    
    // Type changes
    schema1.columns.forEach(col1 => {
      const col2 = schema2.columns.find(c => c.name === col1.name);
      if (col2 && col1.type !== col2.type) {
        differences.push({
          type: 'modified',
          description: `Column '${col1.name}' type changed from ${col1.type} to ${col2.type}`
        });
      }
    });
  }
  
  return differences;
}

function compareStatistics(metadata1, metadata2) {
  const statistics = [];
  
  // Compare statistics based on metadata type
  if (metadata1.type === 'delta_stats' && metadata2.type === 'delta_stats') {
    // Compare table statistics
    const stats1 = metadata1.tableStats;
    const stats2 = metadata2.tableStats;
    
    // Record count difference
    const recordCountDiff = stats2.recordCount - stats1.recordCount;
    const recordCountPercentage = (recordCountDiff / stats1.recordCount) * 100;
    
    statistics.push({
      name: 'Record Count',
      difference: recordCountDiff,
      percentage: Math.abs(recordCountPercentage)
    });
    
    // File size difference
    const sizeDiff = stats2.totalSize - stats1.totalSize;
    const sizePercentage = (sizeDiff / stats1.totalSize) * 100;
    
    statistics.push({
      name: 'Total Size',
      difference: `${(sizeDiff / 1024 / 1024).toFixed(2)} MB`,
      percentage: Math.abs(sizePercentage)
    });
  }
  
  return statistics;
}

function comparePerformance(metadata1, metadata2) {
  const metrics = [];
  
  // Compare performance based on metadata type
  if (metadata1.type === 'delta_operation' && metadata2.type === 'delta_operation') {
    const perf1 = metadata1.performance;
    const perf2 = metadata2.performance;
    
    // Compare operation duration
    const durationDiff = perf2.duration - perf1.duration;
    const durationImprovement = (durationDiff / perf1.duration) * 100;
    
    metrics.push({
      name: 'Operation Duration',
      improvement: -durationImprovement,
      description: `Operation duration changed from ${perf1.duration}ms to ${perf2.duration}ms`
    });
    
    // Compare resource usage
    const resourceDiff = perf2.resourceUsage - perf1.resourceUsage;
    const resourceImprovement = (resourceDiff / perf1.resourceUsage) * 100;
    
    metrics.push({
      name: 'Resource Usage',
      improvement: -resourceImprovement,
      description: `Resource usage changed from ${perf1.resourceUsage} to ${perf2.resourceUsage}`
    });
  }
  
  return metrics;
}

function compareDataQuality(metadata1, metadata2) {
  const checks = [];
  
  // Compare data quality based on metadata type
  if (metadata1.type === 'delta_stats' && metadata2.type === 'delta_stats') {
    const stats1 = metadata1.tableStats;
    const stats2 = metadata2.tableStats;
    
    // Check for null values
    const nullPercentage1 = stats1.nullCount / stats1.recordCount;
    const nullPercentage2 = stats2.nullCount / stats2.recordCount;
    
    if (nullPercentage2 > 0.1) {
      checks.push({
        name: 'Null Values',
        status: 'warning',
        description: `High percentage of null values (${(nullPercentage2 * 100).toFixed(2)}%)`
      });
    }
    
    // Check for data freshness
    const freshness1 = new Date(metadata1.timestamp);
    const freshness2 = new Date(metadata2.timestamp);
    const freshnessDiff = freshness2 - freshness1;
    
    if (freshnessDiff > 24 * 60 * 60 * 1000) { // 24 hours
      checks.push({
        name: 'Data Freshness',
        status: 'warning',
        description: `Data is ${(freshnessDiff / (24 * 60 * 60 * 1000)).toFixed(1)} days old`
      });
    }
    
    // Check for data consistency
    if (stats2.recordCount < stats1.recordCount * 0.9) {
      checks.push({
        name: 'Data Consistency',
        status: 'error',
        description: `Significant decrease in record count (${((stats2.recordCount / stats1.recordCount) * 100).toFixed(1)}%)`
      });
    }
  }
  
  return checks;
} 