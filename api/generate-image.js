// api/generate-image.js - Using Gemini's Built-in Image Generation
export default async function handler(req, res) {
  console.log('💎 === IMAGEN 3 IMAGE GENERATION START ===');
  
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

    const { visualElements = '', concept = {}, artStyle = 'authentic' } = req.body;
    
    // Create enhanced prompt for Gemini's built-in image generation
    function createGeminiImagePrompt(concept, visualElements, artStyle) {
      const decade = concept.decade || '1980s';
      const genre = concept.genre || 'cinematic';
      
      const decadeStyleMap = {
        '1950s': 'hand-painted lithograph print style, rich saturated Technicolor palette, dramatic pulp illustration, subtle film grain, inspired by Saul Bass',
        '1960s': 'psychedelic art influence, bold and minimalist design, high-contrast graphics, pop-art aesthetic, vintage film poster feel', 
        '1970s': 'gritty realism, heavy film grain, photorealistic airbrushed art, desaturated and earthy color palette, cinematic photography from the era',
        '1980s': 'vibrant neon-noir aesthetic, airbrushed chrome and lens flares, dramatic high-contrast lighting, iconic 80s movie poster art by Drew Struzan',
        '1990s': 'grunge aesthetic, high-contrast photography with a moody feel, early digital compositing look, often featuring floating heads or bold typography-free compositions',
        '2000s': 'sleek digital look, bleach bypass color effect, high-contrast with cool blue and orange color grading, modern cinematic feel',
        '2010s': 'clean, crisp digital photography, strong and moody color grading, minimalist and atmospheric composition, high-end cinematic poster',
        '2020s': 'hyper-realistic digital painting, atmospheric and textured lighting, modern cinematic quality with impeccable detail, visually striking composition'
      };

      const artStyleMap = {
        'b-movie': 'exaggerated B-movie poster style, pulpy, lurid colors, intentionally dramatic and over-the-top',
        'photo': 'hyper-realistic modern photographic style, shot on a high-end camera, sharp focus, cinematic lighting',
        'painted': 'classic painted movie poster style, rich brushstrokes, visible canvas texture, artistic interpretation',
        'authentic': '' // Let the decade style map handle it
      };

      const styleHint = decadeStyleMap[decade] || decadeStyleMap['1980s'];
      const artStyleHint = artStyleMap[artStyle] || '';
      
      const intensityLevel = concept.nod_theme ? 
        'intense dramatic atmosphere, dark cinematic mood, edgy visual style' : 
        'professional cinematic atmosphere';
      
      const promptParts = [
        'Generate a movie poster character portrait artwork',
        `${genre} film aesthetic from the ${decade}`,
        styleHint,
        artStyleHint,
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

    const prompt = createGeminiImagePrompt(concept, visualElements, artStyle);
    console.log('🎯 Imagen 3 prompt (length: ' + prompt.length + ')');
    
    console.log('🖼️ Making Imagen 3 API call...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      // CORRECTED: Use the dedicated Imagen 3 endpoint and payload structure
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          config: {
            // Match the canvas aspect ratio (1024x1280)
            aspectRatio: "ASPECT_RATIO_4_5",
            sampleCount: 1
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
    console.log('📡 Imagen response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Imagen API error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `Gemini API error: ${response.status}`,
        details: errorText.substring(0, 500) // Increased detail length
      });
    }

    const result = await response.json();
    console.log('✅ Imagen response parsed successfully');
    
    // CORRECTED: Parse the response from the Imagen endpoint
    const imageBase64 = result?.generatedImages?.[0]?.bytesBase64Encoded;

    if (!imageBase64) {
      console.error('❌ No image data found in Imagen response');
      console.log('Response structure:', JSON.stringify(result, null, 2));
      return res.status(500).json({ 
        success: false, 
        error: 'Imagen model returned no image data'
      });
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ Image generated successfully with Imagen 3');
    console.log('📏 Image data length:', imageBase64.length);
    console.log('💎 === IMAGEN 3 IMAGE GENERATION SUCCESS ===');

    return res.status(200).json({ 
      success: true, 
      imageUrl,
      generator: 'imagen-3.0'
    });

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error'
    });
  }
}