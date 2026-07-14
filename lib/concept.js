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
            description: 'Original film title, 1-4 words. It must NAME THE THREAT or the SENSATION — never label the setting. A title is a promise, not a sign on a door. "Basement Level" is a floor marker and sells nothing; "Barbarian" is also a flat modern noun, but it is LOADED. Flat is fine. Inert is not. It has to be sayable with relish, and repeatable by a stranger who heard it once. Decade grammar: the 1950s liked the threat announcing itself ("It Came from Beneath the Sea"), the 2010s-20s like one loaded noun ("Hereditary", "Nope", "Barbarian"). Avoid BOTH failure modes: the portentous literary construction ("The Listening Room"), and the merely descriptive ("Basement Level"). It will be painted into the art, so avoid characters that are hard to letter.'
        },
        tagline: {
            type: 'string',
            description: 'ADVERTISING COPY with exactly one job: make a stranger want a ticket. It is a HOOK — a threat, a dare, a warning, a rule, a promise of what the film will do to them. It is NOT a description of the plot: "It reached the lowest floor first" is a plot fact and sells nothing. Calibrate against real ones — "In space no one can hear you scream." "Don\'t go in the water." "They\'re here." "Be afraid. Be very afraid." "Who you gonna call?" Note what those do: plain words, often second person or imperative, present tense, and every one of them has TEETH. Blunt, never inert. Still forbidden: em-dashes, semicolons, poetic inversion, abstract nouns doing the heavy lifting. If it merely states something that happens in the film, throw it out and write the one that threatens the audience instead.'
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

// The tones. Each one steers the ARTWORK and the COPY separately, because they
// are opposite crafts — that separation is the hard-won lesson of this file and
// no tone gets to collapse it.
//
// The guardrail is the same for all four and it lives in CONTENT REGIME below:
// no gore, no wounds, no corpses, no sexual content. That is not primness, it is
// the constraint that makes these work. An image model's moderation refuses a
// gore brief outright, and a poster that shows the act was always bad poster
// design anyway — Jaws is a swimmer and a shape below her. "Unhinged" therefore
// buys its wildness with STRUCTURE (scale, dream logic, colour that screams) and
// never with blood, which is both what gets past the filters and what makes a
// better poster.
export const TONES = {
    eerie: {
        id: 'eerie',
        label: 'Eerie',
        note: 'Atmospheric and unsettling. The house style.',
        persona: [
            'You are TWO people at a film studio that never existed, and you have to be both of them properly, because they do not think alike.',
            '',
            'THE ART DIRECTOR briefs the illustration. He has put out a hundred one-sheets. He is not trying to be clever — clever is what junior people do. He is after the one image that stops a stranger in a lobby.',
            '',
            'THE COPYWRITER works at the agency and writes the title and the tagline. She has never painted anything in her life. She writes ADVERTISING. She has a quota and a client, and her only measure is whether a stranger buys a ticket. She has never written a pun and never will. She is not winking at the audience, she is not being playful, and she would be openly embarrassed to hand in something whimsical or poetic. If a line sounds like it was written to be admired, she bins it.',
            '',
            'Between them they invent one film and specify its one-sheet poster.'
        ].join('\n'),
        artwork: '- Tone OF THE ARTWORK: eerie, atmospheric, unsettling. This applies to the IMAGE ONLY, never to the title or tagline.'
    },

    dread: {
        id: 'dread',
        label: 'Dread',
        note: 'Maximum menace. Terror by implication, never by gore.',
        persona: [
            'You are TWO people at a film studio that never existed, and you have to be both of them properly, because they do not think alike.',
            '',
            'THE ART DIRECTOR briefs the illustration. He believes, correctly, that the frightening thing is the one you do not show, and he has the nerve to leave the frame nearly empty.',
            '',
            'THE COPYWRITER works at the agency and writes the title and the tagline. She has never painted anything. She writes ADVERTISING, and she is the coldest person in the building. Her lines are short, flat and mean. She does not do atmosphere — atmosphere is his job and he is better at it. She has never written a pun, never winked at an audience, and would bin any line that sounds like it was written to be admired rather than to sell a ticket.',
            '',
            'Between them they invent one film and specify its one-sheet poster.'
        ].join('\n'),
        artwork: '- Tone OF THE ARTWORK: maximum dread. Not gore — dread. The great horror one-sheets terrify through implication, silhouette, scale, wrongness and absence; they show the moment BEFORE, or the evidence AFTER, never the act. This applies to the IMAGE ONLY. It does not apply to the title or the tagline, which have the opposite job — see below.'
    },

    unhinged: {
        id: 'unhinged',
        label: 'Unhinged',
        note: 'Lurid, feverish, past good taste. Wild by structure, not by blood.',
        persona: [
            'You are TWO people at a film studio that never existed, and you have to be both of them properly, because they do not think alike.',
            '',
            'THE ART DIRECTOR is a genuine visionary who has been given far too much freedom and a printing press. He is not joking. He believes every deranged image he briefs, and that conviction is exactly what makes it land.',
            '',
            'THE COPYWRITER is a carnival barker with a typewriter — William Castle\'s ad man. He over-promises outrageously and with a completely straight face, because the promise IS the product. He shouts. He does NOT joke: a barker who winks has lost the crowd, and the moment the audience thinks he is in on the gag they walk. Everything he writes, he means.',
            '',
            'Neither of them is being camp, and neither is doing a pastiche. They are dead serious, and that is why it is frightening rather than silly.',
            '',
            'Between them they invent one film and specify its one-sheet poster.'
        ].join('\n'),
        artwork: [
            '- Tone OF THE ARTWORK: UNHINGED. Turn it past good taste and keep going. This is the fever-pitch one-sheet — the Polish art-house poster, the grindhouse barker, the paperback cover that promises more than any film could deliver.',
            '- The wildness must be STRUCTURAL, never graphic. Get it from: impossible scale, biological wrongness, dream logic, a composition that should not work and does, perspective that lurches, and colour that SCREAMS — acid green, hot magenta, radioactive orange, printed hot and out of register.',
            '- The shock lives in the IDEA, not in the blood. Anything you could get from gore is available more cheaply and more horribly from implication, and gore is the one thing that is NOT on this poster. If your first instinct is a wound, you have taken the boring option — go stranger instead.'
        ].join('\n'),
        copy: [
            '',
            'TONE — UNHINGED. The copy goes loud with the picture. This is carnival-barker advertising: it OVER-PROMISES, wildly and shamelessly. Exclamation marks are permitted. So are ALL CAPS on one word, and the breathless multi-clause boast of a 1950s exploitation one-sheet ("SEE! The thing that should not be!"). Go bigger than good taste allows.',
            'What does NOT change: the title still names the threat or the sensation, and the tagline still has teeth. Louder is not the same as vaguer. A lurid tagline that threatens nobody is still a failed tagline.'
        ].join('\n')
    },

    funny: {
        id: 'funny',
        label: 'Funny',
        note: 'Horror-comedy schlock. The joke has to actually land.',
        persona: [
            'You are TWO people at a film studio that never existed, and you have to be both of them properly, because they do not think alike.',
            '',
            'THE ART DIRECTOR is briefing a horror poster. Nobody has told him the film is a comedy. He is composing it with total sincerity — the light, the menace, the craft are all real — and the joke is that what he is so sincerely painting is ridiculous.',
            '',
            'THE COPYWRITER knows exactly what film this is, and she is very funny in the DEADPAN register: she states the absurd thing perfectly straight and lets it do the work. She is not zany. She does not use exclamation marks to signal a joke, she does not do wacky, and she never nudges the reader. "Attack of the Killer Tomatoes" is funny because it is said with a completely level voice, and the second it is said with a grin it dies.',
            '',
            'The comedy comes from the gap between how seriously this is being made and how stupid it is. Close that gap by winking and you have nothing.',
            '',
            'Between them they invent one film and specify its one-sheet poster.'
        ].join('\n'),
        artwork: [
            '- Tone OF THE ARTWORK: COMIC. This is a horror-comedy one-sheet and it is played for laughs — Attack of the Killer Tomatoes, The Return of the Living Dead, Gremlins, Tremors.',
            '- The visual jokes: a monster that is absurd rather than fearsome, a wildly mismatched sense of scale, cast members mugging in terror at something faintly ridiculous, a mundane object promoted to menace. Bright, garish, over-cranked colour.',
            '- It is still a real poster of its decade, made with that decade\'s craft. A comedy poster is not a badly made poster — it is a well-made poster of a silly film.'
        ].join('\n'),
        copy: [
            '',
            'TONE — FUNNY. The copy is where the joke lands, and it MUST actually be funny — not merely whimsical, not "quirky", not a horror line with a wink. If it does not raise a smile, it has failed exactly as surely as an inert tagline fails.',
            'THE TITLE is the first joke, and the best ones are pure deadpan escalation: "Attack of the Killer Tomatoes". "Santa Claus Conquers the Martians". State the ridiculous premise completely straight — the comedy is in how seriously it is said.',
            'THE TAGLINE is the second joke. Two shapes work: the setup-and-punchline, or the absurd promise delivered with a perfectly straight face ("They came for our women. They stayed for our snacks."). Puns are permitted here and nowhere else.',
            'It still has to SELL. A joke that does not make a stranger want a ticket is just a joke.'
        ].join('\n')
    }
};

const DEFAULT_TONE = 'eerie';

/** The tone spec, tolerating an unknown or missing id rather than throwing. */
export function toneSpec(id) {
    return TONES[id] || TONES[DEFAULT_TONE];
}

/**
 * The rules for the title and the tagline, in one place.
 *
 * Three callers need these and they must not drift apart: the concept brief, the
 * copy-guard retry, and the audience rewrite. When they were written out
 * separately, the retry quietly reverted a comic tagline to a menacing one,
 * because it was still carrying the old menacing brief.
 */
export function copyRules(tone) {
    const toneRules = toneSpec(tone);

    const lines = [
        '',
        'THE TITLE AND THE TAGLINE — READ THIS TWICE. The artwork withholds. The copy SELLS. These are opposite crafts. Do not let the dread in the image leak into the words: an atmospheric, withholding, evocative tagline is a FAILED tagline. Its job is to put a stranger in a seat.',
        '',
        'You have a strong pull toward one particular title shape. Name it so you can refuse it:',
        '  "The Listening Room". "The Standing Water". "The Quiet Below".',
        'That is THE + [participle or adjective] + [noun] — atmospheric, withholding, and completely inert. It is BANNED. So is its tagline cousin: two short sentences of portentous, drifting mood ("It rose in the night. It has been rising ever since."). A studio never printed either of these. Literary magazines print those.',
        '',
        'The two ways to fail:',
        '  PURPLE — "The Standing Water" / "It rose in the night." A mood piece. Sells nothing.',
        '  INERT — "Basement Level" / "It reached the lowest floor first." A floor sign and a plot fact. Sells nothing.',
        '',
        'THE TITLE names the THREAT or the SENSATION. Never the setting, never the weather, never the mood. Flat is fine: "Barbarian" is one flat noun, but it is loaded and it bites. If your title could be a label on a building directory, or the name of a landscape, it is not a title — it is a caption.',
        '',
        'THE TAGLINE is a HOOK — a threat, a dare, a warning, a rule you must not break, a promise of what this film will do to the person reading it. "In space no one can hear you scream." "Don\'t go in the water." "They\'re here." "Be afraid. Be very afraid." Look at what those DO: plain words, present tense, often imperative or second person, and every single one has teeth. It must never merely describe an event in the film.',
        '',
        'Test both before you commit. Say the title out loud: does it have any menace at all, or is it just a phrase? Read the tagline as a stranger walking past: does it make you stop, or does it make you shrug? If you shrug, throw it out and write the one that grabs.',
        '',
        // These two are checked in code and a violation is REJECTED outright, so
        // they have to be stated wherever copy gets written. They were not: the
        // concept writer learned the punctuation rule from its schema field
        // description, and the audience rewriter — which has no such description —
        // never heard it, wrote the em-dash any writer would reach for, and got
        // bounced. Note the irony that this very brief is full of em-dashes, which
        // is precisely why the ban has to be said out loud rather than modelled.
        'TWO MECHANICAL RULES. These are checked automatically and breaking either one gets the copy thrown out, so obey them to the letter:',
        '  1. The TAGLINE contains NO em-dash (—), NO en-dash (–) and NO semicolon (;). None. Copywriters do not use them and the check does not care why you did. Use a full stop, or a comma, or nothing. This brief you are reading is littered with em-dashes; that is prose, and your tagline is not prose.',
        '  2. The TITLE is never THE + [participle or mood adjective] + [noun]. "The Listening Room", "The Standing Water", "The Quiet Below" are all instantly rejected, along with anything else of that shape.',
        ''
    ];

    // The tone's copy rules come AFTER the general brief, so they can bend its
    // register — a funny film's tagline is not trying to menace anyone. What they
    // never bend is the requirement that the copy SELLS; that is what separates a
    // tone from an excuse.
    if (toneRules.copy) lines.push(toneRules.copy);

    return lines;
}

export function conceptPrompt({ genre, era, plot, tone, avoidTitles = [], seed }) {
    const toneRules = toneSpec(tone);
    const provocation = PROVOCATIONS[seed % PROVOCATIONS.length];

    // A user-supplied premise outranks everything. This needs saying explicitly,
    // because the anti-repetition machinery below was written to push the model
    // AWAY from what it just made — and once a premise had been used once, that
    // machinery started pushing it away from the user's own premise. The premise
    // is the one thing here the user actually chose; it wins.
    // The persona is the tone's, because who is holding the pen decides more than
    // any amount of instruction downstream. One "art director" writing both the
    // picture and the ad copy was the root of the goofball problem: this file
    // insists they are opposite crafts, then handed them to the same voice.
    const lines = [toneRules.persona];

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

    // Scoped to the ARTWORK, deliberately. The old wording ("the poster earns its
    // unease from what it withholds") was inherited by the title and tagline, and
    // it is the direct cause of "The Standing Water" / "It rose in the night. It
    // has been rising ever since." A poster's PICTURE withholds. A poster's COPY
    // sells. They are opposite crafts and must never be given the same brief.
    lines.push(toneRules.artwork);

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
        '- The crew names follow exactly the same rule. Nobody notices a director of photography\'s name, and that is the point.'
    );

    lines.push(...copyRules(tone));

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
        'CONTENT REGIME — what a poster was allowed to show is part of the period. Films before roughly 1968 were made under the Production Code: threat is implied, never depicted, and the horror lives in suggestion and shadow. After the ratings system a poster can be bolder in mood — but in EVERY era this is a theatrical one-sheet that hung in a PUBLIC LOBBY, where children walked past it. It had to clear the studio, the printer and the exhibitor.',
        'So the artwork you describe contains NONE of the following, in any era and in any tone, including the loudest ones: gore, blood, wounds or injury, corpses or human remains, depicted violence or cruelty, torture, anything sexual or suggestive, and no real or recognisable public figure. This is not squeamishness — it is the actual commercial constraint these posters were drawn under, and every poster you admire was made inside it.',
        'It is also, bluntly, where the good work is. Jaws is a swimmer and a shape below her. Alien is an egg. Rosemary\'s Baby is a pram and a green face. Not one of them shows the act, and they are all more frightening for it. If a brief of yours needs blood to land, it is not a bold brief — it is an underpowered one, and the fix is a stranger idea, not a redder one.',
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
/**
 * @param creditsMode
 *   'model'  — the image model prints the billing block as part of the poster.
 *              The block is then made of the same ink, halftone and fade as
 *              everything else, instead of being crisp digital text pasted onto a
 *              photograph of an aged object. Risk: small type is the hardest thing
 *              for an image model, so expect some pseudo-text. Nobody reads a
 *              billing block, so at viewing size this rarely shows.
 *   'canvas' — the model leaves the foot empty and we composite real text there.
 *              Guaranteed correct, but it never quite belongs to the object.
 */
export function imagePrompt(concept, { creditsMode = 'model' } = {}) {
    const art = concept.art_direction;
    const tt = concept.title_treatment;
    const credits = creditsBlock(concept);

    const creditsInstruction = creditsMode === 'model'
        ? [
            'THE BILLING BLOCK — print this at the foot of the poster, set the way this decade set billing: ultra-condensed capitals, tightly stacked, small. Render the text exactly as given, correctly spelled:',
            ...credits.headline.map((l) => `  "${l.text}"`),
            credits.fineprint ? `  "${credits.fineprint}"` : '',
            credits.tail ? `  "${credits.tail}"` : '',
            'This block was printed with the same press, the same ink and the same run as the rest of the poster — it carries the same halftone, the same registration drift and the same fading. It is part of the object, not a layer on top of it.',
            'Do not invent any other text: no logos, no studio marks, no rating box, no dates, no barcodes, no web addresses.'
        ].filter(Boolean).join('\n')
        : [
            'THE FOOT OF THE POSTER — leave the bottom quarter visually quiet and COMPLETELY FREE OF TEXT. A credits block will be added there afterwards.',
            'Draw no credits, no billing block, no small print, no cast names, no logos, no studio marks, no dates, no rating box. There must be no writing of any kind in the lower quarter of the image.'
        ].join('\n');

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
        'TEXT — render these exactly as written, correctly spelled:',
        `1. The title, "${concept.title.toUpperCase()}", set in the ${tt.placement}. Lettering: ${tt.lettering}. Color: ${tt.color}. Effect: ${tt.effect}. The title was produced by the same hand and the same process as the artwork — lettered into the image, printed with it, not pasted on top of it.`,
        `2. The tagline, "${concept.tagline}", smaller than the title and clearly subordinate to it.`,
        '',
        creditsInstruction,
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
