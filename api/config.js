// api/config.js - Enhanced Environment Configuration for Vercel
export function getApiKeys() {
    console.log('🔧 Loading API keys...');
    console.log('Environment:', process.env.VERCEL_ENV || 'local');
    
    // Multiple ways to get the API keys with Vercel-specific handling
    const anthropicKey = 
        process.env.ANTHROPIC_API_KEY || 
        process.env.anthropic_api_key ||
        process.env.ANTHROPIC_KEY ||
        process.env.CLAUDE_API_KEY; // Alternative name some people use
        
    const openaiKey = 
        process.env.OPENAI_API_KEY || 
        process.env.openai_api_key ||
        process.env.OPENAI_KEY;
    
    // Debug logging (safe - doesn't expose full keys)
    console.log('🔍 Environment variable check:');
    console.log('- Total env vars:', Object.keys(process.env).length);
    console.log('- Anthropic key exists:', !!anthropicKey);
    console.log('- Anthropic key length:', anthropicKey ? anthropicKey.length : 0);
    console.log('- OpenAI key exists:', !!openaiKey);
    console.log('- OpenAI key length:', openaiKey ? openaiKey.length : 0);
    
    // List all environment variables that might be relevant (for debugging)
    const allEnvKeys = Object.keys(process.env);
    const anthropicRelated = allEnvKeys.filter(key => 
        key.toLowerCase().includes('anthropic') || 
        key.toLowerCase().includes('claude')
    );
    const openaiRelated = allEnvKeys.filter(key => 
        key.toLowerCase().includes('openai') || 
        key.toLowerCase().includes('gpt')
    );
    
    console.log('- Anthropic-related env vars:', anthropicRelated);
    console.log('- OpenAI-related env vars:', openaiRelated);
    
    // Validation with helpful messages
    if (!anthropicKey) {
        console.error('❌ Anthropic API key missing from environment');
        console.log('💡 Make sure ANTHROPIC_API_KEY is set in your Vercel environment variables');
        console.log('💡 Available Anthropic-related keys:', anthropicRelated);
    } else {
        console.log('✅ Anthropic API key loaded successfully');
    }
    
    if (!openaiKey) {
        console.error('❌ OpenAI API key missing from environment');
        console.log('💡 Make sure OPENAI_API_KEY is set in your Vercel environment variables');
        console.log('💡 Available OpenAI-related keys:', openaiRelated);
    } else {
        console.log('✅ OpenAI API key loaded successfully');
    }
    
    // Vercel-specific checks
    if (process.env.VERCEL) {
        console.log('🚀 Running on Vercel');
        console.log('- Region:', process.env.VERCEL_REGION || 'unknown');
        console.log('- Environment:', process.env.VERCEL_ENV || 'unknown');
    } else {
        console.log('🏠 Running locally');
    }
    
    return {
        anthropicKey,
        openaiKey,
        hasAnthropic: !!anthropicKey,
        hasOpenAI: !!openaiKey,
        environment: process.env.VERCEL_ENV || 'local',
        region: process.env.VERCEL_REGION || 'local'
    };
}

// Helper function to validate API keys format
export function validateApiKeys() {
    const { anthropicKey, openaiKey } = getApiKeys();
    
    const validation = {
        anthropic: {
            exists: !!anthropicKey,
            validFormat: anthropicKey ? anthropicKey.startsWith('sk-ant-') : false,
            length: anthropicKey ? anthropicKey.length : 0
        },
        openai: {
            exists: !!openaiKey,
            validFormat: openaiKey ? openaiKey.startsWith('sk-') : false,
            length: openaiKey ? openaiKey.length : 0
        }
    };
    
    console.log('🔐 API Key Validation:', validation);
    return validation;
}