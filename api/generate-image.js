// api/generate-image.js - Enhanced era fidelity & nod theme
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const { visualElements = '', concept = {} } = req.body || {};

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
			const eraMedium = styleHintsByEra[decade] || '';
			const declaredStyle = (concept.render_style && renderStyleMap[concept.render_style])
			  ? renderStyleMap[concept.render_style] : '';

			const nodBias = concept.nod_theme
			  ? 'odd surrealism, uncanny symmetry, dreamlike atmosphere, painterly strangeness (PG-13)'
			  : '';

			const cleanedElements = (visualElements || '').toString();

			// ENHANCED TEXT PREVENTION
			const textPreventionInstructions = [
				'NO TEXT, NO TITLES, NO WORDS, NO LETTERS',
				'completely text-free image',
				'visual elements only without typography',
				'clean composition ready for custom text overlay'
			].join(', ');

			return [
				textPreventionInstructions,
				`Professional ${concept.genre || 'cinematic'} movie artwork in the ${decade} style.`,
				declaredStyle || eraMedium,
				cleanedElements,
				nodBias,
				'no text, no logos, no titles, no credits, no words visible, cinematic artwork only, professional, PG-13'
			].filter(Boolean).join(' ');
		}
		
        const prompt = createOptimizedPrompt(concept, visualElements);

        let response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI image generation failed');
        }

        const result = await response.json();
        const imageB64 = result.data[0].b64_json;
        const imageUrl = `data:image/png;base64,${imageB64}`;

        return res.status(200).json({ success: true, imageUrl });
    } catch (err) {
        console.error('generate-image error', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
