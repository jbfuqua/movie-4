// One interface, two writers. Callers pass a provider id and a schema, and get
// back an object matching that schema regardless of who wrote it.

import { TEXT_PROVIDERS } from '../models.js';
import { TextError, hasKey, providerSpec } from './shared.js';
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

/** Which writers are actually usable right now — drives the frontend selector. */
export function availableTextProviders() {
    return Object.values(TEXT_PROVIDERS).map((spec) => ({
        id: spec.id,
        label: spec.label,
        configured: hasKey(spec),
        note: spec.note
    }));
}
