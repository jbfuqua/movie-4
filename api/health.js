// api/health.js - Enhanced with Gemini Support and Image Generation Testing
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    console.log('🏥 Health check started');

    // Check all API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    // Check all environment variables
    const allEnvKeys = Object.keys(process.env);
    const anthropicKeys = allEnvKeys.filter(key => key.toLowerCase().includes('anthropic'));
    const openaiKeys = allEnvKeys.filter(key => key.toLowerCase().includes('openai'));
    const geminiKeys = allEnvKeys.filter(key => 
        key.toLowerCase().includes('gemini') || key.toLowerCase().includes('google')
    );

    const basicHealth = {
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: 'Vercel Serverless',
        vercelEnv: process.env.VERCEL_ENV || 'unknown',
        region: process.env.VERCEL_REGION || 'unknown',
        
        // All API keys
        apiKeys: {
            anthropic: !!anthropicKey,
            anthropicLength: anthropicKey ? anthropicKey.length : 0,
            anthropicPrefix: anthropicKey ? anthropicKey.substring(0, 15) + '...' : 'MISSING',
            anthropicValidFormat: anthropicKey ? anthropicKey.startsWith('sk-ant-') : false,
            
            openai: !!openaiKey,
            openaiLength: openaiKey ? openaiKey.length : 0,
            openaiPrefix: openaiKey ? openaiKey.substring(0, 15) + '...' : 'MISSING',
            openaiValidFormat: openaiKey ? openaiKey.startsWith('sk-') : false,
            
            gemini: !!geminiKey,
            geminiLength: geminiKey ? geminiKey.length : 0,
            geminiPrefix: geminiKey ? geminiKey.substring(0, 15) + '...' : 'MISSING',
            geminiValidFormat: geminiKey ? (geminiKey.startsWith('AIza') || geminiKey.length > 30) : false
        },
        
        // Debug info
        debug: {
            anthropicEnvKeys: anthropicKeys,
            openaiEnvKeys: openaiKeys,
            geminiEnvKeys: geminiKeys,
            totalEnvVars: allEnvKeys.length,
            nodeVersion: process.version,
            platform: process.platform,
            hasVercelKeys: allEnvKeys.filter(k => k.startsWith('VERCEL_')).length
        }
    };

    // If GET request, return basic health
    if (req.method === 'GET') {
        console.log('✅ Basic health check completed');
        return res.status(200).json(basicHealth);
    }

    // If POST request, run extended tests including Gemini image generation
    if (req.method === 'POST') {
        console.log('🧪 Running extended health tests...');
        
        const extendedHealth = {
            ...basicHealth,
            tests: {
                anthropicTest: null,
                openaiTest: null,
                geminiTest: null,
                geminiImageTest: null
            }
        };

        // Test 1: Anthropic API
        if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
            console.log('🤖 Testing Anthropic API...');
            try {
                const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': anthropicKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 50,
                        messages: [{ role: "user", content: "Say 'Health check OK' and nothing else." }]
                    })
                });

                if (anthropicResponse.ok) {
                    const result = await anthropicResponse.json();
                    extendedHealth.tests.anthropicTest = {
                        status: 'PASS',
                        response: result?.content?.[0]?.text || 'No response text'
                    };
                    console.log('✅ Anthropic test passed');
                } else {
                    const errorText = await anthropicResponse.text();
                    extendedHealth.tests.anthropicTest = {
                        status: 'FAIL',
                        error: `HTTP ${anthropicResponse.status}`,
                        details: errorText.substring(0, 200)
                    };
                    console.log('❌ Anthropic test failed:', anthropicResponse.status);
                }
            } catch (anthropicError) {
                extendedHealth.tests.anthropicTest = {
                    status: 'ERROR',
                    error: anthropicError.message
                };
                console.log('❌ Anthropic test error:', anthropicError.message);
            }
        } else {
            extendedHealth.tests.anthropicTest = {
                status: 'SKIP',
                reason: 'No valid Anthropic API key'
            };
        }

        // Test 2: OpenAI API
        if (openaiKey && openaiKey.startsWith('sk-')) {
            console.log('🎨 Testing OpenAI API...');
            try {
                const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openaiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: "Say 'Health check OK' and nothing else." }],
                        max_tokens: 10
                    })
                });

                if (openaiResponse.ok) {
                    const result = await openaiResponse.json();
                    extendedHealth.tests.openaiTest = {
                        status: 'PASS',
                        response: result?.choices?.[0]?.message?.content || 'No response'
                    };
                    console.log('✅ OpenAI test passed');
                } else {
                    const errorText = await openaiResponse.text();
                    extendedHealth.tests.openaiTest = {
                        status: 'FAIL',
                        error: `HTTP ${openaiResponse.status}`,
                        details: errorText.substring(0, 200)
                    };
                    console.log('❌ OpenAI test failed:', openaiResponse.status);
                }
            } catch (openaiError) {
                extendedHealth.tests.openaiTest = {
                    status: 'ERROR',
                    error: openaiError.message
                };
                console.log('❌ OpenAI test error:', openaiError.message);
            }
        } else {
            extendedHealth.tests.openaiTest = {
                status: 'SKIP',
                reason: 'No valid OpenAI API key'
            };
        }

        // Test 3: Gemini API (text)
        if (geminiKey && geminiKey.length > 20) {
            console.log('💎 Testing Gemini API...');
            try {
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Say 'Health check OK' and nothing else."
                            }]
                        }]
                    })
                });

                if (geminiResponse.ok) {
                    const result = await geminiResponse.json();
                    extendedHealth.tests.geminiTest = {
                        status: 'PASS',
                        response: result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text'
                    };
                    console.log('✅ Gemini test passed');
                } else {
                    const errorText = await geminiResponse.text();
                    extendedHealth.tests.geminiTest = {
                        status: 'FAIL',
                        error: `HTTP ${geminiResponse.status}`,
                        details: errorText.substring(0, 200)
                    };
                    console.log('❌ Gemini test failed:', geminiResponse.status);
                }
            } catch (geminiError) {
                extendedHealth.tests.geminiTest = {
                    status: 'ERROR',
                    error: geminiError.message
                };
                console.log('❌ Gemini test error:', geminiError.message);
            }
        } else {
            extendedHealth.tests.geminiTest = {
                status: 'SKIP',
                reason: 'No valid Gemini API key'
            };
        }

        // Test 4: Gemini Image Generation (Imagen 3) - THE MAIN TEST
        if (geminiKey && geminiKey.length > 20) {
            console.log('🖼️ Testing Gemini Imagen 3 (YOUR CURRENT IMAGE GENERATOR)...');
            try {
                const imageStartTime = Date.now();
                const geminiImageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: "Simple test image: blue square on white background, minimalist art",
                        config: {
                            aspectRatio: "ASPECT_RATIO_1_1",
                            negativePrompt: "text, words, letters, typography, titles, signatures, logos",
                            sampleCount: 1
                        }
                    })
                });

                const imageResponseTime = Date.now() - imageStartTime;

                if (geminiImageResponse.ok) {
                    const result = await geminiImageResponse.json();
                    const hasImageData = !!(result?.generatedImages?.[0]?.bytesBase64Encoded);
                    const imageDataLength = hasImageData ? result.generatedImages[0].bytesBase64Encoded.length : 0;
                    
                    extendedHealth.tests.geminiImageTest = {
                        status: hasImageData ? 'PASS' : 'FAIL',
                        responseTime: imageResponseTime + 'ms',
                        imageDataLength: imageDataLength,
                        hasImageData: hasImageData,
                        message: hasImageData ? 'Image generation working!' : 'No image data returned'
                    };
                    console.log(`${hasImageData ? '✅' : '❌'} Gemini image generation test ${hasImageData ? 'passed' : 'failed'}`);
                } else {
                    const errorText = await geminiImageResponse.text();
                    let parsedError;
                    try {
                        parsedError = JSON.parse(errorText);
                    } catch {
                        parsedError = { message: errorText };
                    }
                    
                    extendedHealth.tests.geminiImageTest = {
                        status: 'FAIL',
                        error: `HTTP ${geminiImageResponse.status}`,
                        responseTime: imageResponseTime + 'ms',
                        details: parsedError,
                        rateLimited: geminiImageResponse.status === 429,
                        quotaExceeded: errorText.includes('quota') || errorText.includes('insufficient'),
                        invalidKey: geminiImageResponse.status === 401 || geminiImageResponse.status === 403,
                        needsImagenAccess: geminiImageResponse.status === 400 && errorText.includes('imagen')
                    };
                    console.log('❌ Gemini image generation test failed:', geminiImageResponse.status);
                }
            } catch (geminiImageError) {
                extendedHealth.tests.geminiImageTest = {
                    status: 'ERROR',
                    error: geminiImageError.message,
                    timeout: geminiImageError.name === 'AbortError'
                };
                console.log('❌ Gemini image generation test error:', geminiImageError.message);
            }
        } else {
            extendedHealth.tests.geminiImageTest = {
                status: 'SKIP',
                reason: 'No valid Gemini API key'
            };
        }

        console.log('🏁 Extended health check completed');
        return res.status(200).json(extendedHealth);
    }

    // Method not allowed
    res.status(405).json({ error: 'Method not allowed' });
}