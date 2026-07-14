// The test screening.
//
// The writer is a bad judge of its own copy — it just spent a long brief talking
// itself into this title, and it is attached to it. So the copy is shown to
// someone who was not in the room: a person in a cinema lobby with money in
// their pocket and no obligation to be kind.
//
// This is deliberately a SEPARATE API call. A "now critique yourself" instruction
// tacked onto the end of the concept prompt inherits the whole brief and just
// agrees with itself. A fresh call sees the title and the tagline cold, exactly
// as a stranger walking past the poster would, and that is the entire point.

import { copyRules, toneSpec } from './concept.js';

export const AUDIENCE_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['verdict', 'reaction', 'problems', 'title', 'tagline', 'changed'],
    properties: {
        verdict: {
            type: 'string',
            enum: ['buy', 'curious', 'walk_past'],
            description: 'Your honest reaction to the poster as you pass it. buy = you would pay to see this. curious = it caught you, but you would probably not spend the money. walk_past = it did not stop you at all. Be honest; most posters are walk_past.'
        },
        reaction: {
            type: 'string',
            description: 'One or two sentences, in YOUR voice, as the person in the lobby. What the title and tagline actually made you feel or think. Plain speech, not criticism-speak. If it left you cold, say that.'
        },
        problems: {
            type: 'array',
            items: { type: 'string' },
            description: 'What is wrong with the title and the tagline, concretely. Empty array if they are genuinely good — do not invent faults to look useful.'
        },
        title: {
            type: 'string',
            description: 'The FINAL title. If the original was good, return it unchanged. If not, this is the better one.'
        },
        tagline: {
            type: 'string',
            description: 'The FINAL tagline. If the original was good, return it unchanged. If not, this is the better one.'
        },
        changed: {
            type: 'boolean',
            description: 'True if you replaced either the title or the tagline. False if you kept both exactly as they were.'
        }
    }
};

export function audiencePrompt(concept, tone) {
    const toneRules = toneSpec(tone);

    return [
        'You are going to do two jobs, in order, and you must finish the first one honestly before you start the second.',
        '',
        '=== JOB ONE: you are a person in a cinema lobby ===',
        '',
        `It is the ${concept.decade}. You are standing in the foyer with enough money for one ticket, and there are five other posters on this wall competing for it. You are not a critic. You have never heard of this film. You do not know or care who made it, and nobody is asking you to be encouraging.`,
        '',
        'You look at this one:',
        '',
        `  TITLE:   ${concept.title}`,
        `  TAGLINE: ${concept.tagline}`,
        '',
        `  (The film, which you do NOT know yet: ${concept.synopsis})`,
        `  (Genre: ${concept.genre}. Tone of the picture: ${toneRules.label}.)`,
        '',
        'React honestly. Does that title make you want to see the film, or is it just a phrase on a wall? Does the tagline grab you by the collar, or do your eyes slide off it? Would you actually hand over the money?',
        '',
        'Be a hard marker. Most posters do not stop anybody — "walk_past" is the honest answer far more often than not, and a soft yes here is useless to everyone. In particular, say so plainly if the copy is:',
        '  - goofy, corny, or trying too hard to be clever;',
        '  - winking at you, or pleased with itself;',
        '  - pretty but empty — a mood with nothing underneath it;',
        '  - a flat description of the plot, which tells you what happens and gives you no reason to care.',
        '',
        '=== JOB TWO: you are the agency copywriter ===',
        '',
        'You have just been handed that reaction from the test screening. It is not a negotiation — the audience does not care about your feelings, and they are the ones with the money.',
        '',
        'If the copy genuinely landed, keep it. Say so, set changed to false, and return the title and tagline exactly as they were. Do NOT fiddle with copy that works just to look busy — a needless rewrite is a worse failure than leaving it alone.',
        '',
        'If it did not land, write the one that does. Same film, same tone, same decade. Fix the copy, never the film — the premise, the cast, the art direction and the decade are all settled and are not yours to touch.',
        ...copyRules(tone),
        '',
        'Return the FINAL title and tagline — the ones that are actually going on the poster.'
    ].join('\n');
}
