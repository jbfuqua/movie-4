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
      
      // Enhanced style mapping with specific artistic techniques and mediums
      const styleMap = {
        '1950s': 'hand-painted movie poster artwork, gouache and watercolor technique, visible brush strokes, paper texture, analog illustration methods, painted on canvas or paper, warm color temperature, muted palette, artistic imperfections, traditional poster painting style',
        
        '1960s': 'silkscreen poster art, screen printing technique, bold flat colors, graphic design poster, mod art movement influence, high contrast imagery, pop art poster style, offset lithography printing effects, simplified forms, geometric composition',
        
        '1970s': 'airbrushed movie poster illustration, traditional airbrush technique, soft gradient transitions, painted artwork, analog illustration methods, earth tone palette, organic flowing forms, hand-painted poster art, visible paint texture',
        
        '1980s': 'painted movie poster montage, traditional illustration with acrylic paints, dramatic painted lighting effects, hand-painted character portraits, painted backgrounds, analog poster art techniques, vibrant painted colors, artistic brush work',
        
        '1990s': 'early digital composite poster, Photoshop 3.0 era techniques, scanned painted elements, digital photo manipulation, hybrid analog-digital artwork, painted base with digital effects, early computer graphics integration',
        
        '2000s': 'digital movie poster design, advanced Photoshop techniques, digital painting and photo manipulation, clean digital composition, digital art software, computer-generated poster design, digital brush techniques',
        
        '2010s': 'contemporary digital poster art, modern digital painting software, high-resolution digital artwork, sophisticated digital composition techniques, modern computer graphics, digital illustration methods',
        
        '2020s': 'cutting-edge digital poster design, advanced digital art techniques, modern CGI integration, contemporary digital painting methods, state-of-the-art digital composition, photorealistic digital rendering'
      };

      const styleHint = styleMap[decade] || styleMap['1980s'];
      
      // Add genre-specific stylistic enhancements
      const genreStyleModifiers = {
        'Horror': decade <= '1970s' ? 'gothic painted illustration, dark romantic painting style, traditional horror poster painting' : 
                 decade <= '1990s' ? 'painted horror artwork, dramatic painted shadows, traditional illustration' :
                 'digital horror composition, modern digital painting techniques',
        
        'Sci-Fi': decade <= '1970s' ? 'retro-futuristic painted artwork, traditional sci-fi illustration, painted space art' :
                 decade <= '1990s' ? 'painted sci-fi poster, illustrated futuristic elements, traditional artwork' :
                 'digital sci-fi poster design, modern digital painting, CGI-inspired artwork',
        
        'Fusion': decade <= '1980s' ? 'painted horror-sci-fi artwork, traditional mixed genre illustration' :
                  'digital horror-sci-fi composition, modern mixed genre poster design'
      };

      const genreStyleHint = genreStyleModifiers[concept.genre] || '';
      
      const intensityLevel = concept.nod_theme ? 
        'intense dramatic atmosphere, dark cinematic mood, edgy visual style' : 
        'professional cinematic atmosphere';

      // Production technique emphasis based on era
      const productionEmphasis = {
        '1950s': 'Traditional hand-painted poster created with brushes and paint, analog artistic methods only',
        '1960s': 'Screen-printed poster design, graphic design printing techniques, no digital elements',
        '1970s': 'Airbrush illustration techniques, traditional painted artwork, analog poster production',
        '1980s': 'Hand-painted movie poster, traditional painting techniques with brushes and paint',
        '1990s': 'Early digital-analog hybrid, scanned painted elements combined digitally',
        '2000s': 'Digital poster design created with computer software, digital painting techniques',
        '2010s': 'Modern digital artwork, contemporary digital illustration methods',
        '2020s': 'Advanced digital poster design, cutting-edge digital art techniques'
      };

      const productionHint = productionEmphasis[decade] || productionEmphasis['1980s'];
      
      // Very explicit about no text with enhanced style instructions
      const promptParts = [
        'Create a movie poster character portrait in authentic period style',
        `${genre} film aesthetic specifically from the ${decade}`,
        `ARTISTIC MEDIUM AND TECHNIQUE: ${styleHint}`,
        genreStyleHint,
        `PRODUCTION METHOD: ${productionHint}`,
        intensityLevel,
        visualElements,
        'Professional concept art illustration matching the exact artistic techniques and visual aesthetics used in movie posters from this specific time period',
        'Portrait orientation layout',
        'CRITICAL REQUIREMENT: Create pure visual artwork with absolutely no text, no words, no letters, no typography, no movie titles, no credits, no signatures anywhere in the image',
        'The image should authentically capture the artistic medium, production techniques, and visual aesthetics exactly as movie posters were created during this specific decade',
        'Focus on period-accurate artistic style, medium, and production techniques rather than just costume and props'
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