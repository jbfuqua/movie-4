// api/generate-concept.js - Fixed with comprehensive error handling
import { getApiKeys } from './config.js';

export default async function handler(req, res) {
    // CORS & security headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    console.log('🎬 generate-concept called');

    try {
        // Check if config module exists
        let apiKeys;
        try {
            apiKeys = getApiKeys();
            console.log('✅ Config loaded successfully');
        } catch (configError) {
            console.error('❌ Config loading failed:', configError);
            // Fallback to direct env access
            apiKeys = {
                anthropicKey: process.env.ANTHROPIC_API_KEY,
                hasAnthropic: !!process.env.ANTHROPIC_API_KEY
            };
        }

        const { anthropicKey, hasAnthropic } = apiKeys;
        console.log('🔑 API Keys status:', { hasAnthropic });

        // Parse request body safely
        let requestBody;
        try {
            requestBody = req.body || {};
        } catch (bodyError) {
            console.error('❌ Request body parsing failed:', bodyError);
            requestBody = {};
        }

        const { genreFilter = 'any', eraFilter = 'any', nodTheme = false } = requestBody;
        const safeNodTheme = !!nodTheme;

        console.log('📋 Request params:', { genreFilter, eraFilter, nodTheme: safeNodTheme });

        // Genre mapping
        const genreMap = {
            'horror': '"Horror"',
            'sci-fi': '"Sci-Fi"',
            'fusion': 'a tasteful fusion of Horror and Sci-Fi'
        };

        const decades = ['1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];
        const forceRandomDecade = eraFilter === 'any' ? decades[Math.floor(Math.random() * decades.length)] : eraFilter;

        const creativeThemes = [
            'time manipulation','parallel dimensions','artificial consciousness','genetic memories',
            'color psychology','mathematical nightmares','botanical mutations','memory trading',
            'gravity anomalies','digital archaeology','weather manipulation','architectural haunting',
            'crystalline entities','quantum entanglement','molecular dissolution','temporal echoes',
            'geometric demons','photographic souls','magnetic personalities','elastic reality',
            'transparent beings','living architecture','cosmic dread','eldritch signals',
            'body horror metamorphosis (non-graphic)','occult conspiracies (non-graphic)',
            'witch covens (implied)','alien first contact','robotic uprising (PG-13)',
            'mind uploading','cryogenic revival','space colonies','virtual realities',
            'bioengineered viruses (non-graphic)','energy beings','mirror dimension bleeding (abstract)',
            'emotional parasites (metaphoric)','dream archaeology','liquid shadows (lighting motif)',
            'paper-thin realities','dimensional doorways','bone libraries (symbolic)'
        ];
        
        const forceTheme = creativeThemes[Math.floor(Math.random() * creativeThemes.length)];
        const seed = Date.now() % 100000;

        console.log('🎯 Generation parameters:', { forceRandomDecade, forceTheme, seed });

        // Build the JSON-only prompt
        const genreConstraint = genreFilter === 'any' 
            ? 'MUST be Horror or Sci-Fi (or fusion)' 
            : `MUST be ${genreMap[genreFilter]}`;

        const prompt = `You are a film art director. Produce ONLY valid JSON. No prose.

Constraints:
- Era MUST be "${forceRandomDecade}"
- Genre ${genreConstraint}
- Creative seed: "${forceTheme}"
- Avoid banned title words: Dark, Shadow, Night, Blood, Death, Steel, Cross, Stone
- Keep PG-13 implication (no graphic detail)
- Add render_style: era-true medium ("hand-painted lithograph" | "silkscreen halftone" | "airbrushed illustration" | "painted montage" | "studio photo-composite" | "digital composite")

Return JSON:
{
  "title": "Short original title",
  "tagline": "Atmospheric one-liner",
  "decade": "${forceRandomDecade}",
  "genre": "Horror|Sci-Fi|Fusion",
  "synopsis": "1–2 sentences",
  "visual_spec": {
    "subgenre": "...",
    "palette": ["#hex","#hex","#hex"],
    "camera": {"shot":"...","lens":"...","depth_of_field":"..."},
    "composition":"...",
    "lighting":"...",
    "environment":"...",
    "wardrobe_props":"...",
    "motifs":["..."],
    "keywords":["poster","no text","cinematic","professional"],
    "banned":["gore","blood","weapons","graphic injury"]
  },
  "render_style": "hand-painted lithograph",
  "nod_theme": ${JSON.stringify(safeNodTheme)},
  "seed": ${seed}
}`;

        // If no Anthropic key, use fallback immediately
        if (!hasAnthropic) {
            console.log('⚠️ No Anthropic API key, using fallback');
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        console.log('🤖 Making Anthropic API call...');

        // Make API call with better error handling
        let response;
        try {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': anthropicKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 900,
                    messages: [{ role: "user", content: prompt }]
                })
            });
        } catch (fetchError) {
            console.error('❌ Anthropic fetch error:', fetchError);
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        console.log('📡 Anthropic response status:', response.status);

        if (!response.ok) {
            let errText;
            try {
                errText = await response.text();
            } catch {
                errText = 'Failed to read error response';
            }
            console.error('❌ Anthropic API error:', response.status, errText);
            
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        let result;
        try {
            result = await response.json();
            console.log('✅ Anthropic response parsed successfully');
        } catch (jsonError) {
            console.error('❌ Failed to parse Anthropic response:', jsonError);
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        const raw = result?.content?.[0]?.text || '';
        console.log('📝 Raw Anthropic content length:', raw.length);

        let concept = null;
        
        // Try to parse the JSON response
        try {
            concept = JSON.parse(raw.trim());
            console.log('✅ Successfully parsed JSON concept');
        } catch (parseError) {
            console.log('⚠️ Direct JSON parse failed, trying regex extraction...');
            try {
                const jsonMatch = raw.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
                if (jsonMatch) {
                    concept = JSON.parse(jsonMatch[0]);
                    console.log('✅ Successfully extracted JSON with regex');
                } else {
                    console.log('❌ No JSON found in response');
                }
            } catch (regexError) {
                console.error('❌ Regex extraction also failed:', regexError);
            }
        }

        // Validate concept
        if (!concept || !concept.title || !concept.visual_spec) {
            console.log('⚠️ Invalid concept, using fallback');
            concept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme);
        } else {
            console.log('✅ Valid concept generated:', concept.title);
        }

        return res.status(200).json({ success: true, concept });

    } catch (err) {
        console.error('❌ Critical error in generate-concept:', err);
        console.error('Stack trace:', err.stack);
        
        // Always return a successful fallback to prevent client-side errors
        const fallbackConcept = buildFallbackConcept('1980s', 'sci-fi', Date.now() % 100000, false);
        return res.status(200).json({ 
            success: true, 
            concept: fallbackConcept,
            debug: {
                error: err.message,
                fallbackUsed: true
            }
        });
    }
}

function buildFallbackConcept(decade, genreFilter, seed, nodTheme) {
    console.log('🛡️ Building fallback concept');
    
    const fallbackTitles = [
        'The Quantum Mirror', 'Stellar Anomaly', 'Digital Phantoms', 'Temporal Breach',
        'Neural Interface', 'Cosmic Frequency', 'Memory Protocol', 'Reality Grid',
        'Signal Lost', 'Void Walker', 'Time Fragment', 'Data Stream'
    ];
    
    const fallbackTaglines = [
        'Reality is just the beginning.',
        'Some mysteries transcend time.',
        'The future remembers everything.',
        'Where science meets the unknown.',
        'Every signal tells a story.',
        'Beyond the edge of perception.'
    ];
    
    const randomTitle = fallbackTitles[seed % fallbackTitles.length];
    const randomTagline = fallbackTaglines[seed % fallbackTaglines.length];
    
    return {
        title: randomTitle,
        tagline: randomTagline,
        decade: decade || '1980s',
        genre: genreFilter === 'any' ? 'Sci-Fi' : (genreFilter === 'horror' ? 'Horror' : genreFilter),
        synopsis: 'An enigmatic discovery challenges everything we thought we knew about reality.',
        visual_spec: {
            subgenre: 'retro-futurism',
            palette: ['#0a0a0a', '#4a90e2', '#ff6b35'],
            camera: { 
                shot: 'medium close-up', 
                lens: '85mm', 
                depth_of_field: 'shallow focus' 
            },
            composition: 'centered portrait with negative space',
            lighting: 'dramatic rim lighting with color gels',
            environment: 'minimal sci-fi setting',
            wardrobe_props: 'era-appropriate costume and tech props',
            motifs: ['geometric patterns', 'light beams', 'reflections'],
            keywords: ['poster', 'no text', 'cinematic', 'professional'],
            banned: ['gore', 'blood', 'weapons', 'graphic injury']
        },
        render_style: 'painted montage',
        nod_theme: nodTheme,
        seed: seed,
        cast: ['Alex Chen', 'Maya Rodriguez', 'Dr. James Park', 'Sarah Mitchell'],
        director: 'Cameron Wells'
    };
}