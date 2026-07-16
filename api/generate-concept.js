import { handler } from '../lib/http.js';
import { structured, defaultTextProvider } from '../lib/text/index.js';
import { CONCEPT_SCHEMA, conceptPrompt, imagePrompt, creditsBlock, toneSpec } from '../lib/concept.js';
import { checkCopy } from '../lib/copy-check.js';

// One generation call, inside the serverless function's 60s ceiling. This used
// to also run a second call to "fix" copy the regex disliked — that gate is
// gone: it fought the prompt, cost ~18s, and the test screening is the real
// judge now. Dropping it is also what buys the room to raise thinking effort.
const TOTAL_BUDGET_MS = 52_000;

export default handler('POST', async (body) => {
    const started = Date.now();

    const {
        genre = 'any',
        era = 'any',
        plot = '',
        tone: requestedTone,
        // Superseded by `tone`. Still read, because a phone with the old page
        // cached will keep sending it, and silently dropping the user's darker
        // toggle is worse than a three-line shim.
        intensity,
        avoidTitles = [],
        // An idea picked from the brainstormed slate. When present it DRIVES the
        // concept: its title and monster are kept and its logline becomes the film.
        // This is the wire that ties the idea-picker to the poster — without it the
        // two flows produce unrelated films. Sanitised to the three fields the
        // prompt reads, so a stale client cannot smuggle anything else through.
        idea,
        // Which writer. Undefined falls through to TEXT_PROVIDER, then to
        // whichever provider has a key.
        textProvider
    } = body;

    const chosenIdea = idea && typeof idea === 'object'
        ? {
            title: String(idea.title || '').trim(),
            monster: String(idea.monster || '').trim(),
            logline: String(idea.logline || '').trim()
        }
        : null;
    const hasIdea = !!(chosenIdea && (chosenIdea.title || chosenIdea.monster || chosenIdea.logline));

    // toneSpec() falls back to the house style on anything unknown, so a bad tone
    // string degrades to "eerie" rather than 500ing.
    const tone = toneSpec(requestedTone || (intensity === 'hardcore' ? 'dread' : 'eerie')).id;

    // Opus 4.8 takes no temperature, so variety has to come from the prompt.
    // A seed plus the real recent-titles list beats the old approach — a
    // hardcoded lottery of 110 pre-written themes — because it steers away from
    // what this user actually just generated, not from a fixed list.
    const seed = Math.floor(Math.random() * 1_000_000);

    const writer = textProvider || defaultTextProvider();

    const brief = conceptPrompt({
        genre,
        era,
        plot: String(plot || '').trim(),
        tone,
        avoidTitles: Array.isArray(avoidTitles) ? avoidTitles : [],
        seed,
        idea: hasIdea ? chosenIdea : null
    });

    // Adaptive thinking is what makes the "consider several, discard the weak
    // ones" instructions executable at all — without it the model writes straight
    // into the schema in one pass and has nowhere to do the discarding. Effort is
    // medium (was low): copy quality is the whole complaint, and this is the
    // single biggest lever on it after the prompt. The removed copy-fix call is
    // what makes room for it inside the 60s window.
    const concept = await structured({
        provider: writer,
        prompt: brief,
        schema: CONCEPT_SCHEMA,
        maxTokens: 6000,
        think: true,
        effort: 'medium',
        deadlineMs: TOTAL_BUDGET_MS
    });

    // Advisory only. The regex used to REJECT and regenerate on these; now it
    // just flags them, and the test screening (or the user) decides. An empty
    // array is the common case.
    const copyNotes = checkCopy(concept, tone);

    return {
        concept,
        seed,
        writer,
        tone,
        // Echo which picked idea this concept was developed from (null for a fresh,
        // un-seeded generation), so the client can show the poster's provenance.
        developedFrom: hasIdea ? chosenIdea.title : null,
        copyNotes,
        elapsedMs: Date.now() - started,
        // Precomputed so the client never has to reassemble either of these.
        imagePrompt: imagePrompt(concept),
        credits: creditsBlock(concept)
    };
});
