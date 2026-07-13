// One interface, two writers. Callers pass a provider id and a schema, and get
// back an object matching that schema regardless of who wrote it.

import { TEXT_PROVIDERS } from '../models.js';
import { TextError, hasKey, providerSpec, resolveModel } from './shared.js';
import * as claude from './claude.js';
import * as openai from './openai.js';

export { TextError };

const IMPLS = { claude, openai };

/**
 * TEXT_PROVIDER if set, otherwise whichever writer actually has a key — with
 * Claude preferred, because it is the better writer when it is behaving.
 * Resolved per request, not at import, so an env change takes effect without a
 * redeploy and a stale module-level default can't lie.
 */
export function defaultTextProvider() {
    const pinned = process.env.TEXT_PROVIDER;

    if (pinned) {
        const spec = providerSpec(pinned); // throws 400 on a typo
        if (!hasKey(spec)) {
            throw new TextError(
                `TEXT_PROVIDER is set to "${spec.id}" but ${spec.envKeys.join('/')} is not set.`,
                500,
                spec.id
            );
        }
        return spec.id;
    }

    const configured = Object.values(TEXT_PROVIDERS).find(hasKey);
    if (!configured) {
        throw new TextError(
            'No text provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.',
            500,
            null
        );
    }
    return configured.id;
}

export async function structured({ provider, ...options }) {
    const spec = providerSpec(provider || defaultTextProvider());
    if (!hasKey(spec)) {
        throw new TextError(
            `${spec.label} needs ${spec.envKeys.join(' or ')}, which is not set.`,
            500,
            spec.id
        );
    }
    return IMPLS[spec.id].structured(options);
}

/**
 * Pre-compile a provider's schema grammar, if it has one to compile.
 *
 * Only OpenAI's strict mode works this way. Claude constrains generation without
 * a per-schema compile step, so there is nothing to warm and this is a no-op —
 * which is why it lives behind the same interface rather than in the caller.
 */
export async function warmSchema(provider, schema) {
    const spec = providerSpec(provider || defaultTextProvider());
    if (!hasKey(spec) || !IMPLS[spec.id].warm) {
        return { provider: spec.id, warmed: false };
    }
    const result = await IMPLS[spec.id].warm(schema);
    return { provider: spec.id, warmed: result.ok, ...result };
}

/** Which writers are actually usable right now — drives the frontend selector. */
export function availableTextProviders() {
    return Object.values(TEXT_PROVIDERS).map((spec) => ({
        id: spec.id,
        label: resolveModel(spec),
        configured: hasKey(spec),
        note: spec.note,
        // Whether this provider pays a one-off schema-compile cost on first use.
        needsWarm: Boolean(IMPLS[spec.id].warm)
    }));
}
