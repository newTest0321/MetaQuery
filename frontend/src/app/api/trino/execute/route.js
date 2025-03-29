import { NextResponse } from 'next/server';
import { executeTrinoQuery } from '@/lib/trino/executor';

export async function POST(request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Execute query and measure performance
    const startTime = Date.now();
    const results = await executeTrinoQuery(query);
    const executionTime = Date.now() - startTime;

    // Calculate performance metrics
    const performanceMetrics = {
      executionTime,
      baselineTime: executionTime * 1.5, // Example baseline for comparison
      cpuUsage: Math.floor(Math.random() * 40) + 20, // Mock CPU usage between 20-60%
      memoryUsage: Math.floor(Math.random() * 30) + 10, // Mock memory usage between 10-40%
    };

    return NextResponse.json({
      results,
      performanceMetrics
    });
  } catch (error) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 