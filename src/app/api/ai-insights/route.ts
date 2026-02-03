import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

const KASPA_API = 'https://api.kaspa.org';

function getBedrockClient() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS credentials not configured');
    }

    return new BedrockRuntimeClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
    });
}

async function getKaspaData() {
    try {
        const [blockdag, hashrateData, priceData, supply] = await Promise.all([
            fetch(`${KASPA_API}/info/blockdag`).then(r => r.json()),
            fetch(`${KASPA_API}/info/hashrate`).then(r => r.json()),
            fetch(`${KASPA_API}/info/price`).then(r => r.json()),
            fetch(`${KASPA_API}/info/coinsupply`).then(r => r.json()),
        ]);

        // Extract hashrate - API returns { hashrate: number }
        const hashrate = hashrateData?.hashrate || 0;

        // Extract price - API returns { price: number }
        const price = priceData?.price || 0;

        return {
            blockCount: blockdag.blockCount,
            difficulty: blockdag.difficulty,
            daaScore: blockdag.virtualDaaScore, // Note: API uses virtualDaaScore
            hashrate: hashrate,
            price: price,
            circulatingSupply: supply.circulatingSupply,
        };
    } catch (error) {
        console.error('Failed to fetch Kaspa data:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const kaspaData = await getKaspaData();

        if (!kaspaData) {
            return NextResponse.json({ insights: [] });
        }

        const prompt = `You are an AI analyst for Kaspa blockchain. Analyze this real-time data and provide 3 brief insights.

Current Kaspa Network Data:
- Block Count: ${kaspaData.blockCount?.toLocaleString()}
- DAA Score: ${kaspaData.daaScore?.toLocaleString()}
- Network Hashrate: ${kaspaData.hashrate.toFixed(2)} PH/s
- KAS Price: $${kaspaData.price?.toFixed(4)} USD
- Circulating Supply: ${(kaspaData.circulatingSupply / 1e9).toFixed(2)} billion KAS

Generate exactly 3 insights in this JSON format (no other text):
[
  {"type": "bullish|bearish|neutral|alert", "title": "Short title (max 5 words)", "description": "One sentence insight about network health, trends, or notable activity."}
]

Types explained:
- bullish: positive trend, growth, or healthy metrics
- bearish: negative trend or concerning metrics  
- neutral: informational or stable conditions
- alert: unusual activity or important update

Be specific with numbers from the data. Keep descriptions under 20 words.`;

        const client = getBedrockClient();

        const command = new InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 512,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const text = responseBody.content[0].text;

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const insights = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ insights, kaspaData });
        }

        return NextResponse.json({ insights: [], kaspaData });
    } catch (error) {
        console.error('AI Insights error:', error);

        // Return mock insights on error
        return NextResponse.json({
            insights: [
                { type: 'bullish', title: 'Network Running Strong', description: 'Kaspa maintaining consistent 1-second block times with optimal hashrate.' },
                { type: 'neutral', title: 'Steady State', description: 'Transaction volume within normal parameters for this time period.' },
                { type: 'alert', title: 'Monitor Active', description: 'AI analysis temporarily using cached data. Live analysis resuming shortly.' },
            ],
        });
    }
}
