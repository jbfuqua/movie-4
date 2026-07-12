// One interface, two providers. Callers pass a provider id and get back
// { provider, model, mimeType, base64, size } regardless of who rendered it.

import { IMAGE_PROVIDERS } from '../models.js';
import { ImageError, hasKey, providerSpec } from './shared.js';
import * as openai from './openai.js';
import * as gemini from './gemini.js';

export { ImageError };

const IMPLS = { openai, gemini };

/**
 * IMAGE_PROVIDER if set, otherwise whichever provider actually has a key.
 * Resolved per request, not at import — on Vercel a redeploy is not required for
 * an env change to take effect, and a stale module-level default would lie.
 */
export function defaultProvider() {
    // Read at call time, not at import — a module-level const would freeze the
    // value from whenever the lambda cold-started.
    const pinned = process.env.IMAGE_PROVIDER;

    if (pinned) {
        const spec = providerSpec(pinned); // throws 400 on a typo
        if (!hasKey(spec)) {
            throw new ImageError(
                `IMAGE_PROVIDER is set to "${spec.id}" but ${spec.envKeys.join('/')} is not set.`,
                500,
                spec.id
            );
        }
        return spec.id;
    }

    const configured = Object.values(IMAGE_PROVIDERS).find(hasKey);
    if (!configured) {
        throw new ImageError(
            'No image provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.',
            500,
            null
        );
    }
    return configured.id;
}

export async function generateImage({ provider, prompt, referenceImages, quality }) {
    const spec = providerSpec(provider || defaultProvider());
    return IMPLS[spec.id].generate({ prompt, referenceImages, quality });
}

export async function editImage({ provider, prompt, imageBase64, maskBase64 }) {
    const spec = providerSpec(provider);
    const impl = IMPLS[spec.id];
    if (!impl.edit) {
        throw new ImageError(`${spec.label} has no edit endpoint`, 400, spec.id);
    }
    return impl.edit({ prompt, imageBase64, maskBase64 });
}

/** Which providers are actually usable right now — drives the frontend selector. */
export function availableProviders() {
    return Object.values(IMAGE_PROVIDERS).map((spec) => ({
        id: spec.id,
        label: spec.label,
        configured: hasKey(spec),
        supportsMaskEdit: spec.supportsMaskEdit,
        supportsReferenceImages: spec.supportsReferenceImages,
        qualities: spec.qualities,
        defaultQuality: spec.defaultQuality,
        approxCostUsd: spec.approxCostUsd
    }));
}
