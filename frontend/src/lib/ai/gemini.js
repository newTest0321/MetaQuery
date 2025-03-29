import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set');
}

console.log('API Key present:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function analyzeMetadataWithGemini(metadata, prompt) {
  try {
    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Format the metadata for better context
    console.log('Formatting metadata...');
    const metadataContext = formatMetadataForPrompt(metadata);
    
    // Create the prompt
    console.log('Creating prompt...');
    const fullPrompt = `As a metadata optimization expert, analyze this metadata and provide optimizations based on the user's request.

Metadata:
${metadataContext}

User Request:
${prompt}

Please provide:
1. Format-specific optimizations
2. Performance improvements
3. Storage optimizations
4. Specific recommendations
5. Estimated improvements

Format your response in a conversational way, as if you're explaining to the user.`;

    console.log('Generating content with Gemini...');
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    });
    
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    console.log('Parsing Gemini response...');
    // Parse the response to extract structured data
    const parsedResponse = parseGeminiResponse(text, metadata);
    
    if (!parsedResponse) {
      throw new Error('Failed to parse Gemini response');
    }

    return parsedResponse;
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error.message.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key');
    }
    if (error.message.includes('quota')) {
      throw new Error('Gemini API quota exceeded');
    }
    if (error.message.includes('404')) {
      throw new Error('Invalid model name or API version. Please check the configuration.');
    }
    throw new Error(`Failed to analyze metadata: ${error.message}`);
  }
}

function formatMetadataForPrompt(metadata) {
  return JSON.stringify(metadata, null, 2);
}

function parseGeminiResponse(text, originalMetadata) {
  // Extract recommendations
  const recommendations = extractRecommendations(text);
  
  // Extract improvements
  const improvements = extractImprovements(text);
  
  // Create optimized metadata
  const optimizedMetadata = createOptimizedMetadata(originalMetadata, recommendations);

  return {
    recommendations,
    improvements,
    optimizedMetadata,
    response: text
  };
}

function extractRecommendations(text) {
  const recommendations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('•') || line.includes('-')) {
      const description = line.replace(/[•-]\s*/, '').trim();
      if (description) {
        recommendations.push({
          description,
          priority: determinePriority(description),
          impact: determineImpact(description)
        });
      }
    }
  }

  return recommendations;
}

function extractImprovements(text) {
  const improvements = {};
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('improvement') || line.includes('optimization')) {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        improvements[key] = {
          improvement: value
        };
      }
    }
  }

  return improvements;
}

function createOptimizedMetadata(original, recommendations) {
  const optimized = { ...original };

  // Apply optimizations based on recommendations
  recommendations.forEach(rec => {
    if (rec.description.includes('partition')) {
      optimized.partitions = optimizePartitions(optimized.partitions);
    }
    if (rec.description.includes('snapshot')) {
      optimized.snapshots = optimizeSnapshots(optimized.snapshots);
    }
    if (rec.description.includes('schema')) {
      optimized.schema = optimizeSchema(optimized.schema);
    }
  });

  return optimized;
}

function optimizePartitions(partitions) {
  if (!partitions) return partitions;
  
  return partitions.map(partition => ({
    ...partition,
    optimization: {
      strategy: 'identity',
      stats: {
        null_count: 0,
        value_counts: {}
      }
    }
  }));
}

function optimizeSnapshots(snapshots) {
  if (!snapshots) return snapshots;
  
  // Keep only the last 5 snapshots
  return snapshots.slice(-5);
}

function optimizeSchema(schema) {
  if (!schema) return schema;
  
  return {
    ...schema,
    optimization: {
      z_ordering: {
        enabled: true,
        columns: schema.fields?.map(f => f.name) || []
      }
    }
  };
}

function determinePriority(description) {
  if (description.toLowerCase().includes('critical') || 
      description.toLowerCase().includes('high priority')) {
    return 'high';
  }
  if (description.toLowerCase().includes('medium') || 
      description.toLowerCase().includes('moderate')) {
    return 'medium';
  }
  return 'low';
}

function determineImpact(description) {
  if (description.toLowerCase().includes('significant') || 
      description.toLowerCase().includes('major')) {
    return 'high';
  }
  if (description.toLowerCase().includes('moderate') || 
      description.toLowerCase().includes('medium')) {
    return 'medium';
  }
  return 'low';
} 