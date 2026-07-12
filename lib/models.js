// Central model registry. Every model ID in the app lives here.
//
// The previous version of this app pinned claude-3-5-sonnet-20241022 (retired
// 2025-10-28) and gemini-2.0-flash-exp (retired 2026-06-01) in five different
// files, and kept serving canned fallback data when they 404'd. One list, and
// loud failures, so that can't happen silently again.

export const CLAUDE_MODEL = 'claude-opus-4-8';
export const ANTHROPIC_VERSION = '2023-06-01';

export const IMAGE_PROVIDERS = {
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
    },
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
    }
};

// IMAGE_PROVIDER is deliberately NOT read here. Provider selection is resolved
// per request in ./image/index.js → defaultProvider(), which honours the pin if
// set and otherwise picks whichever provider actually has a key. Hard-defaulting
// to a provider you haven't configured is a 500 on the first request.

export const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
export const GENRES = ['Horror', 'Sci-Fi', 'Fusion'];
