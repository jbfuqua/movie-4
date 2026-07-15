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
    const original = { title: concept.title, tagline: concept.tagline };

    const review = await structured({
        provider: textProvider,
        prompt: audiencePrompt(concept, tone),
        schema: AUDIENCE_SCHEMA,
        maxTokens: 2000,
        think: true,
        effort: 'low',
        deadlineMs: DEADLINE_MS
    });

    // The moviegoer's decision stands. The regex used to sit in judgement over
    // the rewrite — reject it, retry, fall back to the original — which is
    // exactly the hard gate we took out. It now only annotates: if the final
    // copy trips a check, say so as a note, but ship what the audience chose.
    const title = review.title;
    const tagline = review.tagline;
    const copyNotes = checkCopy({ title, tagline }, tone);

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
        copyNotes,
        tone,
        elapsedMs: Date.now() - started
    };
});
