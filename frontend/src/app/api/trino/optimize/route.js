import { NextResponse } from 'next/server';
import { optimizeTrinoQuery } from '@/lib/trino/optimizer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, metadata } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Optimize query using metadata insights
    const optimizationResult = await optimizeTrinoQuery(query, metadata);

    return NextResponse.json(optimizationResult);
  } catch (error) {
    console.error('Query optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize query' },
      { status: 500 }
    );
  }
} 