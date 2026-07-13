import { handler } from '../lib/http.js';
import { structured } from '../lib/claude.js';
import { CONCEPT_SCHEMA, conceptPrompt, imagePrompt, creditsBlock } from '../lib/concept.js';
import { checkCopy } from '../lib/copy-check.js';

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

    const basePrompt = conceptPrompt({
        genre,
        era,
        plot: String(plot || '').trim(),
        intensity,
        avoidTitles: Array.isArray(avoidTitles) ? avoidTitles : [],
        seed
    });

    // Adaptive thinking is what makes the "consider several, discard the weak
    // ones" instructions actually executable — without it the model writes
    // straight into the schema in one pass and has nowhere to do the discarding.
    const ask = (prompt) => structured({
        prompt,
        schema: CONCEPT_SCHEMA,
        maxTokens: 8000,
        think: true,
        effort: 'medium'
    });

    let concept = await ask(basePrompt);

    // The title and tagline are the two fields prose instructions have failed to
    // control, so they are checked in code. One retry, with the rejection quoted
    // back — far more reliable than another paragraph of rules.
    const complaints = checkCopy(concept);
    if (complaints.length) {
        concept = await ask([
            basePrompt,
            '',
            'YOUR PREVIOUS ATTEMPT WAS REJECTED. Keep the film — the premise, the era, the art direction are fine. Fix only the copy:',
            ...complaints.map((c) => `- ${c}`),
            '',
            'Write a title and tagline that a marketing department would actually have printed to sell tickets to this film.'
        ].join('\n'));
    }

    return {
        concept,
        seed,
        // Surfaced so a persistent failure is visible rather than silent.
        copyRejected: complaints.length ? complaints : undefined,
        // Precomputed so the client never has to reassemble either of these.
        imagePrompt: imagePrompt(concept),
        credits: creditsBlock(concept)
    };
});
