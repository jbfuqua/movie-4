import { handler } from '../lib/http.js';
import { structured } from '../lib/claude.js';
import { CONCEPT_SCHEMA, conceptPrompt, imagePrompt, creditsBlock } from '../lib/concept.js';
import { checkCopy } from '../lib/copy-check.js';

// The whole request must finish inside the serverless function's 60s ceiling, so
// the two calls share a budget rather than each assuming it has the full window.
const TOTAL_BUDGET_MS = 52_000;
const COPY_FIX_BUDGET_MS = 18_000;

// The retry only ever needs to replace two fields. Regenerating the entire
// concept — art direction, crew, the lot — was what pushed this over 60s.
const COPY_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'tagline'],
    properties: {
        title: CONCEPT_SCHEMA.properties.title,
        tagline: CONCEPT_SCHEMA.properties.tagline
    }
};

export default handler('POST', async (body) => {
    const started = Date.now();

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

    const brief = conceptPrompt({
        genre,
        era,
        plot: String(plot || '').trim(),
        intensity,
        avoidTitles: Array.isArray(avoidTitles) ? avoidTitles : [],
        seed
    });

    // Adaptive thinking is what makes the "consider several, discard the weak
    // ones" instructions executable at all — without it the model writes straight
    // into the schema in one pass and has nowhere to do the discarding. Effort is
    // low because the scratch space is what matters here, not the depth of it,
    // and this has to fit in a 60s function.
    const concept = await structured({
        prompt: brief,
        schema: CONCEPT_SCHEMA,
        maxTokens: 6000,
        think: true,
        effort: 'low',
        deadlineMs: TOTAL_BUDGET_MS
    });

    // Title and tagline are the two fields prose instructions have repeatedly
    // failed to control, so they are checked in code.
    const complaints = checkCopy(concept);
    let copyRejected;

    if (complaints.length) {
        copyRejected = complaints;
        const remaining = TOTAL_BUDGET_MS - (Date.now() - started);

        if (remaining > COPY_FIX_BUDGET_MS) {
            const fixed = await structured({
                schema: COPY_SCHEMA,
                maxTokens: 2000,
                think: true,
                effort: 'low',
                deadlineMs: Math.min(remaining, COPY_FIX_BUDGET_MS),
                prompt: [
                    'Rewrite the title and tagline for this film. Everything else about it is settled and is not changing.',
                    '',
                    `Film: ${concept.synopsis}`,
                    `Era: ${concept.decade}. Genre: ${concept.genre}.`,
                    '',
                    'The previous attempt was REJECTED:',
                    ...complaints.map((c) => `- ${c}`),
                    '',
                    'A poster\'s artwork withholds. A poster\'s COPY SELLS — they are opposite crafts, and an atmospheric, evocative title or tagline is a failed one.',
                    '',
                    'The TITLE names the threat or the sensation, never the setting and never the weather. Flat is fine; inert is not. "Barbarian" is one flat noun and it bites. If it could be a label on a building directory, it is a caption, not a title.',
                    '',
                    'The TAGLINE is a hook — a threat, a dare, a warning, a rule you must not break. "In space no one can hear you scream." "Don\'t go in the water." "They\'re here." Plain words, present tense, often imperative. It must never merely describe an event in the film.',
                    '',
                    'Write the ones a marketing department would actually have printed to sell tickets.'
                ].join('\n')
            });

            concept.title = fixed.title;
            concept.tagline = fixed.tagline;
        }
        // Out of budget: keep the rejected copy rather than 504. copyRejected
        // surfaces it, so the failure is visible instead of silent.
    }

    return {
        concept,
        seed,
        copyRejected,
        elapsedMs: Date.now() - started,
        // Precomputed so the client never has to reassemble either of these.
        imagePrompt: imagePrompt(concept),
        credits: creditsBlock(concept)
    };
});
