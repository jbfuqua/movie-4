// PROTOTYPE — the idea-picker. Pitch a slate of monster ideas, then let a brutal
// critic cut it down to one. Returns the whole slate with scores, not just the
// winner, so the selection is visible and judgeable. Does not write final copy or
// art — this exists purely to answer "are the ideas good, and does the critic
// pick well." Nothing in the current generate flow depends on it.

import { handler } from '../lib/http.js';
import { structured } from '../lib/text/index.js';
import { toneSpec } from '../lib/concept.js';
import { PITCH_SCHEMA, CRITIQUE_SCHEMA, pitchPrompt, critiquePrompt } from '../lib/brainstorm.js';

const PITCH_BUDGET_MS = 24_000;
const CUT_BUDGET_MS = 26_000;

const DEFAULT_COUNT = 8;

export default handler('POST', async (body) => {
    const started = Date.now();
    const {
        era = 'any',
        genre = 'any',
        textProvider,
        avoidTitles = [],
        count = DEFAULT_COUNT
    } = body;

    // Tone is accepted for parity with the main flow but does not change the
    // ideas much at this stage; kept so the prototype can be wired in later.
    const tone = toneSpec(body.tone).id;

    // 1. PITCH — a slate, one idea per mechanism, aimed at the canon.
    const pitched = await structured({
        provider: textProvider,
        prompt: pitchPrompt({ era, genre, count, avoidTitles: Array.isArray(avoidTitles) ? avoidTitles : [] }),
        schema: PITCH_SCHEMA,
        maxTokens: 3000,
        think: true,
        effort: 'low',
        deadlineMs: PITCH_BUDGET_MS
    });

    const ideas = (pitched.ideas || []).slice(0, count);
    if (!ideas.length) {
        const error = new Error('The pitch came back empty');
        error.status = 502;
        throw error;
    }

    // 2. CUT — a fresh, brutal critic that did NOT write these.
    const critique = await structured({
        provider: textProvider,
        prompt: critiquePrompt({ ideas }),
        schema: CRITIQUE_SCHEMA,
        maxTokens: 2000,
        think: true,
        effort: 'medium',
        deadlineMs: CUT_BUDGET_MS
    });

    const verdicts = critique.verdicts || [];

    // Merge verdict onto each idea by position; tolerate a short/long verdict list.
    const candidates = ideas.map((idea, i) => ({
        ...idea,
        score: Number.isInteger(verdicts[i]?.score) ? verdicts[i].score : null,
        note: verdicts[i]?.note || ''
    }));

    // Trust the critic's winner if it is in range; otherwise fall back to the
    // highest score, so the response always names one.
    let winner = critique.winner;
    if (!Number.isInteger(winner) || winner < 0 || winner >= candidates.length) {
        winner = candidates.reduce((best, c, i) => (c.score ?? -1) > (candidates[best].score ?? -1) ? i : best, 0);
    }

    return {
        candidates,
        winner,
        why: critique.why || '',
        tone,
        elapsedMs: Date.now() - started
    };
});
