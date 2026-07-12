// gpt-image-2 via OpenAI's images endpoints.

import { IMAGE_PROVIDERS } from '../models.js';
import { ImageError, resolveKey } from './shared.js';

const SPEC = IMAGE_PROVIDERS.openai;

// 2:3 portrait. gpt-image-2 takes arbitrary sizes (edges must be multiples of
// 16, ratio <= 3:1) but only publishes per-image pricing for the standard ones,
// so we stay on the priced size.
const SIZE = '1024x1536';

// quality:"high" does not fit inside a 60s serverless function — it 504s. Medium
// is the default because it's the best quality that reliably returns in time,
// and at Instagram size the difference is hard to see. Raising this only works
// on a plan with a longer function timeout.
const DEFAULT_QUALITY = 'medium';

// Bail just under Vercel's 60s ceiling so the caller gets a JSON error that says
// what happened, instead of the platform killing the function and returning a
// bare 504 with no explanation.
const DEADLINE_MS = 55_000;

export async function generate({ prompt, quality = DEFAULT_QUALITY }) {
    const key = resolveKey(SPEC);

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), DEADLINE_MS);

    let response;
    try {
        response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${key}`
            },
            body: JSON.stringify({
                model: SPEC.model,
                prompt,
                n: 1,
                size: SIZE,
                quality,
                output_format: 'png',
                // The documented setting for legitimate creative work that the
                // default filter over-flags. Genre poster art — dread, shadow,
                // monsters — is the case it exists for. It is NOT a licence to
                // generate harmful imagery: the prompt itself forbids gore,
                // injury and violence, which is the constraint that matters.
                // Set to 'auto' if you would rather have the stricter filter.
                moderation: 'low'
            }),
            signal: abort.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new ImageError(
                `gpt-image-2 did not respond within ${DEADLINE_MS / 1000}s at quality "${quality}". ` +
                'Drop to a lower quality, or switch to gemini — high quality does not fit in a 60s function.',
                504,
                SPEC.id
            );
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');

        // A content-policy refusal is not a bug and not a config problem — the
        // concept asked for something unprintable. Say so plainly, so the caller
        // can reroll the concept instead of staring at a raw 400.
        if (/content_policy|moderation_blocked|safety/i.test(detail)) {
            const error = new ImageError(
                'gpt-image-2 refused this concept on content policy. The art direction asked for ' +
                'something it will not draw. Generate a new concept, or turn off Darker tone.',
                422,
                SPEC.id
            );
            error.contentPolicy = true;
            throw error;
        }

        throw new ImageError(
            `OpenAI images ${response.status}: ${detail.slice(0, 400)}`,
            response.status,
            SPEC.id
        );
    }

    const result = await response.json();
    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) throw new ImageError('OpenAI returned no image data', 502, SPEC.id);

    return {
        provider: SPEC.id,
        model: SPEC.model,
        mimeType: 'image/png',
        base64: b64,
        size: SIZE,
        quality
    };
}

/**
 * Re-render part of an existing poster. gpt-image-2 is the only provider here
 * with a real mask endpoint, so this is where a garbled title gets repaired
 * without rerolling the whole image.
 *
 * `mask` is a PNG whose transparent pixels mark the region to replace. We don't
 * currently synthesize one (that needs an image library — see README), so this
 * is reachable only when a caller supplies a mask. Left in place because it is
 * the reason gpt-image-2 is worth the extra cost.
 */
export async function edit({ prompt, imageBase64, maskBase64 }) {
    const key = resolveKey(SPEC);

    const form = new FormData();
    form.append('model', SPEC.model);
    form.append('prompt', prompt);
    form.append('size', SIZE);
    form.append('quality', 'high');
    form.append('image[]', new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/png' }), 'poster.png');
    if (maskBase64) {
        form.append('mask', new Blob([Buffer.from(maskBase64, 'base64')], { type: 'image/png' }), 'mask.png');
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}` },
        body: form
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ImageError(
            `OpenAI edits ${response.status}: ${detail.slice(0, 400)}`,
            response.status,
            SPEC.id
        );
    }

    const result = await response.json();
    const b64 = result?.data?.[0]?.b64_json;
    if (!b64) throw new ImageError('OpenAI edit returned no image data', 502, SPEC.id);

    return { provider: SPEC.id, model: SPEC.model, mimeType: 'image/png', base64: b64, size: SIZE };
}
