// api/generate-image.js - Fixed Gemini Imagen API Implementation
export default async function handler(req, res) {
  console.log('💎 === GEMINI IMAGEN GENERATION START ===');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    // Check for Gemini API key
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    console.log('🔑 API Key check:', {
      exists: !!geminiKey,
      length: geminiKey ? geminiKey.length : 0,
      startsWithAIza: geminiKey ? geminiKey.startsWith('AIza') : false
    });
    
    if (!geminiKey) {
      console.error('❌ GEMINI_API_KEY missing');
      return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    // Parse request body
    const { visualElements = '', concept = {} } = req.body;
    
    console.log('📋 Request params:', { 
      hasVisualElements: !!visualElements, 
      hasConceptTitle: !!concept.title,
      decade: concept.decade,
      genre: concept.genre,
      nodTheme: concept.nod_theme
    });

    // Create Imagen-optimized prompt
    function createImagenPrompt(concept, visualElements) {
      const decade = concept.decade || '1980s';
      const genre = concept.genre || 'cinematic';
      
      const styleMap = {
        '1950s': 'vintage movie poster style, hand-painted artwork, warm color palette',
        '1960s': 'retro 60s poster design, bold geometric shapes, pop art influence',
        '1970s': 'airbrushed 70s movie poster, soft gradients, earth tones',
        '1980s': 'neon-lit 80s movie poster, dramatic shadows, vibrant colors',
        '1990s': 'digital 90s movie poster, photorealistic details, modern style',
        '2000s': 'polished digital artwork, clean composition',
        '2010s': 'minimalist poster design, contemporary aesthetics',
        '2020s': 'modern digital painting, atmospheric lighting'
      };

      const styleHint = styleMap[decade] || styleMap['1980s'];
      
      // Handle hardcore mode
      const intensityLevel = concept.nod_theme ? 
        'intense dramatic atmosphere, dark cinematic mood, edgy visual style' : 
        'professional cinematic atmosphere';
      
      // Imagen responds well to clear, descriptive prompts
      const promptParts = [
        'Movie poster character portrait',
        `${genre} film aesthetic from the ${decade}`,
        styleHint,
        intensityLevel,
        visualElements,
        'Professional concept art illustration',
        'Portrait orientation',
        'No text, no words, no letters, no typography anywhere in the image'
      ].filter(Boolean);

      return promptParts.join(', ');
    }

    const prompt = createImagenPrompt(concept, visualElements);
    console.log('🎯 Imagen prompt (length: ' + prompt.length + ')');
    console.log('🎯 Prompt preview:', prompt.substring(0, 150) + '...');

    // CORRECTED: Using the right endpoint and payload structure from OpenAI's recommendation
    console.log('💎 Making Gemini Imagen API call with correct format...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout triggered');
      controller.abort();
    }, 60000); // 60 second timeout

    let response;
    try {
      // FIXED: Use correct model and endpoint format
      const model = 'imagen-3.0-generate-002'; // Updated model name
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${geminiKey}`;
      
      // FIXED: Use correct payload structure
      const body = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          // Add negative prompt in parameters
          negativePrompt: "text, words, letters, typography, titles, credits, signatures, logos, watermarks, captions, movie titles, names, writing, script, alphabet"
        }
      };

      console.log('📤 Making request to:', url);
      console.log('📤 Request body:', JSON.stringify(body, null, 2));

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ 
          success: false, 
          error: 'Request timeout - Imagen API took too long'
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Network error: ' + fetchError.message
      });
    }

    clearTimeout(timeoutId);
    console.log('📡 Gemini response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('❌ Gemini API error body:', errorText);
      } catch {
        errorText = 'Could not read error response';
      }
      
      console.error('❌ Gemini API error:', response.status, response.statusText);
      
      // Provide specific error guidance
      let errorGuidance = '';
      if (response.status === 400) {
        if (errorText.includes('MODEL_NOT_FOUND') || errorText.includes('imagen')) {
          errorGuidance = 'Model not found. Try enabling Vertex AI API in Google Cloud Console.';
        } else if (errorText.includes('quota') || errorText.includes('exceeded')) {
          errorGuidance = 'API quota exceeded. Check your Google Cloud billing and quotas.';
        } else {
          errorGuidance = 'Invalid request format or blocked content.';
        }
      } else if (response.status === 401 || response.status === 403) {
        errorGuidance = 'Authentication failed. Check your API key and enable required APIs.';
      } else if (response.status === 404) {
        errorGuidance = 'Model endpoint not found. Make sure Vertex AI API is enabled and the model is available in your region.';
      } else if (response.status === 429) {
        errorGuidance = 'Rate limited. Try again in a moment.';
      }
      
      return res.status(response.status).json({ 
        success: false, 
        error: `Gemini API error: ${response.status}`,
        details: errorText.substring(0, 300),
        guidance: errorGuidance
      });
    }

    console.log('🔧 Parsing Gemini response...');
    
    let result;
    try {
      result = await response.json();
      console.log('✅ Gemini response parsed successfully');
      console.log('📦 Response structure:', {
        hasPredictions: 'predictions' in result,
        hasGeneratedImages: 'generatedImages' in result,
        hasError: 'error' in result,
        keys: Object.keys(result)
      });
    } catch (jsonError) {
      console.error('❌ Failed to parse Gemini response as JSON:', jsonError);
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid response from Gemini API'
      });
    }

    // Check for API error in response
    if (result.error) {
      console.error('❌ Gemini API returned error:', result.error);
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini API error: ' + result.error.message,
        details: result.error
      });
    }

    // FIXED: Parse both possible response shapes as recommended by OpenAI
    let imageBase64;
    
    if (Array.isArray(result.predictions) && result.predictions[0]?.bytesBase64Encoded) {
      // REST API shape: predictions[].bytesBase64Encoded
      imageBase64 = result.predictions[0].bytesBase64Encoded;
      console.log('📦 Found image in predictions format');
    } else if (Array.isArray(result.generatedImages) && result.generatedImages[0]?.image?.imageBytes) {
      // SDK shape: generatedImages[].image.imageBytes
      imageBase64 = result.generatedImages[0].image.imageBytes;
      console.log('📦 Found image in generatedImages format');
    } else if (Array.isArray(result.generatedImages) && result.generatedImages[0]?.bytesBase64Encoded) {
      // Alternative shape: generatedImages[].bytesBase64Encoded
      imageBase64 = result.generatedImages[0].bytesBase64Encoded;
      console.log('📦 Found image in alternative generatedImages format');
    } else {
      console.error('❌ Unexpected Imagen response shape');
      console.log('Full response:', JSON.stringify(result, null, 2));
      return res.status(500).json({ 
        success: false, 
        error: 'Unexpected Imagen response shape',
        details: 'Image data not found in expected locations'
      });
    }

    if (!imageBase64) {
      console.error('❌ No image data found');
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini returned no image data'
      });
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ Image generated successfully with Gemini Imagen');
    console.log('📏 Image data length:', imageBase64.length);
    console.log('💎 === GEMINI IMAGEN GENERATION SUCCESS ===');

    return res.status(200).json({ 
      success: true, 
      imageUrl,
      generator: 'gemini-imagen-3'
    });

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      stack: error.stack?.split('\n')[0]
    });
  }
}