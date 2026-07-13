import { TEXT_PROVIDERS } from '../models.js';

export class TextError extends Error {
    constructor(message, status, provider) {
        super(message);
        this.name = 'TextError';
        this.status = status;
        this.provider = provider;
    }
}

export function resolveKey(spec) {
    for (const name of spec.envKeys) {
        if (process.env[name]) return process.env[name];
    }
    throw new TextError(
        `No API key for ${spec.label}. Set ${spec.envKeys.join(' or ')}.`,
        500,
        spec.id
    );
}

export function hasKey(spec) {
    return spec.envKeys.some((name) => Boolean(process.env[name]));
}

export function providerSpec(id) {
    const spec = TEXT_PROVIDERS[id];
    if (!spec) {
        throw new TextError(
            `Unknown text provider "${id}". Known: ${Object.keys(TEXT_PROVIDERS).join(', ')}.`,
            400,
            id
        );
    }
    return spec;
}
