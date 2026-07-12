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
        'cast', 'director', 'studio', 'crew', 'billing', 'art_direction', 'title_treatment'
    ],
    properties: {
        title: {
            type: 'string',
            description: 'Original film title, 1-4 words. Titles have a grammar that shifts by decade — the 1950s liked a threat announcing itself ("It Came from Beneath the Sea"), the 2010s liked a single flat noun ("Arrival"). Use the decade\'s grammar. A studio picked this to sell tickets, so it is direct, not clever: avoid the portentous poetic construction ("The Listening Room", "The Quiet Below"), which reads as a literary short story, not a film a studio released. It will be painted into the art, so avoid characters that are hard to letter.'
        },
        tagline: {
            type: 'string',
            description: 'ADVERTISING COPY, written by a studio marketing department to sell a ticket to a stranger walking past the theatre. It is not a line of poetry and not a line from the script. Plain words, said plainly. It should still land if it were shouted across a street. A 1950s tagline barks at the passer-by; a 2010s tagline is flat and withholding. NEVER literary: no em-dashes, no semicolons, no poetic inversion, no abstract nouns doing the work ("the silence remembers you"), no second-person mysticism. If it sounds like a writer wrote it, it is wrong — a copywriter wrote it, and he had a deadline.'
        },
        decade: { type: 'string', enum: DECADES },
        genre: { type: 'string', enum: ['Horror', 'Sci-Fi', 'Fusion'] },
        synopsis: {
            type: 'string',
            description: 'One or two high-concept sentences. Never appears on the poster; it is for the caption.'
        },
        cast: {
            type: 'array',
            description: 'Three or four invented actor names, top-billed first. ORDINARY NAMES. See the casting rule in the instructions — a name that is fun to read is wrong. Invent them; never use a real person.',
            items: { type: 'string' }
        },
        director: {
            type: 'string',
            description: 'Invented director name. Ordinary and forgettable, per the casting rule. Never thematically apt.'
        },
        studio: {
            type: 'string',
            description: 'Invented production company, plausible for the decade (e.g. "Meridian Pictures").'
        },
        crew: {
            type: 'object',
            additionalProperties: false,
            required: [
                'production_company', 'producers', 'executive_producers', 'screenplay',
                'composer', 'cinematographer', 'editor', 'production_designer',
                'costume_designer', 'casting_director'
            ],
            description: 'The invented crew for the billing block. Every name follows the casting rule in the instructions: ordinary, forgettable, right for the birth cohort. Crew names especially — nobody reads them, and a colourful one is instantly a tell.',
            properties: {
                production_company: { type: 'string', description: 'Distinct from the studio — e.g. "A Cyclorama Production".' },
                producers: { type: 'array', items: { type: 'string' } },
                executive_producers: { type: 'array', items: { type: 'string' } },
                screenplay: { type: 'array', items: { type: 'string' }, description: 'Screenwriter(s).' },
                composer: { type: 'string' },
                cinematographer: { type: 'string' },
                editor: { type: 'string' },
                production_designer: { type: 'string' },
                costume_designer: { type: 'string' },
                casting_director: { type: 'string' }
            }
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
                    description: 'sparse = a few large, widely-tracked star names and little else (roughly 1950s-60s). classic = studio, cast, and a modest crew block (roughly 1970s-90s). dense = the full crushed billing block of ultra-condensed fine print (roughly 2000s on). Choose what the decade actually did.'
                }
            }
        },
        art_direction: {
            type: 'object',
            additionalProperties: false,
            required: ['medium', 'process', 'reproduction', 'artifact', 'subject', 'environment', 'lighting', 'palette', 'composition'],
            properties: {
                medium: {
                    type: 'string',
                    description: 'The physical production technique of the era, stated as a medium: e.g. "hand-painted gouache one-sheet", "screen-printed offset lithograph", "airbrushed illustration", "photographic composite". This is the single most important field for era authenticity.'
                },
                process: {
                    type: 'string',
                    description: 'The TOOL AND SURFACE the original art was made with, and the marks that leaves. Painted: name the paint, the ground, and the handling ("gouache and casein on illustration board, visible sable brushwork, dry-brush texture in the shadows, slightly ragged edges where colors meet"). Photographic: name the camera, film stock, lens and lighting apparatus ("shot on 35mm Kodak 5247, 85mm lens at f/2, hot-lit with a single fresnel key, visible grain in the shadows"). Be specific enough that the physical marks of the tool are unavoidable.'
                },
                reproduction: {
                    type: 'string',
                    description: 'How the artwork was PRINTED for distribution, and the artifacts printing leaves: e.g. "four-color offset lithograph, visible halftone rosette, slight registration misalignment on the red plate, ink slightly bled into uncoated stock". Pre-digital printing is imperfect, and its imperfections are most of what makes a period poster read as real.'
                },
                artifact: {
                    type: 'string',
                    description: 'The PHYSICAL CONDITION of the surviving object we are looking at: paper tooth, sheen, age, wear. e.g. "a well-preserved but not mint one-sheet, faint fold lines, slight edge wear, colors a little sun-faded, matte uncoated paper catching a soft raking light". This is what makes the result read as a photograph of a real thing rather than a render.'
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

/**
 * Formal constraints, drawn at random, one per poster.
 *
 * These are NOT the content themes this app used to carry (a 110-entry lottery
 * of "bone libraries (symbolic)" and the like). Those dictated the *subject* and
 * substituted for the model's imagination. These dictate *form* — they remove
 * the default composition and force the model somewhere it wouldn't have gone.
 * Closer to an Oblique Strategy than a lookup table.
 *
 * This matters because Opus 4.8 has no temperature: with identical inputs it
 * converges on its favourite answer. A prompt-level provocation is the only real
 * lever left, and an integer "seed" is not one.
 */
const PROVOCATIONS = [
    'The focal subject is not a human being.',
    'No face is visible anywhere in the image.',
    'The threat is off-frame. We see only its effect.',
    'The composition is dominated by empty space.',
    'The point of view is from directly above, looking down.',
    'A single isolated object fills the frame.',
    'The horror is in the landscape. There is no figure in it.',
    'The only light source is a practical one visible inside the frame.',
    'The subject is seen through something — glass, fabric, water, smoke.',
    'The subject is a crowd or a multitude, not an individual.',
    'Scale is the subject: something is vastly too large, or too small.',
    'It is an interior, and the interior is wrong.',
    'The symmetry is so exact that it is unsettling.',
    'The subject has its back to us.',
    'Something is where it should not be, and nothing else is unusual.'
];

export function conceptPrompt({ genre, era, plot, intensity, avoidTitles = [], seed }) {
    const provocation = PROVOCATIONS[seed % PROVOCATIONS.length];

    // A user-supplied premise outranks everything. This needs saying explicitly,
    // because the anti-repetition machinery below was written to push the model
    // AWAY from what it just made — and once a premise had been used once, that
    // machinery started pushing it away from the user's own premise. The premise
    // is the one thing here the user actually chose; it wins.
    const lines = [
        'You are the art director of a film studio that never existed. Invent one film and specify its one-sheet poster.'
    ];

    if (plot) {
        lines.push(
            '',
            'THE PREMISE — THIS IS THE FILM. It was handed to you and it is not negotiable. Everything else in this brief serves it. Do not replace it, do not drift from it, and do not look for a cleverer idea:',
            `"${plot}"`,
            '',
            'Expand it into a real film — find the images in it, and the dread in it — but the film you deliver must be recognisably THIS film.'
        );
    }

    lines.push(
        '',
        // Self-diversification. The first idea a model reaches for is, by
        // definition, the modal one — which is how the same title comes back.
        // With a premise supplied, this must apply to the EXECUTION only, or it
        // becomes an instruction to discard the premise.
        plot
            ? 'The premise is fixed. What must be fresh is everything else: the title, the angle into the story, the image on the poster. The first ones that occur to you are the ones that occur to everyone — reach past them.'
            : 'Before you commit: the first title and image that occur to you are the ones that occur to everyone. Think of three films you could make here, discard the two most predictable, and make the third.',
        '',
        plot
            ? `FORMAL CONSTRAINT — a lens on the film you have been given, not a licence to make a different one. Find the way this premise satisfies it: ${provocation}`
            : `FORMAL CONSTRAINT for this poster — obey it, and let it push the film somewhere you would not otherwise have gone: ${provocation}`
    );

    lines.push('', 'Constraints:');
    lines.push(era === 'any'
        ? '- Pick any decade from the 1950s to the 2020s.'
        : `- The film is from the ${era}.`);
    lines.push(genre === 'any'
        ? '- Horror, Sci-Fi, or a fusion of the two.'
        : `- Genre: ${genre === 'fusion' ? 'a fusion of Horror and Sci-Fi' : genre}.`);

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
            // With a premise supplied, the user is DELIBERATELY returning to the
            // same idea — so "avoid the same premise" is precisely wrong here. Only
            // the execution must differ.
            plot
                ? 'ALREADY MADE — this studio has released these. You are deliberately returning to the premise above, so a similar premise is expected and correct. What must NOT repeat is the execution: do not reuse these titles, these naming patterns, or these central images. Same film, told differently.'
                : 'ALREADY MADE — this studio has released all of these. Do not remake any of them. Avoid not just these exact titles but their shape: the same naming pattern, the same premise, the same central image. If your idea is a cousin of one of these, throw it out and start again.',
            ...avoidTitles.slice(0, 30).map((t) => `- ${t}`)
        );
    }

    // Names and taglines were coming out as parody — "Cornelius Ashworth-Bramwell"
    // directing, taglines like poetry. The cause is over-signification: the model
    // reaches for MEMORABLE, because it is trying to be creative. But real film
    // credits are boring, and real ad copy is blunt. Both need a mechanical rule,
    // because "be plausible" demonstrably does not work.
    lines.push(
        '',
        'CASTING — the names on a real poster are dull. Richard Carlson. Barbara Rush. Kenneth Tobey. You skim past them. Invent names with that quality:',
        '- WORK OUT THE BIRTH COHORT. Someone starring in a film is usually born about thirty years before it. A 1955 star was born around 1925, so their first name is an ordinary first name for a baby born in 1925. Do that arithmetic for this film\'s decade, and take the given names from the top of that era\'s baby names, not from the interesting end.',
        '- Surnames: ordinary, unremarkable, the kind that fill a phone book.',
        '- If a name is fun to read, it is WRONG. Delete it and pick a duller one.',
        '- Forbidden: names that mean something (no horror director called Damien Graves), alliteration, aristocratic double-barrels, gothic flourishes (Cornelius, Bartholomew, Wolfgang, Vaillancourt), anything that sounds invented for a story. These are people, not characters.',
        '- The crew names follow exactly the same rule. Nobody notices a director of photography\'s name, and that is the point.',
        '',
        'THE TAGLINE — a copywriter in the marketing department wrote this, in an afternoon, to sell a ticket. Not a novelist. Plain words. It has to work on a stranger crossing the street. No em-dashes, no semicolons, no poetry, no abstract nouns doing the heavy lifting. If it sounds beautiful, throw it away and write the blunt version.',
        ''
    );

    // The whole conceit is that this film could have existed. That fails on any
    // single anachronism, so every axis has to land in the same decade — not
    // just the artwork. A 1950s picture with a 2020s premise, a 2020s cast list,
    // or a modern billing block reads as a modern pastiche instantly.
    lines.push(
        '',
        'ERA COHERENCE — the film has to be believable as an artifact of its decade, not a modern film wearing its clothes. Every one of these must land in the same year:',
        plot
            ? '- The PREMISE. Keep the premise you were given, but root it in what that decade was actually afraid of — tell it with the technology, the institutions and the anxieties the period really had.'
            : '- The PREMISE. What a culture was afraid of, and what it thought the future looked like, moved decade by decade. Write the anxiety that decade actually had, not a contemporary one dressed up in period art.',
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
        // The single most important line. Asking for "a movie poster" gets a clean
        // digital picture OF a poster — which is the whole "AI-generated" tell.
        // Asking for a PHOTOGRAPH OF A PHYSICAL OBJECT forces the model to render
        // ink, paper, print error and age: the things a render doesn't have.
        `A photograph of an original ${concept.decade} ${concept.genre} movie poster — a real printed one-sheet, physically produced at the time, photographed flat. Portrait orientation.`,
        '',
        'THE ARTWORK ON THE POSTER',
        `Medium: ${art.medium}`,
        `Subject: ${art.subject}`,
        `Environment: ${art.environment}`,
        `Lighting: ${art.lighting}`,
        `Palette: ${art.palette.join(', ')}.`,
        `Composition: ${art.composition}`,
        '',
        'HOW IT WAS PHYSICALLY MADE — this is not decoration, it is the point. Every mark of the tool must be visible in the final image:',
        `Original art: ${art.process}`,
        `Printing: ${art.reproduction}`,
        `The object itself: ${art.artifact}`,
        '',
        'TEXT — render these exactly as written, correctly spelled, with no additional words, letters, or characters anywhere in the image:',
        `1. The title, "${concept.title.toUpperCase()}", set in the ${tt.placement}. Lettering: ${tt.lettering}. Color: ${tt.color}. Effect: ${tt.effect}. The title was produced by the same hand and the same process as the artwork — lettered into the image, printed with it, not pasted on top of it.`,
        `2. The tagline, "${concept.tagline}", smaller than the title and clearly subordinate to it.`,
        '',
        // Roomier than before: a real billing block needs more than a fifth.
        'Leave the bottom quarter of the poster visually quiet and uncluttered — a credits block will be placed there. Do not draw any credits, billing block, small print, logos, studio marks, dates, or ratings. No text other than the title and tagline above.',
        '',
        'DO NOT make this look like a modern digital illustration. No airbrushed digital smoothness, no CGI sheen, no glossy plastic surfaces, no hyperreal detail, no even ambient render lighting, no perfect symmetry, no clean vector edges. It is ink on paper, made by hand with physical tools, printed on a real press, and it has the flaws of all three.',
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
 * A real billing block is a WALL — studio, production company, the cast, then the
 * crushed crawl of composer, cinematographer, editor, designers, casting,
 * producers and writers. That density is most of what makes a poster read as a
 * poster. Two lines reads as a mockup.
 *
 * The style comes from the concept, not a decade lookup: the dense crawl is a
 * late-1970s convention, and stamping one on a 1950s poster is the same
 * anachronism as setting its title in a modern font.
 */
const BILLING_STYLES = {
    sparse:  { scale: 1.30, tracking: 0.26, separator: '     ' },
    classic: { scale: 1.00, tracking: 0.16, separator: '   ·   ' },
    dense:   { scale: 0.80, tracking: 0.08, separator: '   ·   ' }
};

const up = (s) => String(s ?? '').toUpperCase();
const list = (a) => (Array.isArray(a) ? a : []).map(up).filter(Boolean);
const and = (a) => {
    const items = list(a);
    if (items.length <= 1) return items[0] || '';
    return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
};

export function creditsBlock(concept) {
    const styleKey = concept.billing?.style || 'classic';
    const style = BILLING_STYLES[styleKey] || BILLING_STYLES.classic;
    const crew = concept.crew || {};

    const cast = list(concept.cast);
    const director = up(concept.director);
    const studio = up(concept.studio);

    // Discrete lines, set larger. The part a viewer actually reads.
    const headline = [];
    // A crushed, wrapped crawl of fine print. The part a viewer only feels.
    const fine = [];

    if (styleKey === 'sparse') {
        // 1950s-60s: the stars ARE the billing. Everything else is small.
        if (studio) headline.push({ text: `${studio} PRESENTS`, weight: 0.62 });
        if (cast.length) headline.push({ text: cast.join(style.separator), weight: 1 });
        if (director) headline.push({ text: `DIRECTED BY ${director}`, weight: 0.62 });
        if (and(crew.screenplay)) fine.push(`SCREENPLAY BY ${and(crew.screenplay)}`);
        if (and(crew.producers)) fine.push(`PRODUCED BY ${and(crew.producers)}`);
        if (crew.composer) fine.push(`MUSIC BY ${up(crew.composer)}`);
    } else if (styleKey === 'classic') {
        // 1970s-90s: studio and cast up top, a modest crew block beneath.
        if (studio) headline.push({ text: `${studio} PRESENTS`, weight: 0.6 });
        if (crew.production_company) headline.push({ text: up(crew.production_company), weight: 0.52 });
        if (cast.length) headline.push({ text: cast.join(style.separator), weight: 1 });
        if (crew.casting_director) fine.push(`CASTING BY ${up(crew.casting_director)}`);
        if (crew.composer) fine.push(`MUSIC BY ${up(crew.composer)}`);
        if (crew.costume_designer) fine.push(`COSTUME DESIGNER ${up(crew.costume_designer)}`);
        if (crew.editor) fine.push(`EDITED BY ${up(crew.editor)}`);
        if (crew.production_designer) fine.push(`PRODUCTION DESIGNER ${up(crew.production_designer)}`);
        if (crew.cinematographer) fine.push(`DIRECTOR OF PHOTOGRAPHY ${up(crew.cinematographer)}`);
        if (and(crew.producers)) fine.push(`PRODUCED BY ${and(crew.producers)}`);
        if (and(crew.screenplay)) fine.push(`WRITTEN BY ${and(crew.screenplay)}`);
        if (director) fine.push(`DIRECTED BY ${director}`);
    } else {
        // 2000s on: the full crushed block. Cast large, everything else tiny.
        if (cast.length) headline.push({ text: cast.join(style.separator), weight: 1 });
        const lead = [
            studio && `${studio} PRESENTS`,
            crew.production_company && up(crew.production_company),
            director && `A ${director} FILM`
        ].filter(Boolean).join('   ');
        if (lead) fine.push(lead);
        if (crew.casting_director) fine.push(`CASTING BY ${up(crew.casting_director)}`);
        if (crew.costume_designer) fine.push(`COSTUME DESIGNER ${up(crew.costume_designer)}`);
        if (crew.composer) fine.push(`MUSIC BY ${up(crew.composer)}`);
        if (crew.editor) fine.push(`EDITED BY ${up(crew.editor)}`);
        if (crew.production_designer) fine.push(`PRODUCTION DESIGNER ${up(crew.production_designer)}`);
        if (crew.cinematographer) fine.push(`DIRECTOR OF PHOTOGRAPHY ${up(crew.cinematographer)}`);
        if (and(crew.executive_producers)) fine.push(`EXECUTIVE PRODUCERS ${and(crew.executive_producers)}`);
        if (and(crew.producers)) fine.push(`PRODUCED BY ${and(crew.producers)}`);
        if (and(crew.screenplay)) fine.push(`SCREENPLAY BY ${and(crew.screenplay)}`);
        if (director) fine.push(`DIRECTED BY ${director}`);
    }

    const year = String(concept.decade || '').slice(0, 3);
    const tail = styleKey === 'sparse'
        ? ''
        : `© ${year}0 ${studio}. ALL RIGHTS RESERVED.`;

    return {
        style: styleKey,
        headline,
        // Real blocks separate entries with wide gaps, not punctuation.
        fineprint: fine.join('     '),
        tail,
        scale: style.scale,
        tracking: style.tracking
    };
}
