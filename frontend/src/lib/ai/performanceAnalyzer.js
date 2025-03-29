import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzePerformance(metrics1, metrics2) {
  try {
    const prompt = `
      Analyze these performance metrics and provide optimization recommendations:
      
      Original Metrics:
      ${JSON.stringify(metrics1, null, 2)}
      
      New Metrics:
      ${JSON.stringify(metrics2, null, 2)}
      
      Please provide:
      1. Performance bottlenecks
      2. Optimization opportunities
      3. Resource utilization analysis
      4. Cost optimization suggestions
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in database performance optimization. Analyze metrics and provide actionable recommendations."
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
      recommendations: extractPerformanceRecommendations(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Performance Analysis Error:', error);
    throw new Error('Failed to analyze performance');
  }
}

export async function predictPerformanceTrends(metrics, historicalData) {
  try {
    const prompt = `
      Based on these performance metrics and historical data, predict future trends:
      
      Current Metrics:
      ${JSON.stringify(metrics, null, 2)}
      
      Historical Data:
      ${JSON.stringify(historicalData, null, 2)}
      
      Please provide:
      1. Performance trend predictions
      2. Resource scaling recommendations
      3. Cost projections
      4. Optimization priorities
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in performance trend analysis and prediction. Analyze patterns and provide insights."
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
      priorities: extractOptimizationPriorities(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Performance Prediction Error:', error);
    throw new Error('Failed to predict performance trends');
  }
}

export async function generateOptimizationPlan(analysis, constraints) {
  try {
    const prompt = `
      Generate an optimization plan based on this analysis and constraints:
      
      Performance Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Constraints:
      ${JSON.stringify(constraints, null, 2)}
      
      Please provide:
      1. Step-by-step optimization plan
      2. Resource requirements
      3. Timeline estimates
      4. Risk mitigation strategies
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in creating database optimization plans. Generate detailed, actionable plans."
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
      plan: completion.choices[0].message.content,
      steps: extractOptimizationSteps(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Optimization Plan Generation Error:', error);
    throw new Error('Failed to generate optimization plan');
  }
}

function extractPerformanceRecommendations(analysis) {
  const recommendations = {
    bottlenecks: [],
    optimizations: [],
    resources: [],
    costs: []
  };

  const lines = analysis.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('bottleneck')) {
      recommendations.bottlenecks.push(line.trim());
    } else if (line.toLowerCase().includes('optimization')) {
      recommendations.optimizations.push(line.trim());
    } else if (line.toLowerCase().includes('resource')) {
      recommendations.resources.push(line.trim());
    } else if (line.toLowerCase().includes('cost')) {
      recommendations.costs.push(line.trim());
    }
  });

  return recommendations;
}

function extractOptimizationPriorities(predictions) {
  const priorities = {
    high: [],
    medium: [],
    low: []
  };

  const lines = predictions.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('high priority')) {
      priorities.high.push(line.trim());
    } else if (line.toLowerCase().includes('medium priority')) {
      priorities.medium.push(line.trim());
    } else if (line.toLowerCase().includes('low priority')) {
      priorities.low.push(line.trim());
    }
  });

  return priorities;
}

function extractOptimizationSteps(plan) {
  const steps = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };

  const lines = plan.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('immediate')) {
      steps.immediate.push(line.trim());
    } else if (line.toLowerCase().includes('short term')) {
      steps.shortTerm.push(line.trim());
    } else if (line.toLowerCase().includes('long term')) {
      steps.longTerm.push(line.trim());
    }
  });

  return steps;
} 