// Deterministic guard on the title and tagline.
//
// Prose instructions have not held: the model keeps returning to one shape —
// "The Listening Room", "The Standing Water", "The Quiet Below" — and its
// portentous two-sentence tagline cousin. So we stop asking nicely and check.
//
// A rejection is fed back verbatim and the concept is regenerated once. That is
// far more reliable than another paragraph of instructions.

// THE + [participle] + [noun]: "The Standing Water", "The Listening Room".
const PARTICIPLE_SHAPE = /^the\s+\w+(ing|ed|en)\s+\w+$/i;

// THE + [mood adjective] + [noun]: "The Quiet Below", "The Hollow Season".
const MOOD_ADJECTIVES = [
    'quiet', 'still', 'silent', 'hollow', 'empty', 'patient', 'deep', 'dark',
    'slow', 'cold', 'pale', 'long', 'last', 'other', 'far', 'lost', 'distant',
    'endless', 'unquiet', 'nameless', 'forgotten', 'hidden', 'sunken', 'buried'
];
const MOOD_SHAPE = new RegExp(`^the\\s+(${MOOD_ADJECTIVES.join('|')})\\s+\\w+$`, 'i');

export function checkTitle(title) {
    const t = String(title || '').trim();
    if (PARTICIPLE_SHAPE.test(t) || MOOD_SHAPE.test(t)) {
        return `The title "${t}" is the exact banned shape: THE + [participle or mood adjective] + [noun]. It is atmospheric and inert. Name the threat or the sensation instead.`;
    }
    return null;
}

export function checkTagline(tagline, tone) {
    const t = String(tagline || '').trim();

    if (/[—–;]/.test(t)) {
        return `The tagline "${t}" uses an em-dash or semicolon. Copywriters do not. Say it plainly.`;
    }

    // The two-sentence rule catches the mood-piece failure ("It rose in the
    // night. It has been rising ever since.") — two drifting sentences with no
    // hook.
    //
    // But a comic tagline is setup-then-punchline BY CONSTRUCTION: "They came for
    // our women. They stayed for our snacks." is two sentences with no imperative
    // and no second person, and it is exactly right. This check would veto every
    // good funny tagline, so it does not run on that tone. The em-dash rule still
    // does — a joke does not need one either.
    if (tone === 'funny') return null;

    const sentences = t.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    const imperativeOrDirect = /\b(you|your|don'?t|never|do not|no one|nobody|they'?re|it'?s coming|be |run|stay|look|listen|pray|beware)\b/i.test(t);
    if (sentences.length >= 2 && !imperativeOrDirect) {
        return `The tagline "${t}" is two sentences of drifting mood with no hook. It describes; it does not sell. Write one that threatens, dares, or warns the person reading it.`;
    }

    return null;
}

/** Returns an array of complaints, empty if the copy is acceptable. */
export function checkCopy(concept, tone) {
    return [checkTitle(concept?.title), checkTagline(concept?.tagline, tone)].filter(Boolean);
}
