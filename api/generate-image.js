// api/generate-image.js - Enhanced with AI Text vs Overlay Support
export default async function handler(req, res) {
  console.log('💎 === GEMINI IMAGE GENERATION WITH TEXT CONTROL START ===');
  
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

    const { visualElements = '', concept = {}, allowText = false } = req.body;
    
    console.log('🎯 Generation mode:', allowText ? 'AI Generated Text' : 'Professional Overlay Ready');
    
    // Create enhanced prompt based on text approach
    function createGeminiImagePrompt(concept, visualElements, allowText) {
      const decade = concept.decade || '1980s';
      const genre = concept.genre || 'cinematic';
      
      // Varied composition styles for different eras and themes
      const compositionStyles = [
        'movie poster artwork', 
        'cinematic poster composition',
        'film poster design',
        'movie promotional artwork',
        'theatrical poster illustration',
        'cinema poster art'
      ];
      
      // Random composition to avoid repetitive face-focused images
      const randomComposition = compositionStyles[Math.floor(Math.random() * compositionStyles.length)];
      
      // Enhanced style mapping with specific artistic techniques and mediums
      const styleMap = {
        '1950s': 'hand-painted movie poster artwork, gouache and watercolor technique, visible brush strokes, paper texture, analog illustration methods, painted on canvas or paper, warm color temperature, muted palette, artistic imperfections, traditional poster painting style',
        
        '1960s': 'silkscreen poster art, screen printing technique, bold flat colors, graphic design poster, mod art movement influence, high contrast imagery, pop art poster style, offset lithography printing effects, simplified forms, geometric composition',
        
        '1970s': 'airbrushed movie poster illustration, traditional airbrush technique, soft gradient transitions, painted artwork, analog illustration methods, earth tone palette, organic flowing forms, hand-painted poster art, visible paint texture',
        
        '1980s': 'painted movie poster montage, traditional illustration with acrylic paints, dramatic painted lighting effects, hand-painted character and scene elements, painted backgrounds, analog poster art techniques, vibrant painted colors, artistic brush work',
        
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
      
      // Composition variety prompts to avoid repetitive face-focused images
      const compositionVariety = [
        'Focus on atmospheric scene composition with varied visual elements',
        'Balance characters and environmental elements in the composition',
        'Create dynamic poster layout with multiple focal points',
        'Emphasize mood and atmosphere over single subject focus',
        'Design poster composition that tells a visual story',
        'Vary the compositional approach between characters, scenes, and symbolic elements'
      ];
      
      const randomCompositionHint = compositionVariety[Math.floor(Math.random() * compositionVariety.length)];
      
      // NEW: Different text handling based on allowText parameter
      let textInstructions = [];
      if (allowText) {
        // AI Generated Text Mode - Encourage natural movie poster text for 4:5 ratio
        textInstructions = [
          `MOVIE TITLE TO INCLUDE: "${concept.title}"`,
          `TAGLINE TO INCLUDE: "${concept.tagline || ''}"`,
          'Design for 4:5 aspect ratio - title at top third, credits at bottom',
          'Include movie title prominently in the upper portion (top 25% of image)',
          concept.tagline ? 'Include the tagline in smaller text below the title' : '',
          'Use authentic movie poster text layout adapted for 4:5 Instagram format',
          'Make text a natural integrated part of the poster design',
          'Text should follow professional movie poster conventions but fit 4:5 layout',
          `Typography should match ${decade} movie poster design standards`,
          'Include simplified billing credits in bottom 15% of image',
          'All text elements must be completely visible within the 4:5 frame',
          'Professional movie poster text hierarchy optimized for Instagram format',
          'Ensure title and credits have sufficient contrast against background',
          'Position all text to avoid cropping in 4:5 ratio'
        ];
        
        console.log('🤖 AI Generated Text Mode: Optimized for 4:5 Instagram ratio');
      } else {
        // Professional Overlay Mode - Prevent all text, optimized for 4:5 canvas overlay
        textInstructions = [
          'CRITICAL REQUIREMENT: Create pure visual artwork with absolutely no text, no words, no letters, no typography, no movie titles, no credits, no signatures anywhere in the image',
          'Image designed for 4:5 aspect ratio custom text overlay',
          'No text elements of any kind',
          'Pure visual composition without any written content',
          'Artwork should be designed to accommodate text overlay in 4:5 format',
          'Leave clear space in upper 25% for title overlay',
          'Leave clear space in bottom 15% for credits overlay',
          'Focus entirely on visual elements, characters, and atmosphere',
          'Composition optimized for Instagram 4:5 poster format'
        ];
        
        console.log('🎨 Professional Overlay Mode: 4:5 ratio ready for canvas overlay');
      }

      // Build the complete prompt with proper aspect ratio instructions
      const promptParts = [
        `Create a ${randomComposition} in authentic period style`,
        `${genre} film aesthetic specifically from the ${decade}`,
        'CRITICAL: 4:5 aspect ratio (portrait orientation, slightly taller than standard movie poster)',
        'Instagram-optimized dimensions - design for 1024x1280 pixel canvas',
        'Compose all elements to fit within the 4:5 frame without cropping',
        `ARTISTIC MEDIUM AND TECHNIQUE: ${styleHint}`,
        genreStyleHint,
        `PRODUCTION METHOD: ${productionHint}`,
        intensityLevel,
        visualElements,
        `COMPOSITION APPROACH: ${randomCompositionHint}`,
        ...textInstructions.filter(Boolean), // Remove empty strings
        'Professional concept art illustration matching the exact artistic techniques and visual aesthetics used in movie posters from this specific time period',
        'IMPORTANT: All text, titles, and credits must fit completely within the 4:5 frame',
        'Design layout specifically for Instagram poster format (4:5 ratio)',
        'Leave appropriate margins so nothing important gets cut off',
        'The image should authentically capture the artistic medium, production techniques, and visual aesthetics exactly as movie posters were created during this specific decade',
        'Focus on period-accurate artistic style, medium, and production techniques optimized for 4:5 aspect ratio'
      ].filter(Boolean);

      return promptParts.join('. ');
    }

    const prompt = createGeminiImagePrompt(concept, visualElements, allowText);
    console.log('🎯 Gemini image prompt (length: ' + prompt.length + ')');
    console.log('📝 Text mode:', allowText ? 'ALLOW TEXT' : 'PREVENT TEXT');

    // Use Gemini's generateContent with image generation request
    console.log('💎 Making Gemini generateContent call for image generation...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // Try Imagen 3 endpoint first for better aspect ratio control
    const useImagen = true; // Toggle this to test different endpoints

    let response;
    try {
      
      if (useImagen) {
        console.log('🎨 Using Imagen 3 endpoint for precise 4:5 ratio control...');
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            config: {
              aspectRatio: "ASPECT_RATIO_4_5", // Precise 4:5 ratio
              negativePrompt: allowText ? 
                "blurry, low quality, distorted text, illegible text, cut-off text, cropped titles, cropped credits, text outside frame" : 
                "text, words, letters, typography, titles, credits, signatures, logos, watermarks, writing",
              sampleCount: 1
            }
          }),
          signal: controller.signal
        });
      } else {
        console.log('🤖 Using Gemini 2.0 Flash with content generation...');
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
              temperature: allowText ? 0.8 : 0.7,
            }
          }),
          signal: controller.signal
        });
      }
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
    
    // Look for image content in the response - handle both Imagen and Gemini 2.0 formats
    let imageBase64;
    let imageWidth, imageHeight;
    
    if (useImagen) {
      // Imagen 3 response format
      if (result.generatedImages && result.generatedImages[0] && result.generatedImages[0].bytesBase64Encoded) {
        imageBase64 = result.generatedImages[0].bytesBase64Encoded;
        console.log('📦 Found image in Imagen 3 format');
      }
    } else {
      // Gemini 2.0 response format
      if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageBase64 = part.inlineData.data;
            console.log('📦 Found image in Gemini 2.0 inlineData format');
            break;
          }
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
    console.log('🔍 Image data length:', imageBase64.length);
    console.log('🎯 Text mode used:', allowText ? 'AI Generated' : 'Overlay Ready');
    console.log('💎 === GEMINI IMAGE GENERATION SUCCESS ===');

    return res.status(200).json({ 
      success: true, 
      imageUrl,
      generator: 'gemini-builtin-2.0',
      textMode: allowText ? 'ai-generated' : 'overlay-ready',
      concept: {
        title: concept.title,
        decade: concept.decade,
        genre: concept.genre
      }
    });

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Log the request details for debugging
    console.log('🔍 Debug info:');
    console.log('- allowText:', allowText);
    console.log('- concept title:', concept?.title);
    console.log('- visualElements length:', visualElements?.length);
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      debug: {
        allowText,
        hasGeminiKey: !!geminiKey,
        conceptTitle: concept?.title,
        visualElementsLength: visualElements?.length
      }
    });
  }
}