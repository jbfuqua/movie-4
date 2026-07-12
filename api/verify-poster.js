// Read the poster back and check the model spelled the title right.
//
// This is only possible because the concept is structured: we hold the exact
// string that was supposed to be rendered, so "did it work?" is a decidable
// question instead of a vibe.

import { handler } from '../lib/http.js';
import { structured, imageBlock } from '../lib/claude.js';

const VERDICT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['title_as_rendered', 'title_correct', 'legible', 'stray_text', 'issues'],
    properties: {
        title_as_rendered: {
            type: 'string',
            description: 'The title exactly as it appears in the image, character for character. Empty string if no title is visible.'
        },
        title_correct: {
            type: 'boolean',
            description: 'True only if the rendered title matches the expected title exactly, ignoring case and normal letter-spacing.'
        },
        legible: {
            type: 'boolean',
            description: 'True if the title reads cleanly as words, rather than as decorative pseudo-lettering.'
        },
        stray_text: {
            type: 'boolean',
            description: 'True if there is any text in the image beyond the title and tagline — invented credits, garbled small print, logos, watermarks.'
        },
        issues: {
            type: 'array',
            description: 'Short, concrete problems worth a re-render. Empty if the poster is good.',
            items: { type: 'string' }
        }
    }
};

export default handler('POST', async (body) => {
    const { imageUrl, expectedTitle, expectedTagline = '' } = body;

    if (!imageUrl || !expectedTitle) {
        const error = new Error('imageUrl and expectedTitle are required');
        error.status = 400;
        throw error;
    }

    const match = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(imageUrl);
    if (!match) {
        const error = new Error('imageUrl must be a base64 data URL');
        error.status = 400;
        throw error;
    }
    const [, mediaType, base64] = match;

    const verdict = await structured({
        schema: VERDICT_SCHEMA,
        maxTokens: 1000,
        content: [
            imageBlock(base64, mediaType),
            {
                type: 'text',
                text: [
                    'This is an AI-generated movie poster. Proofread the text in it.',
                    '',
                    `The title was supposed to read exactly: "${expectedTitle}"`,
                    expectedTagline ? `The tagline was supposed to read exactly: "${expectedTagline}"` : '',
                    '',
                    'Transcribe the title as it actually appears — do not correct it, do not read what you expect to see. If a letter is wrong, doubled, or missing, report it as it is. Judge the artwork not at all; only the text.'
                ].filter(Boolean).join('\n')
            }
        ]
    });

    return { verdict };
});
