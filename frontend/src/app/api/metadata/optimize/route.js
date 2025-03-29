import { NextResponse } from 'next/server';
import { analyzeMetadataWithGemini } from '@/lib/ai/gemini';

export async function POST(request) {
  try {
    console.log('Received metadata optimization request');
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    if (!body) {
      console.error('No request body provided');
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    const { metadata, prompt } = body;

    if (!metadata) {
      console.error('No metadata provided in request');
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      console.error('No prompt provided in request');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate metadata format
    try {
      JSON.parse(JSON.stringify(metadata));
    } catch (error) {
      console.error('Invalid metadata format:', error);
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    console.log('Analyzing metadata with Gemini...');
    // Use Gemini to analyze and optimize metadata
    const results = await analyzeMetadataWithGemini(metadata, prompt);

    if (!results) {
      console.error('No results returned from analysis');
      return NextResponse.json(
        { error: 'Failed to analyze metadata' },
        { status: 500 }
      );
    }

    console.log('Successfully analyzed metadata');
    return NextResponse.json(results);
  } catch (error) {
    console.error('Metadata optimization error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Handle specific error types
    if (error.message.includes('NEXT_PUBLIC_GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }
    
    if (error.message.includes('Failed to analyze metadata')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while optimizing metadata',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }
}

function determineMetadataFormat(metadata) {
  // Check for Iceberg format
  if (metadata['current-snapshot-id'] && metadata.snapshots) {
    return 'iceberg';
  }
  // Check for Delta Lake format
  if (metadata.version && metadata.protocol) {
    return 'delta_lake';
  }
  // Check for Hudi format
  if (metadata.hoodie && metadata.hoodie.table) {
    return 'hudi';
  }
  // Check for Hive ACID format
  if (metadata.tableType === 'MANAGED_TABLE' && metadata.transactional === true) {
    return 'hive_acid';
  }
  return 'unknown';
}

function generateConversationalResponse(results, prompt) {
  let response = "I've analyzed your metadata and made some optimizations based on your request.\n\n";

  // Add format-specific responses
  if (results.format === 'iceberg') {
    response += "For your Iceberg table, I've made the following improvements:\n";
    if (results.recommendations) {
      results.recommendations.forEach(rec => {
        response += `• ${rec.description}\n`;
      });
    }
  }

  // Add performance improvements
  if (results.improvements) {
    response += "\nPerformance improvements:\n";
    Object.entries(results.improvements).forEach(([key, value]) => {
      response += `• ${key}: ${value.improvement} improvement\n`;
    });
  }

  // Add specific recommendations based on the prompt
  if (prompt.toLowerCase().includes('performance')) {
    response += "\nFor better performance, consider:\n";
    response += "• Optimizing partition strategy\n";
    response += "• Implementing Z-ordering\n";
    response += "• Managing snapshots efficiently\n";
  }

  if (prompt.toLowerCase().includes('storage')) {
    response += "\nFor storage optimization:\n";
    response += "• Implementing data compaction\n";
    response += "• Optimizing file sizes\n";
    response += "• Managing data retention\n";
  }

  response += "\nWould you like me to explain any of these optimizations in more detail?";
  return response;
} 