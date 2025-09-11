// api/generate-concept.js - Updated with Custom Plot Prompt Support
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

        // NEW: Include custom plot prompt
        const { genreFilter = 'any', eraFilter = 'any', nodTheme = false, customPlotPrompt = '' } = requestBody;
        const safeNodTheme = !!nodTheme;
        const safeCustomPlot = String(customPlotPrompt || '').trim();

        console.log('📋 Request params:', { genreFilter, eraFilter, nodTheme: safeNodTheme, hasCustomPlot: !!safeCustomPlot });
        if (safeCustomPlot) {
            console.log('💭 Custom plot:', safeCustomPlot);
        }

        // Genre mapping
        const genreMap = {
            'horror': '"Horror"',
            'sci-fi': '"Sci-Fi"',
            'fusion': 'a tasteful fusion of Horror and Sci-Fi'
        };

        const decades = ['1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];
        const forceRandomDecade = eraFilter === 'any' ? decades[Math.floor(Math.random() * decades.length)] : eraFilter;

        // UPDATED: Separate theme systems for normal vs hardcore mode
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

        const hardcoreThemes = {
            horror: [
                // Psychological Horror
                'mind-control cults manipulating reality', 'serial killer with supernatural abilities',
                'demonic possession spreading through family', 'cursed artifacts claiming victims',
                'ancient evil awakening in modern city', 'cannibalistic survival in wasteland',
                'zombie virus outbreak in quarantine zone', 'vampire lords controlling underground',
                'werewolf pack territory wars', 'ghost revenge killing descendants',
                'haunted asylum with deadly experiments', 'occult rituals opening hell portals',
                'body horror mutations from toxic waste', 'slasher stalking isolated victims',
                'witch coven hexing entire town', 'necromancer raising undead army',
                
                // Gothic & Atmospheric
                'cursed bloodline doomed to die violently', 'evil doll possessed by child spirit',
                'plague turning humans into monsters', 'satanic church sacrificing innocents',
                'shape-shifting entity hunting humans', 'cemetery caretaker raising corpses',
                'mad scientist creating human hybrids', 'evil mirror showing deadly futures',
                'demon-infested house trapping families', 'blood cult seeking immortality'
            ],
            
            scifi: [
                // Dystopian Tech Horror
                'AI death squads hunting human survivors', 'cyberpunk corporations harvesting organs',
                'alien parasites controlling world leaders', 'space prison riot with deadly inmates',
                'robot uprising enslaving humanity', 'genetic experiments creating super soldiers',
                'time travelers assassinating key figures', 'mars colonies under alien siege',
                'virtual reality death games', 'clone army replacing original humans',
                'nuclear wasteland mutant gangs', 'space station infected with alien virus',
                'cybernetic implants hacking human minds', 'galactic empire committing genocide',
                
                // Alien & Space Horror  
                'alien invasion harvesting human brains', 'space explorers trapped with monsters',
                'terraforming disaster creating hellscape', 'alien zoo keeping humans as specimens',
                'interstellar war crimes tribunal', 'space pirates raiding Earth colonies',
                'alien-human hybrid breeding program', 'crashed alien ship releasing plague',
                'space miners discovering hostile life', 'galactic bounty hunters vs fugitives',
                'alien technology corrupting users', 'deep space rescue mission gone wrong',
                
                // Body Horror Sci-Fi
                'human consciousness uploaded into machines', 'bioweapon turning soldiers into beasts',
                'nano-technology consuming human tissue', 'dimensional portals releasing entities',
                'space radiation creating violent mutants', 'alien DNA rewriting human genetics'
            ],
            
            fusion: [
                // Horror + Sci-Fi Combinations
                'alien demons possessing space colonists', 'AI developing occult consciousness',
                'time-traveling witch hunters vs future covens', 'cyberpunk vampire underground',
                'haunted spaceship with ghost AI', 'alien technology summoning ancient evils',
                'robotic exorcists vs digital demons', 'space necromancers raising alien dead',
                'mutant werewolves in post-apocalypse', 'cybernetic serial killers in virtual reality',
                'alien parasites with demonic intelligence', 'haunted mars base with possessed crew',
                'time-displaced monsters in modern labs', 'AI-controlled zombie plague outbreak'
            ]
        };

        // UPDATED: Smart theme selection based on hardcore mode, genre, and custom plot
        let forceTheme;
        
        // NEW: If custom plot provided, use it instead of random theme
        if (safeCustomPlot) {
            forceTheme = safeCustomPlot;
            console.log('🎯 Using custom plot prompt as theme');
        } else if (safeNodTheme) {
            // Hardcore mode - select based on genre preference
            if (genreFilter === 'horror' && hardcoreThemes.horror) {
                forceTheme = hardcoreThemes.horror[Math.floor(Math.random() * hardcoreThemes.horror.length)];
            } else if (genreFilter === 'sci-fi' && hardcoreThemes.scifi) {
                forceTheme = hardcoreThemes.scifi[Math.floor(Math.random() * hardcoreThemes.scifi.length)];
            } else if (genreFilter === 'fusion' && hardcoreThemes.fusion) {
                forceTheme = hardcoreThemes.fusion[Math.floor(Math.random() * hardcoreThemes.fusion.length)];
            } else {
                // If 'any' genre in hardcore mode, pick from all hardcore themes
                const allHardcoreThemes = [
                    ...hardcoreThemes.horror,
                    ...hardcoreThemes.scifi,
                    ...hardcoreThemes.fusion
                ];
                forceTheme = allHardcoreThemes[Math.floor(Math.random() * allHardcoreThemes.length)];
            }
        } else {
            // Normal mode - use original creative themes
            forceTheme = creativeThemes[Math.floor(Math.random() * creativeThemes.length)];
        }
        
        const seed = Date.now() % 100000;

        console.log('🎯 Generation parameters:', { forceRandomDecade, forceTheme, seed, hardcoreMode: safeNodTheme, isCustomPlot: !!safeCustomPlot });

        // Build the JSON-only prompt with custom plot support
        const genreConstraint = genreFilter === 'any' 
            ? 'MUST be Horror or Sci-Fi (or fusion)' 
            : `MUST be ${genreMap[genreFilter]}`;

        // NEW: Custom plot instructions
        const customPlotInstructions = safeCustomPlot 
            ? `
            CUSTOM PLOT PROVIDED BY USER:
            - Base the entire movie concept on this plot idea: "${safeCustomPlot}"
            - Expand this concept into a full movie with title, tagline, and detailed synopsis
            - Create a compelling movie that explores this core premise
            - Make the title catchy and era-appropriate
            - Develop the tagline to hook audiences
            - Write a synopsis that builds on the user's idea with interesting details
            ` 
            : '';

        // UPDATED: Add hardcore mode instructions
        const hardcoreInstructions = safeNodTheme 
            ? `
            HARDCORE MODE ENABLED:
            - Generate intense, edgy concepts with darker mature themes
            - For Horror: psychological terror, gothic elements, supernatural threats (PG-13)
            - For Sci-Fi: dystopian futures, alien threats, technological horror (PG-13)
            - Push creative boundaries while maintaining content safety guidelines
            - Focus on atmospheric dread and intense scenarios
            - Make titles and concepts more aggressive and impactful
            ` 
            : '';

        const prompt = `You are a film art director. Produce ONLY valid JSON. No prose.

${customPlotInstructions}
${hardcoreInstructions}

Constraints:
- Era MUST be "${forceRandomDecade}"
- Genre ${genreConstraint}
- Creative seed: "${forceTheme}"
- Avoid banned title words: Blood
- Keep PG-13 implication (no graphic detail)
- Add render_style: era-true medium ("hand-painted lithograph" | "silkscreen halftone" | "airbrushed illustration" | "painted montage" | "studio photo-composite" | "digital composite")
${safeCustomPlot ? '- Build the entire concept around the user\'s plot idea while following all other constraints' : ''}

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
    "keywords":["art","concept","cinematic","professional"],
      banned: [
        "text","letters","typography","caption","credits","titles","logo","watermark","signature","words",
        "gore","blood","graphic injury"
      ]

  },
  "render_style": "hand-painted lithograph",
  "nod_theme": ${JSON.stringify(safeNodTheme)},
  "custom_plot_used": ${JSON.stringify(!!safeCustomPlot)},
  "seed": ${seed}
}`;

        // If no Anthropic key, use fallback immediately
        if (!hasAnthropic) {
            console.log('⚠️ No Anthropic API key, using fallback');
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme, safeCustomPlot);
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
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme, safeCustomPlot);
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
            
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme, safeCustomPlot);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        let result;
        try {
            result = await response.json();
            console.log('✅ Anthropic response parsed successfully');
        } catch (jsonError) {
            console.error('❌ Failed to parse Anthropic response:', jsonError);
            const fallbackConcept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme, safeCustomPlot);
            return res.status(200).json({ success: true, concept: fallbackConcept });
        }

        const raw = result?.content?.[0]?.text || '';
        console.log('📄 Raw Anthropic content length:', raw.length);

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

        // Validate concept and ensure required fields are set
        if (!concept || !concept.title || !concept.visual_spec) {
            console.log('⚠️ Invalid concept, using fallback');
            concept = buildFallbackConcept(forceRandomDecade, genreFilter, seed, safeNodTheme, safeCustomPlot);
        } else {
            // UPDATED: Make sure required fields are properly set
            concept.nod_theme = safeNodTheme;
            concept.custom_plot_used = !!safeCustomPlot;
            if (safeCustomPlot) {
                concept.original_plot_prompt = safeCustomPlot;
            }
            console.log('✅ Valid concept generated:', concept.title, '| Hardcore Mode:', safeNodTheme, '| Custom Plot:', !!safeCustomPlot);
        }

        return res.status(200).json({ success: true, concept });

    } catch (err) {
        console.error('❌ Critical error in generate-concept:', err);
        console.error('Stack trace:', err.stack);
        
        // Always return a successful fallback to prevent client-side errors
        const fallbackConcept = buildFallbackConcept('1980s', 'sci-fi', Date.now() % 100000, false, '');
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

// UPDATED: Enhanced fallback with custom plot support
function buildFallbackConcept(decade, genreFilter, seed, nodTheme, customPlot) {
    console.log('🛡️ Building fallback concept | Hardcore Mode:', nodTheme, '| Custom Plot:', !!customPlot);
    
    // NEW: Handle custom plot in fallback
    if (customPlot) {
        // Create a simple concept based on the custom plot
        const customTitle = customPlot.length > 30 
            ? customPlot.substring(0, 30).trim() + '...' 
            : customPlot;
        
        return {
            title: 'The ' + customTitle.split(' ').slice(0, 3).join(' '),
            tagline: 'Some mysteries defy explanation.',
            decade: decade || '1980s',
            genre: genreFilter === 'any' ? 'Sci-Fi' : (genreFilter === 'horror' ? 'Horror' : genreFilter),
            synopsis: customPlot + ' A gripping tale that challenges everything we thought we knew.',
            visual_spec: {
                subgenre: nodTheme ? 'hardcore-thriller' : 'retro-futurism',
                palette: nodTheme ? ['#000000', '#8B0000', '#FF0000'] : ['#0a0a0a', '#4a90e2', '#ff6b35'],
                camera: { 
                    shot: 'medium close-up', 
                    lens: '85mm', 
                    depth_of_field: 'shallow focus' 
                },
                composition: 'centered portrait with dramatic lighting',
                lighting: nodTheme ? 'harsh directional lighting with deep shadows' : 'dramatic rim lighting with color gels',
                environment: 'atmospheric setting that supports the plot',
                wardrobe_props: 'era-appropriate costume and tech props',
                motifs: ['mystery', 'discovery', 'revelation'],
                keywords: ['poster', 'no text', 'cinematic', 'professional'],
                banned: ['gore', 'blood', 'weapons', 'graphic injury']
            },
            render_style: 'painted montage',
            nod_theme: nodTheme,
            custom_plot_used: true,
            original_plot_prompt: customPlot,
            seed: seed,
            cast: ['Alex Chen', 'Maya Rodriguez', 'Dr. James Park', 'Sarah Mitchell'],
            director: 'Cameron Wells'
        };
    }
    
    // Different titles based on hardcore mode (existing code)
    const normalTitles = [
        'The Quantum Mirror', 'Stellar Anomaly', 'Digital Phantoms', 'Temporal Breach',
        'Neural Interface', 'Cosmic Frequency', 'Memory Protocol', 'Reality Grid',
        'Signal Lost', 'Void Walker', 'Time Fragment', 'Data Stream'
    ];
    
    const hardcoreTitles = [
        'Extinction Protocol', 'Viral Genesis', 'Cyber Slaughter', 'Plague Vector',
        'Death Algorithm', 'Alien Harvest', 'Machine Apocalypse', 'Toxic Genesis',
        'Predator Prime', 'Nightmare Code', 'Terror Strain', 'Kill Switch'
    ];
    
    const normalTaglines = [
        'Reality is just the beginning.',
        'Some mysteries transcend time.',
        'The future remembers everything.',
        'Where science meets the unknown.',
        'Every signal tells a story.',
        'Beyond the edge of perception.'
    ];
    
    const hardcoreTaglines = [
        'Survival is not guaranteed.',
        'Death is just the beginning.',
        'No one is safe.',
        'The hunt never ends.',
        'Fear has evolved.',
        'Humanity\'s final hour.'
    ];
    
    const titles = nodTheme ? hardcoreTitles : normalTitles;
    const taglines = nodTheme ? hardcoreTaglines : normalTaglines;
    
    const randomTitle = titles[seed % titles.length];
    const randomTagline = taglines[seed % taglines.length];
    
    const synopsis = nodTheme 
        ? 'A deadly threat emerges, forcing survivors into a desperate fight for their lives against overwhelming odds.'
        : 'An enigmatic discovery challenges everything we thought we knew about reality.';
    
    return {
        title: randomTitle,
        tagline: randomTagline,
        decade: decade || '1980s',
        genre: genreFilter === 'any' ? 'Sci-Fi' : (genreFilter === 'horror' ? 'Horror' : genreFilter),
        synopsis: synopsis,
        visual_spec: {
            subgenre: nodTheme ? 'hardcore-thriller' : 'retro-futurism',
            palette: nodTheme ? ['#000000', '#8B0000', '#FF0000'] : ['#0a0a0a', '#4a90e2', '#ff6b35'],
            camera: { 
                shot: 'medium close-up', 
                lens: '85mm', 
                depth_of_field: 'shallow focus' 
            },
            composition: nodTheme ? 'dramatic low angle with harsh shadows' : 'centered portrait with negative space',
            lighting: nodTheme ? 'harsh directional lighting with deep shadows' : 'dramatic rim lighting with color gels',
            environment: nodTheme ? 'gritty industrial or wasteland setting' : 'minimal sci-fi setting',
            wardrobe_props: 'era-appropriate costume and tech props',
            motifs: nodTheme ? ['danger symbols', 'industrial decay', 'harsh textures'] : ['geometric patterns', 'light beams', 'reflections'],
            keywords: ['poster', 'no text', 'cinematic', 'professional'],
            banned: ['gore', 'blood', 'weapons', 'graphic injury']
        },
        render_style: 'painted montage',
        nod_theme: nodTheme,
        custom_plot_used: false,
        seed: seed,
        cast: ['Alex Chen', 'Maya Rodriguez', 'Dr. James Park', 'Sarah Mitchell'],
        director: 'Cameron Wells'
    };
}