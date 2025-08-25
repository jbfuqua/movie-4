// api/generate-image.js - Corrected Gemini Imagen API Implementation
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

    // Create Imagen-optimized prompt (based on official docs)
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
        'No text, no words, no letters anywhere in the image'
      ].filter(Boolean);

      return promptParts.join(', ');
    }

    const prompt = createImagenPrompt(concept, visualElements);
    console.log('🎯 Imagen prompt (length: ' + prompt.length + ')');
    console.log('🎯 Prompt preview:', prompt.substring(0, 150) + '...');

    // Call Gemini Imagen API using the CORRECT endpoint from docs
    console.log('💎 Making Gemini Imagen API call...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout triggered');
      controller.abort();
    }, 60000); // 60 second timeout (Imagen can be slow)

    let response;
    try {
      // CORRECTED: Using the right model name from the official docs
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          config: {
            aspectRatio: "ASPECT_RATIO_1_1", // Square format
            negativePrompt: "text, words, letters, typography, titles, credits, signatures, logos, watermarks, captions, movie titles, names, writing, script, alphabet",
            sampleCount: 1,
            seed: Math.floor(Math.random() * 1000000), // Random seed for variety
            // Add safety settings to prevent content blocking
            safetySettings: [
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_ONLY_HIGH"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT", 
                threshold: "BLOCK_ONLY_HIGH"
              }
            ]
          }
        }),
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
      
      // Provide specific error guidance based on official docs
      let errorGuidance = '';
      if (response.status === 400) {
        if (errorText.includes('MODEL_NOT_FOUND') || errorText.includes('imagen')) {
          errorGuidance = 'Imagen API may not be enabled for your project. Enable Vertex AI API in Google Cloud Console.';
        } else if (errorText.includes('quota') || errorText.includes('exceeded')) {
          errorGuidance = 'API quota exceeded. Check your Google Cloud billing and quotas.';
        } else {
          errorGuidance = 'Invalid request format or blocked content.';
        }
      } else if (response.status === 401 || response.status === 403) {
        errorGuidance = 'Authentication failed. Check your API key and make sure Imagen API is enabled.';
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
        hasGeneratedImages: 'generatedImages' in result,
        imageCount: result.generatedImages ? result.generatedImages.length : 0,
        firstImageKeys: result.generatedImages && result.generatedImages[0] ? Object.keys(result.generatedImages[0]) : [],
        hasError: 'error' in result
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

    if (!result?.generatedImages?.[0]?.bytesBase64Encoded) {
      console.error('❌ No image data in Gemini response');
      console.log('Full response:', JSON.stringify(result, null, 2));
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini returned no image data',
        details: 'bytesBase64Encoded field missing from response'
      });
    }

    const imageBase64 = result.generatedImages[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ Image generated successfully with Gemini Imagen 3');
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
      stack: error.stack?.split('\n')[0] // First line of stack trace for debugging
    });
  }
}