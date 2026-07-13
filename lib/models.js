// Central model registry. Every model ID in the app lives here.
//
// The previous version of this app pinned claude-3-5-sonnet-20241022 (retired
// 2025-10-28) and gemini-2.0-flash-exp (retired 2026-06-01) in five different
// files, and kept serving canned fallback data when they 404'd. One list, and
// loud failures, so that can't happen silently again.

export const CLAUDE_MODEL = 'claude-opus-4-8';
export const ANTHROPIC_VERSION = '2023-06-01';

// Who writes the film. Both are schema-constrained, so either one returns a
// CONCEPT_SCHEMA-valid object or throws — the caller cannot tell them apart.
export const TEXT_PROVIDERS = {
    claude: {
        id: 'claude',
        label: 'claude-opus-4-8',
        model: CLAUDE_MODEL,
        envKeys: ['ANTHROPIC_API_KEY'],
        // The better writer, and the reason it was the only option: it reliably
        // takes the "consider several, discard the weak ones" instruction. But
        // adaptive thinking makes it the slower one, and on a 60s function it is
        // the one that runs out of clock.
        note: 'Adaptive thinking. The stronger writer, but the one that stalls.'
    },
    openai: {
        id: 'openai',
        label: 'gpt-5.6-terra',
        // NOT the bare "gpt-5.6" alias — that resolves to gpt-5.6-sol, the
        // frontier tier ($5/$30 per MTok), which is the slowest of the three and
        // is built for "complex professional work". Inventing a pulp horror
        // premise is not that. Terra balances intelligence and cost; drop to
        // gpt-5.6-luna via OPENAI_TEXT_MODEL if this is still too slow.
        model: 'gpt-5.6-terra',
        modelEnv: 'OPENAI_TEXT_MODEL',
        envKeys: ['OPENAI_API_KEY'],
        // The escape hatch for when Claude is stalling. Reasoning effort is a
        // fixed dial rather than adaptive, so latency is far more predictable.
        note: 'Fixed reasoning effort. Faster and steadier under the 60s limit.'
    }
};

// Proofreading the finished poster is a vision call and stays on Claude
// regardless of who wrote the film — see api/verify-poster.js.

// TEXT_PROVIDER, like IMAGE_PROVIDER, is resolved per request in
// ./text/index.js → defaultTextProvider(), never read at import.

export const IMAGE_PROVIDERS = {
    gemini: {
        id: 'gemini',
        label: 'gemini-3.1-flash-image',
        model: 'gemini-3.1-flash-image',
        envKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
        // Cheaper, and takes up to 14 reference images with explicit character
        // consistency — the path to a recurring cast / house style.
        supportsMaskEdit: false,
        supportsReferenceImages: true,
        qualities: null, // Gemini has no quality knob; resolution is fixed at 2K
        defaultQuality: null,
        approxCostUsd: 0.101 // 2K, 2:3
    },
    openai: {
        id: 'openai',
        label: 'gpt-image-2',
        model: 'gpt-image-2',
        envKeys: ['OPENAI_API_KEY'],
        // Strongest in-image text rendering, and the only provider with a
        // mask-based edit endpoint for repairing a garbled title in place.
        supportsMaskEdit: true,
        supportsReferenceImages: true,
        // Quality is a real lever here: high is 4x the price of medium AND too
        // slow for a 60s serverless function (it 504s). Medium is the default.
        qualities: ['low', 'medium', 'high'],
        defaultQuality: 'medium',
        approxCostUsd: 0.041 // 1024x1536, quality: medium (high is 0.165)
    }
};

// IMAGE_PROVIDER is deliberately NOT read here. Provider selection is resolved
// per request in ./image/index.js → defaultProvider(), which honours the pin if
// set and otherwise picks whichever provider actually has a key. Hard-defaulting
// to a provider you haven't configured is a 500 on the first request.

export const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
export const GENRES = ['Horror', 'Sci-Fi', 'Fusion'];
