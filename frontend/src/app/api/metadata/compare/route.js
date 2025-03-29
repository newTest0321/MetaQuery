import { NextResponse } from 'next/server';
import { parseMetadata } from '@/lib/metadata/parser';
import { compareMetadata } from '@/lib/metadata/comparator';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const format1 = formData.get('format1');
    const format2 = formData.get('format2');
    const table1 = formData.get('table1');
    const table2 = formData.get('table2');
    const file1 = formData.get('file1');
    const file2 = formData.get('file2');

    // Validate inputs
    if (!format1 || !format2 || !table1 || !table2 || !file1 || !file2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse metadata files
    const metadata1 = await parseMetadata(file1, format1, table1);
    const metadata2 = await parseMetadata(file2, format2, table2);

    // Compare metadata
    const comparisonResults = await compareMetadata(metadata1, metadata2);

    return NextResponse.json(comparisonResults);
  } catch (error) {
    console.error('Metadata comparison error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compare metadata' },
      { status: 500 }
    );
  }
} 