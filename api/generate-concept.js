// api/generate-concept.js - Enhanced with render_style & nod_theme
import { getApiKeys } from './config.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { anthropicKey, hasAnthropic } = getApiKeys();
        if (!hasAnthropic) throw new Error('ANTHROPIC_API_KEY environment variable is missing or invalid');

        const { genreFilter = 'any', eraFilter = 'any', nodTheme = false } = req.body || {};
        const genreMap = {
            'horror': '"Horror"',
            'sci-fi': '"Sci-Fi"',
            'fusion': 'a tasteful fusion of Horror and Sci-Fi'
        };
        const decades = ['1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];
        const forceRandomDecade = eraFilter === 'any' ? decades[Math.floor(Math.random()*decades.length)] : eraFilter;

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
        const forceTheme = creativeThemes[Math.floor(Math.random()*creativeThemes.length)];
        const seed = Date.now() % 100000;

        const prompt = `You are a film art director. Produce ONLY valid JSON. No prose.

Constraints:
- Era MUST be "${forceRandomDecade}"
- Genre ${genreFilter === 'any' ? 'MUST be Horror or Sci-Fi (or fusion)' : \`MUST be \${genreMap[genreFilter]}\`}
- Creative seed: "${forceTheme}"
- Avoid banned title words (Dark, Shadow, Night, Blood, Death, Steel, Cross, Stone)
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
  "nod_theme": ${JSON.stringify(nodTheme)},
  "seed": ${seed}
}`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
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

        const result = await response.json();
        let raw = result?.content?.[0]?.text || '';
        let concept = null;
        try { concept = JSON.parse(raw.trim()); } catch {}

        if (!concept) {
            concept = {
                title: 'Untitled Project',
                tagline: 'A cinematic mystery unfolds.',
                decade: forceRandomDecade,
                genre: genreFilter === 'any' ? 'Horror' : genreFilter,
                synopsis: 'An enigmatic event reshapes life.',
                visual_spec: {},
                render_style: 'painted montage',
                nod_theme: nodTheme,
                seed
            };
        }

        return res.status(200).json({ success: true, concept });
    } catch (err) {
        console.error('generate-concept error', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
