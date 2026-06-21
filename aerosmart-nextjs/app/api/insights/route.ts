import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { TelemetryRow } from '@/lib/types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'fake-key',
});

export async function POST(req: Request) {
  try {
    const { history }: { history: TelemetryRow[] } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ insights: ["Not enough data to generate insights."] });
    }

    // Prepare a slim version of the history to send to LLM to save tokens
    const dataSample = history.slice(-50).map(r => ({
      time: new Date(r.created_at).toLocaleTimeString(),
      gas: r.gas,
      temp: r.temperature,
      light: r.light,
      hazard: r.hazard_score,
      motorPwr: r.power
    }));

    const prompt = `You are an expert industrial data analyst monitoring an AI-powered smart ventilation system.
    
Here is the recent telemetry data (last 50 minutes):
${JSON.stringify(dataSample, null, 2)}

Analyze this data and identify 3 to 4 distinct, highly actionable temporal patterns or correlations. 
For example, does hazard score spike when light (occupancy proxy) is high? Is the motor power increasing over time indicating wear? 

Return your response strictly as a JSON object with a single key "insights" which contains an array of strings. Example:
{ "insights": ["Insight 1", "Insight 2"] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content || '{"insights": []}';
    const parsed = JSON.parse(responseContent);
    
    return NextResponse.json({ insights: parsed.insights || ["No insights generated."] });
  } catch (error) {
    console.error('Insights Error:', error);
    return NextResponse.json({ insights: ["Failed to generate insights. Check API keys."] }, { status: 500 });
  }
}
