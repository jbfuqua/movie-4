// The movie concept: schema, prompt, and the deterministic templating step that
// turns a concept into an image prompt.

import { DECADES } from './models.js';

// Strict schema — additionalProperties:false and every field required, which is
// what structured outputs need. Keep it free of minLength/maximum/etc; those
// constraints aren't supported and get stripped.
export const CONCEPT_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'title', 'tagline', 'decade', 'genre', 'synopsis',
        'cast', 'director', 'studio', 'billing', 'art_direction', 'title_treatment'
    ],
    properties: {
        title: {
            type: 'string',
            description: 'Short, striking, original film title, 1-4 words. Titles have a grammar that shifts by decade — the 1950s liked a threat announcing itself ("It Came from Beneath the Sea"), the 2010s liked a single abstract noun ("Arrival"). Use the decade\'s grammar. It will be painted into the art, so avoid characters that are hard to letter.'
        },
        tagline: {
            type: 'string',
            description: 'One line of poster copy, written in the ADVERTISING VOICE of the decade — this is a marketing department talking, not a poet. A 1950s tagline barks at a passer-by in capitals and exclamation marks; a 2010s tagline is quiet, terse, and withholds. Appears on the poster below the title.'
        },
        decade: { type: 'string', enum: DECADES },
        genre: { type: 'string', enum: ['Horror', 'Sci-Fi', 'Fusion'] },
        synopsis: {
            type: 'string',
            description: 'One or two high-concept sentences. Never appears on the poster; it is for the caption.'
        },
        cast: {
            type: 'array',
            description: 'Three or four invented actor names, top-billed first. They must read as working screen actors OF THAT DECADE — a 1950s contract player and a 2020s A-lister have very different names. Invent them; do not use real people.',
            items: { type: 'string' }
        },
        director: {
            type: 'string',
            description: 'Invented director name, plausible for a working director of that decade.'
        },
        studio: {
            type: 'string',
            description: 'Invented production company, plausible for the decade (e.g. "Meridian Pictures").'
        },
        billing: {
            type: 'object',
            additionalProperties: false,
            required: ['style'],
            description: 'How the credits at the foot of the poster are set. A dense billing block is a late-1970s convention; putting one on a 1950s poster is as wrong as setting its title in a modern font.',
            properties: {
                style: {
                    type: 'string',
                    enum: ['sparse', 'classic', 'dense'],
                    description: 'sparse = a few large, widely-tracked names (roughly 1950s-60s). classic = studio, cast and director at moderate size (roughly 1970s-90s). dense = small condensed block of fine print (roughly 2000s on). Choose what the decade actually did.'
                }
            }
        },
        art_direction: {
            type: 'object',
            additionalProperties: false,
            required: ['medium', 'subject', 'environment', 'lighting', 'palette', 'composition'],
            properties: {
                medium: {
                    type: 'string',
                    description: 'The physical production technique of the era, stated as a medium: e.g. "hand-painted gouache one-sheet", "screen-printed offset lithograph", "airbrushed illustration", "photographic composite". This is the single most important field for era authenticity.'
                },
                subject: { type: 'string', description: 'The single focal subject of the artwork.' },
                environment: { type: 'string', description: 'The setting around the subject.' },
                lighting: { type: 'string', description: 'Light quality, direction, and mood.' },
                palette: {
                    type: 'array',
                    description: 'Three to five colors, named in plain language (e.g. "sodium-vapor amber"), not hex.',
                    items: { type: 'string' }
                },
                composition: {
                    type: 'string',
                    description: 'How the frame is arranged. Must leave the lower fifth of the frame visually quiet for a credits block.'
                }
            }
        },
        title_treatment: {
            type: 'object',
            additionalProperties: false,
            required: ['lettering', 'color', 'placement', 'effect'],
            properties: {
                lettering: {
                    type: 'string',
                    description: 'How the title is LETTERED, as an artist would describe it — the era-correct typographic craft. E.g. "hand-painted brush script with uneven sable strokes", "heavy condensed sans, screen-printed with slight misregistration", "chrome-beveled extended caps with an airbrushed neon rim". Never name a web font.'
                },
                color: { type: 'string', description: 'Color/finish of the title lettering.' },
                placement: {
                    type: 'string',
                    enum: ['upper third', 'lower third', 'centered across the middle']
                },
                effect: {
                    type: 'string',
                    description: 'Any treatment on the lettering: drop shadow, outer glow, embossing, grime, none.'
                }
            }
        }
    }
};

export function conceptPrompt({ genre, era, plot, intensity, avoidTitles = [], seed }) {
    const lines = [
        'You are the art director of a film studio that never existed. Invent one film and specify its one-sheet poster.',
        '',
        `Divergence seed: ${seed}. Use it to push away from your first instinct — the obvious title, the obvious image.`
    ];

    lines.push('', 'Constraints:');
    lines.push(era === 'any'
        ? '- Pick any decade from the 1950s to the 2020s.'
        : `- The film is from the ${era}.`);
    lines.push(genre === 'any'
        ? '- Horror, Sci-Fi, or a fusion of the two.'
        : `- Genre: ${genre === 'fusion' ? 'a fusion of Horror and Sci-Fi' : genre}.`);

    if (plot) {
        lines.push(`- Build the entire film around this premise, expanding it rather than restating it: "${plot}"`);
    }

    // "Darker" must mean MORE DREAD, never more gore. Horror posters have never
    // sold gore — Jaws is a swimmer and a shape below her, Alien is an egg. The
    // poster is the moment before. Framing intensity as escalation produced art
    // direction that image-model moderation refused outright, which is the right
    // call: it was also bad poster design.
    lines.push(
        intensity === 'hardcore'
            ? '- Tone: maximum dread. Not gore — dread. The great horror one-sheets terrify through implication, silhouette, scale, wrongness, and absence; they show the moment BEFORE, or the evidence AFTER, never the act. Whatever happens in this film, the poster hung in a public lobby and earns its unease from what it withholds.'
            : '- Tone: eerie and evocative.'
    );

    if (avoidTitles.length) {
        lines.push(
            '',
            'You have recently made these films. Do not repeat their titles, premises, or visual ideas — go somewhere else entirely:',
            ...avoidTitles.slice(0, 12).map((t) => `- ${t}`)
        );
    }

    // The whole conceit is that this film could have existed. That fails on any
    // single anachronism, so every axis has to land in the same decade — not
    // just the artwork. A 1950s picture with a 2020s premise, a 2020s cast list,
    // or a modern billing block reads as a modern pastiche instantly.
    lines.push(
        '',
        'ERA COHERENCE — the film has to be believable as an artifact of its decade, not a modern film wearing its clothes. Every one of these must land in the same year:',
        '- The PREMISE. What a culture was afraid of, and what it thought the future looked like, moved decade by decade. Write the anxiety that decade actually had, not a contemporary one dressed up in period art.',
        '- The TITLE, in that decade\'s naming grammar.',
        '- The TAGLINE, in that decade\'s advertising voice.',
        '- The CAST and DIRECTOR names, as working screen people of that decade.',
        '- The BILLING style at the foot of the poster.',
        '- The ART DIRECTION and TITLE LETTERING, as physical production craft.',
        '',
        'CONTENT REGIME — what a poster was allowed to show is part of the period. Films before roughly 1968 were made under the Production Code: threat is implied, never depicted, and the horror lives in suggestion and shadow. After the ratings system a poster can be bolder in mood — but in EVERY era this is a theatrical one-sheet that hung in a public lobby. The artwork you describe must contain no gore, no blood, no wounds or injury, no corpses, no depicted violence or cruelty, and nothing sexual. Those things are not on posters. Write art direction that a studio could actually have printed.',
        '',
        'The art_direction and title_treatment fields are read by an image model, so write them as an artist briefing another artist: concrete, physical, specific to how posters were actually MADE in that decade. A 1950s title was hand-lettered in paint as part of the artwork; a 1990s title was set in type and composited. Describe the craft, never a font name.'
    );

    return lines.join('\n');
}

/**
 * Turn a concept into an image prompt.
 *
 * Deterministic on purpose: the concept is the creative act, this is plumbing.
 * Literal strings that must render correctly are wrapped in quotes and stated
 * as verbatim requirements, which is what both OpenAI's and Google's prompting
 * guides call for.
 */
export function imagePrompt(concept) {
    const art = concept.art_direction;
    const tt = concept.title_treatment;

    return [
        `A ${concept.decade} ${concept.genre} movie poster, in portrait orientation.`,
        '',
        `MEDIUM: ${art.medium}. The poster must look like it was physically produced this way in the ${concept.decade} — not like a modern digital imitation of the style.`,
        `SUBJECT: ${art.subject}`,
        `ENVIRONMENT: ${art.environment}`,
        `LIGHTING: ${art.lighting}`,
        `PALETTE: ${art.palette.join(', ')}.`,
        `COMPOSITION: ${art.composition}`,
        '',
        'TEXT — render these exactly as written, correctly spelled, with no additional words, letters, or characters anywhere in the image:',
        `1. The title, "${concept.title.toUpperCase()}", set in the ${tt.placement}. Lettering: ${tt.lettering}. Color: ${tt.color}. Effect: ${tt.effect}. The title must be integrated into the artwork as it would have been in the ${concept.decade} — lettered as part of the image, not pasted on top of it.`,
        `2. The tagline, "${concept.tagline}", smaller than the title and clearly subordinate to it.`,
        '',
        'Leave the bottom fifth of the poster visually quiet and uncluttered — a credits block will be placed there. Do not draw any credits, billing block, small print, logos, studio marks, dates, or ratings. No text other than the title and tagline above.',
        '',
        // The concept layer is told to stay publishable, but the image prompt used
        // to relay art_direction verbatim with nothing standing behind it. This is
        // the backstop, stated at the layer that actually gets moderated.
        'This is a theatrical one-sheet for public display. No gore, no blood, no wounds, no injury, no corpses, no depicted violence or cruelty, nothing sexual. Any horror in this image comes from atmosphere, composition, light and implication — never from depicting harm.'
    ].join('\n');
}

/**
 * The billing block, composited as real text. Never trusted to the image model.
 *
 * The `style` comes from the concept, not from a decade lookup — a dense block of
 * fine print is a late-1970s convention, and stamping one on a 1950s poster is
 * the same anachronism as setting its title in a modern font.
 */
const BILLING_STYLES = {
    sparse:  { scale: 1.45, tracking: 0.30, separator: '     ', showStudio: false, directorPrefix: 'DIRECTED BY ' },
    classic: { scale: 1.10, tracking: 0.18, separator: '  ·  ', showStudio: true,  directorPrefix: 'A FILM BY ' },
    dense:   { scale: 0.85, tracking: 0.10, separator: '  ·  ', showStudio: true,  directorPrefix: 'DIRECTED BY ' }
};

export function creditsBlock(concept) {
    const style = BILLING_STYLES[concept.billing?.style] || BILLING_STYLES.classic;
    const cast = (concept.cast || []).map((n) => String(n).toUpperCase());

    return {
        style: concept.billing?.style || 'classic',
        studio: style.showStudio ? `${String(concept.studio || '').toUpperCase()} PRESENTS` : '',
        cast: cast.join(style.separator),
        director: `${style.directorPrefix}${String(concept.director || '').toUpperCase()}`,
        scale: style.scale,
        tracking: style.tracking
    };
}
