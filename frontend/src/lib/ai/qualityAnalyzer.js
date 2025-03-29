import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeDataQuality(stats1, stats2) {
  try {
    const prompt = `
      Analyze these data quality metrics and provide insights:
      
      Original Stats:
      ${JSON.stringify(stats1, null, 2)}
      
      New Stats:
      ${JSON.stringify(stats2, null, 2)}
      
      Please provide:
      1. Data quality issues
      2. Anomaly detection
      3. Data consistency analysis
      4. Improvement recommendations
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in data quality analysis. Analyze metrics and provide detailed insights."
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
      issues: extractQualityIssues(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Data Quality Analysis Error:', error);
    throw new Error('Failed to analyze data quality');
  }
}

export async function detectAnomalies(metrics, historicalData) {
  try {
    const prompt = `
      Analyze these metrics and historical data to detect anomalies:
      
      Current Metrics:
      ${JSON.stringify(metrics, null, 2)}
      
      Historical Data:
      ${JSON.stringify(historicalData, null, 2)}
      
      Please provide:
      1. Detected anomalies
      2. Root cause analysis
      3. Impact assessment
      4. Resolution recommendations
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in anomaly detection and analysis. Identify patterns and anomalies in data."
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
      anomalies: completion.choices[0].message.content,
      recommendations: extractAnomalyRecommendations(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Anomaly Detection Error:', error);
    throw new Error('Failed to detect anomalies');
  }
}

export async function generateQualityReport(analysis, thresholds) {
  try {
    const prompt = `
      Generate a comprehensive data quality report based on this analysis:
      
      Quality Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Quality Thresholds:
      ${JSON.stringify(thresholds, null, 2)}
      
      Please provide:
      1. Overall quality score
      2. Detailed findings
      3. Risk assessment
      4. Action items
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in generating data quality reports. Create detailed, actionable reports."
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
      report: completion.choices[0].message.content,
      findings: extractQualityFindings(completion.choices[0].message.content)
    };
  } catch (error) {
    console.error('AI Quality Report Generation Error:', error);
    throw new Error('Failed to generate quality report');
  }
}

function extractQualityIssues(analysis) {
  const issues = {
    critical: [],
    warning: [],
    info: []
  };

  const lines = analysis.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('critical')) {
      issues.critical.push(line.trim());
    } else if (line.toLowerCase().includes('warning')) {
      issues.warning.push(line.trim());
    } else if (line.toLowerCase().includes('info')) {
      issues.info.push(line.trim());
    }
  });

  return issues;
}

function extractAnomalyRecommendations(analysis) {
  const recommendations = {
    immediate: [],
    investigation: [],
    prevention: []
  };

  const lines = analysis.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('immediate')) {
      recommendations.immediate.push(line.trim());
    } else if (line.toLowerCase().includes('investigation')) {
      recommendations.investigation.push(line.trim());
    } else if (line.toLowerCase().includes('prevention')) {
      recommendations.prevention.push(line.trim());
    }
  });

  return recommendations;
}

function extractQualityFindings(report) {
  const findings = {
    score: 0,
    metrics: [],
    risks: [],
    actions: []
  };

  const lines = report.split('\n');
  lines.forEach(line => {
    if (line.toLowerCase().includes('score')) {
      const scoreMatch = line.match(/\d+/);
      if (scoreMatch) {
        findings.score = parseInt(scoreMatch[0]);
      }
    } else if (line.toLowerCase().includes('metric')) {
      findings.metrics.push(line.trim());
    } else if (line.toLowerCase().includes('risk')) {
      findings.risks.push(line.trim());
    } else if (line.toLowerCase().includes('action')) {
      findings.actions.push(line.trim());
    }
  });

  return findings;
} 