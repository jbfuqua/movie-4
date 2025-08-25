// api/generate-image.js - Using Gemini's Built-in Image Generation
export default async function handler(req, res) {
  console.log('💎 === GEMINI BUILT-IN IMAGE GENERATION START ===');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      console.error('❌ GEMINI_API_KEY missing');
      return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
    }

    const { visualElements = '', concept = {} } = req.body;
    
    // Create enhanced prompt for Gemini's built-in image generation
    function createGeminiImagePrompt(concept, visualElements) {
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
      
      const intensityLevel = concept.nod_theme ? 
        'intense dramatic atmosphere, dark cinematic mood, edgy visual style' : 
        'professional cinematic atmosphere';
      
      // Very explicit about no text
      const promptParts = [
        'Generate a movie poster character portrait artwork',
        `${genre} film aesthetic from the ${decade}`,
        styleHint,
        intensityLevel,
        visualElements,
        'Professional concept art illustration style',
        'Portrait orientation layout',
        'IMPORTANT: Create pure visual artwork with absolutely no text, no words, no letters, no typography, no movie titles, no credits, no signatures anywhere in the image',
        'The image should be clean artwork ready for separate text overlay to be added later',
        'Focus entirely on the visual design, character, and atmosphere without any written elements'
      ].filter(Boolean);

      return promptParts.join('. ');
    }

    const prompt = createGeminiImagePrompt(concept, visualElements);
    console.log('🎯 Gemini image prompt (length: ' + prompt.length + ')');

    // Use Gemini's generateContent with image generation request
    console.log('💎 Making Gemini generateContent call for image generation...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      // Use Gemini 2.0 Flash with image generation capability
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.7
          }
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch error:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: 'Network error: ' + fetchError.message
      });
    }

    clearTimeout(timeoutId);
    console.log('📡 Gemini response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `Gemini API error: ${response.status}`,
        details: errorText.substring(0, 300)
      });
    }

    const result = await response.json();
    console.log('✅ Gemini response parsed successfully');
    
    // Look for image content in the response
    let imageBase64;
    
    if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
          console.log('📦 Found image in inlineData format');
          break;
        }
      }
    }

    if (!imageBase64) {
      console.error('❌ No image data found in Gemini response');
      console.log('Response structure:', JSON.stringify(result, null, 2));
      return res.status(500).json({ 
        success: false, 
        error: 'Gemini returned no image data'
      });
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ Image generated successfully with Gemini built-in generation');
    console.log('📏 Image data length:', imageBase64.length);
    console.log('💎 === GEMINI IMAGE GENERATION SUCCESS ===');

    return res.status(200).json({ 
      success: true, 
      imageUrl,
      generator: 'gemini-builtin-2.0'
    });

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}