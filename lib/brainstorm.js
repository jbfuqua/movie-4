// The idea-picker: pitch many, cut hard.
//
// This is the prototype for the rethink. Instead of one mega-prompt one-shotting
// a whole concept, we generate a SLATE of cheap one-line ideas — each forced onto
// a different monster mechanism, so they cannot converge — and then a separate,
// deliberately brutal critic ranks them and keeps the one with a live wire. The
// quality comes from selection, not from a longer brief.
//
// Nothing here writes final copy or art direction. It answers one question: are
// the IDEAS good and varied, and can a critic tell the good ones from the rest.

import { MONSTER_MECHANISMS } from './concept.js';
import { canonBlock } from './canon.js';

export const PITCH_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['ideas'],
    properties: {
        ideas: {
            type: 'array',
            description: 'One idea per mechanism given, in the same order.',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['title', 'monster', 'logline'],
                properties: {
                    title: { type: 'string', description: 'A working title. Not the object\'s name; the dread it carries. Vary the shape idea to idea.' },
                    monster: { type: 'string', description: 'What the creature/killer/thing IS, in a few concrete words.' },
                    logline: { type: 'string', description: 'ONE sentence: a specific person, a specific situation, and the concrete thing the monster does to people. It must frighten said plainly. No fog.' }
                }
            }
        }
    }
};

export const CRITIQUE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['verdicts', 'winner', 'why'],
    properties: {
        verdicts: {
            type: 'array',
            description: 'One verdict per idea, in the order given.',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['score', 'note'],
                properties: {
                    score: { type: 'integer', description: '1-10. 7+ means you would actually greenlight it. Most ideas are not a 7. Use the whole range and be stingy at the top.' },
                    note: { type: 'string', description: 'One brutal, specific line. What is alive or dead about it. No hedging.' }
                }
            }
        },
        winner: { type: 'integer', description: '0-based index of the single best idea.' },
        why: { type: 'string', description: 'One line: the live wire this one has that the others lack.' }
    }
};

export function pitchPrompt({ era, genre, count, avoidTitles = [] }) {
    // Give it the whole mechanism pool and demand one idea per mechanism, so the
    // slate is varied by construction rather than by luck.
    const mechanisms = MONSTER_MECHANISMS.slice(0, count);

    const lines = [
        'You are the ideas room at a studio that makes MONSTER PICTURES — creature features, slashers, alien invasions, body horror, demon-machine pulp. Pitch fast and pitch dirty. These are one-line pitches, not finished films.',
        '',
        'THE BAR. These real films are the level to reach for — lean, specific, a real monster, and a hook a stranger would buy a ticket on. Do not reuse their titles, monsters, or premises; match their QUALITY, not their content:',
        canonBlock(),
        '',
        `Pitch exactly ${count} ideas. Each one is built on a DIFFERENT monster, and I am handing you the ${count} kinds so no two of your ideas are the same film. Idea N uses mechanism N:`,
        ...mechanisms.map((m, i) => `  ${i + 1}. ${m}`),
        '',
        'For each: a working title, what the monster IS in a few concrete words, and a ONE-sentence logline with a specific person, a specific situation, and the concrete physical thing the monster does to people. Commit to it. The failure is the tasteful conceptual scare with no creature in it — a haunted gadget, an ominous signal, "a presence". Nobody buys a ticket to a GPS. Give a real thing with a face and an appetite.'
    ];

    if (era && era !== 'any') lines.push('', `All ${count} are films of the ${era}.`);
    if (genre && genre !== 'any') {
        const g = genre === 'fusion' ? 'a fusion of Horror and Sci-Fi' : genre;
        lines.push('', `Genre: ${g}.`);
    }
    if (avoidTitles.length) {
        lines.push('', 'This studio has already released these — do not repeat their titles, shapes, or premises:', ...avoidTitles.slice(0, 30).map((t) => `- ${t}`));
    }

    return lines.join('\n');
}

export function critiquePrompt({ ideas }) {
    return [
        'You are a development executive who has read ten thousand horror pitches and greenlit nine. You are jaded, specific, and hard to impress. Most pitches are forgettable and you say so.',
        '',
        'THE BAR is these films — a new pitch has to be able to sit on the shelf beside them without embarrassment:',
        canonBlock(),
        '',
        'Here is today\'s slate. Score each 1-10 (7+ means you would actually greenlight it; be stingy — most are not a 7). In one brutal line, say what is alive or dead about it. Reward a specific, visceral monster and a hook with a live wire; punish the generic, the vague, the tasteful, and anything you have seen before. Then name the single one you would make.',
        '',
        ...ideas.map((idea, i) => `${i}. "${idea.title}" — ${idea.monster}. ${idea.logline}`),
        '',
        'Do not be kind. The point is to find the one worth making, not to encourage anyone.'
    ].join('\n');
}
