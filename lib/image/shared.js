import { IMAGE_PROVIDERS } from '../models.js';

export class ImageError extends Error {
    constructor(message, status, provider) {
        super(message);
        this.name = 'ImageError';
        this.status = status;
        this.provider = provider;
    }
}

export function resolveKey(spec) {
    for (const name of spec.envKeys) {
        if (process.env[name]) return process.env[name];
    }
    throw new ImageError(
        `No API key for ${spec.label}. Set ${spec.envKeys.join(' or ')}.`,
        500,
        spec.id
    );
}

export function hasKey(spec) {
    return spec.envKeys.some((name) => Boolean(process.env[name]));
}

export function providerSpec(id) {
    const spec = IMAGE_PROVIDERS[id];
    if (!spec) {
        throw new ImageError(
            `Unknown image provider "${id}". Known: ${Object.keys(IMAGE_PROVIDERS).join(', ')}.`,
            400,
            id
        );
    }
    return spec;
}
