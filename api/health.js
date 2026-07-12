// Reports what is actually configured. Cheap readiness check, not a smoke test.
//
// Replaces the old health.js, which made live probe calls to a retired model and
// dumped every environment variable name to the logs.
//
// This endpoint must never throw. Its whole job is to explain a broken config,
// so a misconfiguration has to come back as a readable 200, not a 500.

import { handler } from '../lib/http.js';
import { availableProviders, defaultProvider } from '../lib/image/index.js';
import { CLAUDE_MODEL } from '../lib/models.js';

export default handler('GET', async () => {
    const providers = availableProviders();
    const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
    const anyImage = providers.some((p) => p.configured);

    let selected = null;
    let providerError = null;
    try {
        selected = defaultProvider();
    } catch (error) {
        // Bad IMAGE_PROVIDER pin, or no image key at all.
        providerError = error.message;
    }

    const missing = [
        !anthropic && 'ANTHROPIC_API_KEY',
        !anyImage && 'an image provider key (OPENAI_API_KEY or GEMINI_API_KEY)'
    ].filter(Boolean);

    return {
        status: anthropic && selected ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        text: { model: CLAUDE_MODEL, configured: anthropic },
        image: {
            providers,
            default: selected,
            pinned: process.env.IMAGE_PROVIDER || null,
            error: providerError
        },
        missing
    };
});
