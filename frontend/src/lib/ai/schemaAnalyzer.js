import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeSchemaChanges(schema1, schema2) {
  try {
    const prompt = `
      Analyze these database schema changes and provide insights:
      
      Original Schema:
      ${JSON.stringify(schema1, null, 2)}
      
      New Schema:
      ${JSON.stringify(schema2, null, 2)}
      
      Please provide:
      1. Impact analysis of schema changes
      2. Potential performance implications
      3. Data migration recommendations
      4. Best practices suggestions
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert database schema analyst. Analyze schema changes and provide detailed insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      analysis: completion.choices[0].message.content,
      recommendations: extractRecommendations(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Schema Analysis Error:', error);
    throw new Error('Failed to analyze schema changes');
  }
}

export async function predictSchemaEvolution(schema, historicalChanges) {
  try {
    const prompt = `
      Based on this schema and historical changes, predict future schema evolution:
      
      Current Schema:
      ${JSON.stringify(schema, null, 2)}
      
      Historical Changes:
      ${JSON.stringify(historicalChanges, null, 2)}
      
      Please provide:
      1. Predicted schema changes
      2. Timeline estimates
      3. Risk assessment
      4. Mitigation strategies
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in database schema evolution prediction. Analyze patterns and predict future changes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      predictions: completion.choices[0].message.content,
      risks: extractRisks(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Schema Prediction Error:', error);
    throw new Error('Failed to predict schema evolution');
  }
}

function extractRecommendations(analysis) {
  // Extract structured recommendations from AI analysis
  const recommendations = {
    performance: [],
    migration: [],
    bestPractices: []
  };

  // Parse the analysis text to extract recommendations
  const lines = analysis.split('\n');
  lines.forEach(line => {
    if (line.includes('performance')) {
      recommendations.performance.push(line.trim());
    } else if (line.includes('migration')) {
      recommendations.migration.push(line.trim());
    } else if (line.includes('best practice')) {
      recommendations.bestPractices.push(line.trim());
    }
  });

  return recommendations;
}

function extractRisks(predictions) {
  // Extract structured risks from AI predictions
  const risks = {
    high: [],
    medium: [],
    low: []
  };

  // Parse the predictions text to extract risks
  const lines = predictions.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('high risk')) {
      risks.high.push(line.trim());
    } else if (line.toLowerCase().includes('medium risk')) {
      risks.medium.push(line.trim());
    } else if (line.toLowerCase().includes('low risk')) {
      risks.low.push(line.trim());
    }
  });

  return risks;
} 