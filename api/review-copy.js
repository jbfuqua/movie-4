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
import { toneSpec } from '../lib/concept.js';
import { checkCopy } from '../lib/copy-check.js';

const DEADLINE_MS = 50_000;

export default handler('POST', async (body) => {
    const started = Date.now();
    const { concept, textProvider } = body;

    if (!concept?.title || !concept?.tagline) {
        const error = new Error('A concept with a title and tagline is required');
        error.status = 400;
        throw error;
    }

    const tone = toneSpec(body.tone).id;

    const review = await structured({
        provider: textProvider,
        prompt: audiencePrompt(concept, tone),
        schema: AUDIENCE_SCHEMA,
        maxTokens: 2000,
        think: true,
        effort: 'low',
        deadlineMs: DEADLINE_MS
    });

    const original = { title: concept.title, tagline: concept.tagline };

    // The rewrite is copy like any other, so it faces the same guard the original
    // did. If the audience "improved" the title into a banned shape, that is a
    // regression — keep what we had rather than shipping something worse.
    const complaints = checkCopy(review, tone);
    const rejected = complaints.length > 0;

    const title = rejected ? original.title : review.title;
    const tagline = rejected ? original.tagline : review.tagline;

    return {
        verdict: review.verdict,
        reaction: review.reaction,
        problems: review.problems || [],
        original,
        title,
        tagline,
        // `changed` is recomputed rather than trusted: the model sets the flag and
        // then sometimes returns identical strings anyway.
        changed: title !== original.title || tagline !== original.tagline,
        rejected: rejected ? complaints : undefined,
        tone,
        elapsedMs: Date.now() - started
    };
});
