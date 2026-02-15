import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
    try {
        const { content, fileName } = await request.json();

        if (!content) {
            return NextResponse.json({ error: 'No content provided' }, { status: 400 });
        }

        const prompt = `Analyze this document for blockchain anchoring. Extract key information.

Document Name: ${fileName}
Content (truncated):
${content.slice(0, 3000)}

Respond with ONLY this JSON format (no other text):
{
    "summary": "One sentence summary of what this document is about (max 30 words)",
    "documentType": "Contract|Invoice|Certificate|Report|Legal|Technical|Personal|Other",
    "entities": [
        {"type": "Date|Person|Organization|Location|Amount|Reference", "value": "extracted value"}
    ],
    "suggestedTags": ["tag1", "tag2", "tag3"],
    "confidence": 0.85
}

Extract up to 5 entities. Keep tags lowercase, single words. Confidence is 0-1 based on content clarity.`;

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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return NextResponse.json(result);
        }

        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.error('Document analysis error:', error);

        // Return fallback analysis
        const fileName = 'document';
        return NextResponse.json({
            summary: `Document ready for blockchain anchoring. Creates immutable proof of existence.`,
            documentType: 'General',
            entities: [],
            suggestedTags: ['document', 'proof', 'anchor'],
            confidence: 0.6,
        });
    }
}
