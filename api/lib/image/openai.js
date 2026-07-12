// gpt-image-2 via OpenAI's images endpoints.

import { IMAGE_PROVIDERS } from '../models.js';
import { ImageError, resolveKey } from './shared.js';

const SPEC = IMAGE_PROVIDERS.openai;

// 2:3 portrait. gpt-image-2 takes arbitrary sizes (edges must be multiples of
// 16, ratio <= 3:1) but only publishes per-image pricing for the standard ones,
// so we stay on the priced size.
const SIZE = '1024x1536';

export async function generate({ prompt, quality = 'high' }) {
    const key = resolveKey(SPEC);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
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
            output_format: 'png'
        })
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
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
        size: SIZE
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
