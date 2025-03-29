import { NextResponse } from 'next/server';
import { analyzeQuery, generateAlternatives, predictPerformance } from '@/lib/ai/queryOptimizer';

export async function POST(request) {
  try {
    const { query, queryType } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Analyze query and generate optimization suggestions
    const analysis = await analyzeQuery(query, queryType);
    
    // Generate alternative optimized queries
    const alternatives = await generateAlternatives(query, queryType);
    
    // Predict query performance
    const performance = await predictPerformance(query, queryType);

    // Combine all results
    const results = {
      queryType,
      predictedExecutionTime: performance.executionTime,
      resourceUsage: performance.resourceUsage,
      performanceScore: performance.score,
      suggestions: analysis.suggestions,
      alternatives: alternatives,
      historicalAnalysis: {
        similarQueries: analysis.similarQueries,
        avgPerformance: analysis.avgPerformance,
        trend: analysis.trend
      }
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Query optimization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize query' },
      { status: 500 }
    );
  }
} 