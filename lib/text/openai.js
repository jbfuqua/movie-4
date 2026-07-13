// gpt-5.6 via OpenAI's Responses API, with strict structured outputs.
//
// Same contract as ./claude.js: pass a schema, get back an object that matches
// it, or an error. strict:true is a hard constraint at the decoder — the model
// cannot emit a non-conforming object — so there is no parse ladder here either.

import { TEXT_PROVIDERS } from '../models.js';
import { TextError, resolveKey, resolveModel } from './shared.js';

const SPEC = TEXT_PROVIDERS.openai;

const DEADLINE_MS = 50_000;

// Reasoning tokens are billed against max_output_tokens on this API — unlike
// Anthropic's max_tokens, which bounds only the visible answer. Without this
// headroom the model thinks its way through the whole budget and the response
// comes back truncated with an empty output.
const REASONING_HEADROOM = 6000;

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

    const input = content || prompt;
    if (typeof input !== 'string') {
        // Vision blocks are Claude-shaped; proofreading still runs on Claude.
        throw new TextError(`${SPEC.label} is wired for text prompts only here`, 400, SPEC.id);
    }

    // Claude gets its scratch space from adaptive thinking; here it is an
    // explicit dial. `think: false` means none, which is also the fast path.
    const reasoningEffort = think ? effort : 'none';

    const body = {
        model: resolveModel(SPEC),
        input,
        reasoning: { effort: reasoningEffort },
        max_output_tokens: maxTokens + (reasoningEffort === 'none' ? 0 : REASONING_HEADROOM),
        text: {
            format: {
                type: 'json_schema',
                name: 'concept',
                strict: true,
                schema
            }
        }
    };

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), deadlineMs);

    let response;
    try {
        response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${key}`
            },
            body: JSON.stringify(body),
            signal: abort.signal
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new TextError(
                `${resolveModel(SPEC)} did not respond within ${deadlineMs / 1000}s. `
                + 'If this was the first run with this schema, OpenAI was compiling it into a grammar — that is a one-off cost and it is cached for 24h, so try again.',
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
            `OpenAI API ${response.status}: ${detail.slice(0, 400)}`,
            response.status,
            SPEC.id
        );
    }

    const result = await response.json();

    if (result.status === 'incomplete') {
        throw new TextError(
            `Response truncated (${result.incomplete_details?.reason || 'unknown'}) — raise maxTokens`,
            500,
            SPEC.id
        );
    }

    const message = result.output?.find((item) => item.type === 'message');

    const refusal = message?.content?.find((block) => block.type === 'refusal');
    if (refusal) {
        throw new TextError(`${SPEC.label} declined this request: ${refusal.refusal}`, 422, SPEC.id);
    }

    const text = message?.content?.find((block) => block.type === 'output_text')?.text;
    if (!text) throw new TextError('No output text in OpenAI response', 502, SPEC.id);

    // Guaranteed parseable: strict mode enforced the schema at decode time.
    return JSON.parse(text);
}

/**
 * Pay the grammar-compilation cost up front, off the user's critical path.
 *
 * strict:true means OpenAI compiles the schema into a context-free grammar and
 * masks invalid tokens as it samples. That compile happens on the FIRST request
 * carrying a given schema — under 10s for a simple one, but up to a minute for
 * something the size of CONCEPT_SCHEMA — and the result is then cached for 24h.
 * Paid inside a 52s generate call, it is a 504. Paid here while the user is
 * still choosing a genre, it is free.
 *
 * The request is deliberately crippled: no reasoning, and an output budget too
 * small to finish. The response comes back `incomplete` and we throw it away.
 * The compile happens before sampling, so the grammar is cached regardless.
 * Never throws — a failed warm just means the next real call pays full price.
 */
export async function warm(schema, deadlineMs = 55_000) {
    const started = Date.now();

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), deadlineMs);

    try {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${resolveKey(SPEC)}`
            },
            body: JSON.stringify({
                model: resolveModel(SPEC),
                input: 'warm',
                reasoning: { effort: 'none' },
                max_output_tokens: 16,
                text: { format: { type: 'json_schema', name: 'concept', strict: true, schema } }
            }),
            signal: abort.signal
        });

        return { ok: response.ok, ms: Date.now() - started };
    } catch (error) {
        return { ok: false, ms: Date.now() - started, error: error.message };
    } finally {
        clearTimeout(timer);
    }
}
