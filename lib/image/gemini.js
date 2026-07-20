// gemini-3.1-flash-image ("Nano Banana 2") via generateContent.

import { IMAGE_PROVIDERS } from '../models.js';
import { ImageError, resolveKey } from './shared.js';

const SPEC = IMAGE_PROVIDERS.gemini;

// v1beta, not v1. The v1 endpoint rejects both `responseModalities` and
// `imageConfig` outright ("Unknown name ... at 'generation_config'"), so image
// generation is only reachable on v1beta.
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${SPEC.model}:generateContent`;

// Google's REST examples and their SDK examples disagree on where the image
// config lives (generationConfig.responseFormat.image vs generationConfig.imageConfig)
// — the field appears to be mid-rename. We send the REST spelling and retry with
// the SDK spelling on a 400 rather than guess. If the retry is what works, the
// warning below tells you to drop the first shape.
const IMAGE_CONFIG = { aspectRatio: '2:3', imageSize: '2K' };

function bodyWith(shape, prompt, referenceImages) {
    const parts = [
        ...referenceImages.map((ref) => ({
            inlineData: { mimeType: ref.mimeType || 'image/png', data: ref.base64 }
        })),
        { text: prompt }
    ];

    // Temperature for variety — the old app ran the painterly Gemini at ~0.8 and
    // got a varied, characterful feed; with none set the output converges. Higher
    // because a poster wants range, not determinism.
    const generationConfig = { responseModalities: ['IMAGE'], temperature: 0.9 };
    if (shape === 'responseFormat') {
        generationConfig.responseFormat = { image: IMAGE_CONFIG };
    } else {
        generationConfig.imageConfig = IMAGE_CONFIG;
    }

    return JSON.stringify({ contents: [{ parts }], generationConfig });
}

async function call(shape, prompt, referenceImages, key) {
    return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: bodyWith(shape, prompt, referenceImages)
    });
}

/**
 * `referenceImages` is what makes a recurring cast and a consistent house style
 * possible: gemini-3.1-flash-image holds character resemblance across up to 4
 * faces and object fidelity across up to 10 items.
 */
export async function generate({ prompt, referenceImages = [] }) {
    const key = resolveKey(SPEC);

    let response = await call('responseFormat', prompt, referenceImages, key);
    if (response.status === 400) {
        const retry = await call('imageConfig', prompt, referenceImages, key);
        if (retry.ok) {
            console.warn('[gemini] responseFormat rejected; imageConfig accepted. Drop the responseFormat shape.');
        }
        response = retry;
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ImageError(
            `Gemini ${response.status}: ${detail.slice(0, 400)}`,
            response.status,
            SPEC.id
        );
    }

    const result = await response.json();
    const parts = result?.candidates?.[0]?.content?.parts || [];
    const image = parts.find((p) => p.inlineData?.data);

    if (!image) {
        const finish = result?.candidates?.[0]?.finishReason;
        const block = result?.promptFeedback?.blockReason;

        // Gemini refuses with a 200 and simply no image part, so a safety block
        // has to be detected here rather than on the status code.
        if (/SAFETY|PROHIBITED|BLOCK/i.test(`${finish} ${block}`)) {
            const error = new ImageError(
                'Gemini refused this concept on content policy. The art direction asked for ' +
                'something it will not draw. Generate a new concept, or turn off Darker tone.',
                422,
                SPEC.id
            );
            error.contentPolicy = true;
            throw error;
        }

        throw new ImageError(
            `Gemini returned no image (finishReason: ${finish || 'none'}${block ? `, blocked: ${block}` : ''})`,
            502,
            SPEC.id
        );
    }

    return {
        provider: SPEC.id,
        model: SPEC.model,
        mimeType: image.inlineData.mimeType || 'image/png',
        base64: image.inlineData.data,
        size: `${IMAGE_CONFIG.imageSize} ${IMAGE_CONFIG.aspectRatio}`
    };
}
