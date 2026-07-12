// Claude client. Every call goes through structured outputs, so the response is
// schema-valid by construction — no regex JSON scraping, no parse ladder.

import { CLAUDE_MODEL, ANTHROPIC_VERSION } from './models.js';

export class ClaudeError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ClaudeError';
        this.status = status;
    }
}

export function anthropicKey() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new ClaudeError('ANTHROPIC_API_KEY is not set', 500);
    return key;
}

/**
 * Call Claude and get back an object matching `schema`.
 *
 * `output_config.format` constrains generation to the schema, so the only
 * failure modes left are network, auth, and refusal — all of which throw.
 */
export async function structured({ prompt, schema, content, maxTokens = 2000 }) {
    const messages = [{
        role: 'user',
        content: content || prompt
    }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': anthropicKey(),
            'anthropic-version': ANTHROPIC_VERSION
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            output_config: { format: { type: 'json_schema', schema } },
            messages
        })
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new ClaudeError(
            `Anthropic API ${response.status}: ${detail.slice(0, 400)}`,
            response.status
        );
    }

    const result = await response.json();

    if (result.stop_reason === 'refusal') {
        throw new ClaudeError('Claude declined this request', 422);
    }
    if (result.stop_reason === 'max_tokens') {
        throw new ClaudeError('Response truncated — raise maxTokens', 500);
    }

    const text = result.content?.find((b) => b.type === 'text')?.text;
    if (!text) throw new ClaudeError('No text block in Claude response', 502);

    // Guaranteed parseable: the schema was enforced server-side.
    return JSON.parse(text);
}

/** Build an image content block for vision calls. */
export function imageBlock(base64, mediaType = 'image/png') {
    return {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 }
    };
}
