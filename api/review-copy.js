// Show the title and tagline to a stranger before committing them to a poster.
//
// Its own function, not a third call bolted onto generate-concept, for two
// reasons. It gets its own 60s budget, so the test screening cannot push concept
// generation back over the limit it was only just fitted inside. And it is a
// clean context: the reviewer has not read the brief that produced this copy, so
// it cannot be talked round by it.

import { handler } from '../lib/http.js';
import { structured } from '../lib/text/index.js';
import { AUDIENCE_SCHEMA, audiencePrompt } from '../lib/audience.js';
import { toneSpec, copyRules } from '../lib/concept.js';
import { checkCopy } from '../lib/copy-check.js';

// The screening and its one retry share the window, rather than each assuming it
// owns the whole thing.
const TOTAL_BUDGET_MS = 50_000;
const RETRY_BUDGET_MS = 18_000;

// A rejected rewrite only ever needs these two fields back.
const REWRITE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'tagline'],
    properties: {
        title: AUDIENCE_SCHEMA.properties.title,
        tagline: AUDIENCE_SCHEMA.properties.tagline
    }
};

export default handler('POST', async (body) => {
    const started = Date.now();
    const { concept, textProvider } = body;

    if (!concept?.title || !concept?.tagline) {
        const error = new Error('A concept with a title and tagline is required');
        error.status = 400;
        throw error;
    }

    const tone = toneSpec(body.tone).id;
    const original = { title: concept.title, tagline: concept.tagline };

    const review = await structured({
        provider: textProvider,
        prompt: audiencePrompt(concept, tone),
        schema: AUDIENCE_SCHEMA,
        maxTokens: 2000,
        think: true,
        effort: 'low',
        deadlineMs: TOTAL_BUDGET_MS
    });

    let title = review.title;
    let tagline = review.tagline;
    let rejected;

    // The guard only judges a REWRITE. Copy the audience chose to keep is not
    // theirs to answer for — it already faced this same check in
    // generate-concept, and running it again here reported "the rewrite broke the
    // rules" about a rewrite that never happened.
    const isRewrite = title !== original.title || tagline !== original.tagline;

    if (isRewrite) {
        const complaints = checkCopy({ title, tagline }, tone);

        if (complaints.length) {
            // Same move as the concept guard: hand the complaint back and ask
            // again, rather than silently discarding the audience's judgement. The
            // audience was RIGHT that the copy was weak; it just fumbled the
            // replacement, and the original it rejected is not a good fallback.
            const remaining = TOTAL_BUDGET_MS - (Date.now() - started);

            if (remaining > RETRY_BUDGET_MS) {
                const fixed = await structured({
                    provider: textProvider,
                    schema: REWRITE_SCHEMA,
                    maxTokens: 1000,
                    think: true,
                    effort: 'low',
                    deadlineMs: Math.min(remaining, RETRY_BUDGET_MS),
                    prompt: [
                        'Your rewrite of this film\'s title and tagline was REJECTED by the copy checker:',
                        ...complaints.map((c) => `- ${c}`),
                        '',
                        `Film: ${concept.synopsis}`,
                        `Era: ${concept.decade}. Genre: ${concept.genre}.`,
                        '',
                        `You had proposed:  "${title}" / "${tagline}"`,
                        `The original was: "${original.title}" / "${original.tagline}"`,
                        '',
                        'Your judgement stands — you were right that this copy needed work. Only the replacement was malformed. Write it again, obeying the rules to the letter this time.',
                        ...copyRules(tone)
                    ].join('\n')
                });

                const stillBad = checkCopy(fixed, tone);
                if (stillBad.length) {
                    // Two strikes. Ship what we know is valid.
                    rejected = stillBad;
                    title = original.title;
                    tagline = original.tagline;
                } else {
                    title = fixed.title;
                    tagline = fixed.tagline;
                }
            } else {
                rejected = complaints;
                title = original.title;
                tagline = original.tagline;
            }
        }
    }

    return {
        verdict: review.verdict,
        reaction: review.reaction,
        problems: review.problems || [],
        original,
        title,
        tagline,
        // Recomputed rather than trusted: the model sets its `changed` flag and
        // then sometimes returns identical strings anyway.
        changed: title !== original.title || tagline !== original.tagline,
        rejected,
        tone,
        elapsedMs: Date.now() - started
    };
});
