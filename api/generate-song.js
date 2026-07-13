import { handler } from '../lib/http.js';
import { structured } from '../lib/text/claude.js';

const SONG_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'artist', 'year', 'reason'],
    properties: {
        title: { type: 'string', description: 'A real, existing song.' },
        artist: { type: 'string' },
        year: { type: 'string', description: 'Release year, four digits.' },
        reason: {
            type: 'string',
            description: 'One or two sentences on why this song fits this film — its mood, its era, its themes. Be specific to the film, not generic.'
        }
    }
};

export default handler('POST', async (body) => {
    const { concept } = body;

    if (!concept?.title || !concept?.synopsis) {
        const error = new Error('A concept with title and synopsis is required');
        error.status = 400;
        throw error;
    }

    const recommendation = await structured({
        schema: SONG_SCHEMA,
        maxTokens: 600,
        prompt: [
            'You are a music supervisor. Pick the one real song you would put over the end credits of this film.',
            '',
            `Title: "${concept.title}"`,
            `Era: ${concept.decade}`,
            `Genre: ${concept.genre}`,
            `Tagline: "${concept.tagline}"`,
            `Synopsis: ${concept.synopsis}`,
            '',
            'It does not have to be from the same decade — a needle drop that cuts against the era is often the better choice. But it must be a real song that actually exists.'
        ].join('\n')
    });

    return { recommendation };
});
