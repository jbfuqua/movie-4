import { handler } from '../lib/http.js';
import { structured } from '../lib/claude.js';
import { CONCEPT_SCHEMA, conceptPrompt, imagePrompt, creditsBlock } from '../lib/concept.js';

export default handler('POST', async (body) => {
    const {
        genre = 'any',
        era = 'any',
        plot = '',
        intensity = 'normal',
        avoidTitles = []
    } = body;

    // Opus 4.8 takes no temperature, so variety has to come from the prompt.
    // A seed plus the real recent-titles list beats the old approach — a
    // hardcoded lottery of 110 pre-written themes — because it steers away from
    // what this user actually just generated, not from a fixed list.
    const seed = Math.floor(Math.random() * 1_000_000);

    const concept = await structured({
        prompt: conceptPrompt({
            genre,
            era,
            plot: String(plot || '').trim(),
            intensity,
            avoidTitles: Array.isArray(avoidTitles) ? avoidTitles : [],
            seed
        }),
        schema: CONCEPT_SCHEMA,
        maxTokens: 2000
    });

    return {
        concept,
        seed,
        // Precomputed so the client never has to reassemble either of these.
        imagePrompt: imagePrompt(concept),
        credits: creditsBlock(concept)
    };
});
