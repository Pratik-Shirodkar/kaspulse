import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

const KASPA_API = 'https://api.kaspa.org';

// Create client inside request to ensure env vars are loaded
function getBedrockClient() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    console.log('Bedrock Config:', {
        region,
        hasAccessKey: !!accessKeyId,
        hasSecret: !!secretAccessKey
    });

    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS credentials not configured');
    }

    return new BedrockRuntimeClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
}

// Fetch real-time Kaspa data
async function getKaspaContext() {
    try {
        const [blockdag, hashrate, price, supply, blueScore] = await Promise.all([
            fetch(`${KASPA_API}/info/blockdag`).then(r => r.json()),
            fetch(`${KASPA_API}/info/hashrate`).then(r => r.json()),
            fetch(`${KASPA_API}/info/price`).then(r => r.json()),
            fetch(`${KASPA_API}/info/coinsupply`).then(r => r.json()),
            fetch(`${KASPA_API}/info/virtual-chain-blue-score`).then(r => r.json()),
        ]);

        return {
            blockHeight: blueScore.blueScore,
            blockCount: blockdag.blockCount,
            difficulty: blockdag.difficulty,
            hashrate: hashrate?.hashrate || 0,
            price: price?.price || 0,
            circulatingSupply: supply.circulatingSupply,
            maxSupply: supply.maxSupply,
            daaScore: blockdag.virtualDaaScore,
        };
    } catch (error) {
        console.error('Failed to fetch Kaspa context:', error);
        return null;
    }
}

// Lookup address balance
async function lookupAddress(address: string) {
    try {
        const response = await fetch(`${KASPA_API}/addresses/${address}/balance`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

// Lookup transaction
async function lookupTransaction(txId: string) {
    try {
        const response = await fetch(`${KASPA_API}/transactions/${txId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json();

        // Get real-time Kaspa data
        const kaspaData = await getKaspaContext();

        // Check if user is asking about a specific address or transaction
        let additionalContext = '';
        const addressMatch = message.match(/kaspa:[a-z0-9]{61,63}/i);
        const txMatch = message.match(/[a-f0-9]{64}/i);

        if (addressMatch) {
            const addressData = await lookupAddress(addressMatch[0]);
            if (addressData) {
                additionalContext += `\n\nAddress ${addressMatch[0]} has balance: ${(addressData.balance / 1e8).toFixed(2)} KAS`;
            }
        }

        if (txMatch) {
            const txData = await lookupTransaction(txMatch[0]);
            if (txData) {
                additionalContext += `\n\nTransaction ${txMatch[0].slice(0, 16)}... found with ${txData.outputs?.length || 0} outputs`;
            }
        }

        const systemPrompt = `You are KasBot, an AI assistant for KasPulse - a real-time Kaspa blockchain dashboard.

You have access to live Kaspa network data:
${kaspaData ? `
- Block Height: ${kaspaData.blockHeight?.toLocaleString()}
- Total Blocks: ${kaspaData.blockCount?.toLocaleString()}
- Network Hashrate: ${(kaspaData.hashrate / 1e12).toFixed(2)} TH/s
- KAS Price: $${kaspaData.price?.toFixed(4)} USD
- Circulating Supply: ${(kaspaData.circulatingSupply / 1e9).toFixed(2)} billion KAS
- DAA Score: ${kaspaData.daaScore?.toLocaleString()}
- Block Time: ~1 second (Kaspa is one of the fastest PoW blockchains)
` : 'Network data temporarily unavailable'}
${additionalContext}

Important facts about Kaspa:
- Kaspa uses BlockDAG (not a simple blockchain) - allows parallel blocks
- Uses GHOSTDAG protocol for consensus
- Target block rate: 1 block per second
- Uses Proof-of-Work with KHeavyHash algorithm
- Maximum supply: 28.7 billion KAS

Guidelines:
- Be concise and helpful
- Use real numbers from the live data above
- If asked about addresses/transactions, use the lookup data if available
- Format numbers with commas for readability
- Be enthusiastic about Kaspa's speed!
- If you don't know something, say so honestly`;

        // Filter history to ensure it starts with a user message
        const filteredHistory = (history || [])
            .filter((msg: { role: string; content: string }) => msg.role === 'user' || msg.role === 'assistant')
            .reduce((acc: Array<{ role: string; content: string }>, msg: { role: string; content: string }) => {
                // Skip assistant messages if there's no user message yet
                if (acc.length === 0 && msg.role === 'assistant') {
                    return acc;
                }
                return [...acc, { role: msg.role, content: msg.content }];
            }, []);

        const messages = [
            ...filteredHistory,
            { role: 'user', content: message },
        ];

        const body = JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages,
        });

        // Create client per request to ensure fresh credentials
        const client = getBedrockClient();

        const command = new InvokeModelCommand({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: body,
        });

        console.log('Sending request to Bedrock...');
        const response = await client.send(command);
        console.log('Bedrock response received');

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const assistantMessage = responseBody.content[0].text;

        return NextResponse.json({
            message: assistantMessage,
            kaspaData: kaspaData,
        });
    } catch (error: unknown) {
        console.error('Chat API error:', error);

        // More specific error messages
        let errorMessage = 'Failed to process chat request';
        if (error instanceof Error) {
            if (error.message.includes('credentials')) {
                errorMessage = 'AWS credentials not configured';
            } else if (error.message.includes('AccessDenied')) {
                errorMessage = 'Access denied - check Bedrock model access in AWS console';
            } else if (error.message.includes('not found') || error.message.includes('ResourceNotFoundException')) {
                errorMessage = 'Model not available in this region - try us-west-2';
            }
        }

        return NextResponse.json(
            { error: errorMessage, details: String(error) },
            { status: 500 }
        );
    }
}
