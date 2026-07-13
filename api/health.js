// Reports what is actually configured. Cheap readiness check, not a smoke test.
//
// Replaces the old health.js, which made live probe calls to a retired model and
// dumped every environment variable name to the logs.
//
// This endpoint must never throw. Its whole job is to explain a broken config,
// so a misconfiguration has to come back as a readable 200, not a 500.

import { handler } from '../lib/http.js';
import { availableProviders, defaultProvider } from '../lib/image/index.js';
import { availableTextProviders, defaultTextProvider } from '../lib/text/index.js';

export default handler('GET', async () => {
    const providers = availableProviders();
    const writers = availableTextProviders();

    const anyImage = providers.some((p) => p.configured);
    const anyWriter = writers.some((w) => w.configured);

    let selected = null;
    let providerError = null;
    try {
        selected = defaultProvider();
    } catch (error) {
        // Bad IMAGE_PROVIDER pin, or no image key at all.
        providerError = error.message;
    }

    let writer = null;
    let writerError = null;
    try {
        writer = defaultTextProvider();
    } catch (error) {
        // Bad TEXT_PROVIDER pin, or no text key at all.
        writerError = error.message;
    }

    const missing = [
        !anyWriter && 'a writer key (ANTHROPIC_API_KEY or OPENAI_API_KEY)',
        !anyImage && 'an image provider key (OPENAI_API_KEY or GEMINI_API_KEY)',
        // Proofreading is Claude-only, so this degrades the poster without
        // blocking it. Called out separately rather than folded into the above.
        anyWriter && !process.env.ANTHROPIC_API_KEY && 'ANTHROPIC_API_KEY (proofreading is disabled without it)'
    ].filter(Boolean);

    return {
        status: writer && selected ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        text: {
            providers: writers,
            default: writer,
            pinned: process.env.TEXT_PROVIDER || null,
            error: writerError,
            // Proofreading needs Claude's vision, whoever writes the film.
            canProofread: Boolean(process.env.ANTHROPIC_API_KEY)
        },
        image: {
            providers,
            default: selected,
            pinned: process.env.IMAGE_PROVIDER || null,
            error: providerError
        },
        missing
    };
});
