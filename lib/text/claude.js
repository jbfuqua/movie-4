// Claude via the Messages API. Every call goes through structured outputs, so
// the response is schema-valid by construction — no regex JSON scraping, no
// parse ladder.

import { TEXT_PROVIDERS, ANTHROPIC_VERSION } from '../models.js';
import { TextError, resolveKey } from './shared.js';

const SPEC = TEXT_PROVIDERS.claude;

// Bail before the platform does. A serverless function is killed at 60s and
// returns a bare 504 with no explanation; this returns a JSON error that says
// what happened.
const DEADLINE_MS = 50_000;

/**
 * Call Claude and get back an object matching `schema`.
 *
 * `output_config.format` constrains generation to the schema, so the only
 * failure modes left are network, auth, and refusal — all of which throw.
 */
export async function structured({
    prompt,
    schema,
    content,
    maxTokens = 2000,
    think = false,
    effort = 'medium',
    deadlineMs = DEADLINE_MS
}) {
    const key = resolveKey(SPEC);

    // Without this, the model generates straight into the JSON schema in a single
    // pass — so any instruction of the form "consider several options and discard
    // the weak ones" is dead text, because there is nowhere to do the considering.
    // Creative work needs the scratch space.
    const body = {
        model: SPEC.model,
        max_tokens: maxTokens,
        output_config: { format: { type: 'json_schema', schema }, effort },
        messages: [{ role: 'user', content: content || prompt }]
    };
    if (think) body.thinking = { type: 'adaptive' };

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), deadlineMs);

    let response;
    try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': key,
                'anthropic-version': ANTHROPIC_VERSION
            },
            body: JSON.stringify(body),
            signal: abort.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new TextError(
                `${SPEC.label} did not respond within ${deadlineMs / 1000}s. Switch the writer to ${TEXT_PROVIDERS.openai.label}, or lower the effort.`,
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
        throw new TextError(
            `Anthropic API ${response.status}: ${detail.slice(0, 400)}`,
            response.status,
            SPEC.id
        );
    }

    const result = await response.json();

    if (result.stop_reason === 'refusal') {
        throw new TextError('Claude declined this request', 422, SPEC.id);
    }
    if (result.stop_reason === 'max_tokens') {
        throw new TextError('Response truncated — raise maxTokens', 500, SPEC.id);
    }

    const text = result.content?.find((b) => b.type === 'text')?.text;
    if (!text) throw new TextError('No text block in Claude response', 502, SPEC.id);

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
