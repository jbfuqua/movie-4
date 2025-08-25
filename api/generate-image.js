// api/generate-image.js - Fixed for Vercel deployment
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  console.log('🎨 generate-image called');

  try {
    // Check API key first
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('❌ OPENAI_API_KEY missing');
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
    }

    // Parse request body safely
    let requestBody;
    try {
      requestBody = req.body || {};
    } catch (bodyError) {
      console.error('❌ Request body parsing failed:', bodyError);
      return res.status(400).json({ success: false, error: 'Invalid request body' });
    }

    const { visualElements = '', concept = {} } = requestBody;

    console.log('📋 Request params:', { 
      hasVisualElements: !!visualElements, 
      hasConceptTitle: !!concept.title,
      decade: concept.decade,
      genre: concept.genre,
      nodTheme: concept.nod_theme
    });

    const styleHintsByEra = {
      '1950s': 'hand-painted lithograph, gouache wash, visible brush strokes, offset misregistration, canvas tooth, fold wear',
      '1960s': 'silkscreen print, bold mod shapes, halftone dot pattern, slight ink bleed',
      '1970s': 'airbrushed illustration, matte texture, paper aging, fold marks',
      '1980s': 'painted montage with chrome gradients, bloom highlights, VHS scanlines',
      '1990s': 'studio photo-composite, subtle grain, subdued palette',
      '2000s': 'digital composite, clean gradients',
      '2010s': 'minimalist photographic art, negative space',
      '2020s': 'contemporary digital HDR, refined grading'
    };

    const renderStyleMap = {
      'hand-painted lithograph': 'hand-painted lithograph, gouache wash',
      'silkscreen halftone': 'silkscreen print, halftone texture',
      'airbrushed illustration': 'airbrushed retro paint style',
      'painted montage': 'painted character montage, layered composition',
      'studio photo-composite': 'studio photographic composite, pro lighting',
      'digital composite': 'modern digital composite'
    };

    function createOptimizedPrompt(concept, visualElements) {
      const decade = concept.decade || '1980s';
      const eraMedium = styleHintsByEra[decade] || styleHintsByEra['1980s'];
      const declaredStyle = (concept.render_style && renderStyleMap[concept.render_style])
        ? renderStyleMap[concept.render_style] : '';

      const nodBias = concept.nod_theme
        ? 'odd surrealism, uncanny symmetry, dreamlike atmosphere, painterly strangeness (PG-13)'
        : '';

      const cleanedElements = String(visualElements || '');

      // STRONGEST TEXT PREVENTION - AVOID "POSTER" ENTIRELY
      const textPreventionInstructions = [
        'CHARACTER PORTRAIT CONCEPT ART ONLY',
        'film development artwork without any text elements',
        'clean character illustration for design purposes',
        'concept art study - no typography or written words',
        'visual development art - text overlay will be added later',
        'portrait study for film production, no embedded text'
      ].join('. ');

      const promptParts = [
        textPreventionInstructions,
        `Professional character portrait study for ${concept.genre || 'cinematic'} film in ${decade} style.`,
        'Film development **concept art, character/environment reference only (no titles or credits).**',
        'Character-focused artwork study, not marketing material.',
        declaredStyle || eraMedium,
        cleanedElements,
        nodBias,
        'Character study illustration, film production art, PG-13',
		'Absolutely no text, titles, names, signatures, letters, logos, or credits inside the image.'
      ].filter(Boolean);

      return promptParts.join(' ');
    }

    const prompt = createOptimizedPrompt(concept, visualElements);
    console.log('🎯 Generated prompt (length: ' + prompt.length + ')');

    // Retry logic with exponential backoff
    async function callOpenAIImageGen(attempt = 1) {
      console.log(`🤖 Calling OpenAI (attempt ${attempt})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 OpenAI response status:', response.status);

        if (!response.ok) {
          const errText = await response.text();
          console.error('❌ OpenAI API error:', response.status, errText);
          
          if (attempt < 3 && (response.status === 500 || response.status === 502 || response.status === 503)) {
            const wait = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
            console.warn(`⚠️ Retrying in ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
            return callOpenAIImageGen(attempt + 1);
          }
          
          throw new Error(`OpenAI API error ${response.status}: ${errText}`);
        }

        const result = await response.json();
        console.log('📦 OpenAI response parsed successfully');

        if (!result?.data?.[0]?.b64_json) {
          throw new Error("OpenAI returned no image data (empty b64_json)");
        }

        const imageUrl = `data:image/png;base64,${result.data[0].b64_json}`;
        console.log('✅ Image generated successfully (length: ' + imageUrl.length + ')');
        return imageUrl;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request timeout');
          if (attempt < 3) {
            console.log(`⚠️ Retrying after timeout (attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, 2000));
            return callOpenAIImageGen(attempt + 1);
          }
          throw new Error('Request timeout after multiple attempts');
        }
        
        console.error('❌ Fetch error:', fetchError);
        throw fetchError;
      }
    }

    const imageUrl = await callOpenAIImageGen();

    return res.status(200).json({ success: true, imageUrl });

  } catch (error) {
    console.error('❌ Critical error in generate-image:', error);
    console.error('Stack:', error.stack);
    
    // Return helpful error messages
    let errorMessage = 'Unknown error occurred';
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    } else if (error.message.includes('API key')) {
      errorMessage = 'API configuration error';
    } else if (error.message.includes('OpenAI')) {
      errorMessage = 'Image generation service error - please try again';
    } else {
      errorMessage = error.message || 'Unknown error';
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}