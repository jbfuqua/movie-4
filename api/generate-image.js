// api/generate-image-gemini.js - Gemini Imagen 3 Implementation
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  console.log('🎨 generate-image-gemini called');

  try {
    // Check for Gemini API key
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      console.error('❌ GEMINI_API_KEY missing');
      return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    const { visualElements = '', concept = {} } = req.body;
    
    console.log('📋 Request params:', { 
      hasVisualElements: !!visualElements, 
      hasConceptTitle: !!concept.title,
      decade: concept.decade,
      genre: concept.genre,
      nodTheme: concept.nod_theme
    });

    // Imagen 3 works better with cleaner, more direct prompts
    function createImagenPrompt(concept, visualElements) {
      const decade = concept.decade || '1980s';
      const genre = concept.genre || 'cinematic';
      
      const styleMap = {
        '1950s': 'vintage painted portrait style with warm color palette',
        '1960s': 'retro illustration with bold geometric shapes and pop art influence',
        '1970s': 'airbrushed painting with soft gradients and earthy tones',
        '1980s': 'neon-lit cinematic portrait with dramatic shadows and vibrant colors',
        '1990s': 'digital matte painting with photorealistic details',
        '2000s': 'polished digital artwork with clean composition',
        '2010s': 'minimalist portrait with negative space and contemporary aesthetics',
        '2020s': 'modern digital painting with atmospheric lighting'
      };

      const styleHint = styleMap[decade] || styleMap['1980s'];
      
      // Imagen 3 responds well to art-focused language
      const promptParts = [
        'Portrait painting of a character',
        `${genre} film aesthetic from the ${decade}`,
        styleHint,
        visualElements,
        'Professional concept art illustration',
        'No text, no words, no letters anywhere in the image'
      ].filter(Boolean);

      return promptParts.join(', ');
    }

    const prompt = createImagenPrompt(concept, visualElements);
    console.log('🎯 Imagen prompt:', prompt);

    // Call Gemini API with Imagen 3
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          aspectRatio: "ASPECT_RATIO_1_1", // Square format like DALL-E
          negativePrompt: "text, words, letters, typography, titles, credits, signatures, logos, watermarks, captions",
          sampleCount: 1
        }
      })
    });

    console.log('📡 Gemini response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return res.status(500).json({ success: false, error: `Gemini API error: ${response.status}` });
    }

    const result = await response.json();
    
    // Gemini returns images differently than OpenAI
    if (!result.generatedImages || !result.generatedImages[0]) {
      console.error('❌ No image data in Gemini response');
      return res.status(500).json({ success: false, error: 'No image generated' });
    }

    // Gemini returns base64 directly
    const imageBase64 = result.generatedImages[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ Imagen 3 image generated successfully');
    return res.status(200).json({ success: true, imageUrl });

  } catch (error) {
    console.error('❌ Critical error in generate-image-gemini:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    });
  }
}

// Alternative: Hybrid approach using both generators
// api/generate-image-hybrid.js
export default async function handler(req, res) {
  // CORS setup...
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const { visualElements = '', concept = {}, preferredGenerator = 'gemini' } = req.body;
  
  // Try Gemini first (better for text-free), fallback to OpenAI
  if (preferredGenerator === 'gemini' && geminiKey) {
    try {
      const geminiResult = await generateWithGemini(concept, visualElements, geminiKey);
      return res.status(200).json({ success: true, imageUrl: geminiResult, generator: 'gemini' });
    } catch (geminiError) {
      console.warn('⚠️ Gemini failed, trying OpenAI...', geminiError.message);
      if (openaiKey) {
        const openaiResult = await generateWithOpenAI(concept, visualElements, openaiKey);
        return res.status(200).json({ success: true, imageUrl: openaiResult, generator: 'openai' });
      }
    }
  }
  
  return res.status(500).json({ success: false, error: 'No available image generators' });
}

async function generateWithGemini(concept, visualElements, apiKey) {
  const prompt = `Portrait of character, ${concept.genre} ${concept.decade} aesthetic, ${visualElements}, concept art painting, no text`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      config: {
        aspectRatio: "ASPECT_RATIO_1_1",
        negativePrompt: "text, words, letters, typography, titles, signatures, logos",
        sampleCount: 1
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini failed: ${response.status}`);
  
  const result = await response.json();
  return `data:image/png;base64,${result.generatedImages[0].bytesBase64Encoded}`;
}

async function generateWithOpenAI(concept, visualElements, apiKey) {
  // Your existing OpenAI logic here
  const prompt = `Character portrait, ${visualElements}, no text`;
  
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  if (!response.ok) throw new Error(`OpenAI failed: ${response.status}`);
  
  const result = await response.json();
  return `data:image/png;base64,${result.data[0].b64_json}`;
}